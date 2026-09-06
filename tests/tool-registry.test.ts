import { describe, expect, it } from "vitest";
import {
  getActiveCategorySlugs,
  getEnabledTools,
  getFeaturedTools,
  getTool,
  searchTools,
  toPublicTool,
  tools,
} from "@/config/tools";
import { categories, categoryMap } from "@/config/categories";

describe("tool registry", () => {
  it("ships the ten launch tools", () => {
    expect(tools).toHaveLength(15);
    expect(getEnabledTools()).toHaveLength(15);
  });

  it("has a unique slug per tool", () => {
    const slugs = tools.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("assigns every tool to a real, enabled category", () => {
    for (const tool of tools) {
      const category = categoryMap.get(tool.category);
      expect(category, `${tool.slug} has unknown category`).toBeDefined();
      expect(category!.enabled).toBe(true);
    }
  });

  it("only reports categories that actually contain tools", () => {
    const active = getActiveCategorySlugs();
    for (const slug of active) {
      expect(getEnabledTools().some((t) => t.category === slug)).toBe(true);
    }
    // Categories with no tools must not appear.
    const empty = categories.filter(
      (c) => !getEnabledTools().some((t) => t.category === c.slug),
    );
    for (const category of empty) {
      expect(active).not.toContain(category.slug);
    }
  });

  it("gives every tool a positive credit cost", () => {
    for (const tool of tools) {
      expect(tool.creditCost, tool.slug).toBeGreaterThan(0);
    }
  });

  it("points related tools at slugs that exist", () => {
    const slugs = new Set(tools.map((t) => t.slug));
    for (const tool of tools) {
      for (const related of tool.related) {
        expect(slugs.has(related), `${tool.slug} → ${related}`).toBe(true);
        expect(related).not.toBe(tool.slug);
      }
    }
  });

  it("gives every tool the SEO content its landing page renders", () => {
    for (const tool of tools) {
      expect(tool.seoTitle.length, tool.slug).toBeGreaterThan(10);
      expect(tool.seoDescription.length, tool.slug).toBeGreaterThan(40);
      expect(tool.faq.length, tool.slug).toBeGreaterThanOrEqual(3);
      expect(tool.benefits.length, tool.slug).toBeGreaterThanOrEqual(3);
      expect(tool.howItWorks.length, tool.slug).toBeGreaterThanOrEqual(3);
      expect(tool.example.value.length, tool.slug).toBeGreaterThan(5);
    }
  });

  it("gives every tool at least one required input and a system prompt", () => {
    for (const tool of tools) {
      expect(tool.fields.some((f) => f.required), tool.slug).toBe(true);
      expect(tool.systemPrompt.length, tool.slug).toBeGreaterThan(50);
    }
  });

  it("gives select fields a default that is one of their options", () => {
    for (const tool of tools) {
      for (const field of tool.fields) {
        if (field.type !== "select") continue;
        expect(field.options?.length, `${tool.slug}.${field.name}`).toBeGreaterThan(0);
        if (field.defaultValue) {
          expect(
            field.options!.some((o) => o.value === field.defaultValue),
            `${tool.slug}.${field.name}`,
          ).toBe(true);
        }
      }
    }
  });

  it("never exposes the system prompt through the public shape", () => {
    for (const tool of tools) {
      const publicTool = toPublicTool(tool) as Record<string, unknown>;
      expect(publicTool.systemPrompt).toBeUndefined();
      expect(publicTool.outputSchema).toBeUndefined();
      expect(JSON.stringify(publicTool)).not.toContain(
        tool.systemPrompt.slice(0, 40),
      );
    }
  });

  it("features at most six tools on the homepage", () => {
    expect(getFeaturedTools(6).length).toBeLessThanOrEqual(6);
    expect(getFeaturedTools(6).every((t) => t.featured)).toBe(true);
  });

  it("finds SEO tools when searching for 'seo'", () => {
    const results = searchTools("seo").map((t) => t.slug);
    expect(results).toContain("seo-meta-generator");
    expect(results).toContain("schema-generator");
  });

  it("returns undefined for an unknown slug rather than throwing", () => {
    expect(getTool("not-a-real-tool")).toBeUndefined();
  });
});
