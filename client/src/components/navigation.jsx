import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useWeb3 } from '../context/web3-context';

export default function Navigation() {
  const [location] = useLocation();
  const { account, connectWallet, isConnecting } = useWeb3();

  return (
    <nav className="bg-card/50 backdrop-blur-lg border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer">
              <i className="fas fa-bridge-water text-2xl text-primary"></i>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                FinBridge
              </h1>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/">
              <button className={`transition-colors ${location === '/' ? 'text-white' : 'text-muted-foreground hover:text-white'}`}>
                Home
              </button>
            </Link>
            
            {account ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </span>
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              </div>
            ) : (
              <Button 
                onClick={connectWallet}
                disabled={isConnecting}
                className="bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/25 transition-all"
              >
                <i className="fab fa-ethereum mr-2"></i>
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            )}
          </div>
          
          <button className="md:hidden text-muted-foreground hover:text-white">
            <i className="fas fa-bars text-xl"></i>
          </button>
        </div>
      </div>
    </nav>
  );
}
