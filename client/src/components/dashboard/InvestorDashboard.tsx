import { useState } from "react";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { StartupCard, StartupCardProps } from "@/components/startups/StartupCard";
import { Search } from "lucide-react";

// Categories for filtering
const CATEGORIES = [
  "All Categories",
  "Fintech",
  "Health Tech",
  "AI & ML",
  "Blockchain",
  "Clean Energy"
];

// Funding stages for filtering
const FUNDING_STAGES = [
  "All Stages",
  "Pre-seed",
  "Seed",
  "Series A",
  "Series B",
  "Series C+"
];

type InvestorDashboardProps = {
  startups: StartupCardProps[];
};

export function InvestorDashboard({ startups }: InvestorDashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [selectedStage, setSelectedStage] = useState(FUNDING_STAGES[0]);

  // Filter startups based on search query and filters
  const filteredStartups = startups.filter(startup => {
    // Search by name or description
    const matchesSearch = searchQuery === "" || 
      startup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      startup.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by category
    const matchesCategory = selectedCategory === "All Categories" || 
      startup.category === selectedCategory;
    
    // Filter by funding stage
    const matchesStage = selectedStage === "All Stages" || 
      startup.fundingStage === selectedStage;
    
    return matchesSearch && matchesCategory && matchesStage;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold leading-tight text-gray-900">Discover Startups</h1>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="col-span-1 sm:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">Search</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  id="search"
                  className="pl-10"
                  placeholder="Search startup name or description"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger id="category" className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label htmlFor="stage" className="block text-sm font-medium text-gray-700">Funding Stage</label>
              <Select value={selectedStage} onValueChange={setSelectedStage}>
                <SelectTrigger id="stage" className="mt-1">
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {FUNDING_STAGES.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {stage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Startup Cards */}
      {filteredStartups.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredStartups.map((startup) => (
            <StartupCard key={startup.id} {...startup} />
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-center">No startups found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-500">
              No startups match your current filters. Try adjusting your search criteria.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
