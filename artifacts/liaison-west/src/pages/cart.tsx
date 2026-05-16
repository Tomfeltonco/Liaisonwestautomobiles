import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useGetCart, getGetCartQueryKey, useRemoveFromCart, useClearCart } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Trash2, ShoppingCart, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function Cart() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: cart, isLoading } = useGetCart({
    query: {
      enabled: !!user,
      queryKey: getGetCartQueryKey(),
    }
  });

  const removeFromCartMutation = useRemoveFromCart({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        toast.success("Removed from cart");
      }
    }
  });

  const clearCartMutation = useClearCart({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        toast.success("Cart cleared");
      }
    }
  });

  const handleRemove = (carId: number) => {
    removeFromCartMutation.mutate({ carId });
  };

  const handleClear = () => {
    clearCartMutation.mutate();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
  };

  if (!user) {
    return (
      <Layout>
        <div className="container py-24 text-center">
          <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-serif text-white mb-4">Sign in to view cart</h2>
          <Button onClick={() => setLocation("/login")}>Sign In</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container px-4 md:px-6 py-12 max-w-5xl">
        <h1 className="text-4xl font-serif font-bold text-white mb-8">Your Collection</h1>

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-32 bg-white/5 animate-pulse rounded-2xl"></div>
            <div className="h-32 bg-white/5 animate-pulse rounded-2xl"></div>
          </div>
        ) : cart && cart.items.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item) => (
                <div key={item.carId} className="flex gap-4 p-4 border border-white/10 rounded-2xl bg-card">
                  <div className="w-32 h-24 bg-muted rounded-xl overflow-hidden flex-shrink-0">
                    <img 
                      src={item.car.images?.[0] || "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=800&q=80"} 
                      alt={item.car.model} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <div className="text-muted-foreground text-sm">{item.car.year}</div>
                      <Link href={`/car/${item.carId}`} className="text-lg font-bold text-white hover:text-primary transition-colors">
                        {item.car.make} {item.car.model}
                      </Link>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="text-xl font-bold text-white">{formatPrice(item.car.price)}</div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleRemove(item.carId)}
                        disabled={removeFromCartMutation.isPending}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive px-2"
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="flex justify-end pt-4">
                <Button 
                  variant="ghost" 
                  onClick={handleClear} 
                  disabled={clearCartMutation.isPending}
                  className="text-muted-foreground"
                >
                  Clear Collection
                </Button>
              </div>
            </div>

            <div className="bg-card border border-white/10 rounded-2xl p-6 h-fit sticky top-24">
              <h3 className="text-xl font-bold text-white mb-6">Summary</h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal ({cart.items.length} items)</span>
                  <span className="text-white font-medium">{formatPrice(cart.totalPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Processing Fee</span>
                  <span className="text-white font-medium">Included</span>
                </div>
                <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                  <span className="text-base text-white">Total</span>
                  <span className="text-2xl font-bold text-white">{formatPrice(cart.totalPrice)}</span>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <Button className="w-full h-12 text-base" onClick={() => setLocation("/checkout")}>
                  Proceed to Checkout <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Link href="/inventory" className="block text-center text-sm text-muted-foreground hover:text-white mt-4">
                  Continue Browsing
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-24 border border-white/5 rounded-2xl bg-white/5">
            <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-medium text-white mb-2">Your collection is empty</h3>
            <p className="text-muted-foreground mb-8">Discover our premium inventory and find your perfect match.</p>
            <Link href="/inventory">
              <Button>Browse Inventory</Button>
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
