// Performance stats derived from the trade list.

import { computeRR } from './format';

export const tradeStats = (trades) => {
  const count = trades.length;
  const wins = trades.filter((t) => t.result === 'win');
  const losses = trades.filter((t) => t.result === 'loss');
  const breakeven = trades.filter((t) => t.result === 'breakeven');

  const decided = wins.length + losses.length;
  const winRate = decided ? (wins.length / decided) * 100 : 0;

  const sum = (arr) => arr.reduce((s, t) => s + (Number(t.pnl) || 0), 0);
  const netPnl = sum(trades);
  const grossWin = sum(wins);
  const grossLoss = Math.abs(sum(losses));
  const profitFactor = grossLoss ? grossWin / grossLoss : grossWin ? Infinity : 0;

  const avgWin = wins.length ? grossWin / wins.length : 0;
  const avgLoss = losses.length ? grossLoss / losses.length : 0;
  const expectancy = decided
    ? (winRate / 100) * avgWin - (1 - winRate / 100) * avgLoss
    : 0;

  const rrs = trades
    .map((t) => (t.riskReward != null ? Number(t.riskReward) : computeRR(t)))
    .filter((x) => Number.isFinite(x));
  const avgRR = rrs.length ? rrs.reduce((s, x) => s + x, 0) / rrs.length : 0;

  // Best / worst single trades by P&L.
  let best = null;
  let worst = null;
  trades.forEach((t) => {
    const p = Number(t.pnl) || 0;
    if (best == null || p > Number(best.pnl || 0)) best = t;
    if (worst == null || p < Number(worst.pnl || 0)) worst = t;
  });

  return {
    count,
    wins: wins.length,
    losses: losses.length,
    breakeven: breakeven.length,
    winRate,
    netPnl,
    grossWin,
    grossLoss,
    profitFactor,
    avgWin,
    avgLoss,
    expectancy,
    avgRR,
    best,
    worst,
  };
};

// Cumulative P&L points for the equity curve (oldest -> newest).
export const equityCurve = (trades) => {
  const ordered = [...trades].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
  let running = 0;
  return ordered.map((t) => {
    running += Number(t.pnl) || 0;
    return { date: t.date, value: running };
  });
};
