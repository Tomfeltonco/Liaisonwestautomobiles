import { Router } from "express";
import crypto from "crypto";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken, requireAuth } from "../middlewares/auth";

const router = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "liaison-salt").digest("hex");
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body as {
      name: string;
      email: string;
      password: string;
      phone?: string;
    };
    if (!name || !email || !password) {
      res.status(400).json({ error: "Name, email, and password are required" });
      return;
    }

    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }

    const [user] = await db.insert(usersTable).values({
      name,
      email,
      passwordHash: hashPassword(password),
      phone: phone ?? null,
      role: "user",
    }).returning();

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.status(201).json({ user: sanitizeUser(user), token, role: user.role });
  } catch (err) {
    req.log.error({ err }, "Register error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user || user.passwordHash !== hashPassword(password)) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    if (user.role !== "user") {
      res.status(401).json({ error: "Please use the appropriate login portal" });
      return;
    }
    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.json({ user: sanitizeUser(user), token, role: user.role });
  } catch (err) {
    req.log.error({ err }, "Login error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/agent-login
router.post("/agent-login", async (req, res) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user || user.passwordHash !== hashPassword(password)) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    if (user.role !== "agent") {
      res.status(401).json({ error: "Not an agent account" });
      return;
    }
    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.json({ user: sanitizeUser(user), token, role: user.role });
  } catch (err) {
    req.log.error({ err }, "Agent login error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/admin-login
router.post("/admin-login", async (req, res) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user || user.passwordHash !== hashPassword(password)) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    if (user.role !== "admin") {
      res.status(401).json({ error: "Not an admin account" });
      return;
    }
    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.json({ user: sanitizeUser(user), token, role: user.role });
  } catch (err) {
    req.log.error({ err }, "Admin login error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    res.json(sanitizeUser(user));
  } catch (err) {
    req.log.error({ err }, "Get me error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/logout
router.post("/logout", (_req, res) => {
  res.json({ message: "Logged out successfully" });
});

function sanitizeUser(user: typeof usersTable.$inferSelect) {
  const { passwordHash: _, idNumber: __, ssnLast4: ___, ...safe } = user;
  return {
    ...safe,
    createdAt: user.createdAt.toISOString(),
  };
}

export default router;
