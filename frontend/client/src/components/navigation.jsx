import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useWeb3 } from '../context/web3-context';

export default function Navigation() {
  const [location] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { account, connectWallet, isConnecting, isMetaMaskInstalled } = useWeb3();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { path: '/', label: 'Home', icon: 'fa-home' },
    { path: '/borrower', label: 'Borrow', icon: 'fa-hand-holding-dollar' },
    { path: '/lender', label: 'Lend', icon: 'fa-coins' },
    { path: '/repay', label: 'Repay Loan', icon: 'fa-credit-card' },
  ];

  const handleConnectWallet = async () => {
    console.log('Navigation: Connect wallet button clicked');
    try {
      await connectWallet();
    } catch (error) {
      console.error('Error in navigation connect wallet:', error);
    }
  };

  // Debug info - you can remove this later
  useEffect(() => {
    console.log('Navigation Debug Info:');
    console.log('- isMetaMaskInstalled:', isMetaMaskInstalled);
    console.log('- account:', account);
    console.log('- isConnecting:', isConnecting);
    console.log('- window.ethereum:', typeof window.ethereum);
  }, [isMetaMaskInstalled, account, isConnecting]);

  return (
    <nav className={`glass-card-strong sticky top-0 z-50 transition-all duration-300 ${
      isScrolled ? 'backdrop-blur-xl bg-card/80' : 'bg-card/30'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-18 relative">
          {/* Logo - Left */}
          <div className="flex-shrink-0">
            <Link href="/">
              <div className="flex items-center space-x-3 cursor-pointer group">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                    <i className="fas fa-bridge-water text-xl text-white"></i>
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-br from-primary to-secondary rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    FinBridge
                  </h1>
                  <p className="text-xs text-muted-foreground -mt-1">DeFi Lending</p>
                </div>
              </div>
            </Link>
          </div>
          
          {/* Desktop Navigation - Center */}
          <div className="hidden md:flex items-center justify-center flex-1">
            <div className="flex items-center space-x-8">
              {navItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <button className={`relative px-6 py-3 rounded-lg transition-all duration-300 group ${
                    location === item.path 
                      ? 'text-white bg-primary/20 border border-primary/30' 
                      : 'text-muted-foreground hover:text-white hover:bg-white/5'
                  }`}>
                    <i className={`fas ${item.icon} mr-2`}></i>
                    {item.label}
                    {location === item.path && (
                      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary to-secondary"></div>
                    )}
                  </button>
                </Link>
              ))}
            </div>
          </div>
          
          {/* Wallet Connection - Right */}
          <div className="hidden md:flex items-center flex-shrink-0">
            {account ? (
              <div className="flex items-center space-x-4 glass-card px-4 py-2 rounded-xl">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                    <i className="fas fa-wallet text-xs text-white"></i>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-white">
                      {account.slice(0, 6)}...{account.slice(-4)}
                    </span>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-400">Connected</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Button 
                onClick={handleConnectWallet}
                disabled={isConnecting}
                className="button-advanced bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/25 px-6 py-3 rounded-xl font-medium"
                title={!isMetaMaskInstalled ? "Install MetaMask to connect your wallet" : "Click to connect your MetaMask wallet"}
              >
                <i className="fab fa-ethereum mr-2"></i>
                {isConnecting ? (
                  <>
                    <i className="fas fa-spinner animate-spin mr-2"></i>
                    Connecting...
                  </>
                ) : !isMetaMaskInstalled ? (
                  <>
                    <i className="fas fa-download mr-2"></i>
                    Install MetaMask
                  </>
                ) : (
                  'Connect Wallet'
                )}
              </Button>
            )}
          </div>
          
          {/* Mobile menu button */}
          <button 
            className="md:hidden text-muted-foreground hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 glass-card-strong border-t border-border/20 animate-fade-in">
            <div className="px-4 py-6 space-y-4">
              {navItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <button 
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-300 ${
                      location === item.path 
                        ? 'text-white bg-primary/20 border border-primary/30' 
                        : 'text-muted-foreground hover:text-white hover:bg-white/5'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <i className={`fas ${item.icon} mr-3 w-5`}></i>
                    {item.label}
                  </button>
                </Link>
              ))}
              
              <div className="pt-4 border-t border-border/20">
                {account ? (
                  <div className="glass-card p-4 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                        <i className="fas fa-wallet text-white"></i>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-white">
                          {account.slice(0, 8)}...{account.slice(-6)}
                        </span>
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-400">Connected</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button 
                    onClick={handleConnectWallet}
                    disabled={isConnecting}
                    className="w-full button-advanced bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/25 py-3 rounded-xl font-medium"
                    title={!isMetaMaskInstalled ? "Install MetaMask to connect your wallet" : "Click to connect your MetaMask wallet"}
                  >
                    <i className="fab fa-ethereum mr-2"></i>
                    {isConnecting ? (
                      <>
                        <i className="fas fa-spinner animate-spin mr-2"></i>
                        Connecting...
                      </>
                    ) : !isMetaMaskInstalled ? (
                      <>
                        <i className="fas fa-download mr-2"></i>
                        Install MetaMask
                      </>
                    ) : (
                      'Connect Wallet'
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
