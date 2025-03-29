import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  ChartPieIcon, 
  ClockIcon, 
  Send, 
  UserPlus, 
  WalletIcon 
} from "lucide-react";
import { useMetaMask } from "@/hooks/use-metamask";
import { useToast } from "@/hooks/use-toast";

export type Investor = {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string;
  amount: number;
  date: string;
  time: string;
  walletAddress: string;
  status: "confirmed" | "pending";
};

export type StartupDashboardProps = {
  fundingProgress: number;
  fundingGoal: number;
  currentFunding: number;
  totalInvestors: number;
  investorsChange: number;
  daysRemaining: number;
  endDate: string;
  availableToWithdraw: number;
  investors: Investor[];
};

export function StartupDashboard({
  fundingProgress,
  fundingGoal,
  currentFunding,
  totalInvestors,
  investorsChange,
  daysRemaining,
  endDate,
  availableToWithdraw,
  investors
}: StartupDashboardProps) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateContent, setUpdateContent] = useState("");
  const [isPostingUpdate, setIsPostingUpdate] = useState(false);
  const { address, sendTransaction } = useMetaMask();
  const { toast } = useToast();

  const shortWallet = address 
    ? `${address.slice(0, 4)}...${address.slice(-4)}`
    : "Not connected";

  const handleWithdraw = async () => {
    if (!address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your MetaMask wallet first.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Send ETH directly to the wallet address
      const txHash = await sendTransaction(
        address, // Send to the connected wallet
        availableToWithdraw.toString()
      );
      
      toast({
        title: "Withdrawal Successful",
        description: `${availableToWithdraw} ETH has been transferred to your wallet.`,
      });
    } catch (error: any) {
      console.error("Withdrawal failed:", error);
      toast({
        title: "Withdrawal Failed",
        description: error?.message || "Could not complete the withdrawal.",
        variant: "destructive"
      });
    }
  };

  const handlePostUpdate = async () => {
    if (!updateTitle.trim() || !updateContent.trim()) {
      toast({
        title: "Error",
        description: "Please provide both a title and content for your update.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsPostingUpdate(true);
      
      // Send update to backend
      const response = await fetch('/api/updates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: updateTitle,
          content: updateContent
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to post update");
      }
      
      toast({
        title: "Update Posted",
        description: "Your update has been successfully sent to all investors.",
      });
      
      setUpdateTitle("");
      setUpdateContent("");
    } catch (error: any) {
      console.error("Failed to post update:", error);
      toast({
        title: "Failed to Post Update",
        description: error.message || "There was a problem posting your update.",
        variant: "destructive"
      });
    } finally {
      setIsPostingUpdate(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="profile">Edit Profile</TabsTrigger>
          <TabsTrigger value="updates">Post Updates</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Funding Progress Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-primary/10 rounded-md p-3">
                    <ChartPieIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Funding Progress</dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900">{fundingProgress}%</div>
                        <div className="mt-1 flex items-baseline text-sm">
                          <span className="text-gray-500">{currentFunding}/{fundingGoal} ETH</span>
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Investors Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                    <UserPlus className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Investors</dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900">{totalInvestors}</div>
                        <div className="mt-1 flex items-baseline text-sm">
                          <span className="text-green-500 font-medium">+{investorsChange}</span>
                          <span className="ml-1 text-gray-500">from last week</span>
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Remaining Days Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                    <ClockIcon className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Remaining Days</dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900">{daysRemaining}</div>
                        <div className="mt-1 flex items-baseline text-sm">
                          <span className="text-gray-500">Campaign ends {endDate}</span>
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Wallet Balance Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                    <WalletIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Available to Withdraw</dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900">{availableToWithdraw} ETH</div>
                        <div className="mt-1 flex items-baseline text-sm">
                          <span className="text-gray-500">First milestone completed</span>
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 px-6 py-3">
                <Button 
                  variant="link" 
                  className="text-primary w-full p-0 h-auto justify-start"
                  onClick={handleWithdraw}
                >
                  Withdraw to MetaMask ({shortWallet}) &rarr;
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Recent Investors Table */}
          <Card>
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <CardTitle>Recent Investors</CardTitle>
                <Button variant="link" className="text-primary">View all</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Investor
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Wallet Address
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {investors.map((investor) => (
                      <tr key={investor.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Avatar className="h-10 w-10">
                              {investor.avatarUrl ? (
                                <img src={investor.avatarUrl} alt={investor.name} className="h-full w-full object-cover" />
                              ) : (
                                <AvatarFallback>{investor.name.charAt(0)}</AvatarFallback>
                              )}
                            </Avatar>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {investor.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {investor.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{investor.amount} ETH</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{investor.date}</div>
                          <div className="text-sm text-gray-500">{investor.time}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="font-mono">{investor.walletAddress}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={investor.status === "confirmed" ? "default" : "outline"} 
                            className={investor.status === "confirmed" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}>
                            {investor.status === "confirmed" ? "Confirmed" : "Pending"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 mb-4">
                This section will allow you to edit your startup profile, update your pitch, and manage funding goals.
              </p>
              <div className="flex justify-center h-64 items-center border border-dashed rounded-md">
                <p className="text-gray-400">Profile editing functionality coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="updates">
          <Card>
            <CardHeader>
              <CardTitle>Post Update to Investors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="update-title" className="block text-sm font-medium text-gray-700">Update Title</label>
                <Input 
                  id="update-title" 
                  placeholder="e.g., New Partnership Announcement" 
                  value={updateTitle}
                  onChange={(e) => setUpdateTitle(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="update-content" className="block text-sm font-medium text-gray-700">Update Content</label>
                <Textarea 
                  id="update-content" 
                  placeholder="Describe your achievement, milestone, or news..." 
                  rows={6}
                  value={updateContent}
                  onChange={(e) => setUpdateContent(e.target.value)}
                />
              </div>
              
              <div className="flex justify-end">
                <Button 
                  onClick={handlePostUpdate} 
                  disabled={isPostingUpdate}
                >
                  {isPostingUpdate ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" /> Post Update
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
