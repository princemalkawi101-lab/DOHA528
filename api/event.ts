// Vercel adapter: shares the same verified event implementation as the Replit API.

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
  const { eventIdentity } = await import("../artifacts/api-server/src/lib/event-identity.js");
  const { eventAction, EventError } = await import("../artifacts/api-server/src/lib/event-workflow.js");
  try {
    res.json(await eventAction(await eventIdentity(authorization), req.body));
  } catch (error) {
    const status = error instanceof EventError ? error.status : error instanceof Error && error.name === "ZodError" ? 400 : 500;
    res.status(status).json({ error: status < 500 && error instanceof Error ? error.message : "تعذّر إكمال العملية. يرجى المحاولة مجددًا؛ لا تدفع مرة أخرى إذا تم خصم المبلغ." });
  }
}
