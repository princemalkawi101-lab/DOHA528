const LIVE_API_URL = "https://api-m.paypal.com";
const SANDBOX_API_URL = "https://api-m.sandbox.paypal.com";

export type PayPalErrorDetail = {
  issue?: string;
  description?: string;
  field?: string;
  value?: string;
  location?: string;
};

type PayPalResponseBody = {
  access_token?: unknown;
  id?: unknown;
  error?: unknown;
  error_description?: unknown;
  name?: unknown;
  message?: unknown;
  debug_id?: unknown;
  status?: unknown;
  purchase_units?: unknown;
  details?: unknown;
};

export class PayPalConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PayPalConfigurationError";
  }
}

export class PayPalApiError extends Error {
  readonly operation: string;
  readonly status: number;
  readonly providerName: string;
  readonly debugId: string;
  readonly details: PayPalErrorDetail[];

  constructor(
    operation: string,
    status: number,
    body: PayPalResponseBody,
  ) {
    const providerName =
      typeof body.error === "string"
        ? body.error
        : typeof body.name === "string"
          ? body.name
          : "PAYPAL_REQUEST_FAILED";
    const message =
      typeof body.error_description === "string"
        ? body.error_description
        : typeof body.message === "string"
          ? body.message
          : `PayPal ${operation} request failed`;

    super(message);
    this.name = "PayPalApiError";
    this.operation = operation;
    this.status = status;
    this.providerName = providerName;
    this.debugId = typeof body.debug_id === "string" ? body.debug_id : "";
    this.details = normalizeDetails(body.details);
  }
}

function normalizeDetails(details: unknown): PayPalErrorDetail[] {
  if (!Array.isArray(details)) return [];

  return details.slice(0, 10).flatMap((detail) => {
    if (!detail || typeof detail !== "object") return [];
    const value = detail as Record<string, unknown>;
    return [{
      ...(typeof value.issue === "string" ? { issue: value.issue } : {}),
      ...(typeof value.description === "string"
        ? { description: value.description }
        : {}),
      ...(typeof value.field === "string" ? { field: value.field } : {}),
      ...(typeof value.value === "string" ? { value: value.value } : {}),
      ...(typeof value.location === "string" ? { location: value.location } : {}),
    }];
  });
}

async function readResponseBody(response: Response): Promise<PayPalResponseBody> {
  const text = await response.text();
  if (!text) return {};

  try {
    const parsed: unknown = JSON.parse(text);
    if (parsed && typeof parsed === "object") {
      return parsed as PayPalResponseBody;
    }
  } catch {
    // PayPal normally returns JSON, but retain a bounded diagnostic for
    // unexpected HTML/text responses without returning it to the client.
  }

  return { message: text.slice(0, 500) };
}

function getPayPalConfig() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET ?? process.env.PAYPAL_CLIENT_SECRET;
  const environment = (process.env.PAYPAL_ENVIRONMENT ?? "live").toLowerCase();

  if (!clientId || !secret) {
    throw new PayPalConfigurationError(
      "PayPal credentials are not configured on the API server",
    );
  }

  if (environment !== "live" && environment !== "sandbox") {
    throw new PayPalConfigurationError(
      `Unsupported PAYPAL_ENVIRONMENT value: "${environment}"`,
    );
  }

  return {
    clientId,
    secret,
    baseUrl: environment === "sandbox" ? SANDBOX_API_URL : LIVE_API_URL,
    environment,
  };
}

export function getPayPalRuntimeConfig() {
  const currency =
    process.env.PAYPAL_CURRENCY ??
    process.env.VITE_PAYPAL_CURRENCY ??
    "USD";
  const conversionRate =
    Number(
      process.env.PAYPAL_JOD_TO_USD ?? process.env.VITE_PAYPAL_JOD_TO_USD,
    ) || 1.41;

  return { currency, conversionRate };
}

