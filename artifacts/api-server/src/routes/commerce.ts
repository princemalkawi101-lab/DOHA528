import { Router, type IRouter } from "express";
import rateLimit from "express-rate-limit";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { bookingsTable, db, purchasesTable } from "@workspace/db";
import { getCatalogItem } from "../lib/catalog";
import { requireAdmin, requireFirebaseUser } from "../lib/firebase-auth";

const router: IRouter = Router();
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});
const bookingBody = z.object({
  itemId: z.string().trim().min(1).max(160),
  variant: z.enum(["standard", "vip"]).default("standard"),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(300).default(""),
  whatsappCountryCode: z.string().trim().regex(/^\+\d{1,4}$/),
  whatsappNumber: z.string().trim().regex(/^[\d\s()-]{5,40}$/),
  sessionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  sessionTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
}).strict();
const statusBody = z.object({ status: z.enum(["pending", "completed", "cancelled"]) }).strict();
const idParam = z.object({ id: z.string().uuid() });

router.post("/bookings", writeLimiter, requireFirebaseUser, async (req, res): Promise<void> => {
  const parsed = bookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid booking details" });
    return;
  }
  const item = await getCatalogItem(parsed.data.itemId, parsed.data.variant);
  if (!item?.active) {
    res.status(404).json({ error: "Bookable item not found" });
    return;
  }
  if (item.kind !== "individual-online" && item.kind !== "vip") {
    res.status(403).json({ error: "This purchase does not include a booking" });
    return;
  }
  const booking = await db.transaction(async (tx) => {
    const purchases = await tx.select({
      id: purchasesTable.id,
      quantity: purchasesTable.quantity,
    }).from(purchasesTable).where(and(
      eq(purchasesTable.userId, req.firebaseUser!.sub),
      eq(purchasesTable.itemId, item.id),
    )).for("update");
    const allowance = purchases.reduce((sum, purchase) => sum + purchase.quantity, 0);
    if (allowance === 0) return null;

    const [usage] = await tx.select({
      count: sql<number>`count(*)::int`,
    }).from(bookingsTable).where(and(
      eq(bookingsTable.buyerUid, req.firebaseUser!.sub),
      eq(bookingsTable.itemId, item.id),
      ne(bookingsTable.status, "cancelled"),
    ));
    if ((usage?.count ?? 0) >= allowance) return null;

    const [created] = await tx.insert(bookingsTable).values({
      purchaseId: purchases[0].id,
      itemId: item.id,
      name: parsed.data.name,
      description: parsed.data.description,
      whatsappCountryCode: parsed.data.whatsappCountryCode,
      whatsappNumber: parsed.data.whatsappNumber,
      sessionDate: parsed.data.sessionDate,
      sessionTime: parsed.data.sessionTime,
      itemTitleAr: item.titleAr,
      itemTitleEn: item.titleEn,
      buyerUid: req.firebaseUser!.sub,
      buyerEmail: req.firebaseUser!.email ?? null,
    }).returning({ id: bookingsTable.id });
    return created;
  });
  if (!booking) {
    res.status(409).json({ error: "No unused booking entitlement is available" });
    return;
  }
  res.status(201).json(booking);
});

router.get("/purchases/me", requireFirebaseUser, async (req, res): Promise<void> => {
  const rows = await db.select().from(purchasesTable)
    .where(eq(purchasesTable.userId, req.firebaseUser!.sub))
    .orderBy(desc(purchasesTable.createdAt));
  res.json(rows);
});

router.get("/admin/purchases", requireFirebaseUser, requireAdmin, async (_req, res): Promise<void> => {
  res.json(await db.select().from(purchasesTable).orderBy(desc(purchasesTable.createdAt)));
});
router.get("/admin/bookings", requireFirebaseUser, requireAdmin, async (_req, res): Promise<void> => {
  res.json(await db.select().from(bookingsTable).orderBy(desc(bookingsTable.createdAt)));
});
router.patch("/admin/bookings/:id", writeLimiter, requireFirebaseUser, requireAdmin, async (req, res): Promise<void> => {
  const params = idParam.safeParse(req.params);
  const body = statusBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const [updated] = await db.update(bookingsTable).set({ status: body.data.status })
    .where(eq(bookingsTable.id, params.data.id)).returning({ id: bookingsTable.id });
  if (!updated) res.status(404).json({ error: "Booking not found" });
  else res.json(updated);
});
router.delete("/admin/bookings/:id", writeLimiter, requireFirebaseUser, requireAdmin, async (req, res): Promise<void> => {
  const params = idParam.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const [deleted] = await db.delete(bookingsTable).where(eq(bookingsTable.id, params.data.id)).returning({ id: bookingsTable.id });
  if (!deleted) { res.status(404).json({ error: "Booking not found" }); return; }
  res.sendStatus(204);
});
router.delete("/admin/purchases/:id", writeLimiter, requireFirebaseUser, requireAdmin, async (req, res): Promise<void> => {
  const params = idParam.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const [deleted] = await db.delete(purchasesTable).where(eq(purchasesTable.id, params.data.id)).returning({ id: purchasesTable.id });
  if (!deleted) { res.status(404).json({ error: "Purchase not found" }); return; }
  res.sendStatus(204);
});

export default router;