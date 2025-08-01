import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import LoanRequestForm from '../components/loan-request-form';
import LoanCard from '../components/loan-card';
import StatsCard from '../components/stats-card';

export default function BorrowerDashboard() {
  const [loans, setLoans] = useState([]);
  const [stats, setStats] = useState({
    totalBorrowed: '0.00',
    activeLoans: 0,
    totalRepaid: '0.00',
    creditScore: 750
  });

  const handleLoanRequest = (loanData) => {
    // TODO: Integrate with smart contract to create loan request
    console.log('Loan request submitted:', loanData);
    
    // For now, add to local state (will be replaced with blockchain integration)
    const newLoan = {
      id: Date.now(),
      ...loanData,
      status: 'Pending',
      date: new Date().toLocaleDateString(),
      lender: null,
      dueDate: null,
      borrower: '0x1234...5678' // Placeholder borrower address
    };
    
    setLoans(prev => [newLoan, ...prev]);
    
    // Update stats
    setStats(prev => ({
      ...prev,
      totalBorrowed: (parseFloat(prev.totalBorrowed) + parseFloat(loanData.amount)).toFixed(2),
      activeLoans: prev.activeLoans + 1
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Dashboard Header */}
      <div className="mb-10 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-shimmer">Borrower Dashboard</h1>
            <p className="text-muted-foreground text-lg">Manage your loan requests and track active loans</p>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <div className="glass-card px-4 py-2 rounded-xl">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-400 font-medium">Online</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass-card p-6 rounded-2xl hover:glow-border-animate transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Total Borrowed</p>
                <p className="text-2xl font-bold text-primary">{stats.totalBorrowed} ETH</p>
              </div>
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                <i className="fas fa-hand-holding-dollar text-primary text-xl"></i>
              </div>
            </div>
          </div>
          
          <div className="glass-card p-6 rounded-2xl hover:glow-border-animate transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Active Loans</p>
                <p className="text-2xl font-bold text-secondary">{stats.activeLoans}</p>
              </div>
              <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center">
                <i className="fas fa-clock text-secondary text-xl"></i>
              </div>
            </div>
          </div>
          
          <div className="glass-card p-6 rounded-2xl hover:glow-border-animate transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Total Repaid</p>
                <p className="text-2xl font-bold text-green-400">{stats.totalRepaid} ETH</p>
              </div>
              <div className="w-12 h-12 bg-green-400/20 rounded-xl flex items-center justify-center">
                <i className="fas fa-check-circle text-green-400 text-xl"></i>
              </div>
            </div>
          </div>
          
          <div className="glass-card p-6 rounded-2xl hover:glow-border-animate transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Credit Score</p>
                <p className="text-2xl font-bold text-blue-400">{stats.creditScore}</p>
              </div>
              <div className="w-12 h-12 bg-blue-400/20 rounded-xl flex items-center justify-center">
                <i className="fas fa-star text-blue-400 text-xl"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-2">
          {/* Loan Request Form */}
          <LoanRequestForm onSubmit={handleLoanRequest} />
        </div>
        
        <div className="space-y-6">
          {/* Quick Tips */}
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <i className="fas fa-lightbulb text-yellow-400 mr-3"></i>
              Quick Tips
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <p className="text-muted-foreground">Lower interest rates attract lenders faster</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-secondary rounded-full mt-2"></div>
                <p className="text-muted-foreground">Shorter loan terms reduce overall cost</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                <p className="text-muted-foreground">Clear loan purpose builds trust</p>
              </div>
            </div>
          </div>

          {/* Market Insights */}
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <i className="fas fa-chart-line text-green-400 mr-3"></i>
              Market Insights
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Avg Interest Rate</span>
                  <span className="text-green-400 font-medium">5.2%</span>
                </div>
                <div className="w-full bg-background rounded-full h-2">
                  <div className="bg-green-400 h-2 rounded-full" style={{ width: '52%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Avg Loan Duration</span>
                  <span className="text-blue-400 font-medium">45 days</span>
                </div>
                <div className="w-full bg-background rounded-full h-2">
                  <div className="bg-blue-400 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loans Section */}
      <div className="glass-card-strong rounded-3xl p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold flex items-center">
            <i className="fas fa-wallet text-primary mr-3"></i>
            My Loan Portfolio
          </h2>
          <div className="flex items-center space-x-4">
            <select className="bg-background border border-border rounded-lg px-3 py-2 text-sm">
              <option>All Status</option>
              <option>Pending</option>
              <option>Active</option>
              <option>Completed</option>
            </select>
            <Button className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30">
              <i className="fas fa-download mr-2"></i>
              Export
            </Button>
          </div>
        </div>
        
        {loans.length === 0 ? (
          /* Enhanced Empty State */
          <div className="text-center py-16">
            <div className="relative mb-8">
              <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-slow">
                <i className="fas fa-hand-holding-dollar text-4xl text-primary"></i>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full blur-xl"></div>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-white">Ready to Start Borrowing?</h3>
            <p className="text-muted-foreground mb-8 text-lg max-w-md mx-auto">
              Submit your first loan request above and connect with our community of lenders. 
              Get funded quickly with competitive rates.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="button-advanced bg-gradient-to-r from-primary to-secondary px-6 py-3">
                <i className="fas fa-play mr-2"></i>
                Watch Tutorial
              </Button>
              <Button className="bg-white/5 hover:bg-white/10 border border-white/20 px-6 py-3">
                <i className="fas fa-question-circle mr-2"></i>
                Learn More
              </Button>
            </div>
          </div>
        ) : (
          /* Enhanced Loans List */
          <div className="space-y-6">
            {loans.map((loan, index) => (
              <div key={loan.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <LoanCard loan={loan} type="borrower" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
