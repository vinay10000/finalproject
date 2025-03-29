import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { createEnhancedMetaMaskError } from "@/lib/metamask-errors";

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

      // Convert ETH amount to wei using a more robust approach with BigInt
      // This fixes the BUFFER_OVERRUN issue by using a consistent method for all amounts
      const convertToWei = (ethAmount: string): string => {
        try {
          // Parse the input as a float
          const amount = parseFloat(ethAmount);
          
          // Handle edge cases
          if (isNaN(amount) || amount <= 0) {
            throw new Error("Invalid amount: must be a positive number");
          }
          
          // Split the amount into integer and decimal parts
          const parts = ethAmount.split('.');
          const integerPart = parts[0];
          const decimalPart = parts.length > 1 ? parts[1].padEnd(18, '0').slice(0, 18) : '0'.repeat(18);
          
          // Handle integer part with BigInt
          let result = BigInt(integerPart) * BigInt(10**18);
          
          // Handle decimal part with BigInt
          if (decimalPart !== '0'.repeat(18)) {
            // If decimal part is all zeros, we can skip this
            const decimalValue = BigInt(decimalPart.padEnd(18, '0').slice(0, 18));
            const decimalMultiplier = BigInt(10**(18 - decimalPart.length));
            result += decimalValue * decimalMultiplier;
          }
          
          // Convert to hex string
          return '0x' + result.toString(16);
        } catch (error) {
          console.error("Error converting ETH to wei:", error);
          // If there's any error, default to a simple calculation that won't overflow
          // This is a fallback method that's safer for MetaMask to handle
          const amount = parseFloat(ethAmount);
          const weiAmount = BigInt(Math.floor(amount)) * BigInt(10**18);
          return '0x' + weiAmount.toString(16);
        }
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
      console.error("Transaction failed:", error);
      
      // Use our utility function to create a properly formatted error object
      const enhancedError = createEnhancedMetaMaskError(error);
      
      throw enhancedError;
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
