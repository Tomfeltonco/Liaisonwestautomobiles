import { Router } from "express";
import { db } from "@workspace/db";
import { chatRoomsTable, chatMessagesTable, usersTable } from "@workspace/db";
import { eq, or, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

function serializeRoom(r: typeof chatRoomsTable.$inferSelect) {
  return {
    ...r,
    lastMessageAt: r.lastMessageAt.toISOString(),
    createdAt: r.createdAt.toISOString(),
  };
}

function serializeMsg(m: typeof chatMessagesTable.$inferSelect) {
  return { ...m, createdAt: m.createdAt.toISOString() };
}

// POST /api/chat/rooms — create or reuse open room for customer
router.post("/rooms", requireAuth, async (req, res) => {
  try {
    const { subject } = req.body as { subject?: string };
    const userId = req.user!.id;

    const existing = await db.select().from(chatRoomsTable)
      .where(eq(chatRoomsTable.userId, userId))
      .orderBy(desc(chatRoomsTable.createdAt))
      .limit(1);

    if (existing.length > 0 && existing[0].status !== "closed") {
      res.json(serializeRoom(existing[0]));
      return;
    }

    const [room] = await db.insert(chatRoomsTable).values({
      userId,
      subject: subject || "General Inquiry",
    }).returning();

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    await db.insert(chatMessagesTable).values({
      roomId: room.id,
      senderId: 0,
      senderRole: "system",
      senderName: "Liaison West",
      message: `Welcome, ${user?.name || "valued client"}! A Liaison West concierge specialist will be with you shortly. Our team is available Mon–Sat, 9 AM – 7 PM PST.`,
    });

    res.status(201).json(serializeRoom(room));
  } catch (err) {
    req.log.error({ err }, "Create chat room error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/chat/rooms — list rooms (admin: all, agent: assigned, user: own)
router.get("/rooms", requireAuth, async (req, res) => {
  try {
    const { id, role } = req.user!;
    let rooms: typeof chatRoomsTable.$inferSelect[];

    if (role === "admin") {
      rooms = await db.select().from(chatRoomsTable).orderBy(desc(chatRoomsTable.lastMessageAt));
    } else if (role === "agent") {
      rooms = await db.select().from(chatRoomsTable)
        .where(or(eq(chatRoomsTable.agentId, id), eq(chatRoomsTable.status, "open")))
        .orderBy(desc(chatRoomsTable.lastMessageAt));
    } else {
      rooms = await db.select().from(chatRoomsTable)
        .where(eq(chatRoomsTable.userId, id))
        .orderBy(desc(chatRoomsTable.lastMessageAt));
    }

    const enriched = await Promise.all(rooms.map(async (room) => {
      const [user] = await db.select({ name: usersTable.name, email: usersTable.email })
        .from(usersTable).where(eq(usersTable.id, room.userId)).limit(1);
      return { ...serializeRoom(room), userName: user?.name, userEmail: user?.email };
    }));

    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "List chat rooms error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/chat/rooms/:id/messages
router.get("/rooms/:id/messages", requireAuth, async (req, res) => {
  try {
    const roomId = parseInt(req.params.id);
    const { id: userId, role } = req.user!;

    const [room] = await db.select().from(chatRoomsTable).where(eq(chatRoomsTable.id, roomId)).limit(1);
    if (!room) { res.status(404).json({ error: "Room not found" }); return; }

    if (role === "user" && room.userId !== userId) {
      res.status(403).json({ error: "Forbidden" }); return;
    }

    const messages = await db.select().from(chatMessagesTable)
      .where(eq(chatMessagesTable.roomId, roomId))
      .orderBy(chatMessagesTable.createdAt);

    res.json(messages.map(serializeMsg));
  } catch (err) {
    req.log.error({ err }, "Get messages error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/chat/rooms/:id/messages — send message
router.post("/rooms/:id/messages", requireAuth, async (req, res) => {
  try {
    const roomId = parseInt(req.params.id);
    const { id: userId, role, email } = req.user!;
    const { message } = req.body as { message: string };

    if (!message?.trim()) { res.status(400).json({ error: "Message required" }); return; }

    const [room] = await db.select().from(chatRoomsTable).where(eq(chatRoomsTable.id, roomId)).limit(1);
    if (!room) { res.status(404).json({ error: "Room not found" }); return; }
    if (role === "user" && room.userId !== userId) {
      res.status(403).json({ error: "Forbidden" }); return;
    }

    const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    const senderName = user?.name || email;

    if (role === "agent" && !room.agentId) {
      await db.update(chatRoomsTable).set({ agentId: userId, status: "assigned" }).where(eq(chatRoomsTable.id, roomId));
    }

    const [msg] = await db.insert(chatMessagesTable).values({
      roomId,
      senderId: userId,
      senderRole: role,
      senderName,
      message: message.trim(),
    }).returning();

    await db.update(chatRoomsTable).set({ lastMessageAt: new Date() }).where(eq(chatRoomsTable.id, roomId));

    res.status(201).json(serializeMsg(msg));
  } catch (err) {
    req.log.error({ err }, "Send message error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/chat/rooms/:id — assign agent or close
router.patch("/rooms/:id", requireAuth, async (req, res) => {
  try {
    const roomId = parseInt(req.params.id);
    const { status, agentId } = req.body as { status?: string; agentId?: number };
    const updates: Partial<typeof chatRoomsTable.$inferInsert> = {};
    if (status) updates.status = status;
    if (agentId !== undefined) updates.agentId = agentId;
    const [updated] = await db.update(chatRoomsTable).set(updates).where(eq(chatRoomsTable.id, roomId)).returning();
    res.json(serializeRoom(updated));
  } catch (err) {
    req.log.error({ err }, "Update chat room error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
