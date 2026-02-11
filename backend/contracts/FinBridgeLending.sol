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
        uint256 deadline;
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
    
    // Emergency timelock variables
    uint256 public constant PAUSE_TIMELOCK = 1 days; // 24 hour delay for critical operations
    uint256 public pauseScheduledAt;
    bool public isPauseScheduled;
    
    // Constants for interest calculation
    uint256 public constant BASE_INTEREST_RATE = 520; // 5.2% in basis points
    uint256 public constant MIN_LOAN_AMOUNT = 1 ether; // 0.01 ETH minimum
    uint256 public constant MAX_LOAN_AMOUNT = 1000 ether; // 1000 ETH maximum
    uint256 public constant MIN_DURATION = 7 days; // 7 days minimum
    uint256 public constant MAX_DURATION = 365 days; // 365 days maximum
    
    // Events
    event WalletConnected(address indexed user);
    event WalletDisconnected(address indexed user);
    event LoanRequestCreated(uint256 indexed loanId, address indexed borrower, uint256 amount, uint256 interestRate, uint256 duration);
    event LoanRequestWithdrawn(uint256 indexed loanId, address indexed borrower);
    event LoanFunded(uint256 indexed loanId, address indexed lender, address indexed borrower, uint256 amount);
    event LoanRepaid(uint256 indexed loanId, address indexed borrower, uint256 amount);
    event ContractPaused(address indexed by);
    event ContractUnpaused(address indexed by);
    event EmergencyWithdrawal(address indexed by, uint256 amount);
    event PauseScheduled(uint256 unlockTime);
    
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
    
    modifier loanNotExpired(uint256 loanId) {
        require(block.timestamp <= loanRequests[loanId].deadline, "Loan request has expired");
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
    
    /**
     * @dev Calculate dynamic interest rate based on loan amount and duration
     * Base Rate: 5.2% + Amount Adjustment + Duration Adjustment
     */
    function calculateInterestRate(uint256 amount, uint256 duration) public pure returns (uint256) {
        uint256 interestRate = BASE_INTEREST_RATE; // Start with 5.2% (520 basis points)
        
        // Amount-based adjustments (in basis points)
        if (amount >= 0.1 ether && amount < 1 ether) {
            // 0.1 - 1 ETH: +0%
            interestRate += 0;
        } else if (amount >= 1 ether && amount < 10 ether) {
            // 1 - 10 ETH: +1%
            interestRate += 100; // 1% = 100 basis points
        } else if (amount >= 10 ether && amount < 50 ether) {
            // 10 - 50 ETH: +2%
            interestRate += 200;
        } else if (amount >= 50 ether && amount < 100 ether) {
            // 50 - 100 ETH: +3%
            interestRate += 300;
        } else if (amount >= 100 ether && amount < 500 ether) {
            // 100 - 500 ETH: +5%
            interestRate += 500;
        } else if (amount >= 500 ether && amount <= 1000 ether) {
            // 500 - 1000 ETH: +7%
            interestRate += 700;
        }
        
        // Duration-based adjustments (in basis points)
        if (duration >= 7 days && duration <= 30 days) {
            // 7 - 30 days: +0%
            interestRate += 0;
        } else if (duration > 30 days && duration <= 90 days) {
            // 31 - 90 days: +1%
            interestRate += 100;
        } else if (duration > 90 days && duration <= 180 days) {
            // 91 - 180 days: +2%
            interestRate += 200;
        } else if (duration > 180 days && duration <= 365 days) {
            // 181 - 365 days: +3%
            interestRate += 300;
        }
        
        return interestRate; // Return in basis points (e.g., 520 = 5.2%)
    }
    
    // Loan request functions
    function createLoanRequest(uint256 amount, uint256 duration) 
        external 
        onlyConnectedWallet 
        whenNotPaused 
        nonReentrant 
    {
        // Enhanced validation with realistic bounds
        require(amount >= MIN_LOAN_AMOUNT && amount <= MAX_LOAN_AMOUNT, 
                "Amount must be between 0.01 and 1000 ETH");
        require(duration >= MIN_DURATION && duration <= MAX_DURATION, 
                "Duration must be between 7 days and 365 days");
        
        // Auto-calculate interest rate based on amount and duration
        uint256 calculatedInterestRate = calculateInterestRate(amount, duration);
        
        uint256 loanId = nextLoanId++;
        uint256 deadline = block.timestamp + duration;
        
        loanRequests[loanId] = LoanRequest({
            id: loanId,
            borrower: msg.sender,
            amount: amount,
            interestRate: calculatedInterestRate,
            duration: duration,
            timestamp: block.timestamp,
            deadline: deadline,
            isActive: true,
            isFunded: false,
            lender: address(0),
            fundedAt: 0
        });
        
        users[msg.sender].loanRequests.push(loanId);
        
        emit LoanRequestCreated(loanId, msg.sender, amount, calculatedInterestRate, duration);
    }
    
    function fundLoan(uint256 loanId) 
        external 
        payable 
        onlyConnectedWallet 
        loanExists(loanId) 
        loanActive(loanId) 
        loanNotFunded(loanId) 
        loanNotExpired(loanId)
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
    
    function withdrawLoanRequest(uint256 loanId) 
        external 
        onlyBorrower(loanId) 
        loanExists(loanId) 
        loanActive(loanId) 
        loanNotFunded(loanId) 
        whenNotPaused 
        nonReentrant 
    {
        LoanRequest storage loan = loanRequests[loanId];
        loan.isActive = false;
        
        emit LoanRequestWithdrawn(loanId, msg.sender);
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
        require(loan.isActive, "Loan already repaid");
        
        // Calculate total repayment with proper basis points precision (10000 = 100%)
        uint256 totalRepayment = loan.amount + (loan.amount * loan.interestRate / 10000);
        require(msg.value == totalRepayment, "Must send exact repayment amount");
        
        // Store lender address before state changes
        address lender = loan.lender;
        
        // EFFECTS: Update state before external call (Checks-Effects-Interactions pattern)
        loan.isActive = false;
        
        // INTERACTIONS: External call last to prevent reentrancy
        (bool success, ) = lender.call{value: msg.value}("");
        require(success, "Transfer to lender failed");
        
        emit LoanRepaid(loanId, msg.sender, totalRepayment);
    }
    
    // View functions
    function getLoanRequest(uint256 loanId) external view returns (LoanRequest memory) {
        return loanRequests[loanId];
    }
    
    function getActiveLoanRequests() external view returns (uint256[] memory) {
        uint256 count = 0;
        uint256 totalLoans = nextLoanId - 1;
        
        // First pass: count active, non-funded, non-expired loans
        for (uint256 i = 1; i <= totalLoans; i++) {
            if (loanRequests[i].isActive && 
                !loanRequests[i].isFunded && 
                block.timestamp <= loanRequests[i].deadline) {
                count++;
            }
        }
        
        // Second pass: populate array with qualifying loan IDs
        uint256[] memory activeLoans = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= totalLoans; i++) {
            if (loanRequests[i].isActive && 
                !loanRequests[i].isFunded && 
                block.timestamp <= loanRequests[i].deadline) {
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
    function schedulePause() external onlyOwner {
        require(!isPauseScheduled, "Pause already scheduled");
        pauseScheduledAt = block.timestamp;
        isPauseScheduled = true;
        emit PauseScheduled(block.timestamp + PAUSE_TIMELOCK);
    }
    
    function pause() external onlyOwner {
        require(isPauseScheduled, "Pause not scheduled");
        require(block.timestamp >= pauseScheduledAt + PAUSE_TIMELOCK, "Timelock not expired");
        require(!paused(), "Contract already paused");
        
        _pause();
        isPauseScheduled = false;
        emit ContractPaused(msg.sender);
    }
    
    function unpause() external onlyOwner {
        require(paused(), "Contract not paused");
        _unpause();
        emit ContractUnpaused(msg.sender);
    }
    
    // Emergency functions
    function emergencyWithdraw() external onlyOwner whenPaused {
        uint256 balance = address(this).balance;
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Emergency withdrawal failed");
        emit EmergencyWithdrawal(msg.sender, balance);
    }
}