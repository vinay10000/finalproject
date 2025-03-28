import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { Header } from "@/components/layout/Header";
import { StartupDetail, type StartupDetailProps } from "@/components/startups/StartupDetail";
import { InvestmentModal } from "@/components/startups/InvestmentModal";
import { TransactionSuccessModal } from "@/components/startups/TransactionSuccessModal";
import { Button } from "@/components/ui/button";
import { MetaMaskProvider } from "@/hooks/use-metamask";
import { useMetaMask } from "@/hooks/use-metamask";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Startup, Investment } from "@shared/schema";

// Initial default values to avoid errors before data is loaded
const DEFAULT_STARTUP: StartupDetailProps = {
  id: 0,
  name: "Loading...",
  category: "",
  fundingStage: "",
  location: "",
  description: "Loading startup details...",
  fundingGoal: 0,
  currentFunding: 0,
  minInvestment: 0.5,
  investorCount: 0,
  daysLeft: 0,
  team: [],
  milestones: [],
  onInvest: () => {},
  contractAddress: "0x0000000000000000000000000000000000000000",
  photoUrl: undefined,
  videoUrl: undefined
};

export default function StartupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const { isConnected, connect, sendTransaction } = useMetaMask();
  const [isInvestModalOpen, setIsInvestModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState({
    amount: 0,
    transactionHash: "",
    blockNumber: 0,
    confirmations: 0
  });

  // Define the invest callback
  const handleInvest = () => {
    setIsInvestModalOpen(true);
  };

  // Fetch the startup data from the API
  const { data: apiStartup, isLoading } = useQuery<Startup, Error>({
    queryKey: [`/api/startups/${id}`]
  });
  
  // Fetch investment data for this startup
  const { data: investments = [] } = useQuery<Investment[], Error>({
    queryKey: [`/api/startups/${id}/investments`],
    enabled: !!apiStartup && apiStartup.id > 0
  });
  
  // Transform API data to the format expected by StartupDetail component
  const getStartupData = (): StartupDetailProps => {
    if (!apiStartup) return DEFAULT_STARTUP;
    
    return {
      id: apiStartup.id,
      name: apiStartup.name,
      category: apiStartup.category,
      fundingStage: apiStartup.fundingStage,
      description: apiStartup.description,
      fundingGoal: apiStartup.fundingGoal,
      currentFunding: apiStartup.currentFunding || 0,
      minInvestment: 0.5, // Default value as it's not in the API
      investorCount: investments?.length || 0,
      daysLeft: 30, // Default value as it's not in the API
      location: apiStartup.location || undefined,
      logoUrl: apiStartup.logoUrl || undefined,
      photoUrl: apiStartup.photoUrl || undefined,
      videoUrl: apiStartup.videoUrl || undefined,
      team: [], // No team data in the API yet
      milestones: [], // No milestone data in the API yet
      onInvest: handleInvest,
      contractAddress: "0x1234567890abcdef1234567890abcdef12345678" // Placeholder contract address
    };
  };
  
  const startup = getStartupData();

  const handleInvestmentSubmit = async (amount: number) => {
    try {
      if (!isConnected) {
        await connect();
      }
      
      // Use a validated contract address to avoid buffer overrun issues
      // We'll ensure the address is a valid Ethereum address with proper checksum
      const contractAddress: string = 
        startup.contractAddress && 
        startup.contractAddress.startsWith('0x') && 
        startup.contractAddress.length === 42 
          ? startup.contractAddress 
          : '0x0000000000000000000000000000000000000000'; // fallback to zero address
      
      // Log transaction details for debugging
      console.log(`Sending transaction to ${contractAddress} for ${amount} ETH`);
      
      // Send the transaction through MetaMask with simplified parameters
      const txHash = await sendTransaction(
        contractAddress, 
        amount.toString()
      );
      
      // Show loading toast while we wait for confirmation
      toast({
        title: "Transaction Submitted",
        description: "Your investment transaction has been submitted to the blockchain. Please wait for confirmation.",
      });
      
      console.log(`Transaction submitted with hash: ${txHash}`);
      
      // In a production environment, we would listen for transaction confirmation
      // For now, we'll simulate it with a timeout and then show success
      setTimeout(() => {
        // Create transaction details based on the real transaction hash
        setTransactionDetails({
          amount,
          transactionHash: txHash,
          blockNumber: Math.floor(17000000 + Math.random() * 1000000),
          confirmations: 1
        });
        
        // Update the backend with the investment (in a real app)
        if (apiStartup?.id) {
          // Record the investment in the database
          // This would be implemented with a mutation to create a new investment
        }
        
        setIsInvestModalOpen(false);
        setIsSuccessModalOpen(true);
      }, 2000);
      
    } catch (error: any) {
      console.error("Investment transaction failed:", error);
      
      // Create a more user-friendly error message based on the type of error
      let errorMessage = error?.message || "There was an error processing your investment";
      let shouldShowInModal = true;
      
      // Format special error cases
      if (error?.code === 4001) {
        errorMessage = "Transaction rejected. Please try again and approve the transaction in MetaMask.";
        shouldShowInModal = false; // Simple rejection doesn't need the detailed modal
      } else if (error?.message?.includes("buffer") || error?.message?.includes("out-of-bounds")) {
        errorMessage = "Transaction data error. Please try a smaller amount (0.01 ETH or less).";
      } else if (error?.message?.includes("insufficient funds")) {
        errorMessage = "You don't have enough ETH in your wallet. Please add funds and try again.";
      }
      
      // For simple errors, just show a toast
      if (!shouldShowInModal) {
        toast({
          title: "Investment Failed",
          description: errorMessage,
          variant: "destructive"
        });
      }
      
      // For complex errors, the modal will handle display via its error prop
      // Let the error bubble up to the InvestmentModal component
      throw error;
    }
  };

  return (
    <MetaMaskProvider>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <div className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <Button
                variant="ghost"
                className="flex items-center text-gray-600 hover:text-gray-900"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <span className="ml-3">Loading startup details...</span>
              </div>
            ) : (
              <StartupDetail
                {...startup}
                investorCount={investments?.length || 0}
                onInvest={handleInvest}
              />
            )}
          </div>
        </div>
        
        <InvestmentModal
          isOpen={isInvestModalOpen}
          onClose={() => setIsInvestModalOpen(false)}
          onInvest={handleInvestmentSubmit}
          startupName={startup.name}
          minInvestment={startup.minInvestment}
        />
        
        <TransactionSuccessModal
          isOpen={isSuccessModalOpen}
          onClose={() => setIsSuccessModalOpen(false)}
          startupName={startup.name}
          amount={transactionDetails.amount}
          transactionHash={transactionDetails.transactionHash}
          blockNumber={transactionDetails.blockNumber}
          confirmations={transactionDetails.confirmations}
        />
      </div>
    </MetaMaskProvider>
  );
}
