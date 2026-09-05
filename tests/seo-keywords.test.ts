import { describe, expect, it } from "vitest";
import {
  getEnabledTools,
  searchTools,
  toolMetaKeywords,
  tools,
  type ToolKeywords,
} from "@/config/tools";
import { categories } from "@/config/categories";
import { keywordClusters, siteKeywords } from "@/config/site";

/**
 * Guards on the semantic keyword map. The point of these is less "is the SEO
 * good" and more "can a dishonest or malformed term reach a crawler" — the
 * banned-term sweep and the questions/FAQ alignment are the two that matter
 * most, because both would otherwise ship a claim the page cannot back up.
 */

/** Layer size bounds, from the keyword model. */
const BOUNDS = {
  secondary: [6, 10],
  longTail: [8, 14],
  entities: [8, 15],
  questions: [4, 8],
} as const;

const MAX_TERM_LENGTH = 80;

/**
 * Claims Oply will not make. Checked against every keyword, title, description
 * and FAQ entry in the registry — a term only has to appear once, anywhere, to
 * turn honest markup into a promise the product cannot keep.
 */
const BANNED_TERMS = [
  "rank #1",
  "guaranteed rankings",
  "undetectable",
  "bypass ai detection",
  "plagiarism free guarantee",
];

const enabled = getEnabledTools();

function normalise(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").replace(/[^a-z0-9 ]/g, "").trim();
}

function layers(keywords: ToolKeywords): [keyof typeof BOUNDS, string[]][] {
  return [
    ["secondary", keywords.secondary],
    ["longTail", keywords.longTail],
    ["entities", keywords.entities],
    ["questions", keywords.questions],
  ];
}

describe("tool keyword maps", () => {
  it("gives every enabled tool a keyword map with all five layers", () => {
    for (const tool of enabled) {
      expect(tool.keywords, tool.slug).toBeDefined();
      expect(tool.keywords.primary.length, tool.slug).toBeGreaterThan(2);
      expect(
        ["informational", "commercial", "transactional"],
        tool.slug,
      ).toContain(tool.keywords.intent);
    }
  });

  it("keeps every layer inside its size bounds", () => {
    for (const tool of enabled) {
      for (const [layer, terms] of layers(tool.keywords)) {
        const [min, max] = BOUNDS[layer];
        expect(terms.length, `${tool.slug}.${layer}`).toBeGreaterThanOrEqual(min);
        expect(terms.length, `${tool.slug}.${layer}`).toBeLessThanOrEqual(max);
      }
    }
  });

  it("owns a unique primary term per tool, so pages cannot cannibalise", () => {
    const primaries = enabled.map((t) => t.keywords.primary.toLowerCase());
    expect(new Set(primaries).size).toBe(primaries.length);
  });

  it("never repeats a term inside its own layer", () => {
    for (const tool of enabled) {
      for (const [layer, terms] of layers(tool.keywords)) {
        const seen = terms.map((t) => t.toLowerCase());
        expect(new Set(seen).size, `${tool.slug}.${layer}`).toBe(terms.length);
      }
    }
  });

  it("has no empty or runaway-length terms", () => {
    for (const tool of enabled) {
      const all = [
        tool.keywords.primary,
        ...tool.keywords.secondary,
        ...tool.keywords.longTail,
        ...tool.keywords.entities,
      ];
      for (const term of all) {
        expect(term.trim().length, `${tool.slug}: "${term}"`).toBeGreaterThan(0);
        expect(term.length, `${tool.slug}: "${term}"`).toBeLessThanOrEqual(
          MAX_TERM_LENGTH,
        );
      }
    }
  });

  it("keeps long-tail phrases to four words or more", () => {
    for (const tool of enabled) {
      for (const phrase of tool.keywords.longTail) {
        expect(
          phrase.trim().split(/\s+/).length,
          `${tool.slug}: "${phrase}"`,
        ).toBeGreaterThanOrEqual(4);
      }
    }
  });
});

describe("tool metadata carries the keyword map", () => {
  it("puts the primary term in the SEO title", () => {
    for (const tool of enabled) {
      expect(
        tool.seoTitle.toLowerCase(),
        `${tool.slug}: "${tool.seoTitle}"`,
      ).toContain(tool.keywords.primary.toLowerCase());
    }
  });

  it("keeps the SEO description inside the snippet window", () => {
    for (const tool of enabled) {
      expect(
        tool.seoDescription.length,
        `${tool.slug} (${tool.seoDescription.length} chars)`,
      ).toBeGreaterThanOrEqual(120);
      expect(
        tool.seoDescription.length,
        `${tool.slug} (${tool.seoDescription.length} chars)`,
      ).toBeLessThanOrEqual(165);
    }
  });

  it("works the primary and at least two secondary terms into the description", () => {
    for (const tool of enabled) {
      const description = tool.seoDescription.toLowerCase();
      expect(description, tool.slug).toContain(
        tool.keywords.primary.toLowerCase(),
      );
      const matched = tool.keywords.secondary.filter((term) =>
        description.includes(term.toLowerCase()),
      );
      expect(matched.length, `${tool.slug} matched ${matched.join(" / ")}`)
        .toBeGreaterThanOrEqual(2);
    }
  });

  it("emits a capped, primary-first keyword list", () => {
    for (const tool of enabled) {
      const emitted = toolMetaKeywords(tool);
      expect(emitted[0], tool.slug).toBe(tool.keywords.primary);
      expect(emitted.length, tool.slug).toBeLessThanOrEqual(15);
      expect(new Set(emitted).size, tool.slug).toBe(emitted.length);
    }
  });
});

