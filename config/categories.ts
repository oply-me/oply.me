export interface CategoryDefinition {
  slug: string;
  name: string;
  /** Short label used in filter pills. */
  label: string;
  description: string;
  /** lucide-react icon name, resolved by components/icon.tsx */
  icon: string;
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
    sortOrder: 2,
    enabled: true,
  },
  {
    slug: "marketing",
    name: "Marketing",
    label: "Marketing",
    description: "Copy and messaging tools for campaigns, launches and landing pages.",
    icon: "Megaphone",
    sortOrder: 3,
    enabled: true,
  },
  {
    slug: "business",
    name: "Business",
    label: "Business",
    description: "Day-to-day business communication — replies, briefs and documents.",
    icon: "Briefcase",
    sortOrder: 4,
    enabled: true,
  },
  {
    slug: "ecommerce",
    name: "E-commerce",
    label: "E-commerce",
    description: "Product copy, listings and store content for online sellers.",
    icon: "ShoppingBag",
    sortOrder: 5,
    enabled: true,
  },
  {
    slug: "creator",
    name: "Creator",
    label: "Creator",
    description: "Tools for creators publishing across blogs, video and social.",
    icon: "Clapperboard",
    sortOrder: 6,
    enabled: true,
  },
  {
    slug: "productivity",
    name: "Productivity",
    label: "Productivity",
    description: "Small utilities that remove busywork from your day.",
    icon: "Zap",
    sortOrder: 7,
    enabled: true,
  },
  {
    slug: "developer",
    name: "Developer",
    label: "Developer",
    description: "Generators and helpers for people who ship software.",
    icon: "Code2",
    sortOrder: 8,
    enabled: true,
  },
  {
    slug: "utilities",
    name: "Utilities",
    label: "Utilities",
    description: "General helpers that do not fit anywhere else.",
    icon: "Wrench",
    sortOrder: 9,
    enabled: true,
  },
];

export const categoryMap = new Map(categories.map((c) => [c.slug, c]));

export function getCategory(slug: string): CategoryDefinition | undefined {
  return categoryMap.get(slug);
}
