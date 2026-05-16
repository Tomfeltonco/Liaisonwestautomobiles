import { pgTable, serial, integer, real, text, timestamp } from "drizzle-orm/pg-core";

export const inspectionBookingsTable = pgTable("inspection_bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  preferredDate: text("preferred_date").notNull(),
  preferredTime: text("preferred_time").notNull(),
  inspectionType: text("inspection_type").notNull().default("standard"),
  fee: real("fee").notNull(),
  status: text("status").notNull().default("pending"),
  paymentStatus: text("payment_status").notNull().default("pending"),
  transactionId: text("transaction_id"),
  cardLast4: text("card_last4"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type InspectionBooking = typeof inspectionBookingsTable.$inferSelect;
