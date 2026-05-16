import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const siteSettingsTable = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  conciergeName: text("concierge_name").notNull().default("Jonathan Reed"),
  conciergeTitle: text("concierge_title").notNull().default("Senior Concierge Specialist"),
  conciergePhone: text("concierge_phone").notNull().default("+1 (310) 555-0199"),
  conciergeEmail: text("concierge_email").notNull().default("concierge@liaisonwest.com"),
  conciergeAddress: text("concierge_address").notNull().default("9000 Wilshire Blvd, Suite 300, Beverly Hills, CA 90210"),
  conciergeHours: text("concierge_hours").notNull().default("Mon–Sat  9:00 AM – 7:00 PM PST"),
  supportPhone: text("support_phone").notNull().default("+1 (310) 555-0100"),
  supportEmail: text("support_email").notNull().default("support@liaisonwest.com"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type SiteSettings = typeof siteSettingsTable.$inferSelect;
