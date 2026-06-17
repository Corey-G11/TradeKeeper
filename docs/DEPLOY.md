# Deploy TradeKeeper's backend (Render) — step by step

This turns on **auto-journaling from Tradovate**, **cloud backup**, and
**real chart candles**. ~10 minutes. You only do this once.

> 🔒 Never paste your Tradovate password or API secret into chat or commit
> them. They go **only** into Render's environment variables.

---

## 0. What you need
- This repo on GitHub (done: `Corey-G11/TradeKeeper`).
- A **Render** account (free signup) — render.com.
- **Tradovate API credentials**: an API **Key (`cid`)** + **Secret (`sec`)**.
  Get them from Tradovate → *Application Settings → API Access* (request API
  access if you don't see it). You'll also use your normal Tradovate
  **username** and **password**.

---

## 1. Create the service from the blueprint
1. In Render, click **New +** → **Blueprint**.
2. Connect your GitHub and pick **`Corey-G11/TradeKeeper`**.
3. Render reads **`render.yaml`** and proposes a service named `tradekeeper`
   with a 1 GB persistent disk. Click **Apply**.

## 2. Set the secrets
In the new service → **Environment**, fill these (the blueprint already
created the keys; just paste values):

| Key | Value |
|---|---|
| `TRADOVATE_ENV` | `demo` (start on sim) or `live` |
| `TRADOVATE_CID` | your API Key id |
| `TRADOVATE_SEC` | your API Secret |
| `TRADOVATE_USERNAME` | your Tradovate username |
| `TRADOVATE_PASSWORD` | your Tradovate password |
| `BACKUP_TOKEN` | already auto-generated — **copy it**, you'll paste it in the app |
| `ALLOW_ORIGIN` | `https://corey-g11.github.io` (already set) |

Click **Save, rebuild, deploy**.

## 3. Confirm it's alive
When the deploy is green, open:

```
https://<your-service>.onrender.com/health
```

You should see `{"ok":true,"env":"demo",...}`. Copy that base URL
(`https://<your-service>.onrender.com`).

## 4. Connect the app
On your phone at **https://corey-g11.github.io/TradeKeeper/**:
1. **🔗 Connections** (top-left of the dashboard) → paste the **base URL** and
   the **`BACKUP_TOKEN`** → **Sync now**. Your Tradovate trades import and land
   in the **Review** queue.
2. **☁︎ Backup** → paste the same URL + token → toggle **Auto-backup** on so
   your journal is saved to the server after every change.

## 5. (Optional) Real chart candles
Imported trades chart entry/exit + TP/SL immediately. For **real candlesticks**,
set a candle data source in Render env:

- `CANDLES_URL` = a template that returns OHLC JSON for a window, e.g.
  `https://yourdata.example/ohlc?sym={symbol}&from={from}&to={to}`
  (returns `[{t,o,h,l,c}]`).
- `CANDLES_TOKEN` = bearer token for that source, if needed.

(Tradovate's own market-data feed is the ideal source but uses its WebSocket
`md` API — ping me to wire it once you've confirmed your account has
market-data access. See `docs/CHARTS.md`.)

---

## Troubleshooting
- **App says "reachable over HTTPS?"** — Render gives you HTTPS automatically,
  so this should just work. If you used a *local* Docker box instead, the
  hosted (HTTPS) app can't call a plain-HTTP server; use the Cloudflare tunnel
  (`server/docker-compose.tunnel.yml`) or run the app locally.
- **401 unauthorized** — the token in the app doesn't match `BACKUP_TOKEN`.
- **Tradovate auth failed** — check `TRADOVATE_*` values and `TRADOVATE_ENV`
  (demo vs live must match the account you're using).
- **Sync returns trades but endpoints look wrong** — Tradovate's exact
  fill/contract endpoints may differ from the scaffold; send me the response
  or error and I'll reconcile `server/tradovate.js`.

## Cost note
The blueprint uses Render's **starter** instance so the **persistent disk**
keeps your data across deploys (≈ $7/mo). You *can* switch the service to the
**free** plan (remove the `disk:` block) — the API still works, but server
data resets on redeploy. The app's **auto-backup** re-uploads after your next
change, and **file export** is always a zero-cost safety net.
