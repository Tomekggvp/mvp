import { createHmac, timingSafeEqual } from "node:crypto";
import type { AuthSession, AuthUser } from "./auth.types.js";

const demoUser: AuthUser = { id: "employee-demo", email: "employee@demo.local", role: "employee" };

export function createDemoAuth(secret: string) {
  const sign = (payload: string) => createHmac("sha256", secret).update(payload).digest("hex");
  return {
    login(email: string, password: string): AuthSession {
      if (email !== demoUser.email || password !== "demo-kanban") throw new Error("Invalid credentials");
      const payload = Buffer.from(JSON.stringify(demoUser)).toString("base64url");
      return { token: `${payload}.${sign(payload)}`, user: demoUser };
    },
    verify(token: string): AuthUser | null {
      const [payload, signature] = token.split(".");
      if (!payload || !signature) return null;
      const expected = sign(payload);
      if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
      try {
        return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AuthUser;
      } catch {
        return null;
      }
    },
  };
}
