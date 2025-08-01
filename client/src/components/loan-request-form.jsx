import { useState } from 'react';
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
    purpose: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.interestRate) {
      alert('Please fill in all required fields');
      return;
    }
    
    onSubmit(formData);
    
    // Reset form
    setFormData({
      amount: '',
      interestRate: '',
      duration: '30',
      collateral: 'ETH',
      purpose: ''
    });
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-6 mb-8">
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        <i className="fas fa-plus-circle text-primary mr-3"></i>
        Request New Loan
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="amount" className="block text-sm font-medium mb-2">
              Loan Amount (ETH) *
            </Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                placeholder="0.0"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                className="pl-12 bg-background border-gray-600 focus:border-primary"
                required
              />
              <i className="fab fa-ethereum absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
            </div>
          </div>
          
          <div>
            <Label htmlFor="interestRate" className="block text-sm font-medium mb-2">
              Interest Rate (%) *
            </Label>
            <Input
              id="interestRate"
              type="number"
              placeholder="5.0"
              step="0.1"
              min="0.1"
              value={formData.interestRate}
              onChange={(e) => handleChange('interestRate', e.target.value)}
              className="bg-background border-gray-600 focus:border-primary"
              required
            />
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="block text-sm font-medium mb-2">
              Loan Duration (days)
            </Label>
            <Select value={formData.duration} onValueChange={(value) => handleChange('duration', value)}>
              <SelectTrigger className="bg-background border-gray-600 focus:border-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="180">180 days</SelectItem>
                <SelectItem value="365">365 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="block text-sm font-medium mb-2">
              Collateral Type
            </Label>
            <Select value={formData.collateral} onValueChange={(value) => handleChange('collateral', value)}>
              <SelectTrigger className="bg-background border-gray-600 focus:border-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ETH">ETH</SelectItem>
                <SelectItem value="USDC">USDC</SelectItem>
                <SelectItem value="USDT">USDT</SelectItem>
                <SelectItem value="DAI">DAI</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div>
          <Label htmlFor="purpose" className="block text-sm font-medium mb-2">
            Loan Purpose (Optional)
          </Label>
          <Textarea
            id="purpose"
            placeholder="Describe what you'll use the loan for..."
            rows={3}
            value={formData.purpose}
            onChange={(e) => handleChange('purpose', e.target.value)}
            className="bg-background border-gray-600 focus:border-primary resize-none"
          />
        </div>
        
        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 h-12"
        >
          <i className="fas fa-paper-plane mr-2"></i>
          Request Loan
        </Button>
      </form>
    </div>
  );
}
