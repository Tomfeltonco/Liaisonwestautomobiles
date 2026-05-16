import { pgTable, serial, text, boolean, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  phone: text("phone"),
  role: text("role").notNull().default("user"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  emailVerified: boolean("email_verified").notNull().default(false),
  phoneVerified: boolean("phone_verified").notNull().default(false),
  idVerified: boolean("id_verified").notNull().default(false),
  ssnVerified: boolean("ssn_verified").notNull().default(false),
  verificationStatus: text("verification_status").notNull().default("none"),
  idNumber: text("id_number"),
  idType: text("id_type"),
  ssnLast4: text("ssn_last4"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
