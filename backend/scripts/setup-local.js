const hre = require("hardhat");

async function main() {
  console.log("🔧 Setting up FinBridge Local Development Environment...\n");

  // Check if we're on localhost network
  const network = await hre.ethers.provider.getNetwork();
  if (network.chainId !== 31337n) {
    console.log("⚠️  Warning: Not on localhost network (chainId: 31337)");
    console.log("Current chainId:", network.chainId.toString());
    console.log("Please make sure you're connected to the local Hardhat node.\n");
  }

  // Get signers
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deployer address:", deployer.address);
  console.log("💰 Deployer balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy the contract
  console.log("🚀 Deploying FinBridge Lending Contract...");
  const FinBridgeLending = await hre.ethers.getContractFactory("FinBridgeLending");
  const lendingContract = await FinBridgeLending.deploy();
  await lendingContract.waitForDeployment();
  
  const contractAddress = await lendingContract.getAddress();
  console.log("✅ Contract deployed to:", contractAddress);
  console.log("👤 Contract owner:", await lendingContract.owner());

  // Test basic functionality
  console.log("\n🧪 Testing basic functionality...");
  
  // Test wallet connection
  console.log("🔗 Testing wallet connection...");
  await lendingContract.connectWallet();
  const isConnected = await lendingContract.isWalletConnected(deployer.address);
  console.log("✅ Wallet connected:", isConnected);

  // Test loan request creation
  console.log("📝 Testing loan request creation...");
  const amount = hre.ethers.parseEther("1");
  const interestRate = 10; // 10%
  const duration = 30 * 24 * 60 * 60; // 30 days
  
  await lendingContract.createLoanRequest(amount, interestRate, duration);
  console.log("✅ Loan request created successfully");

  // Get active loans
  const activeLoans = await lendingContract.getActiveLoanRequests();
  console.log("📋 Active loan requests:", activeLoans.length);

  // Save deployment info
  const deploymentInfo = {
    contractAddress: contractAddress,
    network: network.name,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    testResults: {
      walletConnected: isConnected,
      loanRequestCreated: true,
      activeLoansCount: activeLoans.length
    }
  };

  console.log("\n📊 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  console.log("\n🎉 Setup complete! Next steps:");
  console.log("1. Update frontend contract address in: frontend/client/src/contracts/loan-abi.js");
  console.log("2. Start the frontend development server");
  console.log("3. Connect MetaMask to localhost:8545");
  console.log("4. Import the deployer account into MetaMask for testing");
  
  console.log("\n🔑 Deployer private key (for MetaMask import):");
  console.log(deployer.privateKey);
  
  console.log("\n📝 Contract Address for frontend:");
  console.log(contractAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  }); 