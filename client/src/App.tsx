import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import StartupDetailPage from "@/pages/startup-detail-page";
import TransactionsPage from "@/pages/transactions-page";
import WalletProfilePage from "@/pages/wallet-profile-page";
import { AuthProvider } from "@/hooks/use-auth";
import { MetaMaskProvider } from "@/hooks/use-metamask";
import { TransactionsProvider } from "@/hooks/use-transactions";
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/startup/:id" component={StartupDetailPage} />
      <ProtectedRoute path="/transactions" component={TransactionsPage} />
      <ProtectedRoute path="/wallet" component={WalletProfilePage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MetaMaskProvider>
          <TransactionsProvider>
            <Router />
            <Toaster />
          </TransactionsProvider>
        </MetaMaskProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
