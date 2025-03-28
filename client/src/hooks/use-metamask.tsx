import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface MetaMaskContextType {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<string>;
  disconnect: () => void;
  sendTransaction: (to: string, amount: string) => Promise<string>;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

const MetaMaskContext = createContext<MetaMaskContextType | null>(null);

export function MetaMaskProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if MetaMask is installed
    if (typeof window.ethereum !== 'undefined') {
      // Check if already connected and set the address
      checkConnection();
      
      // Listen for account changes
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      
      // Listen for chain changes
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  const checkConnection = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);
        }
      }
    } catch (error) {
      console.error("Error checking connection:", error);
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      // User disconnected their wallet
      setAddress(null);
      setIsConnected(false);
      toast({
        title: "Wallet disconnected",
        description: "Your MetaMask wallet has been disconnected."
      });
    } else {
      // User switched accounts
      setAddress(accounts[0]);
      setIsConnected(true);
    }
  };

  const connect = async (): Promise<string> => {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed. Please install MetaMask to use this feature.");
    }

    setIsConnecting(true);
    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const newAddress = accounts[0];
      setAddress(newAddress);
      setIsConnected(true);
      return newAddress;
    } catch (error: any) {
      // Handle errors like user rejection
      console.error("Error connecting to MetaMask:", error);
      throw new Error(error?.message || "Failed to connect to MetaMask");
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAddress(null);
    setIsConnected(false);
    toast({
      title: "Wallet disconnected",
      description: "Your MetaMask wallet has been disconnected."
    });
  };

  const sendTransaction = async (to: string, amount: string): Promise<string> => {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed. Please install MetaMask to use this feature.");
    }

    if (!isConnected || !address) {
      await connect();
      if (!address) {
        throw new Error("Failed to connect wallet. Please connect to MetaMask first.");
      }
    }

    try {
      // Convert ETH amount to wei (1 ETH = 10^18 wei)
      const amountInWei = BigInt(parseFloat(amount) * 1e18).toString(16);
      
      // Show pre-transaction notification
      toast({
        title: "Opening MetaMask",
        description: "Please confirm the transaction in your MetaMask wallet.",
      });
      
      // Send the transaction with extra parameters for better UX
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: address,
          to,
          value: '0x' + amountInWei, // Hexadecimal format
          gas: '0x186A0', // 100,000 gas (more than standard to ensure success)
          gasPrice: '0x174876E800', // 100 Gwei
          data: '0xa9059cbb', // Smart contract method ID for 'invest' function (for integration with the contract)
        }],
      });
      
      // Log the success of the transaction submission
      console.log("Transaction submitted:", txHash);
      
      // Listen for transaction receipt to get confirmation
      const checkTransactionConfirmation = async (txHash: string): Promise<void> => {
        try {
          const receipt = await window.ethereum.request({
            method: 'eth_getTransactionReceipt',
            params: [txHash],
          });
          
          if (receipt) {
            toast({
              title: "Transaction Confirmed",
              description: `Your transaction has been confirmed on the blockchain.`,
            });
          } else {
            // Check again after 2 seconds if not confirmed
            setTimeout(() => checkTransactionConfirmation(txHash), 2000);
          }
        } catch (error) {
          console.error("Error checking confirmation:", error);
        }
      };
      
      // Start checking for confirmation (in a non-blocking way)
      setTimeout(() => checkTransactionConfirmation(txHash), 2000);
      
      return txHash;
    } catch (error: any) {
      // Handle specific errors with better messages
      if (error?.code === 4001) {
        throw new Error("Transaction rejected by user. Please try again.");
      } else if (error?.message?.includes("insufficient funds")) {
        throw new Error("Insufficient funds in your wallet. Please add more ETH to continue.");
      }
      
      console.error("Transaction failed:", error);
      throw new Error(error?.message || "Transaction failed. Please check your MetaMask wallet and try again.");
    }
  };

  return (
    <MetaMaskContext.Provider
      value={{
        address,
        isConnected,
        isConnecting,
        connect,
        disconnect,
        sendTransaction
      }}
    >
      {children}
    </MetaMaskContext.Provider>
  );
}

export function useMetaMask() {
  const context = useContext(MetaMaskContext);
  if (!context) {
    throw new Error("useMetaMask must be used within a MetaMaskProvider");
  }
  return context;
}
