# Oply

**AI tools for getting things done.**

A production-ready full-stack AI SaaS: ten focused AI tools behind one account,
one shared credit balance, and one-time crypto payments. No subscriptions.

Built with Next.js 15 (App Router), TypeScript, Tailwind, Supabase
(Postgres + Auth + RLS), and a provider-agnostic AI layer defaulting to Claude.

---

## Quick start

```bash
npm install
cp .env.example .env.local     # fill in the values below
npm run dev
```

The app runs without credentials, but signing in, generating and paying all
need the services below configured.

---

## Setup

### 1. Supabase

Create a project, then apply the migrations in order:

```bash
supabase link --project-ref <your-ref>
supabase db push                       # runs supabase/migrations/*.sql
psql "$DATABASE_URL" -f supabase/seed/seed.sql
```

Or paste each file into the SQL editor in this order:

| File | What it creates |
|---|---|
| `20250101000000_init_schema.sql` | All tables, indexes and constraints |
| `20250101000100_credit_ledger.sql` | Credit RPCs, signup trigger, grants |
| `20250101000200_rls.sql` | RLS policies and column-level grants |
| `seed/seed.sql` | Categories and operational settings |

Then push the tool registry into the database:

```bash
npm run db:sync-tools
```

This inserts a row per tool from `config/tools.ts`. Re-running it refreshes the
fields admins don't own (prompt, schema, SEO copy) and leaves admin overrides
(credit cost, enabled, featured) alone.

Copy your project URL, anon key and service role key into `.env.local`.

### 2. AI provider

Set `AI_API_KEY` to an Anthropic API key. The default model is
`claude-opus-5`; override with `AI_MODEL`.

To add another provider, implement `AIProvider` in `lib/ai/providers/` and
register it in `lib/ai/client.ts`. Nothing above that interface changes.

### 3. Crypto payments

The shipped provider is NOWPayments. Set `CRYPTO_PAYMENT_API_KEY` and
`CRYPTO_PAYMENT_WEBHOOK_SECRET` (the IPN secret), then point the provider's IPN
callback at:

```
https://your-domain/api/payments/webhook
```

Without a webhook secret every webhook is rejected — that is the safe default,
not a misconfiguration to work around.

**Testing without credentials.** Set `DEV_PAYMENT_MODE=true` in development.
Checkout then renders a "simulate confirmed payment" button that signs a fake
payload and posts it to the real webhook endpoint, so signature verification,
idempotency and credit allocation all run exactly as in production. The route
returns 404 whenever `NODE_ENV=production`.

### 4. First admin

Roles cannot be self-assigned — a database trigger pins the column. Promote
your account from the SQL editor:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

Then visit `/admin`.

---

## How the credit system works

Credits are the unit of account. Nothing in the browser can influence a
balance.

1. `POST /api/ai/generate` authenticates the user and rate-limits them.
2. The tool is resolved **server-side**; its credit cost comes from the
   database (or `config/tools.ts`), never from the request body.
3. Input is validated against the tool's own field definitions.
4. `consume_credits` deducts atomically — it takes a row lock, so ten
   simultaneous requests against a 100-credit balance let through exactly five
   20-credit generations and never overdraw.
5. The AI call runs.
6. On success, the generation is written with the service role (users have no
   `INSERT` policy, so history cannot be fabricated) and usage is recorded.
7. **On failure, `refund_credits` returns the credits.** The user is charged
   only for results they receive. Both the usage and the refund appear in the
   ledger.

Every balance change writes a `credit_transactions` row. There is no code path
that changes a balance without one.

### Payment idempotency

Two independent guards, either of which alone would prevent double crediting:

- `payment_events` has `UNIQUE (provider, provider_event_id)`. A replayed
  webhook fails the insert with `23505` and returns early.
- `complete_order_and_credit` locks the order row and re-checks its `credited`
  flag *inside* the transaction, returning `false` for work already done.

Returning to a success URL never grants credits. The checkout page polls for
status only; crediting happens exclusively through the verified webhook.

---

## Adding a new tool

The system is built so a new tool is configuration, not a rewrite. For anything
that fits an existing template, add one entry to `config/tools.ts`:

