# Auto-generated trade charts

Goal (your "personal TradeZella"): every trade shows a chart of the price
around it with your **entry**, **exit**, and **TP / SL** lines drawn on —
automatically.

## Decisions
- **Capture style:** auto-generate a chart from price data (not a screenshot
  of the Tradovate app — a browser app can't capture another app).
- **Hosting:** always-on cloud (see `render.yaml`).

## How it works (two phases)

### Phase 1 — renderer in the app (done)
`src/components/TradeChart.js` draws an SVG chart from a trade's own numbers:
entry/exit markers + entry/TP/SL lines, profit/loss zones, and a schematic
price path. It shows live in the trade form for **every** trade today, and it
already accepts a `candles` array for real data.

### Phase 2 — real candles from Tradovate (needs the hosted backend)
When a fill imports from Tradovate, the backend will:
1. Determine the trade's time window (first entry fill → last exit fill).
2. Fetch **candlesticks** for that window for the contract.
3. Attach them to the trade as `candles: [{ t, o, h, l, c }]` (plus the real
   `exit` price). The same `TradeChart` then renders true candles with your
   entry/exit/TP/SL overlaid.

**Candle source:** Tradovate's own chart/history API (same account that holds
your fills) is preferred so the data matches your platform. It requires a
market-data entitlement and uses the WebSocket `md` API — to be wired in
`server/tradovate.js` and verified against the current Tradovate API docs. A
paid market-data API (e.g. Databento for CME) is the fallback if Tradovate
data isn't entitled.

## What I need from you to switch Phase 2 on
1. Deploy the backend (the `render.yaml` blueprint) and set the Tradovate
   secrets in the host's env vars (never in chat).
2. Confirm your Tradovate account has **market-data access** (needed to pull
   candles). If not, we use a market-data API instead.

Then I wire the import → candle-fetch → chart pipeline and a Connections
screen with "Sync now".
