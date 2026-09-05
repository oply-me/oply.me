import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

interface BuildMetadataOptions {
  title?: string;
  description?: string;
  path?: string;
  /** Set for dashboard/admin/auth pages. */
  noIndex?: boolean;
  type?: "website" | "article";
  /**
   * Semantic keywords for the page, most relevant first. Capped on the way out
   * — a long list is noise, and the tag is a weak signal at the best of times.
   */
  keywords?: string[];
}

/** Upper bound on the emitted keyword list. */
const MAX_KEYWORDS = 15;

export function buildMetadata({
  title,
  description = siteConfig.description,
  path = "/",
  noIndex = false,
  type = "website",
  keywords,
}: BuildMetadataOptions = {}): Metadata {
  const url = `${siteConfig.url}${path === "/" ? "" : path}`;
  const fullTitle = title
    ? title.includes(siteConfig.name)
      ? title
      : `${title} | ${siteConfig.name}`
    : `${siteConfig.name} — ${siteConfig.tagline}`;

  return {
    // `absolute` bypasses the root layout's "%s | Oply" template, which would
    // otherwise append the brand a second time.
    title: { absolute: fullTitle },
    description,
    ...(keywords?.length
      ? {
          keywords: Array.from(new Set(keywords))
            .filter(Boolean)
            .slice(0, MAX_KEYWORDS),
        }
      : {}),
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: siteConfig.name,
      type,
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
    robots: noIndex
      ? { index: false, follow: false, nocache: true }
      : { index: true, follow: true },
  };
}
