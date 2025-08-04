const hre = require("hardhat");

async function main() {
  console.log("Deploying FinBridge Lending Contract...");

  // Get the contract factory
  const FinBridgeLending = await hre.ethers.getContractFactory("FinBridgeLending");
  
  // Deploy the contract
  const lendingContract = await FinBridgeLending.deploy();
  
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
  
  // Verify the deployment
  console.log("\nVerifying deployment...");
  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [],
    });
    console.log("Contract verified on Etherscan");
  } catch (error) {
    console.log("Verification failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 