import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import LoanRequestForm from '../components/loan-request-form';
import LoanCard from '../components/loan-card';

export default function BorrowerDashboard() {
  const [loans, setLoans] = useState([]);

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
      dueDate: null
    };
    
    setLoans(prev => [newLoan, ...prev]);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Borrower Dashboard</h2>
        <p className="text-muted-foreground">Manage your loan requests and track active loans</p>
      </div>

      {/* Loan Request Form */}
      <LoanRequestForm onSubmit={handleLoanRequest} />

      {/* Loans Section */}
      <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-6">
        <h3 className="text-xl font-semibold mb-6 flex items-center">
          <i className="fas fa-list text-secondary mr-3"></i>
          My Loans
        </h3>
        
        {loans.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-muted/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-inbox text-muted-foreground text-2xl"></i>
            </div>
            <h4 className="text-lg font-medium mb-2">No loans yet</h4>
            <p className="text-muted-foreground mb-6">Your loan requests and active loans will appear here</p>
          </div>
        ) : (
          /* Loans List */
          <div className="space-y-4">
            {loans.map(loan => (
              <LoanCard key={loan.id} loan={loan} type="borrower" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
