import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import Login from "@/pages/login";
import AgentLogin from "@/pages/agent-login";
import Inventory from "@/pages/inventory";
import Car from "@/pages/car";
import Finance from "@/pages/finance";
import FinanceApply from "@/pages/finance-apply";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import Account from "@/pages/account";
import AgentDashboard from "@/pages/agent-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminCars from "@/pages/admin-cars";
import AdminUsers from "@/pages/admin-users";
import AdminAgents from "@/pages/admin-agents";
import AdminOrders from "@/pages/admin-orders";
import AdminLoans from "@/pages/admin-loans";
import AdminPaymentSettings from "@/pages/admin-payment-settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/agent/login" component={AgentLogin} />
      <Route path="/inventory" component={Inventory} />
      <Route path="/car/:id" component={Car} />
      <Route path="/finance" component={Finance} />
      <Route path="/finance/apply" component={FinanceApply} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/account" component={Account} />
      <Route path="/agent/dashboard" component={AgentDashboard} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/cars" component={AdminCars} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/agents" component={AdminAgents} />
      <Route path="/admin/orders" component={AdminOrders} />
      <Route path="/admin/loans" component={AdminLoans} />
      <Route path="/admin/payment-settings" component={AdminPaymentSettings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
          <Sonner richColors position="top-right" />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
