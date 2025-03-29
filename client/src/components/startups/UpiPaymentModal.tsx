import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { insertInvestmentSchema } from "@shared/schema";
import { z } from "zod";

export type UpiPaymentModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investorId: number;
  startupId: number;
  startupName: string;
  upiId?: string;
  upiQr?: string;
};

export function UpiPaymentModal({
  open,
  onOpenChange,
  investorId,
  startupId,
  startupName,
  upiId,
  upiQr
}: UpiPaymentModalProps) {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const recordInvestmentMutation = useMutation({
    mutationFn: async (data: { investorId: number; startupId: number; amount: number; transactionHash: string }) => {
      const response = await apiRequest("POST", "/api/investments", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/startups", startupId] });
      queryClient.invalidateQueries({ queryKey: ["/api/investments"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${investorId}/investments`] });
      
      toast({
        title: "Investment Successful",
        description: `You have successfully invested in ${startupName}`,
      });
      
      setAmount("");
      setTransactionId("");
      setIsSubmitting(false);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Investment Failed",
        description: error.message || "Failed to record your investment",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const handleSubmit = () => {
    try {
      if (!investorId || !startupId) {
        toast({
          title: "Error",
          description: "Missing investor or startup information",
          variant: "destructive",
        });
        return;
      }

      // Validate input
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid investment amount",
          variant: "destructive",
        });
        return;
      }

      if (!transactionId || transactionId.trim() === "") {
        toast({
          title: "Transaction ID Required",
          description: "Please enter your UPI transaction ID for reference",
          variant: "destructive",
        });
        return;
      }

      setIsSubmitting(true);
      const data = {
        investorId,
        startupId,
        amount: parseFloat(amount),
        transactionHash: `UPI-${transactionId.trim()}`
      };
      
      recordInvestmentMutation.mutate(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred during the investment process",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>UPI Payment</DialogTitle>
          <DialogDescription>
            Make a payment using UPI to invest in {startupName}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {upiQr && (
            <div className="flex flex-col items-center justify-center mb-4">
              <img 
                src={upiQr} 
                alt="UPI QR Code" 
                className="w-full max-w-[200px] h-auto mb-2"
              />
              <p className="text-sm text-center text-gray-500">Scan this QR code to pay</p>
            </div>
          )}
          
          {upiId && (
            <div className="flex flex-col space-y-1.5 mb-4">
              <Label htmlFor="upiId">UPI ID</Label>
              <div className="flex items-center">
                <Input
                  id="upiId"
                  value={upiId}
                  readOnly
                  className="flex-1"
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    navigator.clipboard.writeText(upiId);
                    toast({
                      title: "UPI ID copied",
                      description: "UPI ID has been copied to clipboard",
                    });
                  }}
                  className="ml-2"
                >
                  Copy
                </Button>
              </div>
            </div>
          )}
          
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="amount">Amount (ETH equivalent)</Label>
            <Input
              id="amount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Enter investment amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="transactionId">UPI Transaction ID</Label>
            <Input
              id="transactionId"
              placeholder="Enter your UPI transaction reference"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the transaction ID/reference number from your UPI payment app.
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => {
              setAmount("");
              setTransactionId("");
              onOpenChange(false);
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !amount || !transactionId}
          >
            {isSubmitting ? "Processing..." : "Confirm Investment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}