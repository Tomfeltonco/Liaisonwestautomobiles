import { Router } from "express";
import { db } from "@workspace/db";
import { inspectionsTable, carsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth";

const router = Router();

const INSPECTORS = [
  { name: "Michael Thornton", title: "ASE Master Technician, Cert. #MT-0847" },
  { name: "Sarah Chen", title: "Certified Vehicle Inspector, Cert. #CI-2291" },
  { name: "David Kessler", title: "Automotive Quality Specialist, Cert. #AQ-5503" },
];

const INSPECTION_ADDRESS = "Liaison West Certified Inspection Center\n9000 Wilshire Boulevard, Suite 300\nBeverly Hills, CA 90210";

function nextBusinessDay(days = 3): { date: string; time: string } {
  const d = new Date();
  d.setDate(d.getDate() + days);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  const dateStr = d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const times = ["9:00 AM", "10:30 AM", "1:00 PM", "2:30 PM", "4:00 PM"];
  const time = times[d.getDate() % times.length];
  return { date: dateStr, time };
}

function reportNumber(orderId: number): string {
  return `LW-INSP-${new Date().getFullYear()}-${String(orderId).padStart(5, "0")}`;
}

async function enrich(insp: typeof inspectionsTable.$inferSelect) {
  const [car] = await db.select().from(carsTable).where(eq(carsTable.id, insp.carId)).limit(1);
  return {
    ...insp,
    createdAt: insp.createdAt.toISOString(),
    car: car ? { ...car, createdAt: car.createdAt.toISOString() } : null,
  };
}

// Called internally to create inspection after order paid
export async function createInspectionForOrder(orderId: number, userId: number, carId: number) {
  const inspector = INSPECTORS[orderId % INSPECTORS.length];
  const { date, time } = nextBusinessDay(3);
  const [insp] = await db.insert(inspectionsTable).values({
    orderId,
    userId,
    carId,
    reportNumber: reportNumber(orderId),
    inspector: inspector.name,
    inspectorTitle: inspector.title,
    inspectionDate: date,
    inspectionTime: time,
    address: INSPECTION_ADDRESS,
    status: "scheduled",
    notes: "Pre-delivery 150-point certified inspection. Please arrive 10 minutes early with a valid photo ID. Complimentary valet parking available.",
  }).returning();
  return insp;
}

// GET /api/inspections — admin only
router.get("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const inspections = await db.select().from(inspectionsTable).orderBy(desc(inspectionsTable.createdAt));
    res.json(await Promise.all(inspections.map(enrich)));
  } catch (err) {
    req.log.error({ err }, "List inspections error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/inspections/my — customer's own inspections
router.get("/my", requireAuth, async (req, res) => {
  try {
    const inspections = await db.select().from(inspectionsTable)
      .where(eq(inspectionsTable.userId, req.user!.id))
      .orderBy(desc(inspectionsTable.createdAt));
    res.json(await Promise.all(inspections.map(enrich)));
  } catch (err) {
    req.log.error({ err }, "My inspections error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
