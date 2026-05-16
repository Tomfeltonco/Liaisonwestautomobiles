import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable, carsTable, ordersTable, loansTable,
  activityTable, paymentSettingsTable
} from "@workspace/db";
import { eq, sql, gte } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth";

const router = Router();

// GET /api/admin/stats
router.get("/stats", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers, totalCars, totalOrders, pendingLoans, activeAgents,
      carsAvailable, carsSold, ordersThisMonth, revenueResult, monthlyRevenueResult
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(usersTable).where(eq(usersTable.role, "user")),
      db.select({ count: sql<number>`count(*)::int` }).from(carsTable),
      db.select({ count: sql<number>`count(*)::int` }).from(ordersTable),
      db.select({ count: sql<number>`count(*)::int` }).from(loansTable).where(eq(loansTable.status, "pending")),
      db.select({ count: sql<number>`count(*)::int` }).from(usersTable).where(eq(usersTable.role, "agent")),
      db.select({ count: sql<number>`count(*)::int` }).from(carsTable).where(eq(carsTable.status, "available")),
      db.select({ count: sql<number>`count(*)::int` }).from(carsTable).where(eq(carsTable.status, "sold")),
      db.select({ count: sql<number>`count(*)::int` }).from(ordersTable).where(gte(ordersTable.createdAt, startOfMonth)),
      db.select({ total: sql<number>`coalesce(sum(total_amount), 0)::numeric(12,2)` }).from(ordersTable).where(eq(ordersTable.paymentStatus, "paid")),
      db.select({ total: sql<number>`coalesce(sum(total_amount), 0)::numeric(12,2)` }).from(ordersTable).where(gte(ordersTable.createdAt, startOfMonth)),
    ]);

    res.json({
      totalUsers: totalUsers[0]?.count ?? 0,
      totalCars: totalCars[0]?.count ?? 0,
      totalOrders: totalOrders[0]?.count ?? 0,
      totalRevenue: parseFloat(String(revenueResult[0]?.total ?? 0)),
      pendingLoans: pendingLoans[0]?.count ?? 0,
      activeAgents: activeAgents[0]?.count ?? 0,
      carsAvailable: carsAvailable[0]?.count ?? 0,
      carsSold: carsSold[0]?.count ?? 0,
      ordersThisMonth: ordersThisMonth[0]?.count ?? 0,
      revenueThisMonth: parseFloat(String(monthlyRevenueResult[0]?.total ?? 0)),
    });
  } catch (err) {
    req.log.error({ err }, "Admin stats error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/activity
router.get("/activity", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const items = await db.select().from(activityTable).orderBy(sql`created_at desc`).limit(20);
    res.json(items.map(i => ({ ...i, createdAt: i.createdAt.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "Recent activity error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/payment-settings
router.get("/payment-settings", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    let [settings] = await db.select().from(paymentSettingsTable).limit(1);
    if (!settings) {
      [settings] = await db.insert(paymentSettingsTable).values({}).returning();
    }
    res.json({ ...settings, updatedAt: settings.updatedAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Payment settings error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/admin/payment-settings
router.patch("/payment-settings", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    let [existing] = await db.select().from(paymentSettingsTable).limit(1);

    if (!existing) {
      [existing] = await db.insert(paymentSettingsTable).values({}).returning();
    }

    const updates = {
      ...req.body,
      updatedAt: new Date(),
    };

    const [updated] = await db.update(paymentSettingsTable)
      .set(updates)
      .where(eq(paymentSettingsTable.id, existing.id))
      .returning();

    res.json({ ...updated, updatedAt: updated.updatedAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Update payment settings error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
