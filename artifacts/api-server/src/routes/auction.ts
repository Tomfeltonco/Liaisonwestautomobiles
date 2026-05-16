import { Router } from "express";
import { db } from "@workspace/db";
import {
  auctionsTable, auctionBidsTable, carsTable, usersTable,
} from "@workspace/db";
import { eq, desc, and, gt } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth";

const router = Router();

async function enrichAuction(a: typeof auctionsTable.$inferSelect) {
  const [car] = await db.select().from(carsTable).where(eq(carsTable.id, a.carId)).limit(1);
  const bids = await db.select().from(auctionBidsTable)
    .where(eq(auctionBidsTable.auctionId, a.id))
    .orderBy(desc(auctionBidsTable.bidAmount));

  // Auto-close ended auctions and set winner
  const now = new Date();
  if (a.status === "active" && a.endAt <= now) {
    const topBid = bids[0];
    const winnerBid = topBid?.bidAmount ?? null;
    const winnerId = topBid?.userId ?? null;
    const newStatus = winnerBid ? "payment_pending" : "ended";
    const [updated] = await db.update(auctionsTable)
      .set({ status: newStatus, winnerId, winnerBid })
      .where(eq(auctionsTable.id, a.id))
      .returning();
    a = updated;
  }

  const enrichedBids = await Promise.all(bids.map(async (b) => {
    const [u] = await db.select({ name: usersTable.name, email: usersTable.email })
      .from(usersTable).where(eq(usersTable.id, b.userId)).limit(1);
    return {
      ...b,
      createdAt: b.createdAt.toISOString(),
      userName: u?.name ?? "Anonymous",
      userEmail: u?.email ?? null,
    };
  }));

  return {
    ...a,
    endAt: a.endAt.toISOString(),
    createdAt: a.createdAt.toISOString(),
    car: car ? { ...car, createdAt: car.createdAt.toISOString() } : null,
    bids: enrichedBids,
    bidCount: bids.length,
    timeRemaining: Math.max(0, new Date(a.endAt).getTime() - Date.now()),
  };
}

// GET /api/auctions — public list of active/recent auctions
router.get("/", async (req, res) => {
  try {
    const auctions = await db.select().from(auctionsTable).orderBy(desc(auctionsTable.createdAt));
    const enriched = await Promise.all(auctions.map(enrichAuction));
    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "List auctions error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auctions — admin or agent creates auction
router.post("/", requireAuth, requireRole("admin", "agent"), async (req, res) => {
  try {
    const { carId, title, description, startingPrice, reservePrice, buyNowPrice, durationHours } = req.body as {
      carId: number; title: string; description?: string;
      startingPrice: number; reservePrice?: number; buyNowPrice?: number;
      durationHours: number;
    };
    if (!carId || !title || !startingPrice || !durationHours) {
      res.status(400).json({ error: "carId, title, startingPrice, and durationHours are required" });
      return;
    }
    const endAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);
    const [auction] = await db.insert(auctionsTable).values({
      carId, title, description: description ?? null,
      startingPrice, reservePrice: reservePrice ?? null,
      buyNowPrice: buyNowPrice ?? null, endAt,
      status: "active", createdBy: req.user!.id,
    }).returning();
    res.status(201).json(await enrichAuction(auction));
  } catch (err) {
    req.log.error({ err }, "Create auction error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/auctions/:id
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [auction] = await db.select().from(auctionsTable).where(eq(auctionsTable.id, id)).limit(1);
    if (!auction) { res.status(404).json({ error: "Auction not found" }); return; }
    res.json(await enrichAuction(auction));
  } catch (err) {
    req.log.error({ err }, "Get auction error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/auctions/:id — admin edits prices/status
router.patch("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { startingPrice, reservePrice, buyNowPrice, status, endAt } = req.body as {
      startingPrice?: number; reservePrice?: number; buyNowPrice?: number;
      status?: string; endAt?: string;
    };
    const [updated] = await db.update(auctionsTable)
      .set({
        ...(startingPrice !== undefined && { startingPrice }),
        ...(reservePrice !== undefined && { reservePrice }),
        ...(buyNowPrice !== undefined && { buyNowPrice }),
        ...(status !== undefined && { status }),
        ...(endAt !== undefined && { endAt: new Date(endAt) }),
      })
      .where(eq(auctionsTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Auction not found" }); return; }
    res.json(await enrichAuction(updated));
  } catch (err) {
    req.log.error({ err }, "Update auction error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auctions/:id/bid — authenticated user places a bid
router.post("/:id/bid", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { bidAmount } = req.body as { bidAmount: number };
    if (!bidAmount || bidAmount <= 0) {
      res.status(400).json({ error: "bidAmount must be a positive number" });
      return;
    }

    const [auction] = await db.select().from(auctionsTable).where(eq(auctionsTable.id, id)).limit(1);
    if (!auction) { res.status(404).json({ error: "Auction not found" }); return; }
    if (auction.status !== "active") { res.status(400).json({ error: "Auction is not active" }); return; }
    if (new Date(auction.endAt) <= new Date()) { res.status(400).json({ error: "Auction has ended" }); return; }

    const minBid = (auction.currentBid ?? auction.startingPrice);
    if (bidAmount <= minBid) {
      res.status(400).json({ error: `Bid must be higher than current bid of $${minBid.toLocaleString()}` });
      return;
    }

    const [bid] = await db.insert(auctionBidsTable).values({
      auctionId: id, userId: req.user!.id, bidAmount,
    }).returning();

    await db.update(auctionsTable).set({ currentBid: bidAmount }).where(eq(auctionsTable.id, id));

    // Check buy-now
    if (auction.buyNowPrice && bidAmount >= auction.buyNowPrice) {
      await db.update(auctionsTable)
        .set({ status: "payment_pending", winnerId: req.user!.id, winnerBid: bidAmount })
        .where(eq(auctionsTable.id, id));
    }

    res.status(201).json({ ...bid, createdAt: bid.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Place bid error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
