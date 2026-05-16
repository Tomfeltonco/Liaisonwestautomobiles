import { pgTable, serial, real, integer, boolean, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const paymentSettingsTable = pgTable("payment_settings", {
  id: serial("id").primaryKey(),
  defaultInterestRate: real("default_interest_rate").notNull().default(6.9),
  minDownPaymentPercent: real("min_down_payment_percent").notNull().default(10),
  maxLoanTermMonths: integer("max_loan_term_months").notNull().default(84),
  processingFeePercent: real("processing_fee_percent").notNull().default(1.5),
  acceptedPaymentMethods: json("accepted_payment_methods").$type<string[]>().notNull().default(["visa", "mastercard", "amex", "discover"]),
  installmentEnabled: boolean("installment_enabled").notNull().default(true),
  fullPaymentEnabled: boolean("full_payment_enabled").notNull().default(true),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPaymentSettingsSchema = createInsertSchema(paymentSettingsTable).omit({ id: true, updatedAt: true });
export type InsertPaymentSettings = z.infer<typeof insertPaymentSettingsSchema>;
export type PaymentSettings = typeof paymentSettingsTable.$inferSelect;
