import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function LoanRequestForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    amount: '',
    interestRate: '',
    duration: '30',
    collateral: 'ETH',
    purpose: '',
    collateralAmount: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calculatedValues, setCalculatedValues] = useState({
    totalRepayment: 0,
    monthlyPayment: 0,
    requiredCollateral: 0
  });

  // Calculate loan metrics in real-time
  useEffect(() => {
    const amount = parseFloat(formData.amount) || 0;
    const rate = parseFloat(formData.interestRate) || 0;
    const days = parseInt(formData.duration) || 30;
    
    const totalRepayment = amount * (1 + rate / 100);
    const monthlyPayment = totalRepayment / (days / 30);
    const requiredCollateral = amount * 1.5; // 150% collateralization ratio
    
    setCalculatedValues({
      totalRepayment: totalRepayment.toFixed(4),
      monthlyPayment: monthlyPayment.toFixed(4),
      requiredCollateral: requiredCollateral.toFixed(4)
    });
  }, [formData.amount, formData.interestRate, formData.duration]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.interestRate) {
      alert('Please fill in all required fields');
      return;
    }

    if (parseFloat(formData.amount) < 0.01) {
      alert('Minimum loan amount is 0.01 ETH');
      return;
    }

    if (parseFloat(formData.interestRate) < 0.1) {
      alert('Minimum interest rate is 0.1%');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onSubmit({
        ...formData,
        ...calculatedValues
      });
      
      // Reset form
      setFormData({
        amount: '',
        interestRate: '',
        duration: '30',
        collateral: 'ETH',
        purpose: '',
        collateralAmount: ''
      });
    } catch (error) {
      console.error('Error submitting loan request:', error);
      alert('Failed to submit loan request. Please try again.');
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
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm text-green-400 font-medium">Market Open</span>
        </div>
      </div>
      
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
                max="100"
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                className="pl-12 glass-card border-border focus:border-primary transition-all duration-300 h-12"
                required
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
                className="glass-card border-border focus:border-primary transition-all duration-300 h-12"
                required
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
          </div>
        </div>
        
        {/* Duration and Collateral */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="flex items-center text-sm font-medium">
              <i className="fas fa-clock text-blue-400 mr-2"></i>
              Loan Duration
            </Label>
            <Select value={formData.duration} onValueChange={(value) => handleChange('duration', value)}>
              <SelectTrigger className="glass-card border-border focus:border-primary h-12">
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
          
          <div className="space-y-2">
            <Label className="flex items-center text-sm font-medium">
              <i className="fas fa-shield-alt text-green-400 mr-2"></i>
              Collateral Type
            </Label>
            <Select value={formData.collateral} onValueChange={(value) => handleChange('collateral', value)}>
              <SelectTrigger className="glass-card border-border focus:border-primary h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ETH">
                  <div className="flex items-center">
                    <i className="fab fa-ethereum mr-2"></i>
                    ETH (Most Popular)
                  </div>
                </SelectItem>
                <SelectItem value="USDC">
                  <div className="flex items-center">
                    <i className="fas fa-coins mr-2"></i>
                    USDC (Stable)
                  </div>
                </SelectItem>
                <SelectItem value="USDT">
                  <div className="flex items-center">
                    <i className="fas fa-coins mr-2"></i>
                    USDT (Stable)
                  </div>
                </SelectItem>
                <SelectItem value="DAI">
                  <div className="flex items-center">
                    <i className="fas fa-coins mr-2"></i>
                    DAI (Decentralized)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loan Calculations */}
        {formData.amount && formData.interestRate && (
          <div className="glass-card p-6 rounded-2xl border border-primary/20">
            <h4 className="text-lg font-semibold mb-4 flex items-center">
              <i className="fas fa-calculator text-primary mr-3"></i>
              Loan Summary
            </h4>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-muted-foreground text-sm mb-1">Total Repayment</p>
                <p className="text-2xl font-bold text-primary">{calculatedValues.totalRepayment} ETH</p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground text-sm mb-1">Required Collateral</p>
                <p className="text-2xl font-bold text-secondary">{calculatedValues.requiredCollateral} {formData.collateral}</p>
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
          />
          <p className="text-xs text-muted-foreground">
            Clear loan purposes help lenders make faster decisions and may improve your funding chances.
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex flex-col space-y-4">
          <Button
            type="submit"
            disabled={isSubmitting || !formData.amount || !formData.interestRate}
            className="w-full button-advanced bg-gradient-to-r from-primary to-secondary hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 h-14 text-lg font-semibold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner animate-spin mr-3"></i>
                Submitting Request...
              </>
            ) : (
              <>
                <i className="fas fa-rocket mr-3"></i>
                Submit Loan Request
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
