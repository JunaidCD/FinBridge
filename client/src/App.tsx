import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Web3Provider } from "./context/web3-context.jsx";
import Navigation from "./components/navigation.jsx";
import Home from "./pages/home.jsx";
import BorrowerDashboard from "./pages/borrower-dashboard.jsx";
import LenderDashboard from "./pages/lender-dashboard.jsx";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/borrower" component={BorrowerDashboard} />
      <Route path="/lender" component={LenderDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Web3Provider>
          <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5">
              <div className="absolute inset-0">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                <div className="absolute top-0 -right-4 w-72 h-72 bg-secondary/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-accent/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
              </div>
            </div>
            <Navigation />
            <main className="flex-1 relative z-10">
              <Router />
            </main>
            <Toaster />
          </div>
        </Web3Provider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
