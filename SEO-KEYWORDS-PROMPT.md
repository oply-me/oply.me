# OPLY.ME — SEMANTIC SEO KEYWORD EXPANSION PROMPT

Use this prompt to expand Oply's keyword coverage from a handful of head terms
into a full **semantic topical map** across every tool, category and marketing
page — without keyword stuffing and without a single dishonest claim.

Paste everything below the line into Claude Code (or any coding agent) with the
repository open.

---

## ROLE

You are an SEO engineer and content strategist working inside the Oply codebase
(Next.js 15 App Router, TypeScript, Tailwind, Supabase). Oply is a suite of
one-off AI tools bought with one-time credit packs at https://oply.me.

Your job is **not** to sprinkle keywords. Your job is to build a machine-readable
**entity and intent model** for every tool, then wire that model into metadata,
structured data, on-page copy, internal linking and site search.

## NON-NEGOTIABLE RULES

1. **No fabrication.** Never invent statistics, user counts, ratings, reviews,
   awards, testimonials or "trusted by" logos. `lib/seo/jsonld.ts` deliberately
   omits `aggregateRating` and `review` — keep it that way.
2. **No ranking promises.** Never write copy or prompt text that guarantees
   rankings, traffic or sales. "Helps you write metadata search engines can
   read" is fine; "rank #1 on Google" is not.
3. **No keyword stuffing.** Visible copy must read like a human wrote it. A
   keyword only earns a place in a sentence if the sentence still makes sense
   when you read it aloud. Density is not a target; coverage is.
4. **Config is the single source of truth.** All keyword data lives in
   `config/tools.ts`, `config/categories.ts` and `config/site.ts`. No component
   hardcodes a keyword string.
5. **Server-only stays server-only.** `systemPrompt` and `outputSchema` are
   stripped by `toPublicTool()`. Keyword data is public — it is meant to ship to
   the browser and to crawlers.
6. **Type safety.** `npm run typecheck` and `npm run test` must pass when you
   are done.

## SEMANTIC SEO MODEL

For every tool, build five distinct layers. They are different things — do not
collapse them into one flat array.

| Layer | What it is | Count | Example (AI Rewriter) |
|---|---|---|---|
| `primary` | The single head term the page should own. Matches the tool's real function. | 1 | `ai rewriter` |
| `secondary` | Close variants and synonyms a searcher would type instead. Same intent, different words. | 6–10 | `text rewriter`, `paraphrasing tool`, `sentence rewriter`, `article rewriter`, `rewrite text online`, `ai paraphraser` |
| `longTail` | 4+ word, intent-loaded phrases. These carry the conversions. | 8–14 | `rewrite a paragraph to sound more professional`, `free ai tool to reword an email`, `make my writing clearer without changing the meaning` |
| `entities` | The nouns Google's knowledge graph already understands, plus the domain concepts the page should co-occur with. Not search queries — concepts. | 8–15 | `paraphrase`, `tone of voice`, `readability`, `plagiarism`, `copywriting`, `plain language`, `editing`, `large language model` |
| `questions` | Real questions people ask, phrased as questions. Feed the FAQ block and `faqJsonLd`. | 4–8 | `Is an AI rewriter the same as a paraphrasing tool?`, `Does rewriting change the meaning of my text?` |

Plus one field that is not a keyword list:

- `intent`: `"informational" | "commercial" | "transactional"` — the dominant
  intent of the tool page. Most tool pages are `commercial` (someone comparing
  tools before using one); the blog-outline and prompt tools skew
  `informational`. Use this to decide whether the page leads with *what it is*
  or *what it does for you*.

### How to generate each layer

Work tool by tool. For each one:

