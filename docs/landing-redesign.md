# Landing page redesign v2: design spec

The spec for the interactive MoneyApp landing page (`apps/web/app/page.tsx`),
built in stages. Every stage reads this first.

## Context

The v1 spec stripped out what made getkeeby.com fun (the sideways scroll track,
Lenis smoothness, the clickable keycap, handwritten notes, the bento, the drag
pad, the globe, the live counter, sound, heavy type) and the result felt flat.
v2 brings Keeby's *mechanics* back, rebuilt around MoneyApp's product:
**adding, splitting and settling an expense**. The one exception is the typing
test, which doesn't fit a money app.

**User decisions (2026-09-13):**

- Globe and counter use **simulated data, clearly labeled "demo"**: no backend,
  database, or API.
- **Keep the local Stage 2 branch.** Reword its commit and rebuild the hero on
  top of it.
- **Sound turns on after the visitor's first click**, with a mute pill in the
  nav.
- New libraries are OK.
- **No typing test.**

## Creative concept: "One night out, left to right"

The sideways track tells the story of a night out with friends. Each Keeby toy
becomes a gesture people already know from money.

| Keeby mechanic | MoneyApp version |
|---|---|
| Keycap toy ("hey! click me") | **Q keycap**, a sculpted keycap drawn like Keeby's (dished top face, flared body) in green with a black "Q" legend (the app's Quick Add key), only faint highlights and no glow, with the green handwritten "hey! tap to add" note whose arrow points at it. Clicking it or pressing Q on the page drops a random expense (Grab ₱240, Pizza night ₱1,200, Milk tea ₱390, Groceries ₱3,450) into the laptop's group ledger with a spring. A toast reads "New Expense Added", and a coin clink plays. |
| Laptop + menu-bar menu with switch rows | **Laptop showing the real MoneyApp group screen with the Add Expense modal.** Tapping "Split with Members" chips toggles people; "Divide Equally / Custom Amounts" flips the preview. Handwritten note: "pick who's in ↖". Labels mirror `create-expense-modal.tsx`. |
| Paper airplane slingshot | **Peso-note slingshot** (a folded ₱ bill as a paper plane) in the Settle panel. Pull back to charge (the amount grows with the pull, capped at the share) and release to send to Mika. It flies, lands on her avatar, and her row turns amber **Pending**; a "Payment Sent" toast fires. |
| Bento with hover-lit illustrations | **Bento of 8 real features**, each with a tiny illustration that lights neon on hover: Groups · Quick Capture (Q key) · Divide equally or custom · GCash or cash with proof · Two-sided verification · Notifications · Monthly dashboard · Offline capture on iOS. |
| Typing test + keyboard | **Dropped.** In its place: the **Add Expense playground** with a **cash-register keypad** of chunky keycaps (0–9, 00, ⌫). You tap an amount, not type prose. Pick a scenario chip, tap the amount, pick members, press **Add Expense**. A confirm line matches the product ("You paid ₱1,200 for 'Pizza night'. This will be split among 3 members."), a **receipt prints** (paper-tear sound) and flies into the ledger. |
| Tone pad | **"Slice the bill"**: a horizontal bill bar with draggable dividers between people (motion drag, snaps to ₱10). A live "Total assigned ₱X / ₱Y" check with "— amounts must match"; "Divide Equally" snaps the dividers back. Pizza-slice wedges resize in sync. |
| Globe with live pings | **"Splits around the world" (demo)**: a `cobe` globe in neon dots on black, drag to spin. A ₱ coin marker pings simulated cities, weighted to the Philippines (Manila, Cebu, Davao, Quezon City, Singapore, Tokyo, Dubai, LA). The caption reads "Demo · Splits happening in Cebu". |
| Live thock counter | **Nav pill "₱ 12,408,550 split · demo"**: a rolling @number-flow/react counter from a simulated base that ticks on a timer and jumps whenever the visitor adds an expense or sends a payment. The "demo" tag is always visible. |
| Feedback keycaps | **Not copied.** The toy cast is already full; the finale stays a CTA. |
| Audio pill | **Sound pill.** Sound starts on the first click; the pill mutes and unmutes and the choice is remembered. |
| Giant "Try it." finale | **"Split it. Settle it. Stay friends."** in giant type, a Get Started pill, and links on the right. |

**The track, left to right:**

1. Hero
2. Bento
3. Add Expense playground
4. Slice the bill
5. Settle with a flick (slingshot + verify)
6. Globe (demo)
7. Finale + footer

## Design system (landing page only)

