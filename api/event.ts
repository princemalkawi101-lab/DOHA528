// Vercel adapter: shares the same verified event implementation as the Replit API.
import { eventFailure } from "./_lib/event-diagnostics.js";

type Request = { method?: string; headers: Record<string, string | string[] | undefined>; body?: unknown };
type Response = { setHeader(name: string, value: string): void; status(code: number): Response; json(body: unknown): void; end(): void };
export default async function handler(req: Request, res: Response) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
  const authorization = String(req.headers.authorization || "");
  if (!/^(?:Bearer .+|Guest [a-f0-9]{64})$/.test(authorization)) {
    res.status(401).json({ error: "Authentication required" }); return;
  }
  // This adapter is CommonJS on Vercel; the API artifact is an ESM package.
  // Native import() crosses that boundary without compiling to require(ESM).
  try {
    const { eventIdentity } = await import("../artifacts/api-server/src/lib/event-identity.js");
    const { eventAction } = await import("../artifacts/api-server/src/lib/event-workflow.js");
    res.json(await eventAction(await eventIdentity(authorization), req.body));
  } catch (error) {
    // Imports can fail too; keep them inside the diagnostic boundary.
    const { EventError } = await import("../artifacts/api-server/src/lib/event-workflow.js").catch(() => ({ EventError: undefined }));
    const status = EventError && error instanceof EventError ? error.status : error instanceof Error && error.name === "ZodError" ? 400 : 500;
    res.status(status).json(status < 500 && error instanceof Error ? { error: error.message } : eventFailure(error, "event"));
  }
}
