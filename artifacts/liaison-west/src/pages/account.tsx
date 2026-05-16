import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useGetMe, useGetMyOrders, useGetMyLoans, useUpdateUserLocation, getGetMeQueryKey, getGetMyOrdersQueryKey, getGetMyLoansQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, ShieldCheck, Clock, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function Account() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const { data: userData } = useGetMe({
    query: {
      enabled: !!user,
      queryKey: getGetMeQueryKey(),
    }
  });

  const { data: orders } = useGetMyOrders({
    query: {
      enabled: !!user,
      queryKey: getGetMyOrdersQueryKey(),
    }
  });

  const { data: loans } = useGetMyLoans({
    query: {
      enabled: !!user,
      queryKey: getGetMyLoansQueryKey(),
    }
  });

  const updateLocationMutation = useUpdateUserLocation({
    mutation: {
      onSuccess: () => {
        toast.success("Location updated successfully");
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to update location");
      },
      onSettled: () => {
        setIsDetectingLocation(false);
      }
    }
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
            data: {
              latitude,
              longitude,
              city: data.address.city || data.address.town || data.address.village,
              state: data.address.state,
              country: data.address.country,
            }
          });
        } catch (error) {
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

  return (
    <Layout>
      <div className="bg-black py-12 border-b border-white/5">
        <div className="container px-4 md:px-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center text-3xl font-serif text-white border border-white/20">
              {userData?.name[0] || 'U'}
            </div>
            <div>
              <h1 className="text-3xl font-serif font-bold text-white mb-2">{userData?.name}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{userData?.email}</span>
                {userData?.phone && <span>• {userData?.phone}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar - Profile Info */}
          <div className="space-y-6">
            <Card className="bg-card border-white/10">
              <CardHeader>
                <CardTitle className="text-lg">Location</CardTitle>
              </CardHeader>
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
                      variant="outline" 
                      size="sm" 
                      onClick={detectLocation}
                      disabled={isDetectingLocation}
                      className="border-white/10"
                    >
                      {isDetectingLocation ? "Detecting..." : (userData?.city ? "Update Location" : "Detect Location")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-white/10">
              <CardHeader>
                <CardTitle className="text-lg">Verification Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Email</span>
                  {userData?.emailVerified ? 
                    <Badge className="bg-green-500/20 text-green-500 border-none"><CheckCircle2 className="w-3 h-3 mr-1"/> Verified</Badge> : 
                    <Badge variant="outline" className="border-yellow-500/50 text-yellow-500"><AlertCircle className="w-3 h-3 mr-1"/> Pending</Badge>}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Identity (ID)</span>
                  {userData?.idVerified ? 
                    <Badge className="bg-green-500/20 text-green-500 border-none"><CheckCircle2 className="w-3 h-3 mr-1"/> Verified</Badge> : 
                    <Badge variant="outline" className="border-yellow-500/50 text-yellow-500"><AlertCircle className="w-3 h-3 mr-1"/> Pending</Badge>}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Overall Status</span>
                  <Badge variant="secondary" className="bg-white/10 uppercase tracking-wider text-[10px]">{userData?.verificationStatus}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Orders & Loans */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="text-2xl font-serif font-bold text-white mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" /> Acquisition History
              </h2>
              {orders && orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map(order => (
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
                        <div className="font-bold text-white">${order.totalAmount.toLocaleString()}</div>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="border-white/10 capitalize">{order.paymentType}</Badge>
                          <Badge className={
                            order.status === 'completed' ? 'bg-green-500' : 
                            order.status === 'processing' ? 'bg-blue-500' : 'bg-yellow-500'
                          }>
                            {order.status}
                          </Badge>
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

            <div>
              <h2 className="text-2xl font-serif font-bold text-white mb-6 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" /> Financing Applications
              </h2>
              {loans && loans.length > 0 ? (
                <div className="space-y-4">
                  {loans.map(loan => (
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
                          loan.status === 'approved' ? 'bg-green-500' : 
                          loan.status === 'rejected' ? 'bg-red-500' : 
                          loan.status === 'under_review' ? 'bg-blue-500' : 'bg-yellow-500 text-yellow-950'
                        }>
                          {loan.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-white/10">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Loan Amount</div>
                          <div className="font-medium text-white">${loan.loanAmount.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Term</div>
                          <div className="font-medium text-white">{loan.termMonths} Months</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Rate</div>
                          <div className="font-medium text-white">{(loan.interestRate * 100).toFixed(2)}%</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Est. Monthly</div>
                          <div className="font-medium text-white">${loan.monthlyPayment.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
                  <p className="text-muted-foreground">No financing applications found.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
