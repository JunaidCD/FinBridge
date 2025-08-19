# 🌉 FinBridge - Decentralized Peer-to-Peer Lending Platform

<div align="center">

![FinBridge Logo](https://img.shields.io/badge/FinBridge-DeFi%20Lending-blue?style=for-the-badge&logo=ethereum)

**Bridging the gap between borrowers and lenders through blockchain technology**

[![Ethereum](https://img.shields.io/badge/Ethereum-3C3C3D?style=flat&logo=Ethereum&logoColor=white)](https://ethereum.org/)
[![Solidity](https://img.shields.io/badge/Solidity-%23363636.svg?style=flat&logo=solidity&logoColor=white)](https://soliditylang.org/)
[![React](https://img.shields.io/badge/React-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)](https://reactjs.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-FFF100?style=flat&logo=hardhat&logoColor=black)](https://hardhat.org/)

</div>

## 🚀 What is FinBridge?

FinBridge is a revolutionary **decentralized peer-to-peer lending platform** built on the Ethereum blockchain. It eliminates traditional financial intermediaries, allowing users to directly lend and borrow cryptocurrency in a trustless, transparent, and secure environment.

### ✨ Key Features

- 🔐 **Smart Contract Security** - All transactions secured by audited smart contracts
- 💰 **Auto-Calculated Interest Rates** - Dynamic pricing based on loan amount and duration
- ⚡ **Instant Matching** - Real-time loan request and funding system
- 📊 **Transparent Analytics** - Complete visibility into market metrics and performance
- 🎯 **Advanced Filtering** - Sophisticated loan discovery and risk assessment tools
- 💎 **No Intermediaries** - Direct peer-to-peer transactions without banks
- 🌍 **Global Access** - Available 24/7 to anyone with an Ethereum wallet

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Smart Contract │    │   Blockchain    │
│   (React App)   │◄──►│   (Solidity)     │◄──►│   (Ethereum)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ • Loan Creation │    │ • Loan Management│    │ • Transaction   │
│ • Marketplace   │    │ • Fund Transfer  │    │   Recording     │
│ • User Dashboard│    │ • Interest Calc  │    │ • State Storage │
│ • Analytics     │    │ • Security Logic │    │ • Event Logs    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🛠️ Tech Stack

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

## 🚀 Quick Start Guide

### Prerequisites

Before running FinBridge locally, ensure you have:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MetaMask** browser extension
- **Git**

### 📦 Installation & Setup

Follow these steps to run FinBridge on your local machine:

#### 1. Clone the Repository
```bash
git clone https://github.com/your-username/FinBridge.git
cd FinBridge
```

#### 2. Start the Blockchain Network
```bash
cd backend
npm install
npx hardhat node
```
> This starts a local Ethereum network on `http://127.0.0.1:8545`

#### 3. Deploy Smart Contracts
Open a new terminal and run:
```bash
cd backend
npx hardhat run scripts/deploy.js --network localhost
```
> Note the deployed contract address for frontend configuration

#### 4. Start the Frontend
Open another terminal:
```bash
cd frontend/client
npm install
npm run dev
```
> Frontend will be available at `http://localhost:5000`

#### 5. Configure MetaMask
1. Add **Hardhat Local Network** to MetaMask:
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`

2. Import test accounts from Hardhat node output

### 🎯 Usage

1. **Connect Wallet** - Connect your MetaMask wallet to the application
2. **Create Loan Request** - Set amount (0.01-1000 ETH) and duration
3. **Browse Marketplace** - View and filter available loan requests
4. **Fund Loans** - Lend to borrowers and earn interest
5. **Manage Portfolio** - Track your loans and earnings

## 💡 Why Choose FinBridge?

### 🏦 **Traditional Banking vs FinBridge**

| Feature | Traditional Banks | FinBridge |
|---------|-------------------|-----------|
| **Approval Time** | Days to weeks | Instant |
| **Interest Rates** | Fixed, high fees | Market-driven, transparent |
| **Global Access** | Limited by geography | Available worldwide |
| **Transparency** | Opaque processes | Fully transparent |
| **Intermediary Fees** | High fees | Minimal gas fees only |
| **Collateral Requirements** | Extensive documentation | Crypto-based |

### 🌟 **Key Benefits**

- **💸 Lower Costs** - No banking fees, only minimal gas costs
- **⚡ Speed** - Instant loan processing and funding
- **🔒 Security** - Immutable smart contracts ensure trust
- **🌐 Accessibility** - Open to anyone with crypto wallet
- **📈 Better Returns** - Competitive interest rates for lenders
- **🎯 Flexibility** - Customizable loan terms and amounts
- **📊 Transparency** - All transactions visible on blockchain

## 📁 Project Structure

```
FinBridge/
├── 📁 backend/
│   ├── 📁 contracts/          # Solidity smart contracts
│   ├── 📁 scripts/            # Deployment scripts
│   ├── 📁 test/               # Contract tests
│   ├── hardhat.config.js      # Hardhat configuration
│   └── package.json
├── 📁 frontend/
│   └── 📁 client/
│       ├── 📁 src/
│       │   ├── 📁 components/  # React components
│       │   ├── 📁 pages/       # Page components
│       │   ├── 📁 context/     # React context
│       │   ├── 📁 contracts/   # Contract ABIs
│       │   └── 📁 hooks/       # Custom hooks
│       ├── package.json
│       └── vite.config.js
└── README.md
```

## 🔧 Smart Contract Features

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

## 🧪 Testing

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

## 🚀 Deployment

### Testnet Deployment
```bash
cd backend
npx hardhat run scripts/deploy.js --network goerli
```

### Mainnet Deployment
```bash
cd backend
npx hardhat run scripts/deploy.js --network mainnet
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🛡️ Security

- Smart contracts audited for common vulnerabilities
- Multi-layered security architecture
- Regular security updates and patches
- Bug bounty program (coming soon)

## 📞 Support & Community

- **Discord**: [Join our community](https://discord.gg/finbridge)
- **Twitter**: [@FinBridgeDeFi](https://twitter.com/FinBridgeDeFi)
- **Email**: support@finbridge.io

## 🗺️ Roadmap

- ✅ **Phase 1**: Core lending functionality
- ✅ **Phase 2**: Advanced filtering and analytics
- 🔄 **Phase 3**: Mobile app development
- 📋 **Phase 4**: Multi-chain support
- 📋 **Phase 5**: Governance token launch
- 📋 **Phase 6**: Advanced DeFi integrations

---

<div align="center">

**Built with ❤️ by the FinBridge Team**


</div>
