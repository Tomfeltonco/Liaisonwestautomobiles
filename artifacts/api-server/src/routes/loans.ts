import { Router } from "express";
import { db } from "@workspace/db";
import { loansTable, carsTable, activityTable, paymentSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth";

const router = Router();

function calcMonthly(principal: number, annualRate: number, months: number): number {
  const r = annualRate / 100 / 12;
  if (r === 0) return principal / months;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

async function enrichLoan(loan: typeof loansTable.$inferSelect) {
  const [car] = await db.select().from(carsTable).where(eq(carsTable.id, loan.carId)).limit(1);
  return {
    ...loan,
    car: car ? { ...car, createdAt: car.createdAt.toISOString() } : null,
    createdAt: loan.createdAt.toISOString(),
  };
}

// GET /api/loans
router.get("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const loans = await db.select().from(loansTable).orderBy(loansTable.createdAt);
    const enriched = await Promise.all(loans.map(enrichLoan));
    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "List loans error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/loans
router.post("/", requireAuth, async (req, res) => {
  try {
    const {
      carId, loanAmount, downPayment, termMonths,
      employmentStatus, annualIncome, idNumber, idType, ssnLast4
    } = req.body as {
      carId: number; loanAmount: number; downPayment: number; termMonths: number;
      employmentStatus?: string; annualIncome?: number; idNumber?: string; idType?: string; ssnLast4?: string;
    };

    const [settings] = await db.select().from(paymentSettingsTable).limit(1);
    const rate = settings?.defaultInterestRate ?? 6.9;
    const principal = loanAmount - downPayment;
    const monthly = calcMonthly(principal, rate, termMonths);

    const [loan] = await db.insert(loansTable).values({
      userId: req.user!.id,
      carId,
      loanAmount,
      downPayment,
      termMonths,
      interestRate: rate,
      monthlyPayment: parseFloat(monthly.toFixed(2)),
      employmentStatus: employmentStatus ?? null,
      annualIncome: annualIncome ?? null,
      idVerified: !!(idNumber && idType),
      ssnVerified: !!ssnLast4,
    }).returning();

    await db.insert(activityTable).values({
      type: "loan_applied",
      description: `Loan application submitted for $${loanAmount.toLocaleString()}`,
      userId: req.user!.id,
      carId,
    });

    res.status(201).json(await enrichLoan(loan));
  } catch (err) {
    req.log.error({ err }, "Create loan error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/loans/calculate
router.post("/calculate", async (req, res) => {
  try {
    const { vehiclePrice, downPayment, termMonths, creditScore } = req.body as {
      vehiclePrice: number; downPayment: number; termMonths: number; creditScore?: number;
    };

    const [settings] = await db.select().from(paymentSettingsTable).limit(1);
    let rate = settings?.defaultInterestRate ?? 6.9;

    if (creditScore) {
      if (creditScore >= 750) rate = 3.9;
      else if (creditScore >= 700) rate = 5.4;
      else if (creditScore >= 650) rate = 6.9;
      else if (creditScore >= 600) rate = 9.9;
      else rate = 14.9;
    }

    const principal = vehiclePrice - downPayment;
    const monthly = calcMonthly(principal, rate, termMonths);
    const totalPayment = monthly * termMonths + downPayment;
    const totalInterest = totalPayment - vehiclePrice;

    res.json({
      loanAmount: vehiclePrice,
      interestRate: rate,
      monthlyPayment: parseFloat(monthly.toFixed(2)),
      totalPayment: parseFloat(totalPayment.toFixed(2)),
      totalInterest: parseFloat(totalInterest.toFixed(2)),
      termMonths,
    });
  } catch (err) {
    req.log.error({ err }, "Calculate loan error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/loans/my
router.get("/my", requireAuth, async (req, res) => {
  try {
    const loans = await db.select().from(loansTable)
      .where(eq(loansTable.userId, req.user!.id))
      .orderBy(loansTable.createdAt);
    const enriched = await Promise.all(loans.map(enrichLoan));
    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "My loans error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/loans/:id
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [loan] = await db.select().from(loansTable).where(eq(loansTable.id, id)).limit(1);
    if (!loan) {
      res.status(404).json({ error: "Loan not found" });
      return;
    }
    if (req.user!.role !== "admin" && loan.userId !== req.user!.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    res.json(await enrichLoan(loan));
  } catch (err) {
    req.log.error({ err }, "Get loan error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/loans/:id
router.patch("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, interestRate, adminNotes } = req.body as {
      status?: string; interestRate?: number; adminNotes?: string;
    };

    const [existing] = await db.select().from(loansTable).where(eq(loansTable.id, id)).limit(1);
    if (!existing) {
      res.status(404).json({ error: "Loan not found" });
      return;
    }

    const updates: Partial<typeof loansTable.$inferInsert> = {};
    if (status) updates.status = status;
    if (adminNotes !== undefined) updates.adminNotes = adminNotes;
    if (interestRate !== undefined) {
      updates.interestRate = interestRate;
      const principal = existing.loanAmount - existing.downPayment;
      updates.monthlyPayment = parseFloat(calcMonthly(principal, interestRate, existing.termMonths).toFixed(2));
    }

    if (status === "approved") {
      await db.insert(activityTable).values({
        type: "loan_approved",
        description: `Loan approved for $${existing.loanAmount.toLocaleString()}`,
        userId: existing.userId,
        carId: existing.carId,
      });
    }

    const [updated] = await db.update(loansTable).set(updates).where(eq(loansTable.id, id)).returning();
    res.json(await enrichLoan(updated));
  } catch (err) {
    req.log.error({ err }, "Update loan error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
