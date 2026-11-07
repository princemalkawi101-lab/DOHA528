// PayPal authenticates this endpoint by signature; Firebase login is not used.
import { eventFailure } from "./_lib/event-diagnostics.js";

type Request = { method?: string; headers: Record<string, string | string[] | undefined>; body?: unknown };
type Response = { setHeader(name: string, value: string): void; status(code: number): Response; json(body: unknown): void };

export default async function handler(req: Request, res: Response) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  try {
    const { eventPayPalWebhook } = await import("../artifacts/api-server/src/lib/event-workflow.js");
    res.status(200).json(await eventPayPalWebhook(req.headers, req.body));
  } catch (error) {
    const { EventError } = await import("../artifacts/api-server/src/lib/event-workflow.js").catch(() => ({ EventError: undefined }));
    const status = EventError && error instanceof EventError ? error.status
      : error instanceof Error && error.name === "ZodError" ? 400 : 503;
    res.status(status).json(status < 500 && error instanceof Error ? { error: error.message } : eventFailure(error, "event-webhook"));
  }
}
