import React from 'react';
import { useSheetChrome } from '../utils/useSheetChrome';

// Shared modal sheet scaffold: backdrop, drag handle, header + close button.
// Owns Escape-to-close and background scroll-lock via useSheetChrome so every
// modal inherits them. Sheet styles live in TradeForm.css (imported app-wide).
export default function Sheet({ title, onClose, className = '', children }) {
  useSheetChrome(onClose);
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className={`sheet ${className}`.trim()}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="sheet-handle" />
        <div className="sheet-head">
          <h2>{title}</h2>
          <button className="x" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
