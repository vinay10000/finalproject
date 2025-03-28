import { Request, Response, NextFunction } from 'express';

export interface IApiError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

// Define standard error messages for common errors
const ERROR_MESSAGES = {
  DEFAULT: 'Something went wrong. Please try again later.',
  NOT_FOUND: 'The requested resource was not found.',
  UNAUTHORIZED: 'You are not authorized to access this resource.',
  VALIDATION: 'There was an error with your request data.',
  DATABASE: 'A database error occurred. Please try again later.',
  WALLET: 'There was an error connecting to your wallet.',
  TRANSACTION: 'The transaction could not be completed.',
  NETWORK: 'Network error occurred. Please check your connection and try again.'
};

/**
 * Custom error logger
 */
export const logError = (err: IApiError) => {
  // In production, we might want to send this to a logging service
  console.error(`[${new Date().toISOString()}] ERROR:`, {
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? 'HIDDEN IN PROD' : err.stack,
    code: err.code,
    statusCode: err.statusCode,
    isOperational: err.isOperational
  });
};

/**
 * Error handler middleware
 */
export const errorHandler = (
  err: IApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logError(err);

  // Determine if this is a known error type
  const statusCode = err.statusCode || 500;
  let errorMessage = ERROR_MESSAGES.DEFAULT;

  // Set appropriate error message based on status code or error type
  if (statusCode === 404) {
    errorMessage = ERROR_MESSAGES.NOT_FOUND;
  } else if (statusCode === 401) {
    errorMessage = ERROR_MESSAGES.UNAUTHORIZED;
  } else if (statusCode === 400) {
    errorMessage = ERROR_MESSAGES.VALIDATION;
  }

  // Special case for MongoDB and database errors
  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    errorMessage = ERROR_MESSAGES.DATABASE;
  }

  // Special case for wallet and transaction errors
  if (err.message?.toLowerCase().includes('wallet')) {
    errorMessage = ERROR_MESSAGES.WALLET;
  } else if (err.message?.toLowerCase().includes('transaction')) {
    errorMessage = ERROR_MESSAGES.TRANSACTION;
  }

  // Include technical details only in development mode
  const response = {
    success: false,
    message: errorMessage,
    error: process.env.NODE_ENV === 'development' ? {
      message: err.message,
      code: err.code,
      stack: err.stack
    } : undefined
  };

  res.status(statusCode).json(response);
};

/**
 * Create a custom API error with status code
 */
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;

  constructor(message: string, statusCode = 500, isOperational = true, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not found error handler middleware
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new ApiError(`Not Found - ${req.originalUrl}`, 404);
  next(error);
};