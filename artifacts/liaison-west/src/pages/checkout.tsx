import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useGetCart, getGetCartQueryKey, useCreateOrder } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { CreditCard, ShieldCheck, Lock, CheckCircle2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Checkout() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [paymentType, setPaymentType] = useState<"full" | "installment">("full");
  const [cardDetails, setCardDetails] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });
  const [isSuccess, setIsSuccess] = useState(false);

  const { data: cart, isLoading } = useGetCart({
    query: {
      enabled: !!user && !isSuccess,
      queryKey: getGetCartQueryKey(),
    }
  });

  const createOrderMutation = useCreateOrder({
    mutation: {
      onSuccess: () => {
        setIsSuccess(true);
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to process payment");
      }
    }
  });

  // Calculate totals
  const totalAmount = cart?.totalPrice || 0;
  const downPayment = paymentType === "installment" ? totalAmount * 0.2 : 0; // 20% down
  const amountDueToday = paymentType === "full" ? totalAmount : downPayment;
  const termMonths = 60;

  const handleCheckout = () => {
    if (!cart || cart.items.length === 0) return;
    
    // Process each item as an order (simplified for MVP, usually one order with multiple items)
    // We'll just create an order for the first item
    const primaryItem = cart.items[0];
    
    createOrderMutation.mutate({
      data: {
        carId: primaryItem.carId,
        paymentType: paymentType,
        downPayment: paymentType === "installment" ? downPayment : undefined,
        termMonths: paymentType === "installment" ? termMonths : undefined,
        cardLast4: cardDetails.number.slice(-4) || "4242",
        cardBrand: "Visa"
      }
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
  };

  if (!user) {
    setLocation("/login");
    return null;
  }

  if (isSuccess) {
    return (
      <Layout>
        <div className="container py-32 text-center max-w-lg mx-auto">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-white mb-4">Payment Successful</h1>
          <p className="text-muted-foreground mb-8 text-lg">
            Your transaction has been securely processed. A Liaison West concierge will contact you shortly to arrange delivery.
          </p>
          <Button size="lg" onClick={() => setLocation("/account")}>View Order in Account</Button>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-24 text-center">Loading...</div>
      </Layout>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <Layout>
        <div className="container py-24 text-center">
          <h2 className="text-2xl font-serif text-white mb-4">Your cart is empty</h2>
          <Button onClick={() => setLocation("/inventory")}>Browse Inventory</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-black py-12 border-b border-white/5">
        <div className="container px-4 md:px-6">
          <h1 className="text-4xl font-serif font-bold text-white">Secure Checkout</h1>
        </div>
      </div>

      <div className="container px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Left - Payment Options */}
          <div className="space-y-8">
            <div className="bg-card border border-white/10 rounded-2xl p-6 backdrop-blur-md">
              <h2 className="text-xl font-bold text-white mb-6">Payment Method</h2>
              
              <RadioGroup value={paymentType} onValueChange={(v) => setPaymentType(v as "full" | "installment")} className="space-y-4">
                <div className={`flex items-center space-x-3 border ${paymentType === "full" ? "border-primary bg-primary/5" : "border-white/10 bg-white/5"} p-4 rounded-xl cursor-pointer transition-colors`} onClick={() => setPaymentType("full")}>
                  <RadioGroupItem value="full" id="r1" />
                  <Label htmlFor="r1" className="flex-1 cursor-pointer">
                    <div className="font-medium text-white text-base">Pay in Full</div>
                    <div className="text-sm text-muted-foreground">Complete transaction today</div>
                  </Label>
                  <div className="font-bold text-white">{formatPrice(totalAmount)}</div>
                </div>
                
                <div className={`flex items-center space-x-3 border ${paymentType === "installment" ? "border-primary bg-primary/5" : "border-white/10 bg-white/5"} p-4 rounded-xl cursor-pointer transition-colors`} onClick={() => setPaymentType("installment")}>
                  <RadioGroupItem value="installment" id="r2" />
                  <Label htmlFor="r2" className="flex-1 cursor-pointer">
                    <div className="font-medium text-white text-base">Finance / Installments</div>
                    <div className="text-sm text-muted-foreground">Subject to credit approval</div>
                  </Label>
                  <div className="text-right">
                    <div className="font-bold text-white">{formatPrice(downPayment)}</div>
                    <div className="text-xs text-muted-foreground">Due today</div>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div className="bg-card border border-white/10 rounded-2xl p-6 backdrop-blur-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Payment Details</h2>
                <div className="flex gap-2 text-white/50">
                  <CreditCard className="w-5 h-5" />
                  <Lock className="w-5 h-5" />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-white/80">Name on Card</Label>
                  <Input 
                    value={cardDetails.name} 
                    onChange={e => setCardDetails({...cardDetails, name: e.target.value})} 
                    className="bg-white/5 border-white/10 h-12" 
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label className="text-white/80">Card Number</Label>
                  <Input 
                    value={cardDetails.number} 
                    onChange={e => setCardDetails({...cardDetails, number: e.target.value})} 
                    className="bg-white/5 border-white/10 h-12" 
                    placeholder="•••• •••• •••• ••••"
                    maxLength={19}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white/80">Expiry (MM/YY)</Label>
                    <Input 
                      value={cardDetails.expiry} 
                      onChange={e => setCardDetails({...cardDetails, expiry: e.target.value})} 
                      className="bg-white/5 border-white/10 h-12" 
                      placeholder="MM/YY"
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <Label className="text-white/80">CVV</Label>
                    <Input 
                      value={cardDetails.cvv} 
                      onChange={e => setCardDetails({...cardDetails, cvv: e.target.value})} 
                      className="bg-white/5 border-white/10 h-12" 
                      placeholder="123"
                      maxLength={4}
                      type="password"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Order Summary */}
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sticky top-24">
              <h2 className="text-xl font-bold text-white mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                {cart.items.map(item => (
                  <div key={item.carId} className="flex gap-4">
                    <div className="w-20 h-16 bg-muted rounded border border-white/10 overflow-hidden flex-shrink-0">
                      <img src={item.car.images?.[0]} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-white">{item.car.year} {item.car.make}</div>
                      <div className="text-sm text-muted-foreground">{item.car.model}</div>
                    </div>
                    <div className="font-medium text-white">{formatPrice(item.car.price)}</div>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/10 pt-4 space-y-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatPrice(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Processing Fee</span>
                  <span>Included</span>
                </div>
                
                {paymentType === "installment" && (
                  <>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Down Payment (Due Today)</span>
                      <span>{formatPrice(downPayment)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Estimated Monthly</span>
                      <span>{formatPrice((totalAmount - downPayment) / termMonths * 1.05)} / mo</span>
                    </div>
                  </>
                )}
                
                <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                  <span className="text-base text-white">Total Due Today</span>
                  <span className="text-3xl font-bold text-white">{formatPrice(amountDueToday)}</span>
                </div>
              </div>

              <Button 
                className="w-full h-14 text-lg font-bold mt-8" 
                onClick={handleCheckout}
                disabled={createOrderMutation.isPending || !cardDetails.number || !cardDetails.name}
              >
                {createOrderMutation.isPending ? "Processing..." : `Pay ${formatPrice(amountDueToday)}`}
              </Button>
              
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                <span>256-bit SSL encrypted secure transaction</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
