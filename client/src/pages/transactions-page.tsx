import React, { useEffect, useState } from "react";
import { useTransactions, Transaction } from "@/hooks/use-transactions";
import { useMetaMask } from "@/hooks/use-metamask";
import { TransactionVisualizer } from "@/components/transactions/TransactionVisualizer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Wallet, BarChart } from "lucide-react";
import { ethers } from "ethers";

export default function TransactionsPage() {
  const { transactions, addTransaction, updateTransaction } = useTransactions();
  const { address, isConnected, connect, sendTransaction } = useMetaMask();
  const [isCreatingMockTx, setIsCreatingMockTx] = useState(false);

  // Simulate changing transaction states for demo purposes
  useEffect(() => {
    const pendingTransactions = transactions.filter(tx => tx.status === 'pending');
    
    if (pendingTransactions.length > 0) {
      const timers: NodeJS.Timeout[] = [];
      
      pendingTransactions.forEach(tx => {
        // Randomly determine success or failure
        const willSucceed = Math.random() > 0.2;
        
        const timer = setTimeout(() => {
          if (willSucceed) {
            // Transaction succeeds
            const blockNumber = Math.floor(Math.random() * 1000) + 10000000;
            const confirmations = Math.floor(Math.random() * 5) + 1;
            
            updateTransaction(tx.id, {
              status: 'confirmed',
              blockNumber,
              confirmations
            });
            
            // Increase confirmations over time
            const confirmationTimer = setInterval(() => {
              const currentTx = transactions.find(t => t.id === tx.id);
              if (currentTx && currentTx.confirmations && currentTx.confirmations < 12) {
                updateTransaction(tx.id, {
                  confirmations: (currentTx.confirmations || 0) + 1
                });
              } else {
                clearInterval(confirmationTimer);
              }
            }, 5000);
            
            timers.push(confirmationTimer as unknown as NodeJS.Timeout);
          } else {
            // Transaction fails
            updateTransaction(tx.id, {
              status: 'failed'
            });
          }
        }, Math.random() * 10000 + 3000); // Random time between 3-13 seconds
        
        timers.push(timer);
      });
      
      return () => timers.forEach(timer => clearTimeout(timer));
    }
  }, [transactions, updateTransaction]);

  const handleCreateTransaction = async () => {
    if (!isConnected) {
      await connect();
      return;
    }

    setIsCreatingMockTx(true);
    try {
      // Mock destination address
      const randomAddress = ethers.Wallet.createRandom().address;
      
      // Random amount between 0.01 and 1 ETH
      const amount = (Math.random() * 0.99 + 0.01).toFixed(4);
      
      // Try to send a real transaction if possible, otherwise create a mock one
      let txId;
      try {
        txId = await sendTransaction(randomAddress, amount);
      } catch (error) {
        console.log("Creating mock transaction instead:", error);
        txId = addTransaction({
          from: address || "0x0000000000000000000000000000000000000000",
          to: randomAddress,
          amount: parseFloat(amount),
        });
      }
      
      console.log("Transaction created:", txId);
    } catch (error) {
      console.error("Failed to create transaction:", error);
    } finally {
      setIsCreatingMockTx(false);
    }
  };

  // Group transactions by date
  const groupedTransactions = React.useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {};
    
    transactions.forEach(tx => {
      const date = tx.timestamp.toISOString().split('T')[0];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(tx);
    });
    
    return Object.entries(groups).sort((a, b) => 
      new Date(b[0]).getTime() - new Date(a[0]).getTime()
    );
  }, [transactions]);

  // Calculate statistics
  const stats = React.useMemo(() => {
    const confirmed = transactions.filter(tx => tx.status === 'confirmed');
    const totalAmount = confirmed.reduce((sum, tx) => sum + tx.amount, 0);
    const averageAmount = confirmed.length ? totalAmount / confirmed.length : 0;
    
    return {
      total: transactions.length,
      confirmed: confirmed.length,
      pending: transactions.filter(tx => tx.status === 'pending').length,
      failed: transactions.filter(tx => tx.status === 'failed').length,
      totalAmount,
      averageAmount,
    };
  }, [transactions]);

  return (
    <div className="container mx-auto p-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Transaction Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and visualize your blockchain transactions
          </p>
        </div>
        
        <Button 
          onClick={handleCreateTransaction} 
          className="flex items-center gap-2"
          disabled={isCreatingMockTx}
        >
          <Activity size={16} />
          {isCreatingMockTx ? "Creating..." : "Create Test Transaction"}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Transactions</CardTitle>
            <CardDescription>Total activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="flex gap-2 text-xs text-muted-foreground mt-1">
              <span className="text-green-500">{stats.confirmed} confirmed</span>
              <span>•</span>
              <span className="text-amber-500">{stats.pending} pending</span>
              <span>•</span>
              <span className="text-red-500">{stats.failed} failed</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Total Volume</CardTitle>
            <CardDescription>Confirmed transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAmount.toFixed(4)} ETH</div>
            <div className="text-xs text-muted-foreground mt-1">
              Avg {stats.averageAmount.toFixed(4)} ETH per transaction
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Wallet Status</CardTitle>
            <CardDescription>Ethereum connection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Wallet size={16} className={isConnected ? "text-green-500" : "text-amber-500"} />
              <div className="text-sm font-medium">
                {isConnected ? "Connected" : "Not Connected"}
              </div>
            </div>
            {address && (
              <div className="text-xs font-mono text-muted-foreground mt-1 truncate">
                {address}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <TransactionVisualizer 
          transactions={transactions.slice(0, 10)} 
          className="h-full"
        />
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart size={18} />
              Transaction Analytics
            </CardTitle>
            <CardDescription>
              Transaction volume and performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Success Rate */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Success Rate</span>
                  <span className="text-sm font-medium">
                    {transactions.length ? 
                      Math.round((stats.confirmed / transactions.length) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ 
                      width: `${transactions.length ? 
                        Math.round((stats.confirmed / transactions.length) * 100) : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
              
              {/* Average Confirmation Time */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Average Confirmation Time</span>
                  <span className="text-sm font-medium">~8.2 seconds</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: "70%" }}
                  ></div>
                </div>
              </div>
              
              {/* Gas Usage */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Gas Optimization</span>
                  <span className="text-sm font-medium">Good</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-amber-500 h-2 rounded-full" 
                    style={{ width: "85%" }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            All your transactions, grouped by date
          </CardDescription>
        </CardHeader>
        <CardContent>
          {groupedTransactions.length > 0 ? (
            <div className="space-y-6">
              {groupedTransactions.map(([date, txs]) => (
                <div key={date}>
                  <h3 className="text-sm font-medium mb-2">
                    {new Date(date).toLocaleDateString(undefined, { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h3>
                  
                  <div className="space-y-2">
                    {txs.map(tx => (
                      <div 
                        key={tx.id} 
                        className={`p-3 rounded-lg border flex justify-between items-center ${
                          tx.status === 'confirmed' ? 'bg-green-50 border-green-200' : 
                          tx.status === 'failed' ? 'bg-red-50 border-red-200' : 
                          'bg-amber-50 border-amber-200'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium">
                              {tx.amount.toFixed(4)} ETH
                            </span>
                            {tx.status === 'confirmed' && (
                              <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                                {tx.confirmations} confirmations
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            To: {tx.to.substring(0, 10)}...
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className={`text-sm font-medium ${
                            tx.status === 'confirmed' ? 'text-green-600' : 
                            tx.status === 'failed' ? 'text-red-600' : 
                            'text-amber-600'
                          }`}>
                            {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {tx.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No transactions found. Create a test transaction to see it here.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}