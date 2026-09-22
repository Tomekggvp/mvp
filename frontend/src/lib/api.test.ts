import { describe, expect, it, vi } from "vitest";
import { createApiClient } from "./api";

describe("api client", () => {
  it("injects the session token and parses JSON", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const api = createApiClient(fetcher, () => "token-123");
    await expect(api.getBoard()).resolves.toEqual({ ok: true });
    expect((fetcher.mock.calls[0][1]?.headers as Headers).get("Authorization")).toBe("Bearer token-123");
  });

  it("normalizes API errors and invokes unauthorized callback", async () => {
    const onUnauthorized = vi.fn();
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { message: "Nope" } }), { status: 401 }));
    const api = createApiClient(fetcher, () => null, onUnauthorized);
    await expect(api.getBoard()).rejects.toThrow("Nope");
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });
});
