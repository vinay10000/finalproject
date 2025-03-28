import React, { useEffect, useState } from "react";
import { motion, Variants } from "framer-motion";
import { Cpu, Activity, CheckCircle, XCircle, Clock } from "lucide-react";

interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  timestamp: Date;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  confirmations?: number;
}

interface TransactionVisualizerProps {
  transactions: Transaction[];
  className?: string;
}

export function TransactionVisualizer({ transactions, className = "" }: TransactionVisualizerProps) {
  const [showCompleted, setShowCompleted] = useState(true);
  const [animatingTransactions, setAnimatingTransactions] = useState<Transaction[]>([]);

  // Add new transactions to the animation with a delay so they flow in order
  useEffect(() => {
    // Reset animation state when transactions change significantly
    if (transactions.length === 0) {
      setAnimatingTransactions([]);
      return;
    }

    // Find transactions that aren't in the animation state yet
    const newTransactions = transactions.filter(
      tx => !animatingTransactions.some(animTx => animTx.id === tx.id)
    );

    if (newTransactions.length > 0) {
      // Add each new transaction with a delay
      let delay = 0;
      const timers: NodeJS.Timeout[] = [];
      
      newTransactions.forEach((tx) => {
        const timer = setTimeout(() => {
          setAnimatingTransactions(prev => [...prev, tx]);
        }, delay);
        
        timers.push(timer);
        delay += 500; // Stagger animation starts
      });
      
      return () => timers.forEach(timer => clearTimeout(timer));
    }
  }, [transactions]);

  // Update existing transactions when their status changes
  useEffect(() => {
    if (animatingTransactions.length > 0) {
      const updatedTransactions = animatingTransactions.map(animTx => {
        const matchingTx = transactions.find(tx => tx.id === animTx.id);
        return matchingTx || animTx;
      });
      
      setAnimatingTransactions(updatedTransactions);
    }
  }, [transactions]);

  // Filter transactions based on visibility toggle
  const visibleTransactions = showCompleted 
    ? animatingTransactions 
    : animatingTransactions.filter(tx => tx.status === 'pending');

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Transaction Visualizer</h2>
        <div className="flex space-x-2">
          <button
            className={`px-3 py-1 text-sm rounded-md ${
              showCompleted ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
            }`}
            onClick={() => setShowCompleted(true)}
          >
            Show All
          </button>
          <button
            className={`px-3 py-1 text-sm rounded-md ${
              !showCompleted ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
            }`}
            onClick={() => setShowCompleted(false)}
          >
            Pending Only
          </button>
        </div>
      </div>

      <div className="relative h-64 overflow-hidden border border-gray-200 rounded-lg">
        {/* Network visualization */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <div className="w-48 h-48 rounded-full border-4 border-gray-300"></div>
          <div className="absolute w-64 h-64 rounded-full border-2 border-gray-300"></div>
          <div className="absolute w-80 h-80 rounded-full border border-gray-300"></div>
        </div>

        {/* Blockchain Nodes */}
        <div className="absolute inset-0">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute flex items-center justify-center"
              initial={{ 
                x: `${Math.random() * 80 + 10}%`, 
                y: `${Math.random() * 80 + 10}%` 
              }}
              animate={{ 
                x: [null, `${Math.random() * 80 + 10}%`], 
                y: [null, `${Math.random() * 80 + 10}%`] 
              }}
              transition={{ 
                duration: Math.random() * 10 + 20, 
                repeat: Infinity,
                repeatType: "reverse" 
              }}
            >
              <div className="bg-gray-100 p-2 rounded-full">
                <Cpu size={16} className="text-gray-600" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Transaction Animations */}
        {visibleTransactions.map((tx) => (
          <motion.div
            key={tx.id}
            initial={{ 
              x: "10%", 
              y: "50%", 
              scale: 0.8, 
              opacity: 0 
            }}
            animate={{
              // Define animations as a single object
              opacity: 1, 
              scale: 1,
              x: tx.status === 'pending' ? "60%" : "90%", 
              transition: { 
                opacity: { duration: 0.3 },
                scale: { duration: 0.3 },
                x: { 
                  duration: tx.status === 'pending' ? 3 : 1,
                  ease: "easeInOut" 
                }
              }
            }}
            className="absolute flex items-center justify-center"
          >
            <div className={`px-3 py-2 rounded-lg shadow-sm flex items-center ${
              tx.status === 'confirmed' ? 'bg-green-50 border border-green-200' :
              tx.status === 'failed' ? 'bg-red-50 border border-red-200' :
              'bg-amber-50 border border-amber-200'
            }`}>
              {tx.status === 'confirmed' ? (
                <CheckCircle size={16} className="text-green-500 mr-2" />
              ) : tx.status === 'failed' ? (
                <XCircle size={16} className="text-red-500 mr-2" />
              ) : (
                <Clock size={16} className="text-amber-500 mr-2" />
              )}
              <span className="text-xs font-medium">
                {tx.amount.toFixed(2)} ETH
              </span>
              <Activity size={14} className="ml-2 text-gray-400" />
              {tx.confirmations && tx.status === 'confirmed' && (
                <span className="ml-1 text-xs text-green-600">{tx.confirmations}✓</span>
              )}
            </div>
          </motion.div>
        ))}

        {/* Network Status Indicators */}
        <div className="absolute bottom-2 right-2 flex space-x-2">
          <div className="flex items-center text-xs text-gray-500">
            <div className="w-2 h-2 rounded-full bg-green-400 mr-1"></div>
            <span>Network</span>
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <div className="w-2 h-2 rounded-full bg-amber-400 mr-1"></div>
            <span>Pending</span>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="mt-4 max-h-32 overflow-y-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 text-gray-500 font-medium">Transaction</th>
              <th className="text-right py-2 text-gray-500 font-medium">Amount</th>
              <th className="text-right py-2 text-gray-500 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {visibleTransactions.map((tx) => (
              <tr key={tx.id} className="border-b border-gray-100">
                <td className="py-2 font-mono">
                  {tx.id.substring(0, 8)}...
                </td>
                <td className="py-2 text-right">
                  {tx.amount.toFixed(4)} ETH
                </td>
                <td className="py-2 text-right">
                  {tx.status === 'confirmed' ? (
                    <span className="text-green-600 flex items-center justify-end">
                      <CheckCircle size={12} className="mr-1" /> Confirmed
                    </span>
                  ) : tx.status === 'failed' ? (
                    <span className="text-red-600 flex items-center justify-end">
                      <XCircle size={12} className="mr-1" /> Failed
                    </span>
                  ) : (
                    <span className="text-amber-600 flex items-center justify-end">
                      <Clock size={12} className="mr-1" /> Pending
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {visibleTransactions.length === 0 && (
              <tr>
                <td colSpan={3} className="py-4 text-center text-gray-500">
                  No transactions to display
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}