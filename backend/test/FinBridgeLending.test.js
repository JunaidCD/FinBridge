const { expect } = require("chai");
const { ethers } = require("hardhat");

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

  describe("Wallet Connection", function () {
    it("Should allow wallet connection", async function () {
      await expect(lendingContract.connect(borrower).connectWallet())
        .to.emit(lendingContract, "WalletConnected")
        .withArgs(borrower.address);
      
      expect(await lendingContract.isWalletConnected(borrower.address)).to.be.true;
    });

    it("Should prevent duplicate wallet connection", async function () {
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

    it("Should create loan request when wallet is connected", async function () {
      const amount = ethers.parseEther("1");
      const interestRate = 10; // 10%
      const duration = 30 * 24 * 60 * 60; // 30 days in seconds

      await expect(lendingContract.connect(borrower).createLoanRequest(amount, interestRate, duration))
        .to.emit(lendingContract, "LoanRequestCreated")
        .withArgs(1, borrower.address, amount, interestRate, duration);

      const loan = await lendingContract.getLoanRequest(1);
      expect(loan.borrower).to.equal(borrower.address);
      expect(loan.amount).to.equal(amount);
      expect(loan.interestRate).to.equal(interestRate);
      expect(loan.duration).to.equal(duration);
      expect(loan.isActive).to.be.true;
      expect(loan.isFunded).to.be.false;
    });

    it("Should prevent loan request creation without wallet connection", async function () {
      const amount = ethers.parseEther("1");
      const interestRate = 10;
      const duration = 30 * 24 * 60 * 60;

      await expect(lendingContract.connect(lender).createLoanRequest(amount, interestRate, duration))
        .to.be.revertedWith("Wallet not connected. Please connect your MetaMask wallet first.");
    });

    it("Should validate loan request parameters", async function () {
      const amount = ethers.parseEther("1");
      const interestRate = 10;
      const duration = 30 * 24 * 60 * 60;

      // Test zero amount
      await expect(lendingContract.connect(borrower).createLoanRequest(0, interestRate, duration))
        .to.be.revertedWith("Amount must be greater than 0");

      // Test zero interest rate
      await expect(lendingContract.connect(borrower).createLoanRequest(amount, 0, duration))
        .to.be.revertedWith("Interest rate must be between 1 and 100");

      // Test interest rate > 100
      await expect(lendingContract.connect(borrower).createLoanRequest(amount, 101, duration))
        .to.be.revertedWith("Interest rate must be between 1 and 100");

      // Test zero duration
      await expect(lendingContract.connect(borrower).createLoanRequest(amount, interestRate, 0))
        .to.be.revertedWith("Duration must be greater than 0");
    });
  });

  describe("Loan Funding", function () {
    let loanId;
    const amount = ethers.parseEther("1");
    const interestRate = 10;
    const duration = 30 * 24 * 60 * 60;

    beforeEach(async function () {
      await lendingContract.connect(borrower).connectWallet();
      await lendingContract.connect(lender).connectWallet();
      
      await lendingContract.connect(borrower).createLoanRequest(amount, interestRate, duration);
      loanId = 1;
    });

    it("Should allow lender to fund loan", async function () {
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
        .to.be.revertedWith("Loan is already funded");
    });
  });

  describe("Loan Repayment", function () {
    let loanId;
    const amount = ethers.parseEther("1");
    const interestRate = 10;
    const duration = 30 * 24 * 60 * 60;
    const totalRepayment = amount + (amount * BigInt(interestRate) / BigInt(100));

    beforeEach(async function () {
      await lendingContract.connect(borrower).connectWallet();
      await lendingContract.connect(lender).connectWallet();
      
      await lendingContract.connect(borrower).createLoanRequest(amount, interestRate, duration);
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
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await lendingContract.connect(borrower).connectWallet();
      await lendingContract.connect(lender).connectWallet();
    });

    it("Should return active loan requests", async function () {
      const amount = ethers.parseEther("1");
      const interestRate = 10;
      const duration = 30 * 24 * 60 * 60;

      await lendingContract.connect(borrower).createLoanRequest(amount, interestRate, duration);
      
      const activeLoans = await lendingContract.getActiveLoanRequests();
      expect(activeLoans.length).to.equal(1);
      expect(activeLoans[0]).to.equal(1);
    });

    it("Should return user loan requests", async function () {
      const amount = ethers.parseEther("1");
      const interestRate = 10;
      const duration = 30 * 24 * 60 * 60;

      await lendingContract.connect(borrower).createLoanRequest(amount, interestRate, duration);
      
      const userLoans = await lendingContract.getUserLoanRequests(borrower.address);
      expect(userLoans.length).to.equal(1);
      expect(userLoans[0]).to.equal(1);
    });

    it("Should return user stats", async function () {
      const amount = ethers.parseEther("1");
      const interestRate = 10;
      const duration = 30 * 24 * 60 * 60;

      await lendingContract.connect(borrower).createLoanRequest(amount, interestRate, duration);
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
  });
}); 