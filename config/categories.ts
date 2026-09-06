export interface CategoryDefinition {
  slug: string;
  name: string;
  /** Short label used in filter pills. */
  label: string;
  description: string;
  /** lucide-react icon name, resolved by components/icon.tsx */
  icon: string;
  /**
   * The category's own hue on the brand wheel (0-360). Cards, icon tiles and
   * glows are derived from it, so the tool grid reads as a colour system
   * rather than nine identical violet boxes.
   */
  hue: number;
  /**
   * Head term for the category hub page. Hubs are the pillar pages and tools
   * are the spokes, so this is broader than any single tool's `primary`.
   */
  primaryKeyword: string;
  /**
   * Cluster terms the hub should cover: the union of themes across its tools,
   * plus the category-level terms no individual tool owns. 8-14.
   */
  keywords: string[];
  /** Longer, human sentence used as the hub page's meta description. */
  seoDescription: string;
  sortOrder: number;
  enabled: boolean;
}

export const categories: CategoryDefinition[] = [
  {
    slug: "ai",
    name: "AI",
    label: "AI",
    description:
      "General-purpose AI tools for writing, rewriting and summarizing everyday content.",
    icon: "Sparkles",
    hue: 258,
    primaryKeyword: "ai tools",
    keywords: [
      "ai writing tools",
      "ai text tools",
      "ai content tools",
      "free ai tools online",
      "ai writer",
      "ai rewriter",
      "ai summarizer",
      "ai prompt tools",
      "generative ai tools",
      "ai tools without a subscription",
      "ai tools for everyday writing",
    ],
    seoDescription:
      "General-purpose AI tools for writing, rewriting, summarizing and prompting. Write a draft, reword a paragraph or condense a long document, all from one Oply account and one credit balance.",
    sortOrder: 1,
    enabled: true,
  },
  {
    slug: "seo",
    name: "SEO",
    label: "SEO",
    description:
      "Generate titles, meta descriptions, structured data and outlines for pages you actually want to rank.",
    icon: "Search",
    hue: 194,
    primaryKeyword: "seo tools",
    keywords: [
      "free seo tools online",
      "on-page seo tools",
      "meta description generator",
      "seo title generator",
      "schema markup generator",
      "structured data tools",
      "content outline tools",
      "serp snippet tools",
      "seo copywriting tools",
      "json-ld generator",
      "seo tools for bloggers",
    ],
    seoDescription:
      "On-page SEO tools for the parts of a page search engines actually read: meta descriptions, title tags, schema.org structured data and blog outlines. Character counts included, ranking promises not.",
    sortOrder: 2,
    enabled: true,
  },
  {
    slug: "marketing",
    name: "Marketing",
    label: "Marketing",
    description: "Copy and messaging tools for campaigns, launches and landing pages.",
    icon: "Megaphone",
    hue: 322,
    primaryKeyword: "ai marketing tools",
    keywords: [
      "marketing copy generator",
      "ad copy tools",
      "campaign copywriting tools",
      "landing page copy generator",
      "social media copy tools",
      "launch messaging tools",
      "brand messaging tools",
      "promotional copy generator",
      "ai tools for marketers",
      "email marketing copy tools",
    ],
    seoDescription:
      "AI marketing tools for campaigns, launches and landing pages — headlines, body copy and messaging you can edit and ship. One credit balance covers every tool in the category.",
    sortOrder: 3,
    enabled: true,
  },
  {
    slug: "business",
    name: "Business",
    label: "Business",
    description: "Day-to-day business communication — replies, briefs and documents.",
    icon: "Briefcase",
    hue: 224,
    primaryKeyword: "ai business tools",
    keywords: [
      "business writing tools",
      "email reply generator",
      "client communication tools",
      "professional email tools",
      "business document tools",
      "proposal writing tools",
      "workplace communication tools",
      "ai tools for freelancers",
      "ai tools for agencies",
      "ai tools for small teams",
    ],
    seoDescription:
      "AI business tools for the writing that fills a working day: client replies, support responses, briefs and documents. Draft it in seconds, read it before it goes out.",
    sortOrder: 4,
    enabled: true,
  },
  {
    slug: "ecommerce",
    name: "E-commerce",
    label: "E-commerce",
    description: "Product copy, listings and store content for online sellers.",
    icon: "ShoppingBag",
    hue: 158,
    primaryKeyword: "ai ecommerce tools",
    keywords: [
      "product description generator",
      "shopify copywriting tools",
      "amazon listing tools",
      "online store copywriting",
      "product listing tools",
      "ecommerce seo tools",
      "product page copy",
      "marketplace listing generator",
      "product bullet point tools",
      "ai tools for online sellers",
    ],
    seoDescription:
      "AI e-commerce tools for online sellers: product descriptions, bullet points, listing copy, SEO tags and calls to action built from the specs you actually have.",
    sortOrder: 5,
    enabled: true,
  },
  {
    slug: "creator",
    name: "Creator",
    label: "Creator",
    description: "Tools for creators publishing across blogs, video and social.",
    icon: "Clapperboard",
    hue: 286,
    primaryKeyword: "ai tools for creators",
    keywords: [
      "content creator tools",
      "blog writing tools",
      "video description tools",
      "social caption tools",
      "creator workflow tools",
      "publishing tools",
      "youtube title ideas",
      "newsletter writing tools",
      "ai tools for bloggers",
      "repurpose content tools",
    ],
    seoDescription:
      "AI tools for creators publishing across blogs, video and social — plan a post, draft it, then reshape the same idea for each channel you publish on.",
    sortOrder: 6,
    enabled: true,
  },
  {
    slug: "productivity",
    name: "Productivity",
    label: "Productivity",
    description: "Small utilities that remove busywork from your day.",
    icon: "Zap",
    hue: 38,
    primaryKeyword: "ai productivity tools",
    keywords: [
      "ai tools to save time",
      "text summarizing tools",
      "meeting notes tools",
      "note taking helpers",
      "quick ai utilities",
      "everyday ai tools",
      "ai tools for busy teams",
      "reading and writing helpers",
      "ai tools with no monthly plan",
      "one off ai tools",
    ],
    seoDescription:
      "AI productivity tools that take the busywork out of a day — summarize what you have to read, draft what you have to send, and get back to the work that needed you.",
    sortOrder: 7,
    enabled: true,
  },
  {
    slug: "developer",
    name: "Developer",
    label: "Developer",
    description: "Generators and helpers for people who ship software.",
    icon: "Code2",
    hue: 202,
    primaryKeyword: "ai tools for developers",
    keywords: [
      "json-ld generator",
      "structured data generator",
      "schema.org tools",
      "developer utilities",
      "technical writing tools",
      "documentation helpers",
      "prompt tools for coding assistants",
      "api documentation tools",
      "developer productivity tools",
      "markup generators",
    ],
    seoDescription:
      "AI tools for people who ship software: JSON-LD and structured data generators, prompt tooling for coding assistants, and helpers for the writing around the code.",
    sortOrder: 8,
    enabled: true,
  },
  {
    slug: "utilities",
    name: "Utilities",
    label: "Utilities",
    description: "General helpers that do not fit anywhere else.",
    icon: "Wrench",
    hue: 340,
    primaryKeyword: "ai utility tools",
    keywords: [
      "small ai tools",
      "one off ai tools",
      "free online utilities",
      "text utilities",
      "quick text tools",
      "simple ai helpers",
      "general purpose ai tools",
      "browser based ai tools",
      "ai tools you pay for once",
      "no subscription ai utilities",
    ],
    seoDescription:
      "Small, single-purpose AI utilities that do one thing and get out of the way. Buy credits once and spend them across every Oply tool, including the ones added later.",
    sortOrder: 9,
    enabled: true,
  },
  {
    slug: "images",
    name: "Images",
    label: "Images",
    description:
      "AI image generation tools for thumbnails, social graphics, product photos, logos and background editing.",
    icon: "Image",
    // 16: a warm coral, in the widest open gap on the hue wheel (340 to 38) —
    // reads as visual/creative without competing with the brand purple/pink
    // or any existing category tile.
    hue: 16,
    primaryKeyword: "ai image generator",
    keywords: [
      "ai image tools",
      "ai thumbnail maker",
      "ai social graphic maker",
      "ai product photo tools",
      "ai logo maker",
      "ai background remover",
      "text to image tools",
      "ai image editing tools",
      "free ai image generator",
      "ai graphic design tools",
    ],
    seoDescription:
      "AI image tools for thumbnails, social graphics, product photos, logos and background editing. Generate an image, download it, or regenerate for a different result.",
    sortOrder: 10,
    enabled: true,
  },
];

export const categoryMap = new Map(categories.map((c) => [c.slug, c]));

export function getCategory(slug: string): CategoryDefinition | undefined {
  return categoryMap.get(slug);
}

/** Fallback hue for anything not mapped to a category. */
const DEFAULT_HUE = 258;

export function categoryHue(slug: string): number {
  return categoryMap.get(slug)?.hue ?? DEFAULT_HUE;
}

/**
 * Colour set derived from a category hue. Returned as CSS colour strings so
 * components can apply them inline — the hue is still authored in one place.
 */
export function categoryColors(slug: string) {
  const h = categoryHue(slug);
  return {
    /** Vivid — icons, numbers, small marks. */
    solid: `hsl(${h} 82% 52%)`,
    /** Filled tile behind an icon. */
    tile: `linear-gradient(135deg, hsl(${h} 88% 60%), hsl(${h + 34} 86% 56%))`,
    /** Wash behind a card. */
    wash: `linear-gradient(160deg, hsl(${h} 88% 60% / 0.14), transparent 62%)`,
    /** Hover border. */
    edge: `hsl(${h} 80% 58% / 0.45)`,
    /** Hover glow. */
    glow: `0 22px 48px -22px hsl(${h} 82% 52% / 0.6)`,
  };
}
