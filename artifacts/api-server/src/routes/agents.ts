import { Router } from "express";
import crypto from "crypto";
import { db } from "@workspace/db";
import { usersTable, carsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth";

const router = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "liaison-salt").digest("hex");
}

function sanitizeAgent(user: typeof usersTable.$inferSelect, totalUploads: number) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    isActive: true,
    totalCarUploads: totalUploads,
    createdAt: user.createdAt.toISOString(),
  };
}

// GET /api/agents
router.get("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const agents = await db.select().from(usersTable).where(eq(usersTable.role, "agent")).orderBy(usersTable.createdAt);
    const enriched = await Promise.all(agents.map(async (a) => {
      const [countResult] = await db.select({ count: sql<number>`count(*)::int` }).from(carsTable).where(eq(carsTable.agentId, a.id));
      return sanitizeAgent(a, countResult?.count ?? 0);
    }));
    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "List agents error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/agents
router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { name, email, password, phone } = req.body as {
      name: string; email: string; password: string; phone?: string;
    };
    const [agent] = await db.insert(usersTable).values({
      name,
      email,
      passwordHash: hashPassword(password),
      phone: phone ?? null,
      role: "agent",
    }).returning();
    res.status(201).json(sanitizeAgent(agent, 0));
  } catch (err) {
    req.log.error({ err }, "Create agent error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/agents/:id
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [agent] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!agent || agent.role !== "agent") {
      res.status(404).json({ error: "Agent not found" });
      return;
    }
    const [countResult] = await db.select({ count: sql<number>`count(*)::int` }).from(carsTable).where(eq(carsTable.agentId, id));
    res.json(sanitizeAgent(agent, countResult?.count ?? 0));
  } catch (err) {
    req.log.error({ err }, "Get agent error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/agents/:id
router.patch("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, phone } = req.body as { name?: string; phone?: string; isActive?: boolean };
    const [updated] = await db.update(usersTable).set({ name, phone }).where(eq(usersTable.id, id)).returning();
    const [countResult] = await db.select({ count: sql<number>`count(*)::int` }).from(carsTable).where(eq(carsTable.agentId, id));
    res.json(sanitizeAgent(updated, countResult?.count ?? 0));
  } catch (err) {
    req.log.error({ err }, "Update agent error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/agents/:id
router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(usersTable).where(eq(usersTable.id, id));
    res.json({ message: "Agent deleted" });
  } catch (err) {
    req.log.error({ err }, "Delete agent error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/agents/:id/cars
router.get("/:id/cars", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const cars = await db.select().from(carsTable).where(eq(carsTable.agentId, id)).orderBy(carsTable.createdAt);
    res.json(cars.map(c => ({ ...c, createdAt: c.createdAt.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "Get agent cars error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
