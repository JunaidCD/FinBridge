# FinBridge Platform Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FINBRIDGE PLATFORM                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         FRONTEND (React + Vite)                     │    │
│  │  ┌────────────────────────────────────────────────────────────────┐  │    │
│  │  │                     React Components                          │  │    │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │  │    │
│  │  │  │  Navigation │  │  LoanCard   │  │  LoanRequestForm    │   │  │    │
│  │  │  └─────────────┘  └─────────────┘  └─────────────────────┘   │  │    │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │  │    │
│  │  │  │  StatsCard  │  │  Dashboard  │  │     UI Components   │   │  │    │
│  │  │  └─────────────┘  └─────────────┘  └─────────────────────┘   │  │    │
│  │  └────────────────────────────────────────────────────────────────┘  │    │
│  │                              │                                        │    │
│  │  ┌────────────────────────────────────────────────────────────────┐  │    │
│  │  │                      Context Providers                         │  │    │
│  │  │  ┌──────────────────────┐  ┌────────────────────────────────┐ │  │    │
│  │  │  │   Web3Context        │  │       LoanContext              │ │  │    │
│  │  │  │  - MetaMask Account │  │  - Loan Requests               │ │  │    │
│  │  │  │  - Provider/Signer │  │  - Funded Loans                │ │  │    │
│  │  │  │  - Network Status  │  │  - User Loans                  │ │  │    │
│  │  │  └──────────────────────┘  └────────────────────────────────┘ │  │    │
│  │  └────────────────────────────────────────────────────────────────┘  │    │
│  │                              │                                        │    │
│  │  ┌────────────────────────────────────────────────────────────────┐  │    │
│  │  │                      Contract Layer                            │  │    │
│  │  │  ┌──────────────────────┐  ┌────────────────────────────────┐ │  │    │
│  │  │  │    loan-abi.js       │  │         index.js               │ │  │    │
│  │  │  │  - Contract ABI      │  │  - Contract Initialization     │ │  │    │
│  │  │  │  - Contract Address  │  │  - Contract Utilities          │ │  │    │
│  │  │  │                      │  │  - Event Listeners             │ │  │    │
│  │  │  └──────────────────────┘  └────────────────────────────────┘ │  │    │
│  │  └────────────────────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                          │
│                                    │ HTTPS/RPC                                │
│                                    ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    BLOCKCHAIN (Sepolia Testnet)                    │    │
│  │                                                                      │    │
│  │  ┌────────────────────────────────────────────────────────────────┐  │    │
│  │  │              FinBridgeLending Smart Contract                    │  │    │
│  │  │                                                                  │  │    │
│  │  │  ┌────────────────────┐  ┌────────────────────┐               │  │    │
│  │  │  │   Data Storage     │  │   Core Functions   │               │  │    │
│  │  │  │  ────────────────  │  │  ─────────────────  │               │  │    │
│  │  │  │  - loanRequests    │  │  - createLoanRequest│              │  │    │
│  │  │  │  - users           │  │  - fundLoan         │               │  │    │
│  │  │  │  - connectedWallet│  │  - repayLoan        │               │  │    │
│  │  │  │  - nextLoanId     │  │  - withdrawLoanReq  │               │  │    │
│  │  │  └────────────────────┘  └────────────────────┘               │  │    │
│  │  │                                                                  │  │    │
│  │  │  ┌──────────────────────────────────────────────────────────┐  │    │
│  │  │  │                    View Functions                         │  │    │
│  │  │  │  - getActiveLoanRequests()                               │  │    │
│  │  │  │  - getUserLoanRequests(address)                          │  │    │
│  │  │  │  - getUserFundedLoans(address)                           │  │    │
│  │  │  │  - getLoanRequest(id)                                    │  │    │
│  │  │  │  - getUserStats(address)                                 │  │    │
│  │  │  └──────────────────────────────────────────────────────────┘  │  │    │
│  │  └────────────────────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

                                    │
                                    │ External
                                    ▼
                    ┌───────────────────────────┐
                    │      MetaMask Wallet       │
                    │  ┌─────────────────────┐   │
                    │  │  - Account mgmt    │   │
                    │  │  - Transaction    │   │
                    │  │  - Signing        │   │
                    │  │  - Network config │   │
                    │  └─────────────────────┘   │
                    └───────────────────────────┘
```

---

## Component Details

### Frontend Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        App.jsx                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Route Structure                        │   │
│  │  /                  → Home                              │   │
│  │  /lender           → LenderDashboard                   │   │
│  │  /borrower          → BorrowerDashboard                 │   │
│  │  /repay/:loanId     → RepayLoan                         │   │
│  │  /*                → NotFound                           │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ Web3Context   │    │  LoanContext  │    │  ToastContext │
├───────────────┤    ├───────────────┤    ├───────────────┤
│ account       │    │ loanRequests   │    │ toast()       │
│ provider      │    │ fundedLoans    │    │ toaster       │
│ network       │    │ userLoans      │    └───────────────┘
│ connect()     │    │ createLoan()   │
│ disconnect()  │    │ fundLoan()     │
└───────────────┘    │ repayLoan()    │
                     │ withdrawLoan() │
                     └───────────────┘
```

