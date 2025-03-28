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
      if (user && address && !user.walletConfirmed) {
        try {
          // Only attempt to auto-sync if:
          // 1. User doesn't have a wallet address set yet
          // 2. Or the wallet address is different (but not already confirmed)
          if (!user.walletAddress || user.walletAddress !== address) {
            setIsSyncingWallet(true);
            
            // Use the updateWalletMutation that we accessed at the top level
            updateWalletMutation.mutate(
              { walletAddress: address },
              {
                onError: (error) => {
                  console.error("Error syncing wallet:", error);
                  // Don't show toast for "already in use" errors on auto-sync
                  if (!error.message?.includes("already in use")) {
                    toast({
                      title: "Wallet Sync Failed",
                      description: error?.message || "Failed to link your wallet to your account. Please try again.",
                      variant: "destructive",
                    });
                  }
                },
                onSettled: () => {
                  setIsSyncingWallet(false);
                }
              }
            );
          } else {
            // If it's the same address, no need to attempt the update
            setIsSyncingWallet(false);
          }
        } catch (error: any) {
          console.error("Error syncing wallet:", error);
          toast({
            title: "Wallet Sync Failed",
            description: error?.message || "Failed to link your wallet to your account. Please try again.",
            variant: "destructive",
          });
          setIsSyncingWallet(false);
        }
      } else {
        // No need to sync if the user's wallet is already confirmed
        setIsSyncingWallet(false);
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
      // Validate to address
      if (!to || typeof to !== 'string' || !to.startsWith('0x')) {
        throw new Error("Invalid recipient address. Ethereum addresses must start with 0x.");
      }

      // Validate amount
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error("Invalid amount. Please enter a positive number.");
      }

      // Convert ETH amount to wei using ethers.js-style conversion but safer
      // Limit to a reasonable number of ETH to prevent buffer overflow issues
      if (parseFloat(amount) > 0.1) {
        throw new Error("Please enter a smaller amount (0.1 ETH or less) for testing purposes");
      }
      
      // For safer conversion of ETH to Wei without using BigNumber libraries
      const convertToWei = (ethAmount: string): string => {
        // Limit the amount to max 0.1 ETH to prevent buffer overflow issues
        const amount = Math.min(parseFloat(ethAmount), 0.1);
        
        // Handle very small amounts specially
        if (amount < 0.000001) {
          return '0x0'; // Extremely small amounts become 0
        }
        
        // For very small amounts (but not zero), use a simple fixed conversion
        if (amount <= 0.0001) {
          const weiValue = Math.floor(amount * 1e18);
          return '0x' + weiValue.toString(16);
        }
        
        // For modest amounts, use a simple conversion that's less likely to overflow
        if (amount <= 0.01) {
          const weiBase = Math.floor(amount * 1e16); // Scale by 10^16 instead of 10^18
          return '0x' + weiBase.toString(16) + '00'; // Add two zeros to complete the 18 decimals
        }
        
        // For larger amounts, limit to 5 decimal places max and use a very safe approach
        // This avoids the string manipulation that might be causing buffer issues
        const scaledAmount = Math.floor(amount * 1e5); // Scale by 10^5
        const hexValue = scaledAmount.toString(16);
        
        // Pad with 13 zeros at the end (18 - 5 = 13 more decimal places needed)
        return '0x' + hexValue + '0'.repeat(13);
      };
      
      const amountHex = convertToWei(amount);
      
      // Show pre-transaction notification
      toast({
        title: "Opening MetaMask",
        description: "Please confirm the transaction in your MetaMask wallet.",
      });
      
      // Send transaction with minimal parameters
      const transactionParameters = {
        from: address,
        to,
        value: amountHex,
        // Don't include gas-related parameters or data
      };
      
      console.log("Sending transaction with parameters:", transactionParameters);
      
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
      });
      
      console.log("Transaction submitted:", txHash);
      
      // Show success notification
      toast({
        title: "Transaction Submitted",
        description: "Your transaction has been submitted to the blockchain.",
      });
      
      // Listen for transaction receipt to get confirmation
      const checkTransactionConfirmation = async (txHash: string, attempts = 0): Promise<void> => {
        // Stop checking after 30 attempts (about 1 minute)
        if (attempts > 30) {
          console.log("Stopped checking for confirmation after 30 attempts");
          return;
        }
        
        try {
          const receipt = await window.ethereum.request({
            method: 'eth_getTransactionReceipt',
            params: [txHash],
          });
          
          if (receipt) {
            // Check if transaction was successful
            const status = receipt.status;
            if (status === '0x1') {
              toast({
                title: "Transaction Confirmed",
                description: "Your transaction has been confirmed on the blockchain.",
              });
            } else {
              toast({
                title: "Transaction Failed",
                description: "Your transaction failed on the blockchain. Please check your wallet for details.",
                variant: "destructive",
              });
            }
          } else {
            // Check again after 2 seconds if not confirmed
            setTimeout(() => checkTransactionConfirmation(txHash, attempts + 1), 2000);
          }
        } catch (error) {
          console.error("Error checking confirmation:", error);
          // Continue checking despite errors
          setTimeout(() => checkTransactionConfirmation(txHash, attempts + 1), 2000);
        }
      };
      
      // Start checking for confirmation (in a non-blocking way)
      setTimeout(() => checkTransactionConfirmation(txHash), 2000);
      
      return txHash;
    } catch (error: any) {
      // Handle specific errors with better messages
      if (error?.code === 4001) {
        throw new Error("Transaction rejected by user. Please try again.");
      } else if (error?.code === -32602 || (error?.message && error?.message.includes("params"))) {
        console.error("Transaction parameter error:", error);
        throw new Error("Invalid transaction parameters. Please try again with a different amount.");
      } else if (error?.message?.includes("insufficient funds")) {
        throw new Error("Insufficient funds in your wallet. Please add more ETH to continue.");
      } else if (error?.message?.includes("buffer") || error?.message?.includes("out-of-bounds")) {
        console.error("Buffer error detected:", error);
        throw new Error("Transaction format error. Please try a smaller amount.");
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
