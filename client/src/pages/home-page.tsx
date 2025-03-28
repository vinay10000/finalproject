import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/layout/Header";
import { InvestorDashboard } from "@/components/dashboard/InvestorDashboard";
import { StartupDashboard } from "@/components/dashboard/StartupDashboard";
import { CreateStartupComponent } from "@/components/startups/CreateStartupForm";
import { useQuery } from "@tanstack/react-query";
import { StartupCardProps } from "@/components/startups/StartupCard";
import { apiRequest } from "@/lib/queryClient";

export default function HomePage() {
  const { user } = useAuth();
  const isInvestor = user?.userType === "investor";

  // Fetch startups for investor dashboard
  const { data: startups = [], isLoading: isLoadingStartups } = useQuery<any[]>({
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

  // We don't use mock data anymore, just displaying what we have from the API

  // Determine which dashboard to show based on user type
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="py-10">
        <main>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {isInvestor ? (
              <InvestorDashboard 
                startups={processedStartups} 
              />
            ) : (
              startupProfile ? (
                <StartupDashboard 
                  fundingProgress={startupProfile.fundingProgress || 0}
                  fundingGoal={startupProfile.fundingGoal || 0}
                  currentFunding={startupProfile.currentFunding || 0}
                  totalInvestors={processedInvestors.length || 0}
                  investorsChange={startupProfile.investorsChange || 0}
                  daysRemaining={startupProfile.daysRemaining || 0}
                  endDate={startupProfile.endDate || new Date().toLocaleDateString()}
                  availableToWithdraw={startupProfile.availableToWithdraw || 0}
                  investors={processedInvestors}
                />
              ) : (
                <CreateStartupComponent userId={user?.id} />
              )
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
