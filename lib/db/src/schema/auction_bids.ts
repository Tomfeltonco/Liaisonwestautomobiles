import { pgTable, serial, integer, real, timestamp } from "drizzle-orm/pg-core";

export const auctionBidsTable = pgTable("auction_bids", {
  id: serial("id").primaryKey(),
  auctionId: integer("auction_id").notNull(),
  userId: integer("user_id").notNull(),
  bidAmount: real("bid_amount").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type AuctionBid = typeof auctionBidsTable.$inferSelect;
