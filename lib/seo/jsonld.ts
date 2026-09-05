import { siteConfig } from "@/config/site";
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
