import { ethers } from "ethers";

// ABI for the Investment contract
const INVESTMENT_CONTRACT_ABI = [
  // Contract events
  "event StartupRegistered(address indexed wallet, uint256 fundingGoal)",
  "event InvestmentMade(address indexed investor, address indexed startup, uint256 amount)",
  "event FundsWithdrawn(address indexed startup, address indexed to, uint256 amount)",
  
  // View functions
  "function getStartup(address startupAddress) view returns (address wallet, uint256 fundingGoal, uint256 currentFunding, bool active)",
  "function getInvestmentCount() view returns (uint256)",
  "function getInvestorInvestments(address investor) view returns (uint256[] memory)",
  "function getStartupInvestments(address startupAddress) view returns (uint256[] memory)",
  "function investments(uint256 index) view returns (address investor, address startup, uint256 amount, uint256 timestamp)",
  
  // State changing functions
  "function invest(address startupAddress) payable",
  "function withdrawFunds(uint256 amount)",
  "function registerStartup(address startupAddress, uint256 fundingGoal)"
];

// This would be fetched from environment variables in a real application
const CONTRACT_ADDRESS = process.env.VITE_CONTRACT_ADDRESS || "0x123456789abcdef123456789abcdef123456789";

/**
 * Get the Investment contract instance
 * @param provider The Ethereum provider (e.g., from MetaMask)
 * @param withSigner Whether to include the signer for transactions
 * @returns The contract instance
 */
export function getInvestmentContract(provider: ethers.providers.Web3Provider, withSigner = false) {
  if (!provider) {
    throw new Error("Ethereum provider not available");
  }
  
  if (withSigner) {
    const signer = provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, INVESTMENT_CONTRACT_ABI, signer);
  }
  
  return new ethers.Contract(CONTRACT_ADDRESS, INVESTMENT_CONTRACT_ABI, provider);
}

/**
 * Make an investment in a startup
 * @param provider The Ethereum provider
 * @param startupAddress The Ethereum address of the startup
 * @param amount The amount to invest in ETH
 * @returns The transaction response
 */
export async function investInStartup(
  provider: ethers.providers.Web3Provider,
  startupAddress: string,
  amount: string
) {
  const contract = getInvestmentContract(provider, true);
  
  // Convert ETH to wei
  const valueInWei = ethers.utils.parseEther(amount);
  
  // Make the transaction
  const tx = await contract.invest(startupAddress, {
    value: valueInWei
  });
  
  // Wait for the transaction to be mined
  const receipt = await tx.wait();
  
  return {
    transactionHash: receipt.transactionHash,
    blockNumber: receipt.blockNumber,
    confirmations: receipt.confirmations
  };
}

/**
 * Get the details of a startup
 * @param provider The Ethereum provider
 * @param startupAddress The Ethereum address of the startup
 * @returns The startup details
 */
export async function getStartupDetails(
  provider: ethers.providers.Web3Provider,
  startupAddress: string
) {
  const contract = getInvestmentContract(provider);
  const [wallet, fundingGoal, currentFunding, active] = await contract.getStartup(startupAddress);
  
  return {
    wallet,
    fundingGoal: ethers.utils.formatEther(fundingGoal),
    currentFunding: ethers.utils.formatEther(currentFunding),
    active
  };
}

/**
 * Withdraw funds as a startup
 * @param provider The Ethereum provider
 * @param amount The amount to withdraw in ETH
 * @returns The transaction response
 */
export async function withdrawFunds(
  provider: ethers.providers.Web3Provider,
  amount: string
) {
  const contract = getInvestmentContract(provider, true);
  
  // Convert ETH to wei
  const valueInWei = ethers.utils.parseEther(amount);
  
  // Make the transaction
  const tx = await contract.withdrawFunds(valueInWei);
  
  // Wait for the transaction to be mined
  const receipt = await tx.wait();
  
  return {
    transactionHash: receipt.transactionHash,
    blockNumber: receipt.blockNumber,
    confirmations: receipt.confirmations
  };
}

/**
 * Register a new startup
 * @param provider The Ethereum provider
 * @param startupAddress The Ethereum address of the startup
 * @param fundingGoal The funding goal in ETH
 * @returns The transaction response
 */
export async function registerStartup(
  provider: ethers.providers.Web3Provider,
  startupAddress: string,
  fundingGoal: string
) {
  const contract = getInvestmentContract(provider, true);
  
  // Convert ETH to wei
  const goalInWei = ethers.utils.parseEther(fundingGoal);
  
  // Make the transaction
  const tx = await contract.registerStartup(startupAddress, goalInWei);
  
  // Wait for the transaction to be mined
  const receipt = await tx.wait();
  
  return {
    transactionHash: receipt.transactionHash,
    blockNumber: receipt.blockNumber,
    confirmations: receipt.confirmations
  };
}

/**
 * Get all investments for an investor
 * @param provider The Ethereum provider
 * @param investorAddress The Ethereum address of the investor
 * @returns The investment details
 */
export async function getInvestorInvestments(
  provider: ethers.providers.Web3Provider,
  investorAddress: string
) {
  const contract = getInvestmentContract(provider);
  
  // Get the indices of investments for this investor
  const indices = await contract.getInvestorInvestments(investorAddress);
  
  // Get the details of each investment
  const investments = await Promise.all(
    indices.map(async (index: ethers.BigNumber) => {
      const [investor, startup, amount, timestamp] = await contract.investments(index);
      return {
        investor,
        startup,
        amount: ethers.utils.formatEther(amount),
        timestamp: new Date(timestamp.toNumber() * 1000)
      };
    })
  );
  
  return investments;
}

/**
 * Get all investments for a startup
 * @param provider The Ethereum provider
 * @param startupAddress The Ethereum address of the startup
 * @returns The investment details
 */
export async function getStartupInvestments(
  provider: ethers.providers.Web3Provider,
  startupAddress: string
) {
  const contract = getInvestmentContract(provider);
  
  // Get the indices of investments for this startup
  const indices = await contract.getStartupInvestments(startupAddress);
  
  // Get the details of each investment
  const investments = await Promise.all(
    indices.map(async (index: ethers.BigNumber) => {
      const [investor, startup, amount, timestamp] = await contract.investments(index);
      return {
        investor,
        startup,
        amount: ethers.utils.formatEther(amount),
        timestamp: new Date(timestamp.toNumber() * 1000)
      };
    })
  );
  
  return investments;
}
