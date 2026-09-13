# Landing page redesign: design spec

The spec for the interactive MoneyApp landing page (`apps/web/app/page.tsx`),
built in stages, one `refactor/web-landing-stage-N-<topic>` branch per stage.
Every stage reads this first.

The goal is the *quality* of getkeeby.com (interactive storytelling, motion,
confident type) while staying unmistakably MoneyApp, **not a clone**. These were
rejected because they copy Keeby, not because they can't be built:

- sideways scroll track and Lenis
- a keycap toy
- handwritten notes
- a bento grid
- a typing test with an on-screen keyboard
- a drag pad
- a globe with visitor pings
- a live stats counter
- sound
- new libraries

## Principles

- Vertical scroll, normal browser scrolling, nothing hijacked.
- Every interaction shows a real product behavior.
- The visual language comes from `apps/web/public/moneyapp-promo.png`: a dark
  ledger/circuit grid, neon `#00ff41` traces, real notification toasts ("New
  Expense Added", "Payment Sent", "Split Confirmed"), monospace amounts.

## Page flow (top to bottom)

1. **Header.** The existing floating pill (logo, Features / How it works anchors,
   Sign in, Get Started). Moved as-is.
2. **Hero.** Headline "Split it. Settle it. Stay friends." with subtext and a
   primary CTA. On the right, an expense card ("Pizza night · ₱1,200 · 3 people")
   sits on a circuit grid, and three toasts rise along neon traces once.
   PixelTrail stays in the hero background only.
3. **Problem: Chat → Ledger.** Headline "You shouldn't need a spreadsheet to
   split a pizza." A messy group chat ("who paid for grab?", "i'll send later 🙏",
   "wait how much do i owe") collapses into one clean ledger row when the
   section enters view.
4. **How it works: one expense, three steps** (`#how-it-works`). On desktop (lg),
   a sticky expense card on the left and three step blocks on the right: 01
   Capture, 02 Split, 03 Settle. The step in view drives the card. Below lg, each
   step shows its own inline card.
   - **01 Capture.** A Quick Capture input driven by the real
     `parseGroupCapture`, with demo members James, Mika and Mara. Example chips:
     `450 dinner mika` (Mika owes you), `-450 dinner mika` (you owe Mika),
     `450 dinner m` (ambiguous: Mika or Mara? — the parser prefix-matches
     first names, so `ma` would match only Mara). Invalid input shows an inline
     hint. A `kbd` hint reads "Press Q anywhere in MoneyApp".
   - **02 Split.** An Equal / Custom segmented control that mirrors
     `components/features/expenses/create-expense-modal.tsx`: "Paid" badge on
     the payer, per-person shares, the "Total assigned X / Y — amounts must
     match" check, and "Excluded" when a share is zero. Custom uses number
     steppers, not a drag pad.
   - **03 Settle.** Mika's row moves through the real `splitStatus` states:
     "Mark paid · GCash + proof" → Pending → "Verify" (by you) → Paid. The
     "Payment Sent" and "Split Confirmed" toasts fire. A Reset button returns to
     the start.
5. **Spec sheet** (`#features`). A compact monospace list tied together by 1px
   trace lines: Groups & friend invites (email or link) · Notifications · Monthly
   dashboard · Personal transactions · iOS app with offline capture · GCash or
   cash with proof. No bento.
6. **Final CTA.** Centered "No more guessing where money goes." with "Free,
   forever." and Get Started, over a grid with converging traces.
7. **Footer.** Existing, moved as-is.

## Typography (no new fonts)

- Inter (already on `<body>`) for headlines:
  `font-semibold tracking-[-0.03em] leading-[1.02] text-[clamp(2.25rem,5vw,4rem)]`.
  Section headings are the same with a smaller clamp.
- JetBrains Mono (already loaded as `font-mono`) with `tabular-nums` for every
  amount, step number ("01"), label, status and annotation.
- Body copy: Inter, `text-muted`, 16–18px.

## Surfaces and color

