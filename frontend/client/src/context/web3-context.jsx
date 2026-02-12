import { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '../hooks/use-toast';

const Web3Context = createContext();

// Network configurations
const NETWORKS = {
  sepolia: {
    chainId: '0xAA36A7', // 11155111 in hex
    chainName: 'Sepolia Testnet',
    rpcUrls: ['https://rpc.sepolia.org'],
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
  },
  hardhat: {
    chainId: '0x7A69', // 31337 in hex
    chainName: 'Hardhat Local',
    rpcUrls: ['http://127.0.0.1:8545'],
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
  },
};

// Active network - change this to switch networks
const ACTIVE_NETWORK = NETWORKS.sepolia; // or NETWORKS.hardhat for local

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

  const refreshWalletBalance = async () => {
    if (account) {
      const balance = await getWalletBalance(account);
      setWalletBalance(balance);
      return balance;
    }
  };

  // Check if MetaMask is installed
  useEffect(() => {
    const checkMetaMask = () => {
      if (typeof window.ethereum !== 'undefined') {
        setIsMetaMaskInstalled(true);
        setProvider(window.ethereum);
      } else {
        setIsMetaMaskInstalled(false);
        toast({
          title: "MetaMask Not Found",
          description: "Please install MetaMask to use this application",
          variant: "destructive",
        });
      }
    };

    checkMetaMask();
  }, [toast]);

  // Handle account changes
  useEffect(() => {
    if (!provider) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setAccount(null);
        setWalletBalance('0');
        toast({
          title: "Disconnected",
          description: "Wallet disconnected",
          variant: "destructive",
        });
      } else {
        setAccount(accounts[0]);
        getWalletBalance(accounts[0]).then(setWalletBalance);
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    // Set up event listeners
    provider.on('accountsChanged', handleAccountsChanged);
    provider.on('chainChanged', handleChainChanged);

    // Check if already connected
    provider.request({ method: 'eth_accounts' }).then(handleAccountsChanged);

    return () => {
      provider.removeListener('accountsChanged', handleAccountsChanged);
      provider.removeListener('chainChanged', handleChainChanged);
    };
  }, [provider, toast]);

  // Connect wallet function
  const connectWallet = async () => {
    if (!provider) {
      toast({
        title: "MetaMask Not Found",
        description: "Please install MetaMask to connect your wallet",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsConnecting(true);
      
      // Request account access
      const accounts = await provider.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        setAccount(accounts[0]);
        const balance = await getWalletBalance(accounts[0]);
        setWalletBalance(balance);
        
        // Check if on correct network
        const chainId = await provider.request({ method: 'eth_chainId' });
        console.log('🌐 Current network chainId:', chainId);
        console.log('🌐 Expected network chainId:', ACTIVE_NETWORK.chainId);
        console.log('🌐 Network match?', chainId === ACTIVE_NETWORK.chainId);
        
        if (chainId !== ACTIVE_NETWORK.chainId) {
          // Switch to correct network
          try {
            await provider.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: ACTIVE_NETWORK.chainId }],
            });
          } catch (switchError) {
            // This error code indicates that the chain has not been added to MetaMask
            if (switchError.code === 4902) {
              try {
                await provider.request({
                  method: 'wallet_addEthereumChain',
                  params: [ACTIVE_NETWORK],
                });
              } catch (addError) {
                console.error('Error adding network:', addError);
                toast({
                  title: "Network Error",
                  description: "Failed to add Sepolia network to MetaMask",
                  variant: "destructive",
                });
              }
            } else {
              console.error('Error switching network:', switchError);
              toast({
                title: "Network Error",
                description: "Failed to switch to Sepolia network",
                variant: "destructive",
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect wallet",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setWalletBalance('0');
    toast({
      title: "Disconnected",
      description: "Wallet disconnected successfully",
      variant: "default",
    });
  };

  const value = {
    account,
    isConnecting,
    isMetaMaskInstalled,
    isContractDeployed,
    walletBalance,
    connectWallet,
    disconnectWallet,
    refreshWalletBalance,
    provider,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
}
