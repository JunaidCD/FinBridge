import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import StatsCard from '../components/stats-card';
import LoanCard from '../components/loan-card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLoan } from '../context/loan-context';
import { useWeb3 } from '../context/web3-context';
import { useToast } from '../hooks/use-toast';

export default function LenderDashboard() {
  const { loanRequests, fundedLoans, fundLoan, withdrawLoanRequest, isLoading, fetchActiveLoanRequests } = useLoan();
  const { account } = useWeb3();
  const { toast } = useToast();
  
  const [stats, setStats] = useState({
    totalLent: '56.36',
    activeLoans: 3,
    totalEarned: '84.96',
    avgReturn: '6.8'
  });
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [filterSettings, setFilterSettings] = useState({
    creditScore: [600, 850],
    interestRate: [3, 15],
    loanAmount: [0.1, 10],
    duration: [7, 180],
    newOnly: false,
    highYieldOnly: false,
    verifiedOnly: false,
    trendingOnly: false,
    loanPurpose: 'all'
  });

  const handleFundLoan = async (requestId) => {
    if (!account) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your MetaMask wallet first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const loan = loanRequests.find(r => r.id === requestId);
      if (loan) {
        await fundLoan(requestId, loan.amount);
        toast({
          title: "Success!",
          description: `Successfully funded ${loan.amount} ETH loan`,
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error funding loan:', error);
      // Error handling is done in the loan context
    }
  };

  const handleWithdrawLoan = async (requestId) => {
    console.log('handleWithdrawLoan called with ID:', requestId);
    
    if (!account) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your MetaMask wallet first.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Store withdrawn request ID in localStorage for persistence
      const withdrawnRequests = JSON.parse(localStorage.getItem('withdrawnLoanRequests') || '[]');
      withdrawnRequests.push(requestId);
      localStorage.setItem('withdrawnLoanRequests', JSON.stringify(withdrawnRequests));
      
      // Immediately remove from both filtered and original state
      setFilteredLoanRequests(prev => {
        console.log('Removing from filtered requests, current count:', prev.length);
        const newFiltered = prev.filter(request => request.id !== requestId);
        console.log('New filtered count:', newFiltered.length);
        return newFiltered;
      });
      
      // Also call the context method for backend sync (if available)
      try {
        await withdrawLoanRequest(requestId);
      } catch (contextError) {
        console.log('Context withdrawal failed, using local only:', contextError);
      }
      
      toast({
        title: "Success",
        description: "Loan request withdrawn successfully!",
        variant: "default",
      });
      
    } catch (error) {
      console.error('Error withdrawing loan:', error);
      toast({
        title: "Error", 
        description: "Failed to withdraw loan request",
        variant: "destructive",
      });
    }
  };

  const handleFilterChange = (key, value) => {
    setFilterSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Add this state to store filtered loan requests
  const [filteredLoanRequests, setFilteredLoanRequests] = useState([]);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  
  // Update the applyFilters function
  const applyFilters = () => {
    // Apply the filter settings to the loan requests
    console.log('Applying filters:', filterSettings);
    console.log('Current loan requests:', loanRequests);
    
    // Get withdrawn requests from localStorage
    const withdrawnRequests = JSON.parse(localStorage.getItem('withdrawnLoanRequests') || '[]');
    
    const filtered = loanRequests.filter(loan => {
      // First filter out withdrawn requests
      if (withdrawnRequests.includes(loan.id)) {
        return false;
      }
      
      // Check credit score range (mock data for now)
      const creditScore = loan.creditScore || Math.floor(Math.random() * 200) + 600;
      if (creditScore < filterSettings.creditScore[0] || 
          creditScore > filterSettings.creditScore[1]) {
        return false;
      }
      
      // Check interest rate range
      if (parseFloat(loan.interestRate) < filterSettings.interestRate[0] || 
          parseFloat(loan.interestRate) > filterSettings.interestRate[1]) {
        return false;
      }
      
      // Check loan amount range
      if (parseFloat(loan.amount) < filterSettings.loanAmount[0] || 
          parseFloat(loan.amount) > filterSettings.loanAmount[1]) {
        return false;
      }
      
      // Check duration range
      if (parseInt(loan.duration) < filterSettings.duration[0] || 
          parseInt(loan.duration) > filterSettings.duration[1]) {
        return false;
      }
      
      // Check new only option
      if (filterSettings.newOnly) {
        // Assuming "new" means posted within last 24 hours
        if (!loan.timeAgo.includes('hour') && !loan.timeAgo.includes('minute')) {
          return false;
        }
      }
      
      // Check high yield option
      if (filterSettings.highYieldOnly) {
        // Assuming high yield means above 5%
        if (parseFloat(loan.interestRate) < 5) {
          return false;
        }
      }
      
      // Check verified borrowers only
      if (filterSettings.verifiedOnly) {
        // Assuming verified borrowers have higher credit scores
        if (creditScore < 700) {
          return false;
        }
      }
      
      // Check trending loans only
      if (filterSettings.trendingOnly) {
        // Assuming trending loans are recent and have high interest
        if (!loan.timeAgo.includes('hour') && parseFloat(loan.interestRate) < 8) {
          return false;
        }
      }
      
      // Check loan purpose
      if (filterSettings.loanPurpose !== 'all' && !loan.purpose.toLowerCase().includes(filterSettings.loanPurpose)) {
        return false;
      }
      
      return true;
    });
    
    setFilteredLoanRequests(filtered);
    
    // Check if any filters are active and count them
    let filterCount = 0;
    if (filterSettings.creditScore[0] !== 600 || filterSettings.creditScore[1] !== 850) filterCount++;
    if (filterSettings.interestRate[0] !== 3 || filterSettings.interestRate[1] !== 15) filterCount++;
    if (filterSettings.loanAmount[0] !== 0.1 || filterSettings.loanAmount[1] !== 10) filterCount++;
    if (filterSettings.duration[0] !== 7 || filterSettings.duration[1] !== 180) filterCount++;
    if (filterSettings.newOnly) filterCount++;
    if (filterSettings.highYieldOnly) filterCount++;
    if (filterSettings.verifiedOnly) filterCount++;
    if (filterSettings.trendingOnly) filterCount++;
    if (filterSettings.loanPurpose !== 'all') filterCount++;
    
    setHasActiveFilters(filterCount > 0);
    setActiveFilterCount(filterCount);
    console.log('Filters applied. Active filters:', filterCount, 'Filtered results:', filtered.length);
    setIsFilterDialogOpen(false);
  };

  const resetFilters = () => {
    setFilterSettings({
      creditScore: [600, 850],
      interestRate: [3, 15],
      loanAmount: [0.1, 10],
      duration: [7, 180],
      newOnly: false,
      highYieldOnly: false,
      verifiedOnly: false,
      trendingOnly: false,
      loanPurpose: 'all'
    });
    setHasActiveFilters(false);
    setActiveFilterCount(0);
  };

  // Update filtered requests when loanRequests changes
  useEffect(() => {
    // Always filter out withdrawn requests, regardless of other filters
    const withdrawnRequests = JSON.parse(localStorage.getItem('withdrawnLoanRequests') || '[]');
    const filteredByWithdrawal = loanRequests.filter(loan => !withdrawnRequests.includes(loan.id));
    
    if (hasActiveFilters) {
      applyFilters();
    } else {
      setFilteredLoanRequests(filteredByWithdrawal);
    }
  }, [loanRequests, hasActiveFilters]);

  // Initialize filtered requests with withdrawn requests removed
  useEffect(() => {
    const withdrawnRequests = JSON.parse(localStorage.getItem('withdrawnLoanRequests') || '[]');
    const filteredByWithdrawal = loanRequests.filter(loan => !withdrawnRequests.includes(loan.id));
    setFilteredLoanRequests(filteredByWithdrawal);
  }, [loanRequests]);

  // Update stats based on real data
  useEffect(() => {
    if (fundedLoans.length > 0) {
      const totalLent = fundedLoans.reduce((sum, loan) => sum + parseFloat(loan.amount), 0);
      const avgReturn = fundedLoans.reduce((sum, loan) => sum + parseFloat(loan.interestRate), 0) / fundedLoans.length;
      
      setStats({
        totalLent: totalLent.toFixed(2),
        activeLoans: fundedLoans.filter(loan => loan.isActive && loan.isFunded).length,
        totalEarned: (totalLent * (avgReturn / 100)).toFixed(2),
        avgReturn: avgReturn.toFixed(1)
      });
    }
  }, [fundedLoans]);

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
                <Button 
                  onClick={async () => {
                    console.log('Refreshing loan requests...');
                    await fetchActiveLoanRequests();
                    toast({
                      title: "Refreshed",
                      description: "Loan marketplace data has been refreshed",
                      variant: "default",
                    });
                  }}
                  className="bg-background border border-border hover:border-primary rounded-lg px-4 py-2 text-sm flex items-center group transition-all duration-300 hover:shadow-lg hover:shadow-primary/20"
                  disabled={isLoading}
                >
                  <i className={`fas fa-sync-alt mr-2 ${isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-300'}`}></i>
                  Refresh
                </Button>
                <Button 
                  onClick={() => {
                    console.log('Opening filter dialog...');
                    setIsFilterDialogOpen(true);
                  }}
                  className={`bg-background border rounded-lg px-4 py-2 text-sm flex items-center group transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 ${
                    hasActiveFilters 
                      ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20' 
                      : 'border-border hover:border-primary'
                  }`}
                >
                  <i className="fas fa-filter mr-2 group-hover:rotate-180 transition-transform duration-300"></i>
                  Filter Options
                  {hasActiveFilters && (
                    <div className="ml-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center animate-pulse">
                      {activeFilterCount}
                    </div>
                  )}
                </Button>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px] bg-background border border-border hover:border-primary transition-colors">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border">
                    <SelectItem value="newest" className="cursor-pointer">
                      <div className="flex items-center">
                        <i className="fas fa-clock text-primary mr-2"></i>
                        Newest First
                      </div>
                    </SelectItem>
                    <SelectItem value="amount-high" className="cursor-pointer">
                      <div className="flex items-center">
                        <i className="fas fa-sort-amount-up text-green-400 mr-2"></i>
                        Highest Amount
                      </div>
                    </SelectItem>
                    <SelectItem value="amount-low" className="cursor-pointer">
                      <div className="flex items-center">
                        <i className="fas fa-sort-amount-down text-blue-400 mr-2"></i>
                        Lowest Amount
                      </div>
                    </SelectItem>
                    <SelectItem value="interest-high" className="cursor-pointer">
                      <div className="flex items-center">
                        <i className="fas fa-percentage text-yellow-400 mr-2"></i>
                        Highest Interest
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {isLoading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading loan requests...</p>
              </div>
            ) : filteredLoanRequests.length === 0 ? (
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
                  {hasActiveFilters 
                    ? "No loan requests match your current filters. Try adjusting your filter settings."
                    : "The marketplace is currently empty. New loan requests from borrowers will appear here."
                  }
                </p>
                {hasActiveFilters && (
                  <Button 
                    onClick={resetFilters}
                    className="button-advanced bg-gradient-to-r from-secondary to-primary px-6 py-3 mr-4"
                  >
                    <i className="fas fa-times mr-2"></i>
                    Clear Filters
                  </Button>
                )}
                <Button className="button-advanced bg-gradient-to-r from-secondary to-primary px-6 py-3">
                  <i className="fas fa-bell mr-2"></i>
                  Set Alert for New Requests
                </Button>
              </div>
            ) : (
              /* Enhanced Loan Requests List */
              <div className="space-y-6">
                {filteredLoanRequests.map((request, index) => (
                  <div key={request.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="glass-card rounded-2xl p-6 hover:glow-border-animate transition-all duration-300 group relative">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center space-x-4 flex-1 pr-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                            <i className="fas fa-user text-white"></i>
                          </div>
                          <div className="flex-1">
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
                        
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          {/* Withdraw button for borrowers */}
                          {account && 
                           request.borrower && 
                           request.borrower.toLowerCase() === account.toLowerCase() && 
                           !request.isFunded && 
                           request.isActive && (
                            <Button
                              onClick={() => handleWithdrawLoan(request.id)}
                              className="group/btn relative overflow-hidden bg-gradient-to-r from-red-500/10 via-red-600/15 to-red-500/10 hover:from-red-500/20 hover:via-red-600/25 hover:to-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-400/60 transition-all duration-500 ease-out px-3 py-2 rounded-lg shadow-lg hover:shadow-red-500/20 hover:shadow-xl transform hover:scale-[1.05] active:scale-[0.95]"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-400/10 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 ease-out"></div>
                              <div className="relative flex items-center space-x-1">
                                <i className="fas fa-trash-alt text-xs group-hover/btn:animate-pulse"></i>
                                <span className="text-xs font-medium tracking-wide">Withdraw</span>
                              </div>
                              <div className="absolute inset-0 rounded-lg bg-red-500/5 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                            </Button>
                          )}
                          
                          {/* Fund button for non-borrowers */}
                          {(!account || 
                            !request.borrower || 
                            request.borrower.toLowerCase() !== account.toLowerCase()) && (
                            <Button
                              onClick={() => handleFundLoan(request.id)}
                              disabled={!account}
                              className="button-advanced bg-gradient-to-r from-primary to-secondary hover:shadow-xl hover:shadow-primary/30 px-6 py-3"
                            >
                              <i className="fas fa-coins mr-2"></i>
                              Fund Loan
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground block">Duration</span>
                          <span className="text-white font-medium">{request.duration} days</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Expected Return</span>
                          <span className="text-green-400 font-medium">
                            {request.expectedReturn}
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
        
        {isLoading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading funded loans...</p>
          </div>
        ) : fundedLoans.length === 0 ? (
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

      {/* Enhanced Filter Dialog */}
      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center">
              <i className="fas fa-filter mr-3"></i>
              Advanced Filter Options
            </DialogTitle>
            <p className="text-muted-foreground mt-2">Customize your loan discovery experience</p>
          </DialogHeader>
          
          <div className="py-6">
            <Tabs defaultValue="criteria" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="criteria">Filter Criteria</TabsTrigger>
                <TabsTrigger value="options">Options</TabsTrigger>
                <TabsTrigger value="presets">Presets</TabsTrigger>
              </TabsList>
              
              <TabsContent value="criteria" className="space-y-6">
                {/* Credit Score Filter */}
                <div className="p-6 border rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-lg font-semibold">Credit Score Range</label>
                    <span className="text-sm bg-primary/20 text-primary px-3 py-1 rounded-full">
                      {filterSettings.creditScore[0]} - {filterSettings.creditScore[1]}
                    </span>
                  </div>
                  <Slider
                    value={filterSettings.creditScore}
                    min={300}
                    max={850}
                    step={10}
                    onValueChange={(value) => handleFilterChange('creditScore', value)}
                    className="my-6"
                    minStepsBetweenThumbs={1}
                  />
                </div>
                
                {/* Interest Rate Filter */}
                <div className="p-6 border rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-lg font-semibold">Interest Rate Range</label>
                    <span className="text-sm bg-green-400/20 text-green-400 px-3 py-1 rounded-full">
                      {filterSettings.interestRate[0]}% - {filterSettings.interestRate[1]}%
                    </span>
                  </div>
                  <Slider
                    value={filterSettings.interestRate}
                    min={1}
                    max={50}
                    step={0.5}
                    onValueChange={(value) => handleFilterChange('interestRate', value)}
                    className="my-6"
                    minStepsBetweenThumbs={1}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="options" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-lg">New Requests Only</p>
                        <p className="text-sm text-muted-foreground mt-1">Display only requests posted in the last 24 hours</p>
                      </div>
                      <Switch
                        checked={filterSettings.newOnly}
                        onCheckedChange={(checked) => handleFilterChange('newOnly', checked)}
                      />
                    </div>
                  </div>
                  
                  <div className="p-6 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-lg">High Yield Opportunities</p>
                        <p className="text-sm text-muted-foreground mt-1">Show loans with above-average interest rates</p>
                      </div>
                      <Switch
                        checked={filterSettings.highYieldOnly}
                        onCheckedChange={(checked) => handleFilterChange('highYieldOnly', checked)}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="presets" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    className="p-6 border rounded-lg cursor-pointer hover:border-primary"
                    onClick={() => {
                      setFilterSettings({
                        creditScore: [700, 850],
                        interestRate: [5, 12],
                        loanAmount: [0.5, 5],
                        duration: [30, 90],
                        newOnly: false,
                        highYieldOnly: true,
                        verifiedOnly: true
                      });
                    }}
                  >
                    <h3 className="font-semibold text-lg">Conservative</h3>
                    <p className="text-sm text-muted-foreground mt-1">Low risk, verified borrowers with good credit scores</p>
                  </div>
                  
                  <div 
                    className="p-6 border rounded-lg cursor-pointer hover:border-primary"
                    onClick={() => {
                      setFilterSettings({
                        creditScore: [600, 800],
                        interestRate: [8, 18],
                        loanAmount: [1, 8],
                        duration: [15, 60],
                        newOnly: true,
                        highYieldOnly: true,
                        verifiedOnly: false
                      });
                    }}
                  >
                    <h3 className="font-semibold text-lg">High Yield</h3>
                    <p className="text-sm text-muted-foreground mt-1">Maximum returns with higher risk tolerance</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <DialogFooter className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={resetFilters}
            >
              Reset Filters
            </Button>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsFilterDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={applyFilters}
              >
                Apply Filters
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}