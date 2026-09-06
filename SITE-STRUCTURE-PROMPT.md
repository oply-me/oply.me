# OPLY.ME — SITE STRUCTURE: NAV, FOOTER, WIDGETS, LEGAL PAGES

Paste into Claude Code with the repository open.

---

## ROLE

You are a full-stack engineer working in the Oply codebase (Next.js 15 App
Router, TypeScript, Tailwind, Supabase). This prompt covers the site's
structural chrome — header, footer, widgets, copyright, and the legal/policy
pages — not the tool pages or dashboard (see the separate SEO/dashboard/
animation prompts for those).

**Current state, so you don't rebuild what exists:**
- Header (`components/marketing/navbar.tsx`): flat link list from
  `siteConfig.nav`, no mega-menu, no dropdown, no in-nav search. Mobile:
  simple full-width dropdown, not nested.
- Footer (`components/marketing/footer.tsx`): 5-column grid (brand, Tools,
  Product, Company). Copyright line is already dynamic —
  `© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.` —
  do not hardcode a year anywhere, this pattern already avoids that bug.
  No newsletter signup, no social links, no trust badges today.
- Legal pages exist and are dated "January 2025": `refund-policy`, `terms`,
  `privacy` (all via a shared `LegalPage` wrapper), plus `about`, `contact`,
  `faq`, `roadmap`.
- **Refund policy today is NOT strict no-refund** — it currently allows
  refunds for duplicate charges, credits that never arrived, and unused
  purchases within 14 days if untouched, and supports pro-rata partial
  refunds. See Part 3 below before changing this.

## NON-NEGOTIABLE RULES

1. No fabricated trust signals — no fake "as seen in" logos, no invented
   testimonials, no made-up user/review counts anywhere in nav, footer, or
   widgets. This matches the honesty rules already enforced elsewhere in this
   codebase (`lib/seo/jsonld.ts`, `config/tools.ts`'s `GLOBAL_SYSTEM_RULES`).
2. Any policy-page copy change (Part 3) is a real legal/business decision,
   not just a copy edit — flag it back to the user for explicit confirmation
   before publishing, the same way this project has paused for confirmation
   on every other consequential external-facing change (payment provider
   fees, going live with real payments).
3. `npm run typecheck`, `npm run test`, `npm run build` must pass.
4. Keep the copyright line's dynamic-year pattern — do not introduce a
   hardcoded year anywhere new.

## PART 1 — HEADER

- Add a tools mega-menu: hovering/tapping "Tools" in the nav opens a panel
  grouped by category (`config/categories.ts` already has hue/icon per
  category — reuse `categoryColors()`, don't invent new category colors for
  this menu), showing 3-4 tools per category plus a "View all N tools" link.
  Pull the tool list from the same `listTools()`/`getEnabledTools()` used
  everywhere else — never a hardcoded duplicate list that can drift.
- Add in-nav search: a compact search input or a button opening the existing
  `ToolSearch` (⌘K) component already used dashboard-side — confirm whether
  it's already usable unauthenticated before building a second search
  implementation for the public site.
- Mobile: restructure the flat dropdown into an accordion (radix
  `accordion`, already a dependency) so the tools mega-menu content doesn't
  have to be a second, separate mobile-only implementation.

## PART 2 — FOOTER & WIDGETS

- Add a newsletter signup (email input + submit) if — and only if — there is
  a real place for it to go (an email list provider, or at minimum a
  `contact_messages`-style table to store it honestly). Do not wire a form
  that silently discards submissions or fakes a success state.
- Add social links only for accounts that actually exist — ask if unsure
  rather than guessing a handle or omitting silently.
- Consider a small "live" widget only if backed by real data — e.g. total
  tools available (`getEnabledTools().length`, already used honestly
  elsewhere) is fine; a fabricated "X people used this today" counter is not
  and must not be built.
- Footer legal column should link every policy page that exists today, plus
  any new ones from Part 3.

## PART 3 — LEGAL / IMPORTANT PAGES

**Do this part carefully — it changes real customer-facing terms.**

The user has asked for a shift toward a stricter "no refund" stance. Before
writing new policy copy:

1. Read the CURRENT `app/(marketing)/refund-policy/page.tsx` in full and
   summarize exactly what it promises today (duplicate-charge refunds,
   14-day unused-purchase window, pro-rata partial refunds).
2. Flag the real trade-offs of moving to strict no-refund before writing
   anything: card-network chargeback exposure typically doesn't go away just
   because a policy says "no refunds" (Paddle, as Merchant of Record, may
   have its own baseline refund/dispute obligations independent of Oply's
   stated policy — check Paddle's merchant terms rather than assuming Oply's
   copy overrides them); some jurisdictions (e.g. EU/UK distance-selling
   rules for digital content) restrict how absolute a "no refund" stance can
   legally be without specific consumer consent language at time of
   purchase. Report these considerations back to the user explicitly before
   publishing new copy — this is a business/legal decision the user must
   make with eyes open, not one to execute silently.
3. Once confirmed, update `refund-policy/page.tsx` and the FAQ entries that
   reference refunds (`app/(marketing)/faq/page.tsx`, and the pricing page's
   own refund FAQ item) so every page agrees with each other — a customer
   should never see two different refund policies on two different pages.
4. Update the checkout/payment-confirmation copy (`components/billing/checkout-status.tsx`,
   the pricing page's FAQ) to match the new stance.
5. Bump the "Last updated" date on every legal page actually changed —
   don't bump `terms`/`privacy` if their content didn't change.

**Other page completeness check** (only add what's genuinely missing, don't
pad pages that are already complete):
- `about`, `contact`, `roadmap`, `faq` were all found complete and
  reasonably substantive as of this prompt's writing — re-verify they're
  still accurate (e.g. tool count references) rather than assuming they need
  new content.
- Consider whether a `/status` page (uptime/incident history) or a
  `/changelog` page (tying into the existing Roadmap's "Now/Next/Later"
  board) would be genuinely useful — only build one if there's a real data
  source to back it (e.g. a `changelog` table or a static MDX list you
  commit to keeping current), not as a placeholder.

## DELIVERABLES

1. Tools mega-menu in the header, mobile accordion equivalent.
2. In-nav search (reusing existing search infra if possible).
3. Footer additions (newsletter/social), each backed by a real destination.
4. A written summary of the refund-policy trade-offs, presented for
   confirmation BEFORE any policy copy is published.
5. Once confirmed: consistent refund copy across refund-policy, FAQ, pricing
   FAQ, and checkout status copy.

Report: exactly what changed, what you deliberately left as a question for
the user (especially Part 3's legal trade-offs), and confirm every page that
mentions refunds now says the same thing.
