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
    totalEarned: '0.00'
  });

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
        dueDate: new Date(Date.now() + parseInt(request.duration) * 24 * 60 * 60 * 1000).toLocaleDateString()
      };
      
      setFundedLoans(prev => [fundedLoan, ...prev]);
      setLoanRequests(prev => prev.filter(r => r.id !== requestId));
      
      // Update stats
      setStats(prev => ({
        totalLent: (parseFloat(prev.totalLent) + parseFloat(request.amount)).toFixed(2),
        activeLoans: prev.activeLoans + 1,
        totalEarned: prev.totalEarned
      }));
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Lender Dashboard</h2>
        <p className="text-muted-foreground">Fund loan requests and manage your lending portfolio</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard
          title="Total Lent"
          value={`${stats.totalLent} ETH`}
          icon="fab fa-ethereum"
          iconBg="bg-primary/20"
          iconColor="text-primary"
        />
        <StatsCard
          title="Active Loans"
          value={stats.activeLoans}
          icon="fas fa-handshake"
          iconBg="bg-secondary/20"
          iconColor="text-secondary"
        />
        <StatsCard
          title="Total Earned"
          value={`${stats.totalEarned} ETH`}
          icon="fas fa-chart-line"
          iconBg="bg-green-400/20"
          iconColor="text-green-400"
        />
      </div>

      {/* Loan Requests Section */}
      <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-6 mb-8">
        <h3 className="text-xl font-semibold mb-6 flex items-center">
          <i className="fas fa-search text-primary mr-3"></i>
          Available Loan Requests
        </h3>
        
        {loanRequests.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-muted/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-search text-muted-foreground text-2xl"></i>
            </div>
            <h4 className="text-lg font-medium mb-2">No loan requests available</h4>
            <p className="text-muted-foreground mb-6">New loan requests from borrowers will appear here</p>
          </div>
        ) : (
          /* Loan Requests List */
          <div className="space-y-4">
            {loanRequests.map(request => (
              <LoanCard 
                key={request.id} 
                loan={request} 
                type="request" 
                onFund={() => handleFundLoan(request.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Funded Loans History */}
      <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-6">
        <h3 className="text-xl font-semibold mb-6 flex items-center">
          <i className="fas fa-history text-secondary mr-3"></i>
          Funded Loans History
        </h3>
        
        {fundedLoans.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-muted/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-history text-muted-foreground text-2xl"></i>
            </div>
            <h4 className="text-lg font-medium mb-2">No funded loans yet</h4>
            <p className="text-muted-foreground mb-6">Your funded loans and their repayment status will appear here</p>
          </div>
        ) : (
          /* Funded Loans List */
          <div className="space-y-4">
            {fundedLoans.map(loan => (
              <LoanCard key={loan.id} loan={loan} type="funded" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
