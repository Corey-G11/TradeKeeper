import React from 'react';
import './TradeCard.css';
import { fmtMoney, fmtNum, fmtDate, computeRR } from '../utils/format';

const resultMeta = {
  win: { cls: 'win', label: 'WIN' },
  loss: { cls: 'loss', label: 'LOSS' },
  breakeven: { cls: 'be', label: 'B/E' },
};

export default function TradeCard({ trade, onEdit }) {
  const rr = trade.riskReward != null ? trade.riskReward : computeRR(trade);
  const meta = resultMeta[trade.result] || resultMeta.breakeven;
  const pnl = Number(trade.pnl) || 0;
  const size =
    trade.market === 'forex'
      ? `${fmtNum(trade.lots, 2)} lot${Number(trade.lots) === 1 ? '' : 's'}`
      : `${fmtNum(trade.contracts, 0)} contract${Number(trade.contracts) === 1 ? '' : 's'}`;

  return (
    <button className="trade-card" onClick={onEdit}>
      <div className={`tc-accent ${meta.cls}`} />
      <div className="tc-main">
        <div className="tc-top">
          <div className="tc-symbol">
            <span className={`dir ${trade.direction}`}>
              {trade.direction === 'long' ? '▲' : '▼'}
            </span>
            <span className="sym">{trade.symbol || '—'}</span>
            <span className="mkt">{trade.market}</span>
          </div>
          <span className={`pill ${meta.cls}`}>{meta.label}</span>
        </div>

        <div className="tc-mid">
          <div className={`tc-pnl mono ${pnl >= 0 ? 'pos' : 'neg'}`}>
            {pnl > 0 ? '+' : ''}
            {fmtMoney(pnl)}
          </div>
          <div className="tc-rr mono">
            {rr != null ? `${fmtNum(rr, 2)}R` : '—'}
          </div>
        </div>

        <div className="tc-foot">
          <span className="mono">
            {trade.entry !== '' ? `@ ${fmtNum(trade.entry, 4)}` : 'no entry'} · {size}
          </span>
          <span className="tc-date">
            {trade.confidence ? `★ ${trade.confidence}/10 · ` : ''}
            {fmtDate(trade.date)}
          </span>
        </div>
      </div>
    </button>
  );
}
