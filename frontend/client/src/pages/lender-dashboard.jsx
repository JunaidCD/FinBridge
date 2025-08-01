import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import StatsCard from '../components/stats-card';
import LoanCard from '../components/loan-card';

export default function LenderDashboard() {
  const [loanRequests, setLoanRequests] = useState([]);
  const [fundedLoans, setFundedLoans] = useState([]);
  const [stats, setStats] = useState({
    totalLent: '0.00',
    activeLoans: 0,
    totalEarned: '0.00',
    avgReturn: '6.8'
  });
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const handleFundLoan = (requestId) => {
    // TODO: Integrate with smart contract to fund loan
    console.log('Funding loan:', requestId);
    
    // For now, move from requests to funded (will be replaced with blockchain integration)
    const request = loanRequests.find(r => r.id === requestId);
    if (request) {
      const fundedLoan = {
        ...request,
        status: 'Active',
        fundedDate: new Date().toLocaleDateString(),
        expectedReturn: (parseFloat(request.amount) * (1 + parseFloat(request.interestRate) / 100)).toFixed(3),
        dueDate: new Date(Date.now() + parseInt(request.duration) * 24 * 60 * 60 * 1000).toLocaleDateString(),
        lender: '0x9876...4321' // Placeholder lender address
      };
      
      setFundedLoans(prev => [fundedLoan, ...prev]);
      setLoanRequests(prev => prev.filter(r => r.id !== requestId));
      
      // Update stats
      setStats(prev => ({
        totalLent: (parseFloat(prev.totalLent) + parseFloat(request.amount)).toFixed(2),
        activeLoans: prev.activeLoans + 1,
        totalEarned: prev.totalEarned,
        avgReturn: prev.avgReturn
      }));
    }
  };

  // Sample loan requests for demonstration
  useEffect(() => {
    const sampleRequests = [
      {
        id: 1,
        amount: '2.5',
        interestRate: '5.5',
        duration: '60',
        collateral: 'ETH',
        purpose: 'DeFi farming capital',
        borrower: '0x1234...5678',
        timeAgo: '2 hours ago',
        creditScore: 780
      },
      {
        id: 2,
        amount: '1.8',
        interestRate: '6.2',
        duration: '30',
        collateral: 'USDC',
        purpose: 'NFT purchase',
        borrower: '0x5678...9012',
        timeAgo: '5 hours ago',
        creditScore: 720
      },
      {
        id: 3,
        amount: '3.2',
        interestRate: '4.8',
        duration: '90',
        collateral: 'ETH',
        purpose: 'Business expansion',
        borrower: '0x9012...3456',
        timeAgo: '1 day ago',
        creditScore: 850
      }
    ];
    setLoanRequests(sampleRequests);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Dashboard Header */}
      <div className="mb-10 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-shimmer">Lender Dashboard</h1>
            <p className="text-muted-foreground text-lg">Fund loan requests and maximize your returns</p>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <div className="glass-card px-4 py-2 rounded-xl">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-400 font-medium">Market Active</span>
              </div>
            </div>
            <Button className="button-advanced bg-gradient-to-r from-primary to-secondary px-4 py-2">
              <i className="fas fa-plus mr-2"></i>
              Auto-Lend
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass-card p-6 rounded-2xl hover:glow-border-animate transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Total Lent</p>
                <p className="text-2xl font-bold text-primary">{stats.totalLent} ETH</p>
                <p className="text-xs text-green-400">+12.5% this month</p>
              </div>
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                <i className="fab fa-ethereum text-primary text-xl"></i>
              </div>
            </div>
          </div>
          
          <div className="glass-card p-6 rounded-2xl hover:glow-border-animate transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Active Loans</p>
                <p className="text-2xl font-bold text-secondary">{stats.activeLoans}</p>
                <p className="text-xs text-blue-400">3 due this week</p>
              </div>
              <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center">
                <i className="fas fa-handshake text-secondary text-xl"></i>
              </div>
            </div>
          </div>
          
          <div className="glass-card p-6 rounded-2xl hover:glow-border-animate transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Total Earned</p>
                <p className="text-2xl font-bold text-green-400">{stats.totalEarned} ETH</p>
                <p className="text-xs text-green-400">+{stats.avgReturn}% APY</p>
              </div>
              <div className="w-12 h-12 bg-green-400/20 rounded-xl flex items-center justify-center">
                <i className="fas fa-chart-line text-green-400 text-xl"></i>
              </div>
            </div>
          </div>
          
          <div className="glass-card p-6 rounded-2xl hover:glow-border-animate transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Avg Return</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.avgReturn}%</p>
                <p className="text-xs text-yellow-400">Above market avg</p>
              </div>
              <div className="w-12 h-12 bg-yellow-400/20 rounded-xl flex items-center justify-center">
                <i className="fas fa-percentage text-yellow-400 text-xl"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Market Overview */}
      <div className="grid lg:grid-cols-4 gap-6 mb-10">
        <div className="lg:col-span-3">
          {/* Loan Requests Section */}
          <div className="glass-card-strong rounded-3xl p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold flex items-center">
                <i className="fas fa-store text-primary mr-3"></i>
                Loan Marketplace
              </h2>
              <div className="flex items-center space-x-4">
                <select 
                  className="bg-background border border-border rounded-lg px-3 py-2 text-sm"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Requests</option>
                  <option value="high-score">High Credit Score</option>
                  <option value="low-risk">Low Risk</option>
                  <option value="high-yield">High Yield</option>
                </select>
                <select 
                  className="bg-background border border-border rounded-lg px-3 py-2 text-sm"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="amount-high">Highest Amount</option>
                  <option value="amount-low">Lowest Amount</option>
                  <option value="interest-high">Highest Interest</option>
                </select>
              </div>
            </div>
            
            {loanRequests.length === 0 ? (
              /* Enhanced Empty State */
              <div className="text-center py-16">
                <div className="relative mb-8">
                  <div className="w-32 h-32 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-slow">
                    <i className="fas fa-search text-4xl text-secondary"></i>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-primary/10 rounded-full blur-xl"></div>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">No Loan Requests Available</h3>
                <p className="text-muted-foreground mb-8 text-lg max-w-md mx-auto">
                  The marketplace is currently empty. New loan requests from borrowers will appear here.
                </p>
                <Button className="button-advanced bg-gradient-to-r from-secondary to-primary px-6 py-3">
                  <i className="fas fa-bell mr-2"></i>
                  Set Alert for New Requests
                </Button>
              </div>
            ) : (
              /* Enhanced Loan Requests List */
              <div className="space-y-6">
                {loanRequests.map((request, index) => (
                  <div key={request.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="glass-card rounded-2xl p-6 hover:glow-border-animate transition-all duration-300 group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                            <i className="fas fa-user text-white"></i>
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-bold text-xl text-white">{request.amount} ETH</span>
                              <span className="px-2 py-1 bg-green-400/20 text-green-400 rounded-lg text-xs font-medium">
                                {request.interestRate}% APR
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span>By {request.borrower}</span>
                              <span>•</span>
                              <span>{request.timeAgo}</span>
                              <span>•</span>
                              <span className="flex items-center">
                                <i className="fas fa-star text-yellow-400 mr-1"></i>
                                {request.creditScore}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleFundLoan(request.id)}
                          className="button-advanced bg-gradient-to-r from-primary to-secondary hover:shadow-xl hover:shadow-primary/30 px-6 py-3"
                        >
                          <i className="fas fa-coins mr-2"></i>
                          Fund Loan
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground block">Duration</span>
                          <span className="text-white font-medium">{request.duration} days</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Collateral</span>
                          <span className="text-white font-medium">{request.collateral}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Expected Return</span>
                          <span className="text-green-400 font-medium">
                            {(parseFloat(request.amount) * (1 + parseFloat(request.interestRate) / 100)).toFixed(3)} ETH
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Risk Level</span>
                          <span className={`font-medium ${request.creditScore > 800 ? 'text-green-400' : request.creditScore > 700 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {request.creditScore > 800 ? 'Low' : request.creditScore > 700 ? 'Medium' : 'High'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-border/20">
                        <p className="text-muted-foreground text-sm">
                          <strong>Purpose:</strong> {request.purpose}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Market Analytics */}
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <i className="fas fa-chart-bar text-blue-400 mr-3"></i>
              Market Analytics
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Total Pool Size</span>
                  <span className="text-blue-400 font-medium">847.2 ETH</span>
                </div>
                <div className="w-full bg-background rounded-full h-2">
                  <div className="bg-blue-400 h-2 rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Avg Interest Rate</span>
                  <span className="text-green-400 font-medium">5.8%</span>
                </div>
                <div className="w-full bg-background rounded-full h-2">
                  <div className="bg-green-400 h-2 rounded-full" style={{ width: '58%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Success Rate</span>
                  <span className="text-yellow-400 font-medium">94.5%</span>
                </div>
                <div className="w-full bg-background rounded-full h-2">
                  <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '95%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <i className="fas fa-rocket text-purple-400 mr-3"></i>
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Button className="w-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 justify-start">
                <i className="fas fa-robot mr-3"></i>
                Enable Auto-Lending
              </Button>
              <Button className="w-full bg-secondary/20 hover:bg-secondary/30 text-secondary border border-secondary/30 justify-start">
                <i className="fas fa-cog mr-3"></i>
                Set Risk Preferences
              </Button>
              <Button className="w-full bg-green-400/20 hover:bg-green-400/30 text-green-400 border border-green-400/30 justify-start">
                <i className="fas fa-download mr-3"></i>
                Export Portfolio
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Funded Loans History */}
      <div className="glass-card-strong rounded-3xl p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold flex items-center">
            <i className="fas fa-history text-secondary mr-3"></i>
            My Lending Portfolio
          </h2>
          <div className="flex items-center space-x-4">
            <Button className="bg-secondary/20 hover:bg-secondary/30 text-secondary border border-secondary/30">
              <i className="fas fa-chart-pie mr-2"></i>
              Analytics
            </Button>
          </div>
        </div>
        
        {fundedLoans.length === 0 ? (
          /* Enhanced Empty State */
          <div className="text-center py-16">
            <div className="relative mb-8">
              <div className="w-32 h-32 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-slow">
                <i className="fas fa-piggy-bank text-4xl text-green-400"></i>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-blue-400/10 rounded-full blur-xl"></div>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-white">Start Your Lending Journey</h3>
            <p className="text-muted-foreground mb-8 text-lg max-w-md mx-auto">
              Fund your first loan to begin earning returns. Your lending history and portfolio performance will appear here.
            </p>
            <Button className="button-advanced bg-gradient-to-r from-green-400 to-blue-400 px-6 py-3">
              <i className="fas fa-plus mr-2"></i>
              Fund First Loan
            </Button>
          </div>
        ) : (
          /* Enhanced Funded Loans List */
          <div className="space-y-6">
            {fundedLoans.map((loan, index) => (
              <div key={loan.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <LoanCard loan={loan} type="funded" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
