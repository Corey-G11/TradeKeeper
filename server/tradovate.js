// Thin Tradovate REST client + round-trip reconstruction.
//
// ⚠️ Endpoint shapes follow Tradovate's documented v1 REST API but MUST be
// verified against current docs before relying on real money. Defaults target
// the DEMO (simulation) environment.
//
// Uses Node 18+ global fetch (no extra deps).

const ENV = process.env.TRADOVATE_ENV || 'demo';
const BASE =
  ENV === 'live'
    ? 'https://live.tradovateapi.com/v1'
    : 'https://demo.tradovateapi.com/v1';

// $ per 1.0 point of price move, per contract. Fallback when we can't read the
// product spec from the API. Keep in sync with the app's calculator presets.
const POINT_VALUE = {
  ES: 50, MES: 5, NQ: 20, MNQ: 2, YM: 5, MYM: 0.5,
  RTY: 50, M2K: 5, CL: 1000, GC: 100,
};

let cache = { token: null, expires: 0 };

// Acquire (or reuse) an access token.
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

// Reconstruct round-trip trades from a flat list of fills using FIFO matching
// per contract. Each fill: { contractId, timestamp, action ('Buy'|'Sell'),
// qty, price }. Returns TradeKeeper-shaped trade objects.
export function reconstructTrades(fills, contractsById = {}) {
  const byContract = {};
  for (const f of fills) {
    (byContract[f.contractId] ||= []).push(f);
  }

  const trades = [];
  for (const [contractId, list] of Object.entries(byContract)) {
    list.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const symbol = contractsById[contractId]?.name || String(contractId);
    const root = symbol.replace(/[0-9].*$/, ''); // ESZ4 -> ES
    const pv = POINT_VALUE[root] || 1;

    const open = []; // queue of { dir, qty, price, time }
    for (const f of list) {
      const dir = f.action === 'Buy' ? 1 : -1;
      let qty = f.qty;
      // close against opposite-side open lots first
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

// Pull recent fills and return reconstructed trades.
export async function syncTrades() {
  const fills = await apiGet('/fill/list');
  // Map contractId -> { name } so we can label symbols.
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
    action: f.action, // 'Buy' | 'Sell'
    qty: f.qty,
    price: f.price,
  }));
  return reconstructTrades(normalized, contractsById);
}

export const tradovateEnv = ENV;
