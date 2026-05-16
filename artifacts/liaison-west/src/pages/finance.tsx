import { Layout } from "@/components/layout";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo, useEffect, useRef } from "react";
import {
  Calculator, ShieldCheck, Clock, Percent, ArrowRight, Zap, TrendingDown,
  Star, ChevronRight, Lock, Award, BarChart3, DollarSign, Target, CheckCircle2,
  Info, Sparkles, CarFront
} from "lucide-react";
import { useListCars, useCalculateLoan } from "@workspace/api-client-react";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const fmtFull = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

function getCreditTier(score: number) {
  if (score >= 800) return { label: "Exceptional", color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/30", apr: 3.9, badge: "bg-emerald-500" };
  if (score >= 740) return { label: "Very Good", color: "text-green-400", bg: "bg-green-400/10 border-green-400/30", apr: 4.9, badge: "bg-green-500" };
  if (score >= 670) return { label: "Good", color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/30", apr: 6.9, badge: "bg-blue-500" };
  if (score >= 580) return { label: "Fair", color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/30", apr: 9.9, badge: "bg-yellow-500" };
  return { label: "Poor", color: "text-red-400", bg: "bg-red-400/10 border-red-400/30", apr: 14.9, badge: "bg-red-500" };
}

function calcLoan(principal: number, aprPct: number, months: number) {
  const r = aprPct / 100 / 12;
  if (r === 0) return { monthly: principal / months, totalInterest: 0, totalPayment: principal };
  const monthly = (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  const totalPayment = monthly * months;
  return { monthly, totalInterest: totalPayment - principal, totalPayment };
}

function buildAmortization(principal: number, aprPct: number, months: number) {
  const r = aprPct / 100 / 12;
  const { monthly } = calcLoan(principal, aprPct, months);
  const rows: { month: number; payment: number; principal: number; interest: number; balance: number }[] = [];
  let balance = principal;
  for (let i = 1; i <= months && i <= 6; i++) {
    const interest = balance * r;
    const principalPaid = monthly - interest;
    balance -= principalPaid;
    rows.push({ month: i, payment: monthly, principal: principalPaid, interest, balance: Math.max(0, balance) });
  }
  return rows;
}

function DonutChart({ principal, interest }: { principal: number; interest: number }) {
  const total = principal + interest;
  const principalPct = total > 0 ? principal / total : 1;
  const r = 54;
  const circ = 2 * Math.PI * r;
  const stroke1 = principalPct * circ;
  const stroke2 = (1 - principalPct) * circ;
  return (
    <svg viewBox="0 0 120 120" className="w-full max-w-[200px] mx-auto drop-shadow-lg">
      <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="16" />
      <circle cx="60" cy="60" r={r} fill="none" stroke="#ffffff" strokeWidth="16"
        strokeDasharray={`${stroke1} ${stroke2}`} strokeDashoffset={circ / 4}
        strokeLinecap="round" style={{ transition: "stroke-dasharray 0.6s ease" }} />
      <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="16"
        strokeDasharray={`${stroke2} ${stroke1}`} strokeDashoffset={circ / 4 - stroke1}
        strokeLinecap="round" style={{ transition: "stroke-dasharray 0.6s ease" }} />
      <text x="60" y="54" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">MONTHLY</text>
      <text x="60" y="70" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="8">BREAKDOWN</text>
    </svg>
  );
}

function CountUp({ value, prefix = "" }: { value: number; prefix?: string }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const start = prev.current;
    const end = value;
    const duration = 500;
    const startTime = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(start + (end - start) * eased);
      if (t < 1) requestAnimationFrame(tick);
      else { setDisplay(end); prev.current = end; }
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <>{prefix}{fmtFull(display)}</>;
}

const TERMS = [24, 36, 48, 60, 72, 84];

export default function Finance() {
  const [vehiclePrice, setVehiclePrice] = useState(95000);
  const [downPayment, setDownPayment] = useState(20000);
  const [termMonths, setTermMonths] = useState(60);
  const [creditScore, setCreditScore] = useState(750);
  const [selectedCarId, setSelectedCarId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"calculator" | "compare" | "schedule">("calculator");

  const { data: carsData } = useListCars({ limit: 50 });

  const tier = getCreditTier(creditScore);
  const principal = Math.max(0, vehiclePrice - downPayment);
  const loanData = useMemo(() => calcLoan(principal, tier.apr, termMonths), [principal, tier.apr, termMonths]);
  const amortization = useMemo(() => buildAmortization(principal, tier.apr, termMonths), [principal, tier.apr, termMonths]);

  const selectedCar = carsData?.cars.find(c => c.id === selectedCarId);

  useEffect(() => {
    if (selectedCar) {
      setVehiclePrice(selectedCar.price);
      setDownPayment(Math.round(selectedCar.price * 0.2));
    }
  }, [selectedCarId]);

  const downPct = vehiclePrice > 0 ? Math.round((downPayment / vehiclePrice) * 100) : 0;

  return (
    <Layout>
      {/* ─── HERO ─── */}
      <section className="relative bg-black overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,255,255,0.07),transparent)]" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="container px-4 md:px-6 py-24 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-muted-foreground mb-8">
              <Sparkles className="w-3.5 h-3.5 text-white" />
              AI-Powered Financing Engine
            </div>
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 leading-[1.05]">
              Your Terms.<br />
              <span className="text-white/40">Your Vehicle.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
              Real-time financing calculations, instant credit assessment, and
              zero-surprise loan structures tailored to your financial profile.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/finance/apply">
                <Button size="lg" className="rounded-full px-8 h-12 text-base bg-white text-black hover:bg-white/90">
                  Apply Now <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="rounded-full px-8 h-12 text-base border-white/20 hover:bg-white/5"
                onClick={() => document.getElementById("calculator")?.scrollIntoView({ behavior: "smooth" })}>
                Calculate Payment
              </Button>
            </div>
          </div>
        </div>
        {/* Stats bar */}
        <div className="border-t border-white/5 bg-white/[0.02]">
          <div className="container px-4 md:px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { val: "3.9%", label: "Starting APR" },
              { val: "60s", label: "Avg. Decision Time" },
              { val: "84mo", label: "Max Term Available" },
              { val: "$0", label: "Prepayment Penalty" },
            ].map(s => (
              <div key={s.label}>
                <div className="text-2xl font-bold text-white">{s.val}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── VEHICLE PICKER ─── */}
      <section className="bg-black border-b border-white/5 py-16">
        <div className="container px-4 md:px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-serif font-bold text-white">Finance Any Vehicle</h2>
              <p className="text-muted-foreground text-sm mt-1">Select a vehicle below or enter a custom price in the calculator</p>
            </div>
            <Link href="/inventory">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white">
                Full Inventory <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {carsData?.cars.slice(0, 10).map(car => (
              <button
                key={car.id}
                onClick={() => setSelectedCarId(car.id === selectedCarId ? null : car.id)}
                className={`group relative rounded-xl overflow-hidden border text-left transition-all duration-200 ${
                  selectedCarId === car.id
                    ? "border-white ring-1 ring-white"
                    : "border-white/10 hover:border-white/30"
                }`}
              >
                <div className="aspect-[4/3] bg-white/5 overflow-hidden">
                  {car.images?.[0] ? (
                    <img src={car.images[0]} alt={`${car.make} ${car.model}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <CarFront className="w-8 h-8 text-white/20" />
                    </div>
                  )}
                  {selectedCarId === car.id && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-black" />
                    </div>
                  )}
                </div>
                <div className="p-3 bg-card">
                  <div className="text-xs text-muted-foreground">{car.year}</div>
                  <div className="text-sm font-medium text-white truncate">{car.make} {car.model}</div>
                  <div className="text-sm font-bold text-white mt-1">{fmt(car.price)}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── MAIN CALCULATOR ─── */}
      <section id="calculator" className="bg-black py-20">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-12 items-start">

            {/* LEFT — Controls */}
            <div className="space-y-10">
              <div>
                <h2 className="text-3xl font-serif font-bold text-white mb-2">Payment Calculator</h2>
                <p className="text-muted-foreground">Adjust the sliders to see your payment update in real time.</p>
              </div>

              {/* Vehicle Price */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="text-sm font-medium text-white/70 uppercase tracking-widest">Vehicle Price</label>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white">{fmt(vehiclePrice)}</div>
                    {selectedCar && <div className="text-xs text-muted-foreground">{selectedCar.year} {selectedCar.make} {selectedCar.model}</div>}
                  </div>
                </div>
                <Slider value={[vehiclePrice]} min={15000} max={350000} step={1000}
                  onValueChange={v => { setVehiclePrice(v[0]); if (selectedCarId) setSelectedCarId(null); }} className="py-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>$15k</span><span>$350k</span>
                </div>
              </div>

              {/* Down Payment */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="text-sm font-medium text-white/70 uppercase tracking-widest">Down Payment</label>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white">{fmt(downPayment)}</div>
                    <div className="text-xs text-muted-foreground">{downPct}% of price</div>
                  </div>
                </div>
                <Slider value={[downPayment]} min={0} max={vehiclePrice * 0.8} step={500}
                  onValueChange={v => setDownPayment(v[0])} className="py-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>$0</span><span>{fmt(vehiclePrice * 0.8)}</span>
                </div>
              </div>

              {/* Term */}
              <div className="space-y-4">
                <label className="text-sm font-medium text-white/70 uppercase tracking-widest block">Loan Term</label>
                <div className="grid grid-cols-6 gap-2">
                  {TERMS.map(t => (
                    <button key={t}
                      onClick={() => setTermMonths(t)}
                      className={`py-3 rounded-xl text-sm font-medium border transition-all ${
                        termMonths === t
                          ? "bg-white text-black border-white"
                          : "bg-white/5 text-muted-foreground border-white/10 hover:border-white/30 hover:text-white"
                      }`}
                    >
                      {t}<span className="text-[10px] block leading-tight opacity-60">mo</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Credit Score */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="text-sm font-medium text-white/70 uppercase tracking-widest">Credit Score</label>
                  <div className="text-right">
                    <div className={`text-3xl font-bold ${tier.color}`}>{creditScore}</div>
                    <div className={`text-xs font-medium ${tier.color}`}>{tier.label}</div>
                  </div>
                </div>
                <Slider value={[creditScore]} min={500} max={850} step={10}
                  onValueChange={v => setCreditScore(v[0])} className="py-2" />
                {/* Score tiers */}
                <div className="grid grid-cols-5 gap-1 text-[10px] text-center">
                  {[
                    { range: "500–579", label: "Poor", color: "bg-red-500" },
                    { range: "580–669", label: "Fair", color: "bg-yellow-500" },
                    { range: "670–739", label: "Good", color: "bg-blue-500" },
                    { range: "740–799", label: "Very Good", color: "bg-green-500" },
                    { range: "800–850", label: "Exceptional", color: "bg-emerald-500" },
                  ].map(t => (
                    <div key={t.label}>
                      <div className={`h-1.5 rounded-full mb-1 ${t.color} opacity-70`} />
                      <div className="text-muted-foreground leading-tight hidden sm:block">{t.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* APR Banner */}
              <div className={`rounded-2xl border p-4 flex items-center gap-4 ${tier.bg}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${tier.color} bg-white/5`}>
                  {tier.apr}%
                </div>
                <div>
                  <div className={`text-sm font-semibold ${tier.color}`}>Your Estimated APR: {tier.apr}%</div>
                  <div className="text-xs text-muted-foreground">Based on your {tier.label} ({creditScore}) credit tier. Final rate determined at application.</div>
                </div>
              </div>
            </div>

            {/* RIGHT — Live Results */}
            <div className="sticky top-6 space-y-4">
              {/* Monthly payment card */}
              <div className="bg-card border border-white/10 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />

                <DonutChart principal={principal} interest={loanData.totalInterest} />

                <div className="text-center mt-6 mb-8">
                  <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Monthly Payment</div>
                  <div className="text-5xl font-bold text-white tabular-nums">
                    <CountUp value={loanData.monthly} prefix="$" />
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">at {tier.apr}% APR · {termMonths} months</div>
                </div>

                <div className="space-y-3">
                  {[
                    { label: "Loan Amount", value: principal, color: "bg-white" },
                    { label: "Total Interest", value: loanData.totalInterest, color: "bg-white/30" },
                  ].map(row => (
                    <div key={row.label} className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${row.color} flex-shrink-0`} />
                      <span className="text-sm text-muted-foreground flex-1">{row.label}</span>
                      <span className="text-sm font-medium text-white">{fmt(row.value)}</span>
                    </div>
                  ))}
                  <div className="border-t border-white/10 pt-3 flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Cost of Loan</span>
                    <span className="text-sm font-bold text-white">{fmt(loanData.totalPayment)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Due Today (Down)</span>
                    <span className="text-sm font-bold text-white">{fmt(downPayment)}</span>
                  </div>
                </div>

                <Link href={`/finance/apply?amount=${Math.round(principal)}&term=${termMonths}&down=${Math.round(downPayment)}${selectedCarId ? `&carId=${selectedCarId}` : ""}`}>
                  <Button className="w-full mt-6 h-12 text-base bg-white text-black hover:bg-white/90 rounded-xl">
                    Apply With These Terms <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <p className="text-center text-xs text-muted-foreground mt-3">No hard credit pull until final approval</p>
              </div>

              {/* Market comparison */}
              <div className="bg-card border border-white/10 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-white">vs. Market Average</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Industry Avg APR</span>
                    <span className="text-red-400 line-through">{(tier.apr + 3.1).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Liaison West APR</span>
                    <span className="text-emerald-400 font-bold">{tier.apr}%</span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-2 mt-2">
                    <span className="text-muted-foreground">You Save</span>
                    <span className="text-emerald-400 font-bold">{fmt(calcLoan(principal, tier.apr + 3.1, termMonths).totalInterest - loanData.totalInterest)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── TABS: Amortization / Plan Comparison ─── */}
          <div className="mt-20">
            <div className="flex gap-2 mb-8 border-b border-white/10">
              {([["schedule", "Amortization Preview"], ["compare", "Plan Comparison"]] as const).map(([id, label]) => (
                <button key={id} onClick={() => setActiveTab(id as any)}
                  className={`pb-4 px-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === id ? "border-white text-white" : "border-transparent text-muted-foreground hover:text-white"
                  }`}>
                  {label}
                </button>
              ))}
            </div>

            {activeTab === "schedule" && (
              <div className="animate-in fade-in duration-300">
                <p className="text-muted-foreground text-sm mb-6">First 6 months of your payment schedule</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        {["Month", "Payment", "Principal", "Interest", "Balance"].map(h => (
                          <th key={h} className="text-left pb-3 text-muted-foreground font-medium pr-6">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {amortization.map(row => (
                        <tr key={row.month} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          <td className="py-4 pr-6 text-muted-foreground">Month {row.month}</td>
                          <td className="py-4 pr-6 font-medium text-white">{fmtFull(row.payment)}</td>
                          <td className="py-4 pr-6 text-white">{fmtFull(row.principal)}</td>
                          <td className="py-4 pr-6 text-white/60">{fmtFull(row.interest)}</td>
                          <td className="py-4 pr-6 text-white">{fmt(row.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "compare" && (
              <div className="animate-in fade-in duration-300">
                <p className="text-muted-foreground text-sm mb-6">All term options at your current credit tier ({tier.apr}% APR)</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {TERMS.map(t => {
                    const d = calcLoan(principal, tier.apr, t);
                    const isSelected = t === termMonths;
                    return (
                      <button key={t} onClick={() => setTermMonths(t)}
                        className={`rounded-2xl border p-5 text-left transition-all duration-200 ${
                          isSelected
                            ? "border-white bg-white text-black"
                            : "border-white/10 bg-card hover:border-white/30"
                        }`}>
                        <div className={`text-xs font-medium uppercase tracking-widest mb-3 ${isSelected ? "text-black/60" : "text-muted-foreground"}`}>{t} mo</div>
                        <div className={`text-2xl font-bold mb-1 ${isSelected ? "text-black" : "text-white"}`}>{fmt(d.monthly)}<span className={`text-xs font-normal ml-1 ${isSelected ? "text-black/60" : "text-muted-foreground"}`}>/mo</span></div>
                        <div className={`text-xs mt-2 ${isSelected ? "text-black/60" : "text-muted-foreground"}`}>Total interest: {fmt(d.totalInterest)}</div>
                        {isSelected && <div className="mt-2 text-xs font-medium text-black">✓ Selected</div>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── WHY FINANCE ─── */}
      <section className="bg-white/[0.02] border-y border-white/5 py-20">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-serif font-bold text-white mb-4">The Liaison West Advantage</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">We've rethought auto financing from the ground up.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <Zap className="w-5 h-5" />, title: "60-Second Decisions", desc: "Our AI underwriting engine assesses thousands of data points to give you a real decision in under a minute — no waiting days for a call back." },
              { icon: <Lock className="w-5 h-5" />, title: "Soft Pull First", desc: "We run a soft credit inquiry for pre-qualification that has zero impact on your credit score. Hard pull only at final signature." },
              { icon: <Percent className="w-5 h-5" />, title: "Rate-Match Guarantee", desc: "Bring us a competing APR from any bank or credit union. We'll match or beat it — guaranteed." },
              { icon: <BarChart3 className="w-5 h-5" />, title: "Full Transparency", desc: "Every cent of your loan is broken down before you sign. No balloon payments, no hidden origination fees, no dealer add-ons." },
              { icon: <Award className="w-5 h-5" />, title: "Flexible Structure", desc: "Choose from 24 to 84 month terms with early payoff at any time, no prepayment penalty, and optional skip-a-payment twice per year." },
              { icon: <ShieldCheck className="w-5 h-5" />, title: "Military & First Responder Rates", desc: "We offer exclusive reduced APR programs for active military, veterans, police, and firefighters." },
            ].map(f => (
              <div key={f.title} className="bg-card border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors">
                  {f.icon}
                </div>
                <h3 className="text-white font-semibold mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="bg-black py-24">
        <div className="container px-4 md:px-6 text-center">
          <h2 className="text-4xl font-serif font-bold text-white mb-4">Ready to Drive?</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-10">Complete your application in under 5 minutes. No paperwork, no dealership games.</p>
          <Link href="/finance/apply">
            <Button size="lg" className="rounded-full px-12 h-14 text-lg bg-white text-black hover:bg-white/90">
              Start Application <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground mt-6 flex items-center justify-center gap-2">
            <Lock className="w-3 h-3" /> 256-bit SSL encryption. Your data is always protected.
          </p>
        </div>
      </section>
    </Layout>
  );
}
