const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Quick Setup: Deploying FinBridge contract...");
  
  try {
    // Deploy the contract
    const FinBridgeLending = await ethers.getContractFactory("FinBridgeLending");
    const contract = await FinBridgeLending.deploy();
    await contract.waitForDeployment();
    
    const contractAddress = await contract.getAddress();
    console.log("✅ Contract deployed to:", contractAddress);
    
    // Test basic functionality
    const nextLoanId = await contract.nextLoanId();
    console.log("📊 Next loan ID:", nextLoanId.toString());
    
    console.log("\n🔧 Update your frontend contract address to:", contractAddress);
    console.log("📍 File: frontend/client/src/contracts/loan-abi.js");
    console.log("📍 Line: export const LOAN_CONTRACT_ADDRESS = \"" + contractAddress + "\";");
    
    return contractAddress;
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    throw error;
  }
}

main()
  .then((address) => {
    console.log("\n🎉 Setup complete! Contract ready at:", address);
  })
  .catch((error) => {
    console.error("💥 Setup failed:", error);
    process.exit(1);
  });
