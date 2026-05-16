import { pgTable, serial, text, integer, real, boolean, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const carsTable = pgTable("cars", {
  id: serial("id").primaryKey(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  price: real("price").notNull(),
  mileage: integer("mileage").notNull(),
  color: text("color").notNull(),
  condition: text("condition").notNull().default("used"),
  bodyType: text("body_type").notNull(),
  transmission: text("transmission").notNull().default("automatic"),
  fuelType: text("fuel_type").notNull().default("gasoline"),
  engine: text("engine"),
  horsepower: integer("horsepower"),
  seatingCapacity: integer("seating_capacity"),
  vin: text("vin"),
  description: text("description"),
  features: json("features").$type<string[]>().notNull().default([]),
  images: json("images").$type<string[]>().notNull().default([]),
  status: text("status").notNull().default("available"),
  isFeatured: boolean("is_featured").notNull().default(false),
  monthlyPayment: real("monthly_payment"),
  downPayment: real("down_payment"),
  agentId: integer("agent_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCarSchema = createInsertSchema(carsTable).omit({ id: true, createdAt: true });
export type InsertCar = z.infer<typeof insertCarSchema>;
export type Car = typeof carsTable.$inferSelect;
