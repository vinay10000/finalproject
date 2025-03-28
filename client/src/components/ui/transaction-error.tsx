import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getMetaMaskErrorSolution } from "@/lib/metamask-errors";
import { AlertTriangle, Info, RefreshCw } from "lucide-react";

interface TransactionErrorProps {
  isOpen: boolean;
  onClose: () => void;
  error: {
    title?: string;
    message: string;
    code?: string | number;
    details?: string;
    userAction?: 'approve' | 'reduce_amount' | 'add_funds' | 'manual_gas' | 'reset_account' | 'refresh' | 'reinstall';
  };
  onRetry?: () => void;
}

export function TransactionError({
  isOpen,
  onClose,
  error,
  onRetry,
}: TransactionErrorProps) {
  // Get recommended solution based on error type
  const solution = error.userAction ? getMetaMaskErrorSolution(error.userAction) : null;
  
  // Format error code for display
  const formattedErrorCode = error.code ? 
    typeof error.code === 'number' ? 
      (error.code < 0 ? error.code.toString() : `+${error.code}`) : 
      error.code 
    : null;
  
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <AlertDialogTitle>{error.title || "Transaction Failed"}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base text-foreground font-medium mt-2">
            {error.message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {(solution || formattedErrorCode || error.details) && (
          <div className="space-y-4 my-2">
            {solution && (
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="text-sm font-medium flex items-center mb-1">
                  <Info className="h-4 w-4 mr-1" />
                  Recommended solution:
                </h4>
                <p className="text-sm text-muted-foreground">{solution}</p>
              </div>
            )}
            
            {(formattedErrorCode || error.details) && (
              <div className="border border-border rounded-lg p-4">
                <h4 className="text-xs font-medium text-muted-foreground mb-2">Technical Details</h4>
                {formattedErrorCode && (
                  <div className="mb-2">
                    <span className="text-xs text-muted-foreground">Error code: </span>
                    <code className="bg-muted rounded px-1 py-0.5 text-xs">{formattedErrorCode}</code>
                  </div>
                )}
                {error.details && (
                  <div className="overflow-auto max-h-24">
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-all">
                      {error.details}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        <AlertDialogFooter className="gap-2 sm:gap-0">
          {onRetry && (
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                onRetry();
                onClose();
              }}
              className="gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              Retry with suggested fix
            </AlertDialogAction>
          )}
          <AlertDialogCancel>Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}