import type { NextFunction, Request, Response } from "express";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

const firebaseKeys = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

export type FirebaseUser = JWTPayload & {
  sub: string;
  email?: string;
  name?: string;
  admin?: boolean;
  email_verified?: boolean;
};

declare global {
  namespace Express {
    interface Request {
      firebaseUser?: FirebaseUser;
    }
  }
}

export async function requireFirebaseUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  const token = req.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  if (!projectId || !token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const { payload } = await jwtVerify(token, firebaseKeys, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });
    if (!payload.sub) throw new Error("Token has no subject");
    req.firebaseUser = payload as FirebaseUser;
    next();
  } catch (error) {
    req.log.warn({ error: error instanceof Error ? error.message : String(error) }, "Rejected invalid Firebase token");
    res.status(401).json({ error: "Invalid or expired authentication" });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const user = req.firebaseUser;
  if (user?.admin === true || user?.email === "admin@dohahealing.com") {
    next();
    return;
  }
  res.status(403).json({ error: "Administrator access required" });
}