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
  contractAddress: "0x0000000000000000000000000000000000000000"
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
      
      // This would be implemented in a production environment
      // to interact with the smart contract and process the investment
      const contractAddress: string = "0x1234567890abcdef1234567890abcdef12345678";
      const txHash = await sendTransaction(
        contractAddress, 
        amount.toString()
      );
      
      // Mock successful transaction
      setTransactionDetails({
        amount,
        transactionHash: txHash || "0x3ab6...8c4d", // Use actual hash if available
        blockNumber: 14028501,
        confirmations: 12
      });
      
      setIsInvestModalOpen(false);
      setIsSuccessModalOpen(true);
      
      // In a real implementation, we would also update the backend
      // to record the investment and update the funding progress
      
    } catch (error: any) {
      toast({
        title: "Investment Failed",
        description: error?.message || "There was an error processing your investment",
        variant: "destructive"
      });
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
