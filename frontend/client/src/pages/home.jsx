import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [stats, setStats] = useState({
    totalLoans: 0,
    totalValue: 0,
    activeUsers: 0
  });

  useEffect(() => {
    // Animate counters
    const animateCounter = (target, duration = 2000) => {
      let start = 0;
      const increment = target / (duration / 16);
      const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
          start = target;
          clearInterval(timer);
        }
        setStats(prev => ({
          ...prev,
          [target === 1247 ? 'totalLoans' : target === 24.8 ? 'totalValue' : 'activeUsers']: Math.floor(start * 10) / 10
        }));
      }, 16);
    };

    setTimeout(() => {
      animateCounter(1247);
      animateCounter(24.8);
      animateCounter(892);
    }, 500);
  }, []);

  const createParticles = () => {
    const particles = [];
    for (let i = 0; i < 20; i++) {
      particles.push(
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            width: `${2 + Math.random() * 4}px`,
            height: `${2 + Math.random() * 4}px`,
            animationDelay: `${Math.random() * 15}s`,
            animationDuration: `${10 + Math.random() * 10}s`
          }}
        />
      );
    }
    return particles;
  };

  return (
    <div className="relative">
      {/* Floating particles */}
      <div className="particle-container">
        {createParticles()}
      </div>

      {/* Hero Section */}
      <section className="relative py-32 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--primary)_0%,_transparent_50%)] opacity-20"></div>
        </div>
        
        <div className="relative max-w-6xl mx-auto">
          {/* Main Heading */}
          <div className="mb-8 animate-fade-in">
            <div className="inline-block mb-4">
              <span className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-medium animate-pulse-slow">
                <i className="fas fa-rocket mr-2"></i>
                Web3 DeFi Platform
              </span>
            </div>
            <h1 className="text-6xl md:text-8xl font-bold mb-6 text-glow">
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-extrabold">Fin</span>
              <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">Bridge</span>
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto mb-6 rounded-full"></div>
            <p className="text-2xl md:text-3xl font-light text-muted-foreground mb-4">
              Decentralized Lending Revolution
            </p>
            <p className="text-lg text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
              Connect borrowers and lenders in a trustless ecosystem. Experience the future of finance with transparent, 
              automated, and secure lending powered by smart contracts.
            </p>
          </div>

          {/* Live Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 animate-fade-in">
            <div className="glass-card p-6 rounded-2xl hover:glow-border-animate transition-all duration-300">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center">
                  <i className="fas fa-file-contract text-primary text-4xl"></i>
                </div>
              </div>
              <div className="text-3xl font-bold text-primary mb-2">
                {stats.totalLoans.toLocaleString()}
              </div>
              <div className="text-muted-foreground">Total Loans</div>
            </div>
            <div className="glass-card p-6 rounded-2xl hover:glow-border-animate transition-all duration-300">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-400/20 rounded-2xl flex items-center justify-center">
                  <i className="fas fa-lock text-green-400 text-4xl"></i>
                </div>
              </div>
              <div className="text-3xl font-bold text-green-400 mb-2">
                ${stats.totalValue}M
              </div>
              <div className="text-muted-foreground">Volume Locked</div>
            </div>
            <div className="glass-card p-6 rounded-2xl hover:glow-border-animate transition-all duration-300">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-secondary/20 rounded-2xl flex items-center justify-center">
                  <i className="fas fa-user-friends text-secondary text-4xl"></i>
                </div>
              </div>
              <div className="text-3xl font-bold text-secondary mb-2">
                {stats.activeUsers.toLocaleString()}
              </div>
              <div className="text-muted-foreground">Active Users</div>
            </div>
          </div>
          
          {/* Role Selection Cards */}
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Borrower Card */}
            <div className="glass-card-strong rounded-3xl p-10 hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/20 card-3d group animate-float">
              <div className="mb-8">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/70 rounded-3xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <i className="fas fa-hand-holding-dollar text-3xl text-white"></i>
                  </div>
                  <div className="absolute -inset-2 bg-gradient-to-br from-primary to-primary/70 rounded-3xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                </div>
                <h3 className="text-3xl font-bold mb-4 text-white">Join as Borrower</h3>
                <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
                  Access instant liquidity from our global lender network. Set your terms, 
                  get competitive rates, and receive funding in minutes.
                </p>
              </div>
              <div className="space-y-4 mb-10">
                {[
                  { icon: 'fa-clock', text: 'Instant loan approval' },
                  { icon: 'fa-percentage', text: 'Competitive interest rates' },
                  { icon: 'fa-shield', text: 'Smart contract security' },
                  { icon: 'fa-coins', text: 'Flexible repayment terms' }
                ].map((feature, index) => (
                  <div key={index} className="flex items-center group-hover:translate-x-2 transition-transform duration-300">
                    <div className="w-10 h-10 bg-green-400/20 rounded-full flex items-center justify-center mr-4">
                      <i className={`fas ${feature.icon} text-green-400`}></i>
                    </div>
                    <span className="text-white font-medium">{feature.text}</span>
                  </div>
                ))}
              </div>
              <Link href="/borrower">
                <Button className="w-full button-advanced bg-gradient-to-r from-primary to-secondary hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 h-14 text-lg font-semibold rounded-2xl">
                  <i className="fas fa-rocket mr-3"></i>
                  Start Borrowing
                  <i className="fas fa-arrow-right ml-3 group-hover:translate-x-1 transition-transform duration-300"></i>
                </Button>
              </Link>
            </div>

            {/* Lender Card */}
            <div className="glass-card-strong rounded-3xl p-10 hover:border-secondary/50 transition-all duration-500 hover:shadow-2xl hover:shadow-secondary/20 card-3d group animate-float" style={{ animationDelay: '1s' }}>
              <div className="mb-8">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-secondary to-secondary/70 rounded-3xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <i className="fas fa-coins text-3xl text-white"></i>
                  </div>
                  <div className="absolute -inset-2 bg-gradient-to-br from-secondary to-secondary/70 rounded-3xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                </div>
                <h3 className="text-3xl font-bold mb-4 text-white">Join as Lender</h3>
                <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
                  Maximize your crypto returns by funding verified borrowers. 
                  Diversify your portfolio with automated lending strategies.
                </p>
              </div>
              <div className="space-y-4 mb-10">
                {[
                  { icon: 'fa-chart-line', text: 'High yield opportunities' },
                  { icon: 'fa-balance-scale', text: 'Risk assessment tools' },
                  { icon: 'fa-robot', text: 'Automated collections' },
                  { icon: 'fa-pie-chart', text: 'Portfolio diversification' }
                ].map((feature, index) => (
                  <div key={index} className="flex items-center group-hover:translate-x-2 transition-transform duration-300">
                    <div className="w-10 h-10 bg-green-400/20 rounded-full flex items-center justify-center mr-4">
                      <i className={`fas ${feature.icon} text-green-400`}></i>
                    </div>
                    <span className="text-white font-medium">{feature.text}</span>
                  </div>
                ))}
              </div>
              <Link href="/lender">
                <Button className="w-full button-advanced bg-gradient-to-r from-secondary to-purple-600 hover:shadow-xl hover:shadow-secondary/30 transition-all duration-300 h-14 text-lg font-semibold rounded-2xl">
                  <i className="fas fa-coins mr-3"></i>
                  Start Lending
                  <i className="fas fa-arrow-right ml-3 group-hover:translate-x-1 transition-transform duration-300"></i>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Features Section */}
      <section className="py-24 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-card/50 to-transparent"></div>
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6 text-primary" style={{textShadow: '0 0 20px hsl(var(--primary)), 0 0 40px hsl(var(--secondary))'}}>Why Choose FinBridge?</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Built on cutting-edge blockchain technology with advanced features designed for the modern DeFi ecosystem
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-10">
            {/* Military-Grade Security */}
            <div className="glass-card p-8 rounded-3xl hover:glow-border-animate transition-all duration-500 group animate-fade-in card-3d" style={{ animationDelay: '0s' }}>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <i className="fas fa-lock text-primary text-4xl"></i>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">Military-Grade Security</h3>
                <p className="text-muted-foreground leading-relaxed">Multi-signature wallets, time-locked contracts, and comprehensive audit trails ensure your funds are protected.</p>
              </div>
            </div>
            
            {/* Lightning Fast */}
            <div className="glass-card p-8 rounded-3xl hover:glow-border-animate transition-all duration-500 group animate-fade-in card-3d" style={{ animationDelay: '0.2s' }}>
              <div className="text-center">
                <div className="w-16 h-16 bg-secondary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <i className="fas fa-bolt text-secondary text-4xl"></i>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">Lightning Fast</h3>
                <p className="text-muted-foreground leading-relaxed">Instant loan matching, real-time settlements, and optimized gas usage for the fastest DeFi experience.</p>
              </div>
            </div>
            
            {/* AI-Powered Matching */}
            <div className="glass-card p-8 rounded-3xl hover:glow-border-animate transition-all duration-500 group animate-fade-in card-3d" style={{ animationDelay: '0.4s' }}>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-400/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <i className="fas fa-brain text-green-400 text-4xl"></i>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">AI-Powered Matching</h3>
                <p className="text-muted-foreground leading-relaxed">Advanced algorithms analyze risk profiles and match borrowers with optimal lenders automatically.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card-strong p-12 rounded-3xl">
            <h2 className="text-4xl font-bold mb-6 text-primary" style={{textShadow: '0 0 20px hsl(var(--primary)), 0 0 40px hsl(var(--secondary))'}}>Ready to Get Started?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of users already earning and borrowing on FinBridge
            </p>
            <div className="flex flex-col md:flex-row gap-6 justify-center">
              <Link href="/borrower">
                <Button className="button-advanced bg-gradient-to-r from-primary to-secondary hover:shadow-xl hover:shadow-primary/30 px-8 py-4 text-lg font-semibold rounded-2xl">
                  <i className="fas fa-hand-holding-dollar mr-3"></i>
                  Need a Loan?
                </Button>
              </Link>
              <Link href="/lender">
                <Button className="button-advanced bg-gradient-to-r from-secondary to-purple-600 hover:shadow-xl hover:shadow-secondary/30 px-8 py-4 text-lg font-semibold rounded-2xl">
                  <i className="fas fa-coins mr-3"></i>
                  Want to Lend?
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