```ts
{
  slug: "faq-generator",
  name: "FAQ Generator",
  category: "seo",
  icon: "HelpCircle",
  creditCost: 10,
  component: "standard-text",   // reuses an existing workspace layout
  outputType: "markdown",
  systemPrompt: "...",
  fields: [ /* renders itself, and validates itself server-side */ ],
  seoTitle: "...", seoDescription: "...",
  benefits: [...], howItWorks: [...], faq: [...], related: [...],
  featured: false, enabled: true, sortOrder: 11,
}
```

Then `npm run db:sync-tools`. The tool immediately appears in `/tools`, its
category page, search, the dashboard, related-tool links and the sitemap, with
its own SEO landing page at `/tools/faq-generator`.

Available templates: `standard-text`, `long-form`, `reply`, `prompt`,
`seo-generator`, `schema-generator`, `structured-output`. A tool needing a
genuinely new output shape adds a Zod schema in `lib/ai/schemas.ts` and a
renderer in `components/tools/output-renderers.tsx`.

Admins can then adjust credit cost, availability, featured status, sort order,
description and system prompt at `/admin/tools` without a deploy.

---

## Project structure

```
app/
  (marketing)/     public site — home, tools, categories, pricing, legal
  (auth)/          login, signup, password reset
  dashboard/       workspace, history, favorites, projects, credits, billing
  admin/           users, orders, payments, tools, usage, credits, settings
  checkout/        order status and payment
  api/             generation, payments, webhook, favorites, admin endpoints
components/
  ui/              design-system primitives
  tools/           workspace, field renderer, output renderers per template
  marketing/  dashboard/  admin/  billing/
config/            site, categories, pricing, tools  ← single source of truth
lib/
  ai/              provider abstraction, prompts, schemas, usage, moderation
  credits/         reserve / refund, always through the ledger
  payments/        provider interface, NOWPayments, dev simulator
  tools/           server-authoritative registry (config + admin overrides)
  security/        rate limiting, request and per-tool validation
  supabase/  auth/  seo/  admin/
supabase/
  migrations/      real SQL — tables, constraints, RLS, RPCs
  seed/
tests/             unit tests + live-database integration suite
```

---

## Testing

```bash
npm test           # 66 unit tests
npm run typecheck
```

The unit tests cover the tool registry, server-authoritative pricing, per-tool
input validation, prompt construction, rate limiting, cost estimation, and
webhook signature verification (including tampered amounts and swapped order
IDs).

`tests/integration/security.test.ts` proves the invariants that need a real
database. It skips itself unless credentials are present:

```bash
NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
SUPABASE_SERVICE_ROLE_KEY=... npm test
```

It asserts that a user cannot read or delete another user's generation, give
themselves credits, insert their own ledger row, promote themselves to admin,
re-enable a disabled account, read tool system prompts, or mark their own order
completed — and that concurrent spending never overdraws, failed generations
refund exactly, a replayed webhook credits once, and a refund never drives a
balance negative.

**Run it against a scratch project, not production** — it creates and deletes
test users.

---

## Deploying

Any Node host running Next.js. On Vercel, set every variable from
`.env.example` in project settings, set `NEXT_PUBLIC_APP_URL` to the real
origin, and leave `DEV_PAYMENT_MODE` unset.

Security headers are set in `next.config.mjs`. `/dashboard`, `/admin`, `/login`,
`/checkout`, `/api` and `/auth` are excluded from `robots.txt` and the sitemap.

Never expose `SUPABASE_SERVICE_ROLE_KEY`, `AI_API_KEY` or the payment secrets to
the browser — `lib/supabase/admin.ts` imports `server-only`, so an accidental
client import becomes a build error rather than a leak.

---

## What is deliberately not claimed

- No "unlimited AI" — every tool has a published credit cost.
- No guaranteed rankings, traffic or sales.
- No fake testimonials, review counts, user numbers or revenue figures.
- Generating JSON-LD does not by itself make a page eligible for rich results,
  and the Schema Generator says so.
- Admin dollar figures are labelled **estimated**: token counts come from the
  provider, prices from our own table in `lib/ai/models.ts`.
- Coming-soon tools are shown as non-functional cards, not disabled buttons
  pretending to work.
