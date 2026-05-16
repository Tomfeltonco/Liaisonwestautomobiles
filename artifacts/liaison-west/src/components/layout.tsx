import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, ShoppingCart, User, Menu, X, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useGetCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { ChatWidget } from "@/components/chat-widget";

export function Navbar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: cart } = useGetCart({
    query: {
      enabled: !!user,
      queryKey: getGetCartQueryKey(),
    }
  });

  const cartCount = cart?.items?.length || 0;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-white text-black p-1 rounded-sm">
                <Car className="h-5 w-5" />
              </div>
              <span className="font-serif text-lg font-bold tracking-widest text-white uppercase">
                LIAISON WEST
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
              <Link href="/inventory" className={`hover:text-white transition-colors ${location === "/inventory" ? "text-white" : ""}`}>INVENTORY</Link>
              <Link href="/finance" className={`hover:text-white transition-colors ${location === "/finance" ? "text-white" : ""}`}>FINANCING</Link>
              <Link href="/inspection" className={`hover:text-white transition-colors ${location === "/inspection" ? "text-white" : ""}`}>INSPECTION</Link>
              <Link href="/auction" className={`hover:text-white transition-colors ${location === "/auction" ? "text-white" : ""}`}>AUCTION</Link>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link href="/admin">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white">Admin</Button>
                  </Link>
                )}
                {user.role === 'agent' && (
                  <Link href="/agent/dashboard">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white">Agent Portal</Button>
                  </Link>
                )}
                <Link href="/cart">
                  <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-white">
                    <ShoppingCart className="h-5 w-5" />
                    {cartCount > 0 && (
                      <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {cartCount}
                      </span>
                    )}
                  </Button>
                </Link>
                <Link href="/account">
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white">
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-white">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-muted-foreground hover:text-white">Sign In</Button>
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-background/95 backdrop-blur-md px-4 py-4 space-y-4">
          <Link href="/inventory" className="block text-sm font-medium text-white">INVENTORY</Link>
          <Link href="/finance" className="block text-sm font-medium text-white">FINANCING</Link>
          <Link href="/inspection" className="block text-sm font-medium text-white">INSPECTION</Link>
          <Link href="/auction" className="block text-sm font-medium text-white">AUCTION</Link>
          <div className="h-px bg-white/10 my-2"></div>
          {user ? (
            <>
              {user.role === 'admin' && <Link href="/admin" className="block text-sm font-medium text-white">Admin Dashboard</Link>}
              {user.role === 'agent' && <Link href="/agent/dashboard" className="block text-sm font-medium text-white">Agent Portal</Link>}
              <Link href="/account" className="block text-sm font-medium text-white">My Account</Link>
              <Link href="/cart" className="block text-sm font-medium text-white">Cart ({cartCount})</Link>
              <button onClick={logout} className="block w-full text-left text-sm font-medium text-destructive">Sign Out</button>
            </>
          ) : (
            <Link href="/login" className="block text-sm font-medium text-white">Sign In</Link>
          )}
        </div>
      )}
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="bg-black border-t border-white/5 py-12 mt-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-white text-black p-1 rounded-sm">
                <Car className="h-4 w-4" />
              </div>
              <span className="font-serif font-bold tracking-widest text-white uppercase text-sm">
                LIAISON WEST
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Elevating the automotive acquisition experience. Premium vehicles, personalized concierge service, and intelligent financing.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-4">Vehicles</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/inventory" className="hover:text-white transition-colors">All Inventory</Link></li>
              <li><Link href="/inventory?condition=new" className="hover:text-white transition-colors">New Arrivals</Link></li>
              <li><Link href="/inventory?condition=certified" className="hover:text-white transition-colors">Certified Pre-Owned</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-white mb-4">Services</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/finance" className="hover:text-white transition-colors">Financing</Link></li>
              <li><Link href="/finance/apply" className="hover:text-white transition-colors">Apply for Loan</Link></li>
              <li><Link href="/agent/login" className="hover:text-white transition-colors">Agent Portal</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-white mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>concierge@liaisonwest.com</li>
              <li>1-800-LIAISON</li>
              <li>Beverly Hills, CA</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Liaison West Automobiles. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <span className="hover:text-white cursor-pointer">Privacy</span>
            <span className="hover:text-white cursor-pointer">Terms</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-white selection:text-black">
      <Navbar />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
}
