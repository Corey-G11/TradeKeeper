import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import './Journal.css';
import { selectTrades } from '../features/trades/tradesSlice';
import TradeCard from './TradeCard';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'win', label: 'Wins' },
  { id: 'loss', label: 'Losses' },
  { id: 'futures', label: 'Futures' },
  { id: 'forex', label: 'Forex' },
];

export default function Journal({ onAdd, onEdit }) {
  const trades = useSelector(selectTrades);
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    const list = [...trades].sort((a, b) => new Date(b.date) - new Date(a.date));
    switch (filter) {
      case 'win':
      case 'loss':
        return list.filter((t) => t.result === filter);
      case 'futures':
      case 'forex':
        return list.filter((t) => t.market === filter);
      default:
        return list;
    }
  }, [trades, filter]);

  return (
    <div className="journal">
      <header className="app-header">
        <div className="brand">
          <div>
            <h1>Journal</h1>
            <div className="sub">
              {trades.length} trade{trades.length === 1 ? '' : 's'} logged
            </div>
          </div>
        </div>
        <button className="btn" onClick={onAdd}>
          + New
        </button>
      </header>

      <div className="filter-row">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className={`chip ${filter === f.id ? 'active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <div className="big">📓</div>
          <p>
            {trades.length === 0
              ? 'No trades yet. Log your first one to start building your edge.'
              : 'No trades match this filter.'}
          </p>
          {trades.length === 0 && (
            <button className="btn" onClick={onAdd}>
              + Log your first trade
            </button>
          )}
        </div>
      ) : (
        <div className="trade-list">
          {filtered.map((t) => (
            <TradeCard key={t.id} trade={t} onEdit={() => onEdit(t)} />
          ))}
        </div>
      )}
    </div>
  );
}
