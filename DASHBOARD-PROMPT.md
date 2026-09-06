# OPLY.ME — DASHBOARD ENHANCEMENT PROMPT

Paste into Claude Code with the repository open.

---

## ROLE

You are a product engineer working in the Oply codebase (Next.js 15 App
Router, TypeScript, Tailwind, Supabase). The user dashboard
(`app/dashboard/**`) currently has: a home page (stat cards, recently used,
recommendations, favorites preview), Tools, Projects, Favorites, History,
Credits (stat cards + transaction list), Billing (stat cards + orders table),
Settings, Onboarding, and an "Ask Oply" natural-language router. All of it is
plain stat cards and lists today — `recharts` is a dependency but is only
used in the admin panel (`components/admin/charts.tsx`), never on the
user-facing dashboard.

## NON-NEGOTIABLE RULES

1. **Every widget must be backed by a real query against real tables**
   (`ai_generations`, `credit_transactions`, `orders`, `favorites`,
   `projects`, `profiles`). Never render a chart, stat, or list from
   placeholder/mock data — if the data doesn't exist yet, that's a schema
   task to call out explicitly, not something to fake client-side.
2. **RLS stays intact.** Every new query reads through the user's own
   session-scoped Supabase client (`lib/supabase/server.ts`), the same
   pattern every existing dashboard page already uses — never the
   service-role admin client for anything user-facing.
3. **No feature that implies a plan tier, seat, or subscription concept** —
   Oply is one-time credits, one account, no tiers. A "usage this month"
   chart is fine (real data, informational); a "Pro plan" badge is not
   (there is no such thing).
4. Reuse existing UI primitives (`components/ui/*`, `components/admin/charts.tsx`'s
   recharts wrapper pattern) before adding new dependencies.
5. `npm run typecheck`, `npm run test`, `npm run build` must pass.

## WHAT TO BUILD

### 1. Usage-over-time chart (dashboard home or a new `/dashboard/usage` page)

A real line/bar chart of credits spent per day/week over the last 30/90 days,
queried from `ai_generations.created_at` + `credits_used`, using the same
`recharts` pattern already proven in `components/admin/charts.tsx` — adapt
it, don't reinvent the charting approach. Add a per-tool breakdown (which
tools consumed the most credits this period) as a second chart or a stacked
view.

### 2. Activity feed

Currently the dashboard shows only "recently used tools" (last 4). Build a
proper paginated activity feed combining `ai_generations` (generations),
`credit_transactions` (purchases/refunds/bonuses), and `orders` (completed
purchases) into one reverse-chronological timeline, with real icons per
event type (reuse `ToolIcon`/lucide icons already in use elsewhere). This can
live on the existing History page as a new tab, or a new
`/dashboard/activity` page — decide based on how it reads once built, not in
the abstract.

### 3. Notifications

`AnnouncementBanner` (in `app/dashboard/layout.tsx`) shows one static
announcement from the `announcements` table — there is no per-user
notification concept (e.g. "your favorite tool got a new feature," "your
credit balance is low"). Evaluate whether a lightweight notification bell
(reusing the existing `credit_balances` low-threshold logic already computed
for the sidebar's low-balance CTA) is worth building versus over-engineering
a feature with no content pipeline yet — a notification system with nothing
real to notify about is worse than not building it. If you build it, wire it
to real signals only: low credit balance, a completed order, a generation
that failed and was refunded.

### 4. Favorites and Projects depth

- Favorites currently shows a flat list. Add filtering by tool/category
  (data already available via the existing join to `ai_generations`).
- Projects currently groups generations but has no visible per-project stat
  (credit cost of everything in a project, item count over time). Add both,
  computed from `project_items`/`ai_generations` — no new tables needed.

### 5. Billing page depth

`orders` table is shown flat today. Add: a downloadable receipt/invoice per
completed order (a simple server-rendered PDF or a printable HTML page is
enough — do not integrate a third-party invoicing service without asking
first, this is exactly the kind of external-dependency decision that needs a
real credential and a real conversation, the same way the OpenAI/Paddle/
NOWPayments integrations did earlier in this project). Show which payment
method (crypto vs Paddle card, now that both exist per the payment-provider
work) was used per order — `orders.payment_provider` already stores this.

### 6. Settings depth

Currently: name/avatar/use-case, theme toggle, read-only account info. Real,
missing pieces: an in-app password-change form (Supabase Auth supports
`updateUser({ password })` directly — check whether the reset-link-only flow
was a deliberate security choice before changing it, and ask if unsure), and
a genuine self-serve account deletion flow if none exists (currently
"contact support" — confirm this is intentional before building a self-serve
delete, since irreversible account deletion is exactly the kind of
consequential action that deserves an explicit design conversation, not a
silent addition).

## DELIVERABLES

1. A real usage-over-time chart with per-tool breakdown.
2. A unified activity feed.
3. A notification mechanism, only if backed by real signals — report the
   decision either way.
4. Favorites filtering + per-project stats.
5. Order receipts + payment-method display on Billing.
6. A settings-page recommendation (not necessarily an implementation) for
   password change and account deletion, flagging the two open questions
   above explicitly rather than deciding them unilaterally.

Report: what queries power each new widget (table + columns), and any place
you found insufficient data to build something honestly (say so instead of
approximating it from data that doesn't actually support the claim).
