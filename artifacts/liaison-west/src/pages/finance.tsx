import { Layout } from "@/components/layout";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";
import { Calculator, ShieldCheck, Clock, Percent, ArrowRight } from "lucide-react";
import { useCalculateLoan } from "@workspace/api-client-react";

export default function Finance() {
  const [vehiclePrice, setVehiclePrice] = useState(85000);
  const [downPayment, setDownPayment] = useState(15000);
  const [termMonths, setTermMonths] = useState(60);
  const [creditScore, setCreditScore] = useState(750);

  const calculateLoanMutation = useCalculateLoan();

  const handleCalculate = () => {
    calculateLoanMutation.mutate({
      data: {
        vehiclePrice,
        downPayment,
        termMonths,
        creditScore,
      }
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
  };

  return (
    <Layout>
      {/* Hero Section */}
      <div className="bg-black py-20 border-b border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-sidebar-primary/10 to-transparent"></div>
        <div className="container px-4 md:px-6 relative z-10 text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6">Automotive Financing, Redefined.</h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
            Experience a frictionless, transparent financing process. Immediate approvals, competitive rates, and personalized terms designed around your lifestyle.
          </p>
          <Link href="/finance/apply">
            <Button size="lg" className="rounded-full px-8">Apply Now</Button>
          </Link>
        </div>
      </div>

      <div className="container px-4 md:px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Calculator Tool */}
          <div className="bg-card border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
            <h3 className="text-2xl font-serif font-bold text-white mb-6 flex items-center gap-3">
              <Calculator className="text-primary w-6 h-6" /> Payment Estimator
            </h3>
            
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-white/80">Vehicle Price</Label>
                  <span className="text-lg font-medium text-white">{formatPrice(vehiclePrice)}</span>
                </div>
                <Slider
                  value={[vehiclePrice]}
                  min={10000}
                  max={250000}
                  step={1000}
                  onValueChange={(v) => setVehiclePrice(v[0])}
                  className="py-2"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-white/80">Down Payment</Label>
                  <span className="text-lg font-medium text-white">{formatPrice(downPayment)}</span>
                </div>
                <Slider
                  value={[downPayment]}
                  min={0}
                  max={vehiclePrice * 0.8}
                  step={500}
                  onValueChange={(v) => setDownPayment(v[0])}
                  className="py-2"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-white/80">Loan Term (Months)</Label>
                  <span className="text-lg font-medium text-white">{termMonths}</span>
                </div>
                <Slider
                  value={[termMonths]}
                  min={12}
                  max={84}
                  step={12}
                  onValueChange={(v) => setTermMonths(v[0])}
                  className="py-2"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-white/80">Estimated Credit Score</Label>
                  <span className="text-lg font-medium text-white">{creditScore}</span>
                </div>
                <Slider
                  value={[creditScore]}
                  min={500}
                  max={850}
                  step={10}
                  onValueChange={(v) => setCreditScore(v[0])}
                  className="py-2"
                />
              </div>

              <Button 
                className="w-full h-12 text-base mt-4" 
                onClick={handleCalculate}
                disabled={calculateLoanMutation.isPending}
              >
                {calculateLoanMutation.isPending ? "Calculating..." : "Calculate Payment"}
              </Button>

              {calculateLoanMutation.isSuccess && calculateLoanMutation.data && (
                <div className="mt-8 p-6 bg-white/5 border border-white/10 rounded-2xl animate-in fade-in zoom-in duration-300">
                  <div className="text-center mb-6">
                    <div className="text-sm text-muted-foreground mb-1">Estimated Monthly Payment</div>
                    <div className="text-4xl font-bold text-white">{formatPrice(calculateLoanMutation.data.monthlyPayment)}<span className="text-lg font-normal text-muted-foreground">/mo</span></div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-background rounded-lg p-3 border border-white/5">
                      <div className="text-muted-foreground mb-1">Total Loan</div>
                      <div className="font-medium text-white">{formatPrice(calculateLoanMutation.data.loanAmount)}</div>
                    </div>
                    <div className="bg-background rounded-lg p-3 border border-white/5">
                      <div className="text-muted-foreground mb-1">Est. APR</div>
                      <div className="font-medium text-white">{(calculateLoanMutation.data.interestRate * 100).toFixed(2)}%</div>
                    </div>
                    <div className="bg-background rounded-lg p-3 border border-white/5">
                      <div className="text-muted-foreground mb-1">Total Interest</div>
                      <div className="font-medium text-white">{formatPrice(calculateLoanMutation.data.totalInterest)}</div>
                    </div>
                    <div className="bg-background rounded-lg p-3 border border-white/5">
                      <div className="text-muted-foreground mb-1">Total Cost</div>
                      <div className="font-medium text-white">{formatPrice(calculateLoanMutation.data.totalPayment)}</div>
                    </div>
                  </div>
                  
                  <Link href={`/finance/apply?amount=${calculateLoanMutation.data.loanAmount}&term=${termMonths}&down=${downPayment}`} className="block mt-6">
                    <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/10">
                      Apply with these terms
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Info Side */}
          <div className="space-y-12">
            <div>
              <h2 className="text-3xl font-serif font-bold text-white mb-6">Why Finance With Us?</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="bg-white/10 p-3 rounded-xl h-fit border border-white/10">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-white mb-2">Instant Decisions</h4>
                    <p className="text-muted-foreground leading-relaxed">Our AI-powered underwriting engine provides instantaneous loan decisions for most applicants, allowing you to take delivery the same day.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="bg-white/10 p-3 rounded-xl h-fit border border-white/10">
                    <Percent className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-white mb-2">Unbeatable Rates</h4>
                    <p className="text-muted-foreground leading-relaxed">Leveraging our extensive network of premium lending partners, we secure the most competitive interest rates available based on your credit profile.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="bg-white/10 p-3 rounded-xl h-fit border border-white/10">
                    <ShieldCheck className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-white mb-2">Transparent Process</h4>
                    <p className="text-muted-foreground leading-relaxed">No hidden fees, no last-minute surprises, and no prepayment penalties. We believe in complete financial clarity from application to payoff.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-sidebar-primary/20 to-transparent p-8 rounded-3xl border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4">The Application Process</h3>
              <ol className="relative border-l border-white/20 ml-3 space-y-6">
                <li className="pl-6 relative">
                  <div className="absolute w-3 h-3 bg-primary rounded-full -left-[6.5px] top-1.5"></div>
                  <h4 className="font-medium text-white">1. Select Your Vehicle</h4>
                  <p className="text-sm text-muted-foreground mt-1">Browse our premium inventory and select the car you wish to acquire.</p>
                </li>
                <li className="pl-6 relative">
                  <div className="absolute w-3 h-3 bg-white/20 rounded-full -left-[6.5px] top-1.5 border border-white/40"></div>
                  <h4 className="font-medium text-white">2. Customize Terms</h4>
                  <p className="text-sm text-muted-foreground mt-1">Dial in your preferred down payment and loan duration.</p>
                </li>
                <li className="pl-6 relative">
                  <div className="absolute w-3 h-3 bg-white/20 rounded-full -left-[6.5px] top-1.5 border border-white/40"></div>
                  <h4 className="font-medium text-white">3. Verify Identity</h4>
                  <p className="text-sm text-muted-foreground mt-1">Complete our secure, encrypted identity verification process.</p>
                </li>
                <li className="pl-6 relative">
                  <div className="absolute w-3 h-3 bg-white/20 rounded-full -left-[6.5px] top-1.5 border border-white/40"></div>
                  <h4 className="font-medium text-white">4. Finalize Acquisition</h4>
                  <p className="text-sm text-muted-foreground mt-1">Review the terms, sign digitally, and schedule delivery.</p>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
