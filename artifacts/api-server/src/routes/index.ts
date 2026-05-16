import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import carsRouter from "./cars";
import usersRouter from "./users";
import agentsRouter from "./agents";
import loansRouter from "./loans";
import cartRouter from "./cart";
import ordersRouter from "./orders";
import adminRouter from "./admin";
import chatRouter from "./chat";
import inspectionsRouter from "./inspections";
import inspectionBookingsRouter from "./inspection-bookings";
import auctionRouter from "./auction";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/cars", carsRouter);
router.use("/users", usersRouter);
router.use("/agents", agentsRouter);
router.use("/loans", loansRouter);
router.use("/cart", cartRouter);
router.use("/orders", ordersRouter);
router.use("/admin", adminRouter);
router.use("/chat", chatRouter);
router.use("/inspections", inspectionsRouter);
router.use("/inspection-bookings", inspectionBookingsRouter);
router.use("/auctions", auctionRouter);

export default router;
