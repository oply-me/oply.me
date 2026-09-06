export const siteConfig = {
  name: "Oply.me",
  shortName: "Oply",
  domain: "oply.me",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "https://oply.me",
  tagline: "AI tools for getting things done.",
  secondaryTagline: "Simple AI tools. One workspace.",
  description:
    "Write, rewrite, summarize, optimize and create with simple AI tools — all from one Oply account. Buy credits once, use them everywhere.",
  supportEmail: process.env.SUPPORT_EMAIL ?? "support@oply.me",
  /** Balance at or below this shows the low-credit warning. */
  lowCreditThreshold: 100,
  /** Credits granted to a brand new account so the product is testable. */
  signupBonusCredits: 50,
  /** Default input ceiling; individual tools may lower or raise it. */
  defaultMaxInputChars: 10_000,
  longFormMaxInputChars: 30_000,
  nav: [
    { title: "Tools", href: "/tools" },
    { title: "Categories", href: "/categories" },
    { title: "Pricing", href: "/pricing" },
  ],
  footer: {
    product: [
      { title: "Pricing", href: "/pricing" },
      { title: "Features", href: "/features" },
      { title: "Roadmap", href: "/roadmap" },
    ],
    company: [
      { title: "About", href: "/about" },
      { title: "Contact", href: "/contact" },
      { title: "FAQ", href: "/faq" },
    ],
    legal: [
      { title: "Privacy", href: "/privacy" },
      { title: "Terms", href: "/terms" },
      { title: "Refund Policy", href: "/refund-policy" },
    ],
  },
} as const;

export type SiteConfig = typeof siteConfig;

/**
 * Site-level keyword clusters. These belong to `/`, `/pricing` and `/features`
 * rather than to any single tool — no tool page should own "no subscription ai
 * tools", and no tool page should have to.
 *
 * Kept here so the root layout cannot drift from the copy: `siteKeywords` is
 * what actually ships as the site-wide `<meta name="keywords">`.
 */
export const keywordClusters = {
  /** Brand and navigational terms. */
  brand: [
    "Oply",
    "oply ai tools",
    "oply.me",
    "Oply AI",
  ],
  /** The category-level terms the hub pages roll up into. */
  category: [
    "AI tools",
    "AI writing tools",
    "SEO tools",
    "AI business tools",
    "AI ecommerce tools",
    "AI productivity tools",
    "content writing tools",
    "prompt engineering tools",
  ],
  /** How the product is bought — the pricing and features pages own these. */
  commercial: [
    "ai tools one time payment",
    "no subscription ai tools",
    "ai credits",
    "lifetime ai tools",
    "pay once ai tools",
    "ai tools without a monthly plan",
    "buy ai credits",
    "credit based ai tools",
  ],
} as const;

/** Flattened, de-duplicated site-wide keyword list for the root layout. */
export const siteKeywords: string[] = Array.from(
  new Set([
    ...keywordClusters.brand,
    ...keywordClusters.category,
    ...keywordClusters.commercial,
  ]),
);
