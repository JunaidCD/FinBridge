import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useWeb3 } from '../context/web3-context';
import { useLoan } from '../context/loan-context';

export default function RepayLoan() {
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { account, walletBalance } = useWeb3();
  const { userLoans, repayLoan, isLoading } = useLoan();

  // Filter user loans to show only funded and active loans (loans that need repayment)
  const outstandingLoans = userLoans.filter(loan => loan.isFunded && loan.isActive);

  // Calculate due amount for each loan (principal + interest)
  const calculateDueAmount = (loan) => {
    const principal = parseFloat(loan.amount || 0);
    const interestRate = parseFloat(loan.interestRate || 0);
    return (principal * (1 + interestRate / 100)).toFixed(4);
  };

  // Calculate summary stats
  const summaryStats = {
    totalLoans: outstandingLoans.length,
    totalRemainingBalance: outstandingLoans.reduce((sum, loan) => sum + parseFloat(calculateDueAmount(loan)), 0).toFixed(2),
    nextDueDate: outstandingLoans.length > 0 ? outstandingLoans.reduce((earliest, loan) => {
      const dueDate = new Date(new Date(loan.timestamp).getTime() + parseInt(loan.duration) * 24 * 60 * 60 * 1000);
      if (!earliest || dueDate < new Date(earliest)) {
        return dueDate.toLocaleDateString();
      }
      return earliest;
    }, null) : 'N/A'
  };

  const handleRepayClick = (loan) => {
    setSelectedLoan(loan);
    setRepaymentAmount(calculateDueAmount(loan));
    setIsModalOpen(true);
  };

  const handleRepayment = async () => {
    if (!selectedLoan || !repaymentAmount) return;

    setIsProcessing(true);
    
    try {
      // Use the actual repayLoan function from loan context
      await repayLoan(selectedLoan.id, repaymentAmount);
      
      setIsModalOpen(false);
      setSelectedLoan(null);
      setRepaymentAmount('');
    } catch (error) {
      console.error('Repayment failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'overdue': return 'text-red-400';
      case 'completed': return 'text-blue-400';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return 'fas fa-clock';
      case 'overdue': return 'fas fa-exclamation-triangle';
      case 'completed': return 'fas fa-check-circle';
      default: return 'fas fa-question-circle';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-10 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-primary" style={{textShadow: '0 0 20px hsl(var(--primary)), 0 0 40px hsl(var(--secondary))'}}>
              Repay Loan
            </h1>
            <p className="text-muted-foreground text-lg">Manage your outstanding loans and make repayments</p>
          </div>
          
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass-card p-6 rounded-2xl hover:glow-border-animate transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Total Loans Taken</p>
                <p className="text-2xl font-bold text-primary">{summaryStats.totalLoans}</p>
              </div>
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                <i className="fas fa-wallet text-primary text-xl"></i>
              </div>
            </div>
          </div>
          
          <div className="glass-card p-6 rounded-2xl hover:glow-border-animate transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Wallet Balance</p>
                <p className="text-2xl font-bold text-secondary">{account ? walletBalance : '0.0000'} ETH</p>
              </div>
              <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center">
                <i className="fas fa-wallet text-secondary text-xl"></i>
              </div>
            </div>
          </div>
          
          <div className="glass-card p-6 rounded-2xl hover:glow-border-animate transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Total Remaining Balance</p>
                <p className="text-2xl font-bold text-red-400">{summaryStats.totalRemainingBalance} ETH</p>
              </div>
              <div className="w-12 h-12 bg-red-400/20 rounded-xl flex items-center justify-center">
                <i className="fas fa-balance-scale text-red-400 text-xl"></i>
              </div>
            </div>
          </div>
          
          <div className="glass-card p-6 rounded-2xl hover:glow-border-animate transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Next Due Date</p>
                <p className="text-2xl font-bold text-green-400">{summaryStats.nextDueDate}</p>
              </div>
              <div className="w-12 h-12 bg-green-400/20 rounded-xl flex items-center justify-center">
                <i className="fas fa-calendar-alt text-green-400 text-xl"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Outstanding Loans Table */}
      <div className="glass-card-strong rounded-3xl p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold flex items-center">
            <i className="fas fa-credit-card text-primary mr-3"></i>
            Outstanding Loans
          </h2>
          <div className="flex items-center space-x-4">
            <div className="glass-card px-4 py-2 rounded-xl">
              <span className="text-sm text-muted-foreground">
                {outstandingLoans.length} Active Loans
              </span>
            </div>
          </div>
        </div>

        {outstandingLoans.length === 0 ? (
          <div className="text-center py-16">
            <div className="relative mb-8">
              <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-slow">
                <i className="fas fa-credit-card text-4xl text-primary"></i>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full blur-xl"></div>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-white">No Outstanding Loans</h3>
            <p className="text-muted-foreground mb-8 text-lg max-w-md mx-auto">
              You don't have any outstanding loans to repay. Great job staying on top of your finances!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loan ID</TableHead>
                  <TableHead>Lender Wallet</TableHead>
                  <TableHead>Borrowed Amount (ETH)</TableHead>
                  <TableHead>Interest Rate</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Due Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Repay Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outstandingLoans.map((loan) => (
                  <TableRow key={loan.id} className="hover:bg-white/5 transition-colors">
                    <TableCell className="font-medium">#{loan.id}</TableCell>
                    <TableCell className="font-mono text-sm">{loan.lender ? `${loan.lender.slice(0, 6)}...${loan.lender.slice(-4)}` : 'N/A'}</TableCell>
                    <TableCell>{loan.amount} ETH</TableCell>
                    <TableCell>{loan.interestRate}%</TableCell>
                    <TableCell>{new Date(new Date(loan.timestamp).getTime() + parseInt(loan.duration) * 24 * 60 * 60 * 1000).toLocaleDateString()}</TableCell>
                    <TableCell className="font-semibold text-red-400">{calculateDueAmount(loan)} ETH</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <i className="fas fa-clock text-green-400"></i>
                        <span className="capitalize text-green-400">
                          Active
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={() => handleRepayClick(loan)}
                        className="bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/25 px-4 py-2 rounded-xl text-sm font-medium"
                      >
                        <i className="fas fa-credit-card mr-2"></i>
                        Repay Now
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Repayment Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="glass-card-strong border-2 border-primary/20 rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center">
              <i className="fas fa-credit-card text-primary mr-3"></i>
              Repay Loan #{selectedLoan?.id}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Enter the amount you want to repay for this loan.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Loan Details */}
            <div className="glass-card p-4 rounded-xl">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Lender</p>
                  <p className="font-mono">{selectedLoan?.lender ? `${selectedLoan.lender.slice(0, 6)}...${selectedLoan.lender.slice(-4)}` : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Interest Rate</p>
                  <p className="font-semibold">{selectedLoan?.interestRate}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Due Date</p>
                  <p className="font-semibold">{selectedLoan ? new Date(new Date(selectedLoan.timestamp).getTime() + parseInt(selectedLoan.duration) * 24 * 60 * 60 * 1000).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Due Amount</p>
                  <p className="font-semibold text-red-400">{selectedLoan ? calculateDueAmount(selectedLoan) : '0'} ETH</p>
                </div>
              </div>
            </div>

            {/* Repayment Amount Input */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-white flex items-center">
                <i className="fas fa-ethereum text-primary mr-2"></i>
                Repayment Amount (ETH)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={repaymentAmount}
                  onChange={(e) => setRepaymentAmount(e.target.value)}
                  placeholder="0.0000"
                  className="w-full px-4 py-4 pr-20 bg-black/40 border-2 border-primary/50 rounded-xl text-white text-xl font-bold placeholder:text-muted-foreground/80 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:bg-black/60 transition-all duration-300 hover:border-primary/70 shadow-lg backdrop-blur-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  min="0"
                  max={selectedLoan ? calculateDueAmount(selectedLoan) : 0}
                  step="0.0001"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                  <span className="text-primary font-bold text-sm">ETH</span>
                  <i className="fas fa-coins text-secondary"></i>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  Maximum: <span className="text-primary font-semibold">{selectedLoan ? calculateDueAmount(selectedLoan) : '0'} ETH</span>
                </p>
                <button
                  type="button"
                  onClick={() => setRepaymentAmount(selectedLoan ? calculateDueAmount(selectedLoan) : '0')}
                  className="text-xs text-secondary hover:text-primary transition-colors font-medium"
                >
                  Use Max
                </button>
              </div>
            </div>

            {/* Estimated Transaction */}
            <div className="glass-card p-4 rounded-xl">
              <h4 className="font-semibold mb-2 text-white">Transaction Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Repayment Amount:</span>
                  <span className="font-semibold">{repaymentAmount || '0'} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gas Fee (estimated):</span>
                  <span className="font-semibold">0.005 ETH</span>
                </div>
                <div className="border-t border-border/50 pt-2 flex justify-between">
                  <span className="text-white font-semibold">Total:</span>
                  <span className="text-primary font-bold">
                    {(parseFloat(repaymentAmount || 0) + 0.005).toFixed(3)} ETH
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="border-border/50 hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRepayment}
              disabled={isProcessing || !repaymentAmount || parseFloat(repaymentAmount) <= 0}
              className="bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/25 px-6 py-2"
            >
              {isProcessing ? (
                <>
                  <i className="fas fa-spinner animate-spin mr-2"></i>
                  Processing...
                </>
              ) : (
                <>
                  <i className="fas fa-credit-card mr-2"></i>
                  Confirm Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 