### Data Flow: Creating a Loan

```
User Action                    Frontend                    Blockchain
    │                            │                            │
    │  1. Fill Loan Form        │                            │
    │──────────────────────────>│                            │
    │                            │                            │
    │                    2. Connect Wallet (if needed)       │
    │                            │──────────────────────────>│
    │                            │<──────────────────────────│
    │                            │                            │
    │                    3. Create Loan Request             │
    │                            │──────────────────────────>│
    │                            │                            │
    │                            │              4. Emit Event│
    │                            │<──────────────────────────│
    │                            │                            │
    │                    5. Refresh Data                     │
    │                            │──────────────────────────>│
    │                            │<──────────────────────────│
    │                            │                            │
    │  6. Success Toast          │                            │
    │<──────────────────────────│                            │
    │                            │                            │
    ▼                            ▼                            ▼
```

### Smart Contract Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    FinBridgeLending.sol                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Structs:                                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  LoanRequest {                                          │   │
│  │    id, borrower, amount, interestRate, duration,        │   │
│  │    timestamp, deadline, isActive, isFunded,            │   │
│  │    lender, fundedAt                                     │   │
│  │  }                                                      │   │
│  │                                                          │   │
│  │  User {                                                 │   │
│  │    isRegistered, loanRequests[], fundedLoans[],        │   │
│  │    totalBorrowed, totalLent                             │   │
│  │  }                                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Mappings:                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  mapping(uint256 => LoanRequest) public loanRequests   │   │
│  │  mapping(address => User) public users                 │   │
│  │  mapping(address => bool) public connectedWallets       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  State Variables:                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  uint256 public nextLoanId = 1                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Network Configuration

```
┌─────────────────────────────────────────────────────────────────┐
│                    Network Settings                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Sepolia Testnet:                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Chain ID:       11155111 (0xAA36A7)                   │   │
│  │  RPC URL:        https://sepolia.drpc.org              │   │
│  │  Contract:       0xEF029e7AD11e137Cd90189C6B07579094a4 │   │
│  │  Currency:       ETH                                    │   │
│  │  Block Explorer: https://sepolia.etherscan.io          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
FinBridge/
├── backend/
│   ├── contracts/
│   │   ├── FinBridgeLending.sol       # Main lending contract
│   │   ├── FinBridgeToken.sol         # ERC20 token
│   │   ├── FinBridgeNFTCollateral.sol # NFT collateral
│   │   └── ... (other contracts)
│   ├── scripts/
│   │   ├── deploy.js                  # Local deployment
│   │   └── deploy-sepolia.js          # Sepolia deployment
│   └── hardhat.config.js
│
├── frontend/
│   ├── client/
│   │   ├── src/
│   │   │   ├── components/           # Reusable UI components
│   │   │   │   ├── loan-card.jsx
│   │   │   │   ├── loan-request-form.jsx
│   │   │   │   ├── navigation.jsx
│   │   │   │   └── ui/                # Shadcn UI components
│   │   │   │
│   │   │   ├── context/               # React Context
│   │   │   │   ├── web3-context.jsx   # Wallet/Network state
│   │   │   │   └── loan-context.jsx   # Loan data/state
│   │   │   │
│   │   │   ├── contracts/             # Smart contract binding
│   │   │   │   ├── loan-abi.js        # Contract ABI
│   │   │   │   └── index.js           # Contract utilities
│   │   │   │
│   │   │   ├── pages/                 # Route pages
│   │   │   │   ├── home.jsx
│   │   │   │   ├── lender-dashboard.jsx
│   │   │   │   ├── borrower-dashboard.jsx
│   │   │   │   └── repay-loan.jsx
│   │   │   │
│   │   │   ├── hooks/                 # Custom hooks
│   │   │   └── App.jsx                # Main app component
│   │   │
│   │   └── .env                       # Environment config
│   │
│   └── package.json
│
└── README.md
```

---

## Key Features

1. **Wallet Connection**: MetaMask integration via Web3Context
2. **Loan Marketplace**: Browse and filter active loan requests
3. **Loan Creation**: Borrowers can request loans with auto-calculated interest
4. **Loan Funding**: Lenders can fund active loans
5. **Loan Repayment**: Borrowers can repay funded loans with interest
6. **Loan Withdrawal**: Borrowers can withdraw unfunded loan requests
7. **Real-time Updates**: Event listeners refresh data automatically
8. **Network Support**: Built for Sepolia testnet (easily scalable to mainnet)
