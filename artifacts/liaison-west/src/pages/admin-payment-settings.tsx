import { AdminLayout } from "@/components/admin-layout";
import { useGetPaymentSettings, useUpdatePaymentSettings, getGetPaymentSettingsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const settingsSchema = z.object({
  defaultInterestRate: z.coerce.number().min(0).max(1),
  minDownPaymentPercent: z.coerce.number().min(0).max(1),
  maxLoanTermMonths: z.coerce.number().min(12).max(120),
  processingFeePercent: z.coerce.number().min(0).max(1),
  installmentEnabled: z.boolean(),
  fullPaymentEnabled: z.boolean(),
});

export default function AdminPaymentSettings() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useGetPaymentSettings();

  const updateSettingsMutation = useUpdatePaymentSettings({
    mutation: {
      onSuccess: () => {
        toast.success("Payment settings updated");
        queryClient.invalidateQueries({ queryKey: getGetPaymentSettingsQueryKey() });
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to update settings");
      }
    }
  });

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      defaultInterestRate: 0.0399,
      minDownPaymentPercent: 0.1,
      maxLoanTermMonths: 84,
      processingFeePercent: 0.015,
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
    }
  }, [settings, form]);

  const onSubmit = (values: z.infer<typeof settingsSchema>) => {
    updateSettingsMutation.mutate({ data: values });
  };

  if (isLoading) {
    return (
      <AdminLayout title="Payment Settings">
        <div className="space-y-6 max-w-2xl">
          <Skeleton className="h-64 w-full bg-white/5 rounded-xl" />
          <Skeleton className="h-64 w-full bg-white/5 rounded-xl" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Payment Settings">
      <div className="max-w-2xl space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card className="bg-card border-white/5">
              <CardHeader>
                <CardTitle className="text-white">Financing Rules</CardTitle>
                <CardDescription>Configure global rates and limits for the loan calculator</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="defaultInterestRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/80">Default Interest Rate (e.g. 0.04 = 4%)</FormLabel>
                        <FormControl><Input type="number" step="0.001" className="bg-white/5 border-white/10" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="minDownPaymentPercent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/80">Min Down Payment (e.g. 0.1 = 10%)</FormLabel>
                        <FormControl><Input type="number" step="0.01" className="bg-white/5 border-white/10" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maxLoanTermMonths"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/80">Max Term (Months)</FormLabel>
                        <FormControl><Input type="number" className="bg-white/5 border-white/10" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="processingFeePercent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/80">Processing Fee % (e.g. 0.015 = 1.5%)</FormLabel>
                        <FormControl><Input type="number" step="0.001" className="bg-white/5 border-white/10" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-white/5">
              <CardHeader>
                <CardTitle className="text-white">Checkout Options</CardTitle>
                <CardDescription>Enable or disable payment methods across the platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="fullPaymentEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/10 p-4 bg-white/5">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base text-white">Pay in Full</FormLabel>
                        <div className="text-sm text-muted-foreground">Allow customers to pay the total amount during checkout.</div>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="installmentEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/10 p-4 bg-white/5">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base text-white">Financing / Installments</FormLabel>
                        <div className="text-sm text-muted-foreground">Allow customers to apply for financing during checkout.</div>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Button type="submit" disabled={updateSettingsMutation.isPending}>
              {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}
