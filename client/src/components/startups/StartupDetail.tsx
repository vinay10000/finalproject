import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  BellIcon,
  CalendarIcon, 
  CheckIcon, 
  DownloadIcon, 
  FileCode, 
  FileText, 
  Map, 
  MessageSquare,
  PieChart 
} from "lucide-react";
import { useState } from "react";

export type StartupUpdateProps = {
  id: number;
  title: string;
  content: string;
  date: string;
};

export type StartupDetailProps = {
  id: number;
  name: string;
  logo?: string;
  photo?: string;
  video?: string;
  pitchDeck?: string;
  investmentTerms?: string;
  technicalWhitepaper?: string;
  category: string;
  fundingStage: string;
  location?: string;
  description: string;
  fundingGoal: number;
  currentFunding: number;
  minInvestment: number;
  investorCount: number;
  daysLeft: number;
  upiId?: string;
  upiQr?: string;
  walletAddress?: string;
  team?: Array<{
    name: string;
    role: string;
    avatar?: string;
  }>;
  milestones?: Array<{
    title: string;
    date: string;
    completed: boolean;
  }>;
  updates?: StartupUpdateProps[];
  onInvest: () => void;
  onUpiPayment?: () => void;
};

export function StartupDetail({
  name,
  logo,
  photo,
  video,
  pitchDeck,
  investmentTerms,
  technicalWhitepaper,
  category,
  fundingStage,
  location,
  description,
  fundingGoal,
  currentFunding,
  minInvestment,
  investorCount,
  daysLeft,
  upiId,
  upiQr,
  walletAddress,
  team,
  milestones,
  updates,
  onInvest,
  onUpiPayment
}: StartupDetailProps) {
  const [expandedDescription, setExpandedDescription] = useState(false);
  
  // Calculate funding percentage
  const fundingPercentage = Math.round((currentFunding / fundingGoal) * 100);
  
  // Generate initials for the avatar fallback
  const getInitials = (name: string) => name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Startup Header */}
      <Card>
        <CardContent className="p-6 flex items-center">
          <Avatar className="h-16 w-16">
            {logo ? (
              <img src={logo} alt={name} className="h-full w-full object-cover" />
            ) : (
              <AvatarFallback>{getInitials(name)}</AvatarFallback>
            )}
          </Avatar>
          <div className="ml-4">
            <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
            <div className="flex items-center mt-1">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                {category}
              </Badge>
              <Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-800 hover:bg-purple-200">
                {fundingStage}
              </Badge>
              {location && (
                <Badge variant="outline" className="ml-2 flex items-center gap-1">
                  <Map size={12} />
                  {location}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Overview */}
          <Card>
            <CardContent className="p-6">
              {photo && (
                <div className="mb-6">
                  <img 
                    src={photo} 
                    alt={`${name} featured image`} 
                    className="w-full h-64 object-cover rounded-md"
                  />
                </div>
              )}
              
              <h2 className="text-lg font-medium text-gray-900 mb-4">Company Overview</h2>
              <p className={`text-gray-600 ${!expandedDescription && 'line-clamp-4'}`}>
                {description}
              </p>
              {description.length > 300 && (
                <Button 
                  variant="link" 
                  onClick={() => setExpandedDescription(!expandedDescription)}
                  className="mt-2 p-0 h-auto"
                >
                  {expandedDescription ? "Show less" : "Read more"}
                </Button>
              )}
              
              {video && (
                <div className="mt-6">
                  <h3 className="text-md font-medium text-gray-900 mb-2">Promotional Video</h3>
                  <video 
                    src={video} 
                    controls
                    className="w-full rounded-md"
                    style={{ maxHeight: "360px" }}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}

              {/* Team Section */}
              {team && team.length > 0 && (
                <>
                  <Separator className="my-6" />
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Team</h2>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {team.map((member, index) => (
                      <div key={index} className="flex items-center">
                        <Avatar className="h-10 w-10">
                          {member.avatar ? (
                            <img src={member.avatar} alt={member.name} className="h-full w-full object-cover" />
                          ) : (
                            <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                          )}
                        </Avatar>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-gray-900">{member.name}</h3>
                          <p className="text-xs text-gray-500">{member.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Roadmap & Milestones */}
              {milestones && milestones.length > 0 && (
                <>
                  <Separator className="my-6" />
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Roadmap & Milestones</h2>
                  <div className="flow-root">
                    <ul className="-mb-8">
                      {milestones.map((milestone, index) => (
                        <li key={index}>
                          <div className="relative pb-8">
                            {index !== milestones.length - 1 && (
                              <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                            )}
                            <div className="relative flex space-x-3">
                              <div>
                                <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                  milestone.completed ? 'bg-green-500' : index === milestones.findIndex(m => !m.completed) ? 'bg-primary' : 'bg-gray-300'
                                }`}>
                                  {milestone.completed ? (
                                    <CheckIcon className="h-4 w-4 text-white" />
                                  ) : index === milestones.findIndex(m => !m.completed) ? (
                                    <PieChart className="h-4 w-4 text-white animate-spin" />
                                  ) : (
                                    <CalendarIcon className="h-4 w-4 text-white" />
                                  )}
                                </span>
                              </div>
                              <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                <div>
                                  <p className="text-sm text-gray-900">{milestone.title}</p>
                                </div>
                                <div className="text-right text-sm text-gray-500">
                                  <time>{milestone.date}</time>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Funding & Investment */}
        <div className="space-y-6">
          {/* Investment Details */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Investment Details</h2>
              
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

              <div className="mt-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Min. Investment</dt>
                    <dd className="mt-1 text-sm text-gray-900">{minInvestment} ETH</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Investors</dt>
                    <dd className="mt-1 text-sm text-gray-900">{investorCount}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Token Type</dt>
                    <dd className="mt-1 text-sm text-gray-900">Equity</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Days Left</dt>
                    <dd className="mt-1 text-sm text-gray-900">{daysLeft}</dd>
                  </div>
                </dl>
              </div>

              {walletAddress && (
                <div className="mt-4">
                  <dt className="text-sm font-medium text-gray-500">Wallet Address</dt>
                  <dd className="mt-1 text-sm text-gray-900 break-all">{walletAddress}</dd>
                </div>
              )}

              <div className="mt-6 space-y-3">
                <Button className="w-full" onClick={onInvest}>
                  Invest with MetaMask
                </Button>
                
                {upiId && onUpiPayment && (
                  <Button 
                    className="w-full" 
                    onClick={onUpiPayment}
                    variant="outline"
                  >
                    Pay via UPI
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-gray-200">
                {pitchDeck ? (
                  <li className="py-3 px-6">
                    <a 
                      href={pitchDeck}
                      target="_blank" 
                      rel="noopener noreferrer"
                      download="pitch_deck.pdf"
                      className="flex items-center text-sm text-gray-600 hover:text-gray-900"
                    >
                      <FileText className="text-red-500 mr-3 h-4 w-4" />
                      <span>Pitch Deck</span>
                      <DownloadIcon className="ml-auto text-gray-400 h-4 w-4" />
                    </a>
                  </li>
                ) : (
                  <li className="py-3 px-6">
                    <div className="flex items-center text-sm text-gray-400">
                      <FileText className="text-gray-300 mr-3 h-4 w-4" />
                      <span>Pitch Deck</span>
                      <span className="ml-auto text-xs text-gray-400">Not available</span>
                    </div>
                  </li>
                )}
                
                {investmentTerms ? (
                  <li className="py-3 px-6">
                    <a 
                      href={investmentTerms}
                      target="_blank" 
                      rel="noopener noreferrer"
                      download="investment_terms.pdf"
                      className="flex items-center text-sm text-gray-600 hover:text-gray-900"
                    >
                      <FileText className="text-blue-500 mr-3 h-4 w-4" />
                      <span>Investment Terms</span>
                      <DownloadIcon className="ml-auto text-gray-400 h-4 w-4" />
                    </a>
                  </li>
                ) : (
                  <li className="py-3 px-6">
                    <div className="flex items-center text-sm text-gray-400">
                      <FileText className="text-gray-300 mr-3 h-4 w-4" />
                      <span>Investment Terms</span>
                      <span className="ml-auto text-xs text-gray-400">Not available</span>
                    </div>
                  </li>
                )}
                
                {technicalWhitepaper ? (
                  <li className="py-3 px-6">
                    <a 
                      href={technicalWhitepaper}
                      target="_blank" 
                      rel="noopener noreferrer"
                      download="technical_whitepaper.pdf"
                      className="flex items-center text-sm text-gray-600 hover:text-gray-900"
                    >
                      <FileText className="text-yellow-500 mr-3 h-4 w-4" />
                      <span>Technical Whitepaper</span>
                      <DownloadIcon className="ml-auto text-gray-400 h-4 w-4" />
                    </a>
                  </li>
                ) : (
                  <li className="py-3 px-6">
                    <div className="flex items-center text-sm text-gray-400">
                      <FileText className="text-gray-300 mr-3 h-4 w-4" />
                      <span>Technical Whitepaper</span>
                      <span className="ml-auto text-xs text-gray-400">Not available</span>
                    </div>
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Updates Section */}
      {updates && updates.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BellIcon className="h-5 w-5 text-yellow-500 mr-2" />
              Company Updates
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-gray-200">
              {updates.map((update) => (
                <li key={update.id} className="p-6">
                  <div className="flex space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-medium text-gray-900">{update.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{update.content}</p>
                      <div className="mt-2 text-xs text-gray-400">{update.date}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
