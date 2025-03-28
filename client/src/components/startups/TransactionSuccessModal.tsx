import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2 } from "lucide-react";

type TransactionSuccessModalProps = {
  isOpen: boolean;
  onClose: () => void;
  startupName: string;
  amount: number;
  transactionHash: string;
  blockNumber: number;
  confirmations: number;
};

export function TransactionSuccessModal({
  isOpen,
  onClose,
  startupName,
  amount,
  transactionHash,
  blockNumber,
  confirmations,
}: TransactionSuccessModalProps) {
  // Shorten the transaction hash for display
  const shortHash = transactionHash 
    ? `${transactionHash.substring(0, 6)}...${transactionHash.substring(transactionHash.length - 4)}`
    : "";

  // Create etherscan link for the transaction
  const etherscanLink = `https://etherscan.io/tx/${transactionHash}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <DialogTitle className="text-center pt-4">Transaction Successful!</DialogTitle>
          <DialogDescription className="text-center">
            Your investment of {amount} ETH in {startupName} has been confirmed on the blockchain.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md bg-green-50 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Transaction Details</h3>
              <div className="mt-2 text-sm text-green-700">
                <p className="mb-1">
                  Transaction Hash:{" "}
                  <a 
                    href={etherscanLink} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="font-mono underline"
                  >
                    {shortHash}
                  </a>
                </p>
                <p className="mb-1">Block: #{blockNumber}</p>
                <p>Confirmation: {confirmations}/12</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" onClick={onClose} className="w-full">
            Return to Startup Page
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
