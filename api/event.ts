// Vercel adapter: shares the same verified event implementation as the Replit API.
import { eventFirebase } from "../artifacts/api-server/src/lib/event-firebase.js";
import { eventAction, EventError } from "../artifacts/api-server/src/lib/event-workflow.js";

type Request = { method?: string; headers: Record<string, string | string[] | undefined>; body?: unknown };
type Response = { setHeader(name: string, value: string): void; status(code: number): Response; json(body: unknown): void; end(): void };
export default async function handler(req: Request, res: Response) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
  const token = String(req.headers.authorization || "").match(/^Bearer (.+)$/i)?.[1];
  if (!token) { res.status(401).json({ error: "Authentication required" }); return; }
  let user;
  try { user = await eventFirebase().auth.verifyIdToken(token, true); }
  catch { res.status(401).json({ error: "Invalid or expired authentication" }); return; }
  try {
    res.json(await eventAction({ uid: user.uid, email: user.email, admin: user.admin === true }, req.body));
  } catch (error) {
    const status = error instanceof EventError ? error.status : error instanceof Error && error.name === "ZodError" ? 400 : 500;
    res.status(status).json({ error: status < 500 && error instanceof Error ? error.message : "تعذّر إكمال العملية. يرجى المحاولة مجددًا؛ لا تدفع مرة أخرى إذا تم خصم المبلغ." });
  }
}
