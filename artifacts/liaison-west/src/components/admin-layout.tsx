import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import {
  LayoutDashboard, Car, Users, Briefcase, ShoppingCart,
  FileText, Settings, LogOut, MessageSquare, Contact
} from "lucide-react";

export function AdminLayout({ children, title }: { children: React.ReactNode; title: string }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  if (!user || (user.role !== "admin" && user.role !== "agent")) {
    return (
      <Layout>
        <div className="container py-24 text-center">
          <h2 className="text-2xl font-serif text-white mb-4">Unauthorized Access</h2>
          <p className="text-muted-foreground">You do not have permission to view this page.</p>
        </div>
      </Layout>
    );
  }

  const adminNavItems = [
    { href: "/admin", icon: <LayoutDashboard className="w-5 h-5" />, label: "Dashboard" },
    { href: "/admin/cars", icon: <Car className="w-5 h-5" />, label: "Inventory" },
    { href: "/admin/users", icon: <Users className="w-5 h-5" />, label: "Users" },
    { href: "/admin/agents", icon: <Briefcase className="w-5 h-5" />, label: "Agents" },
    { href: "/admin/orders", icon: <ShoppingCart className="w-5 h-5" />, label: "Orders" },
    { href: "/admin/loans", icon: <FileText className="w-5 h-5" />, label: "Loans" },
    { href: "/admin/chat", icon: <MessageSquare className="w-5 h-5" />, label: "Chat Support" },
    { href: "/admin/settings", icon: <Contact className="w-5 h-5" />, label: "Contacts" },
    { href: "/admin/payment-settings", icon: <Settings className="w-5 h-5" />, label: "Payment" },
  ];

  const agentNavItems = [
    { href: "/agent/dashboard", icon: <Car className="w-5 h-5" />, label: "My Inventory" },
    { href: "/agent/chat", icon: <MessageSquare className="w-5 h-5" />, label: "Chat Support" },
  ];

  const navItems = user.role === "admin" ? adminNavItems : agentNavItems;

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-card border-r border-white/5 flex-col hidden md:flex h-screen sticky top-0">
        <div className="p-6 border-b border-white/5">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-white text-black p-1 rounded-sm">
              <Car className="h-4 w-4" />
            </div>
            <span className="font-serif font-bold tracking-widest text-white uppercase text-sm">
              LIAISON WEST
            </span>
          </Link>
          <div className="mt-2 text-xs text-muted-foreground uppercase tracking-wider font-medium">
            {user.role === "admin" ? "Admin Portal" : "Agent Portal"}
          </div>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer ${
                location === item.href
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-white/5 hover:text-white"
              }`}>
                {item.icon}
                {item.label}
              </div>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="md:hidden bg-card border-b border-white/5 p-4 flex justify-between items-center sticky top-0 z-10">
          <div className="font-serif font-bold text-white">LW {user.role === "admin" ? "Admin" : "Agent"}</div>
        </header>
        <div className="p-6 md:p-10 flex-1">
          <h1 className="text-3xl font-serif font-bold text-white mb-8">{title}</h1>
          {children}
        </div>
      </main>
    </div>
  );
}
