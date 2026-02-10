import "@nomicfoundation/hardhat-toolbox";

/** @type import('hardhat/config').HardhatUserConfig */
export default {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 31337,
      blockGasLimit: 30000000,
      allowUnlimitedContractSize: true,
      gas: 12000000,
      gasPrice: 20000000000
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      blockGasLimit: 30000000,
      allowUnlimitedContractSize: true,
      gas: 12000000,
      gasPrice: 20000000000
    }
  }
}; 