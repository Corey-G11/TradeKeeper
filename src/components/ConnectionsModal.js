import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import './ConnectionsModal.css';
import { loadSettings, saveSettings } from '../utils/settings';
import { cloudSync } from '../utils/backup';
import { mergeTrades } from '../features/trades/tradesSlice';

export default function ConnectionsModal({ onClose }) {
  const dispatch = useDispatch();
  const saved = loadSettings();
  const [url, setUrl] = useState(saved.backupUrl || '');
  const [token, setToken] = useState(saved.backupToken || '');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null); // { kind, msg }

  const sync = async () => {
    if (!url) {
      setStatus({ kind: 'err', msg: 'Enter your backend URL first.' });
      return;
    }
    saveSettings({ ...loadSettings(), backupUrl: url, backupToken: token });
    setBusy(true);
    setStatus({ kind: 'info', msg: 'Syncing from Tradovate…' });
    try {
      const res = await cloudSync(url, token);
      const trades = res.trades || [];
      dispatch(mergeTrades(trades));
      setStatus({
        kind: 'ok',
        msg: `Synced ${trades.length} trade${trades.length === 1 ? '' : 's'} (${
          res.added ?? 0
        } new). Imported trades are tagged "needs review".`,
      });
    } catch (err) {
      setStatus({
        kind: 'err',
        msg: `${String(err.message || err)} — is the backend deployed and reachable over HTTPS?`,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-head">
          <h2>🔗 Connections</h2>
          <button className="x" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="sheet-body">
          <div className="cx-card">
            <div className="cx-head">
              <span className="cx-logo">📡</span>
              <div>
                <div className="cx-title">Tradovate</div>
                <div className="cx-sub">Auto-import your fills as journaled trades</div>
              </div>
            </div>

            <label className="field">
              <span>Backend URL</span>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://tradekeeper.onrender.com"
                autoCapitalize="off"
                autoCorrect="off"
              />
            </label>
            <label className="field">
              <span>Token (optional)</span>
              <input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="BACKUP_TOKEN, if you set one"
                autoCapitalize="off"
                autoCorrect="off"
              />
            </label>

            <button className="btn full" disabled={busy} onClick={sync}>
              {busy ? 'Syncing…' : 'Sync now'}
            </button>
          </div>

          {status && <div className={`cx-status ${status.kind}`}>{status.msg}</div>}

          <p className="cx-hint">
            Sync pulls your fills from Tradovate (via your backend), rebuilds
            round-trip trades with P&amp;L, and attaches chart candles when a
            data source is configured. Add your confidence &amp; notes after.
            Setup: deploy the backend (<code>render.yaml</code>) with your
            Tradovate credentials in its env vars.
          </p>
        </div>
      </div>
    </div>
  );
}
