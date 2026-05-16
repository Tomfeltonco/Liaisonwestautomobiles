import { AdminLayout } from "@/components/admin-layout";
import {
  useGetPaymentSettings, useUpdatePaymentSettings, getGetPaymentSettingsQueryKey
} from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  CreditCard, Landmark, Bitcoin, Percent,
  CheckCircle2, XCircle, Settings2, DollarSign, Calendar, Save
} from "lucide-react";

/* ─── TYPES ─── */
const ALL_PAYMENT_METHODS = [
  { id: "visa", label: "Visa", group: "card", description: "Credit & debit cards" },
  { id: "mastercard", label: "Mastercard", group: "card", description: "Credit & debit cards" },
  { id: "amex", label: "American Express", group: "card", description: "Credit & charge cards" },
  { id: "discover", label: "Discover", group: "card", description: "Credit cards" },
  { id: "wire", label: "Bank Wire Transfer", group: "bank", description: "ACH & domestic wires" },
  { id: "paypal", label: "PayPal", group: "digital", description: "Digital wallet" },
  { id: "cashapp", label: "Cash App", group: "digital", description: "Peer-to-peer payment" },
  { id: "zelle", label: "Zelle", group: "digital", description: "Bank-to-bank transfers" },
  { id: "chime", label: "Chime", group: "digital", description: "Online bank transfer" },
  { id: "venmo", label: "Venmo", group: "digital", description: "Digital wallet" },
  { id: "bitcoin", label: "Bitcoin (BTC)", group: "crypto", description: "Cryptocurrency" },
  { id: "ethereum", label: "Ethereum (ETH)", group: "crypto", description: "Cryptocurrency" },
  { id: "usdc", label: "USD Coin (USDC)", group: "crypto", description: "Stablecoin" },
  { id: "usdt", label: "Tether (USDT)", group: "crypto", description: "Stablecoin" },
];

const GROUP_META: Record<string, { label: string; icon: typeof CreditCard; color: string }> = {
  card: { label: "Credit & Debit Cards", icon: CreditCard, color: "text-blue-400" },
  bank: { label: "Bank Transfer", icon: Landmark, color: "text-emerald-400" },
  digital: { label: "Digital Wallets", icon: DollarSign, color: "text-purple-400" },
  crypto: { label: "Cryptocurrency", icon: Bitcoin, color: "text-amber-400" },
};

const settingsSchema = z.object({
  defaultInterestRate: z.coerce.number().min(0).max(100),
  minDownPaymentPercent: z.coerce.number().min(0).max(100),
  maxLoanTermMonths: z.coerce.number().min(12).max(120),
  processingFeePercent: z.coerce.number().min(0).max(100),
  installmentEnabled: z.boolean(),
  fullPaymentEnabled: z.boolean(),
});

