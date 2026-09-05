import { describe, expect, it } from "vitest";
import { estimateCost, getModelInfo, MODELS } from "@/lib/ai/models";
import { getOutputSchema, outputSchemas } from "@/lib/ai/schemas";
import { AIProviderError } from "@/lib/ai/providers/types";
import { tools } from "@/config/tools";

describe("model registry", () => {
  it("prices every registered model", () => {
    for (const model of Object.values(MODELS)) {
      expect(model.inputPricePerMTok).toBeGreaterThan(0);
      expect(model.outputPricePerMTok).toBeGreaterThan(0);
    }
  });

  it("estimates cost from token counts", () => {
    // 1M input + 1M output on Opus 5 → $5 + $25.
    expect(estimateCost("claude-opus-5", 1_000_000, 1_000_000)).toBeCloseTo(30);
    expect(estimateCost("claude-opus-5", 1_000, 500)).toBeCloseTo(0.0175, 6);
  });

  it("returns null rather than a made-up figure when data is missing", () => {
    expect(estimateCost("claude-opus-5", null, 100)).toBeNull();
    expect(estimateCost("claude-opus-5", 100, undefined)).toBeNull();
    expect(estimateCost("unknown-model", 100, 100)).toBeNull();
    expect(getModelInfo("unknown-model")).toBeUndefined();
  });
});

describe("structured output schemas", () => {
  it("has a schema for every tool that declares one", () => {
    for (const tool of tools) {
      if (!tool.outputSchema) continue;
      expect(getOutputSchema(tool.outputSchema), tool.slug).toBeDefined();
    }
  });

  it("rejects a result missing a required key", () => {
    const result = outputSchemas.seoMeta.safeParse({
      seo_title: "A title",
      meta_description: "A description",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a complete SEO result", () => {
    const result = outputSchemas.seoMeta.safeParse({
      seo_title: "AI Productivity Tools for Small Teams",
      meta_description: "A description of the page contents.",
      slug: "ai-productivity-tools",
      og_title: "AI Productivity Tools",
      og_description: "A social description.",
    });
    expect(result.success).toBe(true);
  });

  it("requires the reply tool to return all three lengths", () => {
    expect(
      outputSchemas.reply.safeParse({ short: "a", standard: "b" }).success,
    ).toBe(false);
    expect(
      outputSchemas.reply.safeParse({ short: "a", standard: "b", detailed: "c" })
        .success,
    ).toBe(true);
  });
});

describe("provider errors", () => {
  it("marks transient failures as retryable", () => {
    const transient = new AIProviderError("busy", undefined, true);
    const permanent = new AIProviderError("bad request");
    expect(transient.retryable).toBe(true);
    expect(permanent.retryable).toBe(false);
  });

  it("carries a user-safe message rather than a provider stack trace", () => {
    const error = new AIProviderError(
      "We couldn't generate your result.",
      new Error("upstream 500: api_key=sk-secret"),
    );
    expect(error.message).not.toContain("sk-secret");
  });
});
