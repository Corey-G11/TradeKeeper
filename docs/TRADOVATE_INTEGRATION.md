# Tradovate Auto-Journaling — Integration Plan

Goal: when you take a trade in Tradovate, it shows up in TradeKeeper
automatically (symbol, entry, exit, contracts, P&L, win/loss) so you only
have to add the *human* parts — confidence, "followed plan", and notes.

This is a **planning doc**, not built yet. The key constraint: Tradovate's
API requires OAuth + API secrets that **cannot live in a static front-end**
(anyone could read them). So auto-journaling needs a small backend.

## Architecture

- **Backend service** (serverless function on Vercel/Cloudflare, or a tiny
  Node/Express app) holds the Tradovate credentials as secrets.
- **OAuth connect flow** — you authorize once; we store access/refresh tokens
  server-side (encrypted).
- **Fill ingestion** — backend polls Tradovate (or uses its WebSocket) for
  fill/order events, groups fills into round-trip trades, computes P&L, and
  writes them to a per-user trade store.
- **Sync to app** — the PWA fetches trades from the backend; auto-imported
  trades are flagged `source: "tradovate"` and "needs review" until you add
  notes.

## Phased rollout

- **Phase 1 (now):** manual journal + position calculator. Done.
- **Phase 2:** add a `source` field + a Connections screen with an
  "Import CSV" option — Tradovate exports fills to CSV, which we can parse
  client-side with **zero backend**. Great first win.
- **Phase 3:** stand up the backend + OAuth, store tokens, manual "Sync now".
- **Phase 4:** background polling/WebSocket for true automatic journaling,
  with a review queue for imported trades.

## Open questions

1. Live or sim (demo) account to start with?
2. OK with a small hosted backend (needed for true auto-sync), or begin with
   CSV import (no backend, works today)?
3. Auto-import every fill, or only trades you tag as "real"?
4. Should imported trades merge with manual ones, or stay separate until
   reviewed?
