import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative py-24 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10"></div>
        <div className="relative max-w-4xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-white to-muted-foreground bg-clip-text text-transparent">
            Decentralized Lending
          </h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            Bridge the gap between borrowers and lenders in the DeFi ecosystem. Secure, transparent, and efficient lending powered by blockchain technology.
          </p>
          
          {/* Role Selection Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Borrower Card */}
            <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-8 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-hand-holding-dollar text-2xl text-white"></i>
                </div>
                <h3 className="text-2xl font-semibold mb-3">Join as Borrower</h3>
                <p className="text-muted-foreground mb-6">
                  Request loans from our community of lenders. Set your terms and get funded quickly.
                </p>
              </div>
              <ul className="text-sm text-muted-foreground space-y-2 mb-8 text-left">
                <li className="flex items-center">
                  <i className="fas fa-check text-green-400 mr-3"></i>
                  Quick loan requests
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-green-400 mr-3"></i>
                  Competitive interest rates
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-green-400 mr-3"></i>
                  Transparent terms
                </li>
              </ul>
              <Link href="/borrower">
                <Button className="w-full bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 transform hover:scale-105 h-12">
                  Start Borrowing
                  <i className="fas fa-arrow-right ml-2"></i>
                </Button>
              </Link>
            </div>

            {/* Lender Card */}
            <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-8 hover:border-secondary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-secondary/10">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-secondary to-secondary/70 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-coins text-2xl text-white"></i>
                </div>
                <h3 className="text-2xl font-semibold mb-3">Join as Lender</h3>
                <p className="text-muted-foreground mb-6">
                  Earn attractive returns by funding loans. Diversify your portfolio with DeFi lending.
                </p>
              </div>
              <ul className="text-sm text-muted-foreground space-y-2 mb-8 text-left">
                <li className="flex items-center">
                  <i className="fas fa-check text-green-400 mr-3"></i>
                  Attractive yields
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-green-400 mr-3"></i>
                  Choose your risk level
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-green-400 mr-3"></i>
                  Automated repayments
                </li>
              </ul>
              <Link href="/lender">
                <Button className="w-full bg-gradient-to-r from-secondary to-purple-600 hover:shadow-lg hover:shadow-secondary/25 transition-all duration-300 transform hover:scale-105 h-12">
                  Start Lending
                  <i className="fas fa-arrow-right ml-2"></i>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-card/20">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">Why Choose FinBridge?</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-shield-alt text-primary text-xl"></i>
              </div>
              <h4 className="text-xl font-semibold mb-3">Secure & Trustless</h4>
              <p className="text-muted-foreground">Smart contracts ensure transparent and secure transactions without intermediaries.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-bolt text-secondary text-xl"></i>
              </div>
              <h4 className="text-xl font-semibold mb-3">Fast & Efficient</h4>
              <p className="text-muted-foreground">Get loans funded quickly with automated matching and instant settlements.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-400/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-chart-line text-green-400 text-xl"></i>
              </div>
              <h4 className="text-xl font-semibold mb-3">Competitive Rates</h4>
              <p className="text-muted-foreground">Market-driven interest rates ensure fair pricing for both borrowers and lenders.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
