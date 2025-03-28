import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/layout/Header";
import { InvestorDashboard } from "@/components/dashboard/InvestorDashboard";
import { StartupDashboard } from "@/components/dashboard/StartupDashboard";
import { useQuery } from "@tanstack/react-query";
import { StartupCardProps } from "@/components/startups/StartupCard";
import { apiRequest } from "@/lib/queryClient";

export default function HomePage() {
  const { user } = useAuth();
  const isInvestor = user?.userType === "investor";

  // Fetch startups for investor dashboard
  const { data: startups = [], isLoading: isLoadingStartups } = useQuery({
    queryKey: ["/api/startups"],
    enabled: isInvestor,
  });

  // For startup dashboard: fetch the startup profile, investors, and other data
  const { data: startupProfile, isLoading: isLoadingStartup } = useQuery({
    queryKey: ["/api/startups/user", user?.id],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/users/${user?.id}/startup`);
        return await res.json();
      } catch (error) {
        console.error("Error fetching startup profile:", error);
        return null;
      }
    },
    enabled: !isInvestor && !!user,
  });

  // Fetch investments for the startup
  const { data: investorsData = [], isLoading: isLoadingInvestors } = useQuery({
    queryKey: ["/api/startups", startupProfile?.id, "investments"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/startups/${startupProfile?.id}/investments`);
        return await res.json();
      } catch (error) {
        console.error("Error fetching startup investments:", error);
        return [];
      }
    },
    enabled: !isInvestor && !!startupProfile,
  });

  // Process startup data for InvestorDashboard
  const processedStartups: StartupCardProps[] = startups.map((startup: any) => ({
    id: startup.id,
    name: startup.name,
    logoUrl: startup.logoUrl,
    category: startup.category,
    fundingStage: startup.fundingStage,
    description: startup.description,
    fundingGoal: startup.fundingGoal,
    currentFunding: startup.currentFunding,
  }));

  // Process investors data for StartupDashboard
  const processedInvestors = investorsData.map((inv: any) => ({
    id: inv.id,
    name: inv.investorName || "Anonymous Investor",
    email: inv.investorEmail || "anonymous@example.com",
    amount: inv.amount,
    date: new Date(inv.createdAt).toLocaleDateString(),
    time: new Date(inv.createdAt).toLocaleTimeString(),
    walletAddress: inv.investorWallet ? 
      `${inv.investorWallet.slice(0, 6)}...${inv.investorWallet.slice(-4)}` : 
      "Unknown",
    status: "confirmed" as const,
  }));

  // If we don't have real data yet and not loading, use mock data for demo purposes
  const useStartupMockData = !isInvestor && !isLoadingStartup && !startupProfile;
  const useInvestorMockData = isInvestor && !isLoadingStartups && processedStartups.length === 0;

  // Mock data for investor dashboard when we don't have real data
  const MOCK_STARTUPS: StartupCardProps[] = [
    {
      id: 1,
      name: "DecentraTrade",
      category: "Blockchain",
      fundingStage: "Seed",
      description: "Decentralized trading platform leveraging blockchain for secure, transparent peer-to-peer transactions with minimal fees and maximum security.",
      fundingGoal: 250,
      currentFunding: 112.5,
    },
    {
      id: 2,
      name: "HealthLedger",
      category: "Health Tech",
      fundingStage: "Series A",
      description: "Blockchain-based healthcare records management system providing secure and private patient data access while ensuring compliance with regulations.",
      fundingGoal: 500,
      currentFunding: 390,
    },
    {
      id: 3,
      name: "SolarChain",
      category: "Clean Energy",
      fundingStage: "Pre-seed",
      description: "Democratizing renewable energy investment through fractional ownership of solar farms on the blockchain, allowing anyone to invest in clean energy.",
      fundingGoal: 100,
      currentFunding: 22,
    },
  ];

  // Mock investors for startup dashboard when we don't have real data
  const MOCK_INVESTORS = [
    {
      id: 1,
      name: "Laura Chung",
      email: "laura@example.com",
      amount: 5.0,
      date: "Nov 28, 2023",
      time: "08:32 AM",
      walletAddress: "0x42B...9F34",
      status: "confirmed" as const
    },
    {
      id: 2,
      name: "Michael Foster",
      email: "michael@example.com",
      amount: 2.5,
      date: "Nov 27, 2023",
      time: "11:15 AM",
      walletAddress: "0x59A...3E21",
      status: "confirmed" as const
    },
    {
      id: 3,
      name: "Dries Vincent",
      email: "dries@example.com",
      amount: 10.0,
      date: "Nov 26, 2023",
      time: "03:42 PM",
      walletAddress: "0x81F...A6B2",
      status: "confirmed" as const
    }
  ];

  // Determine which dashboard to show based on user type
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="py-10">
        <main>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {isInvestor ? (
              <InvestorDashboard 
                startups={useInvestorMockData ? MOCK_STARTUPS : processedStartups} 
              />
            ) : (
              <StartupDashboard 
                fundingProgress={startupProfile?.fundingProgress || 45}
                fundingGoal={startupProfile?.fundingGoal || 250}
                currentFunding={startupProfile?.currentFunding || 112.5}
                totalInvestors={processedInvestors.length || 42}
                investorsChange={startupProfile?.investorsChange || 5}
                daysRemaining={startupProfile?.daysRemaining || 18}
                endDate={startupProfile?.endDate || "Dec 15, 2023"}
                availableToWithdraw={startupProfile?.availableToWithdraw || 75}
                investors={useStartupMockData ? MOCK_INVESTORS : processedInvestors}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
