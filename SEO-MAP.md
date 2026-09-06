# Oply — Semantic SEO Map

One screen showing which page owns which head term, so overlaps are visible
before they become cannibalisation. Generated from `config/tools.ts`,
`config/categories.ts` and `config/site.ts` — those files are the source of
truth; this table is the human-readable view of them.

Layer counts are `secondary / longTail / entities / questions`.

## Tools (spokes)

| Tool | Primary keyword | Intent | Category hub | Layers |
|---|---|---|---|---|
| [AI Writer](/tools/ai-writer) | `ai writer` | commercial | AI → `/categories/ai` | 8 / 11 / 12 / 6 |
| [AI Rewriter](/tools/ai-rewriter) | `ai rewriter` | commercial | AI → `/categories/ai` | 8 / 10 / 12 / 6 |
| [AI Summarizer](/tools/ai-summarizer) | `ai summarizer` | commercial | AI → `/categories/ai` | 8 / 10 / 12 / 6 |
| [Prompt Generator](/tools/prompt-generator) | `ai prompt generator` | informational | AI → `/categories/ai` | 8 / 10 / 12 / 5 |
| [Prompt Optimizer](/tools/prompt-optimizer) | `prompt optimizer` | commercial | AI → `/categories/ai` | 8 / 10 / 12 / 5 |
| [SEO Meta Generator](/tools/seo-meta-generator) | `meta description generator` | commercial | SEO → `/categories/seo` | 8 / 10 / 15 / 6 |
| [Schema Generator](/tools/schema-generator) | `schema markup generator` | commercial | SEO → `/categories/seo` | 8 / 10 / 15 / 6 |
| [Blog Outline Generator](/tools/blog-outline-generator) | `blog outline generator` | informational | SEO → `/categories/seo` | 8 / 10 / 14 / 6 |
| [Product Description Generator](/tools/product-description-generator) | `product description generator` | commercial | E-commerce → `/categories/ecommerce` | 8 / 10 / 14 / 6 |
| [Reply Generator](/tools/reply-generator) | `ai reply generator` | commercial | Business → `/categories/business` | 8 / 10 / 12 / 6 |

## Category hubs (pillars)

Hubs are broader than any single tool by construction — a test asserts no hub
claims a term a tool already owns.

| Hub | Primary keyword | Live tools |
|---|---|---|
| `/categories/ai` | `ai tools` | AI Writer, AI Rewriter, AI Summarizer, Prompt Generator, Prompt Optimizer |
| `/categories/seo` | `seo tools` | SEO Meta Generator, Schema Generator, Blog Outline Generator |
| `/categories/ecommerce` | `ai ecommerce tools` | Product Description Generator |
| `/categories/business` | `ai business tools` | Reply Generator |
| `/categories/marketing` | `ai marketing tools` | — (hidden until a tool ships) |
| `/categories/creator` | `ai tools for creators` | — |
| `/categories/productivity` | `ai productivity tools` | — |
| `/categories/developer` | `ai tools for developers` | — |
| `/categories/utilities` | `ai utility tools` | — |

Hubs with no live tools are excluded from `/categories`, the sitemap and
`generateStaticParams`, so an empty pillar page is never published.

## Site level

`config/site.ts` → `keywordClusters`. These belong to `/`, `/pricing` and
`/features`; no tool page should have to carry them.

| Cluster | Owns |
|---|---|
| `brand` | Oply, oply ai tools, oply.me, Oply AI |
| `category` | the hub head terms, rolled up |
| `commercial` | `ai tools one time payment`, `no subscription ai tools`, `ai credits`, `lifetime ai tools`, `pay once ai tools`, … |

## Internal link graph

Tools link to the tools they share `entities` with, not their neighbours in
`sortOrder`. Every tool links up to its hub via the category badge; every hub
lists its tools. `tests/tool-registry.test.ts` fails if a `related` slug does
not exist.