- **Theme:** stays MoneyApp black + neon `#00ff41`. Keeby's white cards become
  `bg-[#0a0a0a]` cards with a 1px `border-border`, and hover lights the
  illustration neon.
- **Type:**
  - `next/font/google` in `components/features/landing/fonts.ts`: **Plus
    Jakarta Sans** (500–800) as `--font-display`, **Caveat** (600) as
    `--font-hand`.
  - Variables apply only on the landing root div, used via Tailwind arbitrary
    values: `font-[family-name:var(--font-display)]`.
  - Display: `font-extrabold tracking-[-0.04em] leading-[0.95]
    text-[clamp(2.75rem,6vw,5rem)]`.
  - UI: `text-[13px] font-medium tracking-[-0.02em]`.
  - Amounts: JetBrains Mono `tabular-nums` (already loaded).
  - The app keeps Inter.
- **Motion:**
  - Springs (motion `type:'spring'`, stiffness ~400, damping ~22) for toys.
  - Reveals use `cubic-bezier(0.22,1,0.36,1)`.
  - Keycaps and buttons press down (`translateY(2px)` plus a shorter bottom
    shadow).
- **Handwritten notes:** `hand-note.tsx`, Caveat text plus a hand-drawn SVG
  arrow that draws itself with motion `pathLength`, in muted green.
- **Sound** (`lib/landing/sound.ts` + `sound-provider.tsx`):
  - Synthesized with Web Audio, so there are no files or licenses: `tap`,
    `coin`, `tear`, `register`, `whoosh`, `thud`.
  - One `AudioContext` is created and resumed on the first `pointerdown` inside
    the landing root; after that, sound is on unless muted.
  - The mute state is stored in localStorage `moneyapp-landing-sound` (inside
    try/catch).
  - ±4% random pitch, chosen in event handlers only.
  - All of this is exposed through `useLandingSound()`.

## Architecture

- **Server/client split:** `app/page.tsx` stays a server component rendering
  the client `LandingShell` with server-rendered panel content as children.
- **LandingShell** (`landing-shell.tsx`):
  - Enabled only at lg+, with a fine pointer, and without reduced motion:
    `ReactLenis` from `lenis/react`; a tall container holds a
    `sticky top-0 h-[100dvh] overflow-hidden` stage with a flex track of
    panels; motion `useScroll` + `useTransform` moves it. Track width is
    measured with ResizeObserver.
  - Otherwise, panels stack vertically with no Lenis.
  - A bottom progress rail has panel dots that scroll to their panel.
  - `focusin` inside a panel scrolls the track to it;
    `#features`/`#how-it-works` map to panels.
- **Libraries** (added to `apps/web/package.json`; all support React 18):
  - `motion` ^13: springs, drag, `pathLength`, scroll-linked track.
  - `lenis` ^1.3: smooth scrolling.
  - `cobe` ^2: globe, loaded with `next/dynamic` and `ssr:false`.
  - `@number-flow/react` ^0.6: counter and amount rolls.
  - gsap is not used.
- **Simulated data** (`lib/landing/simulated.ts`): pure generators with a
  seeded PRNG for demo expenses, globe cities and counter steps. Randomness
  runs only in effects and handlers.
- **Shared demo activity** (`demo-activity-provider.tsx`): `expenseAdded` /
  `paymentSent` events with a `subscribe` API, which the nav counter and globe
  listen to.
- **jsdom safety:** `test/page.spec.tsx` snapshot-renders the whole page.
  Browser-only APIs (matchMedia, IntersectionObserver, ResizeObserver,
  AudioContext, canvas, Lenis, cobe) must be guarded or behind `next/dynamic`
  `ssr:false`, and each stage reviews and updates that snapshot
  (`bunx jest test/page.spec.tsx -u`).

## Guardrails (all stages)

- **Allowed:** `apps/web/components/features/landing/*`,
  `apps/web/lib/landing/*`, `apps/web/app/page.tsx`, landing tests in
  `apps/web/test/`, `docs/landing-redesign.md`, and the four new dependencies
  in `apps/web/package.json` plus the lockfile (Stage 2A only).
- **Don't modify:** `globals.css`, `tailwind.config.js`, `app/layout.tsx`,
  `postcss.config.*`, `components/ui/*`, `app/api/*`, `apps/api/prisma/*`, the
  mobile app.
- **No backend:** no API calls, no database access. The globe and counter are
  simulated and always labeled "demo".
- **Rendering:** no `Math.random`/`Date.now` during render; timers, observers,
  rAF, AudioContext, Lenis and cobe are cleaned up on unmount; animations pause
  off-screen.
