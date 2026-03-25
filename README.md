# Zynth — Trading Intelligence Platform

> A professional-grade, full-stack trading SaaS for retail traders. Institutional-level macro analysis, AI-powered trade journaling, and real-time market intelligence — built for gold, forex, and commodity traders.

![Status](https://img.shields.io/badge/Status-Production%20Ready-success)
![Stack](https://img.shields.io/badge/Stack-React%20%2B%20Node.js%20%2B%20Python-blue)
![Database](https://img.shields.io/badge/DB-PostgreSQL-336791?logo=postgresql)
![Deployed on](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel)
![Deployed on](https://img.shields.io/badge/Backend-Railway-purple)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [External API Integrations](#external-api-integrations)
- [Authentication & Plan Tiers](#authentication--plan-tiers)
- [Deployment](#deployment)

---

## Overview

**Zynth** is a trading intelligence SaaS platform targeting retail traders who trade gold (XAU/USD), forex, and commodities. The platform bridges the gap between institutional-grade macro analysis and everyday retail trading by providing:

- **Live market feeds** with WebSocket-powered real-time price tickers
- **Economic intelligence** — 10 high-impact US indicators with surprise scoring and gold impact classification
- **AI-powered trade journaling** with behavioral analytics, emotion tracking, and Gemini-generated performance reports
- **Macro correlation analysis** — retroactively correlate your trades with macro conditions at the time of each trade
- **Strategy backtester** with 6 built-in strategies across 14 symbols and 7 timeframes
- **Trading DNA profiles** — monthly AI-generated trader archetype powered by Gemini

---

## Features

### Live Market Dashboard
- Real-time WebSocket price ticker (Finnhub) for XAU/USD, EUR/USD, BTC, ETH, XRP, BNB, SOL, SPY, GLD, AAPL, TSLA, MSFT, AMZN, NVDA, GOOGL
- Live session indicators (Asian, London, New York, Sydney)
- Daily macro score summary
- Daily trading tips panel

### Economic Intelligence Dashboard
Tracks 10 high-impact USD indicators in real time:

| Indicator | Source |
|-----------|--------|
| Non-Farm Payrolls (NFP) | FRED / BLS |
| CPI & Core CPI | FRED / BLS |
| Unemployment Rate | FRED |
| Federal Funds Rate | FRED |
| GDP | FRED / BEA |
| Core PCE | FRED / BEA |
| Initial Jobless Claims | FRED |
| Retail Sales | FRED |
| ISM Manufacturing | FRED |
| Consumer Confidence | FRED |

Each indicator includes:
- **Surprise score** (Actual vs. forecast proxy = trailing 3-month average)
- **Gold impact rating** (Bullish / Bearish / Neutral for XAU/USD)
- **12-month historical chart**

### Economic Calendar
- Upcoming and past economic events with actual / forecast / previous values
- Filter by impact level (High / Medium / Low), currency, and date range
- Powered by Finnhub economic calendar API; auto-refreshes every 15 minutes

### AI-Powered Trade Journal
- Log trades manually: pair, direction, lot size, entry/exit, TP/SL, outcome, session, strategy, emotion, notes, screenshots
- Full analytics: win rate, P&L, profit factor, expectancy, risk:reward, equity curve
- P&L breakdown by pair, strategy, and session
- Emotion vs. outcome correlation
- Auto-detected behavioral flags: revenge trading, FOMO trades, overtrading days
- CSV export
- Gem AI analysis per trade (rate-limited by plan)
- Monthly AI performance reports

### Macro Correlation Analysis *(Pro+)*
- Retroactively scores each historical trade against the macro environment at trade time
- Weighted indicator scoring: CPI (2.0×), NFP (1.8×), etc.
- Identifies trades taken in favorable vs. unfavorable macro conditions

### Trading DNA Profile *(Elite)*
- Monthly AI-generated trader archetype (e.g., "The Sniper", "The Scalper")
- Radar chart across 6 trading dimensions
- Psychological & behavioral self-assessment

### Pre-Trade Checklist
- Structured questionnaire before entering a trade
- Readiness score (0–100) with Proceed / Wait recommendation
- History tracking & correlation with trade outcomes

### Strategy Backtester
- 6 built-in strategies: EMA Crossover, RSI, MACD, Bollinger Bands, S/R Breakout, MA+RSI Combo
- 14 symbols, 7 timeframes (1m → 1w)
- Historical data via Twelve Data API

### Financial News Feed
- Real-time news from Polygon.io — auto-refreshes every 30 seconds
- Filters: keyword, date range, impact level, sentiment
- Automatic sentiment classification (Bullish / Bearish / Neutral)

### Live Charts
- Embedded TradingView charts for major forex, commodities, indices, and crypto
- Full TradingView drawing tools, alerts, and indicators

### Zynth AI Assistant
- Floating chatbot with 45+ Q&A pairs covering all platform features
- Instant responses (no Gemini call); rate-limited to 10 messages/hour

### Calculators & Tools
- Position Size Calculator
- Pip Value Calculator
- Risk/Reward Calculator
- Forex Market Hours Tracker

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite 5, TailwindCSS 3, Axios, Chart.js, Recharts, Lightweight-charts |
| **Backend** | Node.js (ESM), Express 4, JWT auth, Helmet, express-rate-limit, ws (WebSocket), node-cron |
| **Database** | PostgreSQL |
| **Email** | Resend |
| **File Uploads** | Multer (avatars, journal screenshots) |
| **Caching** | node-cache (server-side), localStorage (client-side) |
| **Auth** | JWT (7-day), bcryptjs, Google OAuth2 |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   React Frontend                    │
│         (Vercel CDN — zynth.codes)                  │
│  Components → Contexts → Hooks → Services           │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS / REST
                     │ WebSocket (/ws/market)
┌────────────────────▼────────────────────────────────┐
│              Express Backend (Railway)               │
│  Routes → Services → PostgreSQL                     │
│                                                     │
│  External API integrations:                         │
│   Finnhub · FRED · BLS · BEA · Polygon              │
│   Twelve Data · Gemini AI · Resend                  │
└────────────────────────────┬───────────────────────────┘
                             │ PostgreSQL
              ┌──────────────▼──────────────────────────┐
              │          PostgreSQL Database             │
              │          (Railway managed)               │
              │  trades · users · journals · checklists  │
              └─────────────────────────────────────────┘
```

### Data Flows

**Live Price Data**
```
Finnhub WebSocket → finnhubService.js → broadcast → /ws/market → React ticker
```

**Economic Indicators**
```
FRED / BLS / BEA APIs → economicIntelligenceService → surprise score → UI cards
```

**Trade AI Analysis**
```
Trade + macro context → journalAiService → Gemini → insight → saved to DB → UI
```

---

## Project Structure

```
zynth/
├── client/                        # React frontend (Vite)
│   └── src/
│       ├── components/            # All page & UI components
│       │   ├── LandingPage.jsx         # Marketing landing page
│       │   ├── Hero.jsx / FeaturesBento.jsx / Pricing.jsx  # Landing sections
│       │   ├── LoginPage.jsx / SignupPage.jsx  # Auth pages
│       │   ├── ForgotPasswordPage.jsx / ResetPasswordPage.jsx
│       │   ├── OnboardingFlow.jsx      # New user onboarding
│       │   ├── TradingDesk.jsx         # Live dashboard
│       │   ├── EconomicDashboard.jsx   # Macro indicators
│       │   ├── EconomicIntelligence.jsx  # Intelligence cards
│       │   ├── EconomicCalendar.jsx    # Calendar of events
│       │   ├── TradeJournal.jsx        # Trade logger (journal/)
│       │   ├── MacroCorrelation.jsx    # Macro-trade analysis
│       │   ├── BacktestEngine.jsx      # Backtester
│       │   ├── TradingDNA.jsx          # Trader archetype
│       │   ├── ChartsPage.jsx / LiveChart.jsx  # Charts
│       │   ├── LiveMarketTicker.jsx    # Real-time price ticker
│       │   ├── NewsFeed.jsx / NewsCard.jsx  # News feed
│       │   ├── DailyBrief.jsx          # Daily macro summary
│       │   ├── PreTradeChecklist.jsx   # Pre-trade readiness
│       │   ├── ZynthAssistant.jsx      # Floating AI chatbot
│       │   ├── AdminDashboard.jsx      # Admin panel
│       │   ├── ProfileModal.jsx / SettingsModal.jsx  # User settings
│       │   ├── UpgradeModal.jsx / PlanBadge.jsx / PlanGateBanner.jsx
│       │   ├── HelpCenter.jsx / ServicesPage.jsx
│       │   ├── PrivacyPolicy.jsx / TermsOfService.jsx / RefundPolicy.jsx / ServicePolicy.jsx
│       │   ├── Header.jsx / Sidebar.jsx / BrandLogo.jsx
│       │   ├── DataChart.jsx / LoadingSkeleton.jsx / RightPanel.jsx
│       │   └── ImageCropModal.jsx      # Avatar crop utility
│       ├── contexts/              # ThemeContext, AuthContext, TimezoneContext
│       ├── hooks/                 # usePlanGate, useMarketData, ...
│       └── services/              # API call wrappers (api, journalApi, ...)
│
├── server/                        # Node.js backend (Express ESM)
│   ├── server.js                  # Entry point, WebSocket setup
│   ├── routes/                    # 13 route files
│   │   ├── auth.js                # Register, login, OAuth, password reset
│   │   ├── journal.js             # Trades CRUD, analytics, AI analysis
│   │   ├── economic.js            # 10 macro indicator endpoints
│   │   ├── calendar.js            # Economic calendar
│   │   ├── analysis.js            # Macro correlation, Trading DNA
│   │   ├── charts.js              # Historical candle data
│   │   ├── news.js                # Financial news feed
│   │   ├── finnhub.js             # Real-time market data
│   │   ├── data.js                # Gold, forex, equity prices
│   │   ├── checklist.js           # Pre-trade checklist
│   │   ├── assistant.js           # AI assistant Q&A
│   │   ├── admin.js               # Admin user management
│   │   └── levels.js              # Support/resistance levels storage
│   ├── services/                  # 19 service files
│   │   ├── journalDb.js           # All PostgreSQL queries
│   │   ├── finnhubService.js      # WebSocket + REST Finnhub integration
│   │   ├── economicIntelligenceService.js  # Surprise scoring engine
│   │   ├── fredService.js         # FRED API
│   │   ├── blsBeaService.js       # BLS + BEA APIs
│   │   ├── polygonService.js      # News feed (auto-rotating API keys)
│   │   ├── geminiAnalysisService.js        # Gemini AI analysis
│   │   ├── journalAiService.js    # AI reports & Trading DNA
│   │   ├── macroAlignmentService.js        # Retroactive macro scoring
│   │   ├── analyticsService.js    # Trade metrics calculation
│   │   ├── emailService.js        # Resend email templates
│   │   └── ...
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT verify, requirePro, requireElite, requireAdmin
│   │   └── errorHandler.js
│   └── db/users.js                # User table queries
│
├── economic_calendar/             # Python economic calendar module
│   ├── economic_calendar.py       # Main calendar logic
│   ├── data_fetcher.py            # Multi-source data fetching
│   ├── gemini_reasoning.py        # AI reasoning on events
│   ├── cache.py                   # Cache management
│   └── terminal_ui.py             # CLI display
│
├── package.json                   # Root: concurrently scripts
├── vercel.json                    # Frontend deployment config
├── railway.toml                   # Backend deployment config
├── ecosystem.config.cjs           # PM2 process config
└── start.ps1 / start.bat          # Local dev launchers
```

---

## Getting Started

### Prerequisites
- **Node.js** v18+
- **npm** v9+
- **PostgreSQL** database (local or Railway)

### 1. Clone the repository

```bash
git clone https://github.com/shahrukhhamza/AI-DASHBOARD.git
cd AI-DASHBOARD
```

### 2. Install dependencies

```bash
# Root + server
npm install

# Client
cd client && npm install && cd ..
```

### 3. Configure environment variables

Copy `.env.example` (or create `.env` from the table below) in the project root and in `server/`.

### 4. Run in development

```bash
# Starts server (port 5000) and client (port 5173) concurrently
npm run dev
```

Or use the Windows launchers:
```powershell
.\start.ps1
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | JWT signing secret |
| `API_SECRET` | ✅ | Internal API secret |
| `PORT` | ✅ | Backend port (default `5000`) |
| `CLIENT_URL` | ✅ | Frontend URL (for CORS) |
| `POLYGON_API_KEY` | ✅ | Polygon.io news API key |
| `POLYGON_API_KEY_2` | ⚠️ | Second key for auto-rotation |
| `FINNHUB_API_KEY` | ✅ | Finnhub real-time market data |
| `FRED_API_KEY` | ✅ | FRED economic data |
| `TWELVE_DATA_API_KEY` | ✅ | Historical chart data / backtester |
| `GEMINI_API_KEY` | ✅ | Primary Google Gemini API key |
| `GEMINI_API_KEY_2..5` | ⚠️ | Additional Gemini keys (rotation) |
| `RESEND_API_KEY` | ✅ | Email service (password reset) |
| `GOOGLE_CLIENT_ID` | ⚠️ | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | ⚠️ | Google OAuth client secret |
| `BLS_API_KEY` | ⚠️ | Bureau of Labor Statistics |
| `BEA_API_KEY` | ⚠️ | Bureau of Economic Analysis |

---

## External API Integrations

| API | Purpose | Docs |
|-----|---------|------|
| **Finnhub** | Real-time WebSocket prices + economic calendar | finnhub.io |
| **FRED** | US economic indicator time-series (12 series) | fred.stlouisfed.org |
| **BLS** | Labor statistics (payroll, CPI) | bls.gov |
| **BEA** | GDP, PCE quarterly data | bea.gov |
| **Polygon.io** | Financial news with sentiment | polygon.io |
| **Twelve Data** | Historical OHLCV candles (backtester) | twelvedata.com |
| **Google Gemini** | AI trade analysis, OCR vision, DNA reports | ai.google.dev |
| **Resend** | Transactional email | resend.com |
| **Google OAuth2** | Social login | cloud.google.com |
| **Yahoo Finance** | Supplemental price data (no key needed) | — |

---

## Authentication & Plan Tiers

All protected routes require a JWT bearer token. Middleware enforces plan-level access.

| Feature | Free | Pro ($1.99/mo) | Elite ($4.99/mo) |
|---------|------|----------------|-------------------|
| Journal entries/month | 10 | Unlimited | Unlimited |
| AI trade analyses/month | 3 | 50 | Unlimited |
| Macro correlation | ✗ | ✓ | ✓ |
| Live market data | ✗ | ✓ | ✓ |
| Trading DNA profile | ✗ | ✗ | ✓ |
| Custom reports | ✗ | ✗ | ✓ |
| Admin panel | — | — | admin role only |

**Rate limits**
- Global: 500 requests / 15 min per IP
- Auth: 10 attempts / 15 min
- AI requests: 20 / hour per user

---

## Deployment

### Frontend → Vercel
- Auto-deploys from `main` branch
- Config: [`vercel.json`](vercel.json)
- `/api/*` requests are rewritten to the Railway backend
- SPA fallback: all routes serve `index.html`

### Backend → Railway
- Start command: `node server/server.js`
- Config: [`railway.toml`](railway.toml)
- Managed PostgreSQL add-on

### Process Manager (PM2)
```bash
pm2 start ecosystem.config.cjs
```

---

## Economic Calendar Python Module

The `economic_calendar/` directory is a standalone Python CLI tool that:
- Fetches upcoming economic events from multiple sources
- Uses Gemini AI to reason about likely market impact
- Provides a rich terminal UI display
- Maintains a local cache for offline access

```bash
cd economic_calendar
python economic_calendar.py
```

---

*Built with React, Node.js, Python, and Google Gemini AI.*

### Installation

1. **Clone or navigate to the project directory**
   ```powershell
   cd "d:\US DATA"
   ```

2. **Install all dependencies (root, server, and client)**
   ```powershell
   npm run install-all
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```powershell
   Copy-Item .env.example .env
   ```

   Edit the `.env` file and add your Polygon.io API key:
   ```env
   POLYGON_API_KEY=your_actual_api_key_here
   PORT=5000
   CLIENT_URL=http://localhost:5173
   ```

### Running the Application

#### Option 1: Run Both (Recommended)
```powershell
npm run dev
```
This starts both the backend server (port 5000) and frontend dev server (port 5173).

#### Option 2: Run Separately

**Terminal 1 - Backend:**
```powershell
npm run server
```

**Terminal 2 - Frontend:**
```powershell
npm run client
```

### Access the Dashboard

Open your browser and navigate to:
```
http://localhost:5173
```

The API will be running on:
```
http://localhost:5000
```

## 📡 API Endpoints

### Health Check
```
GET /api/health
```
Returns server status.

### Get News
```
GET /api/news
```

**Query Parameters:**
- `keyword` (optional) - Filter by keyword
- `startDate` (optional) - Start date (ISO format)
- `endDate` (optional) - End date (ISO format)
- `limit` (optional) - Number of articles (default: 50)

**Example:**
```
GET /api/news?keyword=gold&limit=20
```

### Get News by ID
```
GET /api/news/:id
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `POLYGON_API_KEY` | Your Polygon.io API key | Required |
| `PORT` | Backend server port | 5000 |
| `CLIENT_URL` | Frontend URL for CORS | http://localhost:5173 |

### Filtering Keywords

The dashboard automatically filters news for these topics:
- Gold, XAUUSD, precious metals
- Inflation, interest rates, Federal Reserve
- USD, dollar, treasury, bonds
- Geopolitics, war, conflict, sanctions
- Central bank, monetary policy, recession
- Economic data (CPI, PPI, GDP)

Edit `server/services/polygonService.js` to customize keywords.

## 🎯 Features Breakdown

### Sentiment Analysis
The system analyzes news headlines and descriptions using keyword matching:
- **Bullish**: surge, rally, soar, gain, inflation surge, rate hike, weak dollar
- **Bearish**: fall, drop, decline, weak, strong dollar, rate cut
- **Neutral**: No strong indicators

### Impact Classification
- **High**: Federal Reserve, interest rates, inflation, CPI, GDP, war, crisis
- **Medium**: Single high-impact term
- **Low**: General news

## 🛠️ Development

### Backend Development
```powershell
cd server
npm run dev
```
Uses nodemon for auto-restart on file changes.

### Frontend Development
```powershell
cd client
npm run dev
```
Vite provides hot module replacement (HMR).

### Building for Production
```powershell
npm run build
```
Builds the frontend to `client/dist/`.

## 📦 Deployment

### Backend
1. Set environment variables on your hosting platform
2. Install dependencies: `npm install --production`
3. Start server: `npm start`

### Frontend
1. Build: `npm run build`
2. Serve `client/dist/` with any static hosting service

## 🔐 Security

- ✅ API keys stored in `.env` (never committed)
- ✅ CORS configured for specific origins
- ✅ No sensitive data exposed to frontend
- ✅ Environment variables isolated from client

## 🐛 Troubleshooting

### Issue: "Failed to fetch news"
**Solution**: Check your Polygon.io API key in `.env` file.

### Issue: CORS errors
**Solution**: Ensure `CLIENT_URL` in `.env` matches your frontend URL.

### Issue: Port already in use
**Solution**: Change `PORT` in `.env` or kill the process using the port.

### Issue: No news showing
**Solution**: 
1. Verify API key is valid
2. Check server logs for errors
3. Ensure you have internet connectivity

## 📝 API Key Setup

1. Go to https://polygon.io/
2. Sign up for a free account
3. Navigate to Dashboard → API Keys
4. Copy your API key
5. Paste it in `.env` file

**Free tier limitations**: 5 API calls per minute. The app caches responses for 30 seconds to stay within limits.

## 🎨 Customization

### Change Theme Colors
Edit `client/tailwind.config.js`:
```javascript
colors: {
  terminal: {
    bg: '#0a0e27',      // Main background
    surface: '#131829',  // Card background
    accent: '#3b82f6',   // Accent color
    // ... more colors
  }
}
```

### Adjust Auto-Refresh Interval
Edit `client/src/App.jsx`:
```javascript
// Change 30000 (30 seconds) to desired milliseconds
const interval = setInterval(() => {
  loadNews(false);
}, 30000);
```

### Modify News Filters
Edit `server/services/polygonService.js` to add/remove keywords.

## 📊 Sample Data Structure

### News Article Object
```javascript
{
  id: "article_123",
  title: "Gold Prices Surge on Inflation Fears",
  author: "John Doe",
  source: "Reuters",
  publishedAt: "2026-03-07T10:30:00Z",
  url: "https://...",
  imageUrl: "https://...",
  description: "Article description...",
  keywords: ["gold", "inflation"],
  sentiment: "Bullish",
  impactLevel: "High",
  ticker: ["GC=F", "XAUUSD"]
}
```

## 🤝 Contributing

This is a production-ready application. To extend:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use for personal or commercial projects.

## 🙏 Credits

- **Polygon.io** - Financial data API
- **Lucide** - Icon library
- **TailwindCSS** - Styling framework

## 📞 Support

For issues or questions:
1. Check the Troubleshooting section
2. Review Polygon.io API documentation
3. Check browser console for errors

---

**Built with ☕ for traders and financial analysts**

**Last Updated**: March 7, 2026
