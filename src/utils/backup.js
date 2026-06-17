// Backup & restore: file export/import (works anywhere) and cloud backup to
// your Dockerized server.

import { loadSettings, saveSettings } from './settings';

const TRADES_KEY = 'tradekeeper:trades:v1';

export const readTrades = () => {
  try {
    return JSON.parse(localStorage.getItem(TRADES_KEY)) || [];
  } catch {
    return [];
  }
};

export const buildBackup = () => ({
  app: 'TradeKeeper',
  version: 1,
  exportedAt: new Date().toISOString(),
  trades: readTrades(),
  settings: loadSettings(),
});

// Write a restored payload into localStorage. Caller should reload the page
// so Redux re-initializes from storage.
export const applyBackup = (data) => {
  if (!data || !Array.isArray(data.trades)) {
    throw new Error('That doesn’t look like a TradeKeeper backup.');
  }
  localStorage.setItem(TRADES_KEY, JSON.stringify(data.trades));
  if (data.settings) saveSettings({ ...loadSettings(), ...data.settings });
};

export const downloadBackup = () => {
  const data = buildBackup();
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tradekeeper-${data.exportedAt.slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export const importFromFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        applyBackup(JSON.parse(reader.result));
        resolve();
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.readAsText(file);
  });

const base = (url) => url.replace(/\/+$/, '');
const headers = (token) => {
  const h = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
};

export const cloudBackup = async (url, token) => {
  const res = await fetch(`${base(url)}/api/backup`, {
    method: 'PUT',
    headers: headers(token),
    body: JSON.stringify({ trades: readTrades(), settings: loadSettings() }),
  });
  if (!res.ok) throw new Error(`Backup failed (${res.status})`);
  return res.json();
};

export const cloudRestore = async (url, token) => {
  const res = await fetch(`${base(url)}/api/backup`, { headers: headers(token) });
  if (!res.ok) throw new Error(`Restore failed (${res.status})`);
  const data = await res.json();
  applyBackup(data);
  return data;
};

// Ask the backend to pull fresh fills from Tradovate and return the
// reconstructed trades (with chart candles attached when available).
export const cloudSync = async (url, token) => {
  const res = await fetch(`${base(url)}/api/sync`, {
    method: 'POST',
    headers: headers(token),
  });
  if (!res.ok) throw new Error(`Sync failed (${res.status})`);
  return res.json(); // { added, total, trades }
};
