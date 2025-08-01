# DeFi Loan Platform

## Overview

This is a decentralized finance (DeFi) loan platform built with React, Express, and Ethereum smart contracts. The application enables peer-to-peer lending where borrowers can request loans and lenders can fund them through smart contract interactions. The platform features separate dashboards for borrowers and lenders, with Web3 wallet integration for blockchain transactions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **UI Library**: Shadcn/ui components with Radix UI primitives and Tailwind CSS
- **Routing**: Wouter for client-side routing with dedicated pages for home, borrower dashboard, and lender dashboard
- **State Management**: TanStack React Query for server state and React Context for Web3 provider state
- **Styling**: Tailwind CSS with a dark theme design system using CSS custom properties

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Pattern**: RESTful API with `/api` prefix for all endpoints
- **Database Layer**: Drizzle ORM with PostgreSQL database support
- **Data Storage**: Dual storage pattern with in-memory storage (MemStorage) for development and database schema for production
- **Middleware**: Custom logging middleware for API request tracking

### Web3 Integration
- **Smart Contracts**: Placeholder smart contract ABI for loan operations (requestLoan, fundLoan, repayLoan)
- **Wallet Connection**: Web3Provider context for managing wallet connections and contract interactions
- **Contract Structure**: Prepared for integration with loan smart contracts on Ethereum

### Database Schema
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: User management with username/password authentication
- **Migrations**: Configured migration system with schema versioning
- **Connection**: Neon Database serverless PostgreSQL integration

### Development Environment
- **Hot Reload**: Vite development server with HMR support
- **TypeScript**: Strict type checking across frontend, backend, and shared modules
- **Path Aliases**: Configured aliases for clean imports (@/, @shared/, @assets/)
- **Error Handling**: Runtime error overlay for development debugging

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting for production data storage
- **Drizzle Kit**: Database migration and schema management tool

### UI/UX Libraries
- **Radix UI**: Headless component primitives for accessible UI components
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Lucide React**: Icon library for consistent iconography
- **React Hook Form**: Form state management with validation

### Development Tools
- **Vite**: Fast build tool and development server
- **TSX**: TypeScript execution for server-side development
- **ESBuild**: Fast JavaScript bundler for production builds

### Blockchain Integration (Planned)
- **Ethers.js**: Ethereum JavaScript library for smart contract interactions
- **Web3 Wallet**: Browser wallet integration for transaction signing
- **Smart Contract ABIs**: Contract interfaces for loan management operations

### Query and State Management
- **TanStack React Query**: Server state synchronization and caching
- **React Context**: Global state management for Web3 and user sessions

### Session Management
- **connect-pg-simple**: PostgreSQL session store for Express sessions
- **Express Session**: Server-side session management for user authentication