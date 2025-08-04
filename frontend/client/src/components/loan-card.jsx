import { Button } from '@/components/ui/button';

export default function LoanCard({ loan, type, onFund }) {
  const truncateAddress = (address) => {
    if (!address) return '0x1234...5678';
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-400/20 text-yellow-400';
      case 'Active':
        return 'bg-blue-400/20 text-blue-400';
      case 'Completed':
        return 'bg-green-400/20 text-green-400';
      default:
        return 'bg-green-400/20 text-green-400';
    }
  };

  const getIndicatorColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-400';
      case 'Active':
        return 'bg-blue-400';
      case 'Completed':
        return 'bg-green-400';
      default:
        return 'bg-green-400';
    }
  };

  return (
    <div className="bg-background/50 border border-gray-600/50 rounded-xl p-4 hover:border-primary/30 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${getIndicatorColor(loan.status || 'New Request')}`}></div>
          <span className="font-medium text-lg">{loan.amount} ETH</span>
          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(loan.status || 'New Request')}`}>
            {loan.status || 'New Request'}
          </span>
        </div>
        <span className="text-sm text-muted-foreground">
          {type === 'request' ? loan.timeAgo || 'Just now' : loan.date || loan.fundedDate}
        </span>
      </div>
      
      <div className={`grid ${type === 'funded' ? 'grid-cols-2 md:grid-cols-5' : 'grid-cols-2 md:grid-cols-4'} gap-4 text-sm mb-4`}>
        <div>
          <span className="text-muted-foreground block">Interest Rate</span>
          <span className="text-green-400 font-medium">{loan.interestRate}%</span>
        </div>
        <div>
          <span className="text-muted-foreground block">Duration</span>
          <span>{loan.duration} days</span>
        </div>
        <div>
          <span className="text-muted-foreground block">
            {type === 'borrower' ? 'Lender' : 'Borrower'}
          </span>
          <span className="font-mono text-xs">
            {truncateAddress(loan.lender || loan.borrower)}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground block">
            {type === 'funded' ? 'Expected Return' : type === 'borrower' ? 'Due Date' : 'Collateral'}
          </span>
          <span className={type === 'funded' ? 'text-green-400' : ''}>
            {loan.expectedReturn || loan.dueDate || `${parseFloat(loan.amount || 0) * 1.5} ETH`}
          </span>
        </div>
        {type === 'funded' && (
          <div>
            <span className="text-muted-foreground block">Due Date</span>
            <span>{loan.dueDate}</span>
          </div>
        )}
      </div>
      
      {type === 'request' && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            <span>{loan.purpose || 'General purpose loan'}</span>
          </div>
          <Button
            onClick={onFund}
            className="bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
          >
            <i className="fas fa-coins mr-2"></i>
            Fund Loan
          </Button>
        </div>
      )}
    </div>
  );
}
