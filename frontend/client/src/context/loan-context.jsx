import { createContext, useContext, useState, useEffect } from 'react';
import { useWeb3 } from './web3-context';
import { initializeContract, contractUtils, setupEventListeners, removeEventListeners, formatLoanData, checkContractDeployment } from '../contracts';
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
          // Create ethers BrowserProvider from MetaMask provider
          const ethersProvider = new ethers.BrowserProvider(provider);
          const signer = ethersProvider.getSigner();
          
          // Check if contract is deployed first
          const isDeployed = await checkContractDeployment(ethersProvider);
          if (!isDeployed) {
            console.error('Contract is not deployed! Please deploy the contract first.');
            toast({
              title: "Contract Not Deployed",
              description: "The smart contract is not deployed. Please deploy it first.",
              variant: "destructive",
            });
            setContract(null);
            return;
          }
          
          const loanContract = await initializeContract(ethersProvider, signer);
          console.log('Contract initialized successfully:', loanContract);
          setContract(loanContract);
        } catch (error) {
          console.error('Error initializing contract:', error);
          setContract(null);
        }
      } else {
        console.log('Provider or account not available:', { provider: !!provider, account });
        setContract(null);
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
          // Add delay before refreshing to ensure blockchain state is updated
          setTimeout(() => {
            console.log('Refreshing loan requests after event...');
            fetchActiveLoanRequests();
            fetchUserLoans(); // 🎯 ADD THIS: Refresh user portfolio
          }, 1000);
        },
        onLoanFunded: (fundData) => {
          console.log('Loan funded:', fundData);
          toast({
            title: "Loan Funded",
            description: `${fundData.amount} ETH loan has been funded`,
            variant: "default",
          });
          // Refresh data
          fetchActiveLoanRequests();
          fetchUserLoans();
          fetchFundedLoans();
        },
        onLoanRepaid: (repayData) => {
          console.log('Loan repaid:', repayData);
          toast({
            title: "Loan Repaid",
            description: `${repayData.amount} ETH loan has been repaid`,
            variant: "default",
          });
          // Refresh data
          fetchUserLoans();
          fetchFundedLoans();
        },
        onLoanRequestWithdrawn: (withdrawData) => {
          console.log('Loan request withdrawn:', withdrawData);
          toast({
            title: "Loan Request Withdrawn",
            description: `Loan request #${withdrawData.loanId} has been withdrawn`,
            variant: "default",
          });
          // Refresh data
          fetchActiveLoanRequests();
          fetchUserLoans();
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
      console.log('Contract not available for fetching loan requests');
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('Fetching active loan requests from contract:', contract.target || contract.address);
      
      // First check if contract is properly connected
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
      
      if (!loans || loans.length === 0) {
        console.log('No active loan requests found');
        setLoanRequests([]);
        return;
      }
      
      const formattedLoans = loans.map(formatLoanData);
      console.log('Formatted loans:', formattedLoans);
      console.log('Setting loan requests state with', formattedLoans.length, 'loans');
      setLoanRequests(formattedLoans);
    } catch (error) {
      console.error('Error fetching active loan requests:', error);
      setLoanRequests([]); // Set empty array on error
      toast({
        title: "Error",
        description: "Failed to fetch loan requests: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user's loan requests
  const fetchUserLoans = async () => {
    if (!contract || !account) {
      console.log('❌ Cannot fetch user loans - contract or account missing');
      return;
    }
    
    try {
      console.log('🔄 Fetching user loans...');
      console.log('👤 User account:', account);
      console.log('📋 Contract address:', contract.target || contract.address);
      
      const loans = await contractUtils.getUserLoanRequests(contract, account);
      const formattedLoans = loans.map(formatLoanData);
      
      console.log('📊 Raw loans from contract:', loans);
      console.log('🎯 Formatted loans:', formattedLoans);
      console.log('📈 Setting userLoans state with', formattedLoans.length, 'loans');
      
      setUserLoans(formattedLoans);
    } catch (error) {
      console.error('❌ Error fetching user loans:', error);
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
        await contractUtils.connectWallet(contract);
      }

      // Create the loan request
      console.log('Creating loan request with data:', loanData);
      const result = await contractUtils.createLoanRequest(
        contract,
        loanData.amount,
        loanData.duration
      );
      console.log('Loan request created, result:', result);

      toast({
        title: "Success",
        description: "Loan request created successfully!",
        variant: "default",
      });

      // Add a small delay to ensure blockchain state is updated
      console.log('Waiting for blockchain state update...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Refresh data and wallet balance
      console.log('Refreshing data after loan creation...');
      await fetchActiveLoanRequests();
      await fetchUserLoans();
      await refreshWalletBalance();
      console.log('Data refresh completed');

      return result;
    } catch (error) {
      console.error('Error creating loan request:', error);
      
      let errorMessage = 'Failed to create loan request';
      if (error.message.includes('Wallet not connected')) {
        errorMessage = 'Please connect your wallet to the contract first';
      } else if (error.message.includes('Amount must be greater than 0')) {
        errorMessage = 'Loan amount must be greater than 0';
      } else if (error.message.includes('Interest rate must be between 1 and 100')) {
        errorMessage = 'Interest rate must be between 1% and 100%';
      } else if (error.message.includes('Duration must be greater than 0')) {
        errorMessage = 'Loan duration must be greater than 0';
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
    fetchFundedLoans
  };

  return (
    <LoanContext.Provider value={value}>
      {children}
    </LoanContext.Provider>
  );
}
