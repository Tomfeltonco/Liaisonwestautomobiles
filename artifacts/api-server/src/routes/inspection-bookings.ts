import { Router } from "express";
import { db } from "@workspace/db";
import { inspectionBookingsTable, siteSettingsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth";

const router = Router();

// GET /api/inspection-bookings — admin only
router.get("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const bookings = await db.select().from(inspectionBookingsTable)
      .orderBy(desc(inspectionBookingsTable.createdAt));
    res.json(bookings.map((b) => ({ ...b, createdAt: b.createdAt.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "List inspection bookings error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/inspection-bookings/my — authenticated user's bookings
router.get("/my", requireAuth, async (req, res) => {
  try {
    const bookings = await db.select().from(inspectionBookingsTable)
      .where(eq(inspectionBookingsTable.userId, req.user!.id))
      .orderBy(desc(inspectionBookingsTable.createdAt));
    res.json(bookings.map((b) => ({ ...b, createdAt: b.createdAt.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "My inspection bookings error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/inspection-bookings — customer books an inspection
router.post("/", requireAuth, async (req, res) => {
  try {
    const { preferredDate, preferredTime, inspectionType, notes, cardLast4 } = req.body as {
      preferredDate: string; preferredTime: string;
      inspectionType: string; notes?: string; cardLast4?: string;
    };

    if (!preferredDate || !preferredTime || !inspectionType) {
      res.status(400).json({ error: "preferredDate, preferredTime, and inspectionType are required" });
      return;
    }

    // Get fee from site settings
    let [settings] = await db.select().from(siteSettingsTable).limit(1);
    if (!settings) [settings] = await db.insert(siteSettingsTable).values({}).returning();
    const fee = inspectionType === "premium"
      ? (settings.inspectionBookingFee ?? 299) * 2
      : (settings.inspectionBookingFee ?? 299);

    const transactionId = `INSP-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const [booking] = await db.insert(inspectionBookingsTable).values({
      userId: req.user!.id,
      preferredDate,
      preferredTime,
      inspectionType,
      fee,
      status: "confirmed",
      paymentStatus: "paid",
      transactionId,
      cardLast4: cardLast4 ?? null,
      notes: notes ?? null,
    }).returning();

    res.status(201).json({ ...booking, createdAt: booking.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Book inspection error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/inspection-bookings/:id — admin updates status
router.patch("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, notes } = req.body as { status?: string; notes?: string };
    const [updated] = await db.update(inspectionBookingsTable)
      .set({ ...(status && { status }), ...(notes && { notes }) })
      .where(eq(inspectionBookingsTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Booking not found" }); return; }
    res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Update inspection booking error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
