# Zynth — Product Summary

**Website:** zynth.vercel.app  
**Type:** SaaS Web Application (Trading Intelligence Platform)

---

## What Is Zynth?

Zynth is a professional-grade trading intelligence platform built for retail traders — particularly those trading **gold (XAU/USD) and forex**. It brings together live market data, AI-powered analysis, economic intelligence, and a smart trade journal into a single dashboard. Think of it as a Bloomberg-style terminal designed and priced specifically for individual traders.

---

## Core Features

### 1. Live Market Dashboard
- Embedded live TradingView charts for Gold, Silver, Forex pairs, Indices, Crypto, and US Stocks
- Real-time scrolling price ticker powered by Finnhub WebSocket (XAU/USD, EUR/USD, GBP/USD, BTC, ETH, SPY, NVDA, and more)
- Daily Brief panel with a Macro Score summary, open trading session indicators, and rotating daily trading tips

### 2. Full-Screen Charting
- Multi-asset, multi-timeframe live charts for XAU/USD, EUR/USD, BTC/USD, S&P 500, NASDAQ, DXY, and WTI Oil
- Powered by TradingView widgets

### 3. Economic Intelligence
- Live tracker for all 10 high-impact USD economic indicators: NFP, CPI, PCE, GDP, Unemployment, Retail Sales, ISM, Consumer Confidence, Fed Rate, Jobless Claims
- Each indicator shows trend history chart + **Macro Surprise Score** (actual vs. forecast vs. previous)
- Data sourced directly from the Federal Reserve (FRED API)

### 4. Economic Calendar
- Upcoming and past USD economic events with actual / forecast / previous comparisons
- Filterable by impact level (high / medium / low)

### 5. AI-Powered Trade Journal
- Log trades manually: pair, direction, entry/exit price, lot size, TP/SL, session, strategy, emotional state, notes, and screenshot
- Trade history table with sorting, filtering, and CSV export
- Performance dashboard: win rate, P&L, profit factor, equity curve, per-pair/strategy/session breakdowns
- **Behavioral flag detection**: automatically identifies revenge trading, FOMO, and overtrading patterns

### 6. AI Insights & Reports *(Gemini AI)*
- AI-generated performance reports that identify patterns, blind spots, and a personalized improvement plan
- Single-trade AI analysis with detailed feedback
- Powered by Google Gemini with Google Search grounding for real-time market context

### 7. Trading DNA *(Elite Plan)*
- Monthly AI-generated **trader archetype profile** (e.g. "The Sniper", "The Scalper")
- Radar chart scoring across 6 trading dimensions
- Gives traders a deep psychological and behavioral self-assessment

### 8. MT5 Screenshot OCR Import
- Upload MetaTrader 5 trade history screenshots — the app automatically extracts trades via AI Vision OCR
- Generates performance stats, behavioral analysis, equity charts, heatmaps, and an AI narrative report
- No manual data entry required

### 9. Strategy Backtester
- Built-in backtesting engine supporting: EMA Crossover, RSI, MACD, Bollinger Bands, Support & Resistance Breakout, MA+RSI Combo
- 14 supported symbols, 7 timeframes
- Visualized on interactive charts

### 10. Macro Correlation *(Pro Plan)*
- Automatically correlates a user's trade outcomes with macroeconomic conditions at the time of each trade
- Helps traders understand how economic events impact their specific performance

### 11. Trading Desk — Calculators & Tools
- **Position Size Calculator** — size your trade based on account risk %
- **Pip Value Calculator**
- **Risk/Reward Calculator**
- **Forex Market Hours Tracker** — live session indicator (London, New York, Tokyo, Sydney)

### 12. Pre-Trade Checklist
- Structured questionnaire before entering a trade
- Scores trade readiness and recommends whether to proceed
- History and stats tracked over time

### 13. Financial News Feed
- Real-time financial news from Polygon.io
- Filterable by asset/topic with sentiment badge (Bullish / Bearish / Neutral) and impact level
- Auto-refreshes every 30 seconds

### 14. Zynth AI Assistant
- Floating chat assistant with knowledge base Q&A
- Helps users navigate the platform and understand features
- Rate-limited to 10 messages/hour

---

## Subscription Plans

| Feature | Free | Pro ($1.99/mo*) | Elite ($4.99/mo*) |
|---|---|---|---|
| Journal entries/month | 10 | Unlimited | Unlimited |
| AI trade analyses | 3 | 50/month | Unlimited |
| MT5 screenshot imports | 2 | 35 | Unlimited |
| Macro Correlation | ✗ | ✓ | ✓ |
| Trading DNA profile | ✗ | ✗ | ✓ |
| Custom AI reports | ✗ | ✗ | ✓ |
| API access | ✗ | ✗ | Coming soon |

*Founding member pricing

---

## Authentication & Accounts
- Email/password registration or **Google Sign-In**
- Personalized onboarding (experience level, markets traded, goals)
- Custom avatar with crop tool, or color-coded letter avatar
- Timezone selection, dark/light theme toggle
- Secure password reset via email

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TailwindCSS, TradingView, Chart.js, Recharts |
| Backend | Node.js / Express, SQLite (embedded database) |
| AI | Google Gemini (text analysis + Vision OCR) |
| Market Data | Finnhub (real-time WebSocket), Polygon.io, Alpha Vantage |
| Economic Data | FRED (Federal Reserve API) |
| Auth | JWT + Google OAuth |
| MT5 Import | Python FastAPI microservice + Gemini Vision OCR |

---

## Who Is It For?

- Retail forex and gold traders who want institutional-quality tools at an affordable price
- Traders who want to improve performance through data, journaling, and AI feedback
- Anyone using MetaTrader 5 who wants automated trade analysis without complex setup

---

*Summary prepared March 2026*
