import { Link } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

export type StartupCardProps = {
  id: number;
  name: string;
  logoUrl?: string;
  category: string;
  fundingStage: string;
  description: string;
  fundingGoal: number;
  currentFunding: number;
};

export function StartupCard({
  id,
  name,
  logoUrl,
  category,
  fundingStage,
  description,
  fundingGoal,
  currentFunding,
}: StartupCardProps) {
  // Calculate funding percentage
  const fundingPercentage = Math.round((currentFunding / fundingGoal) * 100);
  
  // Generate initials for the avatar fallback
  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center">
          <Avatar className="h-12 w-12">
            {logoUrl ? (
              <img src={logoUrl} alt={name} className="h-full w-full object-cover" />
            ) : (
              <AvatarFallback>{initials}</AvatarFallback>
            )}
          </Avatar>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">{name}</h3>
            <div className="flex items-center mt-1">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                {category}
              </Badge>
              <Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-800 hover:bg-purple-200">
                {fundingStage}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <p className="text-sm text-gray-500 line-clamp-3">
            {description}
          </p>
        </div>
        
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Funding Goal</span>
            <span className="font-medium">{fundingGoal} ETH</span>
          </div>
          <Progress value={fundingPercentage} className="h-2.5 mt-2" />
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-500">{currentFunding} ETH raised</span>
            <span className="text-primary font-medium">{fundingPercentage}%</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="border-t border-gray-200 px-4 py-4">
        <Link href={`/startup/${id}`}>
          <a className="text-sm font-medium text-primary hover:text-primary/80">
            View details<span aria-hidden="true"> &rarr;</span>
          </a>
        </Link>
      </CardFooter>
    </Card>
  );
}
