// XP, levels, streaks and confidence calibration — the day-trader-friendly
// motivation layer that sits on top of the raw journal.

import { dayKey } from './format';

// XP awarded for a single logged trade. Logging is rewarded; quality
// (notes, a confidence read, sticking to the plan) is rewarded more.
export const xpForTrade = (t) => {
  let xp = 50; // base: you showed up and logged it
  if (t.notes && t.notes.trim().length >= 10) xp += 20;
  if (t.confidence) xp += 15;
  if (t.followedPlan) xp += 25;
  if (t.result === 'win') xp += 10; // small nod to a green trade
  return xp;
};

export const totalXp = (trades) =>
  trades.reduce((sum, t) => sum + xpForTrade(t), 0);

// Progressive curve: level L starts at 100*(L-1)^2 XP.
export const levelFromXp = (xp) => Math.floor(Math.sqrt(xp / 100)) + 1;
const xpAtLevel = (level) => 100 * (level - 1) ** 2;

export const levelInfo = (xp) => {
  const level = levelFromXp(xp);
  const start = xpAtLevel(level);
  const next = xpAtLevel(level + 1);
  const into = xp - start;
  const span = next - start;
  return {
    level,
    xp,
    intoLevel: into,
    spanLevel: span,
    toNext: next - xp,
    progress: span > 0 ? Math.min(1, into / span) : 0,
    title: rankTitle(level),
  };
};

const RANKS = [
  'Paper Hands', // 1
  'Tape Reader', // 2
  'Risk Manager', // 3
  'Setup Sniper', // 4
  'Trend Rider', // 5
  'Liquidity Hunter', // 6
  'Market Maker', // 7
  'Smart Money', // 8+
];
export const rankTitle = (level) =>
  RANKS[Math.min(level - 1, RANKS.length - 1)] || RANKS[RANKS.length - 1];

// Current consecutive-day journaling streak. Counts back from today (or
// yesterday, so an evening of no logging before midnight doesn't break it).
export const currentStreak = (trades) => {
  if (!trades.length) return 0;
  const days = new Set(trades.map((t) => dayKey(t.date)));
  let streak = 0;
  const cursor = new Date();
  const todayKey = dayKey(cursor.toISOString());
  const yKey = dayKey(new Date(Date.now() - 86400000).toISOString());
  if (!days.has(todayKey) && !days.has(yKey)) return 0;
  if (!days.has(todayKey)) cursor.setDate(cursor.getDate() - 1);
  // walk backwards while each day is present
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const k = dayKey(cursor.toISOString());
    if (days.has(k)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else break;
  }
  return streak;
};

export const longestStreak = (trades) => {
  if (!trades.length) return 0;
  const keys = [...new Set(trades.map((t) => dayKey(t.date)))].sort();
  let best = 1;
  let run = 1;
  for (let i = 1; i < keys.length; i += 1) {
    const prev = new Date(keys[i - 1]);
    const cur = new Date(keys[i]);
    const diff = Math.round((cur - prev) / 86400000);
    if (diff === 1) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }
  return best;
};

// Confidence calibration: are you most confident on the trades that
// actually win? Returns avg confidence overall, on wins, on losses, plus a
// "calibration" score (how well-aligned confidence is with outcomes).
export const confidenceStats = (trades) => {
  const rated = trades.filter((t) => t.confidence && t.result !== 'breakeven');
  const avg = (arr) =>
    arr.length ? arr.reduce((s, t) => s + Number(t.confidence), 0) / arr.length : 0;
  const wins = rated.filter((t) => t.result === 'win');
  const losses = rated.filter((t) => t.result === 'loss');
  const avgWin = avg(wins);
  const avgLoss = avg(losses);
  const all = trades.filter((t) => t.confidence);
  const avgAll = avg(all);

  // Calibration 0-100: rewards being more confident on wins than losses.
  let calibration = null;
  if (wins.length && losses.length) {
    const spread = avgWin - avgLoss; // ideally positive, range ~ -9..9
    calibration = Math.round(Math.max(0, Math.min(100, 50 + spread * (50 / 9))));
  }

  return {
    avgAll,
    avgWin,
    avgLoss,
    calibration,
    ratedCount: all.length,
  };
};

// Lightweight "badges" unlocked from journaling behaviour.
export const computeBadges = (trades, stats) => {
  const streak = currentStreak(trades);
  const longest = longestStreak(trades);
  return [
    {
      id: 'first',
      icon: '🌱',
      label: 'First Entry',
      desc: 'Log your first trade',
      unlocked: trades.length >= 1,
    },
    {
      id: 'ten',
      icon: '📚',
      label: 'Journal Junkie',
      desc: 'Log 10 trades',
      unlocked: trades.length >= 10,
    },
    {
      id: 'streak3',
      icon: '🔥',
      label: 'On a Roll',
      desc: '3-day streak',
      unlocked: longest >= 3 || streak >= 3,
    },
    {
      id: 'streak7',
      icon: '⚡',
      label: 'Locked In',
      desc: '7-day streak',
      unlocked: longest >= 7 || streak >= 7,
    },
    {
      id: 'discipline',
      icon: '🛡️',
      label: 'Disciplined',
      desc: 'Follow your plan 10 times',
      unlocked: trades.filter((t) => t.followedPlan).length >= 10,
    },
    {
      id: 'green',
      icon: '💚',
      label: 'In the Green',
      desc: 'Reach a positive net P&L',
      unlocked: stats.netPnl > 0,
    },
    {
      id: 'sharp',
      icon: '🎯',
      label: 'Sharp Shooter',
      desc: 'Hit a 60%+ win rate over 10+ trades',
      unlocked: stats.count >= 10 && stats.winRate >= 60,
    },
    {
      id: 'rr2',
      icon: '⚖️',
      label: 'Asymmetric',
      desc: 'Average planned R:R of 2+',
      unlocked: stats.avgRR >= 2,
    },
  ];
};
