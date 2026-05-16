import { Router } from "express";
import { db } from "@workspace/db";
import { carsTable, usersTable, activityTable } from "@workspace/db";
import { eq, ilike, gte, lte, and, sql } from "drizzle-orm";
import { requireAuth, requireRole, optionalAuth } from "../middlewares/auth";

const router = Router();

// GET /api/cars
router.get("/", optionalAuth, async (req, res) => {
  try {
    const {
      make, model, minPrice, maxPrice, minYear, maxYear,
      condition, bodyType, search, page = "1", limit = "12"
    } = req.query as Record<string, string>;

    const conditions = [];
    if (make) conditions.push(ilike(carsTable.make, `%${make}%`));
    if (model) conditions.push(ilike(carsTable.model, `%${model}%`));
    if (minPrice) conditions.push(gte(carsTable.price, parseFloat(minPrice)));
    if (maxPrice) conditions.push(lte(carsTable.price, parseFloat(maxPrice)));
    if (minYear) conditions.push(gte(carsTable.year, parseInt(minYear)));
    if (maxYear) conditions.push(lte(carsTable.year, parseInt(maxYear)));
    if (condition) conditions.push(eq(carsTable.condition, condition));
    if (bodyType) conditions.push(ilike(carsTable.bodyType, `%${bodyType}%`));
    if (search) {
      conditions.push(
        sql`(${carsTable.make} ILIKE ${'%' + search + '%'} OR ${carsTable.model} ILIKE ${'%' + search + '%'} OR ${carsTable.description} ILIKE ${'%' + search + '%'})`
      );
    }

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 50);
    const offset = (pageNum - 1) * limitNum;

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [cars, countResult] = await Promise.all([
      db.select().from(carsTable).where(whereClause).limit(limitNum).offset(offset).orderBy(carsTable.createdAt),
      db.select({ count: sql<number>`count(*)::int` }).from(carsTable).where(whereClause),
    ]);

    const total = countResult[0]?.count ?? 0;

    const enrichedCars = await Promise.all(cars.map(async (car) => enrichCar(car)));

    res.json({
      cars: enrichedCars,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    req.log.error({ err }, "List cars error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/cars
router.post("/", requireAuth, requireRole("agent", "admin"), async (req, res) => {
  try {
    const body = req.body as {
      make: string; model: string; year: number; price: number; mileage: number;
      color: string; condition: string; bodyType: string; transmission: string;
      fuelType: string; engine?: string; horsepower?: number; seatingCapacity?: number;
      vin?: string; description?: string; features?: string[]; images?: string[];
      isFeatured?: boolean; monthlyPayment?: number; downPayment?: number;
    };

    const [car] = await db.insert(carsTable).values({
      ...body,
      agentId: req.user!.id,
      features: body.features ?? [],
      images: body.images ?? [],
    }).returning();

    await db.insert(activityTable).values({
      type: "car_uploaded",
      description: `New car listed: ${car.year} ${car.make} ${car.model}`,
      userId: req.user!.id,
      carId: car.id,
    });

    res.status(201).json(await enrichCar(car));
  } catch (err) {
    req.log.error({ err }, "Create car error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/cars/featured
router.get("/featured", async (req, res) => {
  try {
    const cars = await db.select().from(carsTable)
      .where(and(eq(carsTable.isFeatured, true), eq(carsTable.status, "available")))
      .limit(8).orderBy(carsTable.createdAt);
    const enriched = await Promise.all(cars.map(enrichCar));
    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "Featured cars error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/cars/stats
router.get("/stats", async (req, res) => {
  try {
    const [totalResult, availableResult, soldResult, newResult, usedResult, avgResult, makesResult] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(carsTable),
      db.select({ count: sql<number>`count(*)::int` }).from(carsTable).where(eq(carsTable.status, "available")),
      db.select({ count: sql<number>`count(*)::int` }).from(carsTable).where(eq(carsTable.status, "sold")),
      db.select({ count: sql<number>`count(*)::int` }).from(carsTable).where(eq(carsTable.condition, "new")),
      db.select({ count: sql<number>`count(*)::int` }).from(carsTable).where(eq(carsTable.condition, "used")),
      db.select({ avg: sql<number>`avg(price)::numeric(10,2)` }).from(carsTable),
      db.select({ make: carsTable.make, count: sql<number>`count(*)::int` }).from(carsTable).groupBy(carsTable.make).orderBy(sql`count(*) desc`).limit(10),
    ]);

    res.json({
      totalCars: totalResult[0]?.count ?? 0,
      availableCars: availableResult[0]?.count ?? 0,
      soldCars: soldResult[0]?.count ?? 0,
      newCars: newResult[0]?.count ?? 0,
      usedCars: usedResult[0]?.count ?? 0,
      avgPrice: parseFloat(String(avgResult[0]?.avg ?? 0)),
      makes: makesResult,
    });
  } catch (err) {
    req.log.error({ err }, "Car stats error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/cars/:id
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [car] = await db.select().from(carsTable).where(eq(carsTable.id, id)).limit(1);
    if (!car) {
      res.status(404).json({ error: "Car not found" });
      return;
    }
    res.json(await enrichCar(car));
  } catch (err) {
    req.log.error({ err }, "Get car error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/cars/:id
router.patch("/:id", requireAuth, requireRole("agent", "admin"), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [existing] = await db.select().from(carsTable).where(eq(carsTable.id, id)).limit(1);
    if (!existing) {
      res.status(404).json({ error: "Car not found" });
      return;
    }
    if (req.user!.role === "agent" && existing.agentId !== req.user!.id) {
      res.status(403).json({ error: "Not your listing" });
      return;
    }

    const [updated] = await db.update(carsTable).set(req.body).where(eq(carsTable.id, id)).returning();
    res.json(await enrichCar(updated));
  } catch (err) {
    req.log.error({ err }, "Update car error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/cars/:id
router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(carsTable).where(eq(carsTable.id, id));
    res.json({ message: "Car deleted" });
  } catch (err) {
    req.log.error({ err }, "Delete car error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/cars/:id/similar
router.get("/:id/similar", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [car] = await db.select().from(carsTable).where(eq(carsTable.id, id)).limit(1);
    if (!car) {
      res.status(404).json({ error: "Car not found" });
      return;
    }
    const similar = await db.select().from(carsTable)
      .where(and(eq(carsTable.bodyType, car.bodyType), eq(carsTable.status, "available")))
      .limit(4).orderBy(carsTable.createdAt);
    const enriched = await Promise.all(similar.filter(c => c.id !== id).map(enrichCar));
    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "Similar cars error");
    res.status(500).json({ error: "Internal server error" });
  }
});

async function enrichCar(car: typeof carsTable.$inferSelect) {
  let agentName: string | null = null;
  if (car.agentId) {
    const [agent] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, car.agentId)).limit(1);
    agentName = agent?.name ?? null;
  }
  return {
    ...car,
    agentName,
    createdAt: car.createdAt.toISOString(),
  };
}

export default router;
