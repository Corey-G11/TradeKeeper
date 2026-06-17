import React, { useMemo, useState } from 'react';
import './CalendarHeatmap.css';
import { dayKey, fmtMoney } from '../utils/format';

const WD = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const compact = (n) => {
  const v = Math.round(n);
  const a = Math.abs(v);
  const s = v < 0 ? '-' : '+';
  if (a >= 1000) return `${s}${(a / 1000).toFixed(a >= 10000 ? 0 : 1)}k`;
  return `${s}${a}`;
};

// Monthly P&L calendar: each day tinted green/red by net P&L, intensity by size.
export default function CalendarHeatmap({ trades }) {
  const now = new Date();
  const [cur, setCur] = useState({ y: now.getFullYear(), m: now.getMonth() });

  const byDay = useMemo(() => {
    const map = {};
    for (const t of trades) {
      const k = dayKey(t.date);
      const g = (map[k] ||= { pnl: 0, count: 0 });
      g.pnl += Number(t.pnl) || 0;
      g.count += 1;
    }
    return map;
  }, [trades]);

  const { y, m } = cur;
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const startWd = new Date(y, m, 1).getDay();
  const todayKey = dayKey(new Date().toISOString());

  let monthPnl = 0;
  let tradingDays = 0;
  let green = 0;
  let red = 0;
  let maxAbs = 0;
  const days = [];
  for (let d = 1; d <= daysInMonth; d += 1) {
    const key = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const info = byDay[key];
    if (info) {
      monthPnl += info.pnl;
      tradingDays += 1;
      if (info.pnl > 0) green += 1;
      else if (info.pnl < 0) red += 1;
      maxAbs = Math.max(maxAbs, Math.abs(info.pnl));
    }
    days.push({ d, key, info });
  }

  const cells = [...Array(startWd).fill(null), ...days];

  const tint = (pnl) => {
    if (!pnl) return {};
    const a = 0.16 + 0.5 * Math.min(1, Math.abs(pnl) / (maxAbs || 1));
    return { background: pnl > 0 ? `rgba(30,217,138,${a})` : `rgba(255,90,110,${a})` };
  };

  const step = (dir) =>
    setCur((c) => {
      const mm = c.m + dir;
      if (mm < 0) return { y: c.y - 1, m: 11 };
      if (mm > 11) return { y: c.y + 1, m: 0 };
      return { y: c.y, m: mm };
    });

  return (
    <div className="card cal">
      <div className="cal-head">
        <button className="cal-nav" onClick={() => step(-1)} aria-label="Previous month">
          ‹
        </button>
        <div className="cal-title">
          <span>{MONTHS[m]} {y}</span>
          <span className={`cal-total mono ${monthPnl >= 0 ? 'pos' : 'neg'}`}>
            {fmtMoney(monthPnl)}
          </span>
        </div>
        <button className="cal-nav" onClick={() => step(1)} aria-label="Next month">
          ›
        </button>
      </div>

      <div className="cal-grid cal-wd">
        {WD.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>

      <div className="cal-grid">
        {cells.map((c, i) =>
          c == null ? (
            <div key={`e${i}`} className="cal-cell empty" />
          ) : (
            <div
              key={c.key}
              className={`cal-cell ${c.info ? 'has' : ''} ${
                c.key === todayKey ? 'today' : ''
              }`}
              style={c.info ? tint(c.info.pnl) : undefined}
            >
              <span className="cal-d">{c.d}</span>
              {c.info && <span className="cal-p mono">{compact(c.info.pnl)}</span>}
            </div>
          )
        )}
      </div>

      <div className="cal-foot">
        {tradingDays
          ? `${tradingDays} trading day${tradingDays === 1 ? '' : 's'} · ${green}G / ${red}R`
          : 'No trades this month'}
      </div>
    </div>
  );
}
