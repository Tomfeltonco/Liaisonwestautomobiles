import { pgTable, serial, integer, real, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  carId: integer("car_id").notNull(),
  paymentType: text("payment_type").notNull().default("full"),
  totalAmount: real("total_amount").notNull(),
  downPayment: real("down_payment"),
  monthlyPayment: real("monthly_payment"),
  termMonths: integer("term_months"),
  status: text("status").notNull().default("pending"),
  paymentStatus: text("payment_status").notNull().default("pending"),
  transactionId: text("transaction_id"),
  cardLast4: text("card_last4"),
  cardBrand: text("card_brand"),
  deliveryMethod: text("delivery_method").notNull().default("pickup"),
  deliveryAddress: text("delivery_address"),
  shippingFee: real("shipping_fee").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
