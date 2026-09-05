import { describe, expect, it } from "vitest";
import { getTool } from "@/config/tools";
import {
  buildToolInputSchema,
  contactSchema,
  createPaymentSchema,
  generateRequestSchema,
  normalizeToolInput,
  profileSchema,
} from "@/lib/security/validation";
import { checkInput } from "@/lib/ai/moderation";

const writer = getTool("ai-writer")!;
const seo = getTool("seo-meta-generator")!;

describe("generation request validation", () => {
  it("accepts a well-formed request", () => {
    const result = generateRequestSchema.safeParse({
      toolSlug: "ai-writer",
      input: { topic: "A launch post" },
      action: "generate",
    });
    expect(result.success).toBe(true);
  });

  it("ignores a client-supplied credit cost", () => {
    const result = generateRequestSchema.safeParse({
      toolSlug: "ai-writer",
      input: { topic: "A launch post" },
      creditCost: 0,
      model: "some-cheap-model",
    });
    expect(result.success).toBe(true);
    // The parsed object carries only the fields the schema declares, so a
    // forged cost or model never reaches the generation path.
    expect(result.success && "creditCost" in result.data).toBe(false);
    expect(result.success && "model" in result.data).toBe(false);
  });

  it("rejects an unknown action", () => {
    const result = generateRequestSchema.safeParse({
      toolSlug: "ai-writer",
      input: {},
      action: "delete-everything",
    });
    expect(result.success).toBe(false);
  });
});

describe("per-tool input schemas", () => {
  it("requires the tool's required fields", () => {
    const schema = buildToolInputSchema(writer);
    expect(schema.safeParse({ tone: "friendly" }).success).toBe(false);
    expect(schema.safeParse({ topic: "A launch post" }).success).toBe(true);
  });

  it("rejects a select value outside the declared options", () => {
    const schema = buildToolInputSchema(writer);
    const result = schema.safeParse({ topic: "Hello", tone: "sarcastic" });
    expect(result.success).toBe(false);
  });

  it("enforces the per-field maximum length", () => {
    const schema = buildToolInputSchema(seo);
    const result = schema.safeParse({
      topic: "A page",
      primaryKeyword: "x".repeat(500),
    });
    expect(result.success).toBe(false);
  });

  it("applies select defaults and drops unknown keys", () => {
    const normalized = normalizeToolInput(writer, {
      topic: "A launch post",
      injected: "should not survive",
    } as Record<string, string>);

    expect(normalized.topic).toBe("A launch post");
    expect(normalized.tone).toBe("professional");
    expect(normalized.length).toBe("medium");
    expect("injected" in normalized).toBe(false);
  });
});

describe("input limits", () => {
  it("rejects input over the tool's character ceiling", () => {
    const result = checkInput({ text: "a".repeat(31_000) }, writer.maxInputChars);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("limit");
  });

  it("rejects empty input", () => {
    expect(checkInput({ topic: "   " }, 10_000).ok).toBe(false);
  });

  it("rejects a single repeated character", () => {
    expect(checkInput({ topic: "a".repeat(900) }, 10_000).ok).toBe(false);
  });

  it("accepts normal input", () => {
    expect(checkInput({ topic: "Write a launch post" }, 10_000).ok).toBe(true);
  });
});

describe("other request schemas", () => {
  it("accepts only a plan id at checkout", () => {
    const result = createPaymentSchema.safeParse({
      planId: "lifetime",
      amount: 0.01,
      credits: 999_999,
    });
    expect(result.success).toBe(true);
    // Price and credits are never carried through from the client.
    expect(result.success && "amount" in result.data).toBe(false);
    expect(result.success && "credits" in result.data).toBe(false);
  });

  it("validates contact submissions", () => {
    expect(
      contactSchema.safeParse({
        name: "Alex",
        email: "not-an-email",
        message: "Hello there, this is long enough.",
      }).success,
    ).toBe(false);

    expect(
      contactSchema.safeParse({
        name: "Alex",
        email: "alex@example.com",
        message: "Hello there, this is long enough.",
      }).success,
    ).toBe(true);
  });

  it("does not accept role or credits on a profile update", () => {
    const result = profileSchema.safeParse({
      full_name: "Alex",
      role: "admin",
      credits: 1_000_000,
    });
    expect(result.success).toBe(true);
    expect(result.success && "role" in result.data).toBe(false);
    expect(result.success && "credits" in result.data).toBe(false);
  });
});
