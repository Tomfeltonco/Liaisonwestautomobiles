import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth";

const router = Router();

function sanitizeUser(user: typeof usersTable.$inferSelect) {
  const { passwordHash: _, idNumber: __, ssnLast4: ___, ...safe } = user;
  return { ...safe, createdAt: user.createdAt.toISOString() };
}

// GET /api/users
router.get("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
    res.json(users.map(sanitizeUser));
  } catch (err) {
    req.log.error({ err }, "List users error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/users/:id
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (req.user!.role !== "admin" && req.user!.id !== id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(sanitizeUser(user));
  } catch (err) {
    req.log.error({ err }, "Get user error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/users/:id
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (req.user!.role !== "admin" && req.user!.id !== id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const { name, phone } = req.body as { name?: string; phone?: string };
    const [updated] = await db.update(usersTable)
      .set({ name, phone })
      .where(eq(usersTable.id, id))
      .returning();
    res.json(sanitizeUser(updated));
  } catch (err) {
    req.log.error({ err }, "Update user error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/users/:id/location
router.patch("/:id/location", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (req.user!.role !== "admin" && req.user!.id !== id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const { city, state, country, latitude, longitude } = req.body as {
      city?: string; state?: string; country?: string; latitude?: number; longitude?: number;
    };
    const [updated] = await db.update(usersTable)
      .set({ city, state, country, latitude, longitude })
      .where(eq(usersTable.id, id))
      .returning();
    res.json(sanitizeUser(updated));
  } catch (err) {
    req.log.error({ err }, "Update location error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/users/:id/verify
router.post("/:id/verify", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (req.user!.role !== "admin" && req.user!.id !== id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const { idNumber, idType, ssnLast4, phone, emailCode } = req.body as {
      idNumber?: string; idType?: string; ssnLast4?: string; phone?: string; emailCode?: string;
    };

    const updates: Partial<typeof usersTable.$inferInsert> = {
      verificationStatus: "pending",
    };
    if (idNumber && idType) {
      updates.idNumber = idNumber;
      updates.idType = idType;
      updates.idVerified = true;
    }
    if (ssnLast4) {
      updates.ssnLast4 = ssnLast4;
      updates.ssnVerified = true;
    }
    if (phone) {
      updates.phone = phone;
      updates.phoneVerified = true;
    }
    if (emailCode) {
      updates.emailVerified = true;
    }

    const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();
    res.json(sanitizeUser(updated));
  } catch (err) {
    req.log.error({ err }, "Verify user error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
