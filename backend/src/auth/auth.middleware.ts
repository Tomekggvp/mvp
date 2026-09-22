import type { NextFunction, Request, Response } from "express";
import type { AuthUser } from "./auth.types.js";
import { createDemoAuth } from "./demo-auth.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const auth = createDemoAuth(process.env.DEMO_AUTH_SECRET ?? "local-only-secret");

export function requireEmployee(request: Request, response: Response, next: NextFunction) {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
  const user = token ? auth.verify(token) : null;
  if (!user) return response.status(401).json({ error: { code: "UNAUTHORIZED", message: "Требуется вход" } });
  request.user = user;
  return next();
}

export { auth };
