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
      throw new Error("MetaMask is not installed");
    }

    if (!isConnected || !address) {
      throw new Error("Wallet not connected");
    }

    try {
      // Convert ETH amount to wei (1 ETH = 10^18 wei)
      const amountInWei = (parseFloat(amount) * 1e18).toString(16);
      
      // Send the transaction
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: address,
          to,
          value: '0x' + amountInWei, // Hexadecimal format
          gas: '0x5208', // 21000 gas (standard transaction)
        }],
      });
      
      return txHash;
    } catch (error: any) {
      console.error("Transaction failed:", error);
      throw new Error(error?.message || "Transaction failed");
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
