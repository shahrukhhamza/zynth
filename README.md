# Zynth - Trading Intelligence Platform

Full-stack trading web app for macro analysis, journaling, execution support, and AI-assisted insights.

## What This Repository Contains

- React frontend (Vite) in client/
- Node.js/Express API backend in server/
- PostgreSQL data layer for users, journal, events, and payments
- Python economic calendar toolkit in economic_calendar/
- Deployment: Render (API + built frontend) with Supabase (Postgres + Storage); see SUPABASE_SETUP.md

## Core Product Areas

- Authentication and onboarding
- Role and plan-based feature gating (free, pro, elite, admin)
- Economic intelligence and macro dashboards
- Economic calendar and event tracking
- Trade journal with analytics and AI insights
- Market news and sentiment/impact tagging
- Trading charts, levels, and tooling
- Payment and subscription workflows
- Admin operations dashboard

## Tech Stack

### Frontend

- React 18 + Vite
- TailwindCSS + custom inline theme system
- Chart.js, Recharts, lightweight-charts
- Axios for API calls

### Backend

- Node.js (ESM) + Express
- JWT auth and role middleware
- Security middleware: Helmet, CORS policy, rate limiting, input sanitization
- ws for realtime streams
- node-cron/background jobs

### Data and Infrastructure

- PostgreSQL
- File storage: local uploads or S3-compatible DigitalOcean Spaces (fallback: Cloudinary)
- Deploy targets: Render + Supabase (Vercel/Railway configs are legacy)

### AI and External Data

- Gemini (analysis, assistant, narrative/report logic)
- Finnhub, FRED, BLS, BEA, Polygon, Twelve Data, optional Trading Economics/FMP/Alpha Vantage/MarketAux

## High-Level Architecture

