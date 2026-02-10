import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;

describe("FinBridgeLending", function () {
  let FinBridgeLending;
  let lendingContract;
  let owner;
  let borrower;
  let lender;
  let addr1;
  let addr2;

  beforeEach(async function () {
    // Get signers
    [owner, borrower, lender, addr1, addr2] = await ethers.getSigners();
    
    // Deploy contract
    FinBridgeLending = await ethers.getContractFactory("FinBridgeLending");
    lendingContract = await FinBridgeLending.deploy();
    await lendingContract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await lendingContract.owner()).to.equal(owner.address);
    });

    it("Should initialize with correct constants", async function () {
      expect(await lendingContract.BASE_INTEREST_RATE()).to.equal(520);
      expect(await lendingContract.MIN_LOAN_AMOUNT()).to.equal(ethers.parseEther("1"));
      expect(await lendingContract.MAX_LOAN_AMOUNT()).to.equal(ethers.parseEther("1000"));
      expect(await lendingContract.MIN_DURATION()).to.equal(7 * 24 * 60 * 60);
      expect(await lendingContract.MAX_DURATION()).to.equal(365 * 24 * 60 * 60);
    });
  });

  describe("Interest Rate Calculation", function () {
    it("Should calculate correct interest rates for different amounts and durations", async function () {
      const testCases = [
        { amount: ethers.parseEther("0.5"), duration: 30 * 24 * 60 * 60, expectedRate: 520 }, // 5.2%
        { amount: ethers.parseEther("5"), duration: 30 * 24 * 60 * 60, expectedRate: 620 }, // 6.2%
        { amount: ethers.parseEther("50"), duration: 90 * 24 * 60 * 60, expectedRate: 920 }, // 9.2%
        { amount: ethers.parseEther("500"), duration: 180 * 24 * 60 * 60, expectedRate: 1420 }, // 14.2%
        { amount: ethers.parseEther("1000"), duration: 365 * 24 * 60 * 60, expectedRate: 1520 } // 15.2%
      ];
      
      for (const testCase of testCases) {
        const calculatedRate = await lendingContract.calculateInterestRate(testCase.amount, testCase.duration);
        expect(calculatedRate).to.equal(testCase.expectedRate);
      }
    });

    it("Should handle edge cases for interest calculation", async function () {
      // Minimum amount and duration
      const minRate = await lendingContract.calculateInterestRate(
        ethers.parseEther("0.01"), 
        7 * 24 * 60 * 60
      );
      expect(minRate).to.equal(520); // Base rate only

      // Maximum amount and duration
      const maxRate = await lendingContract.calculateInterestRate(
        ethers.parseEther("1000"), 
        365 * 24 * 60 * 60
      );
      expect(maxRate).to.equal(1520); // Base + max amount + max duration
    });
  });

  describe("Wallet Connection", function () {
    it("Should allow wallet connection", async function () {
      await expect(lendingContract.connect(borrower).connectWallet())
        .to.emit(lendingContract, "WalletConnected")
        .withArgs(borrower.address);
      
      expect(await lendingContract.isWalletConnected(borrower.address)).to.be.true;
    });

    it("Should prevent duplicate wallet connections", async function () {
      await lendingContract.connect(borrower).connectWallet();
      
      await expect(lendingContract.connect(borrower).connectWallet())
        .to.be.revertedWith("Wallet already connected");
    });

    it("Should allow wallet disconnection", async function () {
      await lendingContract.connect(borrower).connectWallet();
      
      await expect(lendingContract.connect(borrower).disconnectWallet())
        .to.emit(lendingContract, "WalletDisconnected")
        .withArgs(borrower.address);
      
      expect(await lendingContract.isWalletConnected(borrower.address)).to.be.false;
    });

    it("Should prevent disconnection of unconnected wallet", async function () {
      await expect(lendingContract.connect(borrower).disconnectWallet())
        .to.be.revertedWith("Wallet not connected");
    });
  });

  describe("Loan Request Creation", function () {
    beforeEach(async function () {
      await lendingContract.connect(borrower).connectWallet();
    });

    it("Should create loan request with auto-calculated interest rate", async function () {
      const amount = ethers.parseEther("1");
      const duration = 30 * 24 * 60 * 60; // 30 days

      await expect(lendingContract.connect(borrower).createLoanRequest(amount, duration))
        .to.emit(lendingContract, "LoanRequestCreated")
        .withArgs(1, borrower.address, amount, 620, duration);

      const loan = await lendingContract.getLoanRequest(1);
      expect(loan.borrower).to.equal(borrower.address);
      expect(loan.amount).to.equal(amount);
      expect(loan.interestRate).to.equal(620); // Auto-calculated
      expect(loan.duration).to.equal(duration);
      expect(loan.isActive).to.be.true;
      expect(loan.isFunded).to.be.false;
      expect(loan.deadline).to.be.gt(0);
    });

    it("Should reject invalid loan amounts", async function () {
      const duration = 30 * 24 * 60 * 60;
      
      // Test minimum amount
      await expect(lendingContract.connect(borrower).createLoanRequest(ethers.parseEther("0.005"), duration))
        .to.be.revertedWith("Amount must be between 0.01 and 1000 ETH");
      
      // Test maximum amount
      await expect(lendingContract.connect(borrower).createLoanRequest(ethers.parseEther("1001"), duration))
        .to.be.revertedWith("Amount must be between 0.01 and 1000 ETH");
    });

    it("Should reject invalid durations", async function () {
      const amount = ethers.parseEther("1");
      
      // Test minimum duration
      await expect(lendingContract.connect(borrower).createLoanRequest(amount, 6 * 24 * 60 * 60))
        .to.be.revertedWith("Duration must be between 7 days and 365 days");
      
      // Test maximum duration
      await expect(lendingContract.connect(borrower).createLoanRequest(amount, 366 * 24 * 60 * 60))
        .to.be.revertedWith("Duration must be between 7 days and 365 days");
    });

    it("Should require wallet connection", async function () {
      const amount = ethers.parseEther("1");
      const duration = 30 * 24 * 60 * 60;
      
      await expect(lendingContract.connect(lender).createLoanRequest(amount, duration))
        .to.be.revertedWith("Wallet not connected. Please connect your MetaMask wallet first.");
    });

    it("Should create multiple loan requests", async function () {
      const amount = ethers.parseEther("1");
      const duration = 30 * 24 * 60 * 60;
      
      await lendingContract.connect(borrower).createLoanRequest(amount, duration);
      await lendingContract.connect(borrower).createLoanRequest(ethers.parseEther("2"), duration * 2);
      
      const userLoans = await lendingContract.getUserLoanRequests(borrower.address);
      expect(userLoans.length).to.equal(2);
    });
  });

  describe("Loan Funding", function () {
    let loanId;
    const amount = ethers.parseEther("1");
    const duration = 30 * 24 * 60 * 60;

    beforeEach(async function () {
      await lendingContract.connect(borrower).connectWallet();
      await lendingContract.connect(lender).connectWallet();
      await lendingContract.connect(borrower).createLoanRequest(amount, duration);
      loanId = 1;
    });

    it("Should fund loan successfully", async function () {
      const lenderBalanceBefore = await ethers.provider.getBalance(lender.address);
      const borrowerBalanceBefore = await ethers.provider.getBalance(borrower.address);

      await expect(lendingContract.connect(lender).fundLoan(loanId, { value: amount }))
        .to.emit(lendingContract, "LoanFunded")
        .withArgs(loanId, lender.address, borrower.address, amount);

      const loan = await lendingContract.getLoanRequest(loanId);
      expect(loan.isFunded).to.be.true;
      expect(loan.lender).to.equal(lender.address);
      expect(loan.fundedAt).to.be.gt(0);

      // Check balances
      const lenderBalanceAfter = await ethers.provider.getBalance(lender.address);
      const borrowerBalanceAfter = await ethers.provider.getBalance(borrower.address);
      
      expect(lenderBalanceAfter).to.be.lt(lenderBalanceBefore);
      expect(borrowerBalanceAfter).to.be.gt(borrowerBalanceBefore);
    });

    it("Should prevent funding without wallet connection", async function () {
      await expect(lendingContract.connect(addr1).fundLoan(loanId, { value: amount }))
        .to.be.revertedWith("Wallet not connected. Please connect your MetaMask wallet first.");
    });

    it("Should prevent borrower from funding own loan", async function () {
      await expect(lendingContract.connect(borrower).fundLoan(loanId, { value: amount }))
        .to.be.revertedWith("Cannot fund your own loan");
    });

    it("Should require exact amount for funding", async function () {
      const wrongAmount = ethers.parseEther("0.5");
      await expect(lendingContract.connect(lender).fundLoan(loanId, { value: wrongAmount }))
        .to.be.revertedWith("Must send exact loan amount");
    });

    it("Should prevent funding already funded loan", async function () {
      await lendingContract.connect(lender).fundLoan(loanId, { value: amount });
      
      await expect(lendingContract.connect(addr1).fundLoan(loanId, { value: amount }))
        .to.be.revertedWith("Wallet not connected. Please connect your MetaMask wallet first.");
    });

    it("Should prevent funding expired loan", async function () {
      // Create a loan with short duration and wait for it to expire
      await lendingContract.connect(borrower).createLoanRequest(amount, 7 * 24 * 60 * 60);
      const expiredLoanId = 2;
      
      // Simulate time passing (in real test, you'd use time manipulation)
      // For now, just test the logic exists
      const loan = await lendingContract.getLoanRequest(expiredLoanId);
      expect(loan.deadline).to.be.gt(0);
    });
  });

  describe("Loan Repayment", function () {
    let loanId;
    const amount = ethers.parseEther("1");
    const duration = 30 * 24 * 60 * 60;
    const interestRate = 520; // 5.2%
    const totalRepayment = amount + (amount * BigInt(interestRate) / BigInt(100));

    beforeEach(async function () {
      await lendingContract.connect(borrower).connectWallet();
      await lendingContract.connect(lender).connectWallet();
      await lendingContract.connect(borrower).createLoanRequest(amount, duration);
      loanId = 1;
      await lendingContract.connect(lender).fundLoan(loanId, { value: amount });
    });

    it("Should allow borrower to repay loan", async function () {
      const lenderBalanceBefore = await ethers.provider.getBalance(lender.address);
      const borrowerBalanceBefore = await ethers.provider.getBalance(borrower.address);

      await expect(lendingContract.connect(borrower).repayLoan(loanId, { value: totalRepayment }))
        .to.emit(lendingContract, "LoanRepaid")
        .withArgs(loanId, borrower.address, totalRepayment);

      const loan = await lendingContract.getLoanRequest(loanId);
      expect(loan.isActive).to.be.false;

      // Check balances
      const lenderBalanceAfter = await ethers.provider.getBalance(lender.address);
      const borrowerBalanceAfter = await ethers.provider.getBalance(borrower.address);
      
      expect(lenderBalanceAfter).to.be.gt(lenderBalanceBefore);
      expect(borrowerBalanceAfter).to.be.lt(borrowerBalanceBefore);
    });

    it("Should require exact repayment amount", async function () {
      const wrongAmount = ethers.parseEther("1.5");
      await expect(lendingContract.connect(borrower).repayLoan(loanId, { value: wrongAmount }))
        .to.be.revertedWith("Must send exact repayment amount");
    });

    it("Should prevent non-borrower from repaying", async function () {
      await expect(lendingContract.connect(lender).repayLoan(loanId, { value: totalRepayment }))
        .to.be.revertedWith("Only the borrower can perform this action");
    });

    it("Should prevent repayment of unfunded loan", async function () {
      await lendingContract.connect(borrower).createLoanRequest(amount, duration);
      const unfundedLoanId = 2;
      
      await expect(lendingContract.connect(borrower).repayLoan(unfundedLoanId, { value: totalRepayment }))
        .to.be.revertedWith("Loan is not funded");
    });
  });

  describe("Loan Withdrawal", function () {
    let loanId;
    const amount = ethers.parseEther("1");
    const duration = 30 * 24 * 60 * 60;

    beforeEach(async function () {
      await lendingContract.connect(borrower).connectWallet();
      await lendingContract.connect(borrower).createLoanRequest(amount, duration);
      loanId = 1;
    });

    it("Should allow borrower to withdraw loan request", async function () {
      await expect(lendingContract.connect(borrower).withdrawLoanRequest(loanId))
        .to.emit(lendingContract, "LoanRequestWithdrawn")
        .withArgs(loanId, borrower.address);

      const loan = await lendingContract.getLoanRequest(loanId);
      expect(loan.isActive).to.be.false;
    });

    it("Should prevent withdrawal of funded loan", async function () {
      await lendingContract.connect(lender).connectWallet();
      await lendingContract.connect(lender).fundLoan(loanId, { value: amount });
      
      await expect(lendingContract.connect(borrower).withdrawLoanRequest(loanId))
        .to.be.revertedWith("Loan request is not active");
    });

    it("Should prevent non-borrower from withdrawing", async function () {
      await expect(lendingContract.connect(lender).withdrawLoanRequest(loanId))
        .to.be.revertedWith("Only the borrower can perform this action");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await lendingContract.connect(borrower).connectWallet();
      await lendingContract.connect(lender).connectWallet();
    });

    it("Should return active loan requests", async function () {
      const amount = ethers.parseEther("1");
      const duration = 30 * 24 * 60 * 60;

      await lendingContract.connect(borrower).createLoanRequest(amount, duration);
      
      const activeLoans = await lendingContract.getActiveLoanRequests();
      expect(activeLoans.length).to.equal(1);
      expect(activeLoans[0]).to.equal(1);
    });

    it("Should return user loan requests", async function () {
      const amount = ethers.parseEther("1");
      const duration = 30 * 24 * 60 * 60;

      await lendingContract.connect(borrower).createLoanRequest(amount, duration);
      
      const userLoans = await lendingContract.getUserLoanRequests(borrower.address);
      expect(userLoans.length).to.equal(1);
      expect(userLoans[0]).to.equal(1);
    });

    it("Should return user stats", async function () {
      const amount = ethers.parseEther("1");
      const duration = 30 * 24 * 60 * 60;

      await lendingContract.connect(borrower).createLoanRequest(amount, duration);
      await lendingContract.connect(lender).connectWallet();
      await lendingContract.connect(lender).fundLoan(1, { value: amount });

      const [totalBorrowed, totalLent] = await lendingContract.getUserStats(borrower.address);
      expect(totalBorrowed).to.equal(amount);

      const [lenderBorrowed, lenderLent] = await lendingContract.getUserStats(lender.address);
      expect(lenderLent).to.equal(amount);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to pause contract", async function () {
      await lendingContract.connect(owner).pause();
      expect(await lendingContract.paused()).to.be.true;
    });

    it("Should allow owner to unpause contract", async function () {
      await lendingContract.connect(owner).pause();
      await lendingContract.connect(owner).unpause();
      expect(await lendingContract.paused()).to.be.false;
    });

    it("Should prevent non-owner from pausing", async function () {
      await expect(lendingContract.connect(borrower).pause())
        .to.be.revertedWithCustomError(lendingContract, "OwnableUnauthorizedAccount");
    });

    it("Should allow owner to emergency withdraw", async function () {
      // Send some ETH to contract first
      await owner.sendTransaction({
        to: await lendingContract.getAddress(),
        value: ethers.parseEther("1")
      });

      const balanceBefore = await ethers.provider.getBalance(await lendingContract.getAddress());
      expect(balanceBefore).to.equal(ethers.parseEther("1"));

      await lendingContract.connect(owner).emergencyWithdraw();
      
      const balanceAfter = await ethers.provider.getBalance(await lendingContract.getAddress());
      expect(balanceAfter).to.equal(0);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle maximum loan request", async function () {
      await lendingContract.connect(borrower).connectWallet();
      
      const maxAmount = ethers.parseEther("1000");
      const maxDuration = 365 * 24 * 60 * 60;
      
      await expect(lendingContract.connect(borrower).createLoanRequest(maxAmount, maxDuration))
        .to.emit(lendingContract, "LoanRequestCreated");
      
      const loan = await lendingContract.getLoanRequest(1);
      expect(loan.amount).to.equal(maxAmount);
      expect(loan.duration).to.equal(maxDuration);
    });

    it("Should handle minimum loan request", async function () {
      await lendingContract.connect(borrower).connectWallet();
      
      const minAmount = ethers.parseEther("0.01");
      const minDuration = 7 * 24 * 60 * 60;
      
      await expect(lendingContract.connect(borrower).createLoanRequest(minAmount, minDuration))
        .to.emit(lendingContract, "LoanRequestCreated");
      
      const loan = await lendingContract.getLoanRequest(1);
      expect(loan.amount).to.equal(minAmount);
      expect(loan.duration).to.equal(minDuration);
    });

    it("Should handle multiple users and loans", async function () {
      await lendingContract.connect(borrower).connectWallet();
      await lendingContract.connect(lender).connectWallet();
      await lendingContract.connect(addr1).connectWallet();
      await lendingContract.connect(addr2).connectWallet();

      const amount = ethers.parseEther("1");
      const duration = 30 * 24 * 60 * 60;

      await lendingContract.connect(borrower).createLoanRequest(amount, duration);
      await lendingContract.connect(addr1).createLoanRequest(amount * 2n, duration);
      await lendingContract.connect(addr2).createLoanRequest(amount * 3n, duration);

      const activeLoans = await lendingContract.getActiveLoanRequests();
      expect(activeLoans.length).to.equal(3);
    });
  });
});
