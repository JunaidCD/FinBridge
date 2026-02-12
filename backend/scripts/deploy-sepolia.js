import pkg from 'hardhat';
const { ethers, run } = pkg;

async function main() {
  console.log("🚀 Deploying FinBridge to Sepolia...");
  console.log("Network: Sepolia Testnet (Chain ID: 11155111)");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());
  
  // Deploy FinBridgeLending
  console.log("\n📄 Deploying FinBridgeLending...");
  const FinBridgeLending = await ethers.getContractFactory("FinBridgeLending");
  const lending = await FinBridgeLending.deploy();
  await lending.waitForDeployment();
  
  const lendingAddress = await lending.getAddress();
  console.log("✅ FinBridgeLending deployed to:", lendingAddress);
  
  // Wait for block confirmations (needed for verification)
  console.log("\n⏳ Waiting for 6 block confirmations...");
  await lending.deploymentTransaction().wait(6);
  
  // Verify on Etherscan
  console.log("\n🔍 Verifying contract on Sepolia Etherscan...");
  try {
    await run("verify:verify", {
      address: lendingAddress,
      constructorArguments: []
    });
    console.log("✅ Contract verified on Etherscan!");
  } catch (error) {
    console.log("⚠️ Verification may have already been completed or failed:");
    console.log(error.message);
  }
  
  console.log("\n========================================");
  console.log("🎉 DEPLOYMENT SUCCESSFUL!");
  console.log("========================================");
  console.log("\n📋 Deployment Summary:");
  console.log("Network: Sepolia Testnet");
  console.log("Chain ID: 11155111");
  console.log("Contract: FinBridgeLending");
  console.log("Address:", lendingAddress);
  console.log("\n🔗 Explorer Links:");
  console.log("Etherscan: https://sepolia.etherscan.io/address/" + lendingAddress);
  console.log("\n📝 Update your frontend .env with:");
  console.log("VITE_LOAN_CONTRACT_ADDRESS=" + lendingAddress);
  console.log("VITE_CHAIN_ID=11155111");
  console.log("========================================");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
