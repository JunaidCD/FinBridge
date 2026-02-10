// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FinBridge Multi-Sig Wallet
 * @dev Multi-signature wallet for enhanced security
 */
contract FinBridgeMultiSig is ReentrancyGuard, Ownable {
    
    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 numConfirmations;
        uint256 createdAt;
    }
    
    mapping(uint256 => Transaction) public transactions;
    mapping(uint256 => mapping(address => bool)) public confirmations;
    mapping(address => bool) public isOwner;
    address[] public owners;
    uint256 public requiredConfirmations;
    uint256 public transactionCount;
    
    event TransactionSubmitted(uint256 indexed transactionId, address indexed owner, address to, uint256 value);
    event TransactionConfirmed(uint256 indexed transactionId, address indexed owner);
    event TransactionExecuted(uint256 indexed transactionId, address indexed owner);
    
    modifier onlyOwners() {
        bool isOwnerFound = false;
        for (uint256 i = 0; i < owners.length; i++) {
            if (owners[i] == msg.sender) {
                isOwnerFound = true;
                break;
            }
        }
        require(isOwnerFound, "Not an owner");
        _;
    }
    
    modifier confirmated(uint256 transactionId) {
        require(confirmations[transactionId][msg.sender], "Transaction not confirmed");
        _;
    }
    
    modifier notExecuted(uint256 transactionId) {
        require(!transactions[transactionId].executed, "Transaction already executed");
        _;
    }
    
    constructor(address[] memory _owners, uint256 _required) {
        require(_owners.length >= 2, "Minimum 2 owners required");
        require(_required > 0 && _required <= _owners.length, "Invalid required confirmations");
        
        owners = _owners;
        requiredConfirmations = _required;
        
        for (uint256 i = 0; i < _owners.length; i++) {
            isOwner[owners[i]] = true;
        }
    }
    
    function submitTransaction(address to, uint256 value, bytes memory data) external onlyOwners {
        uint256 transactionId = transactionCount++;
        
        transactions[transactionId] = Transaction({
            to: to,
            value: value,
            data: data,
            executed: false,
            numConfirmations: 0,
            createdAt: block.timestamp
        });
        
        emit TransactionSubmitted(transactionId, msg.sender, to, value);
    }
    
    function confirmTransaction(uint256 transactionId) external onlyOwners notExecuted(transactionId) {
        Transaction storage transaction = transactions[transactionId];
        
        require(!confirmations[transactionId][msg.sender], "Transaction already confirmed");
        
        confirmations[transactionId][msg.sender] = true;
        transaction.numConfirmations++;
        
        emit TransactionConfirmed(transactionId, msg.sender);
        
        if (transaction.numConfirmations >= requiredConfirmations) {
            _executeTransaction(transactionId);
        }
    }
    
    function _executeTransaction(uint256 transactionId) internal {
        Transaction storage transaction = transactions[transactionId];
        
        transaction.executed = true;
        
        (bool success, ) = transaction.to.call{value: transaction.value}(transaction.data);
        require(success, "Transaction execution failed");
        
        emit TransactionExecuted(transactionId, msg.sender);
    }
    
    function getTransaction(uint256 transactionId) external view returns (Transaction memory) {
        return transactions[transactionId];
    }
    
    function getConfirmationCount(uint256 transactionId) external view returns (uint256) {
        return transactions[transactionId].numConfirmations;
    }
    
    function isConfirmed(uint256 transactionId, address owner) external view returns (bool) {
        return confirmations[transactionId][owner];
    }
    
    function addOwner(address newOwner) external onlyOwners {
        require(!isOwner[newOwner], "Already an owner");
        
        owners.push(newOwner);
        isOwner[newOwner] = true;
    }
    
    function removeOwner(address ownerToRemove) external onlyOwners {
        require(isOwner[ownerToRemove], "Not an owner");
        require(owners.length > 1, "Cannot remove last owner");
        
        isOwner[ownerToRemove] = false;
        
        // Remove from owners array
        for (uint256 i = 0; i < owners.length; i++) {
            if (owners[i] == ownerToRemove) {
                owners[i] = owners[owners.length - 1];
                break;
            }
        }
        owners.pop();
    }
    
    function changeRequirement(uint256 newRequired) external onlyOwners {
        require(newRequired > 0 && newRequired <= owners.length, "Invalid required confirmations");
        requiredConfirmations = newRequired;
    }
}
