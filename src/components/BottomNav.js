import React from 'react';
import './BottomNav.css';

const Icon = ({ name }) => {
  const common = {
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };
  switch (name) {
    case 'dashboard':
      return (
        <svg {...common}>
          <path d="M3 13h8V3H3zM13 21h8V11h-8zM13 3v6h8V3zM3 21h8v-6H3z" />
        </svg>
      );
    case 'journal':
      return (
        <svg {...common}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case 'stats':
      return (
        <svg {...common}>
          <path d="M3 3v18h18" />
          <path d="M7 14l4-4 3 3 5-6" />
        </svg>
      );
    case 'calc':
      return (
        <svg {...common}>
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <path d="M8 6h8M8 10h0M12 10h0M16 10h0M8 14h0M12 14h0M16 14h0M8 18h0M12 18h0M16 18h0" />
        </svg>
      );
    default:
      return null;
  }
};

export default function BottomNav({ tab, setTab, onAdd, onCalc }) {
  return (
    <nav className="bottom-nav">
      <button
        className={`nav-item ${tab === 'dashboard' ? 'active' : ''}`}
        onClick={() => setTab('dashboard')}
      >
        <Icon name="dashboard" />
        <span>Home</span>
      </button>
      <button
        className={`nav-item ${tab === 'journal' ? 'active' : ''}`}
        onClick={() => setTab('journal')}
      >
        <Icon name="journal" />
        <span>Journal</span>
      </button>

      <button className="nav-fab" onClick={onAdd} aria-label="Log a trade">
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      <button
        className={`nav-item ${tab === 'stats' ? 'active' : ''}`}
        onClick={() => setTab('stats')}
      >
        <Icon name="stats" />
        <span>Stats</span>
      </button>
      <button className="nav-item" onClick={onCalc}>
        <Icon name="calc" />
        <span>Calc</span>
      </button>
    </nav>
  );
}
