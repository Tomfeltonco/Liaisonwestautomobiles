import { useState } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { useAuth } from "@/hooks/use-auth";
import {
  useListAuctions, useCreateAuction, useUpdateAuction,
  useListCars, getListAuctionsQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Gavel, Plus, X, Clock, TrendingUp, Users, Edit2, Loader2, ChevronDown, ChevronUp
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

function fmt(n: number | null | undefined) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function formatTimeRemaining(ms: number) {
  if (ms <= 0) return "Ended";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

type AuctionDetail = {
  id: number; carId: number; title: string; description?: string | null;
  startingPrice: number; currentBid?: number | null; reservePrice?: number | null;
  buyNowPrice?: number | null; endAt: string; status: string;
  createdBy: number; winnerId?: number | null; winnerBid?: number | null;
  createdAt: string;
  car?: { id: number; make: string; model: string; year: number } | null;
  bids: { id: number; bidAmount: number; userName: string; createdAt: string }[];
  bidCount: number; timeRemaining: number;
};

function AuctionStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: "Live", cls: "bg-emerald-500/15 text-emerald-400" },
    payment_pending: { label: "Payment Pending", cls: "bg-amber-500/15 text-amber-400" },
    ended: { label: "Ended", cls: "bg-white/10 text-white/40" },
    cancelled: { label: "Cancelled", cls: "bg-red-500/15 text-red-400" },
  };
  const s = map[status] ?? map.ended;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${s.cls}`}>
      {status === "active" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5" />}
      {s.label}
    </span>
  );
}

function EditAuctionPanel({ auction, onClose }: { auction: AuctionDetail; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    startingPrice: String(auction.startingPrice),
    reservePrice: String(auction.reservePrice ?? ""),
    buyNowPrice: String(auction.buyNowPrice ?? ""),
    status: auction.status,
    endAt: new Date(auction.endAt).toISOString().slice(0, 16),
  });

  const mutation = useUpdateAuction({
    mutation: {
      onSuccess: () => {
        toast.success("Auction updated");
        qc.invalidateQueries();
        onClose();
      },
      onError: () => toast.error("Failed to update auction"),
    },
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">Edit Auction #{auction.id}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {[
          ["Starting Price ($)", "startingPrice"],
          ["Reserve Price ($)", "reservePrice"],
          ["Buy Now Price ($)", "buyNowPrice"],
        ].map(([label, key]) => (
          <div key={key}>
            <Label className="text-white/50 text-xs uppercase tracking-wider font-semibold mb-2 block">{label}</Label>
            <Input
              type="number"
              placeholder={label}
              value={form[key as keyof typeof form]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="h-11 bg-white/5 border-white/10 text-white rounded-xl"
            />
          </div>
        ))}

        <div>
          <Label className="text-white/50 text-xs uppercase tracking-wider font-semibold mb-2 block">End Date & Time</Label>
          <Input
            type="datetime-local"
            value={form.endAt}
            onChange={(e) => setForm({ ...form, endAt: e.target.value })}
            className="h-11 bg-white/5 border-white/10 text-white rounded-xl [color-scheme:dark]"
          />
        </div>

        <div>
          <Label className="text-white/50 text-xs uppercase tracking-wider font-semibold mb-2 block">Status</Label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full h-11 bg-white/5 border border-white/10 text-white rounded-xl px-4 text-sm focus:outline-none"
          >
            <option value="active">Active</option>
            <option value="payment_pending">Payment Pending</option>
            <option value="ended">Ended</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1 border-white/15 text-white/60">Cancel</Button>
          <Button
            onClick={() => mutation.mutate({
              id: auction.id,
              data: {
                startingPrice: parseFloat(form.startingPrice) || undefined,
                reservePrice: form.reservePrice ? parseFloat(form.reservePrice) : undefined,
                buyNowPrice: form.buyNowPrice ? parseFloat(form.buyNowPrice) : undefined,
                status: form.status,
                endAt: form.endAt ? new Date(form.endAt).toISOString() : undefined,
              },
            })}
            disabled={mutation.isPending}
            className="flex-1 bg-white text-black font-bold"
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function CreateAuctionPanel({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { data: cars } = useListCars(undefined, { query: { queryKey: ["admin-cars-list"] } });
  const [form, setForm] = useState({
    carId: "",
    title: "",
    description: "",
    startingPrice: "",
    reservePrice: "",
    buyNowPrice: "",
    durationHours: "24",
  });

  const mutation = useCreateAuction({
    mutation: {
      onSuccess: () => {
        toast.success("Auction created!");
        qc.invalidateQueries();
        onClose();
      },
      onError: (err: any) => toast.error(err.response?.data?.error || "Failed to create auction"),
    },
  });

  const handleCreate = () => {
    if (!form.carId || !form.title || !form.startingPrice || !form.durationHours) {
      toast.error("Car, title, starting price, and duration are required.");
      return;
    }
    mutation.mutate({
      data: {
        carId: parseInt(form.carId),
        title: form.title,
        description: form.description || undefined,
        startingPrice: parseFloat(form.startingPrice),
        reservePrice: form.reservePrice ? parseFloat(form.reservePrice) : undefined,
        buyNowPrice: form.buyNowPrice ? parseFloat(form.buyNowPrice) : undefined,
        durationHours: parseFloat(form.durationHours),
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">Create Auction</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div>
          <Label className="text-white/50 text-xs uppercase tracking-wider font-semibold mb-2 block">Vehicle</Label>
          <select
            value={form.carId}
            onChange={(e) => setForm({ ...form, carId: e.target.value })}
            className="w-full h-11 bg-white/5 border border-white/10 text-white rounded-xl px-4 text-sm focus:outline-none"
          >
            <option value="">Select a vehicle</option>
            {(cars?.cars ?? []).map((c: { id: number; year: number; make: string; model: string; price: number }) => (
              <option key={c.id} value={c.id}>{c.year} {c.make} {c.model} — {fmt(c.price)}</option>
            ))}
          </select>
        </div>

        <div>
          <Label className="text-white/50 text-xs uppercase tracking-wider font-semibold mb-2 block">Auction Title</Label>
          <Input
            placeholder="2024 Ferrari SF90 Stradale — Private Reserve"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="h-11 bg-white/5 border-white/10 text-white rounded-xl"
          />
        </div>

        <div>
          <Label className="text-white/50 text-xs uppercase tracking-wider font-semibold mb-2 block">Description (optional)</Label>
          <textarea
            placeholder="Additional details about the auction..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 rounded-xl p-3 text-sm focus:outline-none resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            ["Starting Price ($)", "startingPrice"],
            ["Reserve Price ($)", "reservePrice"],
            ["Buy Now Price ($)", "buyNowPrice"],
            ["Duration (hours)", "durationHours"],
          ].map(([label, key]) => (
            <div key={key}>
              <Label className="text-white/50 text-xs uppercase tracking-wider font-semibold mb-2 block">{label}</Label>
              <Input
                type="number"
                placeholder={label}
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="h-11 bg-white/5 border-white/10 text-white rounded-xl"
              />
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1 border-white/15 text-white/60">Cancel</Button>
          <Button
            onClick={handleCreate}
            disabled={mutation.isPending}
            className="flex-1 bg-white text-black font-bold"
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Auction"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminAuctions() {
  const { user } = useAuth();
  const [editAuction, setEditAuction] = useState<AuctionDetail | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: auctions, isLoading } = useListAuctions({
    query: { queryKey: getListAuctionsQueryKey(), refetchInterval: 15000 },
  }) as { data: AuctionDetail[] | undefined; isLoading: boolean };

  const canCreate = user?.role === "admin" || user?.role === "agent";

  return (
    <AdminLayout title="Auction Management">
      {showCreate && <CreateAuctionPanel onClose={() => setShowCreate(false)} />}
      {editAuction && <EditAuctionPanel auction={editAuction} onClose={() => setEditAuction(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl">
            <Gavel className="w-5 h-5 text-white/70" />
          </div>
          <div>
            <p className="text-white font-semibold">All Auctions</p>
            <p className="text-white/40 text-sm">{auctions?.length ?? 0} total</p>
          </div>
        </div>
        {canCreate && (
          <Button onClick={() => setShowCreate(true)} className="bg-white text-black font-bold hover:bg-white/90 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Auction
          </Button>
        )}
      </div>

      {/* Stats */}
      {auctions && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Live", count: auctions.filter(a => a.status === "active" && a.timeRemaining > 0).length, color: "text-emerald-400" },
            { label: "Payment Pending", count: auctions.filter(a => a.status === "payment_pending").length, color: "text-amber-400" },
            { label: "Ended", count: auctions.filter(a => a.status === "ended" || (a.status === "active" && a.timeRemaining <= 0)).length, color: "text-white/50" },
            { label: "Total Bids", count: auctions.reduce((s, a) => s + a.bidCount, 0), color: "text-blue-400" },
          ].map((s) => (
            <div key={s.label} className="bg-white/[0.02] border border-white/8 rounded-xl p-4">
              <p className="text-white/40 text-xs mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
            </div>
          ))}
        </div>
      )}

      {/* Auctions List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24 text-white/30">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : !auctions || auctions.length === 0 ? (
        <div className="text-center py-24">
          <Gavel className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/40">No auctions yet. Create your first one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {auctions.map((a) => {
            const isActive = a.status === "active" && a.timeRemaining > 0;
            const currentBid = a.currentBid ?? a.startingPrice;
            const isExpanded = expandedId === a.id;

            return (
              <div key={a.id} className="bg-white/[0.02] border border-white/8 rounded-2xl overflow-hidden">
                <div
                  className="p-5 cursor-pointer hover:bg-white/[0.01] transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : a.id)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <AuctionStatusBadge status={isActive ? "active" : a.status} />
                        <span className="text-white/30 text-xs">#{a.id}</span>
                      </div>
                      <h3 className="text-white font-semibold truncate">{a.title}</h3>
                      {a.car && (
                        <p className="text-white/40 text-sm">{a.car.year} {a.car.make} {a.car.model}</p>
                      )}
                    </div>

                    <div className="hidden md:flex items-center gap-8 text-sm flex-shrink-0">
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-white/40 text-xs mb-0.5">
                          <TrendingUp className="w-3 h-3" />Current
                        </div>
                        <p className="text-white font-bold">{fmt(currentBid)}</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-white/40 text-xs mb-0.5">
                          <Users className="w-3 h-3" />Bids
                        </div>
                        <p className="text-white font-bold">{a.bidCount}</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-white/40 text-xs mb-0.5">
                          <Clock className="w-3 h-3" />Time Left
                        </div>
                        <p className={`font-bold ${isActive ? "text-emerald-400" : "text-white/40"}`}>
                          {formatTimeRemaining(a.timeRemaining)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {user?.role === "admin" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => { e.stopPropagation(); setEditAuction(a); }}
                          className="border-white/15 text-white/60 hover:text-white h-8 px-3"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                          Edit
                        </Button>
                      )}
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Bid History */}
                {isExpanded && a.bids.length > 0 && (
                  <div className="border-t border-white/8 px-5 pb-5">
                    <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mt-4 mb-3">Bid History</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {a.bids.map((b, i) => (
                        <div key={b.id} className={`flex items-center justify-between py-2 px-3 rounded-lg text-sm ${i === 0 ? "bg-emerald-500/8" : "hover:bg-white/3"}`}>
                          <div>
                            <span className={`font-medium ${i === 0 ? "text-emerald-400" : "text-white/60"}`}>{b.userName}</span>
                            <span className="text-white/25 text-xs ml-2">{new Date(b.createdAt).toLocaleString()}</span>
                          </div>
                          <span className={`font-bold ${i === 0 ? "text-emerald-400" : "text-white/50"}`}>{fmt(b.bidAmount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {isExpanded && a.bids.length === 0 && (
                  <div className="border-t border-white/8 px-5 py-4 text-white/30 text-sm text-center">
                    No bids yet
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
