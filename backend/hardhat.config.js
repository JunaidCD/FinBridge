import "@nomicfoundation/hardhat-toolbox";
import { config as dotenvConfig } from "dotenv";

dotenvConfig();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const SEPOLIA_RPC = process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

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
    },
    sepolia: {
      url: SEPOLIA_RPC,
      chainId: 11155111,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      gas: 3000000,
      gasPrice: "auto"
    }
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  }
};