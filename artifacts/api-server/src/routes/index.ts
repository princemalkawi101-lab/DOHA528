import { Router, type IRouter } from "express";
import healthRouter from "./health";
import paypalRouter from "./paypal";
import commerceRouter from "./commerce";

const router: IRouter = Router();

router.use(healthRouter);
router.use(paypalRouter);
router.use(commerceRouter);

export default router;
