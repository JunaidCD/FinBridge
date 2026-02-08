import hre from "hardhat";

async function main() {
  console.log("Deploying FinBridge Lending Contract...");

  // Get the contract factory
  const FinBridgeLending = await hre.ethers.getContractFactory("FinBridgeLending");
  
  // Deploy the contract
  const lendingContract = await FinBridgeLending.deploy({
    gasLimit: 15000000
  });
  
  // Wait for deployment to finish
  await lendingContract.waitForDeployment();
  
  const contractAddress = await lendingContract.getAddress();
  
  console.log("FinBridge Lending Contract deployed to:", contractAddress);
  console.log("Contract owner:", await lendingContract.owner());
  
  // Save deployment info
  const deploymentInfo = {
    contractAddress: contractAddress,
    network: hre.network.name,
    deployer: (await hre.ethers.getSigners())[0].address,
    timestamp: new Date().toISOString()
  };
  
  console.log("\nDeployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\n✅ Contract deployed successfully!");
  console.log("📝 Note: Verification is skipped for localhost networks");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 