- **Accessibility:** every toy has a button or keyboard equivalent; aria-live
  for state changes; reduced motion gives a vertical layout with no Lenis and
  instant transitions.
- **Copy:** Quick Add key is **Q**; ₱ everywhere; no "to the cent" claims; no
  typing test; no Keeby wording ("thock", "Type to hear it").
- **Checks:** the full `bun run lint` already has 19 problems (including a
  `postcss.config.mjs` parse error). Lint only the changed files with
  `bunx eslint --max-warnings 0`.
- **Git:**
  - Branch per stage, from the previous stage's branch (or from `main` once
    merged).
  - Small commits `Add: [OX] web landing stage N — <area>: <what>`.
  - Push at the end of each stage; open a PR only in Stage 7.

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

Added in Stage 2:

| Module | Export |
|---|---|
| `hero.tsx` / `hero-toasts.tsx` | `Hero`, `HeroToasts` |
| `fonts.ts` | `displayFont`, `handFont`, `landingFontVariables` |
| `sound-provider.tsx` | `SoundProvider`, `useLandingSound` |
| `sound-pill.tsx` | `SoundPill` |
| `hand-note.tsx` | `HandNote` |
| `demo-activity-provider.tsx` | `DemoActivityProvider`, `useDemoActivity`, `useDemoActivityListener` |

Added in Stage 3:

| Module | Export |
|---|---|
| `landing-shell.tsx` | `LandingShell`, `LandingPanel`, `TRACK_MEDIA_QUERY` (tested in `apps/web/test/landing-shell.spec.tsx`) |
| `panel.tsx` | `Panel`, `PanelWidth` (`'screen' \| 'content'`) |
| `smooth-scroll.tsx` | `SmoothScroll` (ReactLenis root) |
| `bento.tsx` | `Bento` |

Stage 3 notes:

- Lenis ships ESM only, which Jest can't load. `smooth-scroll.tsx` is loaded
  with `next/dynamic` (`ssr:false`) and only in track mode; tests mock it.
- The shell stamps `data-mode="track" | "vertical"` on a `group/shell` root.
  Panels and panel content style themselves with
  `group-data-[mode=track]/shell:` variants instead of reading context.
- The landing root uses `overflow-x-clip`, not `overflow-hidden`, which would
  stop the stage from sticking.
- In track mode the header is fixed over the stage, and panels pad
  `pt-24 pb-20` to clear the header and the rail.

Added in Stage 4:

| Module | Export |
|---|---|
| `add-expense-playground.tsx` | `AddExpensePlayground`, `RECEIPT_PRINT_MS`, `PLAYGROUND_TOAST_MS`, `PLAYGROUND_MAX_ROWS` (tested in `apps/web/test/landing-playground.spec.tsx`) |
| `bill-slicer.tsx` | `BillSlicer` |
| `peso-flow.tsx` | `PesoFlow` (₱ amounts through `@number-flow/react`) |

Stage 4 notes:

- `@number-flow/react` depends on ESM-only packages (`esm-env`), which Jest
  can't load. Specs that render a `PesoFlow` mock `@number-flow/react` with an
  `Intl` formatter and `require()` the component after the mock (see
  `test/page.spec.tsx`).
- The playground's keypad listens on its own focusable group, never `window`,
  so digits don't collide with the hero's page-wide Q key.
- The receipt flies into the ledger through a shared motion `layoutId`: the
  printing receipt unmounts in the same render the ledger row mounts.
- `expenseAdded` fires when the receipt lands, not on click; the nav counter
  wires up in a later stage.

Added in Stage 5:

| Module | Export |
|---|---|
| `settle-slingshot.tsx` | `SettleSlingshot`, `SETTLE_FLIGHT_MS`, `SETTLE_TOAST_MS`, `SETTLE_CONFETTI_MS`, `SETTLE_MAX_PULL`, `SETTLE_MIN_AMOUNT` (tested in `apps/web/test/landing-settle.spec.tsx`) |

Stage 5 notes:

