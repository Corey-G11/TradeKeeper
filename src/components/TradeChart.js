import React from 'react';
import './TradeChart.css';
import { fmtNum } from '../utils/format';

// Renders a clean trade chart: entry & exit markers plus entry / TP / SL
// price lines, scaled to the trade's prices. If `trade.candles` is provided
// (e.g. fed from Tradovate later) it draws real candlesticks; otherwise it
// draws a schematic path from entry to exit. Live-updates from form values.
export default function TradeChart({ trade }) {
  const entry = Number(trade.entry);
  const stop = Number(trade.stopLoss);
  const target = Number(trade.profitTarget);
  if (!Number.isFinite(entry)) return null;

  // Actual exit price if known, else infer from the result for the schematic.
  let exit = Number(trade.exit);
  if (!Number.isFinite(exit)) {
    if (trade.result === 'win' && Number.isFinite(target)) exit = target;
    else if (trade.result === 'loss' && Number.isFinite(stop)) exit = stop;
    else exit = entry;
  }

  const W = 320;
  const H = 196;
  const padY = 18;
  const xEntry = 30;
  const xExit = W - 78; // leave room for price labels on the right
  const labelX = W - 70;

  const prices = [entry, stop, target, exit].filter((p) => Number.isFinite(p));
  let lo = Math.min(...prices);
  let hi = Math.max(...prices);
  if (lo === hi) {
    lo -= 1;
    hi += 1;
  }
  const pad = (hi - lo) * 0.14;
  lo -= pad;
  hi += pad;
  const y = (p) => padY + ((hi - p) / (hi - lo)) * (H - padY * 2);

  const long = trade.direction !== 'short';
  const candles = Array.isArray(trade.candles) ? trade.candles : null;

  const Line = ({ price, cls }) =>
    Number.isFinite(price) ? (
      <g>
        <line
          x1="8"
          x2={labelX - 4}
          y1={y(price)}
          y2={y(price)}
          className={`tch-line ${cls}`}
        />
        <text x={labelX} y={y(price) + 3.5} className={`tch-plabel ${cls}`}>
          {fmtNum(price, 2)}
        </text>
      </g>
    ) : null;

  // schematic price path from entry -> exit
  const pathD = `M ${xEntry} ${y(entry)} C ${(xEntry + xExit) / 2} ${y(entry)}, ${
    (xEntry + xExit) / 2
  } ${y(exit)}, ${xExit} ${y(exit)}`;

  const win = trade.result === 'win';
  const exitCls = win ? 'win' : trade.result === 'loss' ? 'loss' : 'be';

  return (
    <div className="trade-chart">
      <svg viewBox={`0 0 ${W} ${H}`} className="tch-svg">
        {/* TP / SL shaded zones relative to entry */}
        {Number.isFinite(target) && (
          <rect
            x="8"
            width={labelX - 12}
            y={Math.min(y(entry), y(target))}
            height={Math.abs(y(target) - y(entry))}
            className="tch-zone win"
          />
        )}
        {Number.isFinite(stop) && (
          <rect
            x="8"
            width={labelX - 12}
            y={Math.min(y(entry), y(stop))}
            height={Math.abs(y(stop) - y(entry))}
            className="tch-zone loss"
          />
        )}

        <Line price={target} cls="win" />
        <Line price={stop} cls="loss" />
        <Line price={entry} cls="entry" />

        {candles ? (
          candles.map((c, i) => {
            const cx = xEntry + ((xExit - xEntry) * i) / Math.max(1, candles.length - 1);
            const up = c.c >= c.o;
            return (
              <g key={i} className={up ? 'tch-up' : 'tch-down'}>
                <line x1={cx} x2={cx} y1={y(c.h)} y2={y(c.l)} className="tch-wick" />
                <rect
                  x={cx - 2}
                  width="4"
                  y={Math.min(y(c.o), y(c.c))}
                  height={Math.max(1, Math.abs(y(c.c) - y(c.o)))}
                  className="tch-body"
                />
              </g>
            );
          })
        ) : (
          <path d={pathD} className="tch-path" />
        )}

        {/* entry & exit markers */}
        <circle cx={xEntry} cy={y(entry)} r="5" className="tch-entry-dot" />
        <text x={xEntry} y={y(entry) - 9} className="tch-mk">
          {long ? '▲' : '▼'}
        </text>
        <circle cx={xExit} cy={y(exit)} r="5" className={`tch-exit-dot ${exitCls}`} />
      </svg>
      <div className="tch-legend">
        <span className="tch-tag entry">● Entry {fmtNum(entry, 2)}</span>
        <span className={`tch-tag ${exitCls}`}>● Exit {fmtNum(exit, 2)}</span>
        <span className="tch-dir">{long ? 'LONG' : 'SHORT'}</span>
      </div>
    </div>
  );
}
