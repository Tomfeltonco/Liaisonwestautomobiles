import { pgTable, serial, integer, real, text, timestamp } from "drizzle-orm/pg-core";

export const auctionsTable = pgTable("auctions", {
  id: serial("id").primaryKey(),
  carId: integer("car_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  startingPrice: real("starting_price").notNull(),
  currentBid: real("current_bid"),
  reservePrice: real("reserve_price"),
  buyNowPrice: real("buy_now_price"),
  endAt: timestamp("end_at").notNull(),
  status: text("status").notNull().default("active"),
  createdBy: integer("created_by").notNull(),
  winnerId: integer("winner_id"),
  winnerBid: real("winner_bid"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Auction = typeof auctionsTable.$inferSelect;
