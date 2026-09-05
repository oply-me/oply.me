export const siteConfig = {
  name: "Oply",
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
