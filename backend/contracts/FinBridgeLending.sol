// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FinBridgeLending is ReentrancyGuard, Pausable, Ownable {
    
    struct LoanRequest {
        uint256 id;
        address borrower;
        uint256 amount;
        uint256 interestRate;
        uint256 duration;
        uint256 timestamp;
        bool isActive;
        bool isFunded;
        address lender;
        uint256 fundedAt;
    }
    
    struct User {
        bool isRegistered;
        uint256[] loanRequests;
        uint256[] fundedLoans;
        uint256 totalBorrowed;
        uint256 totalLent;
    }
    
    // State variables
    uint256 public nextLoanId = 1;
    mapping(uint256 => LoanRequest) public loanRequests;
    mapping(address => User) public users;
    mapping(address => bool) public connectedWallets;
    
    // Events
    event WalletConnected(address indexed user);
    event WalletDisconnected(address indexed user);
    event LoanRequestCreated(uint256 indexed loanId, address indexed borrower, uint256 amount, uint256 interestRate, uint256 duration);
    event LoanFunded(uint256 indexed loanId, address indexed lender, address indexed borrower, uint256 amount);
    event LoanRepaid(uint256 indexed loanId, address indexed borrower, uint256 amount);
    
    // Modifiers
    modifier onlyConnectedWallet() {
        require(connectedWallets[msg.sender], "Wallet not connected. Please connect your MetaMask wallet first.");
        _;
    }
    
    modifier onlyBorrower(uint256 loanId) {
        require(loanRequests[loanId].borrower == msg.sender, "Only the borrower can perform this action");
        _;
    }
    
    modifier loanExists(uint256 loanId) {
        require(loanRequests[loanId].id != 0, "Loan request does not exist");
        _;
    }
    
    modifier loanActive(uint256 loanId) {
        require(loanRequests[loanId].isActive, "Loan request is not active");
        _;
    }
    
    modifier loanNotFunded(uint256 loanId) {
        require(!loanRequests[loanId].isFunded, "Loan is already funded");
        _;
    }
    
    // Wallet connection functions
    function connectWallet() external {
        require(!connectedWallets[msg.sender], "Wallet already connected");
        connectedWallets[msg.sender] = true;
        
        if (!users[msg.sender].isRegistered) {
            users[msg.sender].isRegistered = true;
        }
        
        emit WalletConnected(msg.sender);
    }
    
    function disconnectWallet() external {
        require(connectedWallets[msg.sender], "Wallet not connected");
        connectedWallets[msg.sender] = false;
        emit WalletDisconnected(msg.sender);
    }
    
    function isWalletConnected(address user) external view returns (bool) {
        return connectedWallets[user];
    }
    
    // Loan request functions
    function createLoanRequest(uint256 amount, uint256 interestRate, uint256 duration) 
        external 
        onlyConnectedWallet 
        whenNotPaused 
        nonReentrant 
    {
        require(amount > 0, "Amount must be greater than 0");
        require(interestRate > 0 && interestRate <= 100, "Interest rate must be between 1 and 100");
        require(duration > 0, "Duration must be greater than 0");
        
        uint256 loanId = nextLoanId++;
        
        loanRequests[loanId] = LoanRequest({
            id: loanId,
            borrower: msg.sender,
            amount: amount,
            interestRate: interestRate,
            duration: duration,
            timestamp: block.timestamp,
            isActive: true,
            isFunded: false,
            lender: address(0),
            fundedAt: 0
        });
        
        users[msg.sender].loanRequests.push(loanId);
        
        emit LoanRequestCreated(loanId, msg.sender, amount, interestRate, duration);
    }
    
    function fundLoan(uint256 loanId) 
        external 
        payable 
        onlyConnectedWallet 
        loanExists(loanId) 
        loanActive(loanId) 
        loanNotFunded(loanId) 
        whenNotPaused 
        nonReentrant 
    {
        LoanRequest storage loan = loanRequests[loanId];
        require(msg.sender != loan.borrower, "Cannot fund your own loan");
        require(msg.value == loan.amount, "Must send exact loan amount");
        
        loan.isFunded = true;
        loan.lender = msg.sender;
        loan.fundedAt = block.timestamp;
        
        users[msg.sender].fundedLoans.push(loanId);
        users[msg.sender].totalLent += loan.amount;
        users[loan.borrower].totalBorrowed += loan.amount;
        
        // Transfer ETH to borrower
        (bool success, ) = loan.borrower.call{value: msg.value}("");
        require(success, "Transfer to borrower failed");
        
        emit LoanFunded(loanId, msg.sender, loan.borrower, loan.amount);
    }
    
    function repayLoan(uint256 loanId) 
        external 
        payable 
        onlyBorrower(loanId) 
        loanExists(loanId) 
        whenNotPaused 
        nonReentrant 
    {
        LoanRequest storage loan = loanRequests[loanId];
        require(loan.isFunded, "Loan is not funded");
        
        uint256 totalRepayment = loan.amount + (loan.amount * loan.interestRate / 100);
        require(msg.value == totalRepayment, "Must send exact repayment amount");
        
        loan.isActive = false;
        
        // Transfer repayment to lender
        (bool success, ) = loan.lender.call{value: msg.value}("");
        require(success, "Transfer to lender failed");
        
        emit LoanRepaid(loanId, msg.sender, totalRepayment);
    }
    
    // View functions
    function getLoanRequest(uint256 loanId) external view returns (LoanRequest memory) {
        return loanRequests[loanId];
    }
    
    function getActiveLoanRequests() external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i < nextLoanId; i++) {
            if (loanRequests[i].isActive && !loanRequests[i].isFunded) {
                count++;
            }
        }
        
        uint256[] memory activeLoans = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i < nextLoanId; i++) {
            if (loanRequests[i].isActive && !loanRequests[i].isFunded) {
                activeLoans[index] = i;
                index++;
            }
        }
        
        return activeLoans;
    }
    
    function getUserLoanRequests(address user) external view returns (uint256[] memory) {
        return users[user].loanRequests;
    }
    
    function getUserFundedLoans(address user) external view returns (uint256[] memory) {
        return users[user].fundedLoans;
    }
    
    function getUserStats(address user) external view returns (uint256 totalBorrowed, uint256 totalLent) {
        return (users[user].totalBorrowed, users[user].totalLent);
    }
    
    // Admin functions
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // Emergency functions
    function emergencyWithdraw() external onlyOwner {
        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success, "Emergency withdrawal failed");
    }
} 