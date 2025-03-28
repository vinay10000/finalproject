import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

interface MetaMaskContextType {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  isSyncingWallet: boolean;
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
  const [isSyncingWallet, setIsSyncingWallet] = useState<boolean>(false);
  const { toast } = useToast();
  const { user, updateWalletMutation } = useAuth();

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

  // Effect to sync wallet address with user account when both are available
  useEffect(() => {
    const syncWalletWithUserAccount = async () => {
      if (user && address && user.walletAddress !== address) {
        try {
          setIsSyncingWallet(true);
          
          // Use the updateWalletMutation that we accessed at the top level
          updateWalletMutation.mutate(
            { walletAddress: address },
            {
              onError: (error) => {
                console.error("Error syncing wallet:", error);
                toast({
                  title: "Wallet Sync Failed",
                  description: error?.message || "Failed to link your wallet to your account. Please try again.",
                  variant: "destructive",
                });
              },
              onSettled: () => {
                setIsSyncingWallet(false);
              }
            }
          );
        } catch (error: any) {
          console.error("Error syncing wallet:", error);
          toast({
            title: "Wallet Sync Failed",
            description: error?.message || "Failed to link your wallet to your account. Please try again.",
            variant: "destructive",
          });
          setIsSyncingWallet(false);
        }
      }
    };
    
    if (user && address) {
      syncWalletWithUserAccount();
    }
  }, [user, address, updateWalletMutation, toast]);

  const connect = async (): Promise<string> => {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed. Please install MetaMask to use this feature.");
    }

    setIsConnecting(true);
    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const newAddress = accounts[0];
      
      // Update local state
      setAddress(newAddress);
      setIsConnected(true);
      
      // The useEffect above will handle syncing with the user account if needed
      
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
      const amountWei = BigInt(Math.floor(parseFloat(amount) * 1e18));
      const amountHex = '0x' + amountWei.toString(16);
      
      // Show pre-transaction notification
      toast({
        title: "Opening MetaMask",
        description: "Please confirm the transaction in your MetaMask wallet.",
      });
      
      // Send transaction with minimal parameters to avoid errors
      // The 'data' field was causing the buffer overrun
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: address,
          to,
          value: amountHex,
          // Remove excessive gas parameters and data field that was causing issues
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
      } else if (error?.message?.includes("buffer")) {
        // Special handling for buffer overrun errors
        console.error("Buffer error detected, trying simplified transaction");
        // Could implement a fallback here if needed
        throw new Error("Transaction format error. Please try a smaller amount or contact support.");
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
        isSyncingWallet,
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
