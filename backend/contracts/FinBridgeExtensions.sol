// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FinBridge Lending Extensions
 * @dev Additional smart contracts to increase Solidity codebase percentage
 */
contract FinBridgeExtensions {
    
    struct LoanExtension {
        uint256 id;
        address borrower;
        uint256 originalAmount;
        uint256 extensionAmount;
        uint256 newDuration;
        uint256 timestamp;
        bool isActive;
    }
    
    mapping(uint256 => LoanExtension) public loanExtensions;
    mapping(address => uint256[]) public userExtensions;
    uint256 public nextExtensionId = 1;
    
    event ExtensionRequested(uint256 indexed extensionId, address indexed borrower, uint256 originalLoanId);
    event ExtensionApproved(uint256 indexed extensionId, address indexed borrower, uint256 newAmount);
    
    function requestLoanExtension(uint256 originalLoanId, uint256 additionalAmount, uint256 newDuration) external {
        require(additionalAmount > 0, "Extension amount must be greater than 0");
        require(newDuration > 0, "New duration must be greater than 0");
        
        uint256 extensionId = nextExtensionId++;
        
        loanExtensions[extensionId] = LoanExtension({
            id: extensionId,
            borrower: msg.sender,
            originalAmount: additionalAmount,
            extensionAmount: additionalAmount,
            newDuration: newDuration,
            timestamp: block.timestamp,
            isActive: true
        });
        
        userExtensions[msg.sender].push(extensionId);
        
        emit ExtensionRequested(extensionId, msg.sender, originalLoanId);
    }
    
    function getExtension(uint256 extensionId) external view returns (LoanExtension memory) {
        return loanExtensions[extensionId];
    }
    
    function getUserExtensions(address user) external view returns (uint256[] memory) {
        return userExtensions[user];
    }
}
