import express from 'express';
import cors from 'cors';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { syncTrades, tradovateEnv } from './tradovate.js';

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(
  cors({
    origin: process.env.ALLOW_ORIGIN || '*', // set to your app URL in prod
  })
);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Persistent data dir. In Docker this is a mounted volume (see docker-compose).
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const TRADES_STORE = path.join(DATA_DIR, 'trades.json'); // Tradovate imports
const BACKUP_STORE = path.join(DATA_DIR, 'backup.json'); // app backups

const ensureDir = () => fs.mkdir(DATA_DIR, { recursive: true });

const readJson = async (file, fallback) => {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    return fallback;
  }
};
const writeJson = async (file, data) => {
  await ensureDir();
  await fs.writeFile(file, JSON.stringify(data, null, 2));
};

// Optional shared secret. If BACKUP_TOKEN is set, backup routes require
// `Authorization: Bearer <token>`.
const requireToken = (req, res, next) => {
  const token = process.env.BACKUP_TOKEN;
  if (!token) return next();
  const got = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (got !== token) return res.status(401).json({ error: 'unauthorized' });
  return next();
};

app.get('/health', (_req, res) =>
  res.json({ ok: true, env: tradovateEnv, time: new Date().toISOString() })
);

/* ---- Backup (the Docker-persisted store for your journal) ---- */

// Fetch the latest backup of your journal + settings.
app.get('/api/backup', requireToken, async (_req, res) => {
  const data = await readJson(BACKUP_STORE, {
    trades: [],
    settings: {},
    updatedAt: null,
  });
  res.json(data);
});

// Save a backup. Body: { trades: [...], settings: {...} }
app.put('/api/backup', requireToken, async (req, res) => {
  const { trades, settings } = req.body || {};
  if (!Array.isArray(trades)) {
    return res.status(400).json({ error: 'trades must be an array' });
  }
  const record = {
    trades,
    settings: settings || {},
    updatedAt: new Date().toISOString(),
  };
  await writeJson(BACKUP_STORE, record);
  return res.json({ ok: true, updatedAt: record.updatedAt, count: trades.length });
});

/* ---- Tradovate auto-import (optional, from the scaffold) ---- */

app.get('/api/trades', async (_req, res) => {
  res.json(await readJson(TRADES_STORE, []));
});

app.post('/api/sync', async (_req, res) => {
  try {
    const imported = await syncTrades();
    const existing = await readJson(TRADES_STORE, []);
    const key = (t) => `${t.symbol}|${t.date}|${t.entry}|${t.exit}`;
    const seen = new Set(existing.map(key));
    const merged = [...existing];
    let added = 0;
    for (const t of imported) {
      if (!seen.has(key(t))) {
        merged.push({ id: `tv_${key(t)}`, ...t });
        seen.add(key(t));
        added += 1;
      }
    }
    await writeJson(TRADES_STORE, merged);
    res.json({ added, total: merged.length, trades: merged });
  } catch (err) {
    res.status(502).json({ error: String(err.message || err) });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`TradeKeeper server (${tradovateEnv}) on :${port}, data in ${DATA_DIR}`);
});
