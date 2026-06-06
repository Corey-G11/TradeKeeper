# 📈 TradeKeeper

A **gamified day-trading journal** you can install on your phone. Log every
trade, build a streak, earn XP, and learn whether your conviction actually
matches your results.

> Built with React + Redux Toolkit. Your journal is stored **locally on your
> device** (no account, no server) and works offline once installed to your
> home screen.

## ✨ Features

### The journal
Every trade captures the numbers that matter:

- **Market** — Futures or Forex
- **Symbol** & **direction** (long / short)
- **Entry**, **stop loss**, **profit target**
- **Risk : Reward** — calculated automatically from your prices
- **Contracts** (futures) or **lots** (forex)
- **Result** — win / loss / break-even, and **P&L**
- **Confidence** (1–10) and a **followed-my-plan** flag
- **Notes** — setup, emotions, what you'd do differently

### Day-trader-friendly gamification
- 🔥 **Streaks** — keep a daily journaling streak alive (current + longest)
- ⚡ **XP & Levels** — earn XP for logging, with bonuses for notes, rating your
  confidence, and sticking to your plan. Climb from *Paper Hands* to *Smart Money*.
- 🎯 **Confidence Tracker** — a calibration score that tells you whether your
  highest-conviction trades are actually your winners
- 🏅 **Achievements** — unlock badges for discipline, win rate, R:R and streaks

### Stats that matter
Win rate, net P&L, profit factor, expectancy, average R:R, average win/loss,
best/worst trade, and an equity curve.

## 📲 Install on your phone

1. Run the app (see below) and open it on your phone's browser, or deploy the
   production build to any static host.
2. **iOS Safari:** Share → *Add to Home Screen*.
   **Android Chrome:** menu → *Install app / Add to Home Screen*.
3. Launch it from your home screen — it runs full-screen like a native app.

## 🛠️ Develop

```bash
npm install
npm start      # dev server at http://localhost:3000
npm run build  # production build in /build, ready to deploy
npm test       # run tests
```

## 🗂️ Project structure

```
src/
  app/store.js                    Redux store + localStorage persistence
  features/trades/tradesSlice.js  Trade CRUD + R:R auto-calc + seed data
  utils/
    format.js                     money/number/date helpers, R:R math
    stats.js                      win rate, P&L, expectancy, equity curve
    gamification.js               XP, levels, streaks, confidence, badges
  components/
    Dashboard.js                  XP hero, KPIs, confidence ring, badges
    Journal.js / TradeCard.js     filterable list of trades
    TradeForm.js                  bottom-sheet entry/edit form
    Stats.js                      full performance breakdown
    BottomNav.js                  mobile tab bar + log-trade FAB
    Visuals.js                    sparkline & progress-ring SVGs
```
