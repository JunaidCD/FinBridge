# FinBridge Backend

This is the backend for the FinBridge DeFi lending platform, built with Hardhat and Solidity.

## Features

- **Wallet Connection**: Users must connect their MetaMask wallet before borrowing or lending
- **Loan Requests**: Borrowers can create loan requests with specified amounts, interest rates, and durations
- **Loan Funding**: Lenders can fund loan requests, transferring ETH to borrowers
- **Loan Repayment**: Borrowers can repay loans with interest
- **User Management**: Track user statistics and loan history
- **Security**: Reentrancy protection, pausable functionality, and access control

## Smart Contract: FinBridgeLending

The main contract implements the following functionality:

### Wallet Connection
- `connectWallet()`: Connect a wallet to the platform
- `disconnectWallet()`: Disconnect a wallet from the platform
- `isWalletConnected(address user)`: Check if a wallet is connected

### Loan Management
- `createLoanRequest(uint256 amount, uint256 interestRate, uint256 duration)`: Create a new loan request
- `fundLoan(uint256 loanId)`: Fund a loan request (payable function)
- `repayLoan(uint256 loanId)`: Repay a funded loan (payable function)

### View Functions
- `getLoanRequest(uint256 loanId)`: Get loan request details
- `getActiveLoanRequests()`: Get all active, unfunded loan requests
- `getUserLoanRequests(address user)`: Get user's loan requests
- `getUserFundedLoans(address user)`: Get user's funded loans
- `getUserStats(address user)`: Get user's borrowing/lending statistics

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Compile the contracts:
```bash
npm run compile
```

### Running Tests

Run the test suite:
```bash
npm test
```

### Local Development

1. Start a local Hardhat node:
```bash
npm run node
```

2. In a new terminal, deploy the contract:
```bash
npm run deploy
```

## Contract Architecture

### Key Components

1. **Wallet Connection System**
   - Users must connect their MetaMask wallet before any operations
   - Connection state is tracked on-chain
   - Prevents unauthorized access to lending functions

2. **Loan Request System**
   - Borrowers create loan requests with amount, interest rate, and duration
   - All requests require wallet connection
   - Parameters are validated (amount > 0, interest rate 1-100%, duration > 0)

3. **Funding System**
   - Lenders can fund loan requests by sending exact ETH amount
   - ETH is transferred directly to borrower
   - Only different wallets can fund loans (borrower cannot fund own loan)

4. **Repayment System**
   - Borrowers repay loans with principal + interest
   - Repayment is sent directly to lender
   - Only borrower can repay their own loan

### Security Features

- **ReentrancyGuard**: Prevents reentrancy attacks
- **Pausable**: Contract can be paused by owner in emergencies
- **Ownable**: Access control for admin functions
- **Input Validation**: All parameters are validated
- **Exact Amount Requirements**: Funding and repayment require exact amounts

## Integration with Frontend

The frontend should:

1. **Check Wallet Connection**: Call `isWalletConnected(address)` to verify connection
2. **Connect Wallet**: Call `connectWallet()` when user connects MetaMask
3. **Create Loan Requests**: Call `createLoanRequest()` with form data
4. **Display Active Loans**: Call `getActiveLoanRequests()` to show marketplace
5. **Fund Loans**: Call `fundLoan(loanId)` with exact ETH amount
6. **Repay Loans**: Call `repayLoan(loanId)` with exact repayment amount

## Contract Addresses

After deployment, the contract address will be displayed in the console. Update the frontend configuration with this address.

## Network Configuration

The contract is configured for:
- **Local Development**: Hardhat localhost (chainId: 31337)
- **Test Networks**: Can be configured for testnets like Sepolia, Goerli
- **Mainnet**: Can be deployed to Ethereum mainnet

## Events

The contract emits the following events:
- `WalletConnected(address user)`: When a wallet connects
- `WalletDisconnected(address user)`: When a wallet disconnects
- `LoanRequestCreated(uint256 loanId, address borrower, uint256 amount, uint256 interestRate, uint256 duration)`: When a loan request is created
- `LoanFunded(uint256 loanId, address lender, address borrower, uint256 amount)`: When a loan is funded
- `LoanRepaid(uint256 loanId, address borrower, uint256 amount)`: When a loan is repaid

## Error Handling

The contract includes comprehensive error messages:
- "Wallet not connected. Please connect your MetaMask wallet first."
- "Amount must be greater than 0"
- "Interest rate must be between 1 and 100"
- "Duration must be greater than 0"
- "Cannot fund your own loan"
- "Must send exact loan amount"
- "Loan is already funded"
- "Only the borrower can perform this action"

## Development Workflow

1. Make changes to the smart contract
2. Run tests: `npm test`
3. Compile: `npm run compile`
4. Deploy to local network: `npm run deploy`
5. Update frontend with new contract address
6. Test integration with frontend

## Troubleshooting

### Common Issues

1. **Compilation Errors**: Ensure all OpenZeppelin contracts are properly imported
2. **Deployment Failures**: Check that Hardhat node is running
3. **Test Failures**: Verify that all dependencies are installed
4. **Gas Issues**: Adjust gas limits in deployment script if needed

### Getting Help

- Check the test files for usage examples
- Review the contract comments for function documentation
- Ensure all prerequisites are met before setup 