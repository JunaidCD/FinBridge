import { ethers } from 'ethers';
import { LOAN_CONTRACT_ABI, LOAN_CONTRACT_ADDRESS } from './loan-abi.js';

// Contract initialization functions
export const initializeContract = async (provider, signer) => {
  // In ethers v6, getSigner() returns a promise
  const resolvedSigner = await signer;
  console.log('Initializing contract with address:', LOAN_CONTRACT_ADDRESS);
  console.log('Provider:', provider);
  console.log('Signer:', resolvedSigner);
  
  const contract = new ethers.Contract(LOAN_CONTRACT_ADDRESS, LOAN_CONTRACT_ABI, resolvedSigner);
  console.log('Contract created:', contract);
  return contract;
};

export const getLoanContract = (provider) => {
  console.log('Creating read-only contract with address:', LOAN_CONTRACT_ADDRESS);
  return new ethers.Contract(LOAN_CONTRACT_ADDRESS, LOAN_CONTRACT_ABI, provider);
};

// Check if contract is deployed
export const checkContractDeployment = async (provider) => {
  try {
    const contract = getLoanContract(provider);
    console.log('Checking contract deployment...');
    // Try to call a simple view function
    const nextLoanId = await contract.nextLoanId();
    console.log('Contract is deployed! Next loan ID:', nextLoanId.toString());
    return true;
  } catch (error) {
    console.error('Contract is not deployed or not accessible:', error);
    return false;
  }
};

