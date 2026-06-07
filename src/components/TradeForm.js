import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import './TradeForm.css';
import { addTrade, updateTrade, deleteTrade } from '../features/trades/tradesSlice';
import { computeRR, fmtNum } from '../utils/format';
import { xpForTrade } from '../utils/gamification';
import { COMMON_TAGS } from '../utils/settings';

const blank = {
  market: 'futures',
  symbol: '',
  direction: 'long',
  entry: '',
  stopLoss: '',
  profitTarget: '',
  contracts: '',
  lots: '',
  result: 'win',
  pnl: '',
  confidence: 5,
  followedPlan: true,
  tags: [],
  notes: '',
  date: new Date().toISOString().slice(0, 10),
};

export default function TradeForm({ trade, prefill, onClose }) {
  const dispatch = useDispatch();
  const isEdit = Boolean(trade);

  const [form, setForm] = useState(() => {
    if (trade) {
      return {
        ...blank,
        ...trade,
        tags: trade.tags || [],
        date: (trade.date || new Date().toISOString()).slice(0, 10),
      };
    }
    return { ...blank, ...(prefill || {}), tags: (prefill && prefill.tags) || [] };
  });
  const [tagDraft, setTagDraft] = useState('');

  const set = (key) => (e) => {
    const val =
      e && e.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e;
    setForm((f) => ({ ...f, [key]: val }));
  };

  const toggleTag = (tag) => {
    const t = tag.trim();
    if (!t) return;
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(t) ? f.tags.filter((x) => x !== t) : [...f.tags, t],
    }));
  };

  const addDraftTag = () => {
    if (tagDraft.trim()) {
      toggleTag(tagDraft);
      setTagDraft('');
    }
  };

  const rr = computeRR(form);
  const previewXp = xpForTrade(form);
  const numify = (v) => (v === '' || v == null ? '' : Number(v));

  const onSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      symbol: form.symbol.trim().toUpperCase(),
      entry: numify(form.entry),
      stopLoss: numify(form.stopLoss),
      profitTarget: numify(form.profitTarget),
      contracts: form.market === 'futures' ? numify(form.contracts) : '',
      lots: form.market === 'forex' ? numify(form.lots) : '',
      pnl: numify(form.pnl),
      confidence: Number(form.confidence),
      tags: form.tags,
      date: new Date(form.date + 'T12:00:00').toISOString(),
    };
    if (isEdit) {
      dispatch(updateTrade({ ...payload, id: trade.id }));
    } else {
      dispatch(addTrade(payload));
    }
    onClose();
  };

  const onDelete = () => {
    // eslint-disable-next-line no-alert
    if (window.confirm('Delete this trade? This cannot be undone.')) {
      dispatch(deleteTrade(trade.id));
      onClose();
    }
  };

  const tagOptions = [...new Set([...COMMON_TAGS, ...form.tags])];

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-head">
          <h2>{isEdit ? 'Edit Trade' : 'Log Trade'}</h2>
          <button className="x" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form className="sheet-body" onSubmit={onSubmit}>
          {prefill && !isEdit && (
            <div className="prefill-note">🧮 Pre-filled from your calculator — add the result after the trade closes.</div>
          )}

          {/* Market */}
          <div className="seg">
            {['futures', 'forex'].map((m) => (
              <button
                type="button"
                key={m}
                className={form.market === m ? 'on' : ''}
                onClick={() => set('market')(m)}
              >
                {m === 'futures' ? '📊 Futures' : '💱 Forex'}
              </button>
            ))}
          </div>

          {/* Symbol + direction */}
          <div className="grid-2">
            <label className="field">
              <span>Symbol</span>
              <input
                value={form.symbol}
                onChange={set('symbol')}
                placeholder={form.market === 'forex' ? 'EUR/USD' : 'ES / NQ'}
                autoCapitalize="characters"
              />
            </label>
            <div className="field">
              <span>Direction</span>
              <div className="seg small">
                <button
                  type="button"
                  className={form.direction === 'long' ? 'on long' : ''}
                  onClick={() => set('direction')('long')}
                >
                  ▲ Long
                </button>
                <button
                  type="button"
                  className={form.direction === 'short' ? 'on short' : ''}
                  onClick={() => set('direction')('short')}
                >
                  ▼ Short
                </button>
              </div>
            </div>
          </div>

          {/* Prices */}
          <div className="grid-3">
            <label className="field">
              <span>Entry</span>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                value={form.entry}
                onChange={set('entry')}
                placeholder="0.00"
              />
            </label>
            <label className="field">
              <span>Stop Loss</span>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                value={form.stopLoss}
                onChange={set('stopLoss')}
                placeholder="0.00"
              />
            </label>
            <label className="field">
              <span>Target</span>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                value={form.profitTarget}
                onChange={set('profitTarget')}
                placeholder="0.00"
              />
            </label>
          </div>

          {/* R:R + size */}
          <div className="grid-2">
            <div className="field">
              <span>Risk : Reward</span>
              <div className="rr-display mono">
                {rr != null ? (
                  <>
                    1 : <strong>{fmtNum(rr, 2)}</strong>
                  </>
                ) : (
                  <span className="muted">auto from prices</span>
                )}
              </div>
            </div>
            {form.market === 'futures' ? (
              <label className="field">
                <span>Contracts</span>
                <input
                  type="number"
                  step="1"
                  inputMode="numeric"
                  value={form.contracts}
                  onChange={set('contracts')}
                  placeholder="1"
                />
              </label>
            ) : (
              <label className="field">
                <span>Lots</span>
                <input
                  type="number"
                  step="any"
                  inputMode="decimal"
                  value={form.lots}
                  onChange={set('lots')}
                  placeholder="1.0"
                />
              </label>
            )}
          </div>

          {/* Result + P&L */}
          <div className="grid-2">
            <div className="field">
              <span>Result</span>
              <div className="seg small three">
                <button
                  type="button"
                  className={form.result === 'win' ? 'on win' : ''}
                  onClick={() => set('result')('win')}
                >
                  Win
                </button>
                <button
                  type="button"
                  className={form.result === 'loss' ? 'on loss' : ''}
                  onClick={() => set('result')('loss')}
                >
                  Loss
                </button>
                <button
                  type="button"
                  className={form.result === 'breakeven' ? 'on be' : ''}
                  onClick={() => set('result')('breakeven')}
                >
                  B/E
                </button>
              </div>
            </div>
            <label className="field">
              <span>P&amp;L ($)</span>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                value={form.pnl}
                onChange={set('pnl')}
                placeholder="0.00"
              />
            </label>
          </div>

          {/* Confidence */}
          <div className="field">
            <span>
              Confidence <b className="conf-val mono">{form.confidence}/10</b>
            </span>
            <input
              type="range"
              min="1"
              max="10"
              value={form.confidence}
              onChange={set('confidence')}
              className="slider"
            />
            <div className="slider-scale">
              <span>FOMO</span>
              <span>Conviction</span>
            </div>
          </div>

          {/* Followed plan */}
          <button
            type="button"
            className={`toggle-row ${form.followedPlan ? 'on' : ''}`}
            onClick={() => set('followedPlan')(!form.followedPlan)}
          >
            <span>🛡️ Followed my plan</span>
            <span className={`switch ${form.followedPlan ? 'on' : ''}`}>
              <i />
            </span>
          </button>

          {/* Tags / setups */}
          <div className="field">
            <span>Setups / Tags</span>
            <div className="tag-cloud">
              {tagOptions.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  className={`tag-chip ${form.tags.includes(tag) ? 'on' : ''}`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="tag-add">
              <input
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addDraftTag();
                  }
                }}
                placeholder="Add custom tag…"
              />
              <button type="button" className="btn ghost" onClick={addDraftTag}>
                Add
              </button>
            </div>
          </div>

          {/* Date + notes */}
          <label className="field">
            <span>Date</span>
            <input type="date" value={form.date} onChange={set('date')} />
          </label>

          <label className="field">
            <span>Notes</span>
            <textarea
              rows="3"
              value={form.notes}
              onChange={set('notes')}
              placeholder="Setup, emotions, what you'd do differently…"
            />
          </label>

          <div className="xp-preview">
            <span>⚡ This entry earns</span>
            <span className="mono">+{previewXp} XP</span>
          </div>

          <button type="submit" className="btn full save-btn">
            {isEdit ? 'Save Changes' : 'Log Trade'}
          </button>

          {isEdit && (
            <button type="button" className="btn danger full" onClick={onDelete}>
              Delete Trade
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
