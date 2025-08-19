import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLoan } from '../context/loan-context';
import { useWeb3 } from '../context/web3-context';
import { useToast } from '../hooks/use-toast';

export default function LoanRequestForm({ onSubmit }) {
  const { createLoanRequest, isWalletConnectedToContract, connectWalletToContract } = useLoan();
  const { account } = useWeb3();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    amount: '',
    interestRate: '5.2',
    duration: '30',
    collateral: 'ETH',
    purpose: '',
    collateralAmount: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [calculatedValues, setCalculatedValues] = useState({
    totalRepayment: 0,
    monthlyPayment: 0
  });

  // Check wallet connection to contract on mount and when account changes
  useEffect(() => {
    const checkWalletConnection = async () => {
      if (account) {
        const connected = await isWalletConnectedToContract();
        setIsWalletConnected(connected);
      } else {
        setIsWalletConnected(false);
      }
    };
    
    checkWalletConnection();
  }, [account, isWalletConnectedToContract]);

  // Calculate loan metrics in real-time
  useEffect(() => {
    const amount = parseFloat(formData.amount) || 0;
    const rate = parseFloat(formData.interestRate) || 0;
    const days = parseInt(formData.duration) || 30;
    
    const totalRepayment = amount * (1 + rate / 100);
    const monthlyPayment = totalRepayment / (days / 30);
    
    setCalculatedValues({
      totalRepayment: totalRepayment.toFixed(4),
      monthlyPayment: monthlyPayment.toFixed(4)
    });
  }, [formData.amount, formData.interestRate, formData.duration]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!account) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your MetaMask wallet first.",
        variant: "destructive",
      });
      return;
    }

    if (!isWalletConnected) {
      try {
        await connectWalletToContract();
        setIsWalletConnected(true);
      } catch (error) {
        toast({
          title: "Connection Failed",
          description: "Failed to connect wallet to contract. Please try again.",
          variant: "destructive",
        });
        return;
      }
    }
    
    if (!formData.amount || !formData.interestRate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(formData.amount) < 0.01) {
      toast({
        title: "Invalid Amount",
        description: "Minimum loan amount is 0.01 ETH",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(formData.amount) > 1000) {
      toast({
        title: "Invalid Amount",
        description: "Maximum 1000 ETH can be asked at a time",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(formData.interestRate) < 0.1) {
      toast({
        title: "Invalid Interest Rate",
        description: "Minimum interest rate is 0.1%",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create loan request on the blockchain
      const result = await createLoanRequest({
        amount: formData.amount,
        interestRate: formData.interestRate,
        duration: formData.duration,
        purpose: formData.purpose
      });
      
      // Call the original onSubmit callback if provided
      if (onSubmit) {
        await onSubmit({
          ...formData,
          ...calculatedValues,
          blockchainResult: result
        });
      }
      
      // Reset form
      setFormData({
        amount: '',
        interestRate: '5.2',
        duration: '30',
        collateral: 'ETH',
        purpose: '',
        collateralAmount: ''
      });
      
      toast({
        title: "Success!",
        description: "Your loan request has been created and is now visible in the marketplace.",
        variant: "default",
      });
      
    } catch (error) {
      console.error('Error submitting loan request:', error);
      
      // Error handling is already done in the loan context
      // The toast will be shown automatically
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getMarketRate = () => {
    // Simulate market rate based on duration
    const duration = parseInt(formData.duration);
    if (duration <= 30) return '5.2';
    if (duration <= 60) return '5.8';
    if (duration <= 90) return '6.1';
    return '6.5';
  };

  const getRiskLevel = () => {
    const rate = parseFloat(formData.interestRate) || 0;
    const marketRate = parseFloat(getMarketRate());
    
    if (rate < marketRate - 1) return { level: 'Low', color: 'text-green-400', icon: 'fa-shield-check' };
    if (rate < marketRate + 1) return { level: 'Medium', color: 'text-yellow-400', icon: 'fa-balance-scale' };
    return { level: 'High', color: 'text-red-400', icon: 'fa-exclamation-triangle' };
  };

  return (
    <div className="glass-card-strong rounded-3xl p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <i className="fas fa-plus-circle text-primary mr-3"></i>
          Request New Loan
        </h2>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 ${isWalletConnected ? 'bg-green-400' : 'bg-red-400'} rounded-full animate-pulse`}></div>
          <span className={`text-sm ${isWalletConnected ? 'text-green-400' : 'text-red-400'} font-medium`}>
            {isWalletConnected ? 'Contract Connected' : 'Contract Disconnected'}
          </span>
        </div>
      </div>
      
      {!account && (
        <div className="mb-6 p-4 bg-red-400/20 border border-red-400/30 rounded-xl">
          <div className="flex items-center">
            <i className="fas fa-exclamation-triangle text-red-400 mr-3"></i>
            <div>
              <h3 className="font-semibold text-red-400">Wallet Not Connected</h3>
              <p className="text-sm text-red-300">Please connect your MetaMask wallet to create a loan request.</p>
            </div>
          </div>
        </div>
      )}
      
      {account && !isWalletConnected && (
        <div className="mb-6 p-4 bg-yellow-400/20 border border-yellow-400/30 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <i className="fas fa-info-circle text-yellow-400 mr-3"></i>
              <div>
                <h3 className="font-semibold text-yellow-400">Connect to Contract</h3>
                <p className="text-sm text-yellow-300">Your wallet needs to be connected to the smart contract.</p>
              </div>
            </div>
            <Button
              onClick={connectWalletToContract}
              className="bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-400 border border-yellow-400/30"
            >
              <i className="fas fa-link mr-2"></i>
              Connect
            </Button>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Primary Loan Details */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="amount" className="flex items-center text-sm font-medium">
              <i className="fab fa-ethereum text-primary mr-2"></i>
              Loan Amount (ETH) *
            </Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                placeholder="0.0"
                step="0.01"
                min="0.01"
                max="1000"
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                className="pl-12 glass-card border-border focus:border-primary transition-all duration-300 h-12 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                required
                disabled={!account || !isWalletConnected}
              />
              <i className="fab fa-ethereum absolute left-4 top-1/2 transform -translate-y-1/2 text-primary"></i>
            </div>
            {formData.amount && (
              <p className="text-xs text-muted-foreground">
                ≈ ${(parseFloat(formData.amount) * 2400).toLocaleString()} USD
              </p>
            )}
            {formData.amount && parseFloat(formData.amount) < 0.01 && (
              <p className="text-xs text-red-400">
                Minimum loan amount is 0.01 ETH
              </p>
            )}
            {formData.amount && parseFloat(formData.amount) > 1000 && (
              <p className="text-xs text-red-400">
                Maximum 1000 ETH can be asked at a time
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="interestRate" className="flex items-center text-sm font-medium">
              <i className="fas fa-percentage text-secondary mr-2"></i>
              Interest Rate (%) *
            </Label>
            <div className="relative">
              <Input
                id="interestRate"
                type="number"
                placeholder={getMarketRate()}
                step="0.1"
                min="0.1"
                max="50"
                value={formData.interestRate}
                onChange={(e) => handleChange('interestRate', e.target.value)}
                className="glass-card border-border focus:border-primary transition-all duration-300 h-12 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                required
                disabled={!account || !isWalletConnected}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <span className="text-xs text-muted-foreground">Market: {getMarketRate()}%</span>
              </div>
            </div>
            {formData.interestRate && (
              <div className="flex items-center space-x-2">
                <i className={`fas ${getRiskLevel().icon} ${getRiskLevel().color}`}></i>
                <span className={`text-xs font-medium ${getRiskLevel().color}`}>
                  {getRiskLevel().level} Risk
                </span>
              </div>
            )}
            {formData.interestRate && (parseFloat(formData.interestRate) < 0.1 || parseFloat(formData.interestRate) > 50) && (
              <p className="text-xs text-red-400">
                Interest rate must be between 0.1% and 50%
              </p>
            )}
          </div>
        </div>
        
        {/* Duration */}
        <div className="space-y-2">
          <Label className="flex items-center text-sm font-medium">
            <i className="fas fa-clock text-blue-400 mr-2"></i>
            Loan Duration
          </Label>
          <Select value={formData.duration} onValueChange={(value) => handleChange('duration', value)}>
            <SelectTrigger className="glass-card border-border focus:border-primary h-12" disabled={!account || !isWalletConnected}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days (Short-term)</SelectItem>
              <SelectItem value="14">14 days</SelectItem>
              <SelectItem value="30">30 days (Popular)</SelectItem>
              <SelectItem value="60">60 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
              <SelectItem value="180">180 days (Long-term)</SelectItem>
              <SelectItem value="365">365 days (Extended)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loan Calculations */}
        {formData.amount && formData.interestRate && (
          <div className="glass-card p-6 rounded-2xl border border-primary/20">
            <h4 className="text-lg font-semibold mb-4 flex items-center">
              <i className="fas fa-calculator text-primary mr-3"></i>
              Loan Summary
            </h4>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="text-center">
                <p className="text-muted-foreground text-sm mb-1">Total Repayment</p>
                <p className="text-2xl font-bold text-primary">{calculatedValues.totalRepayment} ETH</p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground text-sm mb-1">Interest Amount</p>
                <p className="text-2xl font-bold text-green-400">
                  {(calculatedValues.totalRepayment - parseFloat(formData.amount || 0)).toFixed(4)} ETH
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Loan Purpose */}
        <div className="space-y-2">
          <Label htmlFor="purpose" className="flex items-center text-sm font-medium">
            <i className="fas fa-info-circle text-yellow-400 mr-2"></i>
            Loan Purpose (Optional but Recommended)
          </Label>
          <Textarea
            id="purpose"
            placeholder="e.g., DeFi farming, NFT purchase, business expansion, emergency funding..."
            rows={3}
            value={formData.purpose}
            onChange={(e) => handleChange('purpose', e.target.value)}
            className="glass-card border-border focus:border-primary resize-none transition-all duration-300"
            disabled={!account || !isWalletConnected}
          />
          <p className="text-xs text-muted-foreground">
            Clear loan purposes help lenders make faster decisions and may improve your funding chances.
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex flex-col space-y-4">
          <Button
            type="submit"
            disabled={
              isSubmitting || 
              !account || 
              !isWalletConnected ||
              !formData.amount || 
              parseFloat(formData.amount) < 0.01 || 
              parseFloat(formData.amount) > 1000 || 
              !formData.interestRate || 
              parseFloat(formData.interestRate) < 0.1 || 
              parseFloat(formData.interestRate) > 50
            }
            className="w-full button-advanced bg-gradient-to-r from-primary to-secondary hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 h-14 text-lg font-semibold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner animate-spin mr-3"></i>
                Creating Loan Request...
              </>
            ) : (
              <>
                <i className="fas fa-rocket mr-3"></i>
                Create Loan Request
              </>
            )}
          </Button>
          
          <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
            <div className="flex items-center">
              <i className="fas fa-shield-check text-green-400 mr-2"></i>
              Smart Contract Secured
            </div>
            <div className="flex items-center">
              <i className="fas fa-clock text-blue-400 mr-2"></i>
              Instant Matching
            </div>
            <div className="flex items-center">
              <i className="fas fa-users text-purple-400 mr-2"></i>
              Community Verified
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}