- The note is a motion drag with a zero-size constraint box and
  `dragElastic`, so it rubber-bands. The charge comes from the raw pointer
  offset through `pullAmount` (₱10 steps, capped at Mika's ₱400 share), and
  releases under `SETTLE_MIN_AMOUNT` spring back.
- Release reads the charge from `onDragEnd`'s final `info.offset`, not from
  the last `onDrag`. Motion calls `onDrag` once per frame, so a quick flick
  can end before its last move reaches it.
- Send / Verify / Reset use `aria-disabled` rather than `disabled`, so the
  button a keyboard user just pressed keeps focus while it's unavailable. The
  handlers ignore presses in that state.
- The flight samples a quadratic arc into `x`/`y`/`rotate` keyframes. The
  landing is driven by a timer (`SETTLE_FLIGHT_MS`), not the animation, so
  Jest can advance it with fake timers.
- Status always comes from `demoSplitStatus`, which now takes the amount sent:
  a short pull shows **Partial**, as the real `splitStatus` would, and
  verifying it doesn't confirm the split.
- The panel watches `useInView`. Scrolling away clears its timers, stops the
  flight (a note mid-air lands quietly) and drops the toast and confetti.
- `paymentSent` fires on landing; the nav counter wires up in a later stage.

Added in Stage 6:

| Module | Export |
|---|---|
| `demo-globe.tsx` | `DemoGlobe`, `GLOBE_PING_MS`, `GLOBE_PING_REDUCED_MS` (tested in `apps/web/test/landing-globe.spec.tsx`) |
| `globe-canvas.tsx` | `GlobeCanvas`, `GLOBE_PULSE_MS` (not in the barrel; tested in `apps/web/test/landing-globe-canvas.spec.tsx`) |
| `nav-counter.tsx` | `NavCounter`, `COUNTER_TICK_MS` (tested in `apps/web/test/landing-nav-counter.spec.tsx`) |
| `finale.tsx` | `Finale` |

Stage 6 notes:

- `DemoGlobe` is the server-safe wrapper: heading, "Demo" tag, caption, spin
  buttons and the ping timer. Only `GlobeCanvas` (cobe, WebGL) is client-only,
  loaded with `next/dynamic` (`ssr:false`). Specs mock `cobe`; the barrel
  doesn't re-export `GlobeCanvas`, so importing the barrel never pulls cobe in.
- cobe 2 has no render loop of its own: `update()` draws a frame. The canvas
  runs one rAF loop only while the panel is in view, and with reduced motion
  it draws only when something changed (drag, spin button, ping).
- cobe wraps its canvas in a div and leaves it behind on `destroy()`, so the
  canvas is created imperatively inside a mount node React never renders into,
  and the cleanup empties that node.
- The ₱ ping coin is plain HTML positioned with `projectLocation`
  (`lib/landing/globe.ts`), which mirrors cobe's marker projection. That keeps
  it working without CSS anchor positioning.
- A hidden city, or the visitor's own expense (`expenseAdded` pings Manila
  with `focus`), turns the globe towards it. With reduced motion the globe
  never turns on its own; a focused ping jumps into view instead.
- Arrow buttons ("Spin the globe left/right") are the keyboard equivalent of
  dragging.
- `NavCounter` ticks only while `document.visibilityState` is visible and adds
  the amount of each `expenseAdded` / `paymentSent`.
- In track mode the finale shows the brand, Terms, Privacy and ©, and the page
  hides `LandingFooter` with `group-data-[mode=track]/shell:hidden`. In
  vertical mode the finale keeps only the CTA and the normal footer follows.

Pure demo logic lives in `apps/web/lib/landing/`:

- `demo.ts`: `DEMO_CURRENT_USER`, `DEMO_MEMBERS`, `DEMO_EXPENSE`,
  `equalShares`, `customValidity`, `demoSplitStatus`, `pullAmount`,
  `formatPeso` (tested in `apps/web/test/landing-demo.spec.ts`; `pullAmount`
  and the partial `demoSplitStatus` case in `landing-settle.spec.tsx`)
- `sound.ts`: `SOUND_NAMES`, `createAudioContext`, `playSound`, `randomPitch`
- `simulated.ts`: `mulberry32`, `createDemoRng`, `DEMO_SCENARIOS`,
  `randomDemoExpense`, `DEMO_CITIES`, `nextCity`, `COUNTER_BASE`,
  `nextCounterStep` (tested in `apps/web/test/landing-simulated.spec.ts`;
  `nextCity` takes an optional previous city and never repeats it)
- `globe.ts`: `GlobePing`, `GlobeNudge`, `GLOBE_THETA`, `GLOBE_MAX_DPR`,
  `globeDevicePixelRatio`, `phiFacing`, `shortestTurn`, `projectLocation`
  (tested in `apps/web/test/landing-globe.spec.tsx`)

Later stages add kebab-case modules in the same folder, for example
`laptop-mock.tsx`, `coin-key.tsx`, `landing-shell.tsx`, `panel.tsx`,
`bento.tsx`, `add-expense-playground.tsx`, `bill-slicer.tsx`,
`settle-slingshot.tsx`, `demo-globe.tsx`, `nav-counter.tsx`, `finale.tsx`.
