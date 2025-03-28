import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";

export interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  timestamp: Date;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  confirmations?: number;
}

interface TransactionsContextType {
  transactions: Transaction[];
  addTransaction: (newTransaction: Omit<Transaction, "id" | "timestamp" | "status">) => string;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  clearTransactions: () => void;
  getTransactionById: (id: string) => Transaction | undefined;
}

const TransactionsContext = createContext<TransactionsContextType | null>(null);

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { toast } = useToast();

  // Load transactions from localStorage on initial render
  useEffect(() => {
    try {
      const savedTransactions = localStorage.getItem("transactions");
      if (savedTransactions) {
        const parsedTransactions = JSON.parse(savedTransactions);
        // Convert string timestamps back to Date objects
        const processedTransactions = parsedTransactions.map((tx: any) => ({
          ...tx,
          timestamp: new Date(tx.timestamp),
        }));
        setTransactions(processedTransactions);
      }
    } catch (error) {
      console.error("Failed to load transactions from localStorage:", error);
    }
  }, []);

  // Save transactions to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("transactions", JSON.stringify(transactions));
    } catch (error) {
      console.error("Failed to save transactions to localStorage:", error);
    }
  }, [transactions]);

  const addTransaction = (newTransaction: Omit<Transaction, "id" | "timestamp" | "status">) => {
    const id = `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const transaction: Transaction = {
      ...newTransaction,
      id,
      timestamp: new Date(),
      status: 'pending',
    };

    setTransactions(prev => [transaction, ...prev]);
    
    // Notify user
    toast({
      title: "New Transaction",
      description: `Transaction of ${transaction.amount} ETH has been created.`,
    });

    return id;
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions(prev =>
      prev.map(tx =>
        tx.id === id
          ? { ...tx, ...updates }
          : tx
      )
    );

    // Notify user of significant status changes
    if (updates.status === 'confirmed') {
      toast({
        title: "Transaction Confirmed",
        description: `Your transaction has been confirmed on the blockchain.`,
      });
    } else if (updates.status === 'failed') {
      toast({
        title: "Transaction Failed",
        description: `Your transaction could not be completed.`,
        variant: "destructive",
      });
    }
  };

  const clearTransactions = () => {
    setTransactions([]);
    localStorage.removeItem("transactions");
  };

  const getTransactionById = (id: string) => {
    return transactions.find(tx => tx.id === id);
  };

  return (
    <TransactionsContext.Provider
      value={{
        transactions,
        addTransaction,
        updateTransaction,
        clearTransactions,
        getTransactionById,
      }}
    >
      {children}
    </TransactionsContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionsContext);
  if (!context) {
    throw new Error("useTransactions must be used within a TransactionsProvider");
  }
  return context;
}