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

export default router;
