# Mad Fresh Kitchen — Full App + Admin Recode Handoff (Sage & Cream)

> Paste this entire file as the opening message of a fresh Claude Code session pointed at
> `/Users/danknightunicorn/Claude Home/mad-fresh/`. Use **Sonnet** with extended thinking.

---

## Project

- **Path:** `/Users/danknightunicorn/Claude Home/mad-fresh/`
- **Stack:** Next.js 16, TypeScript, Tailwind 4, Supabase, Stripe, Capacitor (iOS + Android), Resend (email)
- **Deploy:** `vercel deploy --prod` from project root (this app is NOT knight-ops-site — normal Vercel deploy is fine here)
- **Read first:** `CLAUDE.md` → `AGENTS.md`. Read `node_modules/next/dist/docs/` before writing Next.js code (this Next version has breaking changes vs. training data).
- **Run `project-selector` skill before ANY Supabase or Vercel operation.**

---

## Current State (what's already done — DO NOT redo)

The **public marketing website is finished in Sage & Cream** and verified building clean:

- Homepage (`src/app/page.tsx`) section order matches the brand brief:
  Hero (Food) → TrustBar (animated logo ticker) → HowItWorks (numbered 1–4) → MenuPreview →
  ServicePaths (3 pathways) → **DeliveryChecker (ZIP zone check)** → PricingPlans → OurStory →
  CateringCTA → FoodPrograms → Reviews → ImpactSection → AppSection (last) → StoreInfo → Footer
