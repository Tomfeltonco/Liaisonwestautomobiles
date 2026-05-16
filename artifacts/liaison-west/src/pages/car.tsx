import { useParams, useLocation, Link } from "wouter";
import { Layout } from "@/components/layout";
import { useGetCar, useGetSimilarCars, getGetCarQueryKey, getGetSimilarCarsQueryKey, useAddToCart } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CarCard } from "@/components/car-card";
import { Fuel, Gauge, Settings, ShieldCheck, ShoppingCart, Calculator, Calendar, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CarDetails() {
  const params = useParams();
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  const { data: car, isLoading } = useGetCar(id, {
    query: {
      enabled: !!id,
      queryKey: getGetCarQueryKey(id),
    }
  });

  const { data: similarCars } = useGetSimilarCars(id, {
    query: {
      enabled: !!id,
      queryKey: getGetSimilarCarsQueryKey(id),
    }
  });

  const addToCartMutation = useAddToCart({
    mutation: {
      onSuccess: () => {
        toast.success("Vehicle added to cart");
        setLocation("/cart");
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to add to cart");
      }
    }
  });

  const handleAddToCart = () => {
    if (!user) {
      toast.error("Please sign in to add to cart");
      setLocation("/login");
      return;
    }
    
    addToCartMutation.mutate({
      data: {
        carId: id,
        paymentType: "full"
      }
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container px-4 py-8">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Skeleton className="h-[60vh] rounded-2xl" />
            <div className="space-y-6">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!car) {
    return (
      <Layout>
        <div className="container px-4 py-24 text-center">
          <h2 className="text-3xl font-serif text-white mb-4">Vehicle Not Found</h2>
          <Link href="/inventory">
            <Button variant="outline">Return to Inventory</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const primaryImage = car.images && car.images.length > 0 ? car.images[0] : "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=1200&q=80";

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="border-b border-white/5 bg-background pt-8 pb-4">
        <div className="container px-4 md:px-6">
          <Link href="/inventory" className="inline-flex items-center text-sm text-muted-foreground hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Inventory
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                {car.condition === 'certified' && (
                  <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-md border-none font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Certified Pre-Owned
                  </Badge>
                )}
                {car.condition === 'new' && (
                  <Badge variant="secondary" className="backdrop-blur-md bg-secondary/80 border-none font-medium">
                    New Arrival
                  </Badge>
                )}
                <span className="text-muted-foreground">{car.vin}</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white tracking-tight">
                {car.year} {car.make} {car.model}
              </h1>
            </div>
            <div className="text-left md:text-right">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">{formatPrice(car.price)}</div>
              {car.monthlyPayment && (
                <div className="text-muted-foreground">Est. {formatPrice(car.monthlyPayment)}/mo</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content - Left */}
          <div className="lg:col-span-2 space-y-12">
            {/* Gallery */}
            <div className="rounded-2xl overflow-hidden border border-white/5 bg-white/5">
              <img src={primaryImage} alt={`${car.make} ${car.model}`} className="w-full h-[50vh] md:h-[60vh] object-cover" />
              {car.images && car.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2 p-2 bg-black/50">
                  {car.images.slice(1, 5).map((img, i) => (
                    <img key={i} src={img} alt={`Gallery ${i}`} className="w-full h-24 object-cover rounded-lg border border-white/10 hover:border-primary transition-colors cursor-pointer" />
                  ))}
                </div>
              )}
            </div>

            {/* Quick Specs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                <Gauge className="w-6 h-6 text-primary mb-2" />
                <span className="text-sm text-muted-foreground mb-1">Mileage</span>
                <span className="font-medium text-white">{car.mileage.toLocaleString()} mi</span>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                <Fuel className="w-6 h-6 text-primary mb-2" />
                <span className="text-sm text-muted-foreground mb-1">Fuel Type</span>
                <span className="font-medium text-white capitalize">{car.fuelType.replace('_', ' ')}</span>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                <Settings className="w-6 h-6 text-primary mb-2" />
                <span className="text-sm text-muted-foreground mb-1">Transmission</span>
                <span className="font-medium text-white capitalize">{car.transmission}</span>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                <Calendar className="w-6 h-6 text-primary mb-2" />
                <span className="text-sm text-muted-foreground mb-1">Year</span>
                <span className="font-medium text-white">{car.year}</span>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview">
              <TabsList className="bg-white/5 border border-white/10 p-1 w-full justify-start rounded-xl mb-6">
                <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white/10">Overview</TabsTrigger>
                <TabsTrigger value="specs" className="rounded-lg data-[state=active]:bg-white/10">Full Specifications</TabsTrigger>
                <TabsTrigger value="features" className="rounded-lg data-[state=active]:bg-white/10">Features</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="text-muted-foreground leading-relaxed space-y-6">
                <p>{car.description || `Experience the exceptional craftsmanship and thrilling performance of the ${car.year} ${car.make} ${car.model}. This meticulously maintained vehicle offers a perfect blend of luxury and capability, representing the pinnacle of automotive engineering.`}</p>
                <p>Finished in stunning {car.color}, this {car.bodyType.toLowerCase()} commands attention wherever it goes. With only {car.mileage.toLocaleString()} miles on the odometer, it presents a remarkable opportunity to acquire a pristine example of this sought-after model.</p>
              </TabsContent>

              <TabsContent value="specs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                  <div className="flex justify-between py-3 border-b border-white/5">
                    <span className="text-muted-foreground">Engine</span>
                    <span className="text-white font-medium">{car.engine || 'Standard'}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-white/5">
                    <span className="text-muted-foreground">Horsepower</span>
                    <span className="text-white font-medium">{car.horsepower || 'N/A'} hp</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-white/5">
                    <span className="text-muted-foreground">Body Style</span>
                    <span className="text-white font-medium">{car.bodyType}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-white/5">
                    <span className="text-muted-foreground">Exterior Color</span>
                    <span className="text-white font-medium">{car.color}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-white/5">
                    <span className="text-muted-foreground">Seating Capacity</span>
                    <span className="text-white font-medium">{car.seatingCapacity || 5}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-white/5">
                    <span className="text-muted-foreground">Drive Type</span>
                    <span className="text-white font-medium">AWD / RWD</span>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="features">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {car.features && car.features.length > 0 ? (
                    car.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                        <span className="text-white/80">{feature}</span>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-muted-foreground italic">Standard equipment applies.</div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Right */}
          <div className="space-y-6">
            {/* Action Card */}
            <div className="bg-card border border-white/10 rounded-2xl p-6 sticky top-24">
              <h3 className="text-xl font-bold text-white mb-6">Acquisition Options</h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center p-4 border border-white/10 rounded-xl bg-white/5 cursor-pointer hover:border-primary transition-colors">
                  <div>
                    <div className="font-medium text-white mb-1">Pay in Full</div>
                    <div className="text-sm text-muted-foreground">Complete payment today</div>
                  </div>
                  <div className="text-lg font-bold text-white">{formatPrice(car.price)}</div>
                </div>
                
                <div className="flex justify-between items-center p-4 border border-primary/50 rounded-xl bg-primary/5 cursor-pointer hover:border-primary transition-colors relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">RECOMMENDED</div>
                  <div>
                    <div className="font-medium text-white mb-1">Finance</div>
                    <div className="text-sm text-muted-foreground">From 3.99% APR</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">{formatPrice(car.monthlyPayment || car.price * 0.015)}<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  size="lg" 
                  className="w-full text-base font-medium h-14"
                  onClick={handleAddToCart}
                  disabled={car.status !== 'available' || addToCartMutation.isPending}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
                </Button>
                
                <Link href={`/finance/apply?carId=${car.id}`}>
                  <Button variant="outline" size="lg" className="w-full text-base font-medium h-14 border-white/20 hover:bg-white/5">
                    <Calculator className="w-5 h-5 mr-2" /> Apply for Financing
                  </Button>
                </Link>
              </div>

              {car.status !== 'available' && (
                <div className="mt-4 p-3 bg-destructive/20 border border-destructive/50 rounded-lg text-center">
                  <span className="text-destructive font-medium">This vehicle is currently {car.status}.</span>
                </div>
              )}
            </div>

            {/* Agent Info */}
            <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
              <h4 className="text-sm text-muted-foreground uppercase tracking-wider font-medium mb-4">Concierge Contact</h4>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white font-serif text-xl border border-white/20">
                  {(car.agentName || 'LW')[0]}
                </div>
                <div>
                  <div className="font-medium text-white">{car.agentName || 'Liaison West Agent'}</div>
                  <div className="text-sm text-muted-foreground">Premium Client Advisor</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Cars */}
        {similarCars && similarCars.length > 0 && (
          <div className="mt-24 pt-12 border-t border-white/5">
            <h2 className="text-2xl font-serif font-bold text-white mb-8">Similar Vehicles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {similarCars.slice(0, 3).map(similarCar => (
                <CarCard key={similarCar.id} car={similarCar} />
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
