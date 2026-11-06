import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { requireFirebaseUser } from "../lib/firebase-auth";
import { eventAction, EventError } from "../lib/event-workflow";

const router = Router();
const limiter = rateLimit({ windowMs: 60000, limit: 40, standardHeaders: true, legacyHeaders: false });
router.post("/event", limiter, requireFirebaseUser, async (req, res): Promise<void> => {
  res.setHeader("Cache-Control", "no-store");
  try {
    const u = req.firebaseUser!;
    res.json(await eventAction({ uid: u.sub, email: u.email, admin: u.admin }, req.body));
  } catch (error) {
    const status = error instanceof EventError ? error.status : error instanceof z.ZodError ? 400 : 500;
    req.log.error({ action: req.body?.action, status, errorType: error instanceof Error ? error.name : "Unknown" }, "Event workflow request failed");
    res.status(status).json({ error: status < 500 && error instanceof Error ? error.message : "تعذّر إكمال العملية. يرجى المحاولة مجددًا؛ لا تدفع مرة أخرى إذا تم خصم المبلغ." });
  }
});
export default router;
