# OPLY.ME — ADVANCED ANIMATION & VISUAL DESIGN PROMPT

Paste this into Claude Code with the repository open. It pushes Oply's motion
and visual design a level further — new components, new surfaces — without
redoing work that already shipped.

---

## ROLE

You are a senior front-end/motion engineer working in the Oply codebase
(Next.js 15 App Router, TypeScript, Tailwind, Framer Motion, at
https://oply.me). The homepage, tools listing page, and individual tool
workspace already received a full motion pass — do not re-propose any of the
following, they exist and work:

- `components/marketing/reveal.tsx` — scroll-triggered fade+slide-up
- `components/marketing/hero-headline.tsx` — cycling headline
- `components/marketing/animated-stat.tsx` — count-up stat band
- `components/marketing/tool-card.tsx` + `tool-card-preview.tsx` — hover/tap
  lift, icon micro-animation, ribbon badges, synthetic before/after
- `components/marketing/tools-explorer.tsx` — sliding filter-pill indicator,
  category-switch skeleton
- `components/tools/generation-progress.tsx` — staged progress bar
- `components/tools/tool-example-toggle.tsx` — before/after toggle
- `components/copy-button.tsx` — copy-to-clipboard micro-animation

Tailwind already has these keyframes/animations (`tailwind.config.ts`):
`accordion-down/up`, `fade-up`, `shimmer`, `float`/`float-slow`,
`marquee`/`marquee-slow`, `spin-slow`. Reuse and extend these before adding
new keyframes for the same kind of motion.

## NON-NEGOTIABLE RULES

1. **Respect `prefers-reduced-motion`.** A global CSS rule already exists in
   `app/globals.css`; every new Framer Motion component must also call
   `useReducedMotion()` itself (the CSS rule does not touch JS-driven
   transforms — this is the pattern every existing motion component follows,
   copy it).
2. **No fabricated content.** Any new stat, badge, or social-proof element
   must be backed by a real, derivable number (tool count, credit pricing,
   category counts) — never an invented user count, rating, or testimonial.
   `lib/seo/jsonld.ts` and `config/tools.ts`'s `GLOBAL_SYSTEM_RULES` both
   enforce this elsewhere in the codebase; visual design does not get an
   exception.
3. **Ship real, working code**, not CSS-only mockups. Every animation must be
   demonstrated running in a browser (via the `run` skill or an equivalent
   screenshot/interaction check) before you report it done.
4. **Don't touch what already works.** Anything listed under ROLE above is
   finished — extend it via new props/composition, don't rewrite it.
5. **Type safety.** `npm run typecheck` and `npm run test` must pass.

## WHERE TO ADD NEW MOTION (the actual gaps)

1. **Dashboard** (`app/dashboard/**`, `components/dashboard/*`) — currently
   has zero Framer Motion usage. Add:
   - Animated count-up on the dashboard's stat cards (balance, used this
     month, lifetime purchased) reusing the existing
     `components/marketing/animated-stat.tsx` pattern — do not build a second
     counter component, adapt/export the existing one for reuse outside
     `marketing/`.
   - A staggered fade-in for list-shaped panels (recently used tools,
     favorites, recent transactions, orders table) using
     `components/marketing/reveal.tsx` with per-item `delay` staggering.
   - A toast/notification entrance animation when a generation completes
     while the user is elsewhere in the dashboard (check whether `sonner`,
     already a dependency, is used dashboard-side yet).
2. **Tool workspace result panel** (`components/tools/tool-workspace.tsx`) —
   the result itself (text, structured JSON, image) currently just appears.
   Add an entrance transition (fade+slight-scale) when `result` first
   populates, using `AnimatePresence` the same way `ImageResultView`/
   `CopyButton` already use it. Do not touch the generation-progress bar
   itself, it's finished.
3. **Category cards and pricing cards** (`components/marketing/category-card.tsx`,
   pricing table in `components/marketing/pricing-table.tsx`) — currently
   CSS-hover only. Bring them up to the same `motion.create(Link)`
   whileHover/whileTap standard already used in `tool-card.tsx`, for
   consistency across the site rather than two different hover idioms.
4. **Page transitions** — evaluate (don't assume) whether a subtle
   route-level fade between marketing pages is worth the complexity in the
   App Router (this typically needs a client-side layout wrapper and has
   real trade-offs with streaming/SSR). Report the trade-off and a
   recommendation rather than silently building it if it conflicts with
   existing server-rendering.
5. **New, genuinely new UI elements** — components/ui/ currently has no
   `sheet`/drawer (the mobile sidebar drawer in
   `components/dashboard/sidebar.tsx` is a hand-rolled div), no `command`
   palette primitive (check whether `ToolSearch`'s ⌘K is hand-rolled or uses
   `cmdk`, already a dependency, before adding a second implementation), no
   `alert-dialog`, no `slider`, no `hover-card`. Only add ones you have an
   actual use for below — don't add unused primitives:
   - A `Sheet` (radix-based slide-in panel) to replace the hand-rolled mobile
     sidebar drawer, animated with a real spring/ease rather than a plain
     Tailwind transition.
   - A `HoverCard` for tool-name mentions in history/favorites lists, showing
     a mini preview (icon, tagline, credit cost) on hover — reuses
     `ToolIcon`/`categoryColors`, no new data needed.
6. **Background/ambient motion beyond the hero** — `components/marketing/backdrop.tsx`'s
   `SoftBackdrop`/`OrbitRing` are already used on interior sections. Consider
   (don't assume) a subtle parallax on scroll for these, gated behind
   `useReducedMotion()` and only on sections where it doesn't fight with text
   readability — screenshot before/after to judge this rather than guessing.

## VISUAL DESIGN, NOT JUST MOTION

- Audit spacing/typography consistency across `app/dashboard/**` — it was
  built before the marketing-site motion pass and reads visually flatter.
  Bring its card/stat/list styling in line with the marketing site's
  category-hue system (`categoryColors()` in `config/categories.ts`) where a
  dashboard element relates to a specific tool or category.
- Empty states (`EmptyState` component, used in favorites/history/projects)
  are currently static — give them a small illustrative animation (an
  icon-draw-in or gentle float) rather than a static icon, since these are
  high-visibility "nothing here yet" moments for new users.
- Dark mode: spot-check every new component in both themes — this codebase's
  category-hue and brand-gradient system is theme-aware
  (`hsl(var(--brand))`-style tokens), verify new components use the same
  tokens rather than hardcoded colors.

## DELIVERABLES

1. Dashboard motion pass (stat counters, staggered list reveals, result-panel
   transition).
2. Category/pricing card hover parity with `tool-card.tsx`.
3. A `Sheet`-based mobile drawer replacing the hand-rolled one, if not already
   using `cmdk`/radix primitives — confirm current state first, don't
   duplicate.
4. A short before/after screenshot set (light + dark) proving each change
   actually renders, taken via a real browser, not described from code.
5. `npm run typecheck`, `npm run test`, `npm run build` all passing.

Report back: what you built, what you deliberately chose not to build and
why (e.g. page transitions if the SSR trade-off wasn't worth it), and any
place you found fabricated/placeholder content while auditing that needed
removing instead of animating.
