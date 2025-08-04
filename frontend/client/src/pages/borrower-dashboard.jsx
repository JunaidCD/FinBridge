import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import LoanRequestForm from '../components/loan-request-form';
import LoanCard from '../components/loan-card';
import StatsCard from '../components/stats-card';

export default function BorrowerDashboard() {
  const [loans, setLoans] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const exportDropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);
  const [stats, setStats] = useState({
    totalBorrowed: '34.7',
    activeLoans: 2,
    totalRepaid: '36.84',
    creditScore: 850
  });

  const handleLoanRequest = (loanData) => {
    // TODO: Integrate with smart contract to create loan request
    console.log('Loan request submitted:', loanData);
    
    // For now, add to local state (will be replaced with blockchain integration)
    const newLoan = {
      id: Date.now(),
      ...loanData,
      status: 'pending',
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

  // Initialize with mock data
  useEffect(() => {
    setLoans([
      {
        id: 1,
        amount: 5000,
        purpose: "Business Expansion",
        interestRate: 8.5,
        duration: 90,
        status: "active",
        monthlyPayment: 435.85,
        nextPayment: "2024-02-15",
        totalPaid: 1743.40,
        remainingBalance: 3256.60,
        lender: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b7",
        dueDate: "September 30, 2025"
      },
      {
        id: 2,
        amount: 2500,
        purpose: "Equipment Purchase",
        interestRate: 7.2,
        duration: 150,
        status: "pending",
        monthlyPayment: 428.33,
        nextPayment: "N/A",
        totalPaid: 0,
        remainingBalance: 2500,
        lender: "0x8ba1f109551bD432803012645Hac136c772c3c7d",
        dueDate: "November 30, 2025"
      }
    ]);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target)) {
        setIsExportDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setIsStatusDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Export functionality
  const handleExport = async (format) => {
    setIsExporting(true);
    setIsExportDropdownOpen(false);
    
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const filteredLoans = statusFilter === 'all' ? loans : loans.filter(loan => loan.status === statusFilter);
      
      if (format === 'csv') {
        exportToCSV(filteredLoans);
      } else if (format === 'pdf') {
        exportToPDF(filteredLoans);
      } else if (format === 'excel') {
        exportToExcel(filteredLoans);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = (data) => {
    const headers = ['ID', 'Amount', 'Purpose', 'Interest Rate', 'Term', 'Status', 'Monthly Payment', 'Total Paid', 'Remaining Balance'];
    const csvContent = [
      headers.join(','),
      ...data.map(loan => [
        loan.id,
        loan.amount,
        `"${loan.purpose}"`,
        loan.interestRate,
        loan.term,
        loan.status,
        loan.monthlyPayment,
        loan.totalPaid,
        loan.remainingBalance
      ].join(','))
    ].join('\n');
    
    downloadFile(csvContent, 'loan-portfolio.csv', 'text/csv');
  };

  const exportToPDF = (data) => {
    // Simulate PDF export
    console.log('Exporting to PDF:', data);
    // In a real app, you'd use a library like jsPDF
  };

  const exportToExcel = (data) => {
    // Simulate Excel export
    console.log('Exporting to Excel:', data);
    // In a real app, you'd use a library like xlsx
  };

  const downloadFile = (content, filename, contentType) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filter loans based on status
  const filteredLoans = statusFilter === 'all' ? loans : loans.filter(loan => loan.status === statusFilter);

  // Get status counts
  const statusCounts = {
    all: loans.length,
    pending: loans.filter(loan => loan.status === 'pending').length,
    active: loans.filter(loan => loan.status === 'active').length,
    completed: loans.filter(loan => loan.status === 'completed').length
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Dashboard Header */}
      <div className="mb-10 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-primary" style={{textShadow: '0 0 20px hsl(var(--primary)), 0 0 40px hsl(var(--secondary))'}}>Borrower Dashboard</h1>
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
            {/* Advanced Status Filter Dropdown */}
            <div className="relative" ref={statusDropdownRef}>
              <div className="group">
                <button
                  onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                  className="bg-slate-800/90 border-2 border-slate-700/80 hover:border-primary/60 rounded-xl px-4 py-2.5 text-sm font-medium text-white hover:text-primary focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none transition-all duration-300 cursor-pointer min-w-[160px] backdrop-blur-sm hover:shadow-lg hover:shadow-primary/20 group-hover:scale-[1.02] flex items-center justify-between hover:bg-slate-700/90"
                  title="Filter loans by status"
                >
                  <div className="flex items-center">
                    <i className="fas fa-filter text-primary mr-2 text-xs"></i>
                    <span className="capitalize font-semibold">
                      {statusFilter === 'all' ? 'All Status' : statusFilter}
                    </span>
                    {statusCounts[statusFilter] > 0 && (
                      <span className="ml-2 bg-primary/30 text-primary text-xs px-2 py-0.5 rounded-full font-bold border border-primary/40">
                        {statusCounts[statusFilter]}
                      </span>
                    )}
                  </div>
                  <i className={`fas fa-chevron-down text-slate-400 text-xs transition-transform duration-200 ${isStatusDropdownOpen ? 'rotate-180' : ''}`}></i>
                </button>
                
                {/* Status Dropdown Menu */}
                {isStatusDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-full bg-slate-800/95 backdrop-blur-md border-2 border-slate-700/80 rounded-xl shadow-2xl shadow-black/40 z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                    {[
                      { value: 'all', label: 'All Status', icon: 'fas fa-list', color: 'text-slate-300' },
                      { value: 'pending', label: 'Pending', icon: 'fas fa-clock', color: 'text-yellow-400' },
                      { value: 'active', label: 'Active', icon: 'fas fa-play-circle', color: 'text-green-400' },
                      { value: 'completed', label: 'Completed', icon: 'fas fa-check-circle', color: 'text-blue-400' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setStatusFilter(option.value);
                          setIsStatusDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-slate-700/80 transition-colors duration-150 flex items-center justify-between group border-b border-slate-700/50 last:border-b-0 ${
                          statusFilter === option.value ? 'bg-primary/20 border-l-4 border-primary text-white' : 'text-slate-200'
                        }`}
                      >
                        <div className="flex items-center">
                          <i className={`${option.icon} ${option.color} mr-3 text-sm group-hover:scale-110 transition-transform`}></i>
                          <span className="font-medium">{option.label}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs text-slate-400 bg-slate-700/60 px-2 py-1 rounded-full font-semibold">
                            {statusCounts[option.value]}
                          </span>
                          {statusFilter === option.value && (
                            <i className="fas fa-check text-primary ml-2 text-xs"></i>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Advanced Export Button with Dropdown */}
            <div className="relative" ref={exportDropdownRef}>
              <div className="group">
                <button
                  onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                  disabled={isExporting || filteredLoans.length === 0}
                  className="bg-gradient-to-r from-primary/30 to-primary/40 hover:from-primary/40 hover:to-primary/50 text-white border-2 border-primary/50 hover:border-primary/70 rounded-xl px-4 py-2.5 font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 group-hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center min-w-[130px] justify-center backdrop-blur-sm"
                  title={filteredLoans.length === 0 ? 'No loans to export' : 'Export loan portfolio'}
                >
                  {isExporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-download mr-2 group-hover:animate-bounce"></i>
                      <span>Export</span>
                      <i className={`fas fa-chevron-down ml-2 text-xs transition-transform duration-200 ${isExportDropdownOpen ? 'rotate-180' : ''}`}></i>
                    </>
                  )}
                </button>
                
                {/* Export Dropdown Menu */}
                {isExportDropdownOpen && !isExporting && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-slate-800/95 backdrop-blur-md border-2 border-slate-700/80 rounded-xl shadow-2xl shadow-black/40 z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                    <div className="p-3 border-b border-slate-700/50">
                      <h4 className="font-semibold text-sm text-white mb-1">Export Options</h4>
                      <p className="text-xs text-slate-400">
                        {filteredLoans.length} loan{filteredLoans.length !== 1 ? 's' : ''} • {statusFilter === 'all' ? 'All statuses' : `${statusFilter} only`}
                      </p>
                    </div>
                    {[
                      { 
                        format: 'csv', 
                        label: 'CSV File', 
                        description: 'Spreadsheet compatible', 
                        icon: 'fas fa-file-csv', 
                        color: 'text-green-400' 
                      },
                      { 
                        format: 'pdf', 
                        label: 'PDF Report', 
                        description: 'Formatted document', 
                        icon: 'fas fa-file-pdf', 
                        color: 'text-red-400' 
                      },
                      { 
                        format: 'excel', 
                        label: 'Excel File', 
                        description: 'Advanced spreadsheet', 
                        icon: 'fas fa-file-excel', 
                        color: 'text-green-600' 
                      }
                    ].map((option) => (
                      <button
                        key={option.format}
                        onClick={() => handleExport(option.format)}
                        className="w-full px-4 py-3 text-left hover:bg-slate-700/80 transition-colors duration-150 flex items-center group border-b border-slate-700/50 last:border-b-0 text-slate-200 hover:text-white"
                      >
                        <div className="flex items-center flex-1">
                          <i className={`${option.icon} ${option.color} mr-3 text-lg group-hover:scale-110 transition-transform`}></i>
                          <div>
                            <div className="font-medium text-sm">{option.label}</div>
                            <div className="text-xs text-slate-400">{option.description}</div>
                          </div>
                        </div>
                        <i className="fas fa-arrow-right text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all text-xs"></i>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {filteredLoans.length === 0 ? (
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
