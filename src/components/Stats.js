import React from 'react';
import { useSelector } from 'react-redux';
import './Stats.css';
import { selectTrades } from '../features/trades/tradesSlice';
import { tradeStats } from '../utils/stats';
import {
  totalXp,
  levelInfo,
  currentStreak,
  longestStreak,
  confidenceStats,
} from '../utils/gamification';
import { fmtMoney, fmtNum } from '../utils/format';

const Stat = ({ label, value, cls }) => (
  <div className="stat-box">
    <div className="stat-label">{label}</div>
    <div className={`stat-value mono ${cls || ''}`}>{value}</div>
  </div>
);

export default function Stats() {
  const trades = useSelector(selectTrades);
  const s = tradeStats(trades);
  const lvl = levelInfo(totalXp(trades));
  const streak = currentStreak(trades);
  const longest = longestStreak(trades);
  const conf = confidenceStats(trades);

  const winPct = s.winRate;
  const lossPct = s.wins + s.losses ? 100 - winPct : 0;

  return (
    <div className="stats">
      <header className="app-header">
        <div className="brand">
          <div>
            <h1>Stats</h1>
            <div className="sub">Your edge, by the numbers</div>
          </div>
        </div>
      </header>

      {/* Win rate bar */}
      <div className="card">
        <div className="wr-head">
          <span className="wr-big mono">{fmtNum(winPct, 0)}%</span>
          <span className="wr-label">win rate</span>
        </div>
        <div className="wr-bar">
          <div className="wr-win" style={{ width: `${winPct}%` }} />
          <div className="wr-loss" style={{ width: `${lossPct}%` }} />
        </div>
        <div className="wr-legend">
          <span className="pos">{s.wins}W</span>
          <span className="muted">{s.breakeven} B/E</span>
          <span className="neg">{s.losses}L</span>
        </div>
      </div>

      <div className="section-title">Performance</div>
      <div className="stat-grid">
        <Stat
          label="Net P&L"
          value={fmtMoney(s.netPnl)}
          cls={s.netPnl >= 0 ? 'pos' : 'neg'}
        />
        <Stat
          label="Profit Factor"
          value={s.profitFactor === Infinity ? '∞' : fmtNum(s.profitFactor, 2)}
        />
        <Stat
          label="Expectancy"
          value={fmtMoney(s.expectancy)}
          cls={s.expectancy >= 0 ? 'pos' : 'neg'}
        />
        <Stat label="Avg R:R" value={`${fmtNum(s.avgRR, 2)}R`} />
        <Stat label="Avg Win" value={fmtMoney(s.avgWin)} cls="pos" />
        <Stat label="Avg Loss" value={fmtMoney(s.avgLoss)} cls="neg" />
        <Stat label="Best Trade" value={fmtMoney(Number(s.best?.pnl) || 0)} cls="pos" />
        <Stat label="Worst Trade" value={fmtMoney(Number(s.worst?.pnl) || 0)} cls="neg" />
      </div>

      <div className="section-title">Streaks &amp; XP</div>
      <div className="stat-grid">
        <Stat label="🔥 Current Streak" value={`${streak}d`} cls="gold" />
        <Stat label="🏆 Longest Streak" value={`${longest}d`} cls="gold" />
        <Stat label="Level" value={`${lvl.level} · ${lvl.title}`} cls="xp" />
        <Stat label="Total XP" value={`${fmtNum(lvl.xp, 0)}`} cls="xp" />
      </div>

      <div className="section-title">Confidence</div>
      <div className="card conf-stats">
        <div className="conf-line">
          <span>Calibration score</span>
          <span className="mono">
            {conf.calibration != null ? `${conf.calibration}/100` : '—'}
          </span>
        </div>
        <div className="conf-line">
          <span>Avg confidence (overall)</span>
          <span className="mono">{fmtNum(conf.avgAll, 1)} / 10</span>
        </div>
        <div className="conf-line">
          <span>Avg confidence on wins</span>
          <span className="mono pos">{fmtNum(conf.avgWin, 1)}</span>
        </div>
        <div className="conf-line">
          <span>Avg confidence on losses</span>
          <span className="mono neg">{fmtNum(conf.avgLoss, 1)}</span>
        </div>
        <p className="conf-note">
          A high calibration score means your strongest convictions tend to be
          your winners — the goal is to size up on A+ setups and skip the rest.
        </p>
      </div>

      <div className="footer-note">TradeKeeper · stored locally on your device</div>
    </div>
  );
}