export default function AdminPaymentSettings() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useGetPaymentSettings();
  const [enabledMethods, setEnabledMethods] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const updateMutation = useUpdatePaymentSettings({
    mutation: {
      onSuccess: () => {
        toast.success("Payment settings saved successfully");
        queryClient.invalidateQueries({ queryKey: getGetPaymentSettingsQueryKey() });
        setSaving(false);
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.error || "Failed to save settings");
        setSaving(false);
      },
    },
  });

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      defaultInterestRate: 6.9,
      minDownPaymentPercent: 10,
      maxLoanTermMonths: 84,
      processingFeePercent: 1.5,
      installmentEnabled: true,
      fullPaymentEnabled: true,
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        defaultInterestRate: settings.defaultInterestRate,
        minDownPaymentPercent: settings.minDownPaymentPercent,
        maxLoanTermMonths: settings.maxLoanTermMonths,
        processingFeePercent: settings.processingFeePercent,
        installmentEnabled: settings.installmentEnabled,
        fullPaymentEnabled: settings.fullPaymentEnabled,
      });
      setEnabledMethods(settings.acceptedPaymentMethods ?? []);
    }
  }, [settings]);

  const toggleMethod = (id: string) => {
    setEnabledMethods((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const onSubmit = (values: z.infer<typeof settingsSchema>) => {
    setSaving(true);
    updateMutation.mutate({
      data: {
        ...values,
        acceptedPaymentMethods: enabledMethods,
      },
    });
  };

  if (isLoading) {
    return (
      <AdminLayout title="Payment Settings">
        <div className="space-y-4 max-w-4xl">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full bg-white/5 rounded-2xl" />
          ))}
        </div>
      </AdminLayout>
    );
  }

  const groups = ["card", "bank", "digital", "crypto"];

  return (
    <AdminLayout title="Payment Settings">
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-4xl space-y-6">

        {/* ── FINANCING RULES ── */}
        <div className="bg-white/[0.025] border border-white/8 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-white/8 rounded-lg flex items-center justify-center">
              <Settings2 className="w-4 h-4 text-white/60" />
            </div>
            <div>
              <h2 className="text-white font-bold">Financing Rules</h2>
              <p className="text-white/30 text-xs">Global rates applied to all loan applications and the checkout calculator</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <Label className="text-white/50 text-xs tracking-wider uppercase font-semibold mb-2 block">
                Default Interest Rate (APR %)
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  className="h-11 bg-white/5 border-white/10 text-white pr-10 rounded-xl"
                  {...form.register("defaultInterestRate")}
                />
                <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
              </div>
              <p className="text-white/25 text-xs mt-1">Applied when no credit score is provided</p>
            </div>

            <div>
              <Label className="text-white/50 text-xs tracking-wider uppercase font-semibold mb-2 block">
                Min Down Payment (%)
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  className="h-11 bg-white/5 border-white/10 text-white pr-10 rounded-xl"
                  {...form.register("minDownPaymentPercent")}
                />
                <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
              </div>
              <p className="text-white/25 text-xs mt-1">Minimum percentage of vehicle price required upfront</p>
            </div>

            <div>
              <Label className="text-white/50 text-xs tracking-wider uppercase font-semibold mb-2 block">
                Max Loan Term (Months)
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  step="12"
                  min="12"
                  max="120"
                  className="h-11 bg-white/5 border-white/10 text-white pr-10 rounded-xl"
                  {...form.register("maxLoanTermMonths")}
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
              </div>
              <p className="text-white/25 text-xs mt-1">Maximum allowed repayment duration</p>
            </div>

            <div>
              <Label className="text-white/50 text-xs tracking-wider uppercase font-semibold mb-2 block">
                Processing Fee (%)
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  className="h-11 bg-white/5 border-white/10 text-white pr-10 rounded-xl"
                  {...form.register("processingFeePercent")}
                />
                <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
              </div>
              <p className="text-white/25 text-xs mt-1">Platform transaction fee added to each purchase</p>
            </div>
          </div>
        </div>

        {/* ── CHECKOUT MODES ── */}
        <div className="bg-white/[0.025] border border-white/8 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-white/8 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-white/60" />
            </div>
            <div>
              <h2 className="text-white font-bold">Checkout Payment Modes</h2>
              <p className="text-white/30 text-xs">Control which payment modes are available to buyers at checkout</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              {
                field: "fullPaymentEnabled" as const,
                title: "Pay in Full",
                desc: "Customers can pay the complete vehicle price in one transaction.",
              },
              {
                field: "installmentEnabled" as const,
                title: "Financing / Installments",
                desc: "Customers can apply for financing and pay via monthly installments. Requires credit check.",
              },
            ].map(({ field, title, desc }) => (
              <div
                key={field}
                className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/8 rounded-xl"
              >
                <div>
                  <p className="text-white font-medium text-sm">{title}</p>
                  <p className="text-white/35 text-xs mt-0.5">{desc}</p>
                </div>
                <Switch
                  checked={form.watch(field)}
                  onCheckedChange={(v) => form.setValue(field, v)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── PAYMENT METHODS ── */}
        <div className="bg-white/[0.025] border border-white/8 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-white/8 rounded-lg flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-white/60" />
            </div>
            <div>
              <h2 className="text-white font-bold">Accepted Payment Methods</h2>
              <p className="text-white/30 text-xs">Toggle which methods appear in the checkout flow</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-6 mt-4">
            <span className="text-white/40 text-sm">
              {enabledMethods.length} of {ALL_PAYMENT_METHODS.length} methods enabled
            </span>
            <div className="flex gap-2 ml-auto">
              <button
                type="button"
                onClick={() => setEnabledMethods(ALL_PAYMENT_METHODS.map((m) => m.id))}
                className="text-xs text-white/50 hover:text-white/80 underline underline-offset-2 transition-colors"
              >
                Enable all
              </button>
              <span className="text-white/20">·</span>
              <button
                type="button"
                onClick={() => setEnabledMethods([])}
                className="text-xs text-white/50 hover:text-white/80 underline underline-offset-2 transition-colors"
              >
                Disable all
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {groups.map((group) => {
              const meta = GROUP_META[group];
              const Icon = meta.icon;
              const methods = ALL_PAYMENT_METHODS.filter((m) => m.group === group);

              return (
                <div key={group}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className={`w-4 h-4 ${meta.color}`} />
                    <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">{meta.label}</span>
                    <div className="flex-1 h-px bg-white/6 ml-2" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {methods.map((method) => {
                      const enabled = enabledMethods.includes(method.id);
                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => toggleMethod(method.id)}
                          className={`flex items-center justify-between p-3.5 rounded-xl border transition-all text-left ${
                            enabled
                              ? "bg-white/5 border-white/20"
                              : "bg-white/[0.015] border-white/6 opacity-60 hover:opacity-80"
                          }`}
                        >
                          <div>
                            <p className={`font-medium text-sm ${enabled ? "text-white" : "text-white/40"}`}>
                              {method.label}
                            </p>
                            <p className="text-white/25 text-xs">{method.description}</p>
                          </div>
                          {enabled ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-5 h-5 text-white/20 flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── SAVE ── */}
        <div className="flex items-center justify-between py-4 border-t border-white/8">
          <p className="text-white/30 text-sm">Changes take effect immediately across all checkout flows.</p>
          <Button
            type="submit"
            disabled={saving}
            className="bg-white text-black font-bold hover:bg-white/90 rounded-xl px-6 h-11 flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </form>
    </AdminLayout>
  );
}
