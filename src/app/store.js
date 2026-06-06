import { configureStore } from '@reduxjs/toolkit';
import tradesReducer, { persistTrades } from '../features/trades/tradesSlice';

export const store = configureStore({
  reducer: {
    trades: tradesReducer,
  },
});

// Keep trades in localStorage so the journal survives reloads and works
// offline once installed to the home screen.
store.subscribe(() => {
  persistTrades(store.getState().trades.items);
});
