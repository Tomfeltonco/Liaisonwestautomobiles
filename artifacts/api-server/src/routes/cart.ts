import { Router } from "express";
import { db } from "@workspace/db";
import { cartItemsTable, carsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

async function buildCart(userId: number) {
  const items = await db.select().from(cartItemsTable).where(eq(cartItemsTable.userId, userId)).orderBy(cartItemsTable.addedAt);
  let totalPrice = 0;
  const enrichedItems = await Promise.all(items.map(async (item) => {
    const [car] = await db.select().from(carsTable).where(eq(carsTable.id, item.carId)).limit(1);
    if (car) totalPrice += car.price;
    return {
      carId: item.carId,
      paymentType: item.paymentType,
      addedAt: item.addedAt.toISOString(),
      car: car ? { ...car, createdAt: car.createdAt.toISOString() } : null,
    };
  }));
  return { items: enrichedItems, totalPrice };
}

// GET /api/cart
router.get("/", requireAuth, async (req, res) => {
  try {
    const cart = await buildCart(req.user!.id);
    res.json(cart);
  } catch (err) {
    req.log.error({ err }, "Get cart error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/cart
router.post("/", requireAuth, async (req, res) => {
  try {
    const { carId, paymentType } = req.body as { carId: number; paymentType: string };
    const existing = await db.select().from(cartItemsTable)
      .where(and(eq(cartItemsTable.userId, req.user!.id), eq(cartItemsTable.carId, carId)))
      .limit(1);

    if (existing.length > 0) {
      await db.update(cartItemsTable).set({ paymentType }).where(eq(cartItemsTable.id, existing[0].id));
    } else {
      await db.insert(cartItemsTable).values({ userId: req.user!.id, carId, paymentType });
    }

    const cart = await buildCart(req.user!.id);
    res.status(201).json(cart);
  } catch (err) {
    req.log.error({ err }, "Add to cart error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/cart
router.delete("/", requireAuth, async (req, res) => {
  try {
    await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, req.user!.id));
    res.json({ message: "Cart cleared" });
  } catch (err) {
    req.log.error({ err }, "Clear cart error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/cart/:carId
router.delete("/:carId", requireAuth, async (req, res) => {
  try {
    const carId = parseInt(req.params.carId);
    await db.delete(cartItemsTable)
      .where(and(eq(cartItemsTable.userId, req.user!.id), eq(cartItemsTable.carId, carId)));
    const cart = await buildCart(req.user!.id);
    res.json(cart);
  } catch (err) {
    req.log.error({ err }, "Remove from cart error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
