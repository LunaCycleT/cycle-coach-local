import { describe, it, expect } from "vitest";
import { withAiQuota, QuotaExceededError, DAILY_AI_LIMIT, type QuotaStore } from "@/lib/luna/ai-quota";

// In-memory store mirroring the database rule: reserve only while count < limit.
function memoryStore() {
  const counts = new Map<string, number>();
  const tokens = new Map<string, number>();
  const store: QuotaStore = {
    async reserve(u, limit) {
      const c = counts.get(u) ?? 0;
      if (c >= limit) return -1;
      counts.set(u, c + 1);
      return c + 1;
    },
    async release(u) { counts.set(u, Math.max((counts.get(u) ?? 0) - 1, 0)); },
    async recordTokens(u, t) { tokens.set(u, (tokens.get(u) ?? 0) + t); },
  };
  return { store, counts, tokens };
}
const ok = () => Promise.resolve({ result: "hi", tokens: 42 });

describe("Ask Ordiva daily limit", () => {
  it("limit is 10 per day", () => expect(DAILY_AI_LIMIT).toBe(10));

  it("first request succeeds and records tokens", async () => {
    const m = memoryStore();
    expect(await withAiQuota(m.store, "a", ok)).toBe("hi");
    expect(m.counts.get("a")).toBe(1);
    expect(m.tokens.get("a")).toBe(42);
  });

  it("10th succeeds, 11th is blocked without calling AI", async () => {
    const m = memoryStore();
    for (let i = 0; i < 10; i++) await withAiQuota(m.store, "a", ok);
    let called = false;
    await expect(withAiQuota(m.store, "a", async () => { called = true; return { result: "", tokens: 0 }; }))
      .rejects.toBeInstanceOf(QuotaExceededError);
    expect(called).toBe(false);
  });

  it("concurrent requests never exceed 10", async () => {
    const m = memoryStore();
    const results = await Promise.allSettled(Array.from({ length: 15 }, () => withAiQuota(m.store, "a", ok)));
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(10);
  });

  it("failed AI call gives the slot back", async () => {
    const m = memoryStore();
    await expect(withAiQuota(m.store, "a", () => Promise.reject(new Error("timeout")))).rejects.toThrow("timeout");
    expect(m.counts.get("a")).toBe(0);
  });

  it("users have separate limits", async () => {
    const m = memoryStore();
    for (let i = 0; i < 10; i++) await withAiQuota(m.store, "a", ok);
    expect(await withAiQuota(m.store, "b", ok)).toBe("hi");
  });
});
