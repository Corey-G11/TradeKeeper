# TradeKeeper Server — Docker backup store (+ optional Tradovate import)

A tiny Node/Express service that **holds your journal in a persistent Docker
volume** so you have a backup outside the browser. It also has the optional
Tradovate auto-import endpoints from the earlier scaffold.

## Run it in Docker

```bash
cd server
docker compose up -d --build
curl localhost:8080/health        # {"ok":true,...}
```

Your data lives in the **`tradekeeper-data`** volume and survives container
restarts, rebuilds, and `docker compose down`.

Snapshot the volume to a file anytime:

```bash
docker run --rm -v tradekeeper-data:/data -v "$PWD":/out alpine \
  tar czf /out/tradekeeper-backup.tgz -C /data .
```

## Backup endpoints (used by the app's Backup screen)

- `GET  /api/backup` → `{ trades, settings, updatedAt }`
- `PUT  /api/backup` → body `{ trades, settings }` → saves & returns count
- `GET  /health`

If you set `BACKUP_TOKEN` (in `docker-compose.yml`), both `/api/backup`
calls require header `Authorization: Bearer <token>`. Put the same token in
the app's Backup screen.

## ⚠️ Connecting the app to this container

Browsers block an **HTTPS page** (the hosted app at
`https://corey-g11.github.io/...`) from calling an **HTTP** server. So a
plain local `http://localhost:8080` works only when you also open the app
over http/localhost. Two ways to use it:

1. **Local use** — run the app locally too (`npm start` in the repo root →
   `http://localhost:3000`) and point Backup at `http://localhost:8080`.
2. **Anywhere (phone)** — expose the container over **HTTPS**. The easiest is
   the included Cloudflare Quick Tunnel (no domain, no account):

   ```bash
   docker compose -f docker-compose.yml -f docker-compose.tunnel.yml up -d --build
   docker compose logs -f cloudflared   # copy the https://<random>.trycloudflare.com URL
   ```

   Paste that `https://…` URL into the app's Backup screen. (The URL changes
   on restart; for a fixed address use a named Cloudflare tunnel + your
   domain, or a reverse proxy like Caddy/Traefik with a cert.)

Either way, **file Export/Import in the app always works** with no server —
that's the zero-setup backup.

## Auto-backup

In the app's Backup screen, **Auto-backup after each trade** (on by default)
silently `PUT`s your journal to the server URL a couple of seconds after any
change. Failures are silent — manual backup and file export remain the safety
net.

## Tradovate import (optional)

Set the `TRADOVATE_*` env vars in `docker-compose.yml` and call
`POST /api/sync`. Endpoint shapes in `tradovate.js` should be verified
against current Tradovate API docs before live use.
