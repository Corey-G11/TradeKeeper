import React, { useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import './BackupModal.css';
import { loadSettings, saveSettings } from '../utils/settings';
import {
  downloadBackup,
  importFromFile,
  cloudBackup,
  cloudRestore,
  readTrades,
} from '../utils/backup';
import { clearAllTrades, persistTrades } from '../features/trades/tradesSlice';

export default function BackupModal({ onClose }) {
  const dispatch = useDispatch();
  const saved = loadSettings();
  const [url, setUrl] = useState(saved.backupUrl || '');
  const [token, setToken] = useState(saved.backupToken || '');
  const [auto, setAuto] = useState(saved.autoBackup !== false);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const tradeCount = readTrades().length;
  const [confirmClear, setConfirmClear] = useState(false);

  const doClear = () => {
    dispatch(clearAllTrades());
    persistTrades([]);
    setConfirmClear(false);
    setStatus({ kind: 'ok', msg: 'All trades cleared.' });
  };

  const persist = (u, t) =>
    saveSettings({ ...loadSettings(), backupUrl: u, backupToken: t });

  const toggleAuto = () => {
    const next = !auto;
    setAuto(next);
    saveSettings({ ...loadSettings(), autoBackup: next });
  };

  const onImport = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      await importFromFile(file);
      setStatus({ kind: 'ok', msg: 'Imported! Reloading…' });
      setTimeout(() => window.location.reload(), 700);
    } catch (err) {
      setStatus({ kind: 'err', msg: String(err.message || err) });
    }
  };

  const doCloud = async (fn, verb) => {
    if (!url) {
      setStatus({ kind: 'err', msg: 'Enter your backup server URL first.' });
      return;
    }
    persist(url, token);
    setBusy(true);
    setStatus({ kind: 'info', msg: `${verb}…` });
    try {
      const res = await fn(url, token);
      if (verb === 'Restoring') {
        setStatus({ kind: 'ok', msg: 'Restored! Reloading…' });
        setTimeout(() => window.location.reload(), 700);
      } else {
        setStatus({
          kind: 'ok',
          msg: `Backed up ${res.count} trade${res.count === 1 ? '' : 's'}.`,
        });
      }
    } catch (err) {
      setStatus({
        kind: 'err',
        msg: `${String(err.message || err)} — check the URL is reachable over HTTPS.`,
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
          <h2>&#9729;&#65038; Backup &amp; Restore</h2>
          <button className="x" onClick={onClose} aria-label="Close">
            &#10005;
          </button>
        </div>

        <div className="sheet-body">
          <div className="bk-note">
            You have <b>{tradeCount}</b> trade{tradeCount === 1 ? '' : 's'} stored
            on this device. Back them up so you never lose them.
          </div>

          <div className="bk-section">
            <div className="bk-title">&#128196; File (no server)</div>
            <div className="bk-actions">
              <button className="btn" onClick={downloadBackup}>
                Export to file
              </button>
              <button className="btn ghost" onClick={() => fileRef.current.click()}>
                Import from file
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                onChange={onImport}
                hidden
              />
            </div>
          </div>

          <div className="bk-section">
            <div className="bk-title">&#128051; Docker backup server</div>
            <label className="field">
              <span>Server URL</span>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-server  (or http://localhost:8080)"
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
            <div className="bk-actions">
              <button
                className="btn"
                disabled={busy}
                onClick={() => doCloud(cloudBackup, 'Backing up')}
              >
                Back up now
              </button>
              <button
                className="btn ghost"
                disabled={busy}
                onClick={() => doCloud(cloudRestore, 'Restoring')}
              >
                Restore
              </button>
            </div>
            <button
              type="button"
              className={`toggle-row ${auto ? 'on' : ''}`}
              onClick={toggleAuto}
            >
              <span>&#9889; Auto-backup after each trade</span>
              <span className={`switch ${auto ? 'on' : ''}`}>
                <i />
              </span>
            </button>
          </div>

          <div className="bk-section bk-danger">
            <div className="bk-title">&#9888;&#65039; Danger zone</div>
            {confirmClear ? (
              <div className="bk-confirm">
                <p>This deletes all trades permanently. Are you sure?</p>
                <div className="bk-actions">
                  <button className="btn danger" onClick={doClear}>Yes, delete everything</button>
                  <button className="btn ghost" onClick={() => setConfirmClear(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <button className="btn danger full" onClick={() => setConfirmClear(true)}>
                &#128465; Clear all trades
              </button>
            )}
          </div>

          {status && <div className={`bk-status ${status.kind}`}>{status.msg}</div>}

          <p className="bk-hint">
            Tip: the hosted app (https) can only reach an <b>https</b> server.
            For a local Docker box, run the app locally too, or expose the
            container over https. File export always works.
          </p>
        </div>
      </div>
    </div>
  );
}
