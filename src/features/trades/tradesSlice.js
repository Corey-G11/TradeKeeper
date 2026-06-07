import { createSlice, nanoid } from '@reduxjs/toolkit';
import { computeRR } from '../../utils/format';

const STORAGE_KEY = 'tradekeeper:trades:v1';

const seed = () => {
  const now = Date.now();
  const day = 86400000;
  const mk = (over) => ({
    id: nanoid(),
    createdAt: new Date().toISOString(),
    market: 'futures',
    symbol: 'ES',
    direction: 'long',
    entry: '',
    stopLoss: '',
    profitTarget: '',
    riskReward: null,
    contracts: '',
    lots: '',
    result: 'win',
    pnl: '',
    confidence: 7,
    followedPlan: true,
    notes: '',
    tags: [],
    ...over,
  });
  return [
    mk({
      date: new Date(now - day * 2).toISOString(),
      market: 'futures',
      symbol: 'NQ',
      direction: 'long',
      entry: 18250,
      stopLoss: 18230,
      profitTarget: 18310,
      contracts: 2,
      result: 'win',
      pnl: 240,
      confidence: 8,
      followedPlan: true,
      tags: ['Breakout'],
      notes: 'Clean breakout over premarket high, waited for retest before entry.',
    }),
    mk({
      date: new Date(now - day).toISOString(),
      market: 'forex',
      symbol: 'EUR/USD',
      direction: 'short',
      entry: 1.085,
      stopLoss: 1.0865,
      profitTarget: 1.0815,
      lots: 1,
      result: 'loss',
      pnl: -150,
      confidence: 5,
      followedPlan: false,
      tags: ['News'],
      notes: 'Chased the move, no confirmation. Stopped out. Lesson: wait for the setup.',
    }),
    mk({
      date: new Date(now).toISOString(),
      market: 'futures',
      symbol: 'ES',
      direction: 'long',
      entry: 5400,
      stopLoss: 5396,
      profitTarget: 5412,
      contracts: 1,
      result: 'win',
      pnl: 600,
      confidence: 9,
      followedPlan: true,
      tags: ['A+ Setup', 'Reversal'],
      notes: 'A+ setup at key support, full size, scaled out at target.',
    }),
  ].map((t) => ({ ...t, riskReward: computeRR(t) }));
};

const load = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : seed();
  } catch {
    return seed();
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
  },
});

export const { addTrade, updateTrade, deleteTrade } = tradesSlice.actions;
export const selectTrades = (state) => state.trades.items;
export default tradesSlice.reducer;