describe("on-page honesty", () => {
  it("answers every question it lists, so faqJsonLd never over-claims", () => {
    for (const tool of enabled) {
      const answered = new Set(tool.faq.map((f) => normalise(f.question)));
      for (const question of tool.keywords.questions) {
        expect(
          answered.has(normalise(question)),
          `${tool.slug} lists "${question}" with no FAQ entry`,
        ).toBe(true);
      }
    }
  });

  it("gives every FAQ entry a real answer", () => {
    for (const tool of enabled) {
      for (const faq of tool.faq) {
        expect(faq.answer.trim().length, `${tool.slug}: ${faq.question}`)
          .toBeGreaterThan(20);
      }
    }
  });

  it("never uses a banned claim anywhere in the registry", () => {
    const haystacks: [string, string][] = [];
    for (const tool of tools) {
      haystacks.push([`${tool.slug}.seoTitle`, tool.seoTitle]);
      haystacks.push([`${tool.slug}.seoDescription`, tool.seoDescription]);
      haystacks.push([`${tool.slug}.description`, tool.description]);
      haystacks.push([`${tool.slug}.tagline`, tool.tagline]);
      haystacks.push([
        `${tool.slug}.keywords`,
        [
          tool.keywords.primary,
          ...tool.keywords.secondary,
          ...tool.keywords.longTail,
          ...tool.keywords.entities,
          ...tool.keywords.questions,
        ].join(" | "),
      ]);
      for (const faq of tool.faq) {
        haystacks.push([`${tool.slug}.faq`, `${faq.question} ${faq.answer}`]);
      }
      for (const benefit of tool.benefits) {
        haystacks.push([
          `${tool.slug}.benefits`,
          `${benefit.title} ${benefit.body}`,
        ]);
      }
      haystacks.push([`${tool.slug}.howItWorks`, tool.howItWorks.join(" ")]);
    }
    for (const category of categories) {
      haystacks.push([
        `category:${category.slug}`,
        [
          category.description,
          category.seoDescription,
          category.primaryKeyword,
          ...category.keywords,
        ].join(" | "),
      ]);
    }
    haystacks.push(["site.keywords", siteKeywords.join(" | ")]);

    for (const [where, text] of haystacks) {
      for (const banned of BANNED_TERMS) {
        expect(text.toLowerCase(), `${where} contains "${banned}"`).not.toContain(
          banned,
        );
      }
    }
  });
});

describe("category hubs", () => {
  it("gives every category a primary keyword, a cluster and a description", () => {
    for (const category of categories) {
      expect(category.primaryKeyword.length, category.slug).toBeGreaterThan(2);
      expect(category.keywords.length, category.slug).toBeGreaterThanOrEqual(8);
      expect(category.keywords.length, category.slug).toBeLessThanOrEqual(14);
      expect(category.seoDescription.length, category.slug).toBeGreaterThan(80);
      expect(new Set(category.keywords).size, category.slug).toBe(
        category.keywords.length,
      );
    }
  });

  it("keeps hub primary keywords unique", () => {
    const primaries = categories.map((c) => c.primaryKeyword.toLowerCase());
    expect(new Set(primaries).size).toBe(primaries.length);
  });

  it("does not let a hub steal a tool's primary term", () => {
    const toolPrimaries = new Set(
      enabled.map((t) => t.keywords.primary.toLowerCase()),
    );
    for (const category of categories) {
      expect(
        toolPrimaries.has(category.primaryKeyword.toLowerCase()),
        `${category.slug} claims a tool's head term`,
      ).toBe(false);
    }
  });
});

describe("site-level clusters", () => {
  it("keeps the three clusters populated and de-duplicated", () => {
    expect(keywordClusters.brand.length).toBeGreaterThan(2);
    expect(keywordClusters.category.length).toBeGreaterThan(4);
    expect(keywordClusters.commercial.length).toBeGreaterThan(4);
    expect(new Set(siteKeywords).size).toBe(siteKeywords.length);
  });
});

describe("keyword-aware search", () => {
  it("finds the AI Rewriter from an entity it never names in its copy", () => {
    expect(searchTools("paraphrase")[0]?.slug).toBe("ai-rewriter");
  });

  it("finds the schema generator from 'json-ld'", () => {
    expect(searchTools("json-ld").map((t) => t.slug)).toContain(
      "schema-generator",
    );
  });

  it("still ranks an exact tool name above a keyword match", () => {
    expect(searchTools("AI Writer")[0]?.slug).toBe("ai-writer");
  });

  it("finds the summarizer from 'tldr'", () => {
    expect(searchTools("tldr").map((t) => t.slug)).toContain("ai-summarizer");
  });
});
