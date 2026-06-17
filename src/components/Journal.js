import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import './Journal.css';
import { selectTrades } from '../features/trades/tradesSlice';
import TradeCard from './TradeCard';

const BASE_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'win', label: 'Wins' },
  { id: 'loss', label: 'Losses' },
  { id: 'futures', label: 'Futures' },
  { id: 'forex', label: 'Forex' },
];

export default function Journal({ onAdd, onEdit }) {
  const trades = useSelector(selectTrades);
  const reviewCount = trades.filter((t) => t.needsReview).length;
  const [filter, setFilter] = useState('all');

  const filters = reviewCount
    ? [{ id: 'review', label: 'Review', count: reviewCount }, ...BASE_FILTERS]
    : BASE_FILTERS;

  const filtered = useMemo(() => {
    const list = [...trades].sort((a, b) => new Date(b.date) - new Date(a.date));
    switch (filter) {
      case 'review':
        return list.filter((t) => t.needsReview);
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
              {reviewCount ? ` · ${reviewCount} to review` : ''}
            </div>
          </div>
        </div>
        <button className="btn" onClick={onAdd}>
          + New
        </button>
      </header>

      {reviewCount > 0 && filter !== 'review' && (
        <button className="review-banner" onClick={() => setFilter('review')}>
          <span>📡 {reviewCount} imported trade{reviewCount === 1 ? '' : 's'} need review</span>
          <span className="rb-go">Review →</span>
        </button>
      )}

      <div className="filter-row">
        {filters.map((f) => (
          <button
            key={f.id}
            className={`chip ${filter === f.id ? 'active' : ''} ${
              f.id === 'review' ? 'review' : ''
            }`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
            {f.count ? <span className="chip-count">{f.count}</span> : null}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <div className="big">{filter === 'review' ? '✅' : '📓'}</div>
          <p>
            {filter === 'review'
              ? 'Nothing to review — every imported trade has your notes. Nice.'
              : trades.length === 0
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
