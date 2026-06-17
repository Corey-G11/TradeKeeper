// Tradovate REST client + round-trip reconstruction + candle attachment.
//
// ⚠️ Endpoint shapes follow Tradovate's documented v1 REST API but MUST be
// verified against current docs before relying on real money. Defaults target
// the DEMO (simulation) environment. Uses Node 18+ global fetch.

const ENV = process.env.TRADOVATE_ENV || 'demo';
const BASE =
  ENV === 'live'
    ? 'https://live.tradovateapi.com/v1'
    : 'https://demo.tradovateapi.com/v1';

// $ per 1.0 point of price move, per contract. Fallback for P&L when we can't
// read the product spec from the API. Keep in sync with the app's calculator.
const POINT_VALUE = {
  ES: 50, MES: 5, NQ: 20, MNQ: 2, YM: 5, MYM: 0.5,
  RTY: 50, M2K: 5, CL: 1000, GC: 100,
};

let cache = { token: null, expires: 0 };

async function getToken() {
  if (cache.token && Date.now() < cache.expires - 60_000) return cache.token;
  const body = {
    name: process.env.TRADOVATE_USERNAME,
    password: process.env.TRADOVATE_PASSWORD,
    appId: process.env.TRADOVATE_APP_NAME || 'TradeKeeper',
    appVersion: '1.0',
    cid: process.env.TRADOVATE_CID,
    sec: process.env.TRADOVATE_SEC,
  };
  const res = await fetch(`${BASE}/auth/accessTokenRequest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || !data.accessToken) {
    throw new Error(`Tradovate auth failed: ${data.errorText || res.status}`);
  }
  cache = {
    token: data.accessToken,
    expires: new Date(data.expirationTime).getTime() || Date.now() + 60 * 60_000,
  };
  return cache.token;
}

async function apiGet(path) {
  const token = await getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status}`);
  return res.json();
}

// Normalize a candle from various provider shapes into { t, o, h, l, c }.
function normalizeCandle(c) {
  const o = Number(c.o ?? c.open ?? c.Open);
  const h = Number(c.h ?? c.high ?? c.High);
  const l = Number(c.l ?? c.low ?? c.Low);
  const close = Number(c.c ?? c.close ?? c.Close);
  if (![o, h, l, close].every(Number.isFinite)) return null;
  return { t: c.t ?? c.time ?? c.timestamp ?? null, o, h, l, c: close };
}

// Fetch candles for a symbol/time window. Pluggable: set CANDLES_URL to a
// template like
//   https://data.example.com/ohlc?sym={symbol}&from={from}&to={to}
// returning JSON `[{t,o,h,l,c}]` (or open/high/low/close). With CANDLES_TOKEN
// it's sent as a Bearer header. Returns [] on any problem so the chart simply
// falls back to its schematic path. (Wiring Tradovate's own WS chart API is
// the preferred source — see docs/CHARTS.md.)
export async function fetchCandles(symbol, fromIso, toIso) {
  const tmpl = process.env.CANDLES_URL;
  if (!tmpl || !symbol) return [];
  const url = tmpl
    .replace('{symbol}', encodeURIComponent(symbol))
    .replace('{from}', encodeURIComponent(fromIso))
    .replace('{to}', encodeURIComponent(toIso));
  try {
    const headers = process.env.CANDLES_TOKEN
      ? { Authorization: `Bearer ${process.env.CANDLES_TOKEN}` }
      : {};
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    const arr = Array.isArray(data) ? data : data.candles || data.bars || [];
    return arr.map(normalizeCandle).filter(Boolean).slice(-80);
  } catch {
    return [];
  }
}

// FIFO round-trip reconstruction. Tracks entry/exit time so we can fetch the
// chart window. Each fill: { contractId, timestamp, action, qty, price }.
export function reconstructTrades(fills, contractsById = {}) {
  const byContract = {};
  for (const f of fills) (byContract[f.contractId] ||= []).push(f);

  const trades = [];
  for (const [contractId, list] of Object.entries(byContract)) {
    list.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const symbol = contractsById[contractId]?.name || String(contractId);
    const root = symbol.replace(/[0-9].*$/, ''); // ESZ4 -> ES
    const pv = POINT_VALUE[root] || 1;

    const open = []; // { dir, qty, price, time }
    for (const f of list) {
      const dir = f.action === 'Buy' ? 1 : -1;
      let qty = f.qty;
      while (qty > 0 && open.length && open[0].dir === -dir) {
        const lot = open[0];
        const matched = Math.min(qty, lot.qty);
        const pnl = (f.price - lot.price) * lot.dir * matched * pv;
        trades.push({
          symbol: root,
          market: 'futures',
          direction: lot.dir === 1 ? 'long' : 'short',
          entry: lot.price,
          exit: f.price,
          contracts: matched,
          pnl: Math.round(pnl * 100) / 100,
          result: pnl > 0 ? 'win' : pnl < 0 ? 'loss' : 'breakeven',
          date: f.timestamp,
          entryTime: lot.time,
          exitTime: f.timestamp,
          source: 'tradovate',
          needsReview: true,
        });
        lot.qty -= matched;
        qty -= matched;
        if (lot.qty === 0) open.shift();
      }
      if (qty > 0) open.push({ dir, qty, price: f.price, time: f.timestamp });
    }
  }
  return trades.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Widen the [entry,exit] window by a margin so the chart has context.
function window(entryTime, exitTime, marginMin = 20) {
  const a = new Date(entryTime || exitTime).getTime();
  const b = new Date(exitTime || entryTime).getTime();
  const m = marginMin * 60_000;
  return {
    from: new Date(Math.min(a, b) - m).toISOString(),
    to: new Date(Math.max(a, b) + m).toISOString(),
  };
}

// Pull recent fills, reconstruct round-trips, attach chart candles.
export async function syncTrades() {
  const fills = await apiGet('/fill/list');
  let contractsById = {};
  try {
    const contracts = await apiGet('/contract/list');
    contractsById = Object.fromEntries(contracts.map((c) => [c.id, c]));
  } catch {
    /* labelling is best-effort */
  }
  const normalized = fills.map((f) => ({
    contractId: f.contractId,
    timestamp: f.timestamp,
    action: f.action,
    qty: f.qty,
    price: f.price,
  }));
  const trades = reconstructTrades(normalized, contractsById);

  // Attach candles to the most recent trades (cap to keep sync fast).
  const CAP = 40;
  for (let i = 0; i < Math.min(trades.length, CAP); i += 1) {
    const t = trades[i];
    const { from, to } = window(t.entryTime, t.exitTime);
    // eslint-disable-next-line no-await-in-loop
    const candles = await fetchCandles(t.symbol, from, to);
    if (candles.length) t.candles = candles;
  }
  return trades;
}

export const tradovateEnv = ENV;
