import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import './Dashboard.css';
import { selectTrades } from '../features/trades/tradesSlice';
import { tradeStats, equityCurve, todayPnl } from '../utils/stats';
import { loadSettings, saveSettings } from '../utils/settings';
import {
  totalXp,
  levelInfo,
  currentStreak,
  longestStreak,
  confidenceStats,
  computeBadges,
} from '../utils/gamification';
import { fmtMoney, fmtNum } from '../utils/format';
import { useCountUp } from '../utils/useCountUp';
import { Sparkline, Ring } from './Visuals';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

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

  // animated counters
  const xpC = useCountUp(xp);
  const pnlC = useCountUp(stats.netPnl);
  const wrC = useCountUp(stats.winRate);
  const cntC = useCountUp(stats.count);
  const progressPct = Math.round(lvl.progress * 100);

  // Daily-loss guardrail
  const [maxDailyLoss, setMaxDailyLoss] = useState(() => loadSettings().maxDailyLoss);
  const tPnl = todayPnl(trades);
  const lossUsed = tPnl < 0 ? Math.abs(tPnl) : 0;
  const limit = Number(maxDailyLoss) || 0;
  const lockedOut = limit > 0 && lossUsed >= limit;
  const usedPct = limit > 0 ? Math.min(100, (lossUsed / limit) * 100) : 0;
  const updateLimit = (v) => {
    setMaxDailyLoss(v);
    const s = loadSettings();
    saveSettings({ ...s, maxDailyLoss: Number(v) || 0 });
  };

  return (
    <div className="dashboard">
      <header className="app-header rise">
        <div className="brand">
          <div className="logo">📈</div>
          <div>
            <h1>TradeKeeper</h1>
            <div className="sub">{greeting()} · let's log some trades</div>
          </div>
        </div>
      </header>

      {/* XP / Level hero */}
      <div className="xp-hero rise">
        <div className="xp-hero-glow" />
        <div className="xp-hero-top">
          <div className="level-badge">
            <span className="lvl-num">{lvl.level}</span>
            <span className="lvl-word">LVL</span>
          </div>
          <div className="xp-meta">
            <div className="rank">{lvl.title}</div>
            <div className="xp-count mono">{fmtNum(Math.round(xpC), 0)} XP</div>
          </div>
          <button className="streak-chip" onClick={() => goTab('stats')}>
            <span className="flame">🔥</span>
            <span className="mono">{streak}</span>
            <span className="streak-word">day{streak === 1 ? '' : 's'}</span>
          </button>
        </div>
        <div className="xp-bar">
          <div className="xp-fill" style={{ width: `${progressPct}%` }}>
            <span className="xp-shine" />
          </div>
        </div>
        <div className="xp-foot">
          <span>{fmtNum(lvl.intoLevel, 0)} / {fmtNum(lvl.spanLevel, 0)} XP</span>
          <span>{fmtNum(lvl.toNext, 0)} to Lvl {lvl.level + 1}</span>
        </div>
      </div>

      {/* Quick KPIs */}
      <div className="kpi-row rise">
        <div className="kpi">
          <div className="kpi-label">Net P&amp;L</div>
          <div className={`kpi-val mono ${stats.netPnl >= 0 ? 'pos' : 'neg'}`}>
            {fmtMoney(pnlC)}
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Win Rate</div>
          <div className="kpi-val mono">{fmtNum(wrC, 0)}%</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Trades</div>
          <div className="kpi-val mono">{Math.round(cntC)}</div>
        </div>
      </div>

      {/* Daily risk guardrail */}
      <div className="section-title rise">🛑 Daily Risk Guardrail</div>
      <div className={`card guardrail rise ${lockedOut ? 'locked' : ''}`}>
        {lockedOut ? (
          <div className="gr-lock">
            🛑 Daily loss limit hit — step away. Protect the account; there's
            always another setup tomorrow.
          </div>
        ) : (
          <div className="gr-row">
            <div>
              <div className="gr-label">Today's P&amp;L</div>
              <div className={`gr-pnl mono ${tPnl >= 0 ? 'pos' : 'neg'}`}>
                {tPnl > 0 ? '+' : ''}
                {fmtMoney(tPnl)}
              </div>
            </div>
            <label className="gr-limit">
              <span>Max daily loss</span>
              <div className="gr-limit-input">
                <span>$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={maxDailyLoss}
                  onChange={(e) => updateLimit(e.target.value)}
                />
              </div>
            </label>
          </div>
        )}
        <div className="gr-bar">
          <div
            className={`gr-fill ${lockedOut ? 'over' : ''}`}
            style={{ width: `${usedPct}%` }}
          />
        </div>
        <div className="gr-foot">
          {limit > 0
            ? `${fmtMoney(lossUsed)} of ${fmtMoney(limit)} risk used today`
            : 'Set a daily max loss to enable the lockout warning'}
        </div>
      </div>

      {/* Confidence tracker */}
      <div className="section-title rise">🎯 Confidence Tracker</div>
      <div className="card conf-card rise">
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
              ? 'Sharp read — you size conviction with your winners.'
              : conf.calibration >= 45
              ? 'Decent read. Keep noticing what your A+ setups feel like.'
              : 'Confidence & results are out of sync. Trust your A-setups, fade the FOMO.'}
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
      <div className="section-title rise">📈 Equity Curve</div>
      <div className="card rise">
        <div className="curve-head">
          <span className={`mono ${stats.netPnl >= 0 ? 'pos' : 'neg'}`}>
            {fmtMoney(stats.netPnl)}
          </span>
          <span className="curve-sub">cumulative P&amp;L</span>
        </div>
        <Sparkline points={curve} />
      </div>

      {/* Badges */}
      <div className="section-title rise">
        🏅 Achievements <span className="count-tag">{unlocked}/{badges.length}</span>
      </div>
      <div className="badge-grid rise">
        {badges.map((b) => (
          <div key={b.id} className={`badge ${b.unlocked ? 'on' : 'off'}`}>
            <span className="badge-icon">{b.icon}</span>
            <span className="badge-label">{b.label}</span>
            <span className="badge-desc">{b.desc}</span>
          </div>
        ))}
      </div>

      <div className="dash-cta rise">
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
