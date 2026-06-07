import express from 'express';
import cors from 'cors';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { syncTrades, tradovateEnv } from './tradovate.js';

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: process.env.ALLOW_ORIGIN || '*', // set to your Pages URL in prod
  })
);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORE = path.join(__dirname, 'trades.json');

const readStore = async () => {
  try {
    return JSON.parse(await fs.readFile(STORE, 'utf8'));
  } catch {
    return [];
  }
};
const writeStore = (trades) => fs.writeFile(STORE, JSON.stringify(trades, null, 2));

app.get('/health', (_req, res) =>
  res.json({ ok: true, env: tradovateEnv, time: new Date().toISOString() })
);

// Return the trades we've imported so far.
app.get('/api/trades', async (_req, res) => {
  res.json(await readStore());
});

// Pull fresh fills from Tradovate, merge into the store, return everything.
app.post('/api/sync', async (_req, res) => {
  try {
    const imported = await syncTrades();
    const existing = await readStore();

    // De-dupe on symbol+date+entry+exit so re-syncing is idempotent.
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
    await writeStore(merged);
    res.json({ added, total: merged.length, trades: merged });
  } catch (err) {
    res.status(502).json({ error: String(err.message || err) });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`TradeKeeper server (${tradovateEnv}) listening on :${port}`);
});
