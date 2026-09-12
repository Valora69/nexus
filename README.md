# MoneyApp

Shared expense tracking for groups of friends — split a bill, record who paid,
settle up, and keep everyone's balance honest.

Live at **[moneyapp.click](https://moneyapp.click)**, with an iOS companion app
built on the same backend.

---

## What it does

- **Groups** — create a group, add members, track everything spent inside it.
- **Expenses & splits** — one expense fans out into per-member `ExpenseSplit`
  rows. Split logic lives in [`packages/shared/src/utils/splits.ts`](packages/shared/src/utils/splits.ts)
  so web and mobile compute identical numbers.
- **Payments** — settle a split via GCash or cash, attach proof, and have the
  payee verify it. Unverified payments stay pending, so a claim alone never
  clears a debt.
- **Friends** — invite by email. Recipients who don't have an account yet get a
  tokenised invite link that completes the friendship right after they sign in.
- **Notifications** — an in-app inbox covering expenses, payments, and friend
  requests, written after the business transaction commits.
- **Dashboard** — per-month view of what you owe and what you're owed.
- **Personal transactions** — track money movement outside any group.
- **Quick capture** — parse a freeform line into a group expense.
- **Offline outbox (mobile)** — queue expenses and payments while offline and
  replay them safely; `clientRequestId` is unique server-side, so a replayed
  row can never create a duplicate.

---

## Repository layout

This is a [Turborepo](https://turborepo.com) monorepo managed with
[Bun](https://bun.sh) workspaces.

```
.
├── apps
│   ├── web       # Next.js (App Router) — UI *and* backend. Deployed on Vercel.
│   ├── mobile    # Expo / React Native, iOS-first. Talks to apps/web.
│   └── api       # NestJS — legacy backend, see note below. Deployed on Render.
└── packages
    ├── shared            # @repo/shared — types, split math, query keys, theme tokens
    ├── ui                # @repo/ui — shared React components
    ├── api               # @repo/api — shared NestJS resources
    ├── eslint-config     # @repo/eslint-config
    ├── jest-config       # @repo/jest-config
    └── typescript-config # @repo/typescript-config
```

### A note on `apps/api`

The project is mid-migration from a standalone NestJS service to Next.js route
handlers colocated with the web app. Every client domain has already been
flipped to the same-origin handlers — see `API_BASES` in
[`apps/web/lib/client/config.ts`](apps/web/lib/client/config.ts), where all
twelve entries point at `LOCAL`.

In practice that means:

- **`apps/web` is the live backend.** Route handlers live in
  `apps/web/app/api/**`, business logic in `apps/web/lib/server/services/**`,
  and they talk to Postgres through Prisma directly.
- **`apps/api` is legacy** and no longer serves the web client — but it still
  **owns the Prisma schema and migrations** at
  [`apps/api/prisma/schema.prisma`](apps/api/prisma/schema.prisma). `apps/web`
  generates its client from that file. Schema changes go there.

---

## Stack

| Layer      | Technology |
| ---------- | ---------- |
| Web        | Next.js (App Router), React, Tailwind CSS, Radix UI, TanStack Query |
| Mobile     | Expo, Expo Router, React Native, NativeWind, TanStack Query |
| Backend    | Next.js route handlers (primary) · NestJS (legacy) |
| Database   | PostgreSQL (Supabase) via Prisma 6 |
| Auth       | Google OAuth only — no passwords. JWT in an HTTP-only cookie (7 days). |
| Email      | Resend |
| Tests      | Jest · Playwright |
| Tooling    | Turborepo, Bun, TypeScript, ESLint, Prettier |
| Hosting    | Vercel (`sin1`) for web · Render (Singapore) for the legacy API |

---

## Getting started

### Prerequisites

- [Bun](https://bun.sh) 1.2.20
- Node.js ≥ 18
- A PostgreSQL database (Supabase works out of the box)
- A Google Cloud project with OAuth credentials — see
  [`GOOGLE_OAUTH_SETUP.md`](GOOGLE_OAUTH_SETUP.md)
- Xcode 15+ with an iOS 17 simulator (only for `apps/mobile`)

### Install

```bash
git clone https://github.com/Valora69/nexus.git
cd nexus
bun install
```

### Configure

Each app has its own `.env.example`. Copy and fill them in:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp apps/mobile/.env.example apps/mobile/.env
```

Key variables:

| Variable | Used by | Purpose |
| -------- | ------- | ------- |
| `DATABASE_URL` | web, api | Pooled Postgres connection used at runtime |
| `DIRECT_URL` | api | Direct connection, used only by `prisma migrate deploy` |
| `JWT_SECRET` | web, api | Session token signing — generate with `openssl rand -hex 64` |
| `AUTH_SECRET` | api | Legacy API session secret |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | web, api | Web OAuth client |
| `GOOGLE_IOS_CLIENT_ID` | web, api | iOS OAuth client, accepted as `aud` on mobile idTokens |
| `GOOGLE_CALLBACK_URL` | api | OAuth redirect target |
| `FRONTEND_URL` | web, api | Origin used to build links in outbound email |
| `COOKIE_DOMAIN` | web | Scope of the session cookie |
| `RESEND_API_KEY` / `EMAIL_FROM` | web, api | Transactional email |
| `ALLOWED_ORIGINS` | api | Comma-separated CORS allowlist |
| `NEXT_PUBLIC_API_URL` | web | Legacy API origin; unused while every domain is same-origin |
| `EXPO_PUBLIC_API_URL` | mobile | Backend origin — use your LAN IP for device testing |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | mobile | iOS OAuth client ID |

> **Heads up:** `apps/web/.env.example` currently documents only
> `NEXT_PUBLIC_API_URL`. Because the web app is now the backend, it also needs
> `DATABASE_URL`, `JWT_SECRET`, the Google credentials, and the Resend
> credentials to run locally. Use the table above until that file catches up.

> `.env` files are gitignored. Never commit real credentials.

### Set up the database

```bash
bunx prisma migrate deploy --schema apps/api/prisma/schema.prisma
bunx prisma generate --schema apps/api/prisma/schema.prisma
```

Optionally seed with [`apps/api/prisma/seed.ts`](apps/api/prisma/seed.ts).

### Run

```bash
# every app in the monorepo
bun run dev
```

Or one at a time:

```bash
cd apps/web && bun run dev      # http://localhost:3000
cd apps/api && bun run dev      # http://localhost:8080
cd apps/mobile && bun run ios   # iOS simulator
```

Open <http://localhost:3000/login> and sign in with Google.

---

## Commands

Run from the repo root; Turborepo fans each task out across workspaces.

```bash
bun run dev        # start all dev servers
bun run build      # build every app and package
bun run test       # unit tests (Jest)
bun run test:e2e   # end-to-end tests (Playwright)
bun run lint       # lint everything
bun run format     # Prettier across .ts, .tsx, .md
```

Useful workspace-level commands:

```bash
# detect drift between migrations and schema.prisma
cd apps/api && bun run prisma:check-drift

# typecheck the mobile app
cd apps/mobile && bun run typecheck
```

---

## Testing

Unit and integration tests live in [`apps/web/test`](apps/web/test) and cover
the parts most likely to cost real money if they break — split math, payment
verification rules, group authorization, notification building and persistence,
friend-invite acceptance, and OAuth return-path safety.

```bash
cd apps/web
bun run test              # Jest
bun run test:e2e          # Playwright (test/e2e/*.e2e-spec.ts)
```

---

## Deployment

**Web** → Vercel, region `sin1`. Configured in
[`apps/web/vercel.json`](apps/web/vercel.json). `prisma generate` runs as part
of the build against the schema in `apps/api`.

**Legacy API** → Render, Singapore, service `moneyapp-api`. Configured in
[`apps/api/render.yaml`](apps/api/render.yaml). Migrations are applied on
start via `prisma migrate deploy`; health check at `/api/health`.

**Mobile** → built with Expo. Bundle ID `click.moneyapp.mobile`. See
[`apps/mobile/README.md`](apps/mobile/README.md) for the build and OAuth setup.

---

## Further reading

- [`apps/mobile/README.md`](apps/mobile/README.md) — mobile setup, Google OAuth
  for iOS, and the reversed-client-ID gotcha
- [`GOOGLE_OAUTH_SETUP.md`](GOOGLE_OAUTH_SETUP.md) — Google Cloud Console walkthrough
- [`POST_AUTH_SETUP.md`](POST_AUTH_SETUP.md) — how the auth flow fits together
- [`apps/api/prisma/schema.prisma`](apps/api/prisma/schema.prisma) — the data model

---

## License

UNLICENSED — private project.
