@AGENTS.md

## Sage & Cream app + admin recode complete — 2026-06-02
- Phases A–F: customer shell, admin shell, all customer pages, menu/ordering/checkout,
  all admin pages + components, shared/straggler/dead-component cleanup, Capacitor config.
- Design tokens: bg #faf8f3, green #3d6b2a, text #1e2d18, border #ddd8cc.
- Stripe payment flow untouched (Flag 2). API routes untouched.
- dd-trace instrumentation guarded (requires DD_API_KEY to load).

## Expo Native App — Status (2026-06-02)

### Phases Complete
- **Phase A** — Expo SDK 56 scaffold at `mobile/`, app config, eas.json, theme, brand assets, navigation skeleton (auth stack + 5-tab bar). Web app unbroken.
- **Phase B** — Shared layer (`shared/`) with database types, constants, typed API client. Supabase RN client with SecureStore sessions.
- **Phase C** — Native auth screens: login, signup, forgot-password. Supabase auth with session persistence.
- **Phase D** — Core ordering loop: menu browse (FlashList) → item detail (nutrition) → cart (quantity controls) → checkout (pickup/delivery, Stripe) → order confirmation.
- **Phase E** — Dashboard (points/streak/level/achievements/orders/subscription), orders list, order detail, profile (edit name/phone), addresses (full CRUD).
- **Phase F** — Rewards (points + redeem), achievements, referrals (native Share), donations, push notification token capture.
- **Phase G** — Reusable components (ScreenHeader, EmptyState, LoadingScreen), safe area handling, tab bar polish with cart badge.
- **Phase H** — Final type-check clean, web build verified, this status block.

### Self-Test Results
- `npx tsc --noEmit` in `mobile/` — CLEAN (0 errors)
- `npm run build` at root — CLEAN (web app unaffected)
- 19 screen files, 11 library/component modules
- All screens have loading, empty, and error states
- Pull-to-refresh on all list screens
- Haptic feedback on add-to-cart, checkout, order confirmation

### What the Founder Must Do Next
1. **Test on device now** (no Apple Developer account needed):
   ```
   cd mobile && npx expo start
   ```
   Scan the QR code with Expo Go on your iPhone to test the full app.

2. **Create Apple Developer Account** (if not already started):
   - Go to https://developer.apple.com/programs/enroll/
   - Enroll as Organization (requires D-U-N-S number — takes 1-2+ business days)

3. **Once Apple Developer account is approved**:
   ```
   # Update eas.json with your Apple credentials
   # Then build a signed .ipa:
   cd mobile
   npx eas build --platform ios --profile production

   # Submit to App Store:
   npx eas submit --platform ios
   ```

4. **App Store listing**: Use the metadata in `APP_STORE_LISTING.md` for screenshots, description, keywords.

5. **Stripe Apple Pay**: In Stripe Dashboard → Settings → Apple Pay, upload the merchant identity certificate from your Apple Developer account.

### Known Limitations
- Full Stripe Payment Sheet requires a dev build (not Expo Go) — checkout currently posts to `/api/checkout` and returns a client secret, but the native payment sheet UI needs `eas build --profile development`
- Expo Go version mismatch with SDK 56 — use iOS Simulator (`npx expo start --ios`) or build a dev client
- Push notification backend send is wired for token capture only — sending notifications requires a server-side integration (fast-follow)
- Catering screen not yet built (lower priority, web-only for now)

## Web App Fixes — 2026-06-03
- Checkout page: fully restyled from dark gradient to Sage & Cream, Stripe Elements switched to light theme
- Menu: fixed category tab scroll-back-to-top bug on mobile (added scrollIntoView)
- Navbar mobile sidebar: login/signup/order moved to top of drawer
- Full dark theme audit: removed dark gradients from register, events, waitlist, launch party CTA, admin loading/error
- All layouts with Supabase now have `export const dynamic = "force-dynamic"` (required for Vercel builds)
- Deployed to production: vercel --prod (commit a1e864c)
