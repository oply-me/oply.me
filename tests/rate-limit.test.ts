import { describe, expect, it } from "vitest";
import { RATE_LIMITS, getClientIp, rateLimit } from "@/lib/security/rate-limit";

describe("rate limiting", () => {
  it("allows requests up to the limit and blocks the next one", async () => {
    const user = `user-${Math.random()}`;
    const limit = RATE_LIMITS.generate.limit;

    for (let i = 0; i < limit; i++) {
      const result = await rateLimit("generate", user);
      expect(result.success, `request ${i + 1}`).toBe(true);
    }

    const blocked = await rateLimit("generate", user);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("keeps separate budgets per user", async () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;

    for (let i = 0; i < RATE_LIMITS.generate.limit; i++) {
      await rateLimit("generate", a);
    }

    expect((await rateLimit("generate", a)).success).toBe(false);
    expect((await rateLimit("generate", b)).success).toBe(true);
  });

  it("keeps separate budgets per scope", async () => {
    const user = `scoped-${Math.random()}`;
    for (let i = 0; i < RATE_LIMITS.generate.limit; i++) {
      await rateLimit("generate", user);
    }

    expect((await rateLimit("generate", user)).success).toBe(false);
    expect((await rateLimit("payment", user)).success).toBe(true);
  });

  it("limits AI generation more tightly than general API traffic", () => {
    expect(RATE_LIMITS.generate.limit).toBeLessThan(RATE_LIMITS.api.limit);
  });

  it("reads the client IP from proxy headers", () => {
    expect(
      getClientIp(
        new Request("https://oply.me", {
          headers: { "x-forwarded-for": "203.0.113.9, 70.41.3.18" },
        }),
      ),
    ).toBe("203.0.113.9");

    expect(getClientIp(new Request("https://oply.me"))).toBe("unknown");
  });
});
