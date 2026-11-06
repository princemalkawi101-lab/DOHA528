import { Router, type IRouter } from "express";
import healthRouter from "./health";
import paypalRouter from "./paypal";
import commerceRouter from "./commerce";
import eventRouter from "./event";

const router: IRouter = Router();

router.use(healthRouter);
router.use(paypalRouter);
router.use(commerceRouter);
router.use(eventRouter);

export default router;
