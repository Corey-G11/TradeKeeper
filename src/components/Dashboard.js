import React from 'react';
import { useSelector } from 'react-redux';
import './Dashboard.css';
import { selectTrades } from '../features/trades/tradesSlice';
import { tradeStats, equityCurve } from '../utils/stats';
import {
  totalXp,
  levelInfo,
  currentStreak,
  longestStreak,
  confidenceStats,
  computeBadges,
} from '../utils/gamification';
import { fmtMoney, fmtNum } from '../utils/format';
import { Sparkline, Ring } from './Visuals';

export default function Dashboard({ onAdd, goTab }) {
  const trades = useSelector(selectTrades);
  const stats = tradeStats(trades);
  const xp = totalXp(trades);
  const lvl = levelInfo(xp);
  const streak = currentStreak(trades);
  const longest = longestStreak(trades);
  const conf = confidenceStats(trades);
  const badges = computeBadges(trades, stats);
  const curve = equityCurve(trades);
  const unlocked = badges.filter((b) => b.unlocked).length;

  return (
    <div className="dashboard">
      <header className="app-header">
        <div className="brand">
          <div className="logo">📈</div>
          <div>
            <h1>TradeKeeper</h1>
            <div className="sub">Trade. Log. Level up.</div>
          </div>
        </div>
      </header>

      {/* XP / Level hero */}
      <div className="xp-hero">
        <div className="xp-hero-top">
          <div className="level-badge">
            <span className="lvl-num">{lvl.level}</span>
            <span className="lvl-word">LVL</span>
          </div>
          <div className="xp-meta">
            <div className="rank">{lvl.title}</div>
            <div className="xp-count mono">{fmtNum(xp, 0)} XP</div>
          </div>
          <button className="streak-chip" onClick={() => goTab('stats')}>
            <span className="flame">🔥</span>
            <span className="mono">{streak}</span>
            <span className="streak-word">day{streak === 1 ? '' : 's'}</span>
          </button>
        </div>
        <div className="xp-bar">
          <div
            className="xp-fill"
            style={{ width: `${Math.round(lvl.progress * 100)}%` }}
          />
        </div>
        <div className="xp-foot">
          <span>{fmtNum(lvl.intoLevel, 0)} / {fmtNum(lvl.spanLevel, 0)}</span>
          <span>{fmtNum(lvl.toNext, 0)} XP to Lvl {lvl.level + 1}</span>
        </div>
      </div>

      {/* Quick KPIs */}
      <div className="kpi-row">
        <div className="kpi">
          <div className="kpi-label">Net P&amp;L</div>
          <div className={`kpi-val mono ${stats.netPnl >= 0 ? 'pos' : 'neg'}`}>
            {fmtMoney(stats.netPnl)}
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Win Rate</div>
          <div className="kpi-val mono">{fmtNum(stats.winRate, 0)}%</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Trades</div>
          <div className="kpi-val mono">{stats.count}</div>
        </div>
      </div>

      {/* Confidence tracker */}
      <div className="section-title">Confidence Tracker</div>
      <div className="card conf-card">
        <Ring
          value={conf.calibration != null ? conf.calibration / 100 : 0}
          color="var(--cyan)"
          label={conf.calibration != null ? `${conf.calibration}` : '—'}
          sub="calibration"
        />
        <div className="conf-detail">
          <p className="conf-blurb">
            {conf.calibration == null
              ? 'Rate your conviction on a few decided trades to unlock your calibration score.'
              : conf.calibration >= 60
              ? 'Sharp read — you tend to size conviction with winners.'
              : conf.calibration >= 45
              ? 'Decent read. Keep noticing what your A+ setups feel like.'
              : 'Your confidence and results are out of sync. Trust your A-setups, fade the FOMO.'}
          </p>
          <div className="conf-rows">
            <div className="conf-row">
              <span>Avg on wins</span>
              <span className="mono pos">{fmtNum(conf.avgWin, 1)}</span>
            </div>
            <div className="conf-row">
              <span>Avg on losses</span>
              <span className="mono neg">{fmtNum(conf.avgLoss, 1)}</span>
            </div>
            <div className="conf-row">
              <span>Overall</span>
              <span className="mono">{fmtNum(conf.avgAll, 1)} / 10</span>
            </div>
          </div>
        </div>
      </div>

      {/* Equity curve */}
      <div className="section-title">Equity Curve</div>
      <div className="card">
        <div className="curve-head">
          <span className={`mono ${stats.netPnl >= 0 ? 'pos' : 'neg'}`}>
            {fmtMoney(stats.netPnl)}
          </span>
          <span className="curve-sub">cumulative P&amp;L</span>
        </div>
        <Sparkline points={curve} />
      </div>

      {/* Badges */}
      <div className="section-title">
        Achievements <span className="count-tag">{unlocked}/{badges.length}</span>
      </div>
      <div className="badge-grid">
        {badges.map((b) => (
          <div key={b.id} className={`badge ${b.unlocked ? 'on' : 'off'}`}>
            <span className="badge-icon">{b.icon}</span>
            <span className="badge-label">{b.label}</span>
            <span className="badge-desc">{b.desc}</span>
          </div>
        ))}
      </div>

      <div className="dash-cta">
        <button className="btn full" onClick={onAdd}>
          + Log a Trade
        </button>
        <div className="streak-hint">
          {streak > 0
            ? `🔥 ${streak}-day streak — longest ${longest}. Don't break the chain!`
            : 'Log a trade today to start a streak 🔥'}
        </div>
      </div>
    </div>
  );
}