- Real logo wired (`/public/images/brand/mad-fresh-logo.png`) incl. favicon/OG.
- `DeliveryChecker.tsx` uses the **real delivery boundary polygon** (from Ty's Google My Maps KML)
  with point-in-polygon ZIP lookup. Copy already reflects "free delivery for subscribers over $100."
- Public pages converted: about, donate, waitlist, quiz, menu, cart, checkout/success, events,
  privacy, terms, auth (login/signup/forgot/set-password), and the live catering page.
- Catering order-type headers white-on-white bug — FIXED.

**Your job is everything BELOW the public site: the customer app + the admin dashboard.**

---

## 🚨 THREE CRITICAL FLAGS — READ BEFORE TOUCHING CODE

### FLAG 1 — Web + Mobile BOTH must keep working
Three audiences share ONE codebase:
- Customers on web (madfresh.app) — order, dashboard, account
- Customers on iOS/Android (Capacitor wrapper pointing at the live URL)
- Admin/staff on web only (madfresh.app/admin)

**DO NOT:**
- Convert to static export (`output: 'export'`) — breaks server actions, API routes, Supabase SSR auth, Stripe webhooks
- Change Capacitor `server.url` — must keep pointing at the live deployed URL
- Remove/restructure anything under `src/app/api/`
- Break SSR / server components — admin depends on them

**DO:** keep responsive layouts working at **375px (iPhone)** AND **1280px+ (desktop admin)**.

### FLAG 2 — Stripe + App Store payment rules
Mad Fresh sells **physical food** → exempt from Apple IAP rule 3.1.1. Stripe is legal on iOS.
- **DO NOT modify** `src/app/api/stripe/`, `src/app/api/webhooks/`, or the checkout payment flow.
- Keep Apple Pay (Stripe surfaces it natively — good signal to Apple reviewers).
- Never use "in-app purchase / digital goods / credits" language at checkout.
- Document in `capacitor.config.js` comments: "Physical food ordering — exempt from IAP rule 3.1.1".
- Google Play: no Stripe restriction for physical goods.

### FLAG 3 — Test after EVERY phase
Run the phase smoke test before moving on. A broken auth or checkout flow is worse than an unstyled
component. Use Stripe test card `4242 4242 4242 4242` — never run a real charge.

---

## Sage & Cream Token Set (authoritative)

These hex values are already used across the finished public site. Match them exactly.

```
Brand:        green #3d6b2a · green-light #5aaa3c · green-accent #75F663 (badges/progress only)
Backgrounds:  bg #faf8f3 · bg-alt #f2efe8 · surface #ffffff · surface-2 #f7f4ed ·
              surface-hover #f0ece3 · warm #fff8ee · warm-border #f0ddb8
Text:         primary #1e2d18 · secondary #4a5e3a · muted #7a7060 · faint #9a9080 · on-green #ffffff
Borders:      default #ddd8cc · focus #3d6b2a · light #ede9e2
Status:       success bg #e9f0e4 / text #3d6b2a · warning bg #fff8ee / text #b45309 ·
              error bg #fef2f2 / text #dc2626 · info bg #eff6ff / text #2563eb
Shadows:      card 0 2px 8px rgba(30,45,24,.06) · md 0 4px 16px rgba(30,45,24,.08) ·
              lg 0 8px 32px rgba(30,45,24,.12)
Radius:       sm 8 · md 12 · lg 16 · xl 20 · full 9999
```

**Conversion rules (global):**
- `bg-[#0a0a0a] / #141414 / #161616 / #1a1a1a` → `bg-[#faf8f3]` (page) or `bg-white border border-[#ddd8cc]` (card)
- `bg-white/[0.03..0.05]` → `bg-white border border-[#ddd8cc]`
- `border-white/[0.06..0.08]` → `border-[#ddd8cc]`
- `text-white` on a light surface → `text-[#1e2d18]` (keep `text-white` ONLY on green/dark buttons & dark overlays)
- `text-gray-400/500/600` → `text-[#7a7060]` or `text-[#9a9080]`
- `bg-[#75F663]` solid buttons → `bg-[#3d6b2a]`; keep `#75F663` only for badges/progress-fill accents
- Inputs: `bg-white border border-[#ddd8cc] text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:ring-2 focus:ring-[#3d6b2a]/20`
- Intentional dark anchors that may stay dark: the Footer and the "Most Popular" pricing card.

Quality bar: feel like Sweetgreen / Erewhon — light, airy, green as accent, subtle shadows, clear type hierarchy. Not a crypto dashboard.

---

## Execution Plan

### Phase A — Shells (wrap everything; fix first)
Files: `src/components/customer/CustomerShell.tsx` (or equivalent), `src/components/admin/AdminShell.tsx`,
`src/app/(customer)/layout.tsx`, `src/app/(admin)/admin/layout.tsx`.
- Customer: page bg `#faf8f3`; top bar + bottom nav `bg-white border-[#ddd8cc]`; active tab `text-[#3d6b2a]`.
- Admin: sidebar `bg-white border-r border-[#ddd8cc]`; active nav `bg-[#e9f0e4] text-[#3d6b2a] border-l-[3px] border-[#3d6b2a] font-bold`; section labels `text-[#9a9080] uppercase text-xs tracking-wider`.
- **Keep** customer safe-area padding: `pb-[calc(env(safe-area-inset-bottom)+72px)]` and bottom nav `pb-[env(safe-area-inset-bottom)]`.
**Smoke:** log in as customer → light shell + green active tab. Log in as admin → white sidebar, green active nav. No horizontal scroll at 375px.

### Phase B — Customer app pages
Files (all under `src/app/(customer)/` + `src/components/customer/`):
dashboard, DashboardOrderSection, QuickReorder, orders + orders/[id] (+ OrderListClient, OrderTimeline),
subscription (+ success), rewards (+ RewardsClient), achievements, referrals, profile, account, addresses,
my-donations, donations, RedeemButton, ReorderButton, OrderModifier, CollapsibleSection, NotificationPreferences,
ImpersonationBanner, ComingSoonPage.
- Stat/level cards: `bg-white border border-[#ddd8cc] shadow-[0_2px_8px_rgba(30,45,24,.06)]`.
- Progress fill: `bg-gradient-to-r from-[#3d6b2a] to-[#75F663]`. Track: `bg-[#f2efe8]`.
- Order status badges: success `#e9f0e4/#3d6b2a` · pending `#eff6ff/#2563eb` · preparing `#fff8ee/#b45309` · cancelled `#fef2f2/#dc2626`.
**Smoke:** dashboard loads (stats, level, orders); menu/order add-to-cart works; rewards/orders/profile readable; ALL form fields white bg + dark text + green focus.

### Phase C — Menu / ordering / checkout
Files: `src/components/menu/MenuClient.tsx`, `BowlBuilder.tsx`, NutritionModal, plus order/cart/checkout pages.
- DO NOT touch the Stripe payment flow or imports (Flag 2).
**Smoke:** menu renders w/ prices; cart adds; checkout Stripe Elements render; test card `4242…` creates an order in Supabase + Resend confirmation fires. NO real charge.

### Phase D — Admin pages
Files (all under `src/app/(admin)/admin/` + `src/components/admin/`):
dashboard, orders (+ [id]), customers/[id], menu (recipes/ingredients/bowl-builder), subscriptions, catering
(+ proposals), events (+ new/[id]/edit), contacts, analytics, financials, calendar, kitchen, team, drivers,
tasks, sops (+ [id]/view), marketing (MarketingCommandCenter), notifications, settings (payments/notifications),
labels, discounts, coupons, promos, inventory, vendors, media, email-test, GlobalSearch, SchoolLunchCalendar,
EventEditor, TeamManager, SubscriptionManager, CateringManager, ContractsManager.
- KPI cards: `bg-white border border-[#ddd8cc] shadow-card`; icon container `bg-[#e9f0e4]`; icon `text-[#3d6b2a]`; number `text-[#1e2d18] font-black`.
- Tables: container `bg-white border border-[#ddd8cc] rounded-xl`; header `bg-[#f2efe8] text-[#9a9080] uppercase text-xs`; rows `border-b border-[#ede9e2] hover:bg-[#f0ece3]`.
**Smoke:** dashboard KPIs readable; orders/menu/settings/analytics/kitchen load; sidebar nav has no broken routes; layout intact at 1280px and collapses sanely at 768px.

### Phase E — Shared + stragglers + dead-component cleanup
- Convert remaining customer/admin files still using old dark hex (run the audit grep below).
- **Dead components** (currently rendered NOWHERE — either delete or fully convert + wire if Ty wants them):
  `landing/VolumeDiscountCalculator.tsx` (+ Server), `landing/DeliveryZoneMap.tsx` (has STALE delivery data — "$75 free" — that contradicts Ty's real rules; if reused, replace data), `catering/CateringForm.tsx`, `CateringPackages.tsx`, `CateringHero.tsx`, `CateringCalculator.tsx` (+ Server). The live catering page is the self-contained `(public)/catering/page.tsx` — these old components are unused.
  `landing/QuizCTA.tsx` + `landing/InstagramFeed.tsx` are already converted to Sage & Cream but not yet wired — wire InstagramFeed only after the live IG feed integration is decided (see Business Rules).

### Phase F — Capacitor config + final verification
- `capacitor.config.js` (color values only, never structure): splash + bg `#faf8f3`, `StatusBar.style: 'LIGHT'`, statusbar bg `#faf8f3`. Add the IAP-exemption comment.
- Audit greps (fix remaining hits):
  ```bash
  grep -rl "bg-\[#0a0a0a\]\|bg-\[#141414\]\|bg-\[#161616\]\|bg-\[#1a1a1a\]" src --include="*.tsx"
  grep -rn "text-white\b" src --include="*.tsx"   # verify each is on green/dark, not light
  ```
- `npm run build` → zero TS errors. Then `vercel deploy --prod`. Verify Vercel state READY.
- Surgically update `CLAUDE.md`: add "Sage & Cream app + admin recode complete — [date]".

---

## Business Rules from Ty (build during the relevant phase)

These came from the founder conversation. Implement where the phase touches them; flag anything needing schema/Stripe work.

1. **Delivery / free shipping:** Free delivery ONLY for **active subscribers** on orders **over $100**.
   Volume discounts (any customer): $150 → save $10 · $200 → save $15 · $250 → save $20.
   **No $75 threshold** (Ty rejected it). Show an upsell nudge at checkout ("You're $X from saving $10").
2. **Subscriptions from any order:** A customer can convert any order into a recurring subscription
   (same day/time weekly). To change items they cancel + re-create (acceptable tradeoff). 
3. **Change/cancel window:** 48h before autocharge send email + text + push: "charges in 48h — adjust here."
   After charge, 24h cancel-for-refund window, then it's locked (goes to production).
4. **Out-of-stock handling (chef's entrées only, ~3–4 rotating items):** mark item unavailable →
   notify via email/text/push → if no response by Friday-noon deadline → **auto-substitute**.
   Add a customer preference checkbox: "If an item is unavailable: substitute next best option / cancel that item."
   Snacks/staples are always in stock, never substituted.
5. **Email branding:** Every Resend template must use the real logo at an ABSOLUTE URL
   (`https://madfresh.app/images/brand/mad-fresh-logo.png`). Verify order-confirmation + subscription emails fire.
6. **Pickup vs Sunday delivery:** Delivery is **Sundays only, Valleywide**. Pickup is flexible day/time slot.
   Remove any "same-day delivery" language from the meal-prep flow.

### Future phase (DO NOT build now — flag only)
- **DoorDash Drive API** for same-day single (hot-menu) orders — they deliver, we keep the order, ~2% vs 30%.
  Needs merchant-partner approval (possibly via Square middleware). Separate from weekly meal prep.
- **School portal / student login** (middle + high school) — menu visibility, embeddable. Targeted Aug.
- **Hot menu vs cold menu** split (single same-day orders vs weekly prep). Phase 2.
- **Event QR voucher** ($15 off first order, app-only) — needs the promo-code system fixed first.

---

## Hard Rules (from global CLAUDE.md)
1. Never overwrite `vercel.json` — surgical edits, read first.
2. Confirm Supabase/Vercel targets via `project-selector` before any DB/deploy work.
3. Never mix client design systems.
4. Verify Vercel READY after every push.
5. Never delete project content while cleaning up.
6. Update `CLAUDE.md` surgically on every push (3–5 lines), never full rewrite.
7. Never modify `AGENTS.md`.

## Start here
1. Read `CLAUDE.md` → `AGENTS.md`.
2. Run `project-selector`.
3. Phase A (shells). Work phases in order. Smoke-test after each. Don't skip ahead.
