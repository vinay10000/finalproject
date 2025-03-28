import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ShieldCheck, AlertCircle, Wallet, ExternalLink, CheckCircle2 } from "lucide-react";
import { useMetaMask } from "@/hooks/use-metamask";
import { useAuth } from "@/hooks/use-auth";

export default function WalletProfile() {
  const { address, isConnected, connect, isConnecting } = useMetaMask();
  const { user, updateWalletMutation, confirmWalletMutation } = useAuth();
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  const handleUpdateWallet = async () => {
    if (!address) return;
    
    updateWalletMutation.mutate({ walletAddress: address });
  };

  const handleConfirmWallet = async () => {
    if (!address || !user?.walletAddress) return;
    
    // Only allow confirmation if the connected wallet matches the stored wallet
    if (address.toLowerCase() !== user.walletAddress.toLowerCase()) {
      return;
    }
    
    confirmWalletMutation.mutate({ walletAddress: address });
  };

  const getWalletStatusMessage = () => {
    if (!user?.walletAddress) {
      return "You haven't linked any wallet to your account yet.";
    }
    
    if (user.walletConfirmed) {
      return "Your wallet address has been confirmed and cannot be changed.";
    }
    
    return "Your wallet address has been linked but not confirmed yet.";
  };

  const getWalletStatusIcon = () => {
    if (!user?.walletAddress) {
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
    
    if (user.walletConfirmed) {
      return <ShieldCheck className="h-5 w-5 text-green-500" />;
    }
    
    return <AlertCircle className="h-5 w-5 text-blue-500" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wallet className="mr-2 h-5 w-5" /> Wallet Management
          </CardTitle>
          <CardDescription>
            Manage and confirm your blockchain wallet for secure transactions
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Wallet Status */}
          <Alert variant={
            !user?.walletAddress 
              ? "destructive" 
              : "default"
          }>
            {getWalletStatusIcon()}
            <AlertTitle>Wallet Status</AlertTitle>
            <AlertDescription>
              {getWalletStatusMessage()}
            </AlertDescription>
          </Alert>
          
          {/* MetaMask Connection */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2">MetaMask Connection</h3>
            <div className="flex items-center mb-4">
              <div className={`h-3 w-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span>{isConnected ? 'Connected' : 'Not connected'}</span>
            </div>
            
            {isConnected ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Current Address:</span>
                  <a 
                    href={`https://etherscan.io/address/${address}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sm font-mono text-blue-600 hover:underline flex items-center"
                  >
                    {address}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
                
                {user?.walletAddress && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Stored Address:</span>
                    <span className={`text-sm font-mono ${
                      user.walletAddress.toLowerCase() === address?.toLowerCase() 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {user.walletAddress}
                    </span>
                  </div>
                )}
                
                {(!user?.walletAddress || user.walletAddress.toLowerCase() !== address?.toLowerCase()) && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full"
                    onClick={handleUpdateWallet}
                    disabled={updateWalletMutation.isPending || !!user?.walletConfirmed}
                  >
                    {updateWalletMutation.isPending ? "Updating..." : "Update Wallet Address"}
                  </Button>
                )}
                
                {user?.walletAddress && user.walletAddress.toLowerCase() === address?.toLowerCase() && !user.walletConfirmed && (
                  <div className="space-y-2">
                    {showConfirmation ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                        <h4 className="text-sm font-medium text-yellow-800 mb-1">Confirm Permanently</h4>
                        <p className="text-xs text-yellow-700 mb-2">
                          This action cannot be undone. Once confirmed, your wallet address cannot be changed.
                        </p>
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowConfirmation(false)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={handleConfirmWallet}
                            disabled={confirmWalletMutation.isPending}
                          >
                            {confirmWalletMutation.isPending ? "Confirming..." : "Yes, Confirm"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button 
                        variant="default" 
                        size="sm"
                        className="w-full"
                        onClick={() => setShowConfirmation(true)}
                      >
                        Confirm Wallet Address
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleConnect}
                disabled={isConnecting}
              >
                {isConnecting ? "Connecting..." : "Connect MetaMask"}
              </Button>
            )}
          </div>
          
          {/* Confirmation Status */}
          {user?.walletAddress && user.walletConfirmed && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
                <div>
                  <h3 className="font-medium text-green-800">Wallet Confirmed</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Your wallet has been permanently confirmed. This ensures secure and verified transactions.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="bg-gray-50 border-t p-4">
          <div className="text-xs text-gray-500">
            <p>All blockchain transactions are final and cannot be reversed. Always verify addresses before confirming.</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}