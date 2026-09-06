# OPLY.ME — PER-TOOL SEO DEPTH PASS (ROUND 2)

Paste into Claude Code with the repository open. This builds on top of the
semantic keyword model already shipped — it does not redo it.

---

## ROLE

You are an SEO engineer working in the Oply codebase. A full semantic keyword
model already exists and is enforced by tests — do not re-author it:

- `config/tools.ts` — every tool has a `keywords: ToolKeywords` object
  (`primary`/`secondary`/`longTail`/`entities`/`questions`/`intent`).
- `config/categories.ts` — every category has `primaryKeyword`/`keywords`/`seoDescription`.
- `config/site.ts` — `keywordClusters`/`siteKeywords` for site-wide terms.
- `lib/seo/metadata.ts`/`lib/seo/jsonld.ts` — keyword-aware `buildMetadata()`,
  `softwareApplicationJsonLd()` with `keywords`/`about`.
- `tests/seo-keywords.test.ts` — enforces uniqueness, layer bounds, banned
  claims, and that every `questions` entry has a matching `faq` answer. Any
  new copy must pass this file, not weaken it.

This round is about everything **around** that keyword model that search
engines and real users also evaluate: richer structured data, crawlability,
internal linking depth, and page performance — not new keyword lists.

## NON-NEGOTIABLE RULES

1. Same honesty rules as the rest of this codebase: no invented ratings,
   review counts, user counts, or ranking promises. `lib/seo/jsonld.ts`
   deliberately omits `aggregateRating`/`review` — keep it that way.
2. Every structured-data change must be validated against Google's Rich
   Results Test or the Schema.org validator before you call it done — report
   the validation result, don't assume the JSON-LD is correct because it
   parses.
3. `npm run typecheck`, `npm run test`, `npm run build` must all pass.
4. Don't touch `config/tools.ts`'s `keywords` fields or `tests/seo-keywords.test.ts`'s
   assertions unless you find an actual bug in them — this round adds
   structured data and page mechanics, not new keyword copy.

## WORK

### 1. Structured data richness, per tool

`softwareApplicationJsonLd()` currently emits `SoftwareApplication` +
`keywords`/`about`. Add, per tool page (`app/(marketing)/tools/[slug]/page.tsx`):

- `HowTo` schema generated from the tool's existing `howItWorks: string[]`
  array — it's already a numbered step list, just not marked up as one.
- Confirm `breadcrumbJsonLd()` and `faqJsonLd()` are both present on every
  tool AND category page (spot-check — `faqJsonLd` must only fire where the
  FAQ is actually visibly rendered, already the stated rule in
  `lib/seo/jsonld.ts`, verify it's honored everywhere it's called).
- `VideoObject` or `ImageObject` schema is NOT appropriate unless a tool page
  actually embeds a real image/video — do not add placeholder media schema
  for a page with no matching visible media.

### 2. Category hub depth

Category pages (`app/(marketing)/categories/[slug]/page.tsx`) currently list
their tools and a short generic FAQ. Add a `CollectionPage` schema wrapping
the tool listing, and confirm the hub-to-spoke internal linking described in
`SEO-MAP.md` is actually rendered (every tool card links to its category
badge; every hub lists its tools) — `SEO-MAP.md` documents the intended graph,
verify the live pages match it and fix any drift.

### 3. Sitemap and crawl mechanics

- Re-verify `app/sitemap.ts`'s priority/changeFrequency values still make
  sense given the current tool count (15 tools across 2 rounds of additions
  this year) — hubs above spokes, per the existing convention.
- Confirm `app/robots.ts` disallows exactly the right set of routes
  (dashboard, admin, auth, checkout, api) and nothing crawlable is
  accidentally blocked.
- Check for orphaned pages: any route with no internal link pointing to it
  (crawlable only via sitemap) — list them, since internal links carry more
  ranking signal than sitemap presence alone.

### 4. Open Graph images

Every tool/category page currently relies on the default OG image (verify
what that actually is — check `app/manifest.ts`/root layout for a fallback,
or confirm there isn't one). Next.js supports per-route dynamic OG image
generation (`opengraph-image.tsx` using `next/og`). Generate one dynamically
per tool, composited from real data only: tool name, tagline, category color
(`categoryColors()` already gives you the exact hue/gradient — reuse it, do
not invent a new visual style). No fabricated stats or claims on the image.

### 5. Core Web Vitals sanity check

Framer Motion and the new image tools both added client-side JS this year.
Run a Lighthouse pass (or equivalent) against the homepage, a tool page, and
a category page. Report LCP/CLS/INP numbers honestly — if a score regressed
from the animation work, say so and propose a fix (e.g. lazy-loading
below-the-fold motion components) rather than silently leaving it.

### 6. Internal linking audit beyond `related`

`ToolDefinition.related` already links tools that share entities (see
`SEO-MAP.md`'s link graph). Check whether in-body copy anywhere (blog-outline
tool's own FAQ, About page, Features page) could naturally link to a relevant
tool page and doesn't yet — add contextual links only where the sentence
already makes sense with one, never insert a link that reads as forced.

## DELIVERABLES

1. `HowTo` schema on every tool page, validated.
2. `CollectionPage` schema on every category hub, validated.
3. Sitemap/robots re-verified against the current (larger) tool count.
4. Dynamic per-tool OG images, real data only.
5. A short Core Web Vitals report (before numbers if available, after
   numbers, and any fixes applied).
6. An updated `SEO-MAP.md` if the internal link graph changed.

Report: what structured data was added and how you validated each type, any
crawl/orphan-page issues found and fixed, and the Core Web Vitals numbers.
