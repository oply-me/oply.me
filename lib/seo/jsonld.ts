import { siteConfig } from "@/config/site";
import type { CategoryDefinition } from "@/config/categories";
import type { ToolDefinition, ToolFaq } from "@/config/tools";

/**
 * JSON-LD builders. Deliberately no aggregateRating or review — Oply has no
 * real ratings to report, and inventing them would be dishonest markup.
 */

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    email: siteConfig.supportEmail,
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/tools?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function softwareApplicationJsonLd(tool: ToolDefinition) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${tool.name} — ${siteConfig.name}`,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: `${siteConfig.url}/tools/${tool.slug}`,
    description: tool.seoDescription,
    // Search-facing terms and the concepts the page is about. `about` uses the
    // entity layer, not the query layer — these are things, not searches.
    keywords: [tool.keywords.primary, ...tool.keywords.secondary].join(", "),
    about: tool.keywords.entities.map((name) => ({ "@type": "Thing", name })),
    offers: {
      "@type": "Offer",
      price: "9.00",
      priceCurrency: "USD",
      description: "Credit packs start at $9 as a one-time payment.",
    },
  };
}

/**
 * Marks up the numbered "How it works" list the tool page already renders.
 * The steps are `tool.howItWorks` verbatim — this describes visible content,
 * it does not author new content for crawlers.
 *
 * Note: Google retired HowTo *rich results* in 2023, so this will not draw a
 * step carousel in Search. It is still valid schema.org and is still consumed
 * by other parsers, which is why it is here rather than nowhere.
 *
 * `estimatedCost` is deliberately omitted: it expects a MonetaryAmount, and a
 * credit is not a currency — expressing "20 credits" as a price would be a
 * fabricated number.
 */
export function howToJsonLd(tool: ToolDefinition) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to use the ${tool.name}`,
    description: tool.tagline,
    url: `${siteConfig.url}/tools/${tool.slug}`,
    step: tool.howItWorks.map((text, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: text,
      text,
      url: `${siteConfig.url}/tools/${tool.slug}#how-it-works`,
    })),
  };
}

/**
 * The category hub as a collection of its tools. `numberOfItems` and the list
 * both come from the live registry, so the markup cannot claim a tool count
 * the page does not actually render.
 */
export function collectionPageJsonLd(
  category: CategoryDefinition,
  tools: ToolDefinition[],
) {
  const url = `${siteConfig.url}/categories/${category.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${category.name} AI tools`,
    description: category.seoDescription,
    url,
    isPartOf: {
      "@type": "WebSite",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    about: category.keywords
      .slice(0, 8)
      .map((name) => ({ "@type": "Thing", name })),
    mainEntity: {
      "@type": "ItemList",
      name: `${category.name} tools on ${siteConfig.name}`,
      numberOfItems: tools.length,
      itemListElement: tools.map((tool, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${siteConfig.url}/tools/${tool.slug}`,
        name: tool.name,
      })),
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteConfig.url}${item.path}`,
    })),
  };
}

/** Only emit this when the questions genuinely appear on the page. */
export function faqJsonLd(faqs: ToolFaq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}
