import { Router, type IRouter, type Request, type Response } from "express";
import {
  capturePayPalOrder,
  createPayPalOrder,
  getPayPalRuntimeConfig,
  getPayPalOrder,
  isPayPalApiError,
  isPayPalConfigurationError,
  type PayPalErrorDetail,
} from "../lib/paypal";
import rateLimit from "express-rate-limit";
import { db, paymentOrdersTable, purchasesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getCatalogItem } from "../lib/catalog";
import { requireFirebaseUser } from "../lib/firebase-auth";

const router: IRouter = Router();

type CartItemInput = {
  itemId?: unknown;
  variant?: unknown;
  qty?: unknown;
};

function parseCart(value: unknown):
  | { ok: true; cart: Array<{ itemId: string; variant: "standard" | "vip"; qty: number }> }
  | { ok: false; message: string } {
  if (!Array.isArray(value) || value.length === 0) {
    return { ok: false, message: "Cart is empty or invalid" };
  }
  if (value.length > 50) {
    return { ok: false, message: "Cart contains too many items" };
  }

  const cart = [];
  for (const rawItem of value) {
    if (!rawItem || typeof rawItem !== "object") {
      return { ok: false, message: "Cart contains an invalid item" };
    }

    const item = rawItem as CartItemInput;
    const variant: "standard" | "vip" =
      item.variant === "vip" ? "vip" : "standard";
    const qty = Number(item.qty ?? 1);
    if (typeof item.itemId !== "string" || !item.itemId || item.itemId.length > 160
      || (variant !== "standard" && variant !== "vip")
      || !Number.isFinite(qty) || !Number.isInteger(qty) || qty < 1 || qty > 20) {
      return { ok: false, message: "Cart contains an invalid item or quantity" };
    }
    cart.push({ itemId: item.itemId, variant, qty });
  }

  return { ok: true, cart };
}

function getRequestId(req: Request): string {
  return req.id == null ? "unknown" : String(req.id);
}

function getSafeDetails(details: PayPalErrorDetail[]) {
  return details.map((detail) => ({
    ...(detail.issue ? { issue: detail.issue } : {}),
    ...(detail.description ? { description: detail.description } : {}),
    ...(detail.field ? { field: detail.field } : {}),
    ...(detail.value ? { value: detail.value } : {}),
    ...(detail.location ? { location: detail.location } : {}),
  }));
}

function sendPayPalError(
  req: Request,
  res: Response,
  error: unknown,
  operation: "create-order" | "capture-order",
): void {
  const requestId = getRequestId(req);

  if (isPayPalConfigurationError(error)) {
    req.log.error(
      { operation, requestId, error: error.message },
      "PayPal configuration error",
    );
    res.status(500).json({
      error: "PayPal credentials are not configured on the server",
      code: "PAYPAL_NOT_CONFIGURED",
      requestId,
    });
    return;
  }

  if (isPayPalApiError(error)) {
    req.log.error(
      {
        operation,
        requestId,
        paypalOperation: error.operation,
        paypalStatus: error.status,
        paypalErrorName: error.providerName,
        paypalDebugId: error.debugId || undefined,
        paypalDetails: getSafeDetails(error.details),
        error: error.message,
      },
      "PayPal provider request failed",
    );
    const errorCode =
      error.operation === "authentication"
        ? "PAYPAL_AUTHENTICATION_FAILED"
        : `PAYPAL_${operation === "create-order" ? "CREATE_ORDER" : "CAPTURE_ORDER"}_FAILED`;
    res.status(502).json({
      error: error.message,
      code: errorCode,
      paypalErrorName: error.providerName,
      paypalStatus: error.status,
      paypalOperation: error.operation,
      ...(error.debugId ? { debugId: error.debugId } : {}),
      ...(error.details.length > 0
        ? { details: getSafeDetails(error.details) }
        : {}),
      requestId,
    });
    return;
  }

  req.log.error(
    {
      operation,
      requestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    },
    "Unexpected PayPal endpoint error",
  );
  res.status(500).json({
    error: "Unexpected payment server error",
    code: "PAYPAL_INTERNAL_ERROR",
    requestId,
  });
}

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many payment requests. Please try again later." },
});

