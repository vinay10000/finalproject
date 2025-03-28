/**
 * Utility functions for handling MetaMask errors
 */

export type MetaMaskErrorCode = 
  | 4001        // User rejected request
  | -32602      // Invalid params
  | -32603      // Internal error
  | -32000      // Invalid input
  | -32001      // Resource not found
  | -32002      // Resource unavailable
  | -32003      // Transaction rejected
  | -32004      // Method not supported
  | -32005;     // Limit exceeded

export interface MetaMaskError extends Error {
  code?: MetaMaskErrorCode | number;
  userAction?: 'approve' | 'reduce_amount' | 'add_funds' | 'manual_gas' | 'reset_account' | 'refresh' | 'reinstall';
  data?: any;
}

/**
 * Enhanced error class for MetaMask-related errors
 */
export class EnhancedMetaMaskError extends Error implements MetaMaskError {
  code?: MetaMaskErrorCode | number;
  userAction?: 'approve' | 'reduce_amount' | 'add_funds' | 'manual_gas' | 'reset_account' | 'refresh' | 'reinstall';
  data?: any;

  constructor(message: string, code?: MetaMaskErrorCode | number, userAction?: MetaMaskError['userAction'], data?: any) {
    super(message);
    this.name = 'MetaMaskError';
    this.code = code;
    this.userAction = userAction;
    this.data = data;
  }
}

/**
 * Get a user-friendly error message for a MetaMask error
 */
export function getMetaMaskErrorMessage(error: any): string {
  // If it's already a string, return it
  if (typeof error === 'string') return error;
  
  // Get the message from the error object
  const message = error?.message || 'Unknown MetaMask error';
  
  // Handle known error codes
  if (error?.code === 4001) {
    return 'Transaction rejected. Please approve the transaction in MetaMask.';
  } else if (error?.code === -32602) {
    return 'Invalid transaction parameters. Try using a smaller amount (0.01 ETH or less).';
  } else if (error?.code === -32603) {
    return 'Internal MetaMask error. Try refreshing the page.';
  }
  
  // Handle known error messages
  if (message.includes('insufficient funds')) {
    return 'Insufficient funds in your wallet. Please add more ETH to continue.';
  } else if (message.includes('buffer') || message.includes('out-of-bounds')) {
    return 'Transaction format error. There might be an issue with the transaction data.';
  } else if (message.includes('gas')) {
    return 'Gas estimation failed. Try a smaller amount or set gas manually in MetaMask.';
  } else if (message.includes('nonce')) {
    return 'Transaction sequence error. Try resetting your account in MetaMask settings.';
  } else if (message.includes('user denied') || message.includes('rejected')) {
    return 'Transaction rejected. Please approve the transaction in MetaMask.';
  }
  
  // Return the original message if we don't have a specific case
  return message;
}

/**
 * Get the recommended user action for a MetaMask error
 */
export function getMetaMaskErrorAction(error: any): MetaMaskError['userAction'] {
  const code = error?.code;
  const message = error?.message?.toLowerCase() || '';
  
  if (code === 4001 || message.includes('denied') || message.includes('rejected')) {
    return 'approve';
  } else if (code === -32602 || message.includes('param') || message.includes('buffer') || message.includes('bounds')) {
    return 'reduce_amount';
  } else if (message.includes('insufficient') || message.includes('funds')) {
    return 'add_funds';
  } else if (message.includes('gas')) {
    return 'manual_gas';
  } else if (message.includes('nonce')) {
    return 'reset_account';
  } else if (code === -32603 || message.includes('internal')) {
    return 'refresh';
  }
  
  return 'reduce_amount'; // Default fallback suggestion
}

/**
 * Create an enhanced error object from a raw MetaMask error
 */
export function createEnhancedMetaMaskError(error: any): MetaMaskError {
  // If it's already an EnhancedMetaMaskError, return it
  if (error instanceof EnhancedMetaMaskError) return error;
  
  const message = getMetaMaskErrorMessage(error);
  const userAction = getMetaMaskErrorAction(error);
  const code = error?.code;
  
  return new EnhancedMetaMaskError(message, code, userAction, error);
}

/**
 * Get a solution description based on the user action
 */
export function getMetaMaskErrorSolution(userAction: MetaMaskError['userAction']): string {
  switch (userAction) {
    case 'approve':
      return 'Please try again and approve the transaction in your MetaMask wallet.';
    case 'reduce_amount':
      return 'Try using a smaller amount for your transaction or check that you have enough ETH for gas fees.';
    case 'add_funds':
      return 'Add more ETH to your wallet and try again.';
    case 'manual_gas':
      return 'Try setting the gas limit manually in MetaMask advanced settings.';
    case 'reset_account':
      return 'Go to MetaMask Settings > Advanced > Reset Account to clear your transaction history.';
    case 'refresh':
      return 'Refresh the page and try again.';
    case 'reinstall':
      return 'Try reinstalling the MetaMask extension.';
    default:
      return 'Please try again or contact support if the issue persists.';
  }
}