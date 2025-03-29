import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMetaMask } from "@/hooks/use-metamask";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { TransactionError } from "@/components/ui/transaction-error";
import { MetaMaskError } from "@/lib/metamask-errors";
import { Wallet } from "lucide-react";

const investmentSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(parseFloat(val)), {
      message: "Amount must be a number",
    })
    .refine((val) => parseFloat(val) > 0, {
      message: "Amount must be greater than 0",
    }),
});

type InvestmentFormValues = z.infer<typeof investmentSchema>;

type InvestmentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onInvest: (amount: number) => Promise<void>;
  startupName: string;
  minInvestment: number;
};

export function InvestmentModal({
  isOpen,
  onClose,
  onInvest,
  startupName,
  minInvestment,
}: InvestmentModalProps) {
  const { connect, address, isConnected, isConnecting } = useMetaMask();
  const [isInvesting, setIsInvesting] = useState(false);
  const [transactionError, setTransactionError] = useState<{
    isVisible: boolean;
    title: string;
    message: string;
    code?: string | number;
    details?: string;
    userAction?: MetaMaskError['userAction'];
  } | null>(null);

  const form = useForm<InvestmentFormValues>({
    resolver: zodResolver(
      investmentSchema.refine(
        (data) => parseFloat(data.amount) >= minInvestment,
        {
          message: `Minimum investment is ${minInvestment} ETH`,
          path: ["amount"],
        }
      )
    ),
    defaultValues: {
      amount: minInvestment.toString(),
    },
  });

  const amount = parseFloat(form.watch("amount") || "0");
  const estimatedFee = 0.002; // Estimated transaction fee in ETH
  const total = amount + estimatedFee;

  async function handleConnectWallet() {
    try {
      await connect();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  }

  async function onSubmit(values: InvestmentFormValues) {
    if (!isConnected) {
      try {
        await handleConnectWallet();
        return;
      } catch (error: any) {
        setTransactionError({
          isVisible: true,
          title: "Wallet Connection Failed",
          message: error?.message || "Failed to connect to your MetaMask wallet.",
          code: error?.code,
          details: error?.stack,
          userAction: error?.userAction || 'reinstall'
        });
        return;
      }
    }
    
    try {
      setIsInvesting(true);
      await onInvest(parseFloat(values.amount));
      form.reset();
      onClose();
    } catch (error: any) {
      console.error("Investment failed:", error);
      
      // Check for specifically handled errors that don't need the error modal
      if (error?.message === "Startup wallet address not found") {
        // This error is already handled with a toast on the detail page
        // No need to show the error modal
      } else if (error?.message === "Invalid startup wallet address format") {
        // This error is already handled with a toast on the detail page
        // No need to show the error modal
      } else {
        // For MetaMask and other errors, show the error modal with details
        setTransactionError({
          isVisible: true,
          title: "Investment Failed",
          message: error?.message || "Failed to process your investment transaction.",
          code: error?.code,
          details: error?.stack,
          userAction: error?.userAction
        });
      }
    } finally {
      setIsInvesting(false);
    }
  }
  
  // Retry the investment with the current form values
  const handleRetryInvestment = () => {
    setTransactionError(null);
    const currentAmount = form.getValues().amount;
    if (currentAmount) {
      form.setValue("amount", (parseFloat(currentAmount) / 2).toString());
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invest in {startupName}</DialogTitle>
            <DialogDescription>
              Enter the amount you want to invest. Your MetaMask wallet will be used to process the transaction.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Investment Amount (ETH)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input {...field} type="number" step="0.01" min={minInvestment} />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">ETH</span>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-gray-500">Minimum investment: {minInvestment} ETH</p>
                  </FormItem>
                )}
              />

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex justify-between mb-2 text-sm">
                  <span className="text-gray-500">Investment Amount</span>
                  <span className="text-gray-900 font-medium">{amount.toFixed(4)} ETH</span>
                </div>
                <div className="flex justify-between mb-2 text-sm">
                  <span className="text-gray-500">Transaction Fee</span>
                  <span className="text-gray-900 font-medium">~{estimatedFee.toFixed(4)} ETH</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">~{total.toFixed(4)} ETH</span>
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-col gap-2">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isConnecting || isInvesting}
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  {isConnected
                    ? isInvesting
                      ? "Processing Investment..."
                      : "Invest Now"
                    : isConnecting
                      ? "Connecting to MetaMask..."
                      : "Connect MetaMask & Invest"}
                </Button>
                <Button type="button" variant="outline" className="w-full" onClick={onClose}>
                  Cancel
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {transactionError && (
        <TransactionError
          isOpen={transactionError.isVisible}
          onClose={() => setTransactionError(null)}
          error={transactionError}
          onRetry={handleRetryInvestment}
        />
      )}
    </>
  );
}
