import { pgTable, serial, integer, real, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const loansTable = pgTable("loans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  carId: integer("car_id").notNull(),
  loanAmount: real("loan_amount").notNull(),
  downPayment: real("down_payment").notNull(),
  termMonths: integer("term_months").notNull(),
  interestRate: real("interest_rate").notNull().default(6.9),
  monthlyPayment: real("monthly_payment").notNull(),
  status: text("status").notNull().default("pending"),
  employmentStatus: text("employment_status"),
  annualIncome: real("annual_income"),
  creditScore: integer("credit_score"),
  idVerified: boolean("id_verified").notNull().default(false),
  ssnVerified: boolean("ssn_verified").notNull().default(false),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertLoanSchema = createInsertSchema(loansTable).omit({ id: true, createdAt: true });
export type InsertLoan = z.infer<typeof insertLoanSchema>;
export type Loan = typeof loansTable.$inferSelect;
