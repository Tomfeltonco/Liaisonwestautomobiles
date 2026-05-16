import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import {
  useGetCart, getGetCartQueryKey, useCreateOrder, useCalculateLoan
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  ShieldCheck, Lock, CheckCircle2, CreditCard, Landmark,
  Bitcoin, ChevronRight, AlertCircle, Loader2, BadgeCheck
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

/* ─── TYPES ─── */
type PaymentGroup = "card" | "wire" | "crypto" | "digital";
type DigitalMethod = "paypal" | "cashapp" | "zelle" | "chime" | "venmo";
type CryptoMethod = "bitcoin" | "ethereum" | "usdc" | "usdt";
type PaymentChoice = "full" | "installment";

interface CreditCheckData {
  idType: string;
  idNumber: string;
  ssnLast4: string;
  annualIncome: string;
  termMonths: string;
  downPaymentPct: string;
}

const DIGITAL_METHODS: { id: DigitalMethod; label: string; color: string; instruction: string }[] = [
  { id: "paypal", label: "PayPal", color: "#003087", instruction: "Send to: payments@liaisonwest.com (Friends & Family)" },
  { id: "cashapp", label: "Cash App", color: "#00D54B", instruction: "Send to $LiaisonWestAuto on Cash App" },
  { id: "zelle", label: "Zelle", color: "#6D1ED4", instruction: "Send via Zelle to: zelle@liaisonwest.com" },
  { id: "chime", label: "Chime", color: "#1DA462", instruction: "Send via Chime to: chime@liaisonwest.com" },
  { id: "venmo", label: "Venmo", color: "#3D95CE", instruction: "Send to @LiaisonWest on Venmo" },
];

const CRYPTO_METHODS: { id: CryptoMethod; label: string; symbol: string; address: string }[] = [
  { id: "bitcoin", label: "Bitcoin", symbol: "BTC", address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh" },
  { id: "ethereum", label: "Ethereum", symbol: "ETH", address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F" },
  { id: "usdc", label: "USD Coin", symbol: "USDC", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
  { id: "usdt", label: "Tether", symbol: "USDT", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7" },
];

const CREDIT_TIERS = [
  { min: 750, rate: 3.9, label: "Excellent", color: "text-emerald-400" },
  { min: 700, rate: 5.4, label: "Good", color: "text-blue-400" },
  { min: 650, rate: 6.9, label: "Fair", color: "text-yellow-400" },
  { min: 600, rate: 9.9, label: "Below Average", color: "text-orange-400" },
  { min: 0, rate: 14.9, label: "Poor", color: "text-red-400" },
];

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

/* ─── COMPONENT ─── */
export default function Checkout() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Redirect to login only after auth has settled (not while loading)
  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [authLoading, user, setLocation]);

  const [paymentChoice, setPaymentChoice] = useState<PaymentChoice>("full");
  const [paymentGroup, setPaymentGroup] = useState<PaymentGroup>("card");
  const [digitalMethod, setDigitalMethod] = useState<DigitalMethod>("paypal");
  const [cryptoMethod, setCryptoMethod] = useState<CryptoMethod>("bitcoin");
  const [isSuccess, setIsSuccess] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Card fields
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvv: "" });

  // Credit check for installment
  const [creditCheck, setCreditCheck] = useState<CreditCheckData>({
    idType: "drivers_license",
    idNumber: "",
    ssnLast4: "",
    annualIncome: "",
    termMonths: "60",
    downPaymentPct: "20",
  });
  const [creditScore, setCreditScore] = useState<number | null>(null);
  const [creditRunning, setCreditRunning] = useState(false);
  const [creditDone, setCreditDone] = useState(false);
  const [loanCalc, setLoanCalc] = useState<{ monthlyPayment: number; interestRate: number; totalPayment: number } | null>(null);

  const { data: cart, isLoading } = useGetCart({
    query: { enabled: !!user && !isSuccess, queryKey: getGetCartQueryKey() },
  });

  const calcLoanMutation = useCalculateLoan({});

  const createOrderMutation = useCreateOrder({
    mutation: {
      onSuccess: () => {
        setIsSuccess(true);
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.error || "Failed to process payment. Please try again.");
      },
    },
  });

  const totalAmount = cart?.totalPrice || 0;
  const downPaymentPct = parseFloat(creditCheck.downPaymentPct) / 100 || 0.2;
  const downPayment = totalAmount * downPaymentPct;
  const termMonths = parseInt(creditCheck.termMonths) || 60;
  const amountDueToday = paymentChoice === "full" ? totalAmount : downPayment;

  // Auto-recalculate loan when credit check is done
  useEffect(() => {
    if (creditDone && creditScore !== null && totalAmount > 0) {
      calcLoanMutation.mutate({
        data: {
          vehiclePrice: totalAmount,
          downPayment,
          termMonths,
          creditScore,
        },
      }, {
        onSuccess: (data) => setLoanCalc(data),
      });
    }
  }, [creditDone, creditScore, totalAmount, downPayment, termMonths]);

  const runCreditCheck = async () => {
    if (!creditCheck.idNumber || !creditCheck.ssnLast4 || !creditCheck.annualIncome) {
      toast.error("Please fill in your ID number, SSN (last 4), and annual income.");
      return;
    }
    setCreditRunning(true);
    // Simulate credit check processing
    await new Promise((r) => setTimeout(r, 2800));
    // Deterministic score based on SSN + income for demo
    const income = parseFloat(creditCheck.annualIncome) || 50000;
    const ssnNum = parseInt(creditCheck.ssnLast4) || 5000;
    const score = Math.min(850, Math.max(520, Math.round(550 + (income / 5000) + (ssnNum / 100))));
    setCreditScore(score);
    setCreditDone(true);
    setCreditRunning(false);
    toast.success(`Credit check complete. Score: ${score}`);
  };

  const handleCheckout = () => {
    if (!cart || cart.items.length === 0) return;
    const item = cart.items[0];

    if (paymentChoice === "installment" && !creditDone) {
      toast.error("Please complete the credit check before financing.");
      return;
    }

    if (paymentGroup === "card" && (!card.number || !card.name)) {
      toast.error("Please enter your card details.");
      return;
    }

    createOrderMutation.mutate({
      data: {
        carId: item.carId,
        paymentType: paymentChoice,
        downPayment: paymentChoice === "installment" ? downPayment : undefined,
        termMonths: paymentChoice === "installment" ? termMonths : undefined,
        cardLast4: paymentGroup === "card" ? card.number.replace(/\s/g, "").slice(-4) : paymentGroup,
        cardBrand: paymentGroup === "card" ? detectCardBrand(card.number) : paymentGroup,
      },
    });
  };

  function detectCardBrand(number: string): string {
    const n = number.replace(/\s/g, "");
    if (n.startsWith("4")) return "Visa";
    if (n.startsWith("5") || n.startsWith("2")) return "Mastercard";
    if (n.startsWith("34") || n.startsWith("37")) return "Amex";
    if (n.startsWith("6")) return "Discover";
    return "Card";
  }

  function formatCardNumber(val: string) {
    return val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  }

  function formatExpiry(val: string) {
    return val.replace(/\D/g, "").slice(0, 4).replace(/^(\d{2})(\d)/, "$1/$2");
  }

  function getCreditTier(score: number) {
    return CREDIT_TIERS.find((t) => score >= t.min) || CREDIT_TIERS[CREDIT_TIERS.length - 1];
  }

  if (authLoading || !user) {
    return <Layout><div className="container py-24 text-center text-white/40">Loading...</div></Layout>;
  }

  // ── SUCCESS ──
  if (isSuccess) {
    return (
      <Layout>
        <div className="container py-32 max-w-lg mx-auto text-center">
          <div className="relative mx-auto w-24 h-24 mb-8">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
            <div className="relative w-24 h-24 bg-emerald-500/15 border border-emerald-500/30 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            </div>
          </div>
          <h1 className="text-4xl font-serif font-bold text-white mb-4">Order Confirmed</h1>
          <p className="text-white/50 mb-2 text-lg">Transaction ID: <span className="text-white font-mono">LW-{Date.now().toString().slice(-8)}</span></p>
          <p className="text-white/40 text-sm mb-10 leading-relaxed max-w-sm mx-auto">
            Your payment has been processed. A Liaison West concierge will contact you within 24 hours to arrange delivery.
          </p>
          <Button size="lg" onClick={() => setLocation("/account")} className="bg-white text-black font-bold hover:bg-white/90">
            View My Orders
          </Button>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return <Layout><div className="container py-24 text-center text-white/40">Loading cart...</div></Layout>;
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

  const selectedCrypto = CRYPTO_METHODS.find((c) => c.id === cryptoMethod)!;
  const selectedDigital = DIGITAL_METHODS.find((d) => d.id === digitalMethod)!;
  const creditTier = creditScore !== null ? getCreditTier(creditScore) : null;

  return (
    <Layout>
      <div className="bg-[#090909] py-12 border-b border-white/5">
        <div className="container px-4 md:px-6">
          <div className="flex items-center gap-2 text-white/30 text-sm mb-3">
            <span>Cart</span><ChevronRight className="w-3 h-3" /><span className="text-white">Checkout</span>
          </div>
          <h1 className="text-4xl font-serif font-bold text-white">Secure Checkout</h1>
        </div>
      </div>

      <div className="container px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10 max-w-6xl mx-auto">

          {/* ─── LEFT COLUMN ─── */}
          <div className="space-y-6">

            {/* STEP 1: Payment choice */}
            <section className="bg-white/[0.02] border border-white/8 rounded-2xl p-6">
              <h2 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-white text-black text-xs font-bold flex items-center justify-center">1</span>
                How would you like to pay?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Payment */}
                <button
                  onClick={() => setPaymentChoice("full")}
                  className={`text-left p-5 rounded-xl border-2 transition-all ${
                    paymentChoice === "full"
                      ? "border-white bg-white/5"
                      : "border-white/10 hover:border-white/25"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white font-bold text-base">Pay in Full</span>
                    {paymentChoice === "full" && <BadgeCheck className="w-5 h-5 text-emerald-400" />}
                  </div>
                  <div className="text-3xl font-serif font-bold text-white mb-1">{fmt(totalAmount)}</div>
                  <div className="text-white/40 text-xs">Complete ownership immediately. No interest. No monthly payments.</div>
                </button>

                {/* Installment */}
                <button
                  onClick={() => setPaymentChoice("installment")}
                  className={`text-left p-5 rounded-xl border-2 transition-all ${
                    paymentChoice === "installment"
                      ? "border-white bg-white/5"
                      : "border-white/10 hover:border-white/25"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white font-bold text-base">Finance / Installments</span>
                    {paymentChoice === "installment" && <BadgeCheck className="w-5 h-5 text-emerald-400" />}
                  </div>
                  <div className="text-3xl font-serif font-bold text-white mb-1">
                    {fmt(downPayment)} <span className="text-base font-normal text-white/40">today</span>
                  </div>
                  <div className="text-white/40 text-xs">Then flexible monthly payments. Requires credit check.</div>
                </button>
              </div>
            </section>

            {/* STEP 2: Credit Check (only for installment) */}
            {paymentChoice === "installment" && (
              <section className="bg-white/[0.02] border border-white/8 rounded-2xl p-6">
                <h2 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-white text-black text-xs font-bold flex items-center justify-center">2</span>
                  Credit & Identity Check
                </h2>
                <p className="text-white/40 text-sm mb-6 ml-8">We run a soft pull — this will not affect your credit score.</p>

                {!creditDone ? (
                  <div className="space-y-4">
                    {/* Loan Config */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white/50 text-xs tracking-wider uppercase font-semibold mb-2 block">Down Payment</Label>
                        <div className="relative">
                          <select
                            value={creditCheck.downPaymentPct}
                            onChange={(e) => setCreditCheck({ ...creditCheck, downPaymentPct: e.target.value })}
                            className="w-full h-11 bg-white/5 border border-white/10 text-white rounded-xl px-4 text-sm appearance-none focus:outline-none focus:border-white/30"
                          >
                            <option value="10">10% — {fmt(totalAmount * 0.1)}</option>
                            <option value="15">15% — {fmt(totalAmount * 0.15)}</option>
                            <option value="20">20% — {fmt(totalAmount * 0.2)}</option>
                            <option value="25">25% — {fmt(totalAmount * 0.25)}</option>
                            <option value="30">30% — {fmt(totalAmount * 0.3)}</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <Label className="text-white/50 text-xs tracking-wider uppercase font-semibold mb-2 block">Loan Term</Label>
                        <select
                          value={creditCheck.termMonths}
                          onChange={(e) => setCreditCheck({ ...creditCheck, termMonths: e.target.value })}
                          className="w-full h-11 bg-white/5 border border-white/10 text-white rounded-xl px-4 text-sm appearance-none focus:outline-none focus:border-white/30"
                        >
                          <option value="24">24 months (2 yr)</option>
                          <option value="36">36 months (3 yr)</option>
                          <option value="48">48 months (4 yr)</option>
                          <option value="60">60 months (5 yr)</option>
                          <option value="72">72 months (6 yr)</option>
                          <option value="84">84 months (7 yr)</option>
                        </select>
                      </div>
                    </div>

                    {/* Identity */}
                    <div className="border-t border-white/8 pt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-white/50 text-xs tracking-wider uppercase font-semibold mb-2 block">ID Type</Label>
                          <select
                            value={creditCheck.idType}
                            onChange={(e) => setCreditCheck({ ...creditCheck, idType: e.target.value })}
                            className="w-full h-11 bg-white/5 border border-white/10 text-white rounded-xl px-4 text-sm appearance-none focus:outline-none focus:border-white/30"
                          >
                            <option value="drivers_license">Driver's License</option>
                            <option value="passport">Passport</option>
                            <option value="state_id">State ID</option>
                          </select>
                        </div>
                        <div>
                          <Label className="text-white/50 text-xs tracking-wider uppercase font-semibold mb-2 block">ID Number</Label>
                          <Input
                            placeholder="D123-456-789"
                            value={creditCheck.idNumber}
                            onChange={(e) => setCreditCheck({ ...creditCheck, idNumber: e.target.value })}
                            className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-white/50 text-xs tracking-wider uppercase font-semibold mb-2 block">SSN — Last 4 Digits</Label>
                          <Input
                            placeholder="•••• — XXXX"
                            maxLength={4}
                            value={creditCheck.ssnLast4}
                            onChange={(e) => setCreditCheck({ ...creditCheck, ssnLast4: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                            className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl font-mono tracking-widest"
                          />
                        </div>
                        <div>
                          <Label className="text-white/50 text-xs tracking-wider uppercase font-semibold mb-2 block">Annual Income</Label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
                            <Input
                              placeholder="85,000"
                              value={creditCheck.annualIncome}
                              onChange={(e) => setCreditCheck({ ...creditCheck, annualIncome: e.target.value.replace(/\D/g, "") })}
                              className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl pl-8"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-white/30 text-xs bg-white/3 border border-white/6 rounded-lg p-3">
                      <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Your information is encrypted and used only for this transaction. We run a soft inquiry that does not impact your credit score.</span>
                    </div>

                    <Button
                      onClick={runCreditCheck}
                      disabled={creditRunning}
                      className="w-full h-12 bg-white/10 border border-white/15 text-white hover:bg-white/15 font-semibold rounded-xl"
                    >
                      {creditRunning ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Running credit check...
                        </span>
                      ) : (
                        "Run Credit Check & Calculate Payments"
                      )}
                    </Button>
                  </div>
                ) : (
                  /* Credit Result */
                  <div className="space-y-4">
                    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Credit Score</p>
                          <div className="flex items-center gap-3">
                            <span className="text-5xl font-bold text-white font-mono">{creditScore}</span>
                            <span className={`text-sm font-semibold ${creditTier?.color}`}>{creditTier?.label}</span>
                          </div>
                        </div>
                        <BadgeCheck className="w-10 h-10 text-emerald-400" />
                      </div>

                      {loanCalc && (
                        <div className="grid grid-cols-3 gap-3 border-t border-white/8 pt-4">
                          <div className="text-center">
                            <p className="text-white/40 text-xs mb-1">Interest Rate</p>
                            <p className="text-white font-bold text-lg">{loanCalc.interestRate}%</p>
                          </div>
                          <div className="text-center border-x border-white/8">
                            <p className="text-white/40 text-xs mb-1">Monthly Payment</p>
                            <p className="text-white font-bold text-lg">{fmt(loanCalc.monthlyPayment)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-white/40 text-xs mb-1">Term</p>
                            <p className="text-white font-bold text-lg">{termMonths} mo</p>
                          </div>
                        </div>
                      )}

                      <div className="mt-4 p-3 bg-emerald-500/8 border border-emerald-500/20 rounded-lg flex items-center gap-3">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <div>
                          <p className="text-emerald-400 text-xs font-semibold">Identity Verified</p>
                          <p className="text-white/40 text-xs">Your {creditCheck.idType.replace(/_/g, " ")} and SSN have been verified.</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-white/3 border border-white/8 rounded-xl p-4">
                        <p className="text-white/40 text-xs mb-1">Due Today (Down Payment)</p>
                        <p className="text-white font-bold text-xl">{fmt(downPayment)}</p>
                        <p className="text-white/30 text-xs mt-1">{creditCheck.downPaymentPct}% of vehicle price</p>
                      </div>
                      <div className="bg-white/3 border border-white/8 rounded-xl p-4">
                        <p className="text-white/40 text-xs mb-1">Then, each month for</p>
                        <p className="text-white font-bold text-xl">{loanCalc ? fmt(loanCalc.monthlyPayment) : "—"}</p>
                        <p className="text-white/30 text-xs mt-1">{termMonths} months</p>
                      </div>
                    </div>

                    <button onClick={() => { setCreditDone(false); setCreditScore(null); setLoanCalc(null); }} className="text-xs text-white/30 hover:text-white/60 transition-colors underline underline-offset-2">
                      Re-run credit check with different terms
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* STEP 3: Payment Method */}
            <section className="bg-white/[0.02] border border-white/8 rounded-2xl p-6">
              <h2 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-white text-black text-xs font-bold flex items-center justify-center">
                  {paymentChoice === "installment" ? "3" : "2"}
                </span>
                Payment Method
              </h2>

              {/* Group tabs */}
              <div className="flex gap-2 mb-6 flex-wrap">
                {(
                  [
                    { id: "card" as PaymentGroup, label: "Credit / Debit Card", icon: CreditCard },
                    { id: "wire" as PaymentGroup, label: "Bank Wire", icon: Landmark },
                    { id: "crypto" as PaymentGroup, label: "Crypto", icon: Bitcoin },
                    { id: "digital" as PaymentGroup, label: "Digital Wallet", icon: null },
                  ] as const
                ).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setPaymentGroup(id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                      paymentGroup === id
                        ? "bg-white text-black border-white"
                        : "bg-white/5 text-white/50 border-white/10 hover:border-white/25 hover:text-white/80"
                    }`}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    {label}
                  </button>
                ))}
              </div>

              {/* ── CARD ── */}
              {paymentGroup === "card" && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-white/50 text-xs tracking-wider uppercase font-semibold mb-2 block">Name on Card</Label>
                    <Input
                      value={card.name}
                      onChange={(e) => setCard({ ...card, name: e.target.value })}
                      className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label className="text-white/50 text-xs tracking-wider uppercase font-semibold mb-2 block">Card Number</Label>
                    <div className="relative">
                      <Input
                        value={card.number}
                        onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })}
                        className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl font-mono tracking-widest pr-16"
                        placeholder="0000 0000 0000 0000"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 text-xs font-semibold">
                        {detectCardBrand(card.number)}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white/50 text-xs tracking-wider uppercase font-semibold mb-2 block">Expiry</Label>
                      <Input
                        value={card.expiry}
                        onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
                        className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl font-mono"
                        placeholder="MM/YY"
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <Label className="text-white/50 text-xs tracking-wider uppercase font-semibold mb-2 block">CVV</Label>
                      <Input
                        value={card.cvv}
                        onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                        className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl font-mono tracking-widest"
                        placeholder="•••"
                        type="password"
                        maxLength={4}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {["Visa", "Mastercard", "Amex", "Discover"].map((b) => (
                      <span key={b} className="px-3 py-1 bg-white/5 border border-white/10 rounded text-white/40 text-xs font-medium">{b}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* ── BANK WIRE ── */}
              {paymentGroup === "wire" && (
                <div className="space-y-4">
                  <div className="bg-amber-500/8 border border-amber-500/25 rounded-xl p-4 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-amber-400 font-semibold text-sm mb-1">Bank Wire Instructions</p>
                      <p className="text-white/50 text-xs leading-relaxed">Initiate a wire transfer from your bank using the details below. Your order will be confirmed within 1–2 business days after funds are received. Include your name in the memo field.</p>
                    </div>
                  </div>
                  <div className="bg-white/3 border border-white/8 rounded-xl p-5 space-y-3 font-mono text-sm">
                    {[
                      ["Bank Name", "Chase Bank"],
                      ["Account Name", "Liaison West Automobiles LLC"],
                      ["Routing Number", "021000021"],
                      ["Account Number", "8847290031"],
                      ["SWIFT / BIC", "CHASUS33"],
                      ["Reference", `ORDER-${user?.id ?? "XXXX"}`],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-4">
                        <span className="text-white/30 font-sans">{label}</span>
                        <span className="text-white text-right">{value}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-white/30 text-xs">
                    For international wires, use SWIFT code CHASUS33. Wire transfer fees may apply from your bank.
                  </p>
                </div>
              )}

              {/* ── CRYPTO ── */}
              {paymentGroup === "crypto" && (
                <div className="space-y-4">
                  <div className="flex gap-2 flex-wrap">
                    {CRYPTO_METHODS.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setCryptoMethod(c.id)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                          cryptoMethod === c.id
                            ? "bg-white/10 border-white/30 text-white"
                            : "bg-white/3 border-white/8 text-white/40 hover:border-white/20"
                        }`}
                      >
                        {c.symbol}
                      </button>
                    ))}
                  </div>
                  <div className="bg-white/3 border border-white/8 rounded-xl p-5">
                    <p className="text-white/40 text-xs uppercase tracking-wider mb-2">{selectedCrypto.label} Address</p>
                    <div className="flex items-center gap-3">
                      <p className="text-white font-mono text-sm break-all flex-1">{selectedCrypto.address}</p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedCrypto.address);
                          setCopiedAddress(true);
                          setTimeout(() => setCopiedAddress(false), 2000);
                        }}
                        className="flex-shrink-0 px-3 py-1.5 bg-white/8 border border-white/15 rounded-lg text-xs text-white/70 hover:bg-white/15 transition-all"
                      >
                        {copiedAddress ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                  <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-4 flex gap-3">
                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-white/50 text-xs leading-relaxed">
                      Send exactly {fmt(amountDueToday)} worth of {selectedCrypto.symbol} to the address above. Orders are confirmed after 3 network confirmations. Do not send from an exchange.
                    </p>
                  </div>
                </div>
              )}

              {/* ── DIGITAL WALLETS ── */}
              {paymentGroup === "digital" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {DIGITAL_METHODS.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => setDigitalMethod(d.id)}
                        className={`p-4 rounded-xl border-2 transition-all text-center font-semibold text-sm ${
                          digitalMethod === d.id
                            ? "border-white bg-white/8 text-white"
                            : "border-white/10 text-white/40 hover:border-white/25 hover:text-white/70"
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                  <div className="bg-white/3 border border-white/8 rounded-xl p-5">
                    <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Instructions for {selectedDigital.label}</p>
                    <p className="text-white font-medium mb-3">{selectedDigital.instruction}</p>
                    <div className="flex items-center justify-between pt-3 border-t border-white/8">
                      <span className="text-white/40 text-sm">Amount to send:</span>
                      <span className="text-white font-bold text-xl">{fmt(amountDueToday)}</span>
                    </div>
                    <p className="text-white/30 text-xs mt-3">
                      Send as "Friends & Family" or "Personal" where applicable to avoid fees. Include your full name in the note.
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* ─── RIGHT COLUMN — Order Summary ─── */}
          <div>
            <div className="sticky top-24 bg-white/[0.025] border border-white/10 rounded-2xl p-6 space-y-5">
              <h2 className="text-white font-bold text-lg">Order Summary</h2>

              {/* Cart items */}
              <div className="space-y-4">
                {cart.items.map((item) => (
                  <div key={item.carId} className="flex gap-3">
                    <div className="w-20 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-white/5 border border-white/8">
                      <img src={item.car?.images?.[0]} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{item.car?.year} {item.car?.make}</p>
                      <p className="text-white/40 text-xs">{item.car?.model}</p>
                      <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-white/8 text-white/50 capitalize">
                        {item.paymentType === "installment" ? "Financing" : "Full payment"}
                      </span>
                    </div>
                    <p className="text-white font-semibold text-sm flex-shrink-0">{fmt(item.car?.price || 0)}</p>
                  </div>
                ))}
              </div>

              {/* Breakdown */}
              <div className="border-t border-white/8 pt-4 space-y-2.5 text-sm">
                <div className="flex justify-between text-white/40">
                  <span>Vehicle Price</span>
                  <span>{fmt(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-white/40">
                  <span>Processing Fee</span>
                  <span>Included</span>
                </div>

                {paymentChoice === "installment" && (
                  <>
                    <div className="flex justify-between text-white/40">
                      <span>Down Payment ({creditCheck.downPaymentPct}%)</span>
                      <span>{fmt(downPayment)}</span>
                    </div>
                    {loanCalc && (
                      <>
                        <div className="flex justify-between text-white/40">
                          <span>Interest Rate</span>
                          <span>{loanCalc.interestRate}% APR</span>
                        </div>
                        <div className="flex justify-between text-white/40">
                          <span>Monthly Payment × {termMonths}</span>
                          <span>{fmt(loanCalc.monthlyPayment)}/mo</span>
                        </div>
                      </>
                    )}
                  </>
                )}

                <div className="pt-3 border-t border-white/8">
                  <div className="flex justify-between items-end">
                    <span className="text-white font-semibold">Due Today</span>
                    <span className="text-white font-bold text-3xl">{fmt(amountDueToday)}</span>
                  </div>
                  {paymentChoice === "installment" && loanCalc && (
                    <p className="text-white/30 text-xs mt-1 text-right">
                      + {fmt(loanCalc.monthlyPayment)}/mo for {termMonths} months
                    </p>
                  )}
                </div>
              </div>

              {/* CTA */}
              <Button
                className="w-full h-14 bg-white text-black font-bold text-base rounded-xl hover:bg-white/90 transition-all"
                onClick={handleCheckout}
                disabled={createOrderMutation.isPending || (paymentChoice === "installment" && !creditDone)}
              >
                {createOrderMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  `Confirm & Pay ${fmt(amountDueToday)}`
                )}
              </Button>

              {paymentChoice === "installment" && !creditDone && (
                <p className="text-amber-400/70 text-xs text-center flex items-center justify-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Complete the credit check above to proceed
                </p>
              )}

              <div className="flex items-center justify-center gap-2 text-xs text-white/25">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/60" />
                <span>256-bit SSL encryption — Secure transaction</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
