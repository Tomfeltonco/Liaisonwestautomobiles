import { Car } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Fuel, Gauge, ShieldCheck } from "lucide-react";

interface CarCardProps {
  car: Car;
}

export function CarCard({ car }: CarCardProps) {
  const primaryImage = car.images && car.images.length > 0 ? car.images[0] : "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=800&q=80";
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
  };

  return (
    <Card className="group overflow-hidden bg-card/50 border-white/5 hover:border-white/20 transition-all duration-500 rounded-xl">
      <Link href={`/car/${car.id}`}>
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          <img 
            src={primaryImage} 
            alt={`${car.year} ${car.make} ${car.model}`}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {car.condition === 'certified' && (
              <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-md border-none font-medium flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Certified
              </Badge>
            )}
            {car.condition === 'new' && (
              <Badge variant="secondary" className="backdrop-blur-md bg-secondary/80 border-none font-medium">
                New Arrival
              </Badge>
            )}
          </div>
          {car.status !== 'available' && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
              <span className="text-white font-serif tracking-widest uppercase font-bold text-xl border border-white/20 px-6 py-2 rounded-sm bg-black/40">
                {car.status}
              </span>
            </div>
          )}
        </div>
      </Link>
      
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="text-muted-foreground text-sm font-medium mb-1">{car.year}</div>
            <Link href={`/car/${car.id}`} className="hover:text-primary transition-colors">
              <h3 className="text-xl font-bold font-serif tracking-wide truncate max-w-[200px]">{car.make} {car.model}</h3>
            </Link>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-primary">{formatPrice(car.price)}</div>
            {car.monthlyPayment && (
              <div className="text-xs text-muted-foreground">Est. {formatPrice(car.monthlyPayment)}/mo</div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mt-6 pt-6 border-t border-white/5">
          <div className="flex flex-col items-center justify-center text-center p-2 rounded-lg bg-white/5">
            <Gauge className="w-4 h-4 mb-1 text-muted-foreground" />
            <span className="text-xs font-medium">{car.mileage.toLocaleString()} mi</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center p-2 rounded-lg bg-white/5">
            <Fuel className="w-4 h-4 mb-1 text-muted-foreground" />
            <span className="text-xs font-medium capitalize">{car.fuelType.replace('_', ' ')}</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center p-2 rounded-lg bg-white/5">
            <span className="text-xs font-bold text-muted-foreground mb-1">HP</span>
            <span className="text-xs font-medium">{car.horsepower || 'N/A'}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="px-6 pb-6 pt-0">
        <Link href={`/car/${car.id}`} className="w-full">
          <Button variant="secondary" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
            View Details <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
