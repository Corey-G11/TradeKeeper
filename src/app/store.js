import { configureStore } from '@reduxjs/toolkit';
import tradesReducer, { persistTrades } from '../features/trades/tradesSlice';
import { loadSettings } from '../utils/settings';
import { cloudBackup } from '../utils/backup';

export const store = configureStore({
  reducer: {
    trades: tradesReducer,
  },
});

// Auto-backup: a short debounce after trades change, push to the Docker
// server if a URL is configured and auto-backup is on. Failures are silent
// (file export / manual backup remain the safety net).
let backupTimer;
let lastItems = store.getState().trades.items;
const scheduleAutoBackup = () => {
  const { autoBackup, backupUrl, backupToken } = loadSettings();
  if (!autoBackup || !backupUrl) return;
  clearTimeout(backupTimer);
  backupTimer = setTimeout(() => {
    cloudBackup(backupUrl, backupToken).catch(() => {});
  }, 2500);
};

// Keep trades in localStorage so the journal survives reloads and works
// offline once installed to the home screen.
store.subscribe(() => {
  const items = store.getState().trades.items;
  if (items === lastItems) return;
  lastItems = items;
  persistTrades(items);
  scheduleAutoBackup();
});
