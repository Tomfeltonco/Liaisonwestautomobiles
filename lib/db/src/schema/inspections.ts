import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const inspectionsTable = pgTable("inspections", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  userId: integer("user_id").notNull(),
  carId: integer("car_id").notNull(),
  reportNumber: text("report_number").notNull(),
  inspector: text("inspector").notNull(),
  inspectorTitle: text("inspector_title").notNull(),
  inspectionDate: text("inspection_date").notNull(),
  inspectionTime: text("inspection_time").notNull(),
  address: text("address").notNull(),
  status: text("status").notNull().default("scheduled"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Inspection = typeof inspectionsTable.$inferSelect;
