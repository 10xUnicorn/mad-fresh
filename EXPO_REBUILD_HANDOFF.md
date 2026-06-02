# Mad Fresh Kitchen — REAL Native App Build (Expo / React Native)

> Paste this ENTIRE file as the first message of a fresh Claude Code session at
> `/Users/danknightunicorn/Claude Home/mad-fresh/`. **Use Opus.** Stay in ONE session —
> do not switch conversations mid-build (a context switch is what broke the prior attempt;
> if you must restart, point the new session back at THIS file and lose nothing).
> Do not stop between phases — run straight through A→H, self-testing as you go,
> until the iOS app builds and is ready for App Store submission.

---

## 🚫 SCOPE GATE — CONFIRM BEFORE WRITING ANY CODE

Before touching a single file, read this back and confirm in your first response:

> "I am building a TRUE React Native app using **Expo**, with native components and native
> navigation, submitted to the App Store as a real compiled binary. I am NOT theming the
> Next.js app. I am NOT wrapping it in Capacitor or any webview. Capacitor is a FORBIDDEN
> output. If at any point my plan reduces to 'restyle/wrap the existing web app', I will stop."

If you cannot confirm that, stop and ask. The previous attempt failed by silently substituting
a Capacitor webview + color retheme for the real native app. That must not happen again.

**Capacitor is being abandoned.** Delete reliance on `capacitor.config.js` and the `ios/` Capacitor
shell for the customer app. The web app keeps running on Next.js; the mobile app becomes Expo.

---

## What we are building (and what we are NOT)

| Surface | Tech | Status |
|---|---|---|
| Marketing website | Next.js (existing) | ✅ keep as-is |
| Customer **web** account/ordering | Next.js (existing) | ✅ keep — non-app users still use this |
| **Admin dashboard** | Next.js (existing, web only) | ✅ keep as-is |
| API routes `src/app/api/**` | Next.js (existing) | ✅ keep — the mobile app CALLS these |
| **Customer MOBILE app** | **NEW Expo / React Native** | 🔨 build this |

The native app does NOT get its own backend. It calls the SAME endpoints at
`https://madfresh.app/api/...` and the SAME Supabase project the web app uses.

### Why Expo (not bare React Native)
Expo IS React Native plus the toolchain you need: **EAS Build** (cloud-compiles the iOS `.ipa`
without a fragile local Xcode setup), push notifications, OTA updates, native module access,
and a clean App Store submission path. Use Expo (managed workflow + EAS). Do not use bare RN
unless a required native module is unsupported by Expo (none are, for this app).

---

## Reusable assets (the "brain" — do NOT rebuild, reuse)

These already exist and transfer directly:
- `src/types/database.ts` — typed Supabase schema. Reuse in the Expo app.
- `src/lib/constants.ts` — business constants. Reuse.
- `src/lib/stripe.ts` patterns — Stripe lives server-side; mobile calls `/api/checkout` etc.
- The full REST API surface (already built, ~45 routes), including:
  `menu`, `checkout`, `orders/[id]/modify`, `subscriptions` (+ `/checkout`, `/manage`),
  `rewards/redeem`, `referrals/code`, `coupons/validate`, `dashboard/reorder`,
  `donations`, `payment-config`, `webhooks/stripe`, `send-order-confirmation`, etc.
- Design tokens (Sage & Cream) — convert the hex values to an RN theme object (below).
- All copy and brand assets in `/public/images/brand/`.

**Sage & Cream → RN theme object** (create `theme.ts` in the Expo app):
```
green #3d6b2a · greenLight #5aaa3c · greenAccent #75F663
bg #faf8f3 · bgAlt #f2efe8 · surface #ffffff · warm #fff8ee · warmBorder #f0ddb8
textPrimary #1e2d18 · textSecondary #4a5e3a · textMuted #7a7060 · textFaint #9a9080
border #ddd8cc · borderFocus #3d6b2a
success #e9f0e4/#3d6b2a · warning #fff8ee/#b45309 · error #fef2f2/#dc2626 · info #eff6ff/#2563eb
radius sm8 md12 lg16 xl20 full9999
```

---

## Customer screens to rebuild natively
Source of truth for what each screen does = the existing web pages under
`src/app/(customer)/`: dashboard, menu, order, orders (+ orders/[id]), subscription,
rewards, achievements, referrals, profile, account, addresses, donations, my-donations,
catering. Plus auth: login, signup, forgot-password.