export async function getPayPalAccessToken(): Promise<string> {
  const config = getPayPalConfig();
  const auth = Buffer.from(`${config.clientId}:${config.secret}`).toString(
    "base64",
  );
  let response: Response;

  try {
    response = await fetch(`${config.baseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
  } catch (error) {
    throw new PayPalApiError("authentication", 0, {
      message: error instanceof Error ? error.message : "Network request failed",
    });
  }

  const body = await readResponseBody(response);
  if (!response.ok) {
    throw new PayPalApiError("authentication", response.status, body);
  }

  if (typeof body.access_token !== "string" || !body.access_token) {
    throw new PayPalApiError("authentication", response.status, {
      ...body,
      message: "PayPal authentication response did not include an access token",
    });
  }

  return body.access_token;
}

export async function createPayPalOrder(input: {
  cart: Array<{
    titleEn?: string;
    nameKey?: string;
    jod: number;
    qty: number;
  }>;
}): Promise<{ id: string; amount: string; currency: string }> {
  const config = getPayPalConfig();
  const runtime = getPayPalRuntimeConfig();
  const totalJod = input.cart.reduce(
    (sum, item) => sum + item.jod * item.qty,
    0,
  );
  const amount = (totalJod * runtime.conversionRate).toFixed(2);
  const description = input.cart
    .map((item) => item.titleEn || item.nameKey || "Item")
    .join(", ")
    .slice(0, 127);
  const accessToken = await getPayPalAccessToken();
  let response: Response;

  try {
    response = await fetch(`${config.baseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          amount: { currency_code: runtime.currency, value: amount },
          description,
        }],
      }),
    });
  } catch (error) {
    throw new PayPalApiError("create-order", 0, {
      message: error instanceof Error ? error.message : "Network request failed",
    });
  }

  const body = await readResponseBody(response);
  if (!response.ok) {
    throw new PayPalApiError("create-order", response.status, body);
  }

  if (typeof body.id !== "string" || !body.id) {
    throw new PayPalApiError("create-order", response.status, {
      ...body,
      message: "PayPal order response did not include an order id",
    });
  }

  return { id: body.id, amount, currency: runtime.currency };
}

export async function capturePayPalOrder(orderId: string): Promise<{
  captureStatus: string;
  orderId: string;
  captureId: string;
  amount: string;
}> {
  const config = getPayPalConfig();
  const accessToken = await getPayPalAccessToken();
  let response: Response;

  try {
    response = await fetch(
      `${config.baseUrl}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    throw new PayPalApiError("capture-order", 0, {
      message: error instanceof Error ? error.message : "Network request failed",
    });
  }

  const body = await readResponseBody(response);
  if (!response.ok) {
    throw new PayPalApiError("capture-order", response.status, body);
  }

  const purchaseUnit = Array.isArray(body.purchase_units)
    ? body.purchase_units[0]
    : undefined;
  const payments =
    purchaseUnit && typeof purchaseUnit === "object"
      ? (purchaseUnit as Record<string, unknown>).payments
      : undefined;
  const captures =
    payments && typeof payments === "object"
      ? (payments as Record<string, unknown>).captures
      : undefined;
  const capture =
    Array.isArray(captures) && captures[0] && typeof captures[0] === "object"
      ? (captures[0] as Record<string, unknown>)
      : undefined;
  const captureAmount =
    capture?.amount && typeof capture.amount === "object"
      ? (capture.amount as Record<string, unknown>).value
      : "";

  return {
    captureStatus: typeof body.status === "string" ? body.status : "",
    orderId,
    captureId: typeof capture?.id === "string" ? capture.id : "",
    amount: typeof captureAmount === "string" ? captureAmount : "",
  };
}

export async function getPayPalOrder(orderId: string): Promise<{
  captureStatus: string;
  orderId: string;
  captureId: string;
  amount: string;
}> {
  const config = getPayPalConfig();
  const accessToken = await getPayPalAccessToken();
  const response = await fetch(
    `${config.baseUrl}/v2/checkout/orders/${encodeURIComponent(orderId)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  const body = await readResponseBody(response);
  if (!response.ok) throw new PayPalApiError("get-order", response.status, body);
  const purchaseUnit = Array.isArray(body.purchase_units) ? body.purchase_units[0] : undefined;
  const payments = purchaseUnit && typeof purchaseUnit === "object"
    ? (purchaseUnit as Record<string, unknown>).payments : undefined;
  const captures = payments && typeof payments === "object"
    ? (payments as Record<string, unknown>).captures : undefined;
  const capture = Array.isArray(captures) && captures[0] && typeof captures[0] === "object"
    ? captures[0] as Record<string, unknown> : undefined;
  const amount = capture?.amount && typeof capture.amount === "object"
    ? (capture.amount as Record<string, unknown>).value : "";
  return {
    captureStatus: typeof body.status === "string" ? body.status : "",
    orderId,
    captureId: typeof capture?.id === "string" ? capture.id : "",
    amount: typeof amount === "string" ? amount : "",
  };
}

export function isPayPalConfigurationError(
  error: unknown,
): error is PayPalConfigurationError {
  return error instanceof PayPalConfigurationError;
}

export function isPayPalApiError(error: unknown): error is PayPalApiError {
  return error instanceof PayPalApiError;
}