import { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '../hooks/use-toast';

const Web3Context = createContext();

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
  const { toast } = useToast();

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
        setAccount(accounts[0]);
        console.log('Successfully connected to account:', accounts[0]);
        
        // Initialize provider for future use
        if (window.ethereum) {
          setProvider(window.ethereum);
        }

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
            setAccount(accounts[0]);
            setProvider(window.ethereum);
            console.log('Already connected to account:', accounts[0]);
            toast({
              title: "Wallet Already Connected",
              description: `Connected to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
              variant: "default",
            });
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
      window.ethereum.on('accountsChanged', (accounts) => {
        console.log('Account changed:', accounts);
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          console.log('Account changed to:', accounts[0]);
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

  const value = {
    account,
    provider,
    isConnecting,
    isMetaMaskInstalled,
    connectWallet,
    disconnectWallet,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
}
