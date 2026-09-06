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
  /**
   * Set false on a route that ships its own colocated `opengraph-image.tsx`.
   * Setting `openGraph` here replaces the inherited object wholesale, which
   * silently dropped the root image from every page — so the default is
   * attached explicitly, and routes with a better image opt out.
   */
  defaultOgImage?: boolean;
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
  defaultOgImage = true,
}: BuildMetadataOptions = {}): Metadata {
  const url = `${siteConfig.url}${path === "/" ? "" : path}`;
  const images = defaultOgImage
    ? [
        {
          url: `${siteConfig.url}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${siteConfig.name} — ${siteConfig.tagline}`,
        },
      ]
    : undefined;
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
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      ...(images ? { images: images.map((i) => i.url) } : {}),
    },
    robots: noIndex
      ? { index: false, follow: false, nocache: true }
      : { index: true, follow: true },
  };
}
