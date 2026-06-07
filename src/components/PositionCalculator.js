import React, { useMemo, useState, useEffect } from 'react';
import './PositionCalculator.css';
import { fmtMoney, fmtNum } from '../utils/format';
import { loadSettings } from '../utils/settings';

// $ per 1.00 point of price movement, per contract, for common futures.
const FUTURES = {
  ES: 50,
  MES: 5,
  NQ: 20,
  MNQ: 2,
  YM: 5,
  MYM: 0.5,
  RTY: 50,
  M2K: 5,
  CL: 1000,
  GC: 100,
  Custom: null,
};

const STORAGE_KEY = 'tradekeeper:calc:v1';

const loadSaved = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
};

const defaults = {
  market: 'futures',
  account: 5000,
  riskPercent: 1,
  entry: '',
  stop: '',
  rr: 2,
  instrument: 'ES',
  pointValue: 50,
  pipValue: 10,
  pipSize: 0.0001,
};

export default function PositionCalculator({ onClose, onLogTrade }) {
  const [f, setF] = useState(() => ({ ...defaults, ...loadSaved() }));
  const checklist = loadSettings().checklist;
  const [checked, setChecked] = useState(() => checklist.map(() => false));
  const allChecked = checked.every(Boolean);

  const logTrade = () => {
    if (!r.ready || !onLogTrade) return;
    onLogTrade({
      market: f.market,
      direction: r.direction,
      entry: Number(f.entry),
      stopLoss: Number(f.stop),
      profitTarget: Math.round(r.tp * 1e6) / 1e6,
      contracts: f.market === 'futures' ? r.wholeSize : '',
      lots: f.market === 'forex' ? r.wholeSize : '',
      symbol:
        f.market === 'futures' && f.instrument !== 'Custom' ? f.instrument : '',
    });
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(f));
    } catch {
      /* ignore */
    }
  }, [f]);

  const set = (k) => (e) => {
    const val = e && e.target ? e.target.value : e;
    setF((p) => ({ ...p, [k]: val }));
  };

  const r = useMemo(() => {
    const account = Number(f.account) || 0;
    const riskPct = Number(f.riskPercent) || 0;
    const entry = Number(f.entry);
    const stop = Number(f.stop);
    const rr = Number(f.rr) || 0;
    const riskDollars = account * (riskPct / 100);

    if (!Number.isFinite(entry) || !Number.isFinite(stop) || entry === stop) {
      return { riskDollars, ready: false };
    }

    const direction = stop < entry ? 'long' : 'short';
    const distance = Math.abs(entry - stop);
    const tp = direction === 'long' ? entry + distance * rr : entry - distance * rr;

    let size = 0;
    let sizeLabel = '';
    let riskPerUnit = 0;
    let distanceLabel = '';

    if (f.market === 'futures') {
      const pv =
        f.instrument === 'Custom'
          ? Number(f.pointValue) || 0
          : FUTURES[f.instrument] || 0;
      riskPerUnit = distance * pv;
      size = riskPerUnit > 0 ? riskDollars / riskPerUnit : 0;
      sizeLabel = 'contracts';
      distanceLabel = `${fmtNum(distance, 2)} pts`;
    } else {
      const pipSize = Number(f.pipSize) || 0.0001;
      const pipValue = Number(f.pipValue) || 0;
      const distancePips = distance / pipSize;
      riskPerUnit = distancePips * pipValue;
      size = riskPerUnit > 0 ? riskDollars / riskPerUnit : 0;
      sizeLabel = 'lots';
      distanceLabel = `${fmtNum(distancePips, 1)} pips`;
    }

    const wholeSize = f.market === 'futures' ? Math.floor(size) : Math.round(size * 100) / 100;

    return {
      ready: true,
      direction,
      riskDollars,
      distance,
      distanceLabel,
      tp,
      stop,
      size,
      wholeSize,
      sizeLabel,
      actualRisk: wholeSize * riskPerUnit,
      reward: wholeSize * riskPerUnit * rr,
      tooSmall: wholeSize <= 0,
    };
  }, [f]);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet calc-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-head">
          <h2>🧮 Position Calculator</h2>
          <button className="x" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="sheet-body">
          <div className="seg">
            {['futures', 'forex'].map((m) => (
              <button
                type="button"
                key={m}
                className={f.market === m ? 'on' : ''}
                onClick={() => set('market')(m)}
              >
                {m === 'futures' ? '📊 Futures' : '💱 Forex'}
              </button>
            ))}
          </div>

          <div className="grid-2">
            <label className="field">
              <span>Account ($)</span>
              <input
                type="number"
                inputMode="decimal"
                value={f.account}
                onChange={set('account')}
              />
            </label>
            <label className="field">
              <span>Risk per trade (%)</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={f.riskPercent}
                onChange={set('riskPercent')}
              />
            </label>
          </div>

          <div className="grid-2">
            <label className="field">
              <span>Entry price</span>
              <input
                type="number"
                inputMode="decimal"
                step="any"
                value={f.entry}
                onChange={set('entry')}
                placeholder="0.00"
              />
            </label>
            <label className="field">
              <span>Stop-loss price</span>
              <input
                type="number"
                inputMode="decimal"
                step="any"
                value={f.stop}
                onChange={set('stop')}
                placeholder="0.00"
              />
            </label>
          </div>

          {f.market === 'futures' ? (
            <div className="grid-2">
              <label className="field">
                <span>Instrument</span>
                <select value={f.instrument} onChange={set('instrument')}>
                  {Object.keys(FUTURES).map((k) => (
                    <option key={k} value={k}>
                      {k}
                      {FUTURES[k] != null ? ` ($${FUTURES[k]}/pt)` : ''}
                    </option>
                  ))}
                </select>
              </label>
              {f.instrument === 'Custom' ? (
                <label className="field">
                  <span>$ per point</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={f.pointValue}
                    onChange={set('pointValue')}
                  />
                </label>
              ) : (
                <label className="field">
                  <span>Target R:R</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={f.rr}
                    onChange={set('rr')}
                  />
                </label>
              )}
            </div>
          ) : (
            <div className="grid-3">
              <label className="field">
                <span>$ / pip (1 lot)</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={f.pipValue}
                  onChange={set('pipValue')}
                />
              </label>
              <label className="field">
                <span>Pip size</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  value={f.pipSize}
                  onChange={set('pipSize')}
                />
              </label>
              <label className="field">
                <span>Target R:R</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={f.rr}
                  onChange={set('rr')}
                />
              </label>
            </div>
          )}

          {f.market === 'futures' && f.instrument === 'Custom' && (
            <label className="field">
              <span>Target R:R</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={f.rr}
                onChange={set('rr')}
              />
            </label>
          )}

          <div className="calc-results">
            {!r.ready ? (
              <div className="calc-hint">
                Enter an entry and stop-loss price to size your trade.
              </div>
            ) : (
              <>
                <div className="calc-headline">
                  <div className="calc-size">
                    <span className="calc-size-num mono">
                      {f.market === 'futures'
                        ? r.wholeSize
                        : fmtNum(r.wholeSize, 2)}
                    </span>
                    <span className="calc-size-unit">{r.sizeLabel}</span>
                  </div>
                  <span className={`pill ${r.direction === 'long' ? 'win' : 'loss'}`}>
                    {r.direction === 'long' ? '▲ LONG' : '▼ SHORT'}
                  </span>
                </div>

                {r.tooSmall && (
                  <div className="calc-warn">
                    Your risk is too small for even 1 {r.sizeLabel.slice(0, -1)} at
                    this stop. Widen risk %, shrink the stop, or size up the account.
                  </div>
                )}

                <div className="calc-grid">
                  <div className="calc-cell sl">
                    <span>Stop Loss</span>
                    <b className="mono">{fmtNum(r.stop, 4)}</b>
                  </div>
                  <div className="calc-cell tp">
                    <span>Take Profit</span>
                    <b className="mono">{fmtNum(r.tp, 4)}</b>
                  </div>
                  <div className="calc-cell">
                    <span>Risk</span>
                    <b className="mono neg">{fmtMoney(r.actualRisk || r.riskDollars)}</b>
                  </div>
                  <div className="calc-cell">
                    <span>Reward @ {fmtNum(f.rr, 1)}R</span>
                    <b className="mono pos">{fmtMoney(r.reward)}</b>
                  </div>
                  <div className="calc-cell">
                    <span>Stop distance</span>
                    <b className="mono">{r.distanceLabel}</b>
                  </div>
                  <div className="calc-cell">
                    <span>Exact size</span>
                    <b className="mono">{fmtNum(r.size, 2)}</b>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Pre-trade checklist */}
          <div className="checklist">
            <div className="checklist-head">
              <span>✅ Pre-Trade Checklist</span>
              <span className="mono">
                {checked.filter(Boolean).length}/{checklist.length}
              </span>
            </div>
            {checklist.map((item, i) => (
              <button
                type="button"
                key={item}
                className={`check-row ${checked[i] ? 'on' : ''}`}
                onClick={() =>
                  setChecked((c) => c.map((v, j) => (j === i ? !v : v)))
                }
              >
                <span className={`box ${checked[i] ? 'on' : ''}`}>
                  {checked[i] ? '✓' : ''}
                </span>
                <span>{item}</span>
              </button>
            ))}
          </div>

          {onLogTrade && (
            <button
              type="button"
              className="btn full log-from-calc"
              disabled={!r.ready}
              onClick={logTrade}
            >
              Log this trade →
            </button>
          )}
          {!allChecked && r.ready && (
            <div className="checklist-warn">
              Tip: tick every box before you take the trade.
            </div>
          )}

          <p className="calc-note">
            Sizes round down (futures) so you never exceed your planned risk.
            Always double-check tick/pip values for your broker.
          </p>
        </div>
      </div>
    </div>
  );
}
