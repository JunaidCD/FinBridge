import { createContext, useContext, useState, useEffect } from 'react';
import { useWeb3 } from './web3-context';
import { initializeContract, contractUtils, setupEventListeners, removeEventListeners, formatLoanData, checkContractDeployment, LOAN_CONTRACT_ADDRESS } from '../contracts';
import { useToast } from '../hooks/use-toast';
import { ethers } from 'ethers';

const LoanContext = createContext();

export function useLoan() {
  const context = useContext(LoanContext);
  if (!context) {
    throw new Error('useLoan must be used within a LoanProvider');
  }
  return context;
}

export function LoanProvider({ children }) {
  const { toast } = useToast();
  
  // Initialize state with default values
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  
  // Get Web3 context - this will work because LoanProvider is wrapped by Web3Provider
  const { account: web3Account, provider: web3Provider, refreshWalletBalance } = useWeb3();
  
  // Update account and provider when Web3 context changes
  useEffect(() => {
    setAccount(web3Account);
    setProvider(web3Provider);
  }, [web3Account, web3Provider]);
  
  const [loanRequests, setLoanRequests] = useState([]);
  const [userLoans, setUserLoans] = useState([]);
  const [fundedLoans, setFundedLoans] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [contract, setContract] = useState(null);
  const [eventListeners, setEventListeners] = useState(null);

  // Initialize contract when provider and account are available
  useEffect(() => {
    const initializeContractAsync = async () => {
      if (provider && account) {
        try {
          console.log('Initializing contract with provider and account:', account);
      console.log('Contract address being used:', LOAN_CONTRACT_ADDRESS);
      console.log('Current network should be Sepolia (0xAA36A7)');
          // Create ethers BrowserProvider from MetaMask provider
          const ethersProvider = new ethers.BrowserProvider(provider);
          const signer = ethersProvider.getSigner();
          
          // Initialize contract directly without any checks
          const loanContract = await initializeContract(ethersProvider, signer);
          console.log('Contract initialized successfully:', loanContract);
          setContract(loanContract);
        } catch (error) {
          console.error('Error initializing contract:', error);
          // Don't set contract to null, just log the error
          console.log('Contract initialization failed, but continuing...');
        }
      }
    };

    initializeContractAsync();
  }, [provider, account]);

  // Setup event listeners when contract is available
  useEffect(() => {
    if (contract) {
      console.log('Setting up event listeners for contract');
      const listeners = setupEventListeners(contract, {
        onLoanRequestCreated: (loanData) => {
          console.log('Event: New loan request created:', loanData);
          toast({
            title: "New Loan Request",
            description: `${loanData.amount} ETH loan request created`,
            variant: "default",
          });
          
          // Refresh data when new loan is created
          setTimeout(async () => {
            console.log('Event listener: Refreshing loan data...');
            await fetchActiveLoanRequests();
            await fetchUserLoans();
            console.log('Event listener: Data refresh complete');
          }, 2000);
        },
        onLoanFunded: (fundData) => {
          console.log('Loan funded:', fundData);
          toast({
            title: "Loan Funded",
            description: `${fundData.amount} ETH loan has been funded`,
            variant: "default",
          });
          // Refresh data
          setTimeout(async () => {
            await fetchActiveLoanRequests();
            await fetchUserLoans();
            await fetchFundedLoans();
          }, 2000);
        },
        onLoanRepaid: (repayData) => {
          console.log('Loan repaid:', repayData);
          toast({
            title: "Loan Repaid",
            description: `${repayData.amount} ETH loan has been repaid`,
            variant: "default",
          });
          // Refresh data
          setTimeout(async () => {
            await fetchUserLoans();
            await fetchFundedLoans();
          }, 2000);
        },
        onLoanRequestWithdrawn: (withdrawData) => {
          console.log('Loan request withdrawn:', withdrawData);
          toast({
            title: "Loan Request Withdrawn",
            description: `Loan request #${withdrawData.loanId} has been withdrawn`,
            variant: "default",
          });
          // Refresh data
          setTimeout(async () => {
            await fetchActiveLoanRequests();
            await fetchUserLoans();
          }, 2000);
        }
      });
      setEventListeners(listeners);

      // Initial data fetch
      fetchActiveLoanRequests();
      if (account) {
        fetchUserLoans();
        fetchFundedLoans();
      }
    }

    return () => {
      if (contract && eventListeners) {
        removeEventListeners(contract, eventListeners);
      }
    };
  }, [contract, account]);

  // Fetch active loan requests from the contract
  const fetchActiveLoanRequests = async () => {
    if (!contract) {
      console.log('Contract not available for fetching active loan requests');
      return;
    }

    try {
      console.log('Fetching active loan requests...');
      console.log('Contract address:', LOAN_CONTRACT_ADDRESS);
      
      // Check if contract is accessible
      try {
        const nextLoanId = await contract.nextLoanId();
        console.log('Contract is accessible, next loan ID:', nextLoanId.toString());
      } catch (contractError) {
        console.error('Contract is not accessible:', contractError);
        setLoanRequests([]);
        return;
      }
      
      const loans = await contractUtils.getActiveLoanRequests(contract);
      console.log('Raw loans from contract:', loans);
      console.log('Number of loans returned:', loans?.length || 0);
      
      if (!loans || loans.length === 0) {
        console.log('No active loan requests found');
        setLoanRequests([]);
        return;
      }
      
      const formattedLoans = loans.map(formatLoanData);
      console.log('Formatted loans:', formattedLoans);
      
      setLoanRequests(formattedLoans);
      console.log('Setting loan requests state with', formattedLoans.length, 'loans');
    } catch (error) {
      console.error('Error fetching active loan requests:', error);
      setLoanRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user's loan requests
  const fetchUserLoans = async () => {
    if (!contract || !account) {
      console.log('Cannot fetch user loans - contract or account missing');
      return;
    }
    
    try {
      console.log('Fetching user loans...');
      console.log('User account:', account);
      console.log('Contract address:', contract.target || contract.address);
      
      const loans = await contractUtils.getUserLoanRequests(contract, account);
      const formattedLoans = loans.map(formatLoanData);
      
      console.log('Raw loans from contract:', loans);
      console.log('Formatted loans:', formattedLoans);
      console.log('Setting userLoans state with', formattedLoans.length, 'loans');
      
      setUserLoans(formattedLoans);
    } catch (error) {
      console.error('Error fetching user loans:', error);
    }
  };

  // Fetch user's funded loans
  const fetchFundedLoans = async () => {
    if (!contract || !account) return;
    
    try {
      const loans = await contractUtils.getUserFundedLoans(contract, account);
      const formattedLoans = loans.map(formatLoanData);
      setFundedLoans(formattedLoans);
    } catch (error) {
      console.error('Error fetching funded loans:', error);
    }
  };

  // Manual refresh function to force update all data
  const refreshAllData = async () => {
    console.log('Manual refresh triggered...');
    setIsLoading(true);
    try {
      await fetchActiveLoanRequests();
      await fetchUserLoans();
      await fetchFundedLoans();
      if (account) {
        await refreshWalletBalance();
      }
      toast({
        title: "Data Refreshed",
        description: "All loan data has been updated",
        variant: "default",
      });
    } catch (error) {
      console.error('Error during manual refresh:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new loan request
  const createLoanRequest = async (loanData) => {
    if (!contract) {
      throw new Error('Contract not initialized');
    }

    try {
      setIsLoading(true);
      
      // First, ensure wallet is connected to the contract
      const isConnected = await contractUtils.isWalletConnected(contract, account);
      if (!isConnected) {
        console.log('Connecting wallet to contract...');
        await contractUtils.connectWallet(contract);
        // Wait for wallet connection to be confirmed
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('Wallet connected to contract');
      }

      // Create the loan request
      console.log('Creating loan request with data:', loanData);
      const result = await contractUtils.createLoanRequest(
        contract,
        loanData.amount,
        loanData.duration
      );
      console.log('Loan request created, result:', result);
      console.log('Transaction hash:', result.transactionHash);

      // Wait for transaction confirmation and blockchain state update
      console.log('Waiting for blockchain confirmation...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Force refresh all data to ensure the new loan appears
      console.log('REFRESHING data after loan creation...');
      
      // First refresh - fetch from contract
      await fetchActiveLoanRequests();
      
      // Wait and refresh again
      await new Promise(resolve => setTimeout(resolve, 3000));
      await fetchActiveLoanRequests();
      
      // Also refresh user loans and funded loans
      await fetchUserLoans();
      await fetchFundedLoans();
      await refreshWalletBalance();
      
      // Final verification
      console.log('Final verification...');
      const activeLoans = await contract.getActiveLoanRequests();
      console.log('Active loan IDs after refresh:', activeLoans);

      toast({
        title: "Success",
        description: "Loan request created and visible in marketplace!",
        variant: "default",
      });

      return result;
    } catch (error) {
      console.error('Error creating loan request:', error);
      
      let errorMessage = 'Failed to create loan request';
      if (error.message.includes('Wallet not connected')) {
        errorMessage = 'Please connect your wallet to the contract first';
      } else if (error.message.includes('Amount must be between')) {
        errorMessage = 'Loan amount must be between 0.01 and 1000 ETH';
      } else if (error.message.includes('Duration must be between')) {
        errorMessage = 'Loan duration must be between 7 and 365 days';
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Fund a loan
  const fundLoan = async (loanId, amount) => {
    if (!contract) {
      throw new Error('Contract not initialized');
    }

    try {
      setIsLoading(true);
      
      // First, ensure wallet is connected to the contract
      const isConnected = await contractUtils.isWalletConnected(contract, account);
      if (!isConnected) {
        await contractUtils.connectWallet(contract);
      }

      const result = await contractUtils.fundLoan(contract, loanId, amount);

      toast({
        title: "Success",
        description: "Loan funded successfully!",
        variant: "default",
      });

      // Refresh data and wallet balance
      await fetchActiveLoanRequests();
      await fetchFundedLoans();
      await refreshWalletBalance();

      return result;
    } catch (error) {
      console.error('Error funding loan:', error);
      
      let errorMessage = 'Failed to fund loan';
      if (error.message.includes('Wallet not connected')) {
        errorMessage = 'Please connect your wallet to the contract first';
      } else if (error.message.includes('Cannot fund your own loan')) {
        errorMessage = 'You cannot fund your own loan';
      } else if (error.message.includes('Must send exact loan amount')) {
        errorMessage = 'You must send the exact loan amount';
      } else if (error.message.includes('Loan is already funded')) {
        errorMessage = 'This loan has already been funded';
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Withdraw a loan request
  const withdrawLoanRequest = async (loanId) => {
    try {
      setIsLoading(true);
      
      // If contract is available, try blockchain withdrawal
      if (contract) {
        try {
          const result = await contractUtils.withdrawLoanRequest(contract, loanId);
          
          toast({
            title: "Success",
            description: "Loan request withdrawn successfully!",
            variant: "default",
          });

          // Refresh data and wallet balance
          await fetchActiveLoanRequests();
          await fetchUserLoans();
          await refreshWalletBalance();
          return result;
        } catch (contractError) {
          console.log('Contract withdrawal failed, using local withdrawal:', contractError);
        }
      }
      
      // Fallback: Local withdrawal (remove from state)
      setActiveLoanRequests(prevRequests => 
        prevRequests.filter(request => request.id !== loanId)
      );
      
      setUserLoans(prevLoans => 
        prevLoans.filter(loan => loan.id !== loanId)
      );

      toast({
        title: "Success",
        description: "Loan request withdrawn successfully!",
        variant: "default",
      });

      return { loanId, transactionHash: 'local_withdrawal' };
    } catch (error) {
      console.error('Error withdrawing loan request:', error);
      
      toast({
        title: "Error",
        description: "Failed to withdraw loan request",
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Repay a loan
  const repayLoan = async (loanId, amount) => {
    if (!contract) {
      throw new Error('Contract not initialized');
    }

    try {
      setIsLoading(true);
      
      const result = await contractUtils.repayLoan(contract, loanId, amount);

      toast({
        title: "Success",
        description: "Loan repaid successfully!",
        variant: "default",
      });

      // Refresh data and wallet balance
      await fetchUserLoans();
      await fetchFundedLoans();
      await refreshWalletBalance();

      return result;
    } catch (error) {
      console.error('Error repaying loan:', error);
      
      let errorMessage = 'Failed to repay loan';
      if (error.message.includes('Only the borrower can perform this action')) {
        errorMessage = 'Only the borrower can repay this loan';
      } else if (error.message.includes('Must send exact repayment amount')) {
        errorMessage = 'You must send the exact repayment amount';
      } else if (error.message.includes('Loan is not funded')) {
        errorMessage = 'This loan has not been funded yet';
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Connect wallet to contract
  const connectWalletToContract = async () => {
    if (!contract) {
      toast({
        title: "Contract Error",
        description: "Smart contract not initialized. Please check your connection and refresh the page.",
        variant: "destructive",
      });
      throw new Error('Contract not initialized');
    }

    try {
      await contractUtils.connectWallet(contract);
      toast({
        title: "Success",
        description: "Wallet connected to contract",
        variant: "default",
      });
    } catch (error) {
      console.error('Error connecting wallet to contract:', error);
      toast({
        title: "Error",
        description: "Failed to connect wallet to contract",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Check if wallet is connected to contract
  const isWalletConnectedToContract = async () => {
    if (!contract || !account) return false;
    
    try {
      return await contractUtils.isWalletConnected(contract, account);
    } catch (error) {
      console.error('Error checking wallet connection:', error);
      return false;
    }
  };

  const value = {
    loanRequests,
    userLoans,
    fundedLoans,
    isLoading,
    contract,
    createLoanRequest,
    fundLoan,
    withdrawLoanRequest,
    repayLoan,
    connectWalletToContract,
    isWalletConnectedToContract,
    fetchActiveLoanRequests,
    fetchUserLoans,
    fetchFundedLoans,
    refreshAllData,
  };

  return (
    <LoanContext.Provider value={value}>
      {children}
    </LoanContext.Provider>
  );
}
