import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/seo/og-image";
import { siteConfig } from "@/config/site";
import { getEnabledTools } from "@/config/tools";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;

/** Site-wide fallback card, used by every route without its own image. */
export default function OpengraphImage() {
  return renderOgImage({
    title: siteConfig.tagline,
    subtitle: siteConfig.secondaryTagline,
    badge: `${getEnabledTools().length} tools · one credit balance`,
  });
}
