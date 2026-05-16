import { useState } from "react";
import { AdminLayout } from "@/components/admin-layout";
import {
  useListInspectionBookings, useUpdateInspectionBooking,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ClipboardList, Loader2, CheckCircle2, Clock, XCircle, ChevronDown, ChevronUp
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    confirmed: { label: "Confirmed", cls: "bg-emerald-500/15 text-emerald-400", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    pending: { label: "Pending", cls: "bg-amber-500/15 text-amber-400", icon: <Clock className="w-3.5 h-3.5" /> },
    completed: { label: "Completed", cls: "bg-blue-500/15 text-blue-400", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    cancelled: { label: "Cancelled", cls: "bg-red-500/15 text-red-400", icon: <XCircle className="w-3.5 h-3.5" /> },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.cls}`}>
      {s.icon}{s.label}
    </span>
  );
}

type Booking = {
  id: number; userId: number; preferredDate: string; preferredTime: string;
  inspectionType: string; fee: number; status: string; paymentStatus: string;
  transactionId?: string | null; cardLast4?: string | null; notes?: string | null;
  createdAt: string;
};

function BookingRow({ booking }: { booking: Booking }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(booking.notes ?? "");

  const mutation = useUpdateInspectionBooking({
    mutation: {
      onSuccess: () => {
        toast.success("Booking updated");
        qc.invalidateQueries();
      },
      onError: () => toast.error("Failed to update booking"),
    },
  });

  const setStatus = (status: string) => {
    mutation.mutate({ id: booking.id, data: { status, notes: notes || undefined } });
  };

  return (
    <div className="bg-white/[0.02] border border-white/8 rounded-2xl overflow-hidden">
      <div
        className="p-5 cursor-pointer hover:bg-white/[0.01] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <StatusBadge status={booking.status} />
              <span className="text-white/30 text-xs">#{booking.id}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                booking.paymentStatus === "paid" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
              }`}>{booking.paymentStatus === "paid" ? "Paid" : "Unpaid"}</span>
            </div>
            <p className="text-white font-semibold capitalize">{booking.inspectionType} Inspection</p>
            <p className="text-white/40 text-sm">User #{booking.userId} · {booking.preferredDate} at {booking.preferredTime}</p>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm flex-shrink-0">
            <div className="text-center">
              <p className="text-white/40 text-xs mb-0.5">Fee</p>
              <p className="text-white font-bold">{fmt(booking.fee)}</p>
            </div>
            <div className="text-center">
              <p className="text-white/40 text-xs mb-0.5">Booked</p>
              <p className="text-white/70">{new Date(booking.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {expanded ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/8 p-5 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {[
              ["Transaction ID", booking.transactionId ?? "—"],
              ["Card Last 4", booking.cardLast4 ? `•••• ${booking.cardLast4}` : "—"],
              ["User ID", `#${booking.userId}`],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-white/40 text-xs mb-1">{label}</p>
                <p className="text-white font-mono">{value}</p>
              </div>
            ))}
          </div>

          {booking.notes && (
            <div>
              <p className="text-white/40 text-xs mb-1">Customer Notes</p>
              <p className="text-white/70 text-sm">{booking.notes}</p>
            </div>
          )}

          <div>
            <p className="text-white/40 text-xs mb-2">Internal Notes</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Add internal notes..."
              className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 rounded-xl p-3 text-sm focus:outline-none resize-none"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {["confirmed", "completed", "cancelled"].map((s) => (
              <Button
                key={s}
                size="sm"
                variant={booking.status === s ? "default" : "outline"}
                disabled={mutation.isPending}
                onClick={() => setStatus(s)}
                className={`capitalize h-8 px-3 text-xs ${
                  booking.status === s
                    ? "bg-white text-black"
                    : "border-white/15 text-white/50 hover:text-white"
                }`}
              >
                {mutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : `Mark ${s}`}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminInspectionBookings() {
  const [filter, setFilter] = useState("all");
  const { data: bookings, isLoading } = useListInspectionBookings() as {
    data: Booking[] | undefined; isLoading: boolean;
  };

  const filtered = (bookings ?? []).filter((b) =>
    filter === "all" ? true : b.status === filter
  );

  const stats = [
    { label: "Confirmed", count: (bookings ?? []).filter(b => b.status === "confirmed").length, color: "text-emerald-400" },
    { label: "Pending", count: (bookings ?? []).filter(b => b.status === "pending").length, color: "text-amber-400" },
    { label: "Completed", count: (bookings ?? []).filter(b => b.status === "completed").length, color: "text-blue-400" },
    { label: "Revenue", count: fmt((bookings ?? []).filter(b => b.paymentStatus === "paid").reduce((s, b) => s + b.fee, 0)), color: "text-white" },
  ];

  return (
    <AdminLayout title="Inspection Bookings">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white/[0.02] border border-white/8 rounded-xl p-4">
            <p className="text-white/40 text-xs mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        {["all", "pending", "confirmed", "completed", "cancelled"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${
              filter === f
                ? "bg-white text-black"
                : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-white/10"
            }`}
          >
            {f === "all" ? "All" : f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24 text-white/30">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24">
          <ClipboardList className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/40">No inspection bookings yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => <BookingRow key={b.id} booking={b} />)}
        </div>
      )}
    </AdminLayout>
  );
}
