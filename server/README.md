# TradeKeeper Server (Tradovate auto-journaling)

A tiny Node/Express service that authenticates to **Tradovate (demo)**, pulls
your fills, reconstructs round-trip trades with P&L, and serves them to the
TradeKeeper app. Secrets live here (as env vars), never in the front-end.

> Status: **scaffold, untested against a live Tradovate account.** Endpoint
> shapes need a quick verification pass against current Tradovate API docs.
> See `tradovate.js` for the spots marked ⚠️.

## Endpoints

- `GET /health` – liveness + which environment (demo/live)
- `POST /api/sync` – pull fills from Tradovate, merge, return all trades
- `GET /api/trades` – return imported trades (flagged `source: "tradovate"`)

## Run locally

```bash
cd server
cp .env.example .env     # fill in your Tradovate demo credentials
npm install
npm start                # http://localhost:8080/health
```

## Deploy (Render / Railway — both have free tiers)

1. Push this repo to GitHub (done).
2. Create a new **Web Service**, point it at this repo, root directory `server`.
3. Build command `npm install`, start command `npm start`.
4. Add the env vars from `.env.example` (your Tradovate demo creds).
5. Set `ALLOW_ORIGIN=https://corey-g11.github.io`.
6. Deploy → you'll get a URL like `https://tradekeeper.onrender.com`.

Send me that URL and I'll wire a **Connections → Sync now** button into the
app that calls `/api/sync` and merges imported trades into your journal
(flagged "needs review" so you can add confidence + notes).

## What I still need from you

- **Tradovate API credentials** (key id `cid` + secret `sec`). Request these
  from Tradovate (API access). Put them in the host's env vars — **don't paste
  them in chat.**
- **Hosting choice** (Render, Railway, Fly, your own box…).

## Notes / next steps

- The store is a flat JSON file for now (single user). Swap for a real DB
  (Postgres/SQLite) when you want history + multi-device.
- P&L uses a point-value table as a fallback; we should read true contract
  specs from `/product/item` for exotic instruments.
- Phase 4: replace manual "Sync now" with background polling or the Tradovate
  WebSocket for truly automatic journaling.
