import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin-layout";
import {
  useGetSiteSettings, useUpdateSiteSettings, getGetSiteSettingsQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Phone, Mail, MapPin, Clock, User, Save, Loader2, Truck, Wrench } from "lucide-react";

export default function AdminSettings() {
  const qc = useQueryClient();
  const { data: settings, isLoading } = useGetSiteSettings();

  const [form, setForm] = useState({
    conciergeName: "",
    conciergeTitle: "",
    conciergePhone: "",
    conciergeEmail: "",
    conciergeAddress: "",
    conciergeHours: "",
    supportPhone: "",
    supportEmail: "",
    shippingFee: "499",
    inspectionBookingFee: "299",
  });

  useEffect(() => {
    if (settings) setForm({
      conciergeName: settings.conciergeName,
      conciergeTitle: settings.conciergeTitle,
      conciergePhone: settings.conciergePhone,
      conciergeEmail: settings.conciergeEmail,
      conciergeAddress: settings.conciergeAddress,
      conciergeHours: settings.conciergeHours,
      supportPhone: settings.supportPhone,
      supportEmail: settings.supportEmail,
      shippingFee: String(settings.shippingFee ?? 499),
      inspectionBookingFee: String(settings.inspectionBookingFee ?? 299),
    });
  }, [settings]);

  const updateMutation = useUpdateSiteSettings({
    mutation: {
      onSuccess: () => {
        toast.success("Contact settings saved successfully");
        qc.invalidateQueries({ queryKey: getGetSiteSettingsQueryKey() });
      },
      onError: () => toast.error("Failed to save settings"),
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      data: {
        ...form,
        shippingFee: parseFloat(form.shippingFee) || 499,
        inspectionBookingFee: parseFloat(form.inspectionBookingFee) || 299,
      },
    });
  };

  const field = (
    label: string,
    key: keyof typeof form,
    placeholder: string,
    icon: React.ReactNode,
    multiline = false,
  ) => (
    <div>
      <Label className="text-white/50 text-xs uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
        {icon} {label}
      </Label>
      {multiline ? (
        <Textarea
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          placeholder={placeholder}
          className="bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl resize-none"
          rows={3}
        />
      ) : (
        <Input
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          placeholder={placeholder}
          className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl"
        />
      )}
    </div>
  );

  return (
    <AdminLayout title="Contact Settings">
      {isLoading ? (
        <div className="flex items-center justify-center py-24 text-white/30">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div className="max-w-2xl space-y-10">
          {/* Concierge Contact */}
          <section className="bg-white/[0.02] border border-white/8 rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-white font-bold text-xl">Concierge Contact</h2>
                <p className="text-white/40 text-sm mt-1">Displayed across the site and in customer communications.</p>
              </div>
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                <User className="w-5 h-5 text-white/50" />
              </div>
            </div>
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {field("Concierge Name", "conciergeName", "Jonathan Reed", <User className="w-3 h-3" />)}
                {field("Title / Role", "conciergeTitle", "Senior Concierge Specialist", <User className="w-3 h-3" />)}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {field("Phone", "conciergePhone", "+1 (310) 555-0199", <Phone className="w-3 h-3" />)}
                {field("Email", "conciergeEmail", "concierge@liaisonwest.com", <Mail className="w-3 h-3" />)}
              </div>
              {field("Office Address", "conciergeAddress", "9000 Wilshire Blvd, Suite 300, Beverly Hills, CA 90210", <MapPin className="w-3 h-3" />, true)}
              {field("Business Hours", "conciergeHours", "Mon–Sat  9:00 AM – 7:00 PM PST", <Clock className="w-3 h-3" />)}
            </div>
          </section>

          {/* Support Contact */}
          <section className="bg-white/[0.02] border border-white/8 rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-white font-bold text-xl">General Support</h2>
                <p className="text-white/40 text-sm mt-1">Used for chat support and customer service enquiries.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {field("Support Phone", "supportPhone", "+1 (310) 555-0100", <Phone className="w-3 h-3" />)}
              {field("Support Email", "supportEmail", "support@liaisonwest.com", <Mail className="w-3 h-3" />)}
            </div>
          </section>

          {/* Service Fees */}
          <section className="bg-white/[0.02] border border-white/8 rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-white font-bold text-xl">Service Fees</h2>
                <p className="text-white/40 text-sm mt-1">Fees charged to customers for delivery and inspection services.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <Label className="text-white/50 text-xs uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
                  <Truck className="w-3 h-3" /> Delivery / Shipping Fee ($)
                </Label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={form.shippingFee}
                  onChange={(e) => setForm({ ...form, shippingFee: e.target.value })}
                  placeholder="499"
                  className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl"
                />
                <p className="text-white/30 text-xs mt-1.5">Added to order total when customer selects home delivery.</p>
              </div>
              <div>
                <Label className="text-white/50 text-xs uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
                  <Wrench className="w-3 h-3" /> Standard Inspection Fee ($)
                </Label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={form.inspectionBookingFee}
                  onChange={(e) => setForm({ ...form, inspectionBookingFee: e.target.value })}
                  placeholder="299"
                  className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl"
                />
                <p className="text-white/30 text-xs mt-1.5">Base fee for standard inspection; premium is 2×.</p>
              </div>
            </div>
          </section>

          {/* Live Preview */}
          <section className="bg-white/[0.02] border border-white/8 rounded-2xl p-8">
            <h2 className="text-white font-bold text-xl mb-5">Preview</h2>
            <div className="bg-[#090909] border border-white/10 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center text-xl font-serif text-white border border-white/20">
                  {form.conciergeName[0] || "J"}
                </div>
                <div>
                  <p className="text-white font-semibold">{form.conciergeName || "Jonathan Reed"}</p>
                  <p className="text-white/40 text-sm">{form.conciergeTitle || "Senior Concierge Specialist"}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm border-t border-white/8 pt-4">
                <div className="flex items-center gap-2 text-white/50">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{form.conciergePhone || "+1 (310) 555-0199"}</span>
                </div>
                <div className="flex items-center gap-2 text-white/50">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{form.conciergeEmail || "concierge@liaisonwest.com"}</span>
                </div>
                <div className="flex items-start gap-2 text-white/50 sm:col-span-2">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span className="whitespace-pre-line">{form.conciergeAddress}</span>
                </div>
                <div className="flex items-center gap-2 text-white/50 sm:col-span-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{form.conciergeHours}</span>
                </div>
              </div>
            </div>
          </section>

          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="h-12 px-8 bg-white text-black font-bold rounded-xl hover:bg-white/90"
          >
            {updateMutation.isPending
              ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Saving...</span>
              : <span className="flex items-center gap-2"><Save className="w-4 h-4" />Save Contact Settings</span>}
          </Button>
        </div>
      )}
    </AdminLayout>
  );
}
