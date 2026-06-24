import { createSlice, nanoid } from '@reduxjs/toolkit';
import { computeRR } from '../../utils/format';

export const STORAGE_KEY = 'tradekeeper:trades:v1';

// A fresh install (or cleared / corrupt storage) starts with an EMPTY
// journal so every stat is computed from the trader's own real trades.
const load = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const persistTrades = (trades) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
  } catch {
    /* storage unavailable — non-fatal */
  }
};

const tradesSlice = createSlice({
  name: 'trades',
  initialState: { items: load() },
  reducers: {
    addTrade: {
      reducer(state, action) {
        state.items.unshift(action.payload);
      },
      prepare(data) {
        const trade = {
          id: nanoid(),
          createdAt: new Date().toISOString(),
          date: data.date || new Date().toISOString(),
          ...data,
        };
        trade.riskReward = computeRR(trade);
        return { payload: trade };
      },
    },
    updateTrade(state, action) {
      const idx = state.items.findIndex((t) => t.id === action.payload.id);
      if (idx !== -1) {
        const merged = { ...state.items[idx], ...action.payload };
        merged.riskReward = computeRR(merged);
        state.items[idx] = merged;
      }
    },
    deleteTrade(state, action) {
      state.items = state.items.filter((t) => t.id !== action.payload);
    },
    // Merge in trades from an external source (e.g. Tradovate), skipping any
    // whose id is already present so re-syncing is idempotent.
    mergeTrades(state, action) {
      const have = new Set(state.items.map((t) => t.id));
      for (const t of action.payload) {
        if (t && t.id && !have.has(t.id)) {
          state.items.unshift({ tags: [], ...t });
          have.add(t.id);
        }
      }
      state.items.sort((a, b) => new Date(b.date) - new Date(a.date));
    },
    clearAllTrades(state) {
      state.items = [];
    },
  },
});

export const { addTrade, updateTrade, deleteTrade, mergeTrades, clearAllTrades } =
  tradesSlice.actions;
export const selectTrades = (state) => state.trades.items;
export default tradesSlice.reducer;
