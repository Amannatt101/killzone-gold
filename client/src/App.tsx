import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import SignalPage from "@/pages/signal";
import ChartPage from "@/pages/chart";
import IntelligenceDashboardPage from "@/pages/intelligence-dashboard";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";

function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Dark mode by default for this finance dashboard
    document.documentElement.classList.add("dark");
  }, []);

  return <>{children}</>;
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={IntelligenceDashboardPage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/signal" component={SignalPage} />
      <Route path="/chart" component={ChartPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <Toaster />
          <Router hook={useHashLocation}>
            <AppRouter />
          </Router>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
