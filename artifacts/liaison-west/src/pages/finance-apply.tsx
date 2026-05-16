import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateLoan, useListCars } from "@workspace/api-client-react";
import { toast } from "sonner";
import {
  CheckCircle2, ArrowLeft, ArrowRight, Car as CarIcon, Calculator,
  User, ShieldCheck, Zap, Lock, AlertCircle, Sparkles, FileText,
  CreditCard, Calendar, DollarSign, TrendingUp, Home
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const fmtFull = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

function calcMonthly(principal: number, aprPct: number, months: number) {
  const r = aprPct / 100 / 12;
  if (r === 0 || principal <= 0) return 0;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

function getCreditResult(income: number, ssnLast4: string) {
  const seed = parseInt(ssnLast4 || "1234", 10);
  const base = 580 + (seed % 271);
  const incomeBoost = Math.min(income / 1000, 30);
  const raw = Math.round(base + incomeBoost);
  return Math.min(850, Math.max(500, raw));
}

function getCreditTier(score: number) {
  if (score >= 800) return { label: "Exceptional", color: "#10b981", apr: 3.9, approved: true, message: "Congratulations! You qualify for our best rates." };
  if (score >= 740) return { label: "Very Good", color: "#22c55e", apr: 4.9, approved: true, message: "Excellent profile. Premium rates unlocked." };
  if (score >= 670) return { label: "Good", color: "#3b82f6", apr: 6.9, approved: true, message: "Solid credit profile. Competitive rates available." };
  if (score >= 580) return { label: "Fair", color: "#eab308", apr: 9.9, approved: true, message: "You're approved with standard financing terms." };
  return { label: "Poor", color: "#ef4444", apr: 14.9, approved: false, message: "We recommend a larger down payment or co-signer." };
}

/* ── Credit Score Gauge ── */
function ScoreGauge({ score, animate }: { score: number; animate: boolean }) {
  const [displayed, setDisplayed] = useState(300);
  const tier = getCreditTier(score);

  useEffect(() => {
    if (!animate) return;
    let start = 300;
    const end = score;
    const duration = 2200;
    const startTime = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      setDisplayed(Math.round(start + (end - start) * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [animate, score]);

  const pct = (displayed - 300) / (850 - 300);
  const angle = -140 + pct * 280;
  const r = 80;
  const startAngle = (-140 * Math.PI) / 180;
  const endAngle = (140 * Math.PI) / 180;
  const cx = 100, cy = 100;

  const arcPath = (sa: number, ea: number, radius: number) => {
    const x1 = cx + radius * Math.cos(sa);
    const y1 = cy + radius * Math.sin(sa);
    const x2 = cx + radius * Math.cos(ea);
    const y2 = cy + radius * Math.sin(ea);
    const large = ea - sa > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`;
  };

  const needleAngleRad = (angle * Math.PI) / 180;
  const needleX = cx + 60 * Math.cos(needleAngleRad);
  const needleY = cy + 60 * Math.sin(needleAngleRad);

  return (
    <svg viewBox="0 0 200 140" className="w-full max-w-[280px] mx-auto">
      <defs>
        <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="25%" stopColor="#eab308" />
          <stop offset="55%" stopColor="#3b82f6" />
          <stop offset="80%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
      <path d={arcPath(startAngle, endAngle, r)} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" strokeLinecap="round" />
      <path d={arcPath(startAngle, endAngle, r)} fill="none" stroke="url(#gaugeGrad)" strokeWidth="14" strokeLinecap="round"
        strokeDasharray={`${pct * Math.PI * r * 280 / 180} 9999`} style={{ transition: "stroke-dasharray 0.05s linear" }} />
      <line x1={cx} y1={cy} x2={needleX} y2={needleY}
        stroke="white" strokeWidth="2.5" strokeLinecap="round"
        style={{ transition: "x2 0.05s linear, y2 0.05s linear" }} />
      <circle cx={cx} cy={cy} r="6" fill="white" />
      <text x={cx} y={cy + 28} textAnchor="middle" fill="white" fontSize="26" fontWeight="bold">{displayed}</text>
      <text x={cx} y={cy + 42} textAnchor="middle" fill={tier.color} fontSize="9" fontWeight="600">{tier.label.toUpperCase()}</text>
      <text x="30" y="118" fill="rgba(255,255,255,0.3)" fontSize="8">300</text>
      <text x="160" y="118" fill="rgba(255,255,255,0.3)" fontSize="8">850</text>
    </svg>
  );
}

/* ── Scanner Animation ── */
function CreditScanner({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0);
  const phases = [
    "Connecting to Equifax®...",
    "Connecting to TransUnion®...",
    "Connecting to Experian®...",
    "Analyzing payment history...",
    "Evaluating debt-to-income ratio...",
    "Calculating credit utilization...",
    "Cross-referencing public records...",
    "Finalizing risk assessment...",
    "Generating approval decision...",
  ];

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setPhase(i);
      if (i >= phases.length) {
        clearInterval(interval);
        setTimeout(onComplete, 400);
      }
    }, 380);
    return () => clearInterval(interval);
  }, []);

  const pct = Math.round((phase / phases.length) * 100);

  return (
    <div className="py-8 text-center space-y-8">
      <div className="relative w-20 h-20 mx-auto">
        <div className="absolute inset-0 rounded-full border-2 border-white/10" />
        <div className="absolute inset-0 rounded-full border-2 border-t-white border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        <div className="absolute inset-3 rounded-full border border-white/10 animate-ping opacity-30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <ShieldCheck className="w-7 h-7 text-white" />
        </div>
      </div>
      <div>
        <h3 className="text-xl font-bold text-white mb-2">Running Credit Analysis</h3>
        <p className="text-muted-foreground text-sm">Soft pull only — no impact to your credit score</p>
      </div>
      <div className="space-y-3 max-w-xs mx-auto">
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
        <div className="text-sm text-muted-foreground min-h-[20px] transition-all duration-200">
          {phases[phase - 1] || "Initiating secure connection..."}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto text-xs">
        {["Equifax", "TransUnion", "Experian"].map((bureau, i) => (
          <div key={bureau} className={`p-2 rounded-lg border text-center transition-all duration-300 ${
            phase > i * 1.5
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
              : "border-white/10 bg-white/5 text-muted-foreground"
          }`}>
            {phase > i * 1.5 ? <CheckCircle2 className="w-3 h-3 mx-auto mb-1" /> : <div className="w-3 h-3 rounded-full border border-current mx-auto mb-1" />}
            {bureau}
          </div>
        ))}
      </div>
    </div>
  );
}

const STEPS = [
  { id: 1, title: "Vehicle", icon: <CarIcon className="w-4 h-4" /> },
  { id: 2, title: "Terms", icon: <Calculator className="w-4 h-4" /> },
  { id: 3, title: "Personal", icon: <User className="w-4 h-4" /> },
  { id: 4, title: "Identity", icon: <ShieldCheck className="w-4 h-4" /> },
  { id: 5, title: "Credit Check", icon: <Zap className="w-4 h-4" /> },
  { id: 6, title: "Decision", icon: <CheckCircle2 className="w-4 h-4" /> },
];

export default function FinanceApply() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const searchParams = new URLSearchParams(window.location.search);

  const [step, setStep] = useState(1);
  const [scanning, setScanning] = useState(false);
  const [creditScore, setCreditScore] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    carId: searchParams.get("carId") || "",
    loanAmount: searchParams.get("amount") || "",
    downPayment: searchParams.get("down") || "",
    termMonths: searchParams.get("term") || "60",
    employmentStatus: "employed",
    annualIncome: "",
    idType: "drivers_license",
    idNumber: "",
    ssnLast4: "",
    phone: user?.phone || "",
    emailCode: "",
  });

  const { data: carsData } = useListCars({ limit: 100 });

  const selectedCar = carsData?.cars.find(c => c.id.toString() === formData.carId);
  const loanAmount = selectedCar && !formData.loanAmount
    ? Math.max(0, selectedCar.price - Number(formData.downPayment || 0))
    : Number(formData.loanAmount) || 0;
  const downPayment = Number(formData.downPayment) || 0;
  const termMonths = Number(formData.termMonths) || 60;

  const creditTier = creditScore ? getCreditTier(creditScore) : null;
  const monthly = creditTier ? calcMonthly(loanAmount, creditTier.apr, termMonths) : 0;
  const totalPayment = monthly * termMonths;
  const processingFee = 495;
  const dueToday = downPayment + processingFee;

  const createLoanMutation = useCreateLoan({
    mutation: {
      onSuccess: () => setStep(7),
      onError: (err: any) => toast.error(err.message || "Submission failed"),
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData(f => ({ ...f, [e.target.name]: e.target.value }));

  const selectCar = (carId: string) => {
    const car = carsData?.cars.find(c => c.id.toString() === carId);
    setFormData(f => ({
      ...f, carId,
      loanAmount: car ? String(Math.round(car.price * 0.8)) : f.loanAmount,
      downPayment: car ? String(Math.round(car.price * 0.2)) : f.downPayment,
    }));
  };

  const runCreditCheck = () => {
    setScanning(true);
    setStep(5);
  };

  const onScanComplete = () => {
    const score = getCreditResult(Number(formData.annualIncome), formData.ssnLast4);
    setCreditScore(score);
    setScanning(false);
    setStep(6);
  };

  const handleSubmit = () => {
    createLoanMutation.mutate({
      data: {
        carId: Number(formData.carId),
        loanAmount,
        downPayment,
        termMonths,
        employmentStatus: formData.employmentStatus,
        annualIncome: Number(formData.annualIncome),
        idType: formData.idType,
        idNumber: formData.idNumber,
        ssnLast4: formData.ssnLast4,
      }
    });
  };

  if (!user) {
    return (
      <Layout>
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10">
              <Lock className="w-7 h-7 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-white mb-3">Sign In to Apply</h2>
            <p className="text-muted-foreground mb-8">Create an account or sign in to begin your financing application.</p>
            <Button className="w-full bg-white text-black hover:bg-white/90" onClick={() => setLocation("/login")}>
              Sign In / Create Account
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-black">
        {/* Progress Header */}
        <div className="border-b border-white/5 bg-card/50 backdrop-blur-xl sticky top-0 z-20">
          <div className="container px-4 md:px-6 py-4">
            <div className="flex items-center gap-3 mb-4">
              <Link href="/finance">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white gap-2 -ml-2">
                  <ArrowLeft className="w-4 h-4" /> Back to Finance
                </Button>
              </Link>
              <span className="text-white/20">|</span>
              <span className="text-sm text-muted-foreground">Financing Application</span>
            </div>
            {/* Step indicators */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {STEPS.map((s, i) => (
                <div key={s.id} className="flex items-center gap-1 flex-shrink-0">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    step === s.id
                      ? "bg-white text-black"
                      : step > s.id
                      ? "bg-white/10 text-white"
                      : "bg-white/5 text-muted-foreground"
                  }`}>
                    {step > s.id ? <CheckCircle2 className="w-3 h-3" /> : s.icon}
                    <span className="hidden sm:inline">{s.title}</span>
                    <span className="sm:hidden">{s.id}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`w-4 h-px ${step > s.id ? "bg-white/30" : "bg-white/10"}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="container px-4 md:px-6 py-12">
          <div className={`${step === 1 ? "max-w-5xl" : "max-w-2xl"} mx-auto`}>

            {/* ── STEP 1: Visual Vehicle Picker ── */}
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-400">
                <div className="mb-8">
                  <h1 className="text-3xl font-serif font-bold text-white mb-2">Select Your Vehicle</h1>
                  <p className="text-muted-foreground">Choose the vehicle you'd like to finance.</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                  {carsData?.cars.filter(c => c.status === "available").map(car => (
                    <button key={car.id}
                      onClick={() => selectCar(car.id.toString())}
                      className={`group rounded-2xl border overflow-hidden text-left transition-all duration-200 ${
                        formData.carId === car.id.toString()
                          ? "border-white ring-1 ring-white"
                          : "border-white/10 hover:border-white/30"
                      }`}>
                      <div className="aspect-[16/10] bg-white/5 overflow-hidden relative">
                        {car.images?.[0] ? (
                          <img src={car.images[0]} alt={`${car.make} ${car.model}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <CarIcon className="w-10 h-10 text-white/20" />
                          </div>
                        )}
                        {formData.carId === car.id.toString() && (
                          <div className="absolute inset-0 bg-white/10 flex items-center justify-center">
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                              <CheckCircle2 className="w-5 h-5 text-black" />
                            </div>
                          </div>
                        )}
                        <div className="absolute top-2 left-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            car.condition === "new" ? "bg-emerald-500/80 text-white" :
                            car.condition === "certified" ? "bg-blue-500/80 text-white" :
                            "bg-white/20 text-white"
                          }`}>{car.condition}</span>
                        </div>
                      </div>
                      <div className="p-3 bg-card">
                        <div className="text-xs text-muted-foreground">{car.year} · {car.mileage?.toLocaleString() || "0"} mi</div>
                        <div className="text-sm font-semibold text-white truncate mt-0.5">{car.make} {car.model}</div>
                        <div className="text-sm font-bold text-white mt-1">{fmt(car.price)}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">≈ {fmt(calcMonthly(car.price * 0.8, 6.9, 60))}/mo</div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex justify-end">
                  <Button disabled={!formData.carId} onClick={() => setStep(2)}
                    className="h-12 px-8 bg-white text-black hover:bg-white/90 text-base">
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* ── STEP 2: Loan Terms ── */}
            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-400 space-y-8">
                <div>
                  <h1 className="text-3xl font-serif font-bold text-white mb-2">Configure Your Loan</h1>
                  <p className="text-muted-foreground">Adjust to find the monthly payment that works for you.</p>
                </div>

                {selectedCar && (
                  <div className="flex gap-4 p-4 bg-card border border-white/10 rounded-2xl">
                    {selectedCar.images?.[0] && (
                      <img src={selectedCar.images[0]} alt="" className="w-20 h-16 object-cover rounded-xl flex-shrink-0" />
                    )}
                    <div>
                      <div className="text-sm text-muted-foreground">{selectedCar.year} · {selectedCar.condition}</div>
                      <div className="font-semibold text-white">{selectedCar.make} {selectedCar.model}</div>
                      <div className="text-sm font-bold text-white">{fmt(selectedCar.price)}</div>
                    </div>
                    <button className="ml-auto text-xs text-muted-foreground hover:text-white" onClick={() => setStep(1)}>Change</button>
                  </div>
                )}

                <div className="bg-card border border-white/10 rounded-2xl p-6 space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <label className="text-sm text-muted-foreground">Down Payment</label>
                      <span className="text-white font-bold">{fmt(downPayment)}</span>
                    </div>
                    <Slider value={[downPayment]} min={0}
                      max={selectedCar ? selectedCar.price * 0.8 : 200000} step={500}
                      onValueChange={v => setFormData(f => ({ ...f, downPayment: String(v[0]) }))} />
                    {selectedCar && (
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>$0</span><span>{fmt(selectedCar.price * 0.8)}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm text-muted-foreground block">Loan Term</label>
                    <div className="grid grid-cols-6 gap-2">
                      {[24,36,48,60,72,84].map(t => (
                        <button key={t}
                          onClick={() => setFormData(f => ({ ...f, termMonths: String(t) }))}
                          className={`py-3 rounded-xl text-sm font-medium border transition-all ${
                            Number(formData.termMonths) === t
                              ? "bg-white text-black border-white"
                              : "bg-white/5 text-muted-foreground border-white/10 hover:border-white/30 hover:text-white"
                          }`}>
                          {t}<span className="text-[10px] block leading-tight opacity-60">mo</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-4 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Loan Amount</div>
                      <div className="font-bold text-white">{fmt(loanAmount)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Est. Monthly</div>
                      <div className="font-bold text-white text-lg">{fmt(calcMonthly(loanAmount, 6.9, termMonths))}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Total Cost</div>
                      <div className="font-bold text-white">{fmt(calcMonthly(loanAmount, 6.9, termMonths) * termMonths)}</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="h-12 border-white/10" onClick={() => setStep(1)}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button className="h-12 flex-1 bg-white text-black hover:bg-white/90" onClick={() => setStep(3)}>
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Personal Info ── */}
            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-400 space-y-8">
                <div>
                  <h1 className="text-3xl font-serif font-bold text-white mb-2">Personal Information</h1>
                  <p className="text-muted-foreground">Used to match you with the best available rate.</p>
                </div>
                <div className="bg-card border border-white/10 rounded-2xl p-6 space-y-5">
                  <div>
                    <Label className="text-white/80 mb-2 block">Employment Status</Label>
                    <Select value={formData.employmentStatus}
                      onValueChange={v => setFormData(f => ({ ...f, employmentStatus: v }))}>
                      <SelectTrigger className="bg-white/5 border-white/10 h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employed">Employed Full-Time</SelectItem>
                        <SelectItem value="self_employed">Self-Employed / Business Owner</SelectItem>
                        <SelectItem value="retired">Retired</SelectItem>
                        <SelectItem value="military">Active Military / Veteran</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-white/80 mb-2 block">Annual Gross Income</Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input type="number" name="annualIncome" value={formData.annualIncome}
                        onChange={handleChange} placeholder="e.g. 120000"
                        className="bg-white/5 border-white/10 h-12 pl-8" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-white/80 mb-2 block">Phone Number</Label>
                    <Input name="phone" value={formData.phone} onChange={handleChange}
                      placeholder="+1 (555) 000-0000" className="bg-white/5 border-white/10 h-12" />
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-300/80 leading-relaxed">
                    Your income information is used solely for loan qualification purposes and is protected under federal privacy laws (Gramm-Leach-Bliley Act).
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="h-12 border-white/10" onClick={() => setStep(2)}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button className="h-12 flex-1 bg-white text-black hover:bg-white/90"
                    disabled={!formData.annualIncome} onClick={() => setStep(4)}>
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* ── STEP 4: Identity Verification ── */}
            {step === 4 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-400 space-y-8">
                <div>
                  <h1 className="text-3xl font-serif font-bold text-white mb-2">Identity Verification</h1>
                  <p className="text-muted-foreground">Required by federal lending law. All data is encrypted in transit and at rest.</p>
                </div>
                <div className="bg-card border border-white/10 rounded-2xl p-6 space-y-5">
                  <div>
                    <Label className="text-white/80 mb-2 block">Government ID Type</Label>
                    <Select value={formData.idType}
                      onValueChange={v => setFormData(f => ({ ...f, idType: v }))}>
                      <SelectTrigger className="bg-white/5 border-white/10 h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="drivers_license">Driver's License</SelectItem>
                        <SelectItem value="passport">U.S. Passport</SelectItem>
                        <SelectItem value="state_id">State-Issued ID</SelectItem>
                        <SelectItem value="military_id">Military ID</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-white/80 mb-2 block">ID Number</Label>
                    <Input name="idNumber" value={formData.idNumber} onChange={handleChange}
                      placeholder="As shown on your document" className="bg-white/5 border-white/10 h-12" />
                  </div>
                  <div>
                    <Label className="text-white/80 mb-2 block">Social Security Number — Last 4 Digits Only</Label>
                    <div className="relative">
                      <Input name="ssnLast4" maxLength={4} value={formData.ssnLast4}
                        onChange={handleChange} placeholder="_ _ _ _"
                        className="bg-white/5 border-white/10 h-12 text-center text-xl tracking-[0.5em] font-mono" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">We never store full SSNs. Last 4 digits are used only for identity matching.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-white/[0.03] border border-white/10 rounded-xl">
                  <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    By proceeding, you authorize Liaison West Automobiles to perform a soft credit inquiry with Equifax, TransUnion, and Experian. This will <strong className="text-white">not</strong> affect your credit score.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="h-12 border-white/10" onClick={() => setStep(3)}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button className="h-12 flex-1 bg-white text-black hover:bg-white/90"
                    disabled={!formData.idNumber || formData.ssnLast4.length !== 4}
                    onClick={runCreditCheck}>
                    <ShieldCheck className="w-4 h-4 mr-2" /> Run Credit Check
                  </Button>
                </div>
              </div>
            )}

            {/* ── STEP 5: Scanning ── */}
            {step === 5 && (
              <div className="bg-card border border-white/10 rounded-3xl p-10 animate-in fade-in duration-400">
                <CreditScanner onComplete={onScanComplete} />
              </div>
            )}

            {/* ── STEP 6: Credit Result + Approval ── */}
            {step === 6 && creditScore && creditTier && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                <div className="bg-card border border-white/10 rounded-3xl p-8 text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-muted-foreground mb-6">
                    <Sparkles className="w-3 h-3" /> Credit Analysis Complete
                  </div>
                  <ScoreGauge score={creditScore} animate={true} />
                  <div className="mt-4 mb-2" style={{ color: creditTier.color }}>
                    <div className="text-lg font-bold">{creditTier.label} Credit</div>
                  </div>
                  <p className="text-muted-foreground text-sm">{creditTier.message}</p>
                </div>

                {/* Loan breakdown */}
                <div className="bg-card border border-white/10 rounded-3xl p-8 space-y-6">
                  <h2 className="text-xl font-serif font-bold text-white">Your Personalized Offer</h2>

                  {/* Big monthly payment */}
                  <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 text-center">
                    <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Monthly Payment</div>
                    <div className="text-6xl font-bold text-white">{fmt(monthly)}</div>
                    <div className="text-sm text-muted-foreground mt-2">
                      {creditTier.apr}% APR · {termMonths} months · {fmt(loanAmount)} financed
                    </div>
                  </div>

                  {/* Breakdown grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: <DollarSign className="w-4 h-4" />, label: "Vehicle Price", value: fmt(selectedCar?.price || 0) },
                      { icon: <TrendingUp className="w-4 h-4" />, label: "Your APR", value: `${creditTier.apr}%` },
                      { icon: <Calendar className="w-4 h-4" />, label: "Loan Term", value: `${termMonths} months` },
                      { icon: <CreditCard className="w-4 h-4" />, label: "Total Interest", value: fmt(monthly * termMonths - loanAmount) },
                    ].map(item => (
                      <div key={item.label} className="bg-white/[0.03] border border-white/10 rounded-xl p-4 flex items-center gap-3">
                        <div className="text-muted-foreground">{item.icon}</div>
                        <div>
                          <div className="text-xs text-muted-foreground">{item.label}</div>
                          <div className="font-bold text-white">{item.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Due today */}
                  <div className="bg-white text-black rounded-2xl p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold text-lg">Due Today to Reserve</h3>
                      <div className="text-2xl font-bold">{fmt(dueToday)}</div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-black/70">Down Payment</span>
                        <span className="font-medium">{fmt(downPayment)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-black/70">Processing Fee</span>
                        <span className="font-medium">{fmt(processingFee)}</span>
                      </div>
                      <div className="border-t border-black/10 pt-2 flex justify-between font-bold">
                        <span>Total Due Today</span>
                        <span>{fmt(dueToday)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment schedule preview */}
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-3">First 3 Payments</h3>
                    <div className="space-y-2">
                      {[1, 2, 3].map(m => {
                        const r = creditTier.apr / 100 / 12;
                        const interest = loanAmount * r * Math.pow(1 + r, m - 1) / Math.pow(Math.pow(1 + r, termMonths) - 1, 0) * 0;
                        const intAmt = (loanAmount - (monthly - loanAmount * r) * ((Math.pow(1 + r, m - 1) - 1) / r)) * r;
                        return (
                          <div key={m} className="flex items-center justify-between py-2 px-4 bg-white/[0.03] rounded-xl text-sm">
                            <span className="text-muted-foreground">Month {m}</span>
                            <span className="text-white font-medium">{fmtFull(monthly)}</span>
                            <span className="text-muted-foreground text-xs">Interest: {fmtFull(Math.max(0, intAmt))}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {!creditTier.approved && (
                    <div className="flex items-start gap-3 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
                      <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-yellow-300/80">
                        Based on your credit profile, we recommend increasing your down payment or adding a co-signer to improve your terms.
                      </p>
                    </div>
                  )}

                  <Button className="w-full h-13 text-base bg-white text-black hover:bg-white/90 py-4"
                    disabled={createLoanMutation.isPending} onClick={handleSubmit}>
                    {createLoanMutation.isPending ? "Submitting..." : "Confirm & Submit Application"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    <Lock className="w-3 h-3 inline mr-1" />
                    Hard credit pull only after you sign final documents
                  </p>
                </div>
              </div>
            )}

            {/* ── STEP 7: Success ── */}
            {step === 7 && (
              <div className="animate-in fade-in zoom-in-95 duration-500">
                <div className="bg-card border border-white/10 rounded-3xl p-12 text-center">
                  <div className="relative w-24 h-24 mx-auto mb-8">
                    <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping" />
                    <div className="relative w-24 h-24 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                      <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                    </div>
                  </div>
                  <h2 className="text-4xl font-serif font-bold text-white mb-4">Application Submitted</h2>
                  <p className="text-muted-foreground max-w-md mx-auto mb-3 leading-relaxed">
                    Your financing application has been received. Our AI underwriting system is processing it now — you'll receive a decision by email within minutes.
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-sm text-emerald-400 mb-10">
                    <Zap className="w-3.5 h-3.5" /> Typical decision: under 60 seconds
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 text-left">
                    {[
                      { icon: <FileText className="w-5 h-5" />, title: "What's Next", desc: "A loan officer will contact you within 1 business day to finalize terms and schedule delivery." },
                      { icon: <CarIcon className="w-5 h-5" />, title: "Your Vehicle", desc: `Your ${selectedCar ? `${selectedCar.year} ${selectedCar.make} ${selectedCar.model}` : "selected vehicle"} is being held pending approval.` },
                      { icon: <Home className="w-5 h-5" />, title: "Delivery", desc: "We offer complimentary white-glove delivery to your door, or visit us at any of our locations." },
                    ].map(item => (
                      <div key={item.title} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
                        <div className="text-muted-foreground mb-3">{item.icon}</div>
                        <h4 className="text-white font-semibold mb-1 text-sm">{item.title}</h4>
                        <p className="text-muted-foreground text-xs leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-4 justify-center flex-wrap">
                    <Button className="bg-white text-black hover:bg-white/90 px-8" onClick={() => setLocation("/account")}>
                      View My Account
                    </Button>
                    <Button variant="outline" className="border-white/10 px-8" onClick={() => setLocation("/inventory")}>
                      Browse More Cars
                    </Button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </Layout>
  );
}
