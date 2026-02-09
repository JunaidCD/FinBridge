// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FinBridge Rewards Token
 * @dev Custom ERC20 token for rewards system
 */
contract FinBridgeRewardsToken {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor(string memory _name, string memory _symbol, uint8 _decimals) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        totalSupply = 0;
    }
    
    function mint(address to, uint256 amount) external {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }
    
    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;
        
        emit Transfer(from, to, amount);
        return true;
    }
}

/**
 * @title FinBridge Token Rewards
 * @dev Reward token system for loyal borrowers and lenders
 */
contract FinBridgeRewards is ReentrancyGuard {
    
    FinBridgeRewardsToken public rewardsToken;
    
    struct RewardTier {
        uint256 minLoans;
        uint256 minLent;
        uint256 rewardRate;
        string tierName;
    }
    
    mapping(address => uint256) public userLoanCount;
    mapping(address => uint256) public userLentAmount;
    mapping(address => uint256) public userRewards;
    mapping(uint256 => RewardTier) public rewardTiers;
    
    uint256 public constant TIER_BRONZE = 0;
    uint256 public constant TIER_SILVER = 1;
    uint256 public constant TIER_GOLD = 2;
    uint256 public constant TIER_PLATINUM = 3;
    
    event RewardEarned(address indexed user, uint256 amount, uint256 tier);
    event RewardClaimed(address indexed user, uint256 amount);
    
    constructor() {
        rewardsToken = new FinBridgeRewardsToken("FinBridge Rewards", "FBR", 18);
        
        // Initialize reward tiers
        rewardTiers[TIER_BRONZE] = RewardTier(1, 0.1 ether, 100, "Bronze");
        rewardTiers[TIER_SILVER] = RewardTier(5, 1 ether, 200, "Silver");
        rewardTiers[TIER_GOLD] = RewardTier(10, 5 ether, 500, "Gold");
        rewardTiers[TIER_PLATINUM] = RewardTier(25, 10 ether, 1000, "Platinum");
    }
    
    function incrementLoanCount(address borrower) external {
        userLoanCount[borrower]++;
        _calculateAndAwardRewards(borrower);
    }
    
    function incrementLentAmount(address lender, uint256 amount) external {
        userLentAmount[lender] += amount;
        _calculateAndAwardRewards(lender);
    }
    
    function _calculateAndAwardRewards(address user) internal {
        uint256 loans = userLoanCount[user];
        uint256 lent = userLentAmount[user];
        
        uint256 tier = _getUserTier(loans, lent);
        uint256 rewardAmount = (rewardTiers[tier].rewardRate * (loans + lent)) / 1000;
        
        if (rewardAmount > userRewards[user]) {
            uint256 newReward = rewardAmount - userRewards[user];
            userRewards[user] = rewardAmount;
            
            // Mint new reward tokens
            rewardsToken.mint(user, newReward);
            
            emit RewardEarned(user, newReward, tier);
        }
    }
    
    function _getUserTier(uint256 loans, uint256 lent) internal pure returns (uint256) {
        if (loans >= 25 && lent >= 10 ether) {
            return TIER_PLATINUM;
        } else if (loans >= 10 && lent >= 5 ether) {
            return TIER_GOLD;
        } else if (loans >= 5 && lent >= 1 ether) {
            return TIER_SILVER;
        } else {
            return TIER_BRONZE;
        }
    }
    
    function claimRewards() external nonReentrant {
        uint256 availableRewards = userRewards[msg.sender];
        require(availableRewards > 0, "No rewards available to claim");
        
        userRewards[msg.sender] = 0;
        rewardsToken.transfer(msg.sender, availableRewards);
        
        emit RewardClaimed(msg.sender, availableRewards);
    }
    
    function getUserTier(address user) external view returns (uint256, string memory) {
        uint256 tier = _getUserTier(userLoanCount[user], userLentAmount[user]);
        return (tier, rewardTiers[tier].tierName);
    }
    
    function getUserRewards(address user) external view returns (uint256) {
        return userRewards[user];
    }
}
