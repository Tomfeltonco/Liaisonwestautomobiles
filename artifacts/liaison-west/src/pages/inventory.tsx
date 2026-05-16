import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { CarCard } from "@/components/car-card";
import { useListCars } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

export default function Inventory() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialSearch = searchParams.get("search") || "";

  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [condition, setCondition] = useState<string>("all");
  const [make, setMake] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<number[]>([0, 250000]);
  const [page, setPage] = useState(1);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Build query params
  const queryParams: any = {
    page,
    limit: 12,
  };
  
  if (debouncedSearch) queryParams.search = debouncedSearch;
  if (condition !== "all") queryParams.condition = condition;
  if (make !== "all") queryParams.make = make;
  if (priceRange[0] > 0) queryParams.minPrice = priceRange[0];
  if (priceRange[1] < 250000) queryParams.maxPrice = priceRange[1];

  const { data, isLoading, isFetching } = useListCars(queryParams);

  const activeFilterCount = (condition !== "all" ? 1 : 0) + (make !== "all" ? 1 : 0) + (priceRange[0] > 0 || priceRange[1] < 250000 ? 1 : 0);

  const clearFilters = () => {
    setSearch("");
    setCondition("all");
    setMake("all");
    setPriceRange([0, 250000]);
    setPage(1);
  };

  const FilterContent = () => (
    <div className="space-y-8">
      <div className="space-y-4">
        <Label className="text-white/80">Search</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search make, model, year..." 
            className="pl-9 bg-white/5 border-white/10"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-white/80">Condition</Label>
        <Select value={condition} onValueChange={(v) => { setCondition(v); setPage(1); }}>
          <SelectTrigger className="bg-white/5 border-white/10">
            <SelectValue placeholder="All Conditions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Conditions</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="used">Used</SelectItem>
            <SelectItem value="certified">Certified Pre-Owned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <Label className="text-white/80">Make</Label>
        <Select value={make} onValueChange={(v) => { setMake(v); setPage(1); }}>
          <SelectTrigger className="bg-white/5 border-white/10">
            <SelectValue placeholder="All Makes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Makes</SelectItem>
            <SelectItem value="Porsche">Porsche</SelectItem>
            <SelectItem value="Mercedes-Benz">Mercedes-Benz</SelectItem>
            <SelectItem value="BMW">BMW</SelectItem>
            <SelectItem value="Audi">Audi</SelectItem>
            <SelectItem value="Lexus">Lexus</SelectItem>
            <SelectItem value="Tesla">Tesla</SelectItem>
            <SelectItem value="Land Rover">Land Rover</SelectItem>
            <SelectItem value="Aston Martin">Aston Martin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label className="text-white/80">Price Range</Label>
          <span className="text-xs text-muted-foreground">
            ${(priceRange[0]/1000).toFixed(0)}k - ${priceRange[1] >= 250000 ? '250k+' : (priceRange[1]/1000).toFixed(0) + 'k'}
          </span>
        </div>
        <Slider
          defaultValue={[0, 250000]}
          max={250000}
          step={5000}
          value={priceRange}
          onValueChange={(val) => { setPriceRange(val); setPage(1); }}
          className="py-4"
        />
      </div>

      {activeFilterCount > 0 && (
        <Button variant="outline" className="w-full border-white/10 hover:bg-white/5" onClick={clearFilters}>
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <Layout>
      {/* Header */}
      <div className="bg-black py-16 border-b border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-sidebar-primary/10 to-transparent"></div>
        <div className="container px-4 md:px-6 relative z-10">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">Inventory Collection</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Explore our curated selection of premium vehicles. Every car passes a rigorous 150-point inspection.
          </p>
        </div>
      </div>

      <div className="container px-4 md:px-6 py-12 flex flex-col md:flex-row gap-8">
        {/* Desktop Sidebar Filters */}
        <div className="hidden md:block w-64 flex-shrink-0">
          <div className="sticky top-24 bg-card/50 border border-white/5 p-6 rounded-2xl backdrop-blur-md">
            <h3 className="font-serif font-bold text-lg text-white mb-6 flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5" /> Refine Search
            </h3>
            <FilterContent />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Mobile Filter Toggle & Active Filters */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="flex items-center gap-2">
              <span className="text-white font-medium">
                {isLoading ? "..." : data?.total || 0} Vehicles Available
              </span>
              {(isFetching && !isLoading) && (
                <span className="text-xs text-muted-foreground animate-pulse">Updating...</span>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="md:hidden flex-1 border-white/10 bg-white/5">
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    Filters {activeFilterCount > 0 && <Badge className="ml-2 bg-primary">{activeFilterCount}</Badge>}
                  </Button>
                </SheetTrigger>
                <SheetContent className="bg-background border-l-white/10 w-full sm:max-w-md">
                  <SheetHeader className="mb-8">
                    <SheetTitle className="text-white font-serif">Refine Search</SheetTitle>
                  </SheetHeader>
                  <FilterContent />
                </SheetContent>
              </Sheet>

              <Select defaultValue="newest">
                <SelectTrigger className="w-full sm:w-[180px] bg-white/5 border-white/10">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest Arrivals</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  <SelectItem value="mileage-asc">Mileage: Low to High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filter Tags */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {condition !== "all" && (
                <Badge variant="secondary" className="bg-white/10 hover:bg-white/15 px-3 py-1 text-xs cursor-pointer flex items-center gap-1" onClick={() => setCondition("all")}>
                  Condition: <span className="capitalize">{condition}</span> <X className="w-3 h-3 ml-1" />
                </Badge>
              )}
              {make !== "all" && (
                <Badge variant="secondary" className="bg-white/10 hover:bg-white/15 px-3 py-1 text-xs cursor-pointer flex items-center gap-1" onClick={() => setMake("all")}>
                  Make: {make} <X className="w-3 h-3 ml-1" />
                </Badge>
              )}
              {(priceRange[0] > 0 || priceRange[1] < 250000) && (
                <Badge variant="secondary" className="bg-white/10 hover:bg-white/15 px-3 py-1 text-xs cursor-pointer flex items-center gap-1" onClick={() => setPriceRange([0, 250000])}>
                  Price: ${(priceRange[0]/1000).toFixed(0)}k - ${(priceRange[1]/1000).toFixed(0)}k <X className="w-3 h-3 ml-1" />
                </Badge>
              )}
              {search && (
                <Badge variant="secondary" className="bg-white/10 hover:bg-white/15 px-3 py-1 text-xs cursor-pointer flex items-center gap-1" onClick={() => setSearch("")}>
                  Search: "{search}" <X className="w-3 h-3 ml-1" />
                </Badge>
              )}
            </div>
          )}

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-4">
                  <Skeleton className="h-64 w-full rounded-xl bg-white/5" />
                  <Skeleton className="h-8 w-3/4 bg-white/5" />
                  <Skeleton className="h-4 w-1/2 bg-white/5" />
                </div>
              ))
            ) : data?.cars && data.cars.length > 0 ? (
              data.cars.map((car) => (
                <CarCard key={car.id} car={car} />
              ))
            ) : (
              <div className="col-span-full py-24 text-center border border-white/5 rounded-2xl bg-white/5/50 backdrop-blur-sm">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-medium text-white mb-2">No vehicles found</h3>
                <p className="text-muted-foreground mb-6">We couldn't find any vehicles matching your current filters.</p>
                <Button variant="outline" onClick={clearFilters} className="border-white/10">Clear Filters</Button>
              </div>
            )}
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-12 pt-8 border-t border-white/5">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="border-white/10 bg-white/5"
              >
                Previous
              </Button>
              <div className="text-sm font-medium text-white mx-4">
                Page {page} of {data.totalPages}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="border-white/10 bg-white/5"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