1. **Read the tool definition in full** — `name`, `tagline`, `description`,
   `fields`, `systemPrompt`, `benefits`, `howItWorks`, `faq`. The keywords must
   describe what the tool *actually does*, including its real limits. If the
   tool cannot do something (e.g. the rewriter is explicitly not an "AI
   detector bypass"), that term must **not** appear anywhere — not even in
   `secondary`.
2. **Expand along real search axes**, not synonyms of synonyms:
   - *modifier axis*: free, online, ai, instant, bulk, no signup
   - *object axis*: what is being acted on — email, product description, blog
     post, meta description, JSON-LD, client reply
   - *outcome axis*: shorter, clearer, more professional, more persuasive
   - *audience axis*: for freelancers, for ecommerce sellers, for agencies
   - *format axis*: generator, tool, writer, checker, template, examples
3. **Cover the entity neighbourhood.** Ask: if a crawler read this page, which
   concepts would it expect to see mentioned? Include the adjacent concepts
   (`schema.org`, `rich results`, `SERP`, `structured data`) even when nobody
   searches for them alone — they are what makes the page topically complete.
4. **De-duplicate across tools.** Two tools must not share a `primary`. If
   `seo-meta-generator` and `blog-outline-generator` both want
   `seo content tool`, the more literal owner keeps it and the other demotes it
   to `secondary`. Cannibalisation is the failure mode to avoid.
5. **Stay honest about volume.** You do not have keyword-volume data in this
   repo. Do not write comments claiming search volumes. Order each list by your
   judgement of relevance, most relevant first.

## PART 1 — TYPES AND DATA

### 1.1 Add the keyword type to `config/tools.ts`

```ts
export type SearchIntent = "informational" | "commercial" | "transactional";

/**
 * The semantic keyword map for a tool. Public data: it ships to the browser,
 * powers metadata, JSON-LD and site search, and is never used to stuff copy.
 */
export interface ToolKeywords {
  /** The one head term this page should own. Unique across the registry. */
  primary: string;
  /** Same intent, different words. 6–10. */
  secondary: string[];
  /** 4+ word intent-loaded phrases. 8–14. */
  longTail: string[];
  /** Concepts the page should co-occur with. 8–15. */
  entities: string[];
  /** Real questions, phrased as questions. 4–8. Should align with `faq`. */
  questions: string[];
  intent: SearchIntent;
}
```

Add `keywords: ToolKeywords;` as a **required** field on `ToolDefinition`, and
populate it for all 10 existing tools. A required field means a new tool cannot
ship without its keyword map — that is the point.

### 1.2 Seed clusters

These are starting points, not the finished lists. Expand each to the counts in
the table above, and keep every term truthful to what the tool does.

- **ai-writer** — primary `ai writer`. Around: ai content writer, ai writing
  generator, article writer, long form content, blog post writer, first draft,
  outline to draft, tone and audience, word count, content brief.
- **ai-rewriter** — primary `ai rewriter`. Around: paraphrasing tool, text
  rewriter, reword, sentence rewriter, tone rewrite, plain language, clarity,
  readability. **Excluded:** anything about evading AI detection.
- **ai-summarizer** — primary `ai summarizer`. Around: text summarizer, tldr
  generator, summarize an article, bullet point summary, executive summary,
  abstract, key points, meeting notes, long document.
- **prompt-generator** — primary `ai prompt generator`. Around: prompt writing,
  prompt template, chatgpt prompt, claude prompt, role prompt, few-shot,
  system prompt, prompt library, prompt engineering.
- **prompt-optimizer** — primary `prompt optimizer`. Around: improve a prompt,
  prompt rewriting, prompt engineering tool, clearer instructions, constraints,
  output format, token efficiency, prompt debugging.
- **seo-meta-generator** — primary `meta description generator`. Around: seo
  title generator, meta tag generator, title tag length, SERP snippet, click
  through rate, page title, focus keyword, character limit, open graph.
- **schema-generator** — primary `schema markup generator`. Around: json-ld
  generator, structured data, schema.org, rich results, FAQPage, Article,
  Product schema, breadcrumb, google rich snippet test.
- **product-description-generator** — primary `product description generator`.
  Around: ecommerce copywriting, shopify product copy, amazon listing, features
  and benefits, bullet points, product title, store listing, conversion copy.
- **reply-generator** — primary `ai reply generator`. Around: email reply
  generator, respond to a client, customer support reply, professional email,
  polite decline, follow up email, tone matching, message draft.
- **blog-outline-generator** — primary `blog outline generator`. Around: article
  outline, content structure, H2 H3 headings, blog post plan, topic cluster,
  content brief, section ideas, writing plan.

### 1.3 Category keywords — `config/categories.ts`

Add to `CategoryDefinition`:

```ts
  /** Head term for the category hub page. */
  primaryKeyword: string;
  /** Cluster terms the hub should cover. 8–14. */
  keywords: string[];
  /** Longer, human sentence used as the hub page's meta description. */
  seoDescription: string;
```

Category hubs are the **pillar** pages; tools are the **spokes**. A category's
keyword list should be the union of themes across its tools *plus* the broader
category terms no individual tool owns (e.g. `seo tools`, `free seo tools
online`, `on-page seo`).

### 1.4 Site-level clusters — `config/site.ts`

Add a `keywordClusters` export: the brand terms, the category-level terms and
the commercial terms (`ai tools one time payment`, `no subscription ai tools`,
`ai credits`, `lifetime ai tools`) that belong to `/`, `/pricing` and
`/features` rather than to any one tool.

## PART 2 — WIRING (do all of these; keywords in a file rank nothing)

1. **`lib/seo/metadata.ts`** — accept `keywords?: string[]` in
   `BuildMetadataOptions` and pass it through to Next's `Metadata.keywords`.
   Cap the emitted array at ~15 terms: `[primary, ...secondary, ...longTail]`
   truncated. Keep the existing `absolute` title behaviour intact.
2. **Tool pages** — call `buildMetadata` with the tool's keywords. The
   `seoTitle` should contain the `primary` term verbatim; the `seoDescription`
   should contain the `primary` term and at least two `secondary` terms and
   still read naturally at 150–160 characters.
3. **`lib/seo/jsonld.ts`** — add `keywords` (a comma-joined string) and
   `about` (the `entities` as `Thing` nodes) to `softwareApplicationJsonLd`.
   Do not add ratings. Emit `faqJsonLd` only where the questions are visibly
   rendered on the page.
4. **`config/tools.ts` → `searchTools()`** — add the keyword layers to the
   haystack so on-site search finds "paraphrase" → AI Rewriter. Weight:
   `primary` match +80, `secondary` +40, `longTail`/`entities` +15. Keep the
   existing name/category weights above these.
5. **On-page copy** — for each tool page, make sure the `benefits`,
   `howItWorks` and `faq` blocks *naturally* contain the primary and several
   secondary terms. Rewrite sentences to include them only where the sentence
   improves. Add missing FAQ entries so every `questions` entry has an honest
   answer on the page.
6. **Internal linking** — `related` on each tool should link the tools that
   share `entities`, not the ones that happen to be adjacent in `sortOrder`.
   Every tool links up to its category hub; every hub links down to its tools.
7. **`app/sitemap.ts`** — verify every tool and category URL is present with a
   sensible `priority` (hubs above spokes) and `changeFrequency`.
8. **Root `app/layout.tsx`** — replace the hand-written `keywords` array with
   the site-level cluster from `config/site.ts` so it cannot drift.

## PART 3 — QUALITY GATES

Add `tests/seo-keywords.test.ts` (Vitest, matching the style of
`tests/tool-registry.test.ts`) asserting:

- every enabled tool has a `keywords` object with the minimum counts per layer;
- `primary` is unique across the registry (no cannibalisation);
- no keyword is an empty string, is duplicated within its own layer, or exceeds
  80 characters;
- every `longTail` phrase is at least 4 words;
- `seoTitle` contains `keywords.primary`, case-insensitively;
- `seoDescription` is 120–165 characters;
- every tool's `questions` has a matching `faq` entry (compare normalised
  text), so `faqJsonLd` never claims a question the page does not answer;
- the banned-terms list (`rank #1`, `guaranteed rankings`, `undetectable`,
  `bypass ai detection`, `plagiarism free guarantee`) appears in no keyword,
  title, description or FAQ answer anywhere in the registry.

## PART 4 — DELIVERABLES

1. `config/tools.ts` — `ToolKeywords` type + populated `keywords` on all 10 tools.
2. `config/categories.ts` — keyword fields on all 9 categories.
3. `config/site.ts` — `keywordClusters`.
4. `lib/seo/metadata.ts`, `lib/seo/jsonld.ts` — keyword-aware.
5. `searchTools()` — keyword-aware ranking.
6. Refreshed `seoTitle` / `seoDescription` / `benefits` / `faq` copy per tool.
7. `tests/seo-keywords.test.ts` — passing.
8. A short `SEO-MAP.md` table: tool → primary → intent → category hub, so a
   human can see the whole map on one screen and spot overlaps.

Report at the end: how many terms were added per layer, which terms you
deliberately rejected as dishonest or off-function, and any cannibalisation you
resolved.
