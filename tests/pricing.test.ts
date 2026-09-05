import { describe, expect, it } from "vitest";
import { getPlan, pricingPlans } from "@/config/pricing";

describe("pricing configuration", () => {
  it("matches the published packs", () => {
    expect(getPlan("starter")).toMatchObject({ price: 9, credits: 500 });
    expect(getPlan("pro")).toMatchObject({ price: 19, credits: 2500 });
    expect(getPlan("lifetime")).toMatchObject({ price: 49, credits: 10000 });
    expect(getPlan("founder")).toMatchObject({ price: 99, credits: 30000 });
  });

  it("rejects an unknown plan id rather than defaulting to one", () => {
    // The payment route treats undefined as an invalid plan, so a forged
    // planId cannot fall through to a real plan.
    expect(getPlan("free")).toBeUndefined();
    expect(getPlan("")).toBeUndefined();
    expect(getPlan("lifetime ")).toBeUndefined();
  });

  it("gives better value per credit as the pack grows", () => {
    const rates = pricingPlans.map((p) => p.price / p.credits);
    for (let i = 1; i < rates.length; i++) {
      expect(rates[i]).toBeLessThan(rates[i - 1]);
    }
  });

  it("marks exactly one plan as most popular", () => {
    expect(pricingPlans.filter((p) => p.highlight)).toHaveLength(1);
  });

  it("never advertises a recurring charge", () => {
    for (const plan of pricingPlans) {
      const text = plan.features.join(" ").toLowerCase();
      expect(text).toContain("one-time payment");
      expect(text).not.toContain("per month");
      expect(text).not.toContain("unlimited");
    }
  });
});
