import { AdminLayout } from "@/components/admin-layout";
import { useListOrders, getListOrdersQueryKey, useUpdateOrder } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const { data: orders, isLoading } = useListOrders();

  const updateOrderMutation = useUpdateOrder({
    mutation: {
      onSuccess: () => {
        toast.success("Order updated successfully");
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to update order");
      }
    }
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
  };

  const handleStatusChange = (id: number, status: string) => {
    updateOrderMutation.mutate({ id, data: { status: status as any } });
  };

  const handlePaymentStatusChange = (id: number, paymentStatus: string) => {
    updateOrderMutation.mutate({ id, data: { paymentStatus: paymentStatus as any } });
  };

  return (
    <AdminLayout title="Manage Orders">
      <div className="bg-card border border-white/5 rounded-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-muted-foreground">Order ID</TableHead>
              <TableHead className="text-muted-foreground">User / Car</TableHead>
              <TableHead className="text-muted-foreground">Amount</TableHead>
              <TableHead className="text-muted-foreground">Type</TableHead>
              <TableHead className="text-muted-foreground">Payment Status</TableHead>
              <TableHead className="text-muted-foreground">Order Status</TableHead>
              <TableHead className="text-muted-foreground">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-white/5">
                  <TableCell><Skeleton className="h-4 w-12 bg-white/5" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-40 bg-white/5" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24 bg-white/5" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 bg-white/5" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-32 bg-white/5" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-32 bg-white/5" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24 bg-white/5" /></TableCell>
                </TableRow>
              ))
            ) : orders?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              orders?.map((order) => (
                <TableRow key={order.id} className="border-white/5 hover:bg-white/5">
                  <TableCell className="font-medium text-white">#{order.id}</TableCell>
                  <TableCell>
                    <div className="font-medium text-white text-sm">User ID: {order.userId}</div>
                    <div className="text-xs text-muted-foreground">Car ID: {order.carId}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-white font-medium">{formatPrice(order.totalAmount)}</div>
                    {order.downPayment && <div className="text-xs text-muted-foreground">{formatPrice(order.downPayment)} down</div>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-white/10 capitalize">{order.paymentType}</Badge>
                  </TableCell>
                  <TableCell>
                    <Select defaultValue={order.paymentStatus} onValueChange={(v) => handlePaymentStatusChange(order.id, v)}>
                      <SelectTrigger className="bg-transparent border-white/10 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select defaultValue={order.status} onValueChange={(v) => handleStatusChange(order.id, v)}>
                      <SelectTrigger className={`border-white/10 h-8 text-xs ${
                        order.status === 'completed' ? 'text-green-500' :
                        order.status === 'processing' ? 'text-blue-500' :
                        order.status === 'cancelled' ? 'text-red-500' : 'text-yellow-500'
                      }`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}