1. Client app calls REST endpoints under /api/*.
2. Backend routes delegate to domain services.
3. Services combine DB state + external APIs + AI responses.
4. WebSocket channel pushes realtime market updates.
5. Plan middleware and usage counters enforce feature access.

## Current App Navigation (Frontend)

Main views handled in client/src/App.jsx:

- data
- journal
- intelligence
- markets
- calendar
- news
- tools
- help
- charts
- backtesting
- admin
- payment

## Frontend Module Map

### Entry and app shell

- client/src/main.jsx
- client/src/App.jsx
- client/src/index.css

### Contexts

- AuthContext.jsx
- ThemeContext.jsx
- UpgradeContext.jsx
- ConfirmContext.jsx
- ToastContext.jsx
- TimezoneContext.jsx

### Hooks

- usePlan.js
- usePlanGate.js
- useUpgradeIntelligence.js
- useAISoftTrigger.js
- useJournalSoftTrigger.js

### Services

- api.js
- journalApi.js
- calendarApi.js
- dataApi.js
- finnhubWs.js
- track.js

### Component Areas

- Marketing and auth: LandingPage, Hero, FeaturesBento, PricingPage, LoginPage, SignupPage, ForgotPasswordPage, ResetPasswordPage
- Product shell: Header, Sidebar, BrandLogo, RightPanel
- Trading and intelligence: EconomicDashboard, EconomicIntelligence, EconomicCalendar, TradingDesk, TradeJournal, MacroCorrelation, TradingDNA, ChartsPage, LiveChart
- Journal submodules (client/src/components/journal): TradeEntryForm, TradeHistoryTable, TradeDetailPage, PerformanceDashboard, AiInsightsPanel, JournalCoach, UsageBanner, JournalUpgradePrompt, TradeContextReport
- AI insights suite (client/src/components/ai-insights): AIInsightsDashboard, DataTrustPanel, MarketValidationPanel, MarketNarrativePanel, TradeInsightPanel, MultiAssetImpact, and related sections
- Pricing and UI system: pricing/PricingPlanSelector, ui/Button/Card/Badge/IconContainer/Modal
- Utilities and support: ZynthAssistant, HelpCenter, ServicesPage, SettingsModal, ProfileModal, calculators and policy pages

## Backend Module Map

### Entry and middleware

- server/server.js
- server/middleware/authMiddleware.js
- server/middleware/errorHandler.js

### Database access

- server/db/users.js
- server/db/events.js
- server/db/payments.js
- server/services/journalDb.js

### Route modules (complete)

- server/routes/admin.js
- server/routes/analysis.js
- server/routes/assistant.js
- server/routes/auth.js
- server/routes/calendar.js
- server/routes/charts.js
- server/routes/checklist.js
- server/routes/data.js
- server/routes/economic.js
- server/routes/events.js
- server/routes/finnhub.js
- server/routes/journal.js
- server/routes/levels.js
- server/routes/news.js
- server/routes/payment.js
- server/routes/payments.js
- server/routes/trading.js

### Service modules (complete)

- server/services/analyticsService.js
- server/services/apiDataService.js
- server/services/autoReleaseService.js
- server/services/blsBeaService.js
- server/services/dataService.js
- server/services/economicCalendarService.js
- server/services/economicIntelligenceService.js
- server/services/economicValidationService.js
- server/services/emailService.js
- server/services/fileStorageService.js
- server/services/finnhubService.js
- server/services/fredService.js
- server/services/freeApiService.js
- server/services/geminiAnalysisService.js
- server/services/geminiWebSearchService.js
- server/services/journalAiService.js
- server/services/journalDb.js
- server/services/macroAlignmentService.js
- server/services/macroImpactEngine.js
- server/services/marketNarrativeService.js
- server/services/polygonService.js
- server/services/tradingCalculatorService.js
- server/services/webScraperService.js

### Backend config and utilities

- server/config/economicData.js
- server/config/storagePaths.js
- server/utils/apiKeyManager.js
- server/utils/geminiCounter.js

## Python Economic Calendar Toolkit

Directory: economic_calendar/

- economic_calendar.py
- data_fetcher.py
- gemini_reasoning.py
- validator.py
- cache.py
- config.py
- terminal_ui.py
- requirements.txt
- cache/, logs/, output/

Purpose:

- Multi-source economic event retrieval
- Validation and caching
- Optional AI-assisted reasoning and terminal UI workflow

## Plans, Limits, and Access Model

Current plan logic is driven by client/src/config/planFeatures.js and hooks:

- Free
  - Max journal entries: 5 (lifetime)
  - AI analyses: 2 (lifetime)
- Pro
  - Journal: unlimited
  - AI analyses: 50 per month
- Elite
  - Journal: unlimited
  - AI analyses: unlimited
  - Additional advanced features (Trading DNA, AI reports, strategy optimization, priority support)

Admin users bypass plan restrictions.

## API and Security Model

### API base paths

- /api/auth
- /api/admin
- /api/news
- /api/data
- /api/calendar
- /api/economic
- /api/journal
- /api/checklist
- /api/analysis
- /api/assistant
- /api/charts
- /api/levels
- /api/events
- /api/payment
- /api/payments
- /api/trading

### Security and hardening

- JWT validation required on protected endpoints
- Role guards (admin/plan checks)
- Helmet headers with CSP/HSTS
- CORS allowlist + preview-domain handling
- Rate limits (global/auth/session/AI)
- Request sanitization and centralized error handling

## Realtime, Scheduling, and Background Tasks

- WebSocket server is initialized in server/server.js
- Finnhub integrations support realtime market updates
- Auto-release/economic jobs run through service scheduler logic
- API key rotation utility supports multi-key operation for providers

## Local Development

### Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL database

### Install

From repository root:

```bash
npm run install-all
```

### Run

Recommended:

```bash
npm run dev
```

Windows helper scripts:

- start.bat
- start.ps1
- start-terminal.bat

### Build frontend

```bash
npm run build
```

### Run backend tests

```bash
cd server
npm test
```

## Root Scripts

From package.json at repository root:

- npm run install-all
- npm run prestart
- npm run dev
- npm run server
- npm run client
- npm run build
- npm run start

## Environment Variables

Start from .env.example, then extend as needed.

### Required for baseline app

- JWT_SECRET
- DATABASE_URL
- CLIENT_URL
- PORT (or default 5000)
- POLYGON_API_KEY

### Common production/feature vars

- FINNHUB_API_KEY
- FRED_API_KEY
- TWELVE_DATA_API_KEY
- GEMINI_API_KEY
- GOOGLE_CLIENT_ID
- BLS_API_KEY
- BEA_API_KEY
- RESEND_API_KEY or BREVO_API_KEY
- USE_GEMINI_AI

### Optional scaling and integrations

- POLYGON_API_KEY_2 (and additional key variants used by key manager)
- GEMINI_API_KEY_2 / GEMINI_API_KEY_3
- CLIENT_URL1 / CLIENT_ORIGIN / FRONTEND_URL / VERCEL_URL
- UPLOADS_DIR
- DO_SPACES_ACCESS / DO_SPACES_PASS / DO_SPACES_ENDPOINT / DO_SPACES_BUCKET / DO_SPACES_CDN / DO_SPACES_REGION
- CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET / CLOUDINARY_AVATARS_FOLDER / CLOUDINARY_JOURNAL_FOLDER
- TRADING_ECONOMICS_API_KEY / TRADING_ECONOMICS_KEY / TRADING_ECONOMICS_FORECAST_URL
- FMP_API_KEY / FMP_API_KEY1
- ALPHA_VANTAGE_KEY
- MARKETAUX_API_KEY
- ECON_DEBUG
- HOST

## Deployment

### Render (recommended)

- Uses render.yaml for Blueprint-based deploys
- Single Render web service: builds client/ and runs server/ behind one URL
- Database and file storage run on Supabase (free tier): see [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for the full step-by-step guide
- Set DATABASE_URL (Supabase Session pooler string), SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the Render dashboard
- No separate frontend URL is required
- The frontend uses same-origin API calls in production

Migration notes from Railway:

- Railway config is still present in railway.toml for rollback safety
- Previous hardcoded Railway API fallback has been removed from frontend runtime config
- If login still fails after deploy, check Render service logs for DATABASE_URL or GOOGLE_CLIENT_ID errors first

### Frontend (Vercel)

- Uses vercel.json
- Serves the Vite build from client/

### Backend (Railway)

- Uses railway.toml
- Runs Node server in server/
- Expects production env vars + database

### Process manager option

- ecosystem.config.cjs for PM2-based process execution

## Workspace Documentation Index

This repository also includes focused operational docs:

- START_HERE.md
- QUICKSTART.md
- ARCHITECTURE.md
- ECONOMIC_DATA_GUIDE.md
- ECONOMIC_INTELLIGENCE_SETUP.md
- FREE_API_SETUP.md
- API_KEY_ROTATION.md
- REFRESH_TIMINGS.md
- ZYNTH_SUMMARY.md

Use these with this README for deep operational playbooks.

## Notes

- This README is the current authoritative overview of modules, setup, and architecture.
- Temporary local debug scripts in repo root are not part of runtime architecture.

