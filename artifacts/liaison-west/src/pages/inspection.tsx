import { useState } from "react";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import {
  useCreateInspectionBooking, useGetMyInspectionBookings,
  useGetPublicSiteSettings,
  getGetMyInspectionBookingsQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  CheckCircle2, ClipboardList, ShieldCheck, Wrench, Star,
  Calendar, Clock, CreditCard, Loader2, ChevronRight, Lock, BadgeCheck
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

const TIME_SLOTS = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM",
  "4:00 PM", "4:30 PM",
];

const INSPECTION_TYPES = [
  {
    id: "standard",
    label: "Standard Inspection",
    description: "150-point comprehensive vehicle inspection by certified technicians.",
    multiplier: 1,
    duration: "2–3 hours",
    icon: <Wrench className="w-6 h-6" />,
  },
  {
    id: "premium",
    label: "Premium Inspection",
    description: "300-point deep-dive with paint meter, ADAS calibration check, and full written report.",
    multiplier: 2,
    duration: "4–5 hours",
    icon: <Star className="w-6 h-6" />,
  },
];

export default function Inspection() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: settings } = useGetPublicSiteSettings({ query: { queryKey: ["public-site-settings"] } });
  const baseFee = settings?.inspectionBookingFee ?? 299;

  const [step, setStep] = useState<"form" | "payment" | "done">("form");
  const [inspectionType, setInspectionType] = useState("standard");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [notes, setNotes] = useState("");
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvv: "" });
  const [bookingResult, setBookingResult] = useState<{ transactionId: string | null; fee: number } | null>(null);

  const selectedType = INSPECTION_TYPES.find((t) => t.id === inspectionType)!;
  const fee = baseFee * selectedType.multiplier;

  const { data: myBookings, isLoading: bookingsLoading } = useGetMyInspectionBookings({
    query: { queryKey: getGetMyInspectionBookingsQueryKey(), enabled: !!user },
  });

  const createMutation = useCreateInspectionBooking({
    mutation: {
      onSuccess: (data) => {
        setBookingResult({ transactionId: data.transactionId ?? null, fee: data.fee });
        setStep("done");
        qc.invalidateQueries();
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.error || "Booking failed. Please try again.");
      },
    },
  });

  const handleBooking = () => {
    if (!user) { toast.error("Please sign in to book an inspection."); return; }
    if (!preferredDate) { toast.error("Please select a date."); return; }
    if (!preferredTime) { toast.error("Please select a time slot."); return; }
    if (!card.number || !card.name) { toast.error("Please enter your card details."); return; }

    createMutation.mutate({
      data: {
        preferredDate,
        preferredTime,
        inspectionType,
        notes: notes || undefined,
        cardLast4: card.number.replace(/\s/g, "").slice(-4),
      },
    });
  };

  // Min date = tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  if (step === "done" && bookingResult) {
    return (
      <Layout>
        <div className="container py-32 max-w-lg mx-auto text-center">
          <div className="relative mx-auto w-24 h-24 mb-8">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
            <div className="relative w-24 h-24 bg-emerald-500/15 border border-emerald-500/30 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            </div>
          </div>
          <h1 className="text-4xl font-serif font-bold text-white mb-4">Inspection Booked</h1>
          <p className="text-white/50 mb-2 text-lg">
            Fee charged: <span className="text-white font-bold">{fmt(bookingResult.fee)}</span>
          </p>
          {bookingResult.transactionId && (
            <p className="text-white/40 text-sm mb-2">
              Ref: <span className="text-white font-mono">{bookingResult.transactionId}</span>
            </p>
          )}
          <p className="text-white/40 text-sm mb-10 leading-relaxed max-w-sm mx-auto">
            A Liaison West technician will contact you within 24 hours to confirm your appointment.
          </p>
          <Button size="lg" onClick={() => setStep("form")} className="bg-white text-black font-bold hover:bg-white/90">
            Book Another
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero */}
      <div className="bg-[#090909] py-16 border-b border-white/5">
        <div className="container px-4 md:px-6 max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-white/30 text-sm mb-3">
            <span>Services</span><ChevronRight className="w-3 h-3" /><span className="text-white">Vehicle Inspection</span>
          </div>
          <h1 className="text-5xl font-serif font-bold text-white mb-4">Book an Inspection</h1>
          <p className="text-white/50 text-lg max-w-2xl">
            Have any vehicle inspected by our ASE-certified technicians before you buy —
            or get your own car checked for peace of mind.
          </p>
        </div>
      </div>

      <div className="container px-4 md:px-6 py-16 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">

          {/* ─── LEFT ─── */}
          <div className="space-y-6">

            {step === "form" && (
              <>
                {/* Inspection Type */}
                <section className="bg-white/[0.02] border border-white/8 rounded-2xl p-6">
                  <h2 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-white text-black text-xs font-bold flex items-center justify-center">1</span>
                    Inspection Type
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {INSPECTION_TYPES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setInspectionType(t.id)}
                        className={`text-left p-5 rounded-xl border-2 transition-all ${
                          inspectionType === t.id
                            ? "border-white bg-white/5"
                            : "border-white/10 hover:border-white/25"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="text-white/60">{t.icon}</div>
                          {inspectionType === t.id && <BadgeCheck className="w-5 h-5 text-emerald-400" />}
                        </div>
                        <p className="text-white font-bold mb-1">{t.label}</p>
                        <p className="text-white/40 text-xs mb-3 leading-relaxed">{t.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-white font-bold text-xl">{fmt(baseFee * t.multiplier)}</span>
                          <span className="text-white/40 text-xs">{t.duration}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>

                {/* Date & Time */}
                <section className="bg-white/[0.02] border border-white/8 rounded-2xl p-6">
                  <h2 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-white text-black text-xs font-bold flex items-center justify-center">2</span>
                    Preferred Date & Time
                  </h2>

                  <div className="mb-5">
                    <Label className="text-white/50 text-xs tracking-wider uppercase font-semibold mb-2 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" /> Date
                    </Label>
                    <Input
                      type="date"
                      min={minDate}
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="h-11 bg-white/5 border-white/10 text-white rounded-xl max-w-xs [color-scheme:dark]"
                    />
                  </div>

                  <div>
                    <Label className="text-white/50 text-xs tracking-wider uppercase font-semibold mb-3 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" /> Time Slot
                    </Label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {TIME_SLOTS.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setPreferredTime(slot)}
                          className={`py-2 px-3 rounded-lg text-sm border transition-all ${
                            preferredTime === slot
                              ? "border-white bg-white text-black font-semibold"
                              : "border-white/15 text-white/50 hover:border-white/35 hover:text-white"
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Notes */}
                <section className="bg-white/[0.02] border border-white/8 rounded-2xl p-6">
                  <h2 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-white text-black text-xs font-bold flex items-center justify-center">3</span>
                    Additional Notes <span className="text-white/30 font-normal text-sm">(optional)</span>
                  </h2>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any specific concerns, vehicle details, or questions for the inspector..."
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 rounded-xl p-4 text-sm focus:outline-none focus:border-white/30 resize-none"
                  />
                </section>

                <Button
                  onClick={() => {
                    if (!user) { toast.error("Please sign in to book."); return; }
                    if (!preferredDate || !preferredTime) {
                      toast.error("Please select a date and time slot.");
                      return;
                    }
                    setStep("payment");
                  }}
                  className="w-full h-12 bg-white text-black font-bold rounded-xl hover:bg-white/90"
                >
                  Continue to Payment
                </Button>
              </>
            )}

            {step === "payment" && (
              <>
                {/* Summary */}
                <div className="bg-white/[0.02] border border-white/8 rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <p className="text-white/40 text-xs mb-1">Booking Summary</p>
                    <p className="text-white font-semibold">{selectedType.label}</p>
                    <p className="text-white/50 text-sm">{preferredDate} at {preferredTime}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold text-2xl">{fmt(fee)}</p>
                    <button onClick={() => setStep("form")} className="text-white/40 text-xs hover:text-white underline">Edit</button>
                  </div>
                </div>

                {/* Card Payment */}
                <section className="bg-white/[0.02] border border-white/8 rounded-2xl p-6">
                  <h2 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-white/50" />
                    Payment Details
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-white/50 text-xs tracking-wider uppercase font-semibold mb-2 block">Card Number</Label>
                      <Input
                        placeholder="1234 5678 9012 3456"
                        value={card.number}
                        onChange={(e) => setCard({ ...card, number: e.target.value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim() })}
                        className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl font-mono tracking-wider"
                      />
                    </div>
                    <div>
                      <Label className="text-white/50 text-xs tracking-wider uppercase font-semibold mb-2 block">Name on Card</Label>
                      <Input
                        placeholder="John A. Smith"
                        value={card.name}
                        onChange={(e) => setCard({ ...card, name: e.target.value })}
                        className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white/50 text-xs tracking-wider uppercase font-semibold mb-2 block">Expiry</Label>
                        <Input
                          placeholder="MM/YY"
                          value={card.expiry}
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, "").slice(0, 4).replace(/^(\d{2})(\d)/, "$1/$2");
                            setCard({ ...card, expiry: v });
                          }}
                          className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl"
                        />
                      </div>
                      <div>
                        <Label className="text-white/50 text-xs tracking-wider uppercase font-semibold mb-2 block">CVV</Label>
                        <Input
                          placeholder="•••"
                          type="password"
                          maxLength={4}
                          value={card.cvv}
                          onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                          className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-white/30 text-xs bg-white/3 border border-white/6 rounded-lg p-3">
                      <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>256-bit SSL encryption. Your payment data is never stored.</span>
                    </div>
                  </div>
                </section>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep("form")}
                    className="h-12 px-6 border-white/15 text-white/60 hover:text-white"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleBooking}
                    disabled={createMutation.isPending}
                    className="flex-1 h-12 bg-white text-black font-bold rounded-xl hover:bg-white/90"
                  >
                    {createMutation.isPending
                      ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Processing...</span>
                      : `Pay ${fmt(fee)} & Confirm Booking`}
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* ─── RIGHT SIDEBAR ─── */}
          <div className="space-y-5">
            {/* Pricing card */}
            <div className="bg-white/[0.02] border border-white/8 rounded-2xl p-6">
              <h3 className="text-white font-bold mb-4">Inspection Fee</h3>
              <div className="space-y-3 text-sm">
                {INSPECTION_TYPES.map((t) => (
                  <div key={t.id} className="flex justify-between items-center">
                    <span className={`${inspectionType === t.id ? "text-white font-semibold" : "text-white/50"}`}>{t.label}</span>
                    <span className={`font-bold ${inspectionType === t.id ? "text-white" : "text-white/40"}`}>{fmt(baseFee * t.multiplier)}</span>
                  </div>
                ))}
                <div className="border-t border-white/8 pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="text-white font-semibold">Due Today</span>
                    <span className="text-white font-bold text-xl">{fmt(fee)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Guarantees */}
            <div className="bg-white/[0.02] border border-white/8 rounded-2xl p-6 space-y-4">
              <h3 className="text-white font-bold">What's Included</h3>
              {[
                ["ASE-Certified Technicians", "Experienced in all luxury and exotic makes"],
                ["Written Report", "Delivered within 24h of inspection"],
                ["No Pressure", "Fully independent — we work for you"],
                ["Money-Back Guarantee", "If we can't inspect, you get a full refund"],
              ].map(([title, desc]) => (
                <div key={title} className="flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-white text-sm font-medium">{title}</p>
                    <p className="text-white/40 text-xs">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* My Bookings */}
            {user && (
              <div className="bg-white/[0.02] border border-white/8 rounded-2xl p-6">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-white/50" />
                  My Bookings
                </h3>
                {bookingsLoading ? (
                  <div className="text-white/30 text-sm text-center py-4"><Loader2 className="w-4 h-4 animate-spin mx-auto" /></div>
                ) : !myBookings || myBookings.length === 0 ? (
                  <p className="text-white/30 text-sm text-center py-4">No bookings yet</p>
                ) : (
                  <div className="space-y-3">
                    {myBookings.slice(0, 5).map((b) => (
                      <div key={b.id} className="border border-white/8 rounded-xl p-3">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-white text-sm font-medium capitalize">{b.inspectionType}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            b.status === "confirmed" ? "bg-emerald-500/15 text-emerald-400" :
                            b.status === "completed" ? "bg-blue-500/15 text-blue-400" :
                            "bg-white/10 text-white/50"
                          }`}>{b.status}</span>
                        </div>
                        <p className="text-white/40 text-xs">{b.preferredDate} at {b.preferredTime}</p>
                        <p className="text-white/50 text-xs mt-1">{fmt(b.fee)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
