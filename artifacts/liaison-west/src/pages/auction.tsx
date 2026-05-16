import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import {
  useListAuctions, usePlaceBid, useGetAuction,
  getListAuctionsQueryKey, getGetAuctionQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Gavel, Clock, ChevronRight, TrendingUp, BadgeCheck,
  Loader2, ArrowLeft, Users, Flame, Trophy
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function formatTimeRemaining(ms: number) {
  if (ms <= 0) return "Ended";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
}

function AuctionStatus({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: "Live", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
    payment_pending: { label: "Awaiting Payment", cls: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
    ended: { label: "Ended", cls: "bg-white/10 text-white/40 border-white/10" },
    cancelled: { label: "Cancelled", cls: "bg-red-500/15 text-red-400 border-red-500/20" },
  };
  const s = map[status] ?? map.ended;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${s.cls}`}>
      {status === "active" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
      {s.label}
    </span>
  );
}

type AuctionDetail = {
  id: number; carId: number; title: string; description?: string | null;
  startingPrice: number; currentBid?: number | null; reservePrice?: number | null;
  buyNowPrice?: number | null; endAt: string; status: string;
  createdBy: number; winnerId?: number | null; winnerBid?: number | null;
  createdAt: string;
  car?: { id: number; make: string; model: string; year: number; imageUrl?: string | null; price: number } | null;
  bids: { id: number; auctionId: number; userId: number; bidAmount: number; createdAt: string; userName: string; userEmail?: string | null }[];
  bidCount: number; timeRemaining: number;
};

function AuctionDetailView({ auctionId, onBack }: { auctionId: number; onBack: () => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [, setLocation] = useLocation();
  const [bidAmount, setBidAmount] = useState("");

  const { data: auction, isLoading } = useGetAuction(auctionId, {
    query: { queryKey: getGetAuctionQueryKey(auctionId), refetchInterval: 5000 },
  }) as { data: AuctionDetail | undefined; isLoading: boolean };

  const bidMutation = usePlaceBid({
    mutation: {
      onSuccess: () => {
        toast.success("Bid placed successfully!");
        setBidAmount("");
        qc.invalidateQueries();
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.error || "Failed to place bid.");
      },
    },
  });

  if (isLoading || !auction) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-white/30" />
      </div>
    );
  }

  const currentBid = auction.currentBid ?? auction.startingPrice;
  const minNextBid = currentBid + 1;
  const isActive = auction.status === "active" && auction.timeRemaining > 0;
  const isWinner = auction.winnerId === user?.id;

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Auctions
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
        {/* Left */}
        <div className="space-y-6">
          {/* Car image + title */}
          {auction.car?.imageUrl && (
            <div className="relative rounded-2xl overflow-hidden aspect-[16/9]">
              <img src={auction.car.imageUrl} alt={auction.title} className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4">
                <AuctionStatus status={auction.status} />
              </div>
            </div>
          )}

          <div>
            <h1 className="text-3xl font-serif font-bold text-white mb-2">{auction.title}</h1>
            {auction.car && (
              <p className="text-white/50">{auction.car.year} {auction.car.make} {auction.car.model}</p>
            )}
            {auction.description && (
              <p className="text-white/40 text-sm mt-3 leading-relaxed">{auction.description}</p>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/[0.02] border border-white/8 rounded-xl p-4 text-center">
              <TrendingUp className="w-4 h-4 text-white/40 mx-auto mb-2" />
              <p className="text-white/40 text-xs mb-1">Current Bid</p>
              <p className="text-white font-bold text-xl">{fmt(currentBid)}</p>
            </div>
            <div className="bg-white/[0.02] border border-white/8 rounded-xl p-4 text-center">
              <Users className="w-4 h-4 text-white/40 mx-auto mb-2" />
              <p className="text-white/40 text-xs mb-1">Total Bids</p>
              <p className="text-white font-bold text-xl">{auction.bidCount}</p>
            </div>
            <div className={`border rounded-xl p-4 text-center ${isActive ? "bg-emerald-500/5 border-emerald-500/20" : "bg-white/[0.02] border-white/8"}`}>
              <Clock className={`w-4 h-4 mx-auto mb-2 ${isActive ? "text-emerald-400" : "text-white/40"}`} />
              <p className="text-white/40 text-xs mb-1">Time Left</p>
              <p className={`font-bold text-xl ${isActive ? "text-emerald-400" : "text-white/40"}`}>
                {formatTimeRemaining(auction.timeRemaining)}
              </p>
            </div>
          </div>

          {/* Bid History */}
          <div className="bg-white/[0.02] border border-white/8 rounded-2xl p-6">
            <h2 className="text-white font-bold mb-4 flex items-center gap-2">
              <Gavel className="w-4 h-4 text-white/50" />
              Bid History ({auction.bidCount})
            </h2>
            {auction.bids.length === 0 ? (
              <p className="text-white/30 text-sm text-center py-6">No bids yet. Be the first!</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {auction.bids.slice(0, 20).map((bid, i) => (
                  <div key={bid.id} className={`flex items-center justify-between py-2.5 px-3 rounded-lg ${i === 0 ? "bg-emerald-500/8 border border-emerald-500/15" : "hover:bg-white/3"}`}>
                    <div className="flex items-center gap-3">
                      {i === 0 && <Trophy className="w-4 h-4 text-emerald-400" />}
                      {i > 0 && <span className="text-white/20 text-sm w-4 text-center">#{i + 1}</span>}
                      <div>
                        <p className={`text-sm font-medium ${i === 0 ? "text-emerald-400" : "text-white/60"}`}>{bid.userName}</p>
                        <p className="text-white/30 text-xs">{new Date(bid.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <span className={`font-bold ${i === 0 ? "text-emerald-400" : "text-white/60"}`}>{fmt(bid.bidAmount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-5">
          {/* Bid Panel */}
          {isActive && (
            <div className="bg-white/[0.02] border border-white/8 rounded-2xl p-6">
              <h2 className="text-white font-bold mb-1">Place Your Bid</h2>
              <p className="text-white/40 text-sm mb-5">Minimum bid: <span className="text-white font-semibold">{fmt(minNextBid)}</span></p>

              {!user ? (
                <Button onClick={() => setLocation("/login")} className="w-full h-12 bg-white text-black font-bold rounded-xl">
                  Sign In to Bid
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm font-semibold">$</span>
                    <Input
                      type="number"
                      min={minNextBid}
                      step={100}
                      placeholder={`${minNextBid.toLocaleString()}`}
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      className="h-12 pl-8 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl text-lg font-bold"
                    />
                  </div>

                  {/* Quick bid buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    {[500, 1000, 2500].map((inc) => (
                      <button
                        key={inc}
                        onClick={() => setBidAmount(String(Math.ceil(currentBid / 500) * 500 + inc))}
                        className="py-2 rounded-lg text-xs border border-white/15 text-white/50 hover:border-white/30 hover:text-white transition-all"
                      >
                        +{fmt(inc)}
                      </button>
                    ))}
                  </div>

                  <Button
                    onClick={() => {
                      const amt = parseFloat(bidAmount);
                      if (isNaN(amt) || amt < minNextBid) {
                        toast.error(`Bid must be at least ${fmt(minNextBid)}`);
                        return;
                      }
                      bidMutation.mutate({ id: auctionId, data: { bidAmount: amt } });
                    }}
                    disabled={bidMutation.isPending}
                    className="w-full h-12 bg-white text-black font-bold rounded-xl hover:bg-white/90"
                  >
                    {bidMutation.isPending
                      ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Placing...</span>
                      : <span className="flex items-center gap-2"><Gavel className="w-4 h-4" />Place Bid</span>}
                  </Button>

                  {auction.buyNowPrice && (
                    <Button
                      variant="outline"
                      onClick={() => bidMutation.mutate({ id: auctionId, data: { bidAmount: auction.buyNowPrice! } })}
                      disabled={bidMutation.isPending}
                      className="w-full h-12 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 rounded-xl"
                    >
                      <Flame className="w-4 h-4 mr-2" />
                      Buy Now — {fmt(auction.buyNowPrice)}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Winner state */}
          {auction.status === "payment_pending" && isWinner && (
            <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-6 text-center">
              <Trophy className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <h2 className="text-emerald-400 font-bold text-xl mb-1">You Won!</h2>
              <p className="text-white/50 text-sm mb-4">Winning bid: <span className="text-white font-bold">{fmt(auction.winnerBid!)}</span></p>
              <Button className="w-full h-12 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-500/90">
                Proceed to Payment
              </Button>
            </div>
          )}

          {/* Auction ended */}
          {(auction.status === "ended" || (auction.status === "active" && auction.timeRemaining <= 0)) && (
            <div className="bg-white/[0.02] border border-white/8 rounded-2xl p-6 text-center">
              <p className="text-white/40 text-sm">This auction has ended.</p>
              {auction.winnerBid && (
                <p className="text-white font-bold mt-2">Final Price: {fmt(auction.winnerBid)}</p>
              )}
            </div>
          )}

          {/* Auction info */}
          <div className="bg-white/[0.02] border border-white/8 rounded-2xl p-6 space-y-3 text-sm">
            <h3 className="text-white font-bold">Auction Details</h3>
            <div className="flex justify-between">
              <span className="text-white/40">Starting Price</span>
              <span className="text-white">{fmt(auction.startingPrice)}</span>
            </div>
            {auction.reservePrice && (
              <div className="flex justify-between">
                <span className="text-white/40">Reserve</span>
                <span className="text-white">{auction.currentBid && auction.currentBid >= auction.reservePrice ? <span className="text-emerald-400 flex items-center gap-1"><BadgeCheck className="w-3.5 h-3.5" />Met</span> : "Not met"}</span>
              </div>
            )}
            {auction.buyNowPrice && (
              <div className="flex justify-between">
                <span className="text-white/40">Buy Now</span>
                <span className="text-amber-400 font-semibold">{fmt(auction.buyNowPrice)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-white/40">Ends</span>
              <span className="text-white">{new Date(auction.endAt).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Auction() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "ended">("all");

  const { data: auctions, isLoading } = useListAuctions({
    query: { queryKey: getListAuctionsQueryKey(), refetchInterval: 10000 },
  }) as { data: AuctionDetail[] | undefined; isLoading: boolean };

  const filtered = (auctions ?? []).filter((a) => {
    if (filter === "active") return a.status === "active" && a.timeRemaining > 0;
    if (filter === "ended") return a.status !== "active" || a.timeRemaining <= 0;
    return true;
  });

  return (
    <Layout>
      {/* Hero */}
      <div className="bg-[#090909] py-16 border-b border-white/5">
        <div className="container px-4 md:px-6">
          <div className="flex items-center gap-2 text-white/30 text-sm mb-3">
            <span>Marketplace</span><ChevronRight className="w-3 h-3" /><span className="text-white">Auctions</span>
          </div>
          <h1 className="text-5xl font-serif font-bold text-white mb-4">Live Auctions</h1>
          <p className="text-white/50 text-lg max-w-2xl">
            Bid on exclusive luxury and exotic vehicles. Real-time bidding with 24-hour auction windows.
          </p>
        </div>
      </div>

      <div className="container px-4 md:px-6 py-12">
        {selectedId ? (
          <AuctionDetailView auctionId={selectedId} onBack={() => setSelectedId(null)} />
        ) : (
          <>
            {/* Filters */}
            <div className="flex items-center gap-3 mb-8">
              {(["all", "active", "ended"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    filter === f
                      ? "bg-white text-black"
                      : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-white/10"
                  }`}
                >
                  {f === "all" ? "All Auctions" : f === "active" ? "Live Now" : "Ended"}
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-white/30" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-24">
                <Gavel className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <h2 className="text-2xl font-serif text-white mb-2">No auctions found</h2>
                <p className="text-white/40">Check back soon for upcoming vehicle auctions.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((a) => {
                  const isActive = a.status === "active" && a.timeRemaining > 0;
                  const currentBid = a.currentBid ?? a.startingPrice;
                  return (
                    <button
                      key={a.id}
                      onClick={() => setSelectedId(a.id)}
                      className="text-left bg-white/[0.02] border border-white/8 rounded-2xl overflow-hidden hover:border-white/20 transition-all group"
                    >
                      {/* Image */}
                      <div className="relative aspect-[16/9] bg-white/5">
                        {a.car?.imageUrl ? (
                          <img src={a.car.imageUrl} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/20">
                            <Gavel className="w-10 h-10" />
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          <AuctionStatus status={isActive ? "active" : a.status} />
                        </div>
                        {a.buyNowPrice && (
                          <div className="absolute top-3 right-3 bg-amber-500/20 border border-amber-500/30 px-2 py-1 rounded-full text-amber-400 text-xs font-semibold flex items-center gap-1">
                            <Flame className="w-3 h-3" />Buy Now
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-5">
                        <h3 className="text-white font-bold text-lg mb-1 group-hover:text-white/90 line-clamp-1">{a.title}</h3>
                        {a.car && (
                          <p className="text-white/40 text-sm mb-4">{a.car.year} {a.car.make} {a.car.model}</p>
                        )}
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-white/30 text-xs mb-0.5">Current Bid</p>
                            <p className="text-white font-bold text-2xl">{fmt(currentBid)}</p>
                            <p className="text-white/30 text-xs mt-0.5">{a.bidCount} bid{a.bidCount !== 1 ? "s" : ""}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-white/30 text-xs mb-0.5">Time Left</p>
                            <p className={`font-bold ${isActive ? "text-emerald-400" : "text-white/40"}`}>
                              {formatTimeRemaining(a.timeRemaining)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