Rebuild each as a native screen with native navigation. Match the web's data flow (same API
calls, same Supabase queries) but use native UI patterns — NOT a webview, NOT a ScrollView of
divs. Use proper native lists (FlashList/FlatList), native modals/sheets, native tab bar.

---

## 🚨 Critical flags

1. **Web + web-account-access + admin must keep working.** Do not modify `src/app/(public)`,
   `src/app/(admin)`, `src/app/(super-admin)`, or `src/app/api/**` except to ADD any new
   mobile-needed endpoints. If you add an endpoint, don't break existing ones.
2. **Stripe + App Store:** physical food = exempt from Apple IAP (rule 3.1.1). Use
   `@stripe/stripe-react-native` with native **Apple Pay**. Checkout still posts to the existing
   server `/api/checkout` + `/api/subscriptions/checkout`; `/api/webhooks/stripe` stays untouched.
   Never use "in-app purchase / digital goods" language.
3. **Push notifications:** set up Expo push (the founder wants order/subscription reminders +
   out-of-stock alerts via push). Wire the token capture; backend send can be a fast-follow.
4. **Auth:** Supabase auth in RN uses `@supabase/supabase-js` + AsyncStorage session storage
   (NOT the SSR cookie flow the web uses). Same Supabase project, same users.

---

## Repo structure (do it right, WITHOUT breaking the live web app)
Goal: web and mobile share one source of truth so logic never drifts — but the existing,
deployed Next.js web app must keep working the entire time. **Do NOT move or restructure the
existing Next.js app** (moving it breaks `vercel.json`, the `.vercel` link, and the deploy).

Do this instead:
- Add the Expo app in a NEW subfolder: `mobile/` at the repo root. Leave the Next.js app in place.
- Create a shared layer the Expo app imports from: a local package `shared/` (or TS path alias)
  containing Supabase types, constants, the typed API client, and the design-token theme object.
  Copy the small, stable pieces (`src/types/database.ts`, `src/lib/constants.ts`) into `shared/`
  and have BOTH apps reference them. Do not rewire the 132 existing web imports — leave web as-is.
- Centralize the API base URL (`https://madfresh.app`) and a typed API client in `shared/`.
- Verify the web app still builds (`npm run build` at root) AFTER adding the mobile folder.

This gives "logic syncs" for what matters with zero risk to the running web app. A full
`apps/web` + `apps/mobile` monorepo migration is a LATER cleanup — not now, not before June 18.

## Environment & secrets (state this or it WILL fail)
The Expo app needs its own env vars, prefixed `EXPO_PUBLIC_` so Expo exposes them client-side:
- `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` (publishable key ONLY — secret key stays server-side)
- `EXPO_PUBLIC_API_BASE_URL` = `https://madfresh.app`
Pull the values from the existing root `.env.local`. NEVER put the Stripe secret key or service-role
key in the mobile app. Add `mobile/.env*` to `.gitignore`.

## Mobile auth → API (the subtle one — handle explicitly)
The existing web API routes read the Supabase session from **cookies** (SSR). A native app has no
cookies — it sends the session as a header: `Authorization: Bearer <access_token>`.
For each protected endpoint the mobile app calls, verify the route accepts a bearer token; where a
route only reads cookies, ADD bearer-token support (read the JWT from the Authorization header and
validate via Supabase) WITHOUT breaking the existing cookie path the web depends on. Test both.

## Apple / signing — NOT a blocker for this build (handle last)
The Mad Fresh Apple Developer account does NOT exist yet and approval can take a day or two.
This MUST NOT block or slow the build. Build the ENTIRE app without it:
- The full app builds, runs in the iOS simulator, and runs on a real iPhone via Expo Go / a dev
  client — none of that needs an Apple Developer account.
- In Phase H, produce a **simulator/dev build** and confirm the app works end-to-end there.
- Then leave a clearly-marked "APP STORE SUBMISSION TODO" in `CLAUDE.md` with the exact remaining
  steps the founder does ONCE the account is approved: create the org Apple Developer account
  (start now — needs business verification / D-U-N-S, ~1–2+ days), create the app in App Store
  Connect, run `eas build --platform ios` (signed) + `eas submit`, attach metadata from
  `APP_STORE_LISTING.md`. Producing the signed store binary later is a short final step, not a rebuild.

