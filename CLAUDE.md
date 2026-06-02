@AGENTS.md

## Sage & Cream app + admin recode complete — 2026-06-02
- Phases A–F: customer shell, admin shell, all customer pages, menu/ordering/checkout,
  all admin pages + components, shared/straggler/dead-component cleanup, Capacitor config.
- Design tokens: bg #faf8f3, green #3d6b2a, text #1e2d18, border #ddd8cc.
- Stripe payment flow untouched (Flag 2). API routes untouched.
- dd-trace instrumentation guarded (requires DD_API_KEY to load).
