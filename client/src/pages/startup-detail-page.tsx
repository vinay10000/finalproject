import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { Header } from "@/components/layout/Header";
import { StartupDetail } from "@/components/startups/StartupDetail";
import { InvestmentModal } from "@/components/startups/InvestmentModal";
import { TransactionSuccessModal } from "@/components/startups/TransactionSuccessModal";
import { Button } from "@/components/ui/button";
import { MetaMaskProvider } from "@/hooks/use-metamask";
import { useMetaMask } from "@/hooks/use-metamask";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// This would be fetched from the API in a real implementation
const MOCK_STARTUP_DETAILS = {
  id: 1,
  name: "DecentraTrade",
  category: "Blockchain",
  fundingStage: "Seed",
  location: "San Francisco, CA",
  description: `DecentraTrade is a decentralized trading platform that leverages blockchain technology to enable secure, transparent peer-to-peer transactions with minimal fees and maximum security. Our platform eliminates intermediaries, reducing costs and increasing efficiency while providing users with full control over their assets.

Unlike traditional exchanges, DecentraTrade uses smart contracts to automate trades, ensuring that transactions are executed exactly as agreed upon by the parties involved. This eliminates the risk of fraud and counterparty default, making trading safer and more reliable.

Key features include decentralized order book with on-chain settlement, multi-signature wallet integration for enhanced security, cross-chain trading capabilities, zero-knowledge proof verification for privacy, and liquidity mining rewards for platform users.`,
  fundingGoal: 250,
  currentFunding: 112.5,
  minInvestment: 0.5,
  investorCount: 42,
  daysLeft: 18,
  team: [
    { name: "Alex Johnson", role: "CEO & Co-founder" },
    { name: "Sarah Chen", role: "CTO & Co-founder" },
    { name: "Michael Rivera", role: "Head of Blockchain" },
    { name: "David Kim", role: "Head of Business Dev" }
  ],
  milestones: [
    { title: "MVP Launch & Initial Testing", date: "Q1 2023", completed: true },
    { title: "Beta Platform with Initial User Base", date: "Q2 2023", completed: true },
    { title: "Full Platform Launch with Cross-Chain Support", date: "Q4 2023", completed: false },
    { title: "Mobile App Release & Global Expansion", date: "Q2 2024", completed: false }
  ],
  // This would be the actual contract address in a real implementation
  contractAddress: "0x1234567890abcdef1234567890abcdef12345678"
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

  // In a real implementation, fetch the startup data from the API
  const { data: startup = MOCK_STARTUP_DETAILS } = useQuery({
    queryKey: [`/api/startups/${id}`],
    // Will use global fetchFn from QueryClient
  });

  const handleInvest = () => {
    setIsInvestModalOpen(true);
  };

  const handleInvestmentSubmit = async (amount: number) => {
    try {
      if (!isConnected) {
        await connect();
      }
      
      // This would be implemented in a production environment
      // to interact with the smart contract and process the investment
      const txHash = await sendTransaction(
        startup.contractAddress, 
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
            
            <StartupDetail
              {...startup}
              onInvest={handleInvest}
            />
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