router.post("/paypal/create-order", paymentLimiter, requireFirebaseUser, async (req, res): Promise<void> => {
  const requestId = getRequestId(req);
  const parsed = parseCart(req.body?.cart);
  if (!parsed.ok) {
    req.log.warn(
      { operation: "create-order", requestId, reason: parsed.message },
      "Rejected invalid PayPal cart",
    );
    res.status(400).json({
      error: parsed.message,
      code: "INVALID_CART",
      requestId,
    });
    return;
  }

  try {
    const trustedCart = await Promise.all(parsed.cart.map(async ({ itemId, variant, qty }) => {
      const item = await getCatalogItem(itemId, variant);
      if (!item?.active || item.priceJod <= 0) throw new Error(`ITEM_NOT_FOUND:${itemId}`);
      return {
        itemId: item.id,
        titleAr: item.titleAr,
        titleEn: item.titleEn,
        kind: item.kind,
        priceJod: item.priceJod,
        quantity: qty,
      };
    }));
    const result = await createPayPalOrder({
      cart: trustedCart.map((item) => ({
        titleEn: item.titleEn,
        jod: item.priceJod,
        qty: item.quantity,
      })),
    });
    await db.insert(paymentOrdersTable).values({
      orderId: result.id,
      userId: req.firebaseUser!.sub,
      cart: trustedCart,
    });
    req.log.info(
      {
        operation: "create-order",
        requestId,
        itemCount: parsed.cart.length,
        amount: result.amount,
        currency: result.currency,
        environment: process.env.PAYPAL_ENVIRONMENT ?? "live",
      },
      "Created PayPal order",
    );
    res.status(200).json({ id: result.id });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("ITEM_NOT_FOUND:")) {
      res.status(400).json({ error: "Cart contains an unavailable item", code: "INVALID_CART", requestId });
      return;
    }
    sendPayPalError(req, res, error, "create-order");
  }
});

router.post("/paypal/capture-order", paymentLimiter, requireFirebaseUser, async (req, res): Promise<void> => {
  const requestId = getRequestId(req);
  const orderId = req.body?.orderId;
  if (typeof orderId !== "string" || !/^[A-Z0-9-]{5,80}$/i.test(orderId)) {
    req.log.warn(
      { operation: "capture-order", requestId },
      "Rejected invalid PayPal order id",
    );
    res.status(400).json({
      error: "orderId is required and must be a valid PayPal order id",
      code: "INVALID_ORDER_ID",
      requestId,
    });
    return;
  }

  try {
    const [paymentOrder] = await db.select().from(paymentOrdersTable)
      .where(eq(paymentOrdersTable.orderId, orderId)).limit(1);
    if (!paymentOrder || paymentOrder.userId !== req.firebaseUser!.sub) {
      res.status(404).json({ error: "Payment order not found", code: "ORDER_NOT_FOUND", requestId });
      return;
    }
    if (paymentOrder.status === "captured") {
      res.status(200).json({
        captureStatus: "COMPLETED",
        orderId,
        captureId: paymentOrder.captureId ?? "",
      });
      return;
    }
    let result;
    try {
      result = await capturePayPalOrder(orderId);
    } catch (error) {
      if (!isPayPalApiError(error) || error.providerName !== "ORDER_ALREADY_CAPTURED") throw error;
      result = await getPayPalOrder(orderId);
      req.log.warn({ orderId, requestId }, "Recovering an already captured PayPal order");
    }
    if (result.captureStatus !== "COMPLETED") {
      res.status(409).json(result);
      return;
    }
    await db.transaction(async (tx) => {
      await tx.insert(purchasesTable).values(paymentOrder.cart.map((item) => ({
        userId: req.firebaseUser!.sub,
        userEmail: req.firebaseUser!.email ?? null,
        userName: typeof req.firebaseUser!.name === "string" ? req.firebaseUser!.name : null,
        itemId: item.itemId,
        itemTitleAr: item.titleAr,
        itemTitleEn: item.titleEn,
        itemKind: item.kind,
        quantity: item.quantity,
        paidJod: (item.priceJod * item.quantity).toFixed(2),
        paypalOrderId: orderId,
        paypalCaptureId: result.captureId || null,
      }))).onConflictDoNothing();
      await tx.update(paymentOrdersTable).set({
        status: "captured",
        captureId: result.captureId || null,
        capturedAt: new Date(),
      }).where(eq(paymentOrdersTable.orderId, orderId));
    });
    req.log.info(
      {
        operation: "capture-order",
        requestId,
        orderId,
        captureId: result.captureId || undefined,
        captureStatus: result.captureStatus,
        amount: result.amount || undefined,
      },
      "Captured PayPal order",
    );
    res.status(200).json(result);
  } catch (error) {
    sendPayPalError(req, res, error, "capture-order");
  }
});

export default router;