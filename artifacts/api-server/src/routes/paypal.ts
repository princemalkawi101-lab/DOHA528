import { Router, type IRouter, type Request, type Response } from "express";
import {
  capturePayPalOrder,
  createPayPalOrder,
  getPayPalRuntimeConfig,
  isPayPalApiError,
  isPayPalConfigurationError,
  type PayPalErrorDetail,
} from "../lib/paypal";

const router: IRouter = Router();

type CartItemInput = {
  titleEn?: unknown;
  titleAr?: unknown;
  nameKey?: unknown;
  jod?: unknown;
  qty?: unknown;
};

function parseCart(value: unknown):
  | { ok: true; cart: Array<{ titleEn?: string; nameKey?: string; jod: number; qty: number }> }
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
    const jod = Number(item.jod);
    const qty = Number(item.qty ?? 1);
    if (!Number.isFinite(jod) || jod <= 0 || !Number.isFinite(qty) || !Number.isInteger(qty) || qty < 1 || qty > 100) {
      return { ok: false, message: "Cart contains an invalid price or quantity" };
    }

    cart.push({
      ...(typeof item.titleEn === "string" ? { titleEn: item.titleEn } : {}),
      ...(typeof item.nameKey === "string" ? { nameKey: item.nameKey } : {}),
      jod,
      qty,
    });
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

router.post("/paypal/create-order", async (req, res): Promise<void> => {
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
    const result = await createPayPalOrder({ cart: parsed.cart });
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
    sendPayPalError(req, res, error, "create-order");
  }
});

router.post("/paypal/capture-order", async (req, res): Promise<void> => {
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
    const result = await capturePayPalOrder(orderId);
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