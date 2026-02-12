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
  const { createLoanRequest, contract } = useLoan();
  const { account } = useWeb3();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    amount: '',
    duration: '30',
    purpose: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calculatedValues, setCalculatedValues] = useState({
    totalRepayment: 0,
    interestRate: 0
  });

  // Auto-calculate interest rate based on amount and duration
  const calculateInterestRate = (amount, duration) => {
    const baseRate = 5.2; // Base market rate
    
    // Amount-based adjustment
    let amountAdjustment = 0;
    if (amount >= 0.1 && amount < 1) amountAdjustment = 0;
    else if (amount >= 1 && amount < 10) amountAdjustment = 1;
    else if (amount >= 10 && amount < 50) amountAdjustment = 2;
    else if (amount >= 50 && amount < 100) amountAdjustment = 3;
    else if (amount >= 100 && amount < 500) amountAdjustment = 5;
    else if (amount >= 500 && amount <= 1000) amountAdjustment = 7;
    
    // Duration-based adjustment
    let durationAdjustment = 0;
    const days = parseInt(duration) || 30;
    if (days >= 7 && days <= 30) durationAdjustment = 0;
    else if (days >= 31 && days <= 90) durationAdjustment = 1;
    else if (days >= 91 && days <= 180) durationAdjustment = 2;
    else if (days >= 181 && days <= 365) durationAdjustment = 3;
    
    return baseRate + amountAdjustment + durationAdjustment;
  };

  // Calculate loan metrics in real-time
  useEffect(() => {
    const amount = parseFloat(formData.amount) || 0;
    const days = parseInt(formData.duration) || 30;
    const rate = calculateInterestRate(amount, days);
    
    const totalRepayment = amount * (1 + rate / 100);
    
    setCalculatedValues({
      totalRepayment: totalRepayment.toFixed(4),
      interestRate: rate.toFixed(1)
    });
  }, [formData.amount, formData.duration]);

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
    
    if (!formData.amount) {
      toast({
        title: "Missing Information",
        description: "Please enter a loan amount",
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
    
    setIsSubmitting(true);
    
    try {
      // First, connect wallet to contract if needed
      if (contract) {
        try {
          console.log('Connecting wallet to contract...');
          const connectTx = await contract.connectWallet();
          await connectTx.wait();
          console.log('Wallet connected to contract successfully');
        } catch (connectError) {
          console.log('Wallet might already be connected:', connectError.message);
          // Continue even if connection fails - might already be connected
        }
      }
      
      // Create loan request on the blockchain with auto-calculated interest rate
      const autoInterestRate = calculateInterestRate(parseFloat(formData.amount), formData.duration);
      const result = await createLoanRequest({
        amount: formData.amount,
        interestRate: autoInterestRate.toString(),
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
        duration: '30',
        purpose: ''
      });
      
      toast({
        title: "Success!",
        description: "Your loan request has been created and is now visible in the marketplace.",
        variant: "default",
      });
      
    } catch (error) {
      console.error('Error submitting loan request:', error);
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

  return (
    <div className="glass-card-strong rounded-3xl p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <i className="fas fa-plus-circle text-primary mr-3"></i>
          Request New Loan
        </h2>
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
    
      <form onSubmit={handleSubmit} className="space-y-6">
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
                max="1000"
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                className="pl-12 glass-card border-border focus:border-primary transition-all duration-300 h-12"
                required
                disabled={!account}
              />
              <i className="fab fa-ethereum absolute left-4 top-1/2 transform -translate-y-1/2 text-primary"></i>
            </div>
            {formData.amount && (
              <p className="text-xs text-muted-foreground">
                ≈ ${(parseFloat(formData.amount) * 2400).toLocaleString()} USD
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label className="flex items-center text-sm font-medium">
              <i className="fas fa-percentage text-secondary mr-2"></i>
              Auto-Calculated Interest Rate
            </Label>
            <div className="glass-card border border-secondary/30 rounded-xl p-4 bg-secondary/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-secondary">
                    {calculatedValues.interestRate || '5.2'}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Automatically calculated based on amount and duration
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label className="flex items-center text-sm font-medium">
            <i className="fas fa-clock text-blue-400 mr-2"></i>
            Loan Duration
          </Label>
          <Select value={formData.duration} onValueChange={(value) => handleChange('duration', value)}>
            <SelectTrigger className="glass-card border-border focus:border-primary h-12" disabled={!account}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days (Minimum)</SelectItem>
              <SelectItem value="14">14 days</SelectItem>
              <SelectItem value="30">30 days (Popular)</SelectItem>
              <SelectItem value="60">60 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
              <SelectItem value="180">180 days (Long-term)</SelectItem>
              <SelectItem value="365">365 days (Maximum)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="purpose" className="flex items-center text-sm font-medium">
            <i className="fas fa-info-circle text-yellow-400 mr-2"></i>
            Loan Purpose (Optional)
          </Label>
          <Textarea
            id="purpose"
            placeholder="e.g., DeFi farming, NFT purchase, business expansion..."
            rows={3}
            value={formData.purpose}
            onChange={(e) => handleChange('purpose', e.target.value)}
            className="glass-card border-border focus:border-primary resize-none"
            disabled={!account}
          />
        </div>

        <Button
          type="submit"
          disabled={
            isSubmitting || 
            !account || 
            !formData.amount || 
            parseFloat(formData.amount) > 1000
          }
          className="w-full button-advanced bg-gradient-to-r from-primary to-secondary hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 h-14 text-lg font-semibold rounded-2xl"
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
      </form>
    </div>
  );
}
