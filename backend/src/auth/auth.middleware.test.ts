import { describe, expect, it } from "vitest";
import { createDemoAuth } from "./demo-auth.js";

describe("demo auth", () => {
  it("accepts the documented demo credentials and rejects invalid ones", () => {
    const auth = createDemoAuth("test-secret");
    const session = auth.login("employee@demo.local", "demo-kanban");

    expect(session.user.role).toBe("employee");
    expect(auth.verify(session.token)?.email).toBe("employee@demo.local");
    expect(() => auth.login("employee@demo.local", "wrong")).toThrow("Invalid credentials");
  });
});
