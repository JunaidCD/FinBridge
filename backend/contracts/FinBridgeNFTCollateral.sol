// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

/**
 * @title FinBridgeNFTCollateral
 * @dev NFT collateral management for DeFi lending
 * @notice Allows borrowers to use NFTs as collateral for loans
 */
contract FinBridgeNFTCollateral is ReentrancyGuard, Ownable, Pausable {
    
    // Supported NFT standards
    enum NFTStandard { ERC721, ERC1155 }
    
    // Collateral information
    struct Collateral {
        address nftContract;
        uint256 tokenId;
        address owner;
        NFTStandard standard;
        uint256 value; // Estimated value in ETH
        bool isLocked;
        uint256 lockedAt;
        uint256 loanId; // Associated loan ID if used as collateral
    }
    
    // NFT Collection information
    struct NFTCollection {
        bool isSupported;
        uint256 minValue; // Minimum value to be accepted
        uint256 maxLTV; // Maximum loan-to-value ratio (basis points)
        uint256 riskRating; // 1-10 risk rating
        address oracle; // Price oracle address
    }
    
    // Mappings
    mapping(bytes32 => Collateral) public collaterals;
    mapping(address => NFTCollection) public supportedCollections;
    mapping(address => bytes32[]) public userCollaterals;
    mapping(address => bool) public authorizedOracles;
    
    // Arrays for iteration
    bytes32[] public allCollateralIds;
    address[] public supportedCollectionList;
    
    // Protocol parameters
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public defaultLTV = 5000; // 50% default LTV
    uint256 public liquidationThreshold = 7500; // 75% - when collateral can be liquidated
    uint256 public platformFee = 250; // 2.5% platform fee
    address public feeCollector;
    
    // Events
    event CollateralDeposited(
        bytes32 indexed collateralId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address owner,
        NFTStandard standard,
        uint256 value
    );
    event CollateralWithdrawn(bytes32 indexed collateralId, address indexed owner);
    event CollateralLocked(bytes32 indexed collateralId, uint256 indexed loanId, uint256 loanAmount);
    event CollateralUnlocked(bytes32 indexed collateralId);
    event CollateralLiquidated(bytes32 indexed collateralId, address indexed liquidator, uint256 amount);
    event CollectionAdded(address indexed collection, uint256 minValue, uint256 maxLTV);
    event CollectionUpdated(address indexed collection, uint256 minValue, uint256 maxLTV);
    event CollectionRemoved(address indexed collection);
    event OracleAdded(address indexed oracle);
    event OracleRemoved(address indexed oracle);
    event ValueUpdated(bytes32 indexed collateralId, uint256 oldValue, uint256 newValue);
    
    // Modifiers
    modifier onlyOracle() {
        require(authorizedOracles[msg.sender], "Not authorized oracle");
        _;
    }
    
    modifier validCollateral(bytes32 collateralId) {
        require(collaterals[collateralId].nftContract != address(0), "Collateral not found");
        _;
    }
    
    constructor() Ownable() {
        feeCollector = msg.sender;
    }
    
    // ==================== COLLATERAL MANAGEMENT ====================
    
    /**
     * @dev Deposits an ERC721 NFT as collateral
     * @param nftContract Address of the NFT contract
     * @param tokenId Token ID of the NFT
     */
    function depositERC721(address nftContract, uint256 tokenId) external nonReentrant whenNotPaused {
        require(supportedCollections[nftContract].isSupported, "Collection not supported");
        
        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Not token owner");
        require(nft.getApproved(tokenId) == address(this) || nft.isApprovedForAll(msg.sender, address(this)), 
                "Contract not approved");
        
        // Generate collateral ID
        bytes32 collateralId = keccak256(abi.encodePacked(nftContract, tokenId, block.timestamp));
        
        // Transfer NFT to this contract
        nft.safeTransferFrom(msg.sender, address(this), tokenId);
        
        // Get minimum value from collection settings
        uint256 minValue = supportedCollections[nftContract].minValue;
        
        // Create collateral record
        collaterals[collateralId] = Collateral({
            nftContract: nftContract,
            tokenId: tokenId,
            owner: msg.sender,
            standard: NFTStandard.ERC721,
            value: minValue, // Initial value
            isLocked: false,
            lockedAt: 0,
            loanId: 0
        });
        
        userCollaterals[msg.sender].push(collateralId);
        allCollateralIds.push(collateralId);
        
        emit CollateralDeposited(collateralId, nftContract, tokenId, msg.sender, NFTStandard.ERC721, minValue);
    }
    
    /**
     * @dev Deposits ERC1155 tokens as collateral
     * @param nftContract Address of the ERC1155 contract
     * @param tokenId Token ID
     * @param amount Amount of tokens
     */
    function depositERC1155(address nftContract, uint256 tokenId, uint256 amount) external nonReentrant whenNotPaused {
        require(supportedCollections[nftContract].isSupported, "Collection not supported");
        require(amount > 0, "Amount must be greater than 0");
        
        IERC1155 nft = IERC1155(nftContract);
        require(nft.balanceOf(msg.sender, tokenId) >= amount, "Insufficient balance");
        require(nft.isApprovedForAll(msg.sender, address(this)), "Contract not approved");
        
        // Generate collateral ID
        bytes32 collateralId = keccak256(abi.encodePacked(nftContract, tokenId, msg.sender, block.timestamp));
        
        // Transfer tokens to this contract
        nft.safeTransferFrom(msg.sender, address(this), tokenId, amount, "");
        
        // Calculate value (simplified - in production would use oracle)
        uint256 unitValue = supportedCollections[nftContract].minValue;
        uint256 totalValue = unitValue * amount;
        
        // Create collateral record
        collaterals[collateralId] = Collateral({
            nftContract: nftContract,
            tokenId: tokenId,
            owner: msg.sender,
            standard: NFTStandard.ERC1155,
            value: totalValue,
            isLocked: false,
            lockedAt: 0,
            loanId: 0
        });
        
        userCollaterals[msg.sender].push(collateralId);
        allCollateralIds.push(collateralId);
        
        emit CollateralDeposited(collateralId, nftContract, tokenId, msg.sender, NFTStandard.ERC1155, totalValue);
    }
    
    /**
     * @dev Withdraws collateral if not locked
     * @param collateralId ID of the collateral to withdraw
     */
    function withdrawCollateral(bytes32 collateralId) external nonReentrant validCollateral(collateralId) {
        Collateral storage collateral = collaterals[collateralId];
        
        require(collateral.owner == msg.sender, "Not collateral owner");
        require(!collateral.isLocked, "Collateral is locked");
        
        // Transfer NFT back to owner
        if (collateral.standard == NFTStandard.ERC721) {
            IERC721(collateral.nftContract).safeTransferFrom(address(this), msg.sender, collateral.tokenId);
        } else {
            // For ERC1155, we'd need to track amount - simplified here
            IERC1155(collateral.nftContract).safeTransferFrom(address(this), msg.sender, collateral.tokenId, 1, "");
        }
        
        // Remove from user's collateral list
        _removeUserCollateral(msg.sender, collateralId);
        
        // Delete collateral record
        delete collaterals[collateralId];
        
        emit CollateralWithdrawn(collateralId, msg.sender);
    }
    
    /**
     * @dev Locks collateral for a loan (called by lending contract)
     * @param collateralId ID of the collateral
     * @param loanId ID of the loan
     */
    function lockCollateral(bytes32 collateralId, uint256 loanId) external onlyOwner validCollateral(collateralId) {
        Collateral storage collateral = collaterals[collateralId];
        require(!collateral.isLocked, "Already locked");
        
        collateral.isLocked = true;
        collateral.lockedAt = block.timestamp;
        collateral.loanId = loanId;
        
        emit CollateralLocked(collateralId, loanId, 0);
    }
    
    /**
     * @dev Unlocks collateral after loan is repaid
     * @param collateralId ID of the collateral
     */
    function unlockCollateral(bytes32 collateralId) external onlyOwner validCollateral(collateralId) {
        Collateral storage collateral = collaterals[collateralId];
        require(collateral.isLocked, "Not locked");
        
        collateral.isLocked = false;
        collateral.lockedAt = 0;
        collateral.loanId = 0;
        
        emit CollateralUnlocked(collateralId);
    }
    
    /**
     * @dev Liquidates collateral when loan defaults
     * @param collateralId ID of the collateral
     */
    function liquidateCollateral(bytes32 collateralId) external nonReentrant validCollateral(collateralId) {
        Collateral storage collateral = collaterals[collateralId];
        require(collateral.isLocked, "Collateral not locked");
        
        // Check if liquidation is allowed (simplified - would check loan status)
        // In production, this would check if loan is in default
        
        // Transfer NFT to liquidator (msg.sender)
        if (collateral.standard == NFTStandard.ERC721) {
            IERC721(collateral.nftContract).safeTransferFrom(address(this), msg.sender, collateral.tokenId);
        } else {
            IERC1155(collateral.nftContract).safeTransferFrom(address(this), msg.sender, collateral.tokenId, 1, "");
        }
        
        emit CollateralLiquidated(collateralId, msg.sender, collateral.value);
        
        // Clean up
        _removeUserCollateral(collateral.owner, collateralId);
        delete collaterals[collateralId];
    }
    
    // ==================== COLLECTION MANAGEMENT ====================
    
    /**
     * @dev Adds a new supported NFT collection
     * @param collection Address of the NFT contract
     * @param minValue Minimum value for acceptance
     * @param maxLTV Maximum loan-to-value ratio
     * @param riskRating Risk rating 1-10
     * @param oracle Price oracle address
     */
    function addCollection(
        address collection,
        uint256 minValue,
        uint256 maxLTV,
        uint256 riskRating,
        address oracle
    ) external onlyOwner {
        require(collection != address(0), "Invalid collection");
        require(!supportedCollections[collection].isSupported, "Already supported");
        require(maxLTV <= BASIS_POINTS, "LTV cannot exceed 100%");
        require(riskRating >= 1 && riskRating <= 10, "Risk rating must be 1-10");
        
        supportedCollections[collection] = NFTCollection({
            isSupported: true,
            minValue: minValue,
            maxLTV: maxLTV,
            riskRating: riskRating,
            oracle: oracle
        });
        
        supportedCollectionList.push(collection);
        
        emit CollectionAdded(collection, minValue, maxLTV);
    }
    
    /**
     * @dev Updates collection parameters
     */
    function updateCollection(
        address collection,
        uint256 minValue,
        uint256 maxLTV
    ) external onlyOwner {
        require(supportedCollections[collection].isSupported, "Collection not supported");
        require(maxLTV <= BASIS_POINTS, "LTV cannot exceed 100%");
        
        NFTCollection storage coll = supportedCollections[collection];
        coll.minValue = minValue;
        coll.maxLTV = maxLTV;
        
        emit CollectionUpdated(collection, minValue, maxLTV);
    }
    
    /**
     * @dev Removes a collection from supported list
     */
    function removeCollection(address collection) external onlyOwner {
        require(supportedCollections[collection].isSupported, "Collection not supported");
        
        supportedCollections[collection].isSupported = false;
        
        // Remove from list
        for (uint i = 0; i < supportedCollectionList.length; i++) {
            if (supportedCollectionList[i] == collection) {
                supportedCollectionList[i] = supportedCollectionList[supportedCollectionList.length - 1];
                supportedCollectionList.pop();
                break;
            }
        }
        
        emit CollectionRemoved(collection);
    }
    
    // ==================== ORACLE MANAGEMENT ====================
    
    /**
     * @dev Adds an authorized oracle
     */
    function addOracle(address oracle) external onlyOwner {
        require(oracle != address(0), "Invalid oracle");
        require(!authorizedOracles[oracle], "Already oracle");
        authorizedOracles[oracle] = true;
        emit OracleAdded(oracle);
    }
    
    /**
     * @dev Removes an oracle
     */
    function removeOracle(address oracle) external onlyOwner {
        require(authorizedOracles[oracle], "Not an oracle");
        authorizedOracles[oracle] = false;
        emit OracleRemoved(oracle);
    }
    
    /**
     * @dev Updates collateral value (called by oracle)
     */
    function updateCollateralValue(bytes32 collateralId, uint256 newValue) external onlyOracle validCollateral(collateralId) {
        Collateral storage collateral = collaterals[collateralId];
        uint256 oldValue = collateral.value;
        collateral.value = newValue;
        emit ValueUpdated(collateralId, oldValue, newValue);
    }
    
    // ==================== VIEW FUNCTIONS ====================
    
    /**
     * @dev Calculates maximum loan amount for collateral
     */
    function getMaxLoanAmount(bytes32 collateralId) external view validCollateral(collateralId) returns (uint256) {
        Collateral storage collateral = collaterals[collateralId];
        NFTCollection storage collection = supportedCollections[collateral.nftContract];
        
        return (collateral.value * collection.maxLTV) / BASIS_POINTS;
    }
    
    /**
     * @dev Returns all collateral IDs for a user
     */
    function getUserCollateralIds(address user) external view returns (bytes32[] memory) {
        return userCollaterals[user];
    }
    
    /**
     * @dev Returns detailed collateral info
     */
    function getCollateralDetails(bytes32 collateralId) external view validCollateral(collateralId) returns (
        address nftContract,
        uint256 tokenId,
        address owner,
        NFTStandard standard,
        uint256 value,
        bool isLocked,
        uint256 loanId
    ) {
        Collateral storage c = collaterals[collateralId];
        return (c.nftContract, c.tokenId, c.owner, c.standard, c.value, c.isLocked, c.loanId);
    }
    
    /**
     * @dev Returns supported collections
     */
    function getSupportedCollections() external view returns (address[] memory) {
        return supportedCollectionList;
    }
    
    /**
     * @dev Returns total number of collaterals
     */
    function getTotalCollaterals() external view returns (uint256) {
        return allCollateralIds.length;
    }
    
    /**
     * @dev Returns user's collateral count
     */
    function getUserCollateralCount(address user) external view returns (uint256) {
        return userCollaterals[user].length;
    }
    
    // ==================== INTERNAL FUNCTIONS ====================
    
    /**
     * @dev Removes a collateral ID from user's list
     */
    function _removeUserCollateral(address user, bytes32 collateralId) internal {
        bytes32[] storage collaterals_ = userCollaterals[user];
        for (uint i = 0; i < collaterals_.length; i++) {
            if (collaterals_[i] == collateralId) {
                collaterals_[i] = collaterals_[collaterals_.length - 1];
                collaterals_.pop();
                break;
            }
        }
    }
    
    // ==================== ADMIN FUNCTIONS ====================
    
    /**
     * @dev Sets the fee collector address
     */
    function setFeeCollector(address _feeCollector) external onlyOwner {
        require(_feeCollector != address(0), "Invalid address");
        feeCollector = _feeCollector;
    }
    
    /**
     * @dev Updates platform fee
     */
    function setPlatformFee(uint256 _platformFee) external onlyOwner {
        require(_platformFee <= 1000, "Fee cannot exceed 10%");
        platformFee = _platformFee;
    }
    
    /**
     * @dev Emergency pause
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Emergency withdraw stuck NFTs (only owner)
     */
    function emergencyWithdraw(
        address nftContract,
        uint256 tokenId,
        NFTStandard standard
    ) external onlyOwner {
        if (standard == NFTStandard.ERC721) {
            IERC721(nftContract).safeTransferFrom(address(this), owner(), tokenId);
        } else {
            IERC1155(nftContract).safeTransferFrom(address(this), owner(), tokenId, 1, "");
        }
    }
    
    // ==================== RECEIVE FUNCTIONS ====================
    
    /**
     * @dev ERC721 receiver function
     */
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }
    
    /**
     * @dev ERC1155 receiver function
     */
    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return this.onERC1155Received.selector;
    }
    
    /**
     * @dev ERC1155 batch receiver function
     */
    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata,
        uint256[] calldata,
        bytes calldata
    ) external pure returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }
    
    /**
     * @dev IERC165 support
     */
    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == this.onERC721Received.selector ||
               interfaceId == this.onERC1155Received.selector ||
               interfaceId == this.onERC1155BatchReceived.selector;
    }
}
