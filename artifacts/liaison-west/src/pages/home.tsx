import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CarCard } from "@/components/car-card";
import { useGetFeaturedCars, useGetAdminStats } from "@workspace/api-client-react";
import { Search, Sparkles, MapPin, Calculator, ArrowRight, ShieldCheck, Clock, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: featuredCars, isLoading: isLoadingFeatured } = useGetFeaturedCars();
  const { data: stats } = useGetAdminStats();

  const handleAiSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // Simulate AI parsing to route to inventory with right filters
    // For now, just pass as a search query
    setLocation(`/inventory?search=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Abstract dark aesthetic background */}
        <div className="absolute inset-0 bg-background z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sidebar-primary/20 via-background to-background"></div>
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-background to-transparent z-10"></div>
          
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        </div>

        <div className="container relative z-20 px-4 md:px-6 pt-20 pb-12 flex flex-col items-center text-center">
          <Badge className="mb-6 bg-white/5 hover:bg-white/10 text-white border-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-medium tracking-wider uppercase flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-sidebar-primary" />
            The Future of Automotive Acquisition
          </Badge>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold tracking-tight text-white max-w-5xl mb-6 leading-[1.1]">
            Curated Excellence.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-400 to-gray-600">Intelligent Acquisition.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-12 font-light leading-relaxed">
            Experience the concierge approach to purchasing premium vehicles. 
            AI-assisted matching, seamless financing, and uncompromising quality.
          </p>

          {/* AI Search Bar */}
          <div className="w-full max-w-3xl relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-sidebar-primary/50 via-white/20 to-sidebar-primary/50 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <form onSubmit={handleAiSearch} className="relative bg-black/50 border border-white/10 rounded-2xl p-2 flex flex-col md:flex-row gap-2 backdrop-blur-xl">
              <div className="relative flex-1 flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-muted-foreground" />
                <Input 
                  placeholder="Describe your perfect car (e.g., 'Black electric SUV under $80k')" 
                  className="w-full pl-12 pr-4 h-14 bg-transparent border-none text-lg text-white placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Sparkles className="absolute right-4 w-5 h-5 text-sidebar-primary/60" />
              </div>
              <Button type="submit" size="lg" className="h-14 px-8 rounded-xl font-medium text-base">
                Find Match
              </Button>
            </form>
          </div>

          <div className="mt-16 flex items-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Certified Pre-Owned</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span>Nationwide Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>7-Day Return</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Inventory */}
      <section className="py-24 bg-background">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-4">Featured Collection</h2>
              <p className="text-muted-foreground text-lg max-w-xl">
                Hand-selected vehicles representing the pinnacle of automotive engineering and design.
              </p>
            </div>
            <Link href="/inventory" className="mt-6 md:mt-0 flex items-center text-primary hover:text-white transition-colors font-medium">
              View All Inventory <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoadingFeatured ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-4">
                  <Skeleton className="h-64 w-full rounded-xl bg-white/5" />
                  <Skeleton className="h-8 w-3/4 bg-white/5" />
                  <Skeleton className="h-4 w-1/2 bg-white/5" />
                </div>
              ))
            ) : featuredCars && featuredCars.length > 0 ? (
              featuredCars.slice(0, 3).map((car) => (
                <CarCard key={car.id} car={car} />
              ))
            ) : (
              <div className="col-span-full text-center py-24 border border-white/5 rounded-2xl bg-white/5">
                <p className="text-muted-foreground">No featured vehicles available at the moment.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Finance Teaser */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-sidebar-primary/5"></div>
        <div className="container relative z-10 px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center justify-center p-3 bg-white/5 rounded-xl mb-6">
                <Calculator className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-6">
                Intelligent Financing.<br/>Tailored to You.
              </h2>
              <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                Experience a frictionless financing process. Our intelligent platform provides immediate approvals, competitive rates, and complete transparency without affecting your credit score.
              </p>
              <div className="space-y-4 mb-8">
                {[
                  "Approvals in under 60 seconds",
                  "Rates starting from 3.99% APR",
                  "Flexible terms from 24 to 84 months",
                  "No hidden fees or prepayment penalties"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                    <span className="text-white">{item}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-4">
                <Link href="/finance">
                  <Button size="lg" className="rounded-full">Explore Options</Button>
                </Link>
                <Link href="/finance/apply">
                  <Button size="lg" variant="outline" className="rounded-full bg-transparent border-white/20 hover:bg-white/5">Apply Now</Button>
                </Link>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-sidebar-primary/20 to-transparent blur-3xl rounded-full"></div>
              <div className="bg-card border border-white/10 rounded-2xl p-8 relative z-10 shadow-2xl backdrop-blur-xl">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-bold text-white mb-2">Estimate Your Payment</h3>
                  <p className="text-sm text-muted-foreground">Adjust terms to find your perfect fit</p>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2 text-white">
                      <span>Vehicle Price</span>
                      <span className="font-medium">$85,000</span>
                    </div>
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[70%]"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2 text-white">
                      <span>Down Payment</span>
                      <span className="font-medium">$15,000</span>
                    </div>
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[30%]"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2 text-white">
                      <span>Term</span>
                      <span className="font-medium">60 Months</span>
                    </div>
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[50%]"></div>
                    </div>
                  </div>
                  
                  <div className="pt-6 border-t border-white/10 mt-6">
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Estimated Monthly</div>
                        <div className="text-3xl font-bold text-white">$1,284<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                      </div>
                      <Link href="/finance">
                        <Button variant="ghost" className="text-primary hover:text-white hover:bg-transparent">
                          Calculate <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats/Trust */}
      <section className="py-24 border-t border-white/5">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-serif font-bold text-white mb-2">{stats?.carsAvailable || "150+"}</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider font-medium">Premium Vehicles</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-serif font-bold text-white mb-2">{stats?.totalUsers || "5,000+"}</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider font-medium">Satisfied Clients</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-serif font-bold text-white mb-2">3.9%</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider font-medium">Starting APR</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-serif font-bold text-white mb-2">
                <Award className="w-10 h-10 mx-auto text-primary" />
              </div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider font-medium mt-2">Concierge Service</div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return <div className={`inline-flex items-center justify-center ${className}`}>{children}</div>;
}
