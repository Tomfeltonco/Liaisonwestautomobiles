import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import {
  useGetMe, useGetMyOrders, useGetMyLoans, useUpdateUserLocation,
  useGetMyInspections,
  getGetMeQueryKey, getGetMyOrdersQueryKey, getGetMyLoansQueryKey,
  getGetMyInspectionsQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MapPin, ShieldCheck, Clock, FileText, CheckCircle2, AlertCircle,
  CreditCard, ClipboardCheck, CalendarDays, Building2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";

type Inspection = {
  id: number; orderId: number; inspectorName: string; inspectorEmail: string;
  scheduledAt: string; location: string; status: string; notes: string | null;
  reportUrl: string | null; createdAt: string;
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export default function Account() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const { data: userData } = useGetMe({ query: { enabled: !!user, queryKey: getGetMeQueryKey() } });
  const { data: orders } = useGetMyOrders({ query: { enabled: !!user, queryKey: getGetMyOrdersQueryKey() } });
  const { data: loans } = useGetMyLoans({ query: { enabled: !!user, queryKey: getGetMyLoansQueryKey() } });
  const { data: inspections = [] } = useGetMyInspections({
    query: { enabled: !!user, queryKey: getGetMyInspectionsQueryKey() },
  }) as { data: Inspection[] };

  const updateLocationMutation = useUpdateUserLocation({
    mutation: {
      onSuccess: () => {
        toast.success("Location updated successfully");
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      },
      onError: (err: any) => toast.error(err.message || "Failed to update location"),
      onSettled: () => setIsDetectingLocation(false),
    },
  });

  const detectLocation = () => {
    setIsDetectingLocation(true);
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      setIsDetectingLocation(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          updateLocationMutation.mutate({
            id: user!.id,
            data: {
              latitude, longitude,
              city: data.address.city || data.address.town || data.address.village,
              state: data.address.state,
              country: data.address.country,
            }
          });
        } catch {
          toast.error("Failed to detect location details");
          setIsDetectingLocation(false);
        }
      },
      () => {
        toast.error("Unable to retrieve your location");
        setIsDetectingLocation(false);
      }
    );
  };

  if (!user) return null;

  const approvedLoans = (loans ?? []).filter((l) => l.status === "approved");

  return (
    <Layout>
      <div className="bg-black py-12 border-b border-white/5">
        <div className="container px-4 md:px-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center text-3xl font-serif text-white border border-white/20">
              {userData?.name[0] || "U"}
            </div>
            <div>
              <h1 className="text-3xl font-serif font-bold text-white mb-2">{userData?.name}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{userData?.email}</span>
                {userData?.phone && <span>• {userData.phone}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container px-4 md:px-6 py-12">
        {/* Approved Loan Payment Alert */}
        {approvedLoans.length > 0 && (
          <div className="mb-10 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-lg mb-1">
                  {approvedLoans.length === 1 ? "Loan Approved" : `${approvedLoans.length} Loans Approved"}`}
                </h3>
                <p className="text-emerald-300/80 text-sm mb-4">
                  Your financing application has been approved. Review your terms below and proceed to set up your payment schedule.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                  {approvedLoans.map((loan) => (
                    <div key={loan.id} className="grid grid-cols-2 sm:grid-cols-4 gap-4 col-span-2 sm:col-span-4">
                      {[
                        ["Loan Amount", fmt(loan.loanAmount)],
                        ["Monthly Payment", `${fmt(loan.monthlyPayment)}/mo`],
                        ["APR", `${loan.interestRate.toFixed(1)}%`],
                        ["Term", `${loan.termMonths} months`],
                      ].map(([label, val]) => (
                        <div key={label} className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                          <p className="text-emerald-400/60 text-[10px] uppercase tracking-wider mb-1">{label}</p>
                          <p className="text-white font-bold text-sm">{val}</p>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <Link href="/checkout">
                  <Button className="h-10 px-6 bg-emerald-500 text-black hover:bg-emerald-400 font-bold rounded-xl">
                    <CreditCard className="w-4 h-4 mr-2" /> Set Up Monthly Payments
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="bg-card border-white/10">
              <CardHeader><CardTitle className="text-lg">Location</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    {userData?.city && userData?.state ? (
                      <div className="font-medium text-white mb-1">
                        {userData.city}, {userData.state}
                        <div className="text-sm text-muted-foreground">{userData.country}</div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground mb-3">Location not set</div>
                    )}
                    <Button
                      variant="outline" size="sm" onClick={detectLocation}
                      disabled={isDetectingLocation} className="border-white/10"
                    >
                      {isDetectingLocation ? "Detecting..." : (userData?.city ? "Update Location" : "Detect Location")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-white/10">
              <CardHeader><CardTitle className="text-lg">Verification Status</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Email</span>
                  {userData?.emailVerified
                    ? <Badge className="bg-green-500/20 text-green-500 border-none"><CheckCircle2 className="w-3 h-3 mr-1" />Verified</Badge>
                    : <Badge variant="outline" className="border-yellow-500/50 text-yellow-500"><AlertCircle className="w-3 h-3 mr-1" />Pending</Badge>}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Identity (ID)</span>
                  {userData?.idVerified
                    ? <Badge className="bg-green-500/20 text-green-500 border-none"><CheckCircle2 className="w-3 h-3 mr-1" />Verified</Badge>
                    : <Badge variant="outline" className="border-yellow-500/50 text-yellow-500"><AlertCircle className="w-3 h-3 mr-1" />Pending</Badge>}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Overall</span>
                  <Badge variant="secondary" className="bg-white/10 uppercase tracking-wider text-[10px]">
                    {userData?.verificationStatus}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-10">
            {/* Orders */}
            <div>
              <h2 className="text-2xl font-serif font-bold text-white mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" /> Acquisition History
              </h2>
              {orders && orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                          {order.car?.images?.[0] && <img src={order.car.images[0]} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div>
                          <div className="font-medium text-white">{order.car?.year} {order.car?.make} {order.car?.model}</div>
                          <div className="text-sm text-muted-foreground">Order #{order.id} • {new Date(order.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 w-full sm:w-auto text-right">
                        <div className="font-bold text-white">{fmt(order.totalAmount)}</div>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="border-white/10 capitalize">{order.paymentType}</Badge>
                          <Badge className={
                            order.status === "completed" ? "bg-green-500" :
                            order.status === "processing" ? "bg-blue-500" : "bg-yellow-500"
                          }>{order.status}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
                  <p className="text-muted-foreground">No acquisition history found.</p>
                </div>
              )}
            </div>

            {/* Loans */}
            <div>
              <h2 className="text-2xl font-serif font-bold text-white mb-6 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" /> Financing Applications
              </h2>
              {loans && loans.length > 0 ? (
                <div className="space-y-4">
                  {loans.map((loan) => (
                    <div key={loan.id} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="font-medium text-white mb-1">
                            {loan.car?.year} {loan.car?.make} {loan.car?.model}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Application #{loan.id} • Submitted {new Date(loan.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge className={
                          loan.status === "approved" ? "bg-green-500" :
                          loan.status === "rejected" ? "bg-red-500" :
                          loan.status === "under_review" ? "bg-blue-500" : "bg-yellow-500 text-yellow-950"
                        }>{loan.status.replace("_", " ")}</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-white/10">
                        {[
                          ["Loan Amount", fmt(loan.loanAmount)],
                          ["Term", `${loan.termMonths} Months`],
                          ["APR", `${loan.interestRate.toFixed(1)}%`],
                          ["Est. Monthly", fmt(loan.monthlyPayment)],
                        ].map(([label, val]) => (
                          <div key={label}>
                            <div className="text-xs text-muted-foreground mb-1">{label}</div>
                            <div className="font-medium text-white">{val}</div>
                          </div>
                        ))}
                      </div>
                      {loan.status === "approved" && (
                        <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-emerald-400 text-sm">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="font-semibold">Congratulations — your loan is approved!</span>
                          </div>
                          <Link href="/checkout">
                            <Button size="sm" className="h-8 px-4 bg-emerald-500 text-black hover:bg-emerald-400 font-bold rounded-lg text-xs">
                              <CreditCard className="w-3.5 h-3.5 mr-1.5" /> Make Payment
                            </Button>
                          </Link>
                        </div>
                      )}
                      {loan.adminNotes && (
                        <div className="mt-3 pt-3 border-t border-white/8">
                          <p className="text-white/40 text-xs mb-1">Admin Notes</p>
                          <p className="text-white/70 text-sm">{loan.adminNotes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
                  <p className="text-muted-foreground">No financing applications found.</p>
                </div>
              )}
            </div>

            {/* Inspections */}
            {inspections.length > 0 && (
              <div>
                <h2 className="text-2xl font-serif font-bold text-white mb-6 flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-primary" /> Inspection Reports
                </h2>
                <div className="space-y-4">
                  {inspections.map((insp) => (
                    <div key={insp.id} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="font-medium text-white mb-1">Vehicle Inspection — Order #{insp.orderId}</div>
                          <div className="text-sm text-muted-foreground">Scheduled {new Date(insp.scheduledAt).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
                        </div>
                        <Badge className={
                          insp.status === "completed" ? "bg-green-500" :
                          insp.status === "in_progress" ? "bg-blue-500" : "bg-yellow-500 text-yellow-950"
                        } variant="secondary">
                          {insp.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm border-t border-white/10 pt-4">
                        <div className="flex items-start gap-2">
                          <Building2 className="w-4 h-4 text-white/30 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-white/40 text-xs mb-0.5">Inspector</div>
                            <div className="text-white">{insp.inspectorName}</div>
                            <div className="text-white/40 text-xs">{insp.inspectorEmail}</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-white/30 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-white/40 text-xs mb-0.5">Location</div>
                            <div className="text-white text-sm leading-relaxed">{insp.location}</div>
                          </div>
                        </div>
                      </div>
                      {insp.notes && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <p className="text-white/40 text-xs mb-1">Inspector Notes</p>
                          <p className="text-white/70 text-sm">{insp.notes}</p>
                        </div>
                      )}
                      {insp.reportUrl && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <a href={insp.reportUrl} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline" className="border-white/20 text-white text-xs h-8">
                              <ClipboardCheck className="w-3.5 h-3.5 mr-1.5" /> View Report
                            </Button>
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
