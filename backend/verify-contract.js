const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🔍 Verifying contract deployment...");
  
  // Get the deployed contract address from artifacts
  const contractPath = path.join(__dirname, "deployments", "localhost", "FinBridgeLending.json");
  let contractAddress;
  
  if (fs.existsSync(contractPath)) {
    const deployment = JSON.parse(fs.readFileSync(contractPath, "utf8"));
    contractAddress = deployment.address;
    console.log("📋 Found deployed contract at:", contractAddress);
  } else {
    // Fallback to the address we saw in terminal
    contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    console.log("📋 Using known contract address:", contractAddress);
  }
  
  // Test contract connection
  try {
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const network = await provider.getNetwork();
    console.log("🌐 Connected to network:", network.chainId.toString());
    
    // Get contract code to verify deployment
    const code = await provider.getCode(contractAddress);
    if (code === "0x") {
      console.log("❌ Contract not deployed at this address!");
      return;
    }
    
    console.log("✅ Contract is deployed and accessible!");
    console.log("📊 Contract code length:", code.length, "bytes");
    
    // Update frontend contract address
    const frontendAbiPath = path.join(__dirname, "..", "frontend", "client", "src", "contracts", "loan-abi.js");
    
    if (fs.existsSync(frontendAbiPath)) {
      let abiContent = fs.readFileSync(frontendAbiPath, "utf8");
      
      // Replace contract address
      const addressRegex = /export const LOAN_CONTRACT_ADDRESS = "[^"]+"/;
      const newAddressLine = `export const LOAN_CONTRACT_ADDRESS = "${contractAddress}"`;
      
      if (addressRegex.test(abiContent)) {
        abiContent = abiContent.replace(addressRegex, newAddressLine);
        fs.writeFileSync(frontendAbiPath, abiContent);
        console.log("✅ Updated frontend contract address!");
      }
    }
    
    console.log("\n🎉 Contract verification complete!");
    console.log("📝 Contract Address:", contractAddress);
    console.log("🌐 Network Chain ID:", network.chainId.toString());
    console.log("🔗 RPC URL: http://127.0.0.1:8545");
    
  } catch (error) {
    console.error("❌ Error verifying contract:", error.message);
  }
}

main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exitCode = 1;
});
