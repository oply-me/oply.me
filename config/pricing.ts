/**
 * Server-authoritative pricing. Nothing in the browser is allowed to influence
 * price or credit quantity — API routes always re-read a plan from this file
 * by id before creating an order.
 */
export interface PricingPlan {
  id: string;
  name: string;
  /** Price in USD. */
  price: number;
  currency: "USD";
  credits: number;
  description: string;
  highlight?: boolean;
  badge?: string;
  features: string[];
}

export const pricingPlans: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 9,
    currency: "USD",
    credits: 500,
    description: "Try Oply across a handful of projects.",
    features: [
      "500 credits",
      "One-time payment",
      "No recurring subscription",
      "Use across all Oply tools",
      "Generation history",
      "Favorites",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 19,
    currency: "USD",
    credits: 2_500,
    description: "For regular weekly use across several tools.",
    features: [
      "2,500 credits",
      "One-time payment",
      "No recurring subscription",
      "Use across all Oply tools",
      "Generation history",
      "Favorites",
      "Projects",
    ],
  },
  {
    id: "lifetime",
    name: "Lifetime",
    price: 49,
    currency: "USD",
    credits: 10_000,
    description: "The balance most people settle on.",
    highlight: true,
    badge: "Most Popular",
    features: [
      "10,000 credits",
      "One-time payment",
      "No recurring subscription",
      "Use across all Oply tools",
      "Generation history",
      "Favorites",
      "Projects",
      "Access to future tools",
    ],
  },
  {
    id: "founder",
    name: "Founder",
    price: 99,
    currency: "USD",
    credits: 30_000,
    description: "For agencies and heavy daily use.",
    features: [
      "30,000 credits",
      "One-time payment",
      "No recurring subscription",
      "Use across all Oply tools",
      "Generation history",
      "Favorites",
      "Projects",
      "Access to future tools",
      "Priority support",
    ],
  },
];

export const planMap = new Map(pricingPlans.map((p) => [p.id, p]));

/** Throws-free lookup. API routes must treat `undefined` as an invalid plan. */
export function getPlan(id: string): PricingPlan | undefined {
  return planMap.get(id);
}

export const sharedPlanFeatures = [
  "One-time payment",
  "No recurring subscription",
  "Use across all Oply tools",
  "Generation history",
  "Favorites",
  "Future tools",
  "Account dashboard",
];
