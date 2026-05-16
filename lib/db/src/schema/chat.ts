import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const chatRoomsTable = pgTable("chat_rooms", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  agentId: integer("agent_id"),
  status: text("status").notNull().default("open"),
  subject: text("subject").notNull().default("General Inquiry"),
  lastMessageAt: timestamp("last_message_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const chatMessagesTable = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull(),
  senderId: integer("sender_id").notNull(),
  senderRole: text("sender_role").notNull(),
  senderName: text("sender_name").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ChatRoom = typeof chatRoomsTable.$inferSelect;
export type ChatMessage = typeof chatMessagesTable.$inferSelect;
