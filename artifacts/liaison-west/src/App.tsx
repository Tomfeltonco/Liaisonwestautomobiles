import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";

// Pages
import Home from "@/pages/home";
import Login from "@/pages/login";
import AgentLogin from "@/pages/agent-login";
import Inventory from "@/pages/inventory";

// Placeholders for routes to build in next rounds
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <h1 className="text-3xl font-serif font-bold text-white mb-2">{title}</h1>
        <p className="text-muted-foreground">This section is currently being developed.</p>
      </div>
    </div>
  );
}

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/agent/login" component={AgentLogin} />
      <Route path="/inventory" component={Inventory} />
      
      {/* Routes to be implemented */}
      <Route path="/car/:id" component={() => <PlaceholderPage title="Car Details" />} />
      <Route path="/finance" component={() => <PlaceholderPage title="Financing Hub" />} />
      <Route path="/finance/apply" component={() => <PlaceholderPage title="Loan Application" />} />
      <Route path="/cart" component={() => <PlaceholderPage title="Shopping Cart" />} />
      <Route path="/checkout" component={() => <PlaceholderPage title="Checkout" />} />
      <Route path="/account" component={() => <PlaceholderPage title="My Account" />} />
      
      {/* Agent/Admin routes */}
      <Route path="/agent/dashboard" component={() => <PlaceholderPage title="Agent Dashboard" />} />
      <Route path="/admin" component={() => <PlaceholderPage title="Admin Dashboard" />} />
      <Route path="/admin/cars" component={() => <PlaceholderPage title="Admin: Manage Cars" />} />
      <Route path="/admin/users" component={() => <PlaceholderPage title="Admin: Manage Users" />} />
      <Route path="/admin/agents" component={() => <PlaceholderPage title="Admin: Manage Agents" />} />
      <Route path="/admin/orders" component={() => <PlaceholderPage title="Admin: Manage Orders" />} />
      <Route path="/admin/loans" component={() => <PlaceholderPage title="Admin: Manage Loans" />} />
      <Route path="/admin/payment-settings" component={() => <PlaceholderPage title="Admin: Payment Settings" />} />
      
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
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