- Ledger surfaces: solid `bg-[#0a0a0a]`, `border border-border`, `rounded-2xl`.
- Glass (`backdrop-blur`) only on floating layers: toasts and the capture bar.
- Neon `#00ff41` only for traces, the active step number, the Paid state, the
  primary CTA (`shadow-glow`) and focus rings.
- Statuses: unpaid is muted, pending is amber, paid is neon.

## Motion

- **Reveals:** `ease-[cubic-bezier(0.22,1,0.36,1)]`, 400–600ms, opacity plus an
  8px rise, triggered once.
- **Direct manipulation** (segmented control, steppers, status chips):
  `ease-[cubic-bezier(0.34,1.4,0.64,1)]`, 250ms.
- **Buttons:** `active:scale-[0.98]`.
- **Amount changes:** keyed swap, old value out and new value in.
- **Reduced motion:** no auto-play, instant state changes, PixelTrail off
  (already gated).

## Guardrails (every stage)

- **Don't modify:**
  - `apps/web/app/globals.css`, `tailwind.config.js`, `app/layout.tsx`,
    `postcss.config.*`, `components/ui/*`
  - `apps/api/prisma/*`, `app/api/*`
  - `package.json` (no new dependencies: no lenis, cobe, motion, number-flow;
    don't use gsap on this page)
- **No:** `/api` calls, database access, audio, globe, live counters, handwritten
  fonts, horizontal scroll, global keydown listeners.
- **Rendering:**
  - `app/page.tsx` stays a server component. Only interactive islands get
    `'use client'`, and copy is rendered on the server.
  - No `Date.now()` or `Math.random()` during render; auto-play starts in
    `useEffect`.
  - Observers and timers are cleaned up on unmount and paused when off-screen.
- **Copy corrections:** Quick Add key is **Q** (B is only legacy). Don't claim
  splits are "to the cent" (equal shares are `total / n` floats). Use ₱ on the
  landing page.
- **Shared code:** reuse `lib/quick-capture/parseGroupCapture.ts`,
  `@repo/shared/utils/splits` (`splitStatus`, via `lib/utils/splits`),
  `components/effects/PixelTrail.tsx`, `components/ui/button.tsx`
  (`buttonClasses`), `components/ui/brand-logo.tsx`.
- **Git:**
  - One branch per stage, named `refactor/web-landing-stage-N-<topic>`. Stage 1
    branches from `main`; each later stage branches from the previous stage's
    branch (or from `main` once that stage is merged).
  - Small focused commits, message style
    `Add: [OX] web landing stage N — <area>: <what>`.
  - Push the stage branch at the end of the stage
    (`git push -u origin <branch>`). Don't open a PR unless asked.

## File conventions (set in Stage 1)

Landing components live in `apps/web/components/features/landing/`. Filenames
are kebab-case with named exports and an `index.ts` barrel, like the other
feature folders:

| Module | Export |
|---|---|
| `expense-card.tsx` | `ExpenseCard` (plus `ExpenseCardRow`) |
| `notification-toast.tsx` | `NotificationToast` |
| `circuit-grid.tsx` | `CircuitGrid` (`variant: 'scatter' \| 'converge'`) |
| `use-in-view.ts` | `useInView` |
| `use-prefers-reduced-motion.ts` | `usePrefersReducedMotion` |
| `landing-header.tsx` | `LandingHeader` |
| `landing-footer.tsx` | `LandingFooter` |

Pure demo logic lives in `apps/web/lib/landing/demo.ts`:

- `DEMO_CURRENT_USER`, `DEMO_MEMBERS`, `DEMO_EXPENSE`
- `equalShares`, `customValidity`, `demoSplitStatus`, `formatPeso`

It is tested in `apps/web/test/landing-demo.spec.ts`.

Later stages add kebab-case modules in the same folder, for example `hero.tsx`,
`hero-toasts.tsx`, `chat-to-ledger.tsx`, `expense-story.tsx`, `capture-step.tsx`,
`split-step.tsx`, `settle-step.tsx`, `spec-sheet.tsx`, `final-cta.tsx`.
