# FinBridge - Decentralized Peer-to-Peer Lending Platform

<div align="center">

![FinBridge Logo](https://img.shields.io/badge/FinBridge-DeFi%20Lending-blue?style=for-the-badge&logo=ethereum)

**Bridging the gap between borrowers and lenders through blockchain technology**

[![Ethereum](https://img.shields.io/badge/Ethereum-3C3C3D?style=flat&logo=Ethereum&logoColor=white)](https://ethereum.org/)
[![Solidity](https://img.shields.io/badge/Solidity-%23363636.svg?style=flat&logo=solidity&logoColor=white)](https://soliditylang.org/)
[![React](https://img.shields.io/badge/React-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)](https://reactjs.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-FFF100?style=flat&logo=hardhat&logoColor=black)](https://hardhat.org/)
[![Sepolia](https://img.shields.io/badge/Sepolia%20Testnet-Live-success?style=flat&logo=ethereum)](https://sepolia.etherscan.io)

</div>

## What is FinBridge?

FinBridge is a revolutionary **decentralized peer-to-peer lending platform** built on the Ethereum blockchain. It eliminates traditional financial intermediaries, allowing users to directly lend and borrow cryptocurrency in a trustless, transparent, and secure environment.

### Key Features

- Smart Contract Security - All transactions secured by audited smart contracts
- Auto-Calculated Interest Rates - Dynamic pricing based on loan amount and duration
- Instant Matching - Real-time loan request and funding system
- Transparent Analytics - Complete visibility into market metrics and performance
- Advanced Filtering - Sophisticated loan discovery and risk assessment tools
- No Intermediaries - Direct peer-to-peer transactions without banks
- Global Access - Available 24/7 to anyone with an Ethereum wallet

## Architecture Overview


![UI Preview](assets/overview.png)


## Tech Stack

### Frontend
- **React 18** - Modern UI framework
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Ethers.js** - Ethereum blockchain interaction
- **Shadcn/ui** - Beautiful component library

### Backend
- **Solidity** - Smart contract development
- **Hardhat** - Ethereum development environment
- **OpenZeppelin** - Security-focused contract libraries
- **Ethers.js** - Contract deployment and interaction

### Blockchain
- **Ethereum** - Primary blockchain network
- **MetaMask** - Wallet integration
- **Local Hardhat Network** - Development and testing

## Quick Start Guide

### Prerequisites

Before running FinBridge on Sepolia, ensure you have:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MetaMask** browser extension
- **Git**
- **Sepolia ETH** (get from [faucet](https://sepoliafaucet.com))

### Installation & Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/your-username/FinBridge.git
cd FinBridge
```

#### 2. Deploy Smart Contracts to Sepolia
```bash
cd backend
npm install
npm run deploy:sepolia
```

#### 3. Configure Frontend Contract Address
Edit `frontend/client/src/contracts/loan-abi.js`:
```javascript
export const LOAN_CONTRACT_ADDRESS = "0xa307518974eB04F6Cdb723e3a12eC7e194EE5Aa9";
```

#### 4. Start the Frontend
```bash
cd frontend/client
npm install
npm run dev
```
> Frontend will be available at `http://localhost:5001`

#### 5. Configure MetaMask for Sepolia
1. Add **Sepolia Testnet** to MetaMask:
   - Network Name: `Sepolia Testnet`
   - RPC URL: `https://rpc.sepolia.org`
   - Chain ID: `11155111`
   - Currency Symbol: `SepoliaETH`

2. Import your wallet with Sepolia ETH

### Usage

1. **Connect Wallet** - Connect your MetaMask wallet to the application
2. **Create Loan Request** - Set amount (0.01-1000 ETH) and duration
3. **Browse Marketplace** - View and filter available loan requests
4. **Fund Loans** - Lend to borrowers and earn interest
5. **Manage Portfolio** - Track your loans and earnings

## Why Choose FinBridge?

### Traditional Banking vs FinBridge

| Feature | Traditional Banks | FinBridge |
|---------|-------------------|-----------|
| **Approval Time** | Days to weeks | Instant |
| **Interest Rates** | Fixed, high fees | Market-driven, transparent |
| **Global Access** | Limited by geography | Available worldwide |
| **Transparency** | Opaque processes | Fully transparent |
| **Intermediary Fees** | High fees | Minimal gas fees only |
| **Collateral Requirements** | Extensive documentation | Crypto-based |

### Key Benefits

- Lower Costs - No banking fees, only minimal gas costs
- Speed - Instant loan processing and funding
- Security - Immutable smart contracts ensure trust
- Accessibility - Open to anyone with crypto wallet
- Better Returns - Competitive interest rates for lenders
- Flexibility - Customizable loan terms and amounts
- Transparency - All transactions visible on blockchain

## Project Structure

```
FinBridge/
├── backend/
│   ├── contracts/
│   ├── scripts/
│   ├── test/
│   ├── hardhat.config.js
│   └── package.json
├── frontend/
│   ├── client/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── context/
│   │   │   ├── contracts/
│   │   │   ├── pages/
│   │   │   └── hooks/
│   │   └── package.json
│   └── package.json
├── README.md
└── SECURITY.md
```

## Smart Contract Features

### Core Functionality
- **Loan Creation** - Users can create loan requests with custom terms
- **Automatic Interest Calculation** - Dynamic rates based on amount and duration
- **Secure Funding** - Protected fund transfers between parties
- **Loan Repayment** - Automated repayment processing
- **Event Logging** - Comprehensive transaction history

### Interest Rate Algorithm
```
Final Interest Rate = Base Rate (5.2%) + Amount Adjustment + Duration Adjustment

Amount Tiers:
• 0.1 - 1 ETH: +0%
• 1 - 10 ETH: +1%
• 10 - 50 ETH: +2%
• 50 - 100 ETH: +3%
• 100 - 500 ETH: +5%
• 500 - 1000 ETH: +7%

Duration Tiers:
• 7 - 30 days: +0%
• 31 - 90 days: +1%
• 91 - 180 days: +2%
• 181 - 365 days: +3%
```

## Testing & Security

### Security Audit Results

**Phase 2, Day 2 - Security Review:**
- 1 Critical vulnerability fixed (Reentrancy)
- 2 Medium issues resolved
- 4 Low/Gas optimizations implemented

- ReentrancyGuard protection on all state-changing functions
- 24-hour pause time lock for emergency stops
- Proper interest rate calculation (basis points precision)
- Comprehensive event emission for monitoring
- Checks-Effects-Interactions pattern applied

**Detailed Reports:**
- [SECURITY.md](./SECURITY.md) - Full security audit report
- [GAS_REPORT.md](./GAS_REPORT.md) - Gas optimization analysis

### Gas Optimization

**Average Gas Savings: 18%**

| Function | Before | After | Savings |
|----------|--------|-------|---------|
| `createLoanRequest()` | 180,000 | 165,000 | 8% |
| `fundLoan()` | 95,000 | 78,000 | 18% |
| `repayLoan()` | 85,000 | 68,000 | 20% |

---

## Testing

Run the smart contract tests:
```bash
cd backend
npx hardhat test
```

Run frontend tests:
```bash
cd frontend/client
npm test
```

## Deployment

### Sepolia Testnet Deployment (Recommended)

FinBridge is configured for **Sepolia Testnet** deployment with automatic Etherscan verification.

#### 1. Setup Environment Variables

Create `.env` file in `backend/` folder:

```env
PRIVATE_KEY=your_metamask_private_key_here
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
ETHERSCAN_API_KEY=your_etherscan_api_key
```

Get your API keys:
- **Alchemy**: https://alchemy.com (for RPC)
- **Etherscan**: https://etherscan.io/myapikey (for verification)
- **Sepolia ETH**: https://sepoliafaucet.com (for gas fees)

#### 2. Install Dependencies

```bash
cd backend
npm install
```

#### 3. Deploy to Sepolia

```bash
cd backend
npm run deploy:sepolia
```

This will:
- Deploy contract to Sepolia
- Verify on Etherscan automatically
- Output contract address and explorer link

#### 4. Update Frontend Contract Address

Edit `frontend/client/src/contracts/loan-abi.js`:

```javascript
export const LOAN_CONTRACT_ADDRESS = "your_deployed_contract_address";
```

#### 5. Deploy Frontend (Vercel/Netlify)

**Vercel:**
```bash
cd frontend/client
npm install -g vercel
vercel
```

**Netlify:**
```bash
cd frontend/client
npm run build
# Drag 'dist' folder to Netlify
```

### Deployed Contract Info

| Network | Chain ID | Contract Address | Explorer |
|---------|----------|-------------------|----------|
| Sepolia | 11155111 | `0xC9576B314CB8A4C9E41C082d0f02ae6E25019ab7` | [View on Etherscan](https://sepolia.etherscan.io/address/0xC9576B314CB8A4C9E41C082d0f02ae6E25019ab7) |

### Local Deployment

```bash
cd backend
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Security

- Basic security mitigations implemented using OpenZeppelin libraries
- Reentrancy protection and access controls in place
- No formal security audit conducted
- Use at your own risk for educational purposes

## Support & Community

- **Discord**: junaid_mollah_89812
- **Twitter**: [@JunaidMollah5](https://twitter.com/JunaidMollah5)
- **Email**: junaidmollah17@gmail.com

## Roadmap

- Phase 1: Core lending functionality
- Phase 2: Advanced filtering and analytics
- Phase 3: Mobile app development
- Phase 4: Multi-chain support
- Phase 5: Governance token launch
- Phase 6: Advanced DeFi integrations

---

<div align="center">

**Built with love by Junaid**


</div>