```
ai-writer                     → ai-rewriter, blog-outline-generator, ai-summarizer
ai-rewriter                   → ai-writer, reply-generator, ai-summarizer
ai-summarizer                 → ai-rewriter, ai-writer, reply-generator
prompt-generator              → prompt-optimizer, ai-writer, ai-rewriter
prompt-optimizer              → prompt-generator, ai-rewriter, ai-writer
seo-meta-generator            → schema-generator, blog-outline-generator, product-description-generator
schema-generator              → seo-meta-generator, product-description-generator, blog-outline-generator
product-description-generator → seo-meta-generator, ai-rewriter, ai-writer
reply-generator               → ai-rewriter, ai-writer, ai-summarizer
blog-outline-generator        → ai-writer, seo-meta-generator, ai-summarizer
ai-logo-icon-generator        → ai-thumbnail-generator, ai-social-post-graphic, ai-product-photo-generator
ai-thumbnail-generator        → ai-social-post-graphic, ai-logo-icon-generator, ai-background-remover
ai-social-post-graphic        → ai-thumbnail-generator, ai-logo-icon-generator, ai-product-photo-generator
ai-product-photo-generator    → ai-background-remover, product-description-generator, ai-social-post-graphic
ai-background-remover         → ai-product-photo-generator, ai-thumbnail-generator, ai-social-post-graphic
```

### Navigational link surfaces

Beyond `related`, every public page carries the same three link surfaces, all
generated from `getEnabledTools()` so none of them can drift from what ships:

| Surface | Links out to | Source |
|---|---|---|
| Header mega-menu | 4 tools per category, each category hub, `/tools` | `lib/tools/menu.ts` |
| Mobile nav accordion | the same set, nested by category | `lib/tools/menu.ts` |
| Footer | `/tools`, every category hub with tools, product, company and legal pages | `components/marketing/footer.tsx` |
| ⌘K palette | every tool | `lib/tools/search-item.ts` |

The mega-menu and palette live inside Radix overlays, so their markup is not
in the served HTML — they are user navigation, not crawlable link equity. The
footer is the surface that actually carries hub and category links to a
crawler, which is why every category with at least one tool is listed there.

A crawl of the built site (breadth-first from `/`, following in-DOM `<a href>`)
found **no orphaned pages and no crawlable public page missing from the
sitemap**; the least-linked page has 18 inbound internal links.

## Where the data is used

| Surface | Reads |
|---|---|
| `<meta name="keywords">` on a tool page | `toolMetaKeywords()` — `primary` + `secondary` + `longTail`, capped at 15 |
| `<meta name="keywords">` on a hub | `primaryKeyword` + `keywords` |
| `<meta name="keywords">` site-wide | `siteKeywords` |
| `SoftwareApplication` JSON-LD | `keywords` (comma-joined), `about` (entities as `Thing` nodes) |
| `HowTo` JSON-LD (tool pages) | `howItWorks`, marking up the visible numbered list |
| `CollectionPage` JSON-LD (hubs) | `seoDescription`, `keywords`, and the hub's real tool list |
| `FAQPage` JSON-LD | `faq`, which every `questions` entry must match |
| Open Graph image (per tool/hub) | name, tagline, credit cost, `categoryColors()` hue |
| Site search ranking | `primary` +80, `secondary` +40, `longTail`/`entities` +15 |
| Hub meta description | `seoDescription` |

## Rules this map is held to

`tests/seo-keywords.test.ts` fails the build if any of these break:

- `primary` is unique across the registry, and no hub steals a tool's `primary`
- layer sizes stay inside 6–10 / 8–14 / 8–15 / 4–8
- every `longTail` phrase is 4+ words; no term is empty, duplicated in its
  layer, or over 80 characters
- `seoTitle` contains `primary`; `seoDescription` is 120–165 characters and
  contains `primary` plus at least two `secondary` terms
- every `questions` entry has a matching `faq` entry, so `faqJsonLd` never
  markup-claims a question the page does not answer
- no banned claim (`rank #1`, `guaranteed rankings`, `undetectable`,
  `bypass ai detection`, `plagiarism free guarantee`) appears in any keyword,
  title, description, benefit, how-it-works step or FAQ answer