---

## Execution plan — run straight through, self-test each phase, DO NOT STOP

**Phase A — Scaffold & confirm scope**
Confirm the scope gate. Scaffold Expo (managed) at `mobile/` (do NOT move the existing web app).
Set up EAS (`eas.json`), app config (name, bundle id `com.madfresh.app`), `EXPO_PUBLIC_*` env,
**copy brand assets** from `public/images/brand/` into `mobile/assets/` (Expo can't read the web
app's `/public`), set up icons/splash, `theme.ts` (Sage & Cream object), and the navigation
skeleton (auth stack + main tab bar). Verify it boots in the iOS simulator. Verify the web app
still builds at root afterward.

**Phase B — Shared layer & API client**
Wire Supabase RN client (AsyncStorage sessions). Build typed API client pointing at
`https://madfresh.app/api`. Import shared types/constants. Smoke: app fetches `/api/menu` and logs real data.

**Phase C — Auth**
Login, signup, forgot-password as native screens against Supabase. Session persists across
restarts. Smoke: log in as a real customer, token persists.

**Phase D — Core ordering loop (highest value)**
Menu browse (native list) → item/nutrition detail → cart → checkout with Stripe RN + Apple Pay
→ order confirmation. Uses existing `/api/menu`, `/api/checkout`. Smoke: place a test order with
Stripe test card `4242 4242 4242 4242` → order appears in Supabase + admin web. NO real charge.

**Phase E — Account & dashboard**
Dashboard (points/streak/level), orders + order detail + reorder, subscription view/manage,
profile, account, addresses. Smoke: each screen loads real data for a logged-in user.

**Phase F — Engagement**
Rewards/redeem, achievements, referrals, donations. Push-notification token capture wired.
Smoke: redeem flow hits `/api/rewards/redeem`; push token registered.

**Phase G — Native polish**
Loading/empty/error states, pull-to-refresh, safe areas, haptics, app icon, splash, smooth
transitions. It must FEEL native — this is the founder's App Store case study. No webview feel anywhere.

**Phase H — Build & submission prep**
`eas build --platform ios` → produce a real `.ipa`. Prepare App Store Connect metadata
(`APP_STORE_LISTING.md` exists — reuse). Document the submit steps. Confirm the binary runs on a
device/simulator. Update `CLAUDE.md` with "Expo native customer app built — [date]" (surgical).

---

## Hard rules
- Confirm the scope gate before any code. Capacitor/webview output = forbidden.
- Don't touch `src/app/api/**`, admin, super-admin, public web, `AGENTS.md`, `vercel.json`,
  Stripe server flow, or `webhooks/stripe` except to ADD mobile endpoints.
- Run `project-selector` before any Supabase/Vercel/EAS infra action.
- Reuse the brain (types, lib, API, tokens, copy). Rebuild only the skin, natively.
- Self-test after every phase; keep going until Phase H is done. Do not stop mid-build to ask
  permission for expected steps — only stop if the scope gate would be violated or a real blocker hits.
- Commit after each phase (git is initialized; root commit 210e3a4 is your rollback base).

## Definition of done & handoff-back
When Phase H is reached, leave a short status block at the BOTTOM of `CLAUDE.md` titled
"📱 Expo Native App — Status" containing:
- which phases are complete, what was self-tested, and any failures still open;
- exactly what the founder must do next, in plain steps — e.g. "1) run `cd mobile && npx expo start`,
  scan the QR with your iPhone to test it on a real device; 2) to ship: complete the Apple Developer
  steps listed in the Phase H TODO";
- if a fresh session is ever needed, it should be able to read `EXPO_REBUILD_HANDOFF.md` + that
  status block and resume with zero lost context.
The job is NOT done when colors look right. It is done when there is a real, native, installable
iOS app that places an order end-to-end. That is the bar.

## Start
1. Confirm the scope gate (native Expo, not Capacitor/retheme/webview).
2. `project-selector` to confirm Supabase + Vercel/EAS targets.
3. Phase A. Then B→H, straight through, self-testing, committing after each phase.
   Do not stop until there's a real native iOS app that can place an order. Build the real app.
