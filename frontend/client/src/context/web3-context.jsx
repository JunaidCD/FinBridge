import { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '../hooks/use-toast';
import { checkContractDeployment } from '../contracts/index.js';

const Web3Context = createContext();

// Hardhat local network configuration
const HARDHAT_NETWORK = {
  chainId: '0x7A69', // 31337 in hex
  chainName: 'Hardhat Local',
  rpcUrls: ['http://127.0.0.1:8545'],
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
};

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [provider, setProvider] = useState(null);
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
  const [isContractDeployed, setIsContractDeployed] = useState(false);
  const [walletBalance, setWalletBalance] = useState('0');
  const { toast } = useToast();

  const getWalletBalance = async (address) => {
    try {
      if (!window.ethereum || !address) return '0';
      
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      });
      
      // Convert from wei to ETH
      const balanceInEth = parseInt(balance, 16) / Math.pow(10, 18);
      return balanceInEth.toFixed(4);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      return '0';
    }
  };

  const switchToHardhatNetwork = async () => {
    try {
      // Try to switch to Hardhat network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: HARDHAT_NETWORK.chainId }],
      });
      return true;
    } catch (switchError) {
      // If network doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [HARDHAT_NETWORK],
          });
          return true;
        } catch (addError) {
          console.error('Error adding Hardhat network:', addError);
          toast({
            title: "Network Setup Failed",
            description: "Failed to add Hardhat local network. Please add it manually.",
            variant: "destructive",
          });
          return false;
        }
      } else {
        console.error('Error switching to Hardhat network:', switchError);
        toast({
          title: "Network Switch Failed",
          description: "Please manually switch to Hardhat Local network in MetaMask.",
          variant: "destructive",
        });
        return false;
      }
    }
  };

  const connectWallet = async () => {
    console.log('Connect wallet called');
    console.log('window.ethereum:', typeof window.ethereum);
    
    // Check if MetaMask is installed
    if (typeof window.ethereum === 'undefined') {
      console.log('MetaMask not found, opening download page');
      // Open MetaMask installation page
      window.open('https://metamask.io/download/', '_blank');
      toast({
        title: "MetaMask Not Found",
        description: "Please install MetaMask to use this DApp. Opening download page...",
        variant: "destructive",
      });
      return;
    }

    console.log('MetaMask found, checking if unlocked...');

    // Check if MetaMask is locked
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      console.log('Current accounts:', accounts);
      if (accounts.length === 0) {
        // MetaMask is installed but not unlocked - this will trigger the MetaMask popup
        console.log('MetaMask is locked, requesting connection...');
      }
    } catch (error) {
      console.error('Error checking MetaMask status:', error);
    }

    setIsConnecting(true);
    toast({
      title: "Connecting to MetaMask",
      description: "Please approve the connection in your MetaMask wallet.",
    });

    try {
      console.log('Requesting account access...');
      // Request account access - this will open MetaMask popup
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      
      console.log('Received accounts:', accounts);
      
      if (accounts.length > 0) {
        // Check if we're on the correct network
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        console.log('Current chain ID:', chainId);
        
        if (chainId !== HARDHAT_NETWORK.chainId) {
          console.log('Wrong network detected, switching to Hardhat...');
          toast({
            title: "Switching Network",
            description: "Switching to Hardhat local network...",
          });
          
          const networkSwitched = await switchToHardhatNetwork();
          if (!networkSwitched) {
            setIsConnecting(false);
            return;
          }
        }
        
        setAccount(accounts[0]);
        console.log('Successfully connected to account:', accounts[0]);
        
        // Initialize provider for future use
        if (window.ethereum) {
          setProvider(window.ethereum);
        }

        // Fetch wallet balance
        const balance = await getWalletBalance(accounts[0]);
        setWalletBalance(balance);

        toast({
          title: "Wallet Connected!",
          description: `Successfully connected to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
          variant: "default",
        });
      } else {
        throw new Error('No accounts found');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      
      if (error.code === 4001) {
        // User rejected the connection
        toast({
          title: "Connection Rejected",
          description: "You rejected the connection. Please try again and approve the connection in MetaMask.",
          variant: "destructive",
        });
      } else if (error.code === -32002) {
        // Request already pending
        toast({
          title: "Request Pending",
          description: "A connection request is already pending. Please check MetaMask and approve the connection.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: `Failed to connect wallet: ${error.message}. Please make sure MetaMask is unlocked and try again.`,
          variant: "destructive",
        });
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setWalletBalance('0');
    console.log('Wallet disconnected');
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected.",
      variant: "default",
    });
  };

  // Check if wallet is already connected on page load
  useEffect(() => {
    const checkConnection = async () => {
      console.log('Checking MetaMask installation...');
      console.log('window.ethereum:', typeof window.ethereum);
      
      if (typeof window.ethereum !== 'undefined') {
        console.log('MetaMask is installed');
        setIsMetaMaskInstalled(true);
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts',
          });
          console.log('Found accounts on load:', accounts);
          if (accounts.length > 0) {
            // Check if we're on the correct network
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            console.log('Current chain ID on load:', chainId);
            
            if (chainId !== HARDHAT_NETWORK.chainId) {
              console.log('Wrong network detected on load');
              toast({
                title: "Wrong Network",
                description: "Please switch to Hardhat Local network to use the DApp.",
                variant: "destructive",
              });
            } else {
              setAccount(accounts[0]);
              setProvider(window.ethereum);
              console.log('Already connected to account:', accounts[0]);
              
              // Fetch wallet balance
              const balance = await getWalletBalance(accounts[0]);
              setWalletBalance(balance);
              
              // Check contract deployment
              const contractDeployed = await checkContractDeployment(window.ethereum);
              setIsContractDeployed(contractDeployed);
              
              toast({
                title: "Wallet Already Connected",
                description: `Connected to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
                variant: "default",
              });
              
              if (contractDeployed) {
                toast({
                  title: "Contract Ready!",
                  description: "Smart contract is deployed and accessible.",
                  variant: "default",
                });
              } else {
                toast({
                  title: "Contract Issue",
                  description: "Contract not found. Please check your network connection.",
                  variant: "destructive",
                });
              }
            }
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      } else {
        console.log('MetaMask is not installed');
        setIsMetaMaskInstalled(false);
      }
    };

    // Add a small delay to ensure MetaMask is fully loaded
    setTimeout(checkConnection, 1000);

    // Listen for account changes
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', async (accounts) => {
        console.log('Account changed:', accounts);
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          console.log('Account changed to:', accounts[0]);
          
          // Fetch balance for new account
          const balance = await getWalletBalance(accounts[0]);
          setWalletBalance(balance);
          
          toast({
            title: "Account Changed",
            description: `Switched to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
            variant: "default",
          });
        } else {
          disconnectWallet();
          console.log('Account disconnected');
        }
      });

      window.ethereum.on('chainChanged', (chainId) => {
        console.log('Chain changed to:', chainId);
        toast({
          title: "Network Changed",
          description: "Network changed. Reloading page...",
          variant: "default",
        });
        // Reload the page on chain change
        window.location.reload();
      });

      window.ethereum.on('connect', (connectInfo) => {
        console.log('MetaMask connected:', connectInfo);
        toast({
          title: "MetaMask Connected",
          description: "MetaMask wallet is now connected.",
          variant: "default",
        });
      });

      window.ethereum.on('disconnect', (error) => {
        console.log('MetaMask disconnected:', error);
        disconnectWallet();
      });
    }

    return () => {
      if (typeof window.ethereum !== 'undefined') {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
        window.ethereum.removeAllListeners('connect');
        window.ethereum.removeAllListeners('disconnect');
      }
    };
  }, []);

  const refreshWalletBalance = async () => {
    if (account) {
      const balance = await getWalletBalance(account);
      setWalletBalance(balance);
    }
  };

  const value = {
    account,
    provider,
    isConnecting,
    isMetaMaskInstalled,
    isContractDeployed,
    walletBalance,
    connectWallet,
    disconnectWallet,
    switchToHardhatNetwork,
    getWalletBalance,
    refreshWalletBalance,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
}
