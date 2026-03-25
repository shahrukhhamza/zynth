/**
 * assistant.js - Zynth Assistant chatbot route
 *
 * POST /api/assistant/chat
 *   Body: { message: string, history: [] }
 *   Returns: { reply }
 *
 * Fast path: static keyword KB (instant, no API call)
 * AI path: Gemini 1.5 Flash with full Zynth knowledge (2-4s, cached)
 * Rate limit: 30 messages per user per hour (in-memory)
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Rate limit store { userId: [timestamp, ...] }
const rateLimitStore = new Map();
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60 * 60 * 1000;

// Gemini response cache — key: normalised message, value: { reply, ts }
const geminiCache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function cacheKey(msg) {
  // Normalise: lowercase, strip punctuation, collapse whitespace
  return msg.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

function checkRateLimit(userId) {
  const now = Date.now();
  const timestamps = (rateLimitStore.get(userId) || []).filter(t => now - t < RATE_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT) return false;
  timestamps.push(now);
  rateLimitStore.set(userId, timestamps);
  return true;
}

// Complete static knowledge base
const QA = [
  // GETTING STARTED
  { q: ['get started', 'how to start', 'beginning', 'new user', 'first time', 'what do i do first', 'where do i start'],
    a: 'Welcome to Zynth! Start by going to Trade Journal in the sidebar and logging your first trade. Then explore the Economic Calendar and Dashboard for live market data. Check AI Insights after logging 5+ trades for personalized coaching.' },

  // TRADE JOURNAL - LOGGING
  { q: ['how do i log', 'how to log', 'log a trade', 'add a trade', 'record a trade', 'new trade', 'how to journal', 'how do i journal', 'journal a trade', 'enter a trade', 'save a trade', 'create a trade', 'trade journal', 'log trade', 'logging trade', 'logging a trade'],
    a: 'To log a trade: click Trade Journal in the sidebar -> Log Trade tab -> select your pair (e.g. XAU/USD) -> choose BUY or SELL -> enter entry price, exit price, lot size -> select outcome (WIN/LOSS) -> click Save Trade. You can also add a screenshot, emotional state and notes.' },

  { q: ['screenshot trade', 'attach screenshot', 'add screenshot', 'upload screenshot to trade', 'trade image', 'trade photo'],
    a: 'To attach a screenshot to a trade: in the Log Trade form scroll down to the Screenshot section -> drag and drop your image or click to browse -> the image will be saved with your trade and visible in Trade History.' },

  { q: ['emotional state', 'emotion', 'feeling', 'psychology trade', 'mood'],
    a: 'When logging a trade you can select your emotional state: Calm, Confident, Anxious, Frustrated, Greedy, Fearful, Neutral, Excited, or Revenge. Zynth tracks which emotions lead to wins vs losses in your Performance analytics.' },

  { q: ['strategy', 'trading strategy', 'which strategy', 'strategy tag'],
    a: 'In the Log Trade form select your strategy from 8 presets (Breakout, Trend Follow, Scalping, etc) or type a custom one. Your win rate per strategy is tracked in the Performance tab so you know which strategies work best for you.' },

  { q: ['session', 'trading session', 'asian session', 'london session', 'new york session', 'which session'],
    a: 'When logging a trade select the session you traded in: Asian, London, New York, or London-NY Overlap. Zynth tracks your performance per session so you can find your strongest trading window.' },

  { q: ['lot size', 'position size', 'how many lots', 'units'],
    a: 'Enter your lot size in the Position Size field when logging a trade. Use the Position Size Calculator in the Trading Desk sidebar item to calculate the right lot size based on your risk percentage.' },

  // TRADE JOURNAL - HISTORY
  { q: ['view trades', 'see trades', 'trade history', 'past trades', 'my trades', 'previous trades', 'all trades'],
    a: 'View all your trades in Trade Journal -> Trade History tab. Trades are shown in a table with date, pair, direction, outcome and PnL. Click any trade row to see full details including your notes and screenshot.' },

  { q: ['delete trade', 'remove trade', 'edit trade', 'change trade', 'modify trade'],
    a: 'To delete a trade: Trade Journal -> Trade History -> click the trade row -> in the detail modal click the trash/delete icon -> confirm. Note: editing a trade is not yet supported, delete and re-log if needed.' },

  { q: ['search trade', 'filter trade', 'find trade', 'sort trade'],
    a: 'In Trade History you can filter trades by pair, outcome (WIN/LOSS), strategy, date range and session using the filter bar at the top. You can also sort by date, PnL or other columns.' },

  { q: ['export trades', 'download trades', 'csv', 'export journal'],
    a: 'To export your trades: Trade Journal -> Trade History -> look for the Export CSV button in the filter bar. This downloads all your trades as a spreadsheet.' },

  // PERFORMANCE
  { q: ['performance', 'analytics', 'statistics', 'stats', 'my stats', 'trading stats', 'understand analytics', 'view analytics', 'how analytics', 'analyze performance'],
    a: 'Your performance analytics are in Trade Journal -> Performance tab. You will see: Win Rate, Total PnL, Profit Factor, Average Win/Loss, Risk:Reward ratio, Expectancy, Equity Curve chart, P&L by pair, Strategy breakdown and Emotion analysis.' },

  { q: ['win rate', 'how many wins', 'winning percentage'],
    a: 'Your win rate is shown in Trade Journal -> Performance tab at the top. It shows the percentage of your trades that were profitable. You can also see win rate broken down by pair, strategy and session.' },

  { q: ['equity curve', 'pnl chart', 'profit chart', 'performance chart'],
    a: 'The Equity Curve chart is in Trade Journal -> Performance tab. It shows how your account value has grown or declined over time based on your logged trades.' },

  { q: ['behavioral', 'behavior', 'revenge trading', 'fomo', 'overtrading', 'tilt', 'bad habits'],
    a: 'Zynth automatically detects behavioral patterns in your trading. Go to Trade Journal -> Performance tab -> scroll down to Behavioral Flags. It detects: revenge trading, FOMO trades, and overtrading days with severity levels.' },

  { q: ['profit factor', 'expectancy', 'risk reward', 'average win', 'average loss'],
    a: 'These metrics are all in Trade Journal -> Performance tab. Profit Factor = total wins / total losses. Expectancy = average PnL per trade. Risk:Reward = your average winner size vs loser size.' },

  // AI FEATURES
  { q: ['ai analysis', 'analyze my trade', 'ai trade analysis', 'brain icon', 'trade coaching', 'ai feedback'],
    a: 'To get AI analysis on a specific trade: Trade Journal -> Trade History -> click any trade row -> click the brain icon for AI -> Zynth AI will score your psychology (1-10), rate your discipline, and give personalized coaching feedback.' },

  { q: ['ai report', 'generate report', 'ai coaching report', 'weekly report', 'monthly report', 'ai grade'],
    a: 'Generate a full AI coaching report: Trade Journal -> AI Insights tab -> click Generate AI Report -> choose Weekly, Monthly or Custom date range. You get a grade (A to F), performance highlights, concerns, psychological assessment and action items.' },

  { q: ['ai insights', 'insights tab', 'ai tab'],
    a: 'The AI Insights tab is inside Trade Journal. It contains: behavioral alerts, Generate AI Report button, past reports, and per-trade AI score cards for all analyzed trades.' },

  { q: ['ai tries', 'ai limit', 'out of ai', 'no more ai', 'ai quota', 'used up ai'],
    a: 'Free plan: 3 lifetime AI analyses. Pro plan: 50 per month. Elite: unlimited. To get more AI analyses upgrade your plan. Click your avatar top right -> Profile -> Upgrade Plan.' },

  { q: ['per trade ai', 'trade score', 'psychology score', 'discipline rating'],
    a: 'Each trade can be analyzed individually by AI. In Trade History click any trade -> click the brain icon. You get: Psychology Score (1-10), Discipline Rating, Coach Message, Key Observations and Improvement Tips.' },

  // ECONOMIC FEATURES
  { q: ['macro score', 'macro surprise score', 'surprise score', 'macro indicator', 'bullish bearish macro'],
    a: 'The Macro Surprise Score is a Pro feature showing a score from -10 to +10. It analyzes 10 major US economic indicators (NFP, CPI, GDP etc) and tells you if macro conditions are Bullish or Bearish for gold. Find it in AI Insights sidebar.' },

  { q: ['economic calendar', 'upcoming events', 'economic events', 'news events', 'high impact events', 'fomc', 'nfp date', 'cpi date'],
    a: "The Economic Calendar is in the sidebar. It shows upcoming economic events with impact levels (High/Medium/Low), country flags and exact times in your timezone. Free: today's US events only. Pro: all countries and all dates." },

  { q: ['market news', 'gold news', 'forex news', 'latest news', 'news feed'],
    a: 'Market News is in the sidebar. Shows gold and macro news with AI sentiment tags (Bullish/Bearish/Neutral) and impact badges. Use filters to search by keyword, date, impact level or tags like Gold, Fed, Inflation, Geopolitics.' },

  { q: ['economic intelligence', 'intelligence page', 'economic data page', 'macro data', 'nfp data', 'cpi data', 'gdp data'],
    a: 'Economic Intelligence (Pro feature, AI Insights sidebar) shows 10 major US indicators: NFP, CPI, Unemployment, Fed Rate, GDP, Core PCE, Jobless Claims, Retail Sales, ISM Manufacturing, Consumer Confidence - each with Actual vs Forecast and surprise analysis.' },

  { q: ['daily brief', 'morning card', 'daily summary', 'morning summary', 'daily tip'],
    a: "The Daily Brief appears at the top of Dashboard every day. It shows: today's Macro Score, your strongest trading session, your win rate for today's day of week, and top market news. Dismiss with X - reappears fresh next day." },

  // LIVE MARKETS / DASHBOARD
  { q: ['live prices', 'live market', 'real time prices', 'market data', 'gold price', 'btc price', 'price not updating'],
    a: 'Live prices are shown on the Dashboard. Gold, DXY, TLT, SPY, WTI, VIX and BTC update in real time via WebSocket. The Market Data Terminal section has a full TradingView chart where you can switch between 12 instruments.' },

  { q: ['chart', 'tradingview', 'candlestick', 'price chart', 'market chart'],
    a: 'The Market Chart is on the Dashboard. It uses TradingView and shows candlestick charts for 12 instruments (XAU/USD, EUR/USD, BTC, SPY and more). Use the symbol dropdown to switch pairs and the timeframe buttons (1m, 30m, 1h, D) to change the period.' },

  { q: ['market closed', 'market open', 'forex hours', 'trading hours', 'when does market open'],
    a: 'Forex and Gold markets are open Monday to Friday (closed weekends). Crypto trades 24/7. US Stock market is open Monday-Friday 9:30am-4pm EST. The Market Session Bar in the sidebar shows Tokyo, London and New York session status in real time.' },

  { q: ['market session', 'session bar', 'tokyo session', 'london session open', 'new york session open', 'session clock'],
    a: 'The Market Session Bar is at the top of the sidebar. It shows Tokyo, London and New York sessions as colored pills - green when open, gray when closed. The time shown is based on your selected timezone.' },

  // TRADING DESK
  { q: ['trading desk', 'calculators', 'pip calculator', 'position size calculator', 'margin calculator', 'risk calculator'],
    a: 'Trading Desk is in the sidebar. It has 7 calculators: Pip Calculator (value per pip), Position Size Calculator (lot size from risk %), Risk/Reward Calculator, Margin Calculator, Swap/Rollover Calculator, Profit Calculator and Market Hours clock.' },

  { q: ['pip value', 'how many pips', 'pip worth'],
    a: 'Use the Pip Calculator in Trading Desk (sidebar). Enter your pair, lot size and account currency to get the exact dollar value per pip for your position.' },

  { q: ['how much to trade', 'lot size calculator', 'risk management calculator'],
    a: 'Use the Position Size Calculator in Trading Desk. Enter your account size, risk percentage (e.g. 1%) and stop loss in pips. It calculates the exact lot size to risk that amount.' },

  { q: ['market hours', 'what time does market open', 'session times', 'clock'],
    a: 'The Market Hours tool in Trading Desk shows a live clock with all 4 session open/close times converted to your timezone: Sydney, Tokyo, London and New York. It also shows overlap windows.' },

  // SETTINGS & PREFERENCES
  { q: ['settings', 'preferences', 'options', 'configuration', 'where is settings', 'setting'],
    a: 'Settings is at the bottom of the left sidebar (gear icon). You can change: timezone, dark/light theme, auto-refresh toggle, notifications toggle and market timezone display.' },

  { q: ['timezone', 'change timezone', 'time zone', 'wrong time', 'time is wrong', 'pkt', 'est', 'utc', 'gmt', 'how to change timezone', 'where timezone'],
    a: 'To change timezone: click the timezone button in the top header bar (shows your current zone like PKT, EST or UTC) -> select your timezone from the 9 options in the dropdown. All calendar events and session times update automatically.' },

  { q: ['dark mode', 'light mode', 'change theme', 'toggle theme', 'theme', 'dark background', 'white background', 'how to change theme', 'color theme', 'switch theme'],
    a: 'Toggle dark/light mode by clicking the sun or moon icon in the top header bar. Your preference is saved automatically.' },

  { q: ['notifications', 'alerts', 'turn off notifications'],
    a: 'Notification preferences are in Settings (gear icon in sidebar). You can toggle notifications on or off. Market alerts and economic event reminders can be managed there.' },

  // ACCOUNT & AUTH
  { q: ['profile', 'my profile', 'account settings', 'view profile'],
    a: 'Access your profile by clicking your name or avatar in the top right corner. You can see your current plan, member since date, trading stats, and options to change password, upgrade plan or sign out.' },

  { q: ['change password', 'update password', 'reset password', 'forgot password', 'new password'],
    a: 'To change your password: click your avatar/name top right -> Profile -> click Change Password -> a password reset email will be sent to your registered email. Click the link in the email to set a new password.' },

  { q: ['avatar', 'profile picture', 'profile photo', 'change photo', 'upload photo', 'profile image'],
    a: 'To change your profile picture: click your avatar top right -> Profile -> click the camera icon on your avatar circle -> upload a photo from your device (max 2MB). You can also choose from 8 avatar color options.' },

  { q: ['google login', 'sign in with google', 'google account', 'google sign in'],
    a: 'You can sign in with Google using the Continue with Google button on the login page. If you already have a Zynth account with the same email, the Google login will access that account.' },

  { q: ['logout', 'log out', 'sign out', 'exit account'],
    a: 'To sign out: click your name/avatar in the top right -> scroll to bottom of profile panel -> click the red Sign Out button.' },

  { q: ['delete account', 'remove account', 'close account'],
    a: 'To delete your account contact us at getzynth@gmail.com with the subject "Delete Account". We will process it within 24 hours.' },

  // PLANS & BILLING
  { q: ['upgrade', 'upgrade plan', 'get pro', 'get elite', 'subscribe', 'buy plan', 'purchase', 'how to upgrade', 'upgrade my plan', 'upgrading plan'],
    a: 'To upgrade: click your avatar top right -> Profile -> click Upgrade Plan button -> choose Pro ($1.99/month) or Elite ($4.99/month) -> email us at getzynth@gmail.com with your chosen plan. We activate within 24 hours.' },

  { q: ['how much', 'price', 'cost', 'pricing', 'how much does it cost', 'subscription cost'],
    a: 'Zynth pricing: Free ($0 forever), Pro ($1.99/month founding price, regular $9), Elite ($4.99/month founding price, regular $25). The founding price is locked in forever for the first 100 users.' },

  { q: ['free plan', 'what is free', 'free features', 'free limits', 'free tier'],
    a: "Free plan: 10 journal entries lifetime, 3 AI analyses lifetime, live market overview, today's US economic events only, and market news. No credit card needed." },

  { q: ['pro plan', 'what is pro', 'pro features', 'pro benefits'],
    a: 'Pro plan ($1.99/month): unlimited journal entries, 50 AI analyses per month, full Economic Calendar (all countries), Macro Surprise Score, Economic Intelligence, real-time market streaming, advanced analytics.' },

  { q: ['elite plan', 'what is elite', 'elite features', 'elite benefits'],
    a: 'Elite plan ($4.99/month): everything in Pro plus unlimited AI analyses, unlimited OCR, Trading DNA Report, beta access to new features before anyone else, dedicated support with 4-hour response time.' },

  { q: ['founding member', 'founding price', 'launch price', 'early bird', 'discount', 'offer', 'spots left'],
    a: 'Founding Member offer: first 100 users get Pro at $1.99/month (regular $9) and Elite at $4.99/month (regular $25). This price is locked in FOREVER even when we raise prices. Check the landing page to see how many spots are left.' },

  { q: ['payment', 'how to pay', 'pay for pro', 'billing', 'invoice'],
    a: 'To pay: email getzynth@gmail.com with subject "Pro Upgrade" or "Elite Upgrade" and your registered email. We will process your upgrade within 24 hours at the founding member price.' },

  { q: ['refund', 'money back', 'cancel subscription', 'cancel plan'],
    a: 'We offer a 7-day money back guarantee. To cancel or request a refund email getzynth@gmail.com. No questions asked within 7 days of payment.' },

  // ONBOARDING
  { q: ['onboarding', 'setup', 'profile setup', 'initial setup', 'first setup'],
    a: 'When you first sign up Zynth shows a 4-step setup: trading experience level, markets you trade, your goals, and profile personalization. You can skip any step and complete it later from your Profile.' },

  // ERRORS & SUPPORT
  { q: ['not working', 'broken', 'bug', 'error', 'issue', 'problem', 'glitch', 'something wrong'],
    a: 'Sorry to hear something is not working! Try refreshing the page first. If the issue persists email us at getzynth@gmail.com with a description of the problem and we will fix it right away.' },

  { q: ['contact', 'support', 'help', 'reach you', 'talk to someone', 'customer service'],
    a: 'For support email getzynth@gmail.com. We typically respond within 24 hours. For urgent issues write URGENT in the subject line.' },

  { q: ['feature request', 'suggestion', 'idea', 'feedback', 'improve'],
    a: 'We love feedback! Email your suggestions to getzynth@gmail.com. Elite members get priority feature requests - your ideas get built first.' },

  // ABOUT ZYNTH
  { q: ['what is zynth', 'about zynth', 'zynth platform', 'what does zynth do', 'tell me about zynth'],
    a: 'Zynth is a trading intelligence platform for serious traders. It combines: smart trade journal with AI coaching, live market data, economic intelligence, Macro Surprise Score, and behavioral pattern detection - all in one place. Tagline: Intelligence Behind Every Trade.' },

  { q: ['who made zynth', 'who built zynth', 'founder', 'developer', 'team'],
    a: 'Zynth was built by Shahrukh Hamza, an independent developer passionate about helping traders improve. Contact: getzynth@gmail.com' },

  { q: ['is zynth safe', 'data privacy', 'my data', 'secure', 'privacy'],
    a: 'Your data is stored securely with encryption in transit (TLS). We never share or sell your trading data to anyone. Your journal entries and performance data are private to your account only.' },

  { q: ['mobile', 'mobile app', 'phone', 'ios', 'android', 'app store'],
    a: 'Zynth currently runs as a web app accessible from any browser including mobile browsers. A dedicated mobile app is on our roadmap. For now you can add Zynth to your home screen from your mobile browser for an app-like experience.' },
];

// ── Keyword fast-path (instant answers, no API call) ─────────────────────────
function findAnswer(userMessage) {
  const clean = (s) => s.toLowerCase().replace(/[?!.,;:]/g, ' ').replace(/\s+/g, ' ').trim();
  const msg = clean(userMessage);

  // Pass 1: direct substring
  for (const item of QA) {
    for (const kw of item.q) {
      if (msg.includes(kw)) return item.a;
    }
  }

  // Pass 2: word-token scoring (handles paraphrase like "how to log" vs "how do i log")
  const msgWords = new Set(msg.split(/\s+/).filter(w => w.length > 2));
  let bestScore = 0;
  let bestAnswer = null;
  for (const item of QA) {
    for (const kw of item.q) {
      const kwWords = kw.split(/\s+/).filter(w => w.length > 2);
      if (kwWords.length === 0) continue;
      const matchCount = kwWords.filter(w => msgWords.has(w)).length;
      const score = matchCount / kwWords.length;
      if (score >= 0.75 && matchCount > bestScore) {
        bestScore = matchCount;
        bestAnswer = item.a;
      }
    }
  }
  return bestAnswer;
}

// ── Comprehensive Zynth knowledge base for Gemini ────────────────────────────
const ZYNTH_SYSTEM_PROMPT = `You are the Zynth Assistant — a helpful, friendly, and knowledgeable support agent built into the Zynth trading intelligence platform. You answer user questions about Zynth accurately and concisely.

## WHAT IS ZYNTH
Zynth is a trading intelligence platform for serious traders. It is a web app (not a broker — you cannot place trades or deposit money here). It gives traders: a smart trade journal with AI coaching, live market data, economic intelligence, Macro Surprise Score, behavioral pattern detection, and Trading Desk calculators.
Tagline: "Intelligence Behind Every Trade."
Contact: getzynth@gmail.com | Website: getzynth.com

## PLANS & PRICING
- Free ($0 forever): 10 journal entries lifetime, 3 AI analyses lifetime, today's US economic events, live market overview, market news.
- Pro ($1.99/month founding price, regular $9/month): unlimited journal entries, 50 AI analyses/month, full Economic Calendar (all countries), Macro Surprise Score, Economic Intelligence page, real-time streaming, advanced analytics.
- Elite ($4.99/month founding price, regular $25/month): everything in Pro + unlimited AI analyses, unlimited OCR, Trading DNA Report, beta feature access, 4-hour dedicated support.
- Founding Member offer: first 100 users lock in the founding price FOREVER.
- To upgrade: click avatar (top right) → Profile → Upgrade Plan → email getzynth@gmail.com with your chosen plan. Activation within 24 hours.
- Payment is manual via email (getzynth@gmail.com). 7-day money-back guarantee, no questions asked.
- To cancel: email getzynth@gmail.com.

## TRADE JOURNAL
- Access: left sidebar → "Trade Journal".
- To LOG a trade: Log Trade tab → select pair (e.g. XAU/USD) → BUY or SELL → entry price, exit price, lot size → outcome (WIN/LOSS) → Save Trade. Optional: add emotional state, strategy, session, notes.
- Emotional states: Calm, Confident, Anxious, Frustrated, Greedy, Fearful, Neutral, Excited, Revenge.
- Strategies: Breakout, Trend Follow, Scalping, and more (or type custom).
- Sessions: Asian, London, New York, London-NY Overlap.
- To VIEW trades: Trade History tab — table with date, pair, direction, outcome, PnL. Click any row for full details.
- To DELETE a trade: Trade History → click trade row → delete/trash icon → confirm.
- To EXPORT trades: Trade History → Export CSV button.
- To FILTER trades: filter bar in Trade History — filter by pair, outcome, strategy, date range, session.

## PERFORMANCE & ANALYTICS
- Access: Trade Journal → Performance tab.
- Shows: Win Rate, Total PnL, Profit Factor, Average Win/Loss, Risk:Reward ratio, Expectancy, Equity Curve chart, P&L by pair, Strategy breakdown, Emotion analysis, Behavioral Flags.
- Behavioral Flags: auto-detects revenge trading, FOMO, overtrading.
- Win rate: % of profitable trades. Also shown per pair, strategy, session.
- Profit Factor = total wins / total losses.
- Expectancy = average PnL per trade.
- Equity Curve: account value over time.

## AI FEATURES
- Per-trade AI: Trade History → click trade → brain icon → get Psychology Score (1-10), Discipline Rating, Coach Message, Key Observations, Improvement Tips.
- AI Insights tab: inside Trade Journal → behavioral alerts, Generate AI Report button, past reports, per-trade scores.
- AI Report: click Generate AI Report → choose Weekly, Monthly, or Custom → get grade (A–F), highlights, concerns, psychological assessment, action items.
- AI tries: Free = 3 lifetime, Pro = 50/month, Elite = unlimited.

## ECONOMIC CALENDAR
- Access: left sidebar → "Economic Calendar".
- Shows upcoming economic events: impact level (High/Medium/Low), country flags, exact times in your timezone.
- Free: today's US events only. Pro/Elite: all countries, all future dates.

## AI INSIGHTS / MACRO SCORE (Pro/Elite)
- Access: left sidebar → "AI Insights".
- Macro Surprise Score: -10 to +10 scale — analyzes 10 major US indicators (NFP, CPI, GDP, Fed Rate, Unemployment, Core PCE, Jobless Claims, Retail Sales, ISM Manufacturing, Consumer Confidence). Score tells you if macro conditions are Bullish or Bearish for gold.
- Economic Intelligence page: shows each of the 10 indicators with actual vs forecast and surprise analysis.

## DASHBOARD
- Shows: greeting, today's trade summary, P&L calendar, stat cards (Total PnL, Win Rate, This Week PnL, Profit Factor), quick stats, Your Edge section, Recent Trades, Quick Access shortcuts.
- Daily Brief: appears at top of Dashboard — today's Macro Score, strongest session, win rate for today's day of week, top news. Dismiss with X.

## LIVE MARKET DATA
- Dashboard shows: Gold (XAU/USD), DXY, TLT, SPY, WTI, VIX, BTC — real-time via WebSocket.
- TradingView chart with 12 instruments (XAU/USD, EUR/USD, BTC, SPY and more). Switch pairs with the dropdown; change timeframe (1m, 30m, 1h, D).
- Market news feed: AI sentiment tags (Bullish/Bearish/Neutral), filter by keyword, date, impact, or tags.

## TRADING DESK (Calculators)
- Access: left sidebar → "Trading Desk".
- 7 calculators: Pip Value Calculator, Position Size Calculator (lot size from risk %), Risk/Reward Calculator, Margin Calculator, Swap/Rollover Calculator, Profit Calculator, Market Hours Clock.
- Position Size Calculator: enter account size + risk % + stop loss pips → get exact lot size.

## SETTINGS & PREFERENCES
- Access: gear icon at bottom of left sidebar.
- Options: timezone, dark/light theme, auto-refresh, notifications, market timezone display.
- Change timezone: click the timezone button in the TOP HEADER BAR (shows your current zone like PKT, EST, UTC) → select from dropdown. All calendar events and session times update immediately.
- Change theme: click the sun/moon icon in the TOP HEADER BAR. Preference is saved automatically.

## ACCOUNT & PROFILE
- Access: click your avatar or name in the top right corner.
- View: current plan, member since, trading stats, change password, upgrade plan, sign out.
- Change password: Profile → Change Password → a reset email is sent. Click the link to set new password.
- Change profile picture: Profile → click camera icon on avatar → upload photo (max 2MB) or choose from 8 color options.
- Sign out: Profile → red Sign Out button.
- Delete account: email getzynth@gmail.com with subject "Delete Account".

## ONBOARDING & SETUP
- First-time 4-step setup: trading experience, markets traded, goals, profile personalization.
- Can be skipped and completed later from Profile.
- The "Complete your profile setup" banner at the top links to the setup flow.

## MARKET SESSIONS
- Session bar: top of sidebar. Shows Tokyo, London, New York as colored pills (green = open, gray = closed).
- Times shown in your selected timezone.
- Tokyo: 00:00–09:00 UTC. London: 08:00–17:00 UTC. New York: 13:00–22:00 UTC.

## ZYNTH'S NATURE
- Zynth is NOT a broker. You cannot place real trades through Zynth.
- All trades are logged manually through the journal — there is no automatic broker sync.
- All data is private to your account. Data is encrypted in transit (TLS). Never shared or sold.
- Mobile: works in any mobile browser. Add to home screen for app-like experience. Native app on roadmap.

## RESPONSE GUIDELINES
- Be friendly, concise, and direct.
- Use bullet points or numbered steps for instructions.
- Bold key terms like **Trade Journal**, **Performance tab**, **sidebar** to help users navigate.
- If a user asks about something you are not sure about, say so and suggest they email getzynth@gmail.com.
- Never make up features or prices that are not listed above.
- Keep responses under 200 words unless a topic genuinely requires more detail.
- Do not mention that you are powered by Gemini or any other AI model. You are the Zynth Assistant.`;

// ── Call Gemini for freeform answers ─────────────────────────────────────────
async function askGemini(userMessage, history = []) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    // Build conversation contents
    const contents = [];

    // Add prior turns (last 6 messages to stay within token limits)
    for (const turn of history.slice(-6)) {
      contents.push({
        role: turn.role === 'user' ? 'user' : 'model',
        parts: [{ text: turn.content }],
      });
    }

    // Add current user message
    contents.push({ role: 'user', parts: [{ text: userMessage }] });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: ZYNTH_SYSTEM_PROMPT }] },
          contents,
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 350,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error('[Assistant] Gemini HTTP error:', response.status);
      return null;
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text?.trim() || null;
  } catch (err) {
    console.error('[Assistant] Gemini call failed:', err.message);
    return null;
  }
}

// POST /api/assistant/chat
router.post('/chat', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id || 'anon';

    if (!checkRateLimit(userId)) {
      return res.status(429).json({
        error: 'You have reached the limit of 30 messages per hour. Please try again later.',
      });
    }

    const { message, history = [] } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message required' });
    }
    if (message.trim().length > 1000) {
      return res.status(400).json({ error: 'Message too long (max 1000 characters)' });
    }

    console.log('[Assistant] Message:', message.substring(0, 80));

    // Fast path: keyword match (instant, no API call)
    const staticAnswer = findAnswer(message);
    if (staticAnswer) {
      console.log('[Assistant] Answered via static KB');
      return res.json({ reply: staticAnswer });
    }

    // Cache path: previously seen question answered instantly
    const ck = cacheKey(message);
    const cached = geminiCache.get(ck);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      console.log('[Assistant] Answered via cache');
      return res.json({ reply: cached.reply });
    }

    // AI path: ask Gemini with full Zynth knowledge
    console.log('[Assistant] Falling back to Gemini');
    const geminiReply = await askGemini(message, history);
    if (geminiReply) {
      geminiCache.set(ck, { reply: geminiReply, ts: Date.now() });
      return res.json({ reply: geminiReply });
    }

    // Final fallback if Gemini is unavailable
    return res.json({
      reply: 'I could not find a specific answer for that right now.\n\nFor instant help, try asking:\n\u2022 "How do I log a trade?"\n\u2022 "How do I change my timezone?"\n\u2022 "What is the Macro Score?"\n\u2022 "How do I upgrade to Pro?"\n\nOr email us at getzynth@gmail.com and we will help right away!',
    });

  } catch (error) {
    console.error('[Assistant] Error:', error);
    res.status(500).json({ reply: 'Something went wrong. Please try again!' });
  }
});

export default router;
