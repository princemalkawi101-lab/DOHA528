// PayPal authenticates this endpoint by signature; Firebase login is not used.

type Request = { method?: string; headers: Record<string, string | string[] | undefined>; body?: unknown };
type Response = { setHeader(name: string, value: string): void; status(code: number): Response; json(body: unknown): void };

export default async function handler(req: Request, res: Response) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const { eventPayPalWebhook, EventError } = await import("../artifacts/api-server/src/lib/event-workflow.js");
  try {
    res.status(200).json(await eventPayPalWebhook(req.headers, req.body));
  } catch (error) {
    const status = error instanceof EventError ? error.status
      : error instanceof Error && error.name === "ZodError" ? 400 : 503;
    res.status(status).json({ error: status < 500 && error instanceof Error ? error.message : "Payment reconciliation unavailable. Retry delivery." });
  }
}