// Contract interaction utilities
export const contractUtils = {
  // Connect wallet to the contract
  async connectWallet(contract) {
    try {
      const tx = await contract.connectWallet();
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  },

  // Disconnect wallet from the contract
  async disconnectWallet(contract) {
    try {
      const tx = await contract.disconnectWallet();
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      throw error;
    }
  },

  // Check if wallet is connected
  async isWalletConnected(contract, address) {
    try {
      return await contract.isWalletConnected(address);
    } catch (error) {
      console.error('Error checking wallet connection:', error);
      return false;
    }
  },

  // Create a new loan request
  async createLoanRequest(contract, amount, duration) {
    try {
      console.log('Creating loan request with params:', { amount, duration });
      
      // Convert amount to wei
      const amountInWei = ethers.parseEther(amount.toString());
      console.log('Amount in wei:', amountInWei.toString());
      
      // Convert duration from days to seconds (contract expects seconds)
      const durationInSeconds = parseInt(duration) * 24 * 60 * 60; // days * 24 hours * 60 minutes * 60 seconds
      console.log('Duration in seconds:', durationInSeconds);
      
      console.log('Calling contract.createLoanRequest...');
      const tx = await contract.createLoanRequest(
        amountInWei,
        durationInSeconds
      );
      console.log('Transaction sent:', tx.hash);
      
      console.log('Waiting for transaction confirmation...');
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt.hash);
      console.log('Transaction logs:', receipt.logs.length);
      
      // Find the LoanRequestCreated event
      const event = receipt.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog(log);
          console.log('Parsed event:', parsed.name);
          return parsed.name === 'LoanRequestCreated';
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsed = contract.interface.parseLog(event);
        console.log('LoanRequestCreated event found:', parsed.args);
        return {
          loanId: parsed.args.loanId.toString(),
          borrower: parsed.args.borrower,
          amount: ethers.formatEther(parsed.args.amount),
          interestRate: parsed.args.interestRate.toString(),
          duration: parsed.args.duration.toString(),
          transactionHash: tx.hash
        };
      } else {
        console.log('LoanRequestCreated event not found in transaction logs');
      }
      
      return { transactionHash: tx.hash };
    } catch (error) {
      console.error('Error creating loan request:', error);
      console.error('Error details:', error.message, error.code, error.reason);
      throw error;
    }
  },

  // Fund a loan
  async fundLoan(contract, loanId, amount) {
    try {
      // Convert amount to wei (amount should be a string or number representing ETH)
      const amountInWei = ethers.parseEther(amount.toString());
      
      const tx = await contract.fundLoan(loanId, { value: amountInWei });
      await tx.wait();
      
      return { transactionHash: tx.hash };
    } catch (error) {
      console.error('Error funding loan:', error);
      throw error;
    }
  },

  // Withdraw a loan request
  async withdrawLoanRequest(contract, loanId) {
    try {
      const tx = await contract.withdrawLoanRequest(loanId);
      const receipt = await tx.wait();
      
      // Find the LoanRequestWithdrawn event
      const event = receipt.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed.name === 'LoanRequestWithdrawn';
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsed = contract.interface.parseLog(event);
        return {
          loanId: parsed.args.loanId.toString(),
          borrower: parsed.args.borrower,
          transactionHash: tx.hash
        };
      }
      
      return { transactionHash: tx.hash };
    } catch (error) {
      console.error('Error withdrawing loan request:', error);
      throw error;
    }
  },

  // Repay a loan
  async repayLoan(contract, loanId, amount) {
    try {
      // Convert amount to wei (amount should be a string or number representing ETH)
      const amountInWei = ethers.parseEther(amount.toString());
      
      const tx = await contract.repayLoan(loanId, { value: amountInWei });
      await tx.wait();
      
      return { transactionHash: tx.hash };
    } catch (error) {
      console.error('Error repaying loan:', error);
      throw error;
    }
  },

  // Get loan request details
  async getLoanRequest(contract, loanId) {
    try {
      const loan = await contract.getLoanRequest(loanId);
      
      return {
        id: typeof loan.id === 'bigint' ? loan.id.toString() : loan.id.toString(),
        borrower: loan.borrower,
        amount: ethers.formatEther(loan.amount),
        interestRate: typeof loan.interestRate === 'bigint' ? loan.interestRate.toString() : loan.interestRate.toString(),
        duration: typeof loan.duration === 'bigint' ? loan.duration.toString() : loan.duration.toString(),
        timestamp: new Date(Number(loan.timestamp) * 1000).toISOString(),
        deadline: new Date(Number(loan.deadline) * 1000).toISOString(),
        isActive: loan.isActive,
        isFunded: loan.isFunded,
        lender: loan.lender,
        fundedAt: loan.fundedAt > 0 ? new Date(Number(loan.fundedAt) * 1000).toISOString() : null
      };
    } catch (error) {
      console.error('Error getting loan request:', error);
      throw error;
    }
  },

  // Get all active loan requests
  async getActiveLoanRequests(contract) {
    try {
      console.log('Calling getActiveLoanRequests on contract:', contract.target || contract.address);
      
      // First check if the contract method exists
      if (typeof contract.getActiveLoanRequests !== 'function') {
        console.error('getActiveLoanRequests method not found on contract');
        return [];
      }
      
      const loanIds = await contract.getActiveLoanRequests();
      console.log('Received loan IDs:', loanIds);
      console.log('Loan IDs type:', typeof loanIds, 'Length:', loanIds.length);
      
      if (!loanIds || loanIds.length === 0) {
        console.log('No loan IDs returned from contract');
        return [];
      }
      
      const loans = [];
      
      for (let i = 0; i < loanIds.length; i++) {
        const loanId = loanIds[i];
        try {
          // Convert BigInt to string safely
          const loanIdStr = typeof loanId === 'bigint' ? loanId.toString() : loanId.toString();
          console.log(`Fetching loan details for ID ${i + 1}/${loanIds.length}:`, loanIdStr);
          const loan = await this.getLoanRequest(contract, loanIdStr);
          console.log('Loan details:', loan);
          
          // Only add active, unfunded loans to the marketplace
          if (loan.isActive && !loan.isFunded) {
            loans.push(loan);
            console.log('Added loan to marketplace:', loanIdStr);
          } else {
            console.log('Skipping loan (not active or already funded):', loanIdStr, {
              isActive: loan.isActive,
              isFunded: loan.isFunded
            });
          }
        } catch (error) {
          console.error(`Error getting loan ${loanId}:`, error);
        }
      }
      
      console.log('Total active, unfunded loans found:', loans.length);
      return loans;
    } catch (error) {
      console.error('Error getting active loan requests:', error);
      console.error('Error details:', error.message, error.code);
      // Return empty array instead of throwing error
      return [];
    }
  },

  // Get user's loan requests
  async getUserLoanRequests(contract, userAddress) {
    try {
      const loanIds = await contract.getUserLoanRequests(userAddress);
      const loans = [];
      
      for (const loanId of loanIds) {
        try {
          const loan = await this.getLoanRequest(contract, loanId.toString());
          loans.push(loan);
        } catch (error) {
          console.error(`Error getting user loan ${loanId}:`, error);
        }
      }
      
      return loans;
    } catch (error) {
      console.error('Error getting user loan requests:', error);
      throw error;
    }
  },

  // Get user's funded loans
  async getUserFundedLoans(contract, userAddress) {
    try {
      const loanIds = await contract.getUserFundedLoans(userAddress);
      const loans = [];
      
      for (const loanId of loanIds) {
        try {
          const loan = await this.getLoanRequest(contract, loanId.toString());
          loans.push(loan);
        } catch (error) {
          console.error(`Error getting funded loan ${loanId}:`, error);
        }
      }
      
      return loans;
    } catch (error) {
      console.error('Error getting user funded loans:', error);
      throw error;
    }
  },

  // Get user stats
  async getUserStats(contract, userAddress) {
    try {
      const stats = await contract.getUserStats(userAddress);
      
      return {
        totalBorrowed: ethers.formatEther(stats.totalBorrowed),
        totalLent: ethers.formatEther(stats.totalLent)
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }
};

// Event listeners for contract events
export const setupEventListeners = (contract, callbacks) => {
  const listeners = {};
  
  // Wallet connected event
  if (callbacks.onWalletConnected) {
    contract.on('WalletConnected', (user) => {
      callbacks.onWalletConnected(user);
    });
    listeners.walletConnected = true;
  }
  
  // Wallet disconnected event
  if (callbacks.onWalletDisconnected) {
    contract.on('WalletDisconnected', (user) => {
      callbacks.onWalletDisconnected(user);
    });
    listeners.walletDisconnected = true;
  }
  
  // Loan request created event
  if (callbacks.onLoanRequestCreated) {
    contract.on('LoanRequestCreated', (loanId, borrower, amount, interestRate, duration) => {
      callbacks.onLoanRequestCreated({
        loanId: loanId.toString(),
        borrower,
        amount: ethers.formatEther(amount),
        interestRate: interestRate.toString(),
        duration: duration.toString()
      });
    });
    listeners.loanRequestCreated = true;
  }
  
  // Loan request withdrawn event
  if (callbacks.onLoanRequestWithdrawn) {
    contract.on('LoanRequestWithdrawn', (loanId, borrower) => {
      callbacks.onLoanRequestWithdrawn({
        loanId: loanId.toString(),
        borrower
      });
    });
    listeners.loanRequestWithdrawn = true;
  }
  
  // Loan funded event
  if (callbacks.onLoanFunded) {
    contract.on('LoanFunded', (loanId, lender, borrower, amount) => {
      callbacks.onLoanFunded({
        loanId: loanId.toString(),
        lender,
        borrower,
        amount: ethers.formatEther(amount)
      });
    });
    listeners.loanFunded = true;
  }
  
  // Loan repaid event
  if (callbacks.onLoanRepaid) {
    contract.on('LoanRepaid', (loanId, borrower, amount) => {
      callbacks.onLoanRepaid({
        loanId: loanId.toString(),
        borrower,
        amount: ethers.formatEther(amount)
      });
    });
    listeners.loanRepaid = true;
  }
  
  return listeners;
};

// Remove event listeners
export const removeEventListeners = (contract, listeners) => {
  if (listeners.walletConnected) {
    contract.off('WalletConnected');
  }
  if (listeners.walletDisconnected) {
    contract.off('WalletDisconnected');
  }
  if (listeners.loanRequestCreated) {
    contract.off('LoanRequestCreated');
  }
  if (listeners.loanRequestWithdrawn) {
    contract.off('LoanRequestWithdrawn');
  }
  if (listeners.loanFunded) {
    contract.off('LoanFunded');
  }
  if (listeners.loanRepaid) {
    contract.off('LoanRepaid');
  }
};

// Utility functions
export const formatLoanData = (loan) => {
  const timeAgo = getTimeAgo(new Date(loan.timestamp));
  const expectedReturn = (parseFloat(loan.amount) * (1 + parseFloat(loan.interestRate) / 100)).toFixed(3);
  
  return {
    ...loan,
    timeAgo,
    expectedReturn: `${expectedReturn} ETH`,
    creditScore: Math.floor(Math.random() * 200) + 600, // Mock credit score for now
    purpose: loan.purpose || 'General purpose loan'
  };
};

const getTimeAgo = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
};
