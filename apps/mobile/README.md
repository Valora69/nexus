# MoneyApp Mobile

Expo iOS-first client for [moneyapp.click](https://moneyapp.click). Talks to
the same serverless backend that powers `apps/web`.

## Prerequisites

- Bun 1.2.20 (root workspace)
- Xcode 15+ with an iOS 17 simulator
- An Apple developer account (only required for physical-device builds)

Install workspace deps from the repo root:

```bash
bun install
```

## Environment

Create `apps/mobile/.env` (never commit it):

```
EXPO_PUBLIC_API_URL=https://moneyapp.click
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=<iOS client id>.apps.googleusercontent.com
```

- `EXPO_PUBLIC_API_URL` — defaults to prod when unset. For local dev against
  a machine running `apps/web`, use your LAN IP (`http://192.168.x.x:3000`)
  so the simulator/device can reach the API. `localhost` inside a physical
  iPhone will not resolve back to your Mac.
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` — required for Google sign-in.

## Google OAuth setup

Google's native SDK requires a dedicated **iOS OAuth client** (the existing
web client is only accepted as an audience server-side). One-time setup:

1. In [Google Cloud Console → APIs & Services → Credentials], click
   **Create Credentials → OAuth client ID → iOS**.
2. Bundle ID: `click.moneyapp.mobile` (must match `ios.bundleIdentifier` in
   `app.json`).
3. Save. Copy the **Client ID** into
   `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` in `.env`.
4. The **iOS URL scheme** (the reversed client ID, e.g.
   `com.googleusercontent.apps.1234567890-abcdef`) is injected
   automatically by [`app.config.ts`](./app.config.ts) from
   `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` — no manual edit to a plist or
   `app.json` needed. If you change the env var, rebuild the dev client
   (`bunx expo prebuild --clean` then `expo run:ios`) so the new scheme
   lands in the app binary.

5. On the backend (Vercel env), set `GOOGLE_IOS_CLIENT_ID` to the same iOS
   client ID so `/api/auth/google/mobile` accepts idTokens issued to it.

> **Why the auto-injection matters.** Missing (or stale) reversed-scheme
> is the classic silent-failure mode: the account chooser opens, the user
> picks an account, and the redirect back into the app never fires. iOS
> then resolves the auth session as `dismiss` and the login button just
> re-arms — no error, no navigation. Deriving the scheme from the env
> keeps the two halves impossible to drift apart.

## Running

Native Google sign-in requires a **development build** — Expo Go cannot
register the custom URL scheme. For pure-UI iteration, Expo Go still works.

```bash
# Pure-UI iteration (no native Google sign-in)
bun run --cwd apps/mobile dev

# Development build (required for auth)
bunx --cwd apps/mobile expo prebuild --clean
bunx --cwd apps/mobile expo run:ios
```

Physical-device builds and TestFlight distribution go through EAS Build —
covered in a later stage.

## Styling

NativeWind v4. Tailwind classes on `className`; config in
`tailwind.config.js` mirrors the dark palette of `apps/web` (source of
truth: `packages/shared/src/theme/tokens.ts`). `global.css` holds only
the `@tailwind` directives — no custom CSS — and is imported once by
`src/app/_layout.tsx`.

## Auth lifecycle

- Token + user snapshot live in `expo-secure-store` (Keychain).
- Cold start: token is validated against `GET /api/auth/profile` before
  the app flips to `signedIn`. A tampered/expired token surfaces on the
  login screen, not on the first data screen.
- Foreground: `POST /api/auth/refresh` mints a fresh 7-day token so
  long-lived sessions don't get logged out mid-use.
- Any 401 from any endpoint clears storage and returns to `/login`.

## Verifying stage 4

On a dev build:

1. Launch → login screen appears.
2. Tap **Continue with Google** → Google chooser → home screen with
   user name and email.
3. Kill the app → relaunch → still signed in.
4. In `token-store.ts`, replace the stored token with garbage (or delete
   it via `SecureStore.deleteItemAsync('auth_token')`) → next launch
   returns to the login screen.
5. Force a 401 from any endpoint → app returns to `/login`.
