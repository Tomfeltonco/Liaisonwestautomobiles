import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, carsTable, activityTable, paymentSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth";
import { createInspectionForOrder } from "./inspections";

const router = Router();

async function enrichOrder(order: typeof ordersTable.$inferSelect) {
  const [car] = await db.select().from(carsTable).where(eq(carsTable.id, order.carId)).limit(1);
  return {
    ...order,
    car: car ? { ...car, createdAt: car.createdAt.toISOString() } : null,
    createdAt: order.createdAt.toISOString(),
  };
}

// GET /api/orders
router.get("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const orders = await db.select().from(ordersTable).orderBy(ordersTable.createdAt);
    const enriched = await Promise.all(orders.map(enrichOrder));
    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "List orders error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/orders
router.post("/", requireAuth, async (req, res) => {
  try {
    const { carId, paymentType, downPayment, termMonths, cardLast4, cardBrand } = req.body as {
      carId: number; paymentType: string; downPayment?: number; termMonths?: number;
      cardLast4?: string; cardBrand?: string;
    };

    const [car] = await db.select().from(carsTable).where(eq(carsTable.id, carId)).limit(1);
    if (!car) {
      res.status(404).json({ error: "Car not found" });
      return;
    }

    const [settings] = await db.select().from(paymentSettingsTable).limit(1);
    const rate = settings?.defaultInterestRate ?? 6.9;

    let monthlyPayment: number | undefined;
    if (paymentType === "installment" && downPayment && termMonths) {
      const principal = car.price - downPayment;
      const r = rate / 100 / 12;
      monthlyPayment = r === 0
        ? principal / termMonths
        : (principal * r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);
      monthlyPayment = parseFloat(monthlyPayment.toFixed(2));
    }

    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const [order] = await db.insert(ordersTable).values({
      userId: req.user!.id,
      carId,
      paymentType,
      totalAmount: car.price,
      downPayment: downPayment ?? null,
      monthlyPayment: monthlyPayment ?? null,
      termMonths: termMonths ?? null,
      status: "processing",
      paymentStatus: paymentType === "full" ? "paid" : "partial",
      transactionId,
      cardLast4: cardLast4 ?? null,
      cardBrand: cardBrand ?? null,
    }).returning();

    if (paymentType === "full") {
      await db.update(carsTable).set({ status: "sold" }).where(eq(carsTable.id, carId));
      await db.insert(activityTable).values({
        type: "car_sold",
        description: `${car.year} ${car.make} ${car.model} sold for $${car.price.toLocaleString()}`,
        userId: req.user!.id,
        carId,
      });
    } else {
      await db.update(carsTable).set({ status: "reserved" }).where(eq(carsTable.id, carId));
    }

    await db.insert(activityTable).values({
      type: "order_placed",
      description: `Order placed for ${car.year} ${car.make} ${car.model} (${paymentType})`,
      userId: req.user!.id,
      carId,
    });

    // Auto-schedule inspection for the order
    try {
      await createInspectionForOrder(order.id, req.user!.id, carId);
    } catch (inspErr) {
      req.log.warn({ err: inspErr }, "Failed to create inspection record (non-fatal)");
    }

    res.status(201).json(await enrichOrder(order));
  } catch (err) {
    req.log.error({ err }, "Create order error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/orders/my
router.get("/my", requireAuth, async (req, res) => {
  try {
    const orders = await db.select().from(ordersTable)
      .where(eq(ordersTable.userId, req.user!.id))
      .orderBy(ordersTable.createdAt);
    const enriched = await Promise.all(orders.map(enrichOrder));
    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "My orders error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/orders/:id
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id)).limit(1);
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    if (req.user!.role !== "admin" && order.userId !== req.user!.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    res.json(await enrichOrder(order));
  } catch (err) {
    req.log.error({ err }, "Get order error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/orders/:id
router.patch("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, paymentStatus, transactionId } = req.body as {
      status?: string; paymentStatus?: string; transactionId?: string;
    };
    const [updated] = await db.update(ordersTable)
      .set({ status, paymentStatus, transactionId })
      .where(eq(ordersTable.id, id))
      .returning();
    res.json(await enrichOrder(updated));
  } catch (err) {
    req.log.error({ err }, "Update order error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
