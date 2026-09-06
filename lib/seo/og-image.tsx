import { ImageResponse } from "next/og";
import { categoryColors, categoryHue } from "@/config/categories";
import { siteConfig } from "@/config/site";

/** Facebook/X both crop to 1.91:1; 1200×630 is the standard safe size. */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

/**
 * The site's Open Graph card.
 *
 * Composited only from data that already exists: the page's real title, its
 * real supporting line, and the category's own hue from `categoryColors()` —
 * the same function that tints the tool grid, so a shared link looks like the
 * page it points at. No stats, ratings or claims are drawn here; there are
 * none that would be true.
 *
 * Rendered by Satori, which supports a strict CSS subset: every element with
 * more than one child needs an explicit `display: flex`.
 */
export function renderOgImage({
  title,
  subtitle,
  eyebrow,
  categorySlug,
  badge,
}: {
  title: string;
  subtitle?: string;
  /** Small label above the title, e.g. the category name. */
  eyebrow?: string;
  /** Drives the hue. Omit for the brand default. */
  categorySlug?: string;
  /** Optional factual pill, e.g. "20 credits per run". */
  badge?: string;
}) {
  const c = categoryColors(categorySlug ?? "");
  /* `categoryColors().solid` is tuned for a light page. On this near-black
     canvas the darker hues (violet especially) fall below a comfortable
     contrast, so the eyebrow uses a lifted version of the same hue rather
     than a different colour. */
  const eyebrowColor = `hsl(${categoryHue(categorySlug ?? "")} 90% 72%)`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#0b0a10",
          position: "relative",
        }}
      >
        {/* Category bloom, top-right. */}
        <div
          style={{
            position: "absolute",
            top: -220,
            right: -160,
            width: 720,
            height: 720,
            borderRadius: 9999,
            backgroundImage: c.tile,
            opacity: 0.32,
          }}
        />
        {/* Hue rule along the top edge. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            backgroundImage: c.tile,
          }}
        />

        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #743df5 0%, #f33fb1 100%)",
            }}
          >
            <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="7.25" stroke="#fff" strokeWidth="3" />
              <path
                d="M16 16 L23.5 8.5"
                stroke="#fff"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div
            style={{
              marginLeft: 14,
              fontSize: 28,
              fontWeight: 600,
              color: "#fff",
            }}
          >
            {siteConfig.name}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {eyebrow ? (
            <div
              style={{
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: eyebrowColor,
                marginBottom: 18,
              }}
            >
              {eyebrow}
            </div>
          ) : null}

          <div
            style={{
              fontSize: title.length > 34 ? 62 : 76,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -2,
              color: "#fff",
            }}
          >
            {title}
          </div>

          {subtitle ? (
            <div
              style={{
                marginTop: 22,
                fontSize: 30,
                lineHeight: 1.35,
                color: "rgba(255,255,255,0.68)",
                // Satori has no line-clamp; the callers pass short copy.
                maxWidth: 900,
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          {badge ? (
            <div
              style={{
                display: "flex",
                padding: "10px 20px",
                borderRadius: 9999,
                border: `1px solid ${c.edge}`,
                fontSize: 24,
                color: "rgba(255,255,255,0.82)",
              }}
            >
              {badge}
            </div>
          ) : null}
          <div
            style={{
              marginLeft: badge ? 20 : 0,
              fontSize: 24,
              color: "rgba(255,255,255,0.5)",
            }}
          >
            {siteConfig.domain}
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}
