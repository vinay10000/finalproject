import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowLeft, LineChart, BarChart, PieChart, Briefcase } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import {
  PieChart as RechartPieChart,
  Pie,
  Cell,
  BarChart as RechartBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart as RechartLineChart,
  Line,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Investment, Startup } from "@shared/schema";

export default function MyInvestmentsPage() {
  const { user } = useAuth();
  const [totalInvested, setTotalInvested] = useState(0);
  const [startupData, setStartupData] = useState<Array<{
    id: number | string;
    name: string;
    category: string;
    amount: number;
    percentage: number;
    color: string;
  }>>([]);
  
  // Define a set of colors for the charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c'];

  // Fetch user investments
  const { data: investments, isLoading: isLoadingInvestments } = useQuery<Investment[]>({
    queryKey: ['/api/investments/user'],
    enabled: !!user,
  });

  // Fetch startups to get details for each investment
  const { data: startups, isLoading: isLoadingStartups } = useQuery<Startup[]>({
    queryKey: ['/api/startups'],
    enabled: !!user,
  });

  // Process data for charts when investments and startups are loaded
  useEffect(() => {
    if (investments && startups) {
      // Calculate total invested amount
      const total = investments.reduce((sum, inv) => sum + inv.amount, 0);
      setTotalInvested(total);
      
      // Create data for pie chart with startup details
      const startupInvestmentData = investments.map((investment, index) => {
        const startup = startups.find(s => s.id === investment.startupId);
        return {
          id: investment.startupId,
          name: startup?.name || `Startup ${investment.startupId}`,
          category: startup?.category || 'Unknown',
          amount: investment.amount,
          percentage: Math.round((investment.amount / total) * 100),
          color: COLORS[index % COLORS.length]
        };
      });
      
      setStartupData(startupInvestmentData);
    }
  }, [investments, startups]);

  if (isLoadingInvestments || isLoadingStartups) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  // If no investments yet
  if (!investments || investments.length === 0) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="mb-6 flex items-center">
          <Link href="/" className="mr-4">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">My Investments</h1>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <Briefcase className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-medium mb-2">No Investments Yet</h2>
          <p className="text-gray-500 mb-6">You haven't made any investments yet. Start investing in promising startups to see your portfolio here.</p>
          <Link href="/">
            <Button>Browse Startups</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Create data for historical investments over time
  const timelineData = investments.map(inv => ({
    date: new Date(inv.createdAt || new Date()).toLocaleDateString(),
    amount: inv.amount
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="mb-6 flex items-center">
        <Link href="/" className="mr-4">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">My Investments</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Invested</CardTitle>
            <CardDescription>Your total investments in ETH</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalInvested.toFixed(4)} ETH</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Portfolio Size</CardTitle>
            <CardDescription>Number of startups backed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{startupData.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Average Investment</CardTitle>
            <CardDescription>Per startup in ETH</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(totalInvested / (startupData.length || 1)).toFixed(4)} ETH
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="overview" className="w-full mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="distribution">Portfolio Distribution</TabsTrigger>
          <TabsTrigger value="timeline">Investment Timeline</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="h-5 w-5 mr-2" /> Portfolio Allocation
                </CardTitle>
                <CardDescription>
                  Distribution of your investments by startup
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartPieChart>
                    <Pie
                      data={startupData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                      nameKey="name"
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                    >
                      {startupData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`${value} ETH`, 'Amount']}
                      labelFormatter={(name) => `Startup: ${name}`}
                    />
                    <Legend />
                  </RechartPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart className="h-5 w-5 mr-2" /> Investment by Startup
                </CardTitle>
                <CardDescription>
                  Amount invested in each startup
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartBarChart
                    data={startupData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 75 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`${value} ETH`, 'Amount']}
                      labelFormatter={(name) => `Startup: ${name}`}
                    />
                    <Bar dataKey="amount" name="Amount (ETH)">
                      {startupData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </RechartBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="distribution">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="h-5 w-5 mr-2" /> Category Distribution
              </CardTitle>
              <CardDescription>
                Diversification of your investments by sector
              </CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <RechartPieChart>
                  <Pie
                    data={startupData.reduce((acc, current) => {
                      const existing = acc.find(item => item.category === current.category);
                      if (existing) {
                        existing.amount += current.amount;
                      } else {
                        acc.push({ 
                          category: current.category, 
                          amount: current.amount,
                          color: COLORS[acc.length % COLORS.length]
                        });
                      }
                      return acc;
                    }, [] as Array<{category: string, amount: number, color: string}>)}
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="amount"
                    nameKey="category"
                    label={({ category, amount }) => `${category}: ${(amount / totalInvested * 100).toFixed(0)}%`}
                  >
                    {startupData.reduce((acc, current) => {
                      const existing = acc.find(item => item.category === current.category);
                      if (!existing) {
                        acc.push({ 
                          category: current.category, 
                          amount: current.amount,
                          color: COLORS[acc.length % COLORS.length]
                        });
                      }
                      return acc;
                    }, [] as Array<{category: string, amount: number, color: string}>).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} ETH`, 'Amount']}
                    labelFormatter={(category) => `Category: ${category}`}
                  />
                  <Legend />
                </RechartPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <LineChart className="h-5 w-5 mr-2" /> Investment Timeline
              </CardTitle>
              <CardDescription>
                History of your investments over time
              </CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <RechartLineChart
                  data={timelineData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" angle={-45} textAnchor="end" height={70} />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} ETH`, 'Amount']} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    name="Amount (ETH)"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                  />
                </RechartLineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <h2 className="text-2xl font-bold mb-4">Your Portfolio</h2>
      <div className="space-y-6">
        {startupData.map((startup) => (
          <Card key={startup.id} className="overflow-hidden">
            <div className="p-6">
              <div className="flex items-center">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>{startup.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="ml-4 flex-grow">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">{startup.name}</h3>
                    <span className="text-xl font-bold">{startup.amount.toFixed(4)} ETH</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-gray-500">{startup.category}</span>
                    <span className="text-sm text-gray-500">{startup.percentage}% of portfolio</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Link href={`/startup/${startup.id}`} className="text-sm font-medium text-primary hover:text-primary/80">
                  View startup profile
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}