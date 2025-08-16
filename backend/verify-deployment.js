const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Verifying contract deployment...");
  
  // Get the deployed contract address from artifacts
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  try {
    // Connect to the local network
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    
    // Check network
    const network = await provider.getNetwork();
    console.log(`📡 Connected to network: Chain ID ${network.chainId}`);
    
    // Check if there's code at the contract address
    const code = await provider.getCode(contractAddress);
    
    if (code === "0x") {
      console.log("❌ No contract found at address:", contractAddress);
      console.log("💡 Contract may not be deployed or address is incorrect");
      return false;
    }
    
    console.log("✅ Contract found at address:", contractAddress);
    console.log(`📊 Contract bytecode size: ${code.length} characters`);
    
    // Try to interact with the contract
    const FinBridgeLending = await ethers.getContractFactory("FinBridgeLending");
    const contract = FinBridgeLending.attach(contractAddress);
    
    // Test a simple read function
    try {
      const nextLoanId = await contract.nextLoanId();
      console.log("✅ Contract is responsive! Next loan ID:", nextLoanId.toString());
      
      // Check if contract is paused
      const isPaused = await contract.paused();
      console.log("📋 Contract paused status:", isPaused);
      
      // Get owner
      const owner = await contract.owner();
      console.log("👤 Contract owner:", owner);
      
      return true;
    } catch (error) {
      console.log("❌ Contract exists but not responsive:", error.message);
      return false;
    }
    
  } catch (error) {
    console.error("❌ Error verifying deployment:", error.message);
    return false;
  }
}

main()
  .then((success) => {
    if (success) {
      console.log("\n🎉 Contract verification successful!");
    } else {
      console.log("\n💥 Contract verification failed!");
      console.log("🔧 Try running: npx hardhat run scripts/deploy.js --network localhost");
    }
  })
  .catch((error) => {
    console.error("💥 Verification script failed:", error);
    process.exit(1);
  });
