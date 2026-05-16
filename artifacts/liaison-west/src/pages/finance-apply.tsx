import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateLoan, useListCars } from "@workspace/api-client-react";
import { toast } from "sonner";
import { CheckCircle2, ChevronRight, Calculator, User, ShieldCheck, Mail, ArrowLeft, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function FinanceApply() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialCarId = searchParams.get("carId");
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    carId: initialCarId || "",
    loanAmount: searchParams.get("amount") || "50000",
    downPayment: searchParams.get("down") || "10000",
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
  const createLoanMutation = useCreateLoan({
    mutation: {
      onSuccess: () => {
        setStep(6);
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to submit application");
      }
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = () => {
    createLoanMutation.mutate({
      data: {
        carId: Number(formData.carId),
        loanAmount: Number(formData.loanAmount),
        downPayment: Number(formData.downPayment),
        termMonths: Number(formData.termMonths),
        employmentStatus: formData.employmentStatus,
        annualIncome: Number(formData.annualIncome),
        idType: formData.idType,
        idNumber: formData.idNumber,
        ssnLast4: formData.ssnLast4,
      }
    });
  };

  const steps = [
    { num: 1, title: "Vehicle", icon: <CheckCircle2 className="w-5 h-5" /> },
    { num: 2, title: "Terms", icon: <Calculator className="w-5 h-5" /> },
    { num: 3, title: "Personal", icon: <User className="w-5 h-5" /> },
    { num: 4, title: "Identity", icon: <ShieldCheck className="w-5 h-5" /> },
    { num: 5, title: "Verify", icon: <Mail className="w-5 h-5" /> },
  ];

  if (!user) {
    return (
      <Layout>
        <div className="container py-24 text-center">
          <h2 className="text-2xl font-serif text-white mb-4">Sign in to Apply</h2>
          <p className="text-muted-foreground mb-8">You must be logged in to apply for financing.</p>
          <Button onClick={() => setLocation("/login")}>Sign In</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-black py-12 border-b border-white/5">
        <div className="container px-4 md:px-6">
          <h1 className="text-4xl font-serif font-bold text-white mb-8">Financing Application</h1>
          
          {/* Progress Steps */}
          <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
            {steps.map((s, i) => (
              <div key={s.num} className="flex items-center gap-4">
                <div className={`flex items-center gap-2 ${step >= s.num ? "text-primary" : "text-muted-foreground"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${step >= s.num ? "border-primary bg-primary/10" : "border-white/10 bg-white/5"}`}>
                    {s.num}
                  </div>
                  <span className="hidden sm:inline">{s.title}</span>
                </div>
                {i < steps.length - 1 && <ChevronRight className="w-4 h-4 text-white/20" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container px-4 md:px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-card border border-white/10 rounded-2xl p-8 backdrop-blur-xl">
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-bold text-white">Select Vehicle</h2>
                <div className="space-y-4">
                  <Label className="text-white/80">Vehicle</Label>
                  <Select value={formData.carId} onValueChange={(v) => setFormData({...formData, carId: v})}>
                    <SelectTrigger className="bg-white/5 border-white/10 h-12">
                      <SelectValue placeholder="Select a vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {carsData?.cars.map(c => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.year} {c.make} {c.model} - ${c.price.toLocaleString()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full h-12 mt-4" disabled={!formData.carId} onClick={nextStep}>Continue <ArrowRight className="w-4 h-4 ml-2" /></Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-4 mb-6">
                  <Button variant="ghost" size="icon" onClick={prevStep}><ArrowLeft className="w-4 h-4" /></Button>
                  <h2 className="text-2xl font-bold text-white">Loan Terms</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-white/80">Loan Amount ($)</Label>
                    <Input type="number" name="loanAmount" value={formData.loanAmount} onChange={handleChange} className="bg-white/5 border-white/10 h-12" />
                  </div>
                  <div>
                    <Label className="text-white/80">Down Payment ($)</Label>
                    <Input type="number" name="downPayment" value={formData.downPayment} onChange={handleChange} className="bg-white/5 border-white/10 h-12" />
                  </div>
                  <div>
                    <Label className="text-white/80">Term (Months)</Label>
                    <Select value={formData.termMonths} onValueChange={(v) => setFormData({...formData, termMonths: v})}>
                      <SelectTrigger className="bg-white/5 border-white/10 h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[24,36,48,60,72,84].map(m => (
                          <SelectItem key={m} value={m.toString()}>{m} Months</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button className="w-full h-12 mt-4" disabled={!formData.loanAmount} onClick={nextStep}>Continue <ArrowRight className="w-4 h-4 ml-2" /></Button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-4 mb-6">
                  <Button variant="ghost" size="icon" onClick={prevStep}><ArrowLeft className="w-4 h-4" /></Button>
                  <h2 className="text-2xl font-bold text-white">Personal Information</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-white/80">Employment Status</Label>
                    <Select value={formData.employmentStatus} onValueChange={(v) => setFormData({...formData, employmentStatus: v})}>
                      <SelectTrigger className="bg-white/5 border-white/10 h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employed">Employed Full-Time</SelectItem>
                        <SelectItem value="self_employed">Self-Employed</SelectItem>
                        <SelectItem value="retired">Retired</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-white/80">Annual Income ($)</Label>
                    <Input type="number" name="annualIncome" value={formData.annualIncome} onChange={handleChange} className="bg-white/5 border-white/10 h-12" />
                  </div>
                </div>
                <Button className="w-full h-12 mt-4" disabled={!formData.annualIncome} onClick={nextStep}>Continue <ArrowRight className="w-4 h-4 ml-2" /></Button>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-4 mb-6">
                  <Button variant="ghost" size="icon" onClick={prevStep}><ArrowLeft className="w-4 h-4" /></Button>
                  <h2 className="text-2xl font-bold text-white">Identity Verification</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-white/80">ID Type</Label>
                    <Select value={formData.idType} onValueChange={(v) => setFormData({...formData, idType: v})}>
                      <SelectTrigger className="bg-white/5 border-white/10 h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="drivers_license">Driver's License</SelectItem>
                        <SelectItem value="passport">Passport</SelectItem>
                        <SelectItem value="state_id">State ID</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-white/80">ID Number</Label>
                    <Input name="idNumber" value={formData.idNumber} onChange={handleChange} className="bg-white/5 border-white/10 h-12" />
                  </div>
                  <div>
                    <Label className="text-white/80">SSN (Last 4 Digits)</Label>
                    <Input name="ssnLast4" maxLength={4} value={formData.ssnLast4} onChange={handleChange} className="bg-white/5 border-white/10 h-12" />
                  </div>
                  <div>
                    <Label className="text-white/80">Phone Number</Label>
                    <Input name="phone" value={formData.phone} onChange={handleChange} className="bg-white/5 border-white/10 h-12" />
                  </div>
                </div>
                <Button className="w-full h-12 mt-4" disabled={!formData.idNumber || !formData.ssnLast4} onClick={nextStep}>Continue <ArrowRight className="w-4 h-4 ml-2" /></Button>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-4 mb-6">
                  <Button variant="ghost" size="icon" onClick={prevStep}><ArrowLeft className="w-4 h-4" /></Button>
                  <h2 className="text-2xl font-bold text-white">Verification</h2>
                </div>
                <p className="text-muted-foreground">We've sent a 6-digit code to your email. Please enter it below to verify your identity.</p>
                <div className="space-y-4">
                  <div>
                    <Label className="text-white/80">Email Code</Label>
                    <Input name="emailCode" value={formData.emailCode} onChange={handleChange} placeholder="123456" className="bg-white/5 border-white/10 h-12 text-center text-xl tracking-[0.5em]" maxLength={6} />
                  </div>
                </div>
                <Button 
                  className="w-full h-12 mt-4" 
                  disabled={formData.emailCode.length !== 6 || createLoanMutation.isPending} 
                  onClick={handleSubmit}
                >
                  {createLoanMutation.isPending ? "Submitting..." : "Submit Application"}
                </Button>
              </div>
            )}

            {step === 6 && (
              <div className="text-center py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-3xl font-serif font-bold text-white mb-4">Application Submitted</h2>
                <p className="text-muted-foreground mb-8">
                  Your financing application has been received and is under review. Our automated underwriting system typically processes applications within 60 seconds.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button onClick={() => setLocation("/account")}>View Dashboard</Button>
                  <Button variant="outline" onClick={() => setLocation("/inventory")}>Browse Inventory</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
