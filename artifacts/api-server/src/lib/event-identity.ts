import { createHash } from "node:crypto";
import { eventFirebase } from "./event-firebase.js";
import { EventError, type EventUser } from "./event-workflow.js";

// Guest capabilities identify a booking browser, not a Firebase account.
// Store only their one-way digest as userId; never persist or log the token.
export async function eventIdentity(authorization: string): Promise<EventUser> {
  const guest = authorization.match(/^Guest ([a-f0-9]{64})$/);
  if (guest) {
    return { uid: `guest_${createHash("sha256").update(`event-guest:${guest[1]}`).digest("hex")}` };
  }
  const token = authorization.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw new EventError(401, "Missing or invalid booking session.");
  try {
    const user = await eventFirebase().auth.verifyIdToken(token, true);
    return { uid: user.uid, email: user.email, admin: user.admin === true };
  } catch {
    throw new EventError(401, "Invalid or expired authentication");
  }
}
