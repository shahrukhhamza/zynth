import { useState, useMemo, useEffect } from 'react';
import { BookOpen, Search, ChevronRight, ArrowLeft, Rocket, BookMarked, Bot, BarChart2, Calendar, Camera, Calculator, CreditCard, Settings, Shield, Star, X, Home, Mail, LifeBuoy, Clock3, ArrowUpRight, Bug, Lightbulb, MessageSquare } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { getPlanMonthlyLabel } from '../config/pricingPlans';

const PRO_MONTHLY_PRICE = getPlanMonthlyLabel('pro');
const ELITE_MONTHLY_PRICE = getPlanMonthlyLabel('elite');

// -- Article database ---------------------------------------------------------
const CATEGORIES = [
  {
    key: 'getting-started', icon: Rocket, color: '#CA8A04', title: 'Getting Started',
    description: 'New to Zynth? Start here to set up your account and learn the basics.',
    articles: [
      {
        id: 'welcome', title: 'Welcome to Zynth',
        excerpt: 'Learn what Zynth is, what tools you get, and how to make the most of the platform.',
        content: `Zynth is a trading intelligence platform that combines four powerful tools:

1. Smart Trade Journal - log every trade with context, screenshots and emotion tracking
2. AI Coaching - get personalized feedback on your trading psychology and patterns
3. Economic Intelligence - track macro data and understand market conditions
4. Live Market Data - real-time prices and charts for major instruments

::tip Getting the most out of Zynth
- Start by logging your first 10 trades
- After 10 trades AI analysis becomes more accurate and personalized
- Check the Daily Brief every morning
- Use the Economic Calendar before trading
- Review your Performance weekly
::`,
      },
      {
        id: 'first-trade', title: 'Your First Trade Journal Entry',
        excerpt: 'A step-by-step walkthrough of logging your very first trade.',
        content: `## Step-by-Step Guide

**Step 1:** Click **Trade Journal** in the sidebar

**Step 2:** Select the **Log Trade** tab

**Step 3:** Choose your instrument (e.g. \`XAU/USD\` for Gold)

**Step 4:** Select **BUY** or **SELL** direction

**Step 5:** Enter your Entry Price

**Step 6:** Enter your Exit Price

**Step 7:** Select the outcome: WIN, LOSS or BREAKEVEN

**Step 8:** Enter your P&L (profit or loss amount)

**Step 9:** (Optional) Select your Strategy, Emotional State, Session

**Step 10:** (Optional) Attach a screenshot of your trade

**Step 11:** Add notes in Why I Entered, Lessons Learned fields

**Step 12:** Click **Save Trade**

::tip Pro tip
The more detail you add, the better your AI analysis will be!
::`,
      },
      {
        id: 'dashboard', title: 'Understanding Your Dashboard',
        excerpt: 'A tour of all three main sections on the Dashboard page.',
        content: `Your Dashboard has three main sections:

## Daily Brief (top)

A personalized morning card showing your Macro Score, best trading session, day-of-week performance stats and top market news. Appears once per day - dismiss with the X button.

## Market Data Terminal (middle)

Live prices for Gold, DXY, TLT, SPY, WTI, VIX and BTC. The TradingView chart below shows full candlestick charts for 12 instruments. Use the symbol dropdown to switch pairs.

## Navigation (left sidebar)

Access all features from the sidebar. The Market Session Bar at the top shows Tokyo, London and New York session status.`,
      },
      {
        id: 'profile-setup', title: 'Setting Up Your Profile',
        excerpt: 'Complete your profile, change your avatar, and set your display name.',
        content: `Complete your profile for a better experience:

## Steps

1. Click your avatar/name in the top right
2. Profile shows your current plan and stats
3. To change your avatar: click the camera icon on your avatar circle
4. To change password: click **Change Password**
5. To upgrade your plan: click **Upgrade Plan**

## Onboarding Setup

When you first sign up, Zynth asks 4 questions:
- How long you have been trading
- What markets you trade
- What you want to achieve
- Your display name and avatar color

::tip
You can skip onboarding and complete it later from your Profile.
::`,
      },
    ],
  },
  {
    key: 'journal', icon: BookMarked, color: '#CA8A04', title: 'Trade Journal',
    description: 'Learn how to log trades, read analytics, and use AI coaching.',
    articles: [
      {
        id: 'logging-trades', title: 'Logging Trades - Complete Guide',
        excerpt: 'Every field explained: instrument, direction, entry/exit, P&L, emotions and more.',
        content: `## All Fields Explained

**INSTRUMENT SELECTOR**
Choose from 14 preset pairs including \`XAU/USD\` (Gold), \`EUR/USD\`, \`GBP/USD\`, \`USD/JPY\`, \`BTC/USD\`, \`ETH/USD\` and more. Or type any custom instrument.

**DIRECTION**
- BUY (Long) - green button
- SELL (Short) - red button

**ENTRY PRICE**
The price at which you entered the trade. For gold: typically a 4-5 digit number (e.g. \`2650.50\`)

**EXIT PRICE**
The price at which you closed the trade. Leave blank if trade is still open (select OPEN as outcome).

**TP (Take Profit)**
Your planned take profit level. Used to calculate planned Risk:Reward ratio.

**SL (Stop Loss)**
Your stop loss level. Important for risk management tracking.

**POSITION SIZE**
Enter lot size (e.g. \`0.01\`, \`0.1\`, \`1.0\`). Use the Position Size Calculator in Trading Desk to calculate optimal size.

**SESSION**
When did you trade?
- Asian: 00:00-09:00 UTC
- London: 07:00-16:00 UTC
- New York: 13:00-22:00 UTC
- London-NY Overlap: 13:00-16:00 UTC

**OUTCOME**
- WIN: trade was profitable
- LOSS: trade resulted in a loss
- BREAKEVEN: trade closed at entry price
- OPEN: trade is still running

**P&L**
Enter the actual dollar amount won or lost. Use positive for wins (e.g. \`250\`) and negative for losses (e.g. \`-150\`).

**STRATEGY**
Tag your trade with your strategy. 8 presets available or enter custom. Win rate per strategy is tracked separately.

**EMOTIONAL STATE**
How were you feeling? Options: Calm, Confident, Anxious, Frustrated, Greedy, Fearful, Neutral, Excited, Revenge Trading. Used for behavioral analysis.

**WHY I ENTERED**
Describe your trade setup and reasoning.

**LESSONS LEARNED**
What did you learn from this trade? Even winning trades have lessons.

**SCREENSHOT**
Attach a chart screenshot of your trade. Shows in your trade history and AI analysis.`,
      },
      {
        id: 'performance-analytics', title: 'Reading Your Performance Analytics',
        excerpt: 'Understand key metrics, charts, and behavioral flags in the Performance tab.',
        content: `## Key Metrics

| Metric | Description |
|---|---|
| Total Trades | Number of logged trades |
| Win Rate | % of winning trades |
| Net P&L | Total profit/loss in dollars |
| Profit Factor | Gross profit / gross loss (above 1.5 is good) |
| Average Win | Average size of winning trades |
| Average Loss | Average size of losing trades |
| Risk:Reward | Avg win / avg loss ratio |
| Expectancy | Average P&L per trade |

## Charts

- **Equity Curve** - your running account value
- **Outcome Pie** - WIN/LOSS/BE distribution
- **P&L by Pair** - which instruments are most/least profitable
- **Strategy Win Rate** - performance per strategy
- **Emotion Frequency** - how often each emotional state appears

## Behavioral Flags

Auto-detected patterns:
- **Revenge Trading** - trading immediately after a loss
- **FOMO** - entering late in a move
- **Overtrading** - too many trades in one day
- **Tilt** - deteriorating performance after losses`,
      },
      {
        id: 'ai-analysis', title: 'AI Trade Analysis Explained',
        excerpt: 'Understand Psychology Scores, Discipline Ratings, and Coach messages per trade.',
        content: `## Per-Trade AI Analysis

Click the brain icon on any trade in Trade History to get:

**Psychology Score (1-10)**
How psychologically sound was this trade? 10 = perfect, 1 = very problematic.

**Discipline Rating**
Did you follow your trading rules?

**Coach Message**
Personalized feedback from the AI coach.

**Key Observations**
What the AI noticed about this trade.

**Improvement Tips**
Specific actionable suggestions.

::warning Important
AI analysis uses Google Gemini and may not always be 100% accurate. Use it as a coaching tool, not as definitive advice.
::

## Usage Limits

| Plan | Monthly Analyses |
|---|---|
| Free | 2 lifetime |
| Pro | 50/month |
| Elite | Unlimited |`,
      },
      {
        id: 'ai-reports', title: 'Generating AI Performance Reports',
        excerpt: 'Generate weekly or monthly AI reports with grades, highlights, and action items.',
        content: `## How to Generate a Report

1. Go to **Trade Journal -> AI Insights** tab
2. Click **Generate AI Report**
3. Choose: Weekly, Monthly or Custom range
4. Wait 10-20 seconds for Gemini to analyze
5. Report appears with:
   - Overall Grade (A to F)
   - Performance Summary
   - Highlights (what you did well)
   - Concerns (areas to improve)
   - Psychological Assessment
   - Action Items for next period
   - Coach's personal message

Reports are saved and accessible in the **Past Reports** section below.

::tip
Generate a monthly report at the start of each new month to review the previous month's trading.
::`,
      },
      {
        id: 'heatmap', title: 'Trading Activity Heatmap',
        excerpt: 'Read the time-of-day heatmap showing your best and worst trading windows.',
        content: `## Reading the Heatmap

The heatmap in the Performance tab shows when you trade and how you perform at different times.

- **Rows** - days of the week (Mon-Sun)
- **Columns** - hours of the day (00-23)
- **Green cells** - profitable trading time
- **Red cells** - losing trading time
- **Cell number** - your P&L in that time slot
- **Empty cells** - no trades at that time

## Session Color Bars

The color bar above the chart shows trading sessions:
- **Blue** - Asian session (00-07h)
- **Indigo** - London session (08-12h)
- **Amber** - New York session (13-17h)
- **Gray** - Off-hours (18-23h)

## Date Range Filter

Use the period buttons (This Week / This Month / Last 3 Months / All Time) and the left/right arrows to navigate to different periods.

::tip
Use this to find your best and worst trading times and focus on your most profitable windows.
::`,
      },
      {
        id: 'pretrade-checklist', title: 'Pre-Trade Checklist',
        excerpt: 'Use the 6-question checklist to avoid emotional and impulsive trades.',
        content: `## How to Use the Pre-Trade Checklist

1. Before logging a trade, click **Run Pre-Trade Check**
2. Answer 6 questions honestly:
   - Does macro support your direction?
   - Are you emotionally calm?
   - Is your Risk:Reward at least 1:1.5?
   - Does this match your strategy?
   - Are you in your best session?
   - Have you had 2+ losses already today?
3. Score is calculated 0-100

## Score Interpretation

| Score | Meaning | Action |
|---|---|---|
| 80-100 | Green | Trade with confidence |
| 50-79 | Amber | Reduce position size |
| 0-49 | Red | Consider skipping |

Your checklist history is analyzed over time to show if you follow your own rules.`,
      },
    ],
  },
  {
    key: 'ai', icon: Bot, color: '#8b5cf6', title: 'AI Features',
    description: 'Deep dives into Macro Score, Daily Brief, Trading DNA, and more.',
    articles: [
      {
        id: 'macro-score', title: 'Understanding the Macro Score',
        excerpt: "Zynth's proprietary -10 to +10 score built from 10 US economic indicators.",
        content: `## What It Measures

The Macro Surprise Score is Zynth's proprietary indicator (Pro feature). It analyzes 10 major US economic releases and calculates a composite score from **-10 to +10**.

## Score Interpretation

| Score | Meaning |
|---|---|
| +6 to +10 | Strongly Bullish for Gold |
| +2 to +6 | Bullish for Gold |
| -2 to +2 | Neutral |
| -6 to -2 | Bearish for Gold |
| -10 to -6 | Strongly Bearish for Gold |

## The 10 Indicators Tracked

1. Non-Farm Payrolls (NFP)
2. Consumer Price Index (CPI)
3. Unemployment Rate
4. Fed Interest Rate Decision
5. GDP Growth Rate
6. Core PCE Price Index
7. Jobless Claims
8. Retail Sales
9. ISM Manufacturing PMI
10. Consumer Confidence

## How Surprise is Calculated

\`Surprise = ((Actual - Forecast) / Forecast) * 100\`

Each indicator is weighted by its historical impact on gold prices.

**Where to find it:** AI Insights in the sidebar (Pro/Elite only)`,
      },
      {
        id: 'daily-brief', title: 'Daily Trading Brief',
        excerpt: 'Your personalized morning card showing Macro Score, best session, and news.',
        content: `## What the Daily Brief Shows

1. **Macro Climate** - current Macro Score with bullish/bearish label
2. **Your Best Session** - which session you perform best in based on your history
3. **Day Edge** - your win rate for today's day of week based on past trades
4. **Top News** - latest high-impact market news

## Daily Tip

A rotating trading wisdom tip changes each day to keep you focused.

The brief appears once per day. Dismiss with X - it will reappear fresh the next day.

::tip
Best Session and Day Edge show "Not enough data" until you have logged enough trades for that day/session.
::`,
      },
      {
        id: 'trading-dna', title: 'Trading DNA Report (Elite)',
        excerpt: 'Your unique trader personality profile with archetypes, trait scores, and improvement plans.',
        content: `## What You Get

- **Trader Archetype** - which type of trader you are (Sniper, Momentum Rider, etc.)
- **8 Trait Scores** - Patience, Discipline, Risk Management, Emotional Control, Consistency, Strategy Adherence, Macro Awareness, Learning Rate
- **Strengths** - your top 3 trading strengths with data evidence
- **Weaknesses** - top 3 areas to improve
- **Performance Fingerprint** - radar chart showing your unique trading profile
- **30-Day Improvement Plan** - personalized week-by-week action plan
- **Coach Message** - personal letter from AI coach based on your actual data

## Requirements

- Minimum 10 logged trades
- **Elite plan only**
- Generated once per month

**Find it in:** AI Insights -> Trading DNA tab

::warning
This feature requires an Elite subscription. Open the upgrade modal to continue.
::`,
      },
      {
        id: 'macro-correlation', title: 'Macro-Journal Correlation (Pro)',
        excerpt: 'See how your win rate changes based on macro conditions.',
        content: `## What It Shows

- Your win rate when macro is bullish vs. bearish
- Which economic indicator release days affect your trading most
- Visual chart overlaying your trades on the macro score timeline
- AI narrative explaining the correlation

## Example Insights

> "You win 71% of trades when Macro Score is above +3"

> "You lose 67% of trades on Fed Rate decision days - consider avoiding these"

**Find it in:** AI Insights -> Macro Correlation tab

**Available on:** Pro and Elite plans only`,
      },
    ],
  },
  {
    key: 'markets', icon: BarChart2, color: '#CA8A04', title: 'Market Data',
    description: 'Live data tiers, the TradingView chart, and the market session guide.',
    articles: [
      {
        id: 'live-data', title: 'Live Market Data Explained',
        excerpt: 'Understand the three data tiers and what is real-time vs delayed.',
        content: `## Data Tiers

**Tier 1 - Real-time WebSocket (instant):**
\`XAU/USD\`, \`EUR/USD\`, \`BTC/USD\`, \`ETH/USD\`, \`XRP/USD\`, \`BNB/USD\`, \`SOL/USD\`

**Tier 2 - Updated every 15 minutes:**
\`GBP/USD\`, \`USD/JPY\`, GLD ETF, TLT, SPY

**Tier 3 - Updated every 60 minutes:**
AAPL, TSLA, MSFT, AMZN, NVDA, GOOGL

## Data Sources

- Primary: Finnhub WebSocket
- Backup: Yahoo Finance REST API
- Charts: Twelve Data API + TradingView

## Connection Status

| Badge | Meaning |
|---|---|
| Live | WebSocket connected |
| Connecting | Reconnecting |
| Disconnected | Check your internet |

::warning
Free plan receives 15-minute delayed prices. Pro/Elite get real-time streaming.
::`,
      },
      {
        id: 'market-chart', title: 'Using the Market Chart',
        excerpt: 'Switch instruments, change timeframes, add indicators, and use drawing tools.',
        content: `## Switching Instruments

Use the symbol dropdown above the chart. Available: \`XAU/USD\`, \`EUR/USD\`, \`GBP/USD\`, \`USD/JPY\`, \`BTC/USD\`, \`ETH/USD\`, SPY, GLD, TLT, VIX, WTI Oil, NASDAQ

## Changing Timeframe

Use the buttons inside the TradingView chart: **1m, 5m, 15m, 30m, 1h, 4h, 1D, 1W**

## Adding Indicators

Click the **Indicators** button on the chart toolbar to add technical indicators (Moving Averages, RSI, MACD etc.)

## Drawing Tools

Use the left toolbar on the chart to draw trend lines, support/resistance levels and other annotations.

::tip
The chart is powered by TradingView. A free TradingView account unlocks some advanced features like Bar Replay.
::`,
      },
      {
        id: 'sessions-guide', title: 'Market Sessions Guide',
        excerpt: 'All four sessions explained with UTC times, characteristics, and overlap windows.',
        content: `## Session Times (UTC)

**Asian Session**
Opens: 00:00 UTC - Closes: 09:00 UTC
Lower volatility. JPY pairs most active. Gold often ranges.

**London Session**
Opens: 07:00 UTC - Closes: 16:00 UTC
High volatility starts. EUR/GBP pairs most active. Gold moves.

**New York Session**
Opens: 13:00 UTC - Closes: 22:00 UTC
Highest volume. USD pairs most active. Major news releases.

## London-NY Overlap (13:00-16:00 UTC)

This is the highest volume and volatility period of the entire trading day. Most professional traders focus on this window.

::tip
The Market Session Bar in the sidebar shows real-time status of each session converted to your selected timezone.
::`,
      },
      {
        id: 'calendar-guide', title: 'Economic Calendar Guide',
        excerpt: 'How to read the Surprise column, impact badges, and use Print/Export.',
        content: `## Impact Levels

- **HIGH (red)** - Major market moving events: NFP, CPI, Fed Rate, GDP
- **MEDIUM (amber)** - Significant but smaller impact: Retail Sales, ISM, Consumer Confidence
- **LOW (gray)** - Minor market impact

## Reading the Table Columns

| Column | Description |
|---|---|
| Event | Name and release frequency |
| Currency | Which currency is affected |
| Impact | HIGH/MEDIUM/LOW badge |
| Actual | The released data value |
| Forecast | Analyst consensus estimate |
| Previous | Last month's reading |
| Surprise | Actual vs forecast difference |

## Color Coding

- **Green actual** - beat forecast (positive surprise)
- **Red actual** - missed forecast (negative surprise)
- **Gray** - in line with forecast

## Plan Access

- **Free** - Today's US events, High and Medium impact only
- **Pro/Elite** - All countries, all dates, all impacts

## Print/Download

Click **Print / Download** to export the calendar as an HTML report for offline reference.`,
      },
    ],
  },
  {
    key: 'calendar', icon: Calendar, color: '#f59e0b', title: 'Economic Calendar',
    description: 'Scheduled releases, impact levels, and surprise scoring explained.',
    articles: [
      {
        id: 'calendar-full', title: 'Using the Economic Calendar',
        excerpt: 'Navigate events, filter by impact, expand rows for AI analysis.',
        content: `The Economic Calendar shows all scheduled US macroeconomic data releases.

## Filtering Events

Use the **All | High | Medium | Low** pills in the top-right to filter by impact level.

## Expanding a Row

Click any row to expand it and see:
- AI Market Analysis summary
- Pre-Release Scenario Analysis
- Historical data chart (12 months)
- Recent releases table

## Surprise Column

The **Surprise** pill shows how much the actual reading beat or missed consensus:
- \`+X% Beat\` - green pill (positive for USD)
- \`-X% Miss\` - red pill (negative for USD)
- \`In Line\` - gray pill`,
      },
      {
        id: 'macro-indicators', title: 'The 17 Tracked Indicators',
        excerpt: "What each of Zynth's 17 US macro indicators measures and why it matters.",
        content: `Zynth tracks 17 key US macro indicators and their impact on gold and forex markets.

## Tier 1 - High Impact

1. **NFP** (Non-Farm Payrolls) - Monthly job additions. Biggest gold mover.
2. **CPI** (Consumer Price Index) - Inflation measure. Drives Fed policy.
3. **Core PCE** - Fed's preferred inflation gauge.
4. **Fed Rate Decision** - Interest rate announcement.
5. **GDP Growth Rate** - Economy size change quarter-over-quarter.

## Tier 2 - Medium Impact

6. **Unemployment Rate** - % of people actively seeking work.
7. **Retail Sales** - Consumer spending indicator.
8. **ISM Manufacturing PMI** - Factory activity index.
9. **Consumer Confidence** - How optimistic consumers feel.
10. **Jobless Claims** - Weekly unemployment benefit applications.

## Tier 3 - Supporting

11-17: Core Retail Sales, PPI, Trade Balance, Housing Starts, Durable Goods, ISM Services, Building Permits`,
      },
      {
        id: 'print-export', title: 'Print & Export the Calendar',
        excerpt: 'Export the full calendar with history as a printable HTML report.',
        content: `## How to Export

1. Click **Print / Download** button in the top-right of the calendar
2. A modal appears showing all visible indicators
3. Check/uncheck which indicators to include
4. Choose **Print** to open browser print dialog
5. Choose **Download** to save as an \`.html\` file

The exported report includes:
- All selected indicator names and values
- Full release history table per indicator
- Formatted for clean printing

::tip
Click **Select All** in the modal to include all indicators at once.
::`,
      },
    ],
  },
  {
    key: 'tools', icon: Calculator, color: '#10b981', title: 'Trading Desk',
    description: 'Pip calculator, position sizing, and market hours tools explained.',
    articles: [
      {
        id: 'pip-calculator', title: 'Pip Calculator',
        excerpt: 'Calculate the dollar value of 1 pip for any instrument and lot size.',
        content: `## How to Use

1. Go to **Trading Desk -> Pip Calculator**
2. Select your instrument (e.g. \`XAU/USD\`)
3. Enter lot size (e.g. \`0.1\`)
4. Select your account currency (USD)
5. Result shows dollar value per pip

## Gold (XAU/USD) Example

- 1 pip = \`$0.01\` price movement
- 1 lot = 100 oz
- 1 pip on 1.0 lot = **$1.00**
- 1 pip on 0.1 lot = **$0.10**

## EUR/USD Example

- 1 pip = \`0.0001\` price movement
- 1 standard lot = 100,000 units
- 1 pip on 1.0 lot = **$10.00**`,
      },
      {
        id: 'position-size', title: 'Position Size Calculator',
        excerpt: 'Calculate exact lot sizes to risk a fixed % of account per trade.',
        content: `## How to Use

1. Go to **Trading Desk -> Position Size Calculator**
2. Enter Account Size (e.g. \`$5,000\`)
3. Enter Risk % (e.g. \`1%\` = risk $50)
4. Enter Stop Loss in pips (e.g. \`20 pips\`)
5. Select instrument
6. Result: exact lot size to risk 1%

## Example Calculation

\`\`\`
Account:       $10,000
Risk:          1% = $100
Stop Loss:     50 pips on EUR/USD
Pip value:     $10/pip (1 lot)
Position Size: $100 / (50 * $10) = 0.2 lots
\`\`\`

::warning
Never risk more than 1-2% per trade. This ensures you survive losing streaks.
::`,
      },
      {
        id: 'market-hours', title: 'Market Hours Tool',
        excerpt: 'Live session clocks, open/closed status, and overlap windows in your timezone.',
        content: `## Sessions Shown

| Session | UTC Open | UTC Close |
|---|---|---|
| Sydney | 22:00 | 07:00 |
| Tokyo | 00:00 | 09:00 |
| London | 07:00 | 16:00 |
| New York | 13:00 | 22:00 |

## Features

- Live clock in your selected timezone
- 12h or 24h time format toggle
- Open/Closed status for each session
- Overlap windows highlighted

## Overlap Windows

- **London-Tokyo overlap:** 07:00-09:00 UTC
- **London-NY overlap:** 13:00-16:00 UTC (highest volume)

::tip
The London-NY overlap (shown in amber) is the highest volume period of the day. Most professional traders focus on this window.
::`,
      },
    ],
  },
  {
    key: 'billing', icon: CreditCard, color: '#f59e0b', title: 'Plans & Billing',
    description: 'All three plans compared, how to upgrade, and refund policy.',
    articles: [
      {
        id: 'plan-comparison', title: 'Plan Comparison',
        excerpt: 'Detailed feature-by-feature comparison of Free, Pro, and Elite plans.',
        content: `## FREE PLAN ($0/month)

| Feature | Limit |
|---|---|
| Journal entries | 5 lifetime |
| AI Analysis | 2 lifetime |
| Economic Calendar | Today's US events only (High + Medium) |
| Live Markets | 15-minute delayed |
| Market News | 5 articles/day |
| Trading Desk | Full access |

## PRO PLAN (${PRO_MONTHLY_PRICE})

| Feature | Limit |
|---|---|
| Journal entries | Unlimited |
| AI Analysis | 50/month |
| Economic Calendar | All countries, all dates |
| Live Markets | Real-time streaming |
| Market News | Unlimited |
| Macro Surprise Score | Full access |
| Economic Intelligence | Full access |
| Macro-Journal Correlation | Full access |

## ELITE PLAN (${ELITE_MONTHLY_PRICE})

Everything in Pro, plus:

| Feature | Limit |
|---|---|
| AI Analysis | Unlimited |
| Trading DNA Report | Monthly generation |
| Beta Features | Early access |
| Support | 4-hour response time |`,
      },
      {
        id: 'how-to-upgrade', title: 'How to Upgrade',
        excerpt: 'Step-by-step guide to upgrading your plan and getting access same day.',
        content: `## Steps to Upgrade

1. Click your avatar/name in the top right
2. Click **Upgrade Plan**
3. Choose **Pro** (${PRO_MONTHLY_PRICE}) or **Elite** (${ELITE_MONTHLY_PRICE})
4. Complete payment inside the secure in-app modal
5. Upload your payment proof screenshot
6. Instant activation after verification (usually within minutes)

## Payment Methods

- International: USD Bank Transfer
- Pakistan: JazzCash

::tip
Pro is ${PRO_MONTHLY_PRICE} and Elite is ${ELITE_MONTHLY_PRICE}. Cancel anytime.
::`,
      },
      {
        id: 'founding-member', title: 'Plan Pricing',
        excerpt: 'Current pricing for Pro and Elite plans.',
        content: `## Current Pricing

- **Pro plan**: ${PRO_MONTHLY_PRICE}
- **Elite plan**: ${ELITE_MONTHLY_PRICE}
- Billed monthly. Cancel anytime.

## What's Included

**Pro (${PRO_MONTHLY_PRICE}):** Unlimited journal entries, 50 AI analyses/month, real-time markets, full economic calendar, macro intelligence tools.

**Elite (${ELITE_MONTHLY_PRICE}):** Everything in Pro, plus unlimited AI analyses, monthly Trading DNA Report, beta feature early access, and priority support.

## How to Upgrade

Click **Upgrade Plan**, pick your plan, and complete payment in the in-app modal. No redirects required.`,
      },
      {
        id: 'refund-policy', title: 'Refund Policy',
        excerpt: '7-day money-back guarantee, no questions asked.',
        content: `## 7-Day Money Back Guarantee

If you are not satisfied within the first 7 days of your subscription we will refund your payment in full. No questions asked.

## How to Request a Refund

Contact **support@zynth.com** with:
- Subject: \`Refund Request\`
- Include your registered email and reason (optional)

Processing time: 3-5 business days

## After 7 Days

Refunds are not available after the 7-day period. However you can cancel your subscription at any time and you will retain access until the end of your billing period.`,
      },
      {
        id: 'free-limits', title: 'Free Plan Limits Explained',
        excerpt: 'Understand exactly what happens when you hit each Free plan limit.',
        content: `## Journal: 5 Trades Maximum

When you reach 5 trades you will see a limit message when trying to add more. Upgrade to Pro for unlimited entries.

## AI Analysis: 2 Lifetime Tries

Each time you click the AI analysis button on a trade it uses 1 try. Free users get 2 tries total (not monthly). Upgrade to Pro for 50/month.

## Economic Calendar: Today Only

Free users see today's US High and Medium impact events only. No access to past or future events. No non-US events.

## Live Markets: 15-Minute Delay

Free users see prices delayed by 15 minutes. Pro/Elite users get real-time streaming.

**To upgrade:** Profile -> Upgrade Plan`,
      },
    ],
  },
  {
    key: 'account', icon: Settings, color: '#64748b', title: 'Account & Settings',
    description: 'Security, timezone, profile customization, and display preferences.',
    articles: [
      {
        id: 'account-security', title: 'Account Security',
        excerpt: 'Password best practices, Google Sign-In, and what to do if compromised.',
        content: `## Password Security

- Use a strong password (8+ characters)
- Mix letters, numbers and symbols
- Never share your password
- Change it regularly via Profile

## Google Sign-In

If you signed up with Google, your account uses Google's security. Enable 2FA on your Google account for maximum security. You can set a password via **Forgot Password** on the login page.

## Data Privacy

- Your journal data is private to you
- We never share trading data
- Screenshots are stored securely

::warning
If your account is compromised, email support@zynth.com immediately with subject "Account Security Issue".
::`,
      },
      {
        id: 'timezone', title: 'Timezone Settings',
        excerpt: 'Change your timezone and see what it affects across the app.',
        content: `## How to Change Timezone

Click the timezone button in the top header bar (shows current zone like \`PKT\`) and select from the available timezones:

| Zone | Name | Offset |
|---|---|---|
| PKT | Pakistan Standard Time | UTC+5 |
| EST | Eastern Standard Time | UTC-5 |
| EDT | Eastern Daylight Time | UTC-4 |
| UTC | Coordinated Universal Time | UTC+0 |
| GMT | Greenwich Mean Time | UTC+0 |
| CST | Central Standard Time | UTC-6 |
| PST | Pacific Standard Time | UTC-8 |
| JST | Japan Standard Time | UTC+9 |
| IST | India Standard Time | UTC+5:30 |

## What Timezone Affects

- Economic Calendar event times
- Market session open/close times
- Daily Brief time-based greetings
- Trading activity heatmap hours
- Market Hours tool in Trading Desk

Your timezone preference is saved automatically across sessions.`,
      },
      {
        id: 'profile-customization', title: 'Profile Customization',
        excerpt: 'Set your display name, upload an avatar photo, or choose an avatar color.',
        content: `## Display Name

Set during onboarding or change via Profile -> display name field. Shown in the header and greetings.

## Avatar Photo

Click the camera icon on your avatar -> upload image from device (max 2MB). Supported formats: JPG, PNG, GIF. Square images work best.

## Avatar Color

If no photo is uploaded, choose from 8 color options for your initial circle: Emerald, Blue, Purple, Gold, Red, Pink, Orange, Teal.

## Plan Badge

Automatically shows FREE, PRO, ELITE or ADMIN based on your subscription. Visible in header and sidebar.

## Onboarding Data

Trading experience, markets traded and goals set during onboarding are used to personalize AI coaching.`,
      },
      {
        id: 'notifications', title: 'App Theme & Display',
        excerpt: 'Switch between dark and light mode and adjust display preferences.',
        content: `## Theme Toggle

Zynth supports both Dark and Light modes. Click the sun/moon icon in the header to toggle.

Dark mode is the default and recommended for trading (easier on the eyes during long sessions).

## Sidebar

The sidebar can be collapsed to give you more screen space. Click the collapse/expand arrow in the sidebar header to collapse it. Click again to expand.

When collapsed, only icons are shown - hover to see labels.`,
      },
    ],
  },
  {
    key: 'privacy', icon: Shield, color: '#64748b', title: 'Privacy & Legal',
    description: 'Privacy policy, terms of service, and risk disclaimer.',
    articles: [
      {
        id: 'privacy-policy', title: 'Privacy Policy',
        excerpt: 'What data we collect, how we use it, and how to delete your account.',
        content: `## What Data We Collect

- Email address (for account)
- Display name
- Trade journal entries you create
- Screenshots you upload
- Onboarding preferences
- Usage analytics (anonymous)

## What We Do NOT Collect

- Real broker account data
- Real money or financial data
- Location data
- Browsing history

## How We Use Your Data

- To provide the Zynth service
- To generate AI analysis of YOUR trades
- To send account emails (password reset etc.)
- We never sell data to third parties
- We never share data with advertisers

## Data Storage

- Stored on secure servers
- Encrypted in transit (TLS)
- You can request deletion anytime

## Data Deletion

Email **support@zynth.com** to delete your account and all data.`,
      },
      {
        id: 'terms-summary', title: 'Terms of Service Summary',
        excerpt: 'Key points from the full Terms of Service in plain English.',
        content: `## Key Points

**1. Zynth is a software tool only**
Not a financial advisor or broker.

**2. AI analysis may contain errors**
Do not make trading decisions solely based on AI output.

**3. Market data may be delayed or inaccurate**
Always verify with your broker.

**4. Trading involves risk of loss**
Never trade money you cannot afford to lose.

**5. Zynth is not liable for trading losses**
You trade entirely at your own risk.

**6. Your data is private**
We never sell or share your data.

For full terms visit the **Terms of Service** page linked in the footer.`,
      },
      {
        id: 'risk-disclaimer', title: 'Risk Disclaimer',
        excerpt: 'Important risk warning all traders must understand.',
        content: `## IMPORTANT RISK WARNING

Trading foreign exchange, gold, cryptocurrencies and other financial instruments involves substantial risk of loss and is not appropriate for all investors.

## Key Risks

- You can lose your entire investment
- Leverage amplifies both profits and losses
- Past performance does not guarantee future results
- Market conditions can change rapidly
- Economic data releases cause high volatility

## Regarding Zynth Specifically

::warning
- AI analysis is algorithmic and can be wrong
- Macro Score is an indicator, not a trading signal
- Economic data may have delays or errors
- Chart data is from third-party providers
::

## Before Trading

- Understand how the instrument works
- Only use money you can afford to lose
- Consider seeking independent financial advice
- Understand tax implications in your country

**Zynth does not provide investment advice. All content is for educational and informational purposes only.**`,
      },
    ],
  },
];

// -- Flatten all articles for search -----------------------------------------
const ALL_ARTICLES = CATEGORIES.flatMap(cat =>
  cat.articles.map(art => ({ ...art, categoryKey: cat.key, categoryTitle: cat.title, categoryColor: cat.color, categoryIcon: cat.icon }))
);

const POPULAR_ARTICLE_IDS = ['welcome', 'first-trade', 'ai-analysis', 'how-to-upgrade', 'timezone'];

// -- Markdown-like renderer ----------------------------------------------------
function RenderContent({ content, theme }) {
  const surface2 = theme.isDark ? '#1a2436' : '#fafaf9';
  const border   = theme.border;

  const lines = content.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Tip/Warning box
    if (line.startsWith('::tip') || line.startsWith('::warning')) {
      const isWarn = line.startsWith('::warning');
      const boxLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('::')) {
        boxLines.push(lines[i]);
        i++;
      }
      elements.push(
        <div key={i} style={{
          borderLeft: `3px solid ${isWarn ? '#f59e0b' : '#CA8A04'}`,
          background: isWarn ? 'rgba(245,158,11,0.08)' : 'rgba(202,138,4,0.08)',
          borderRadius: '0 8px 8px 0',
          padding: '10px 16px',
          margin: '14px 0',
        }}>
          {boxLines.map((bl, j) => <p key={j} style={{ color: theme.text, fontSize: 14, lineHeight: 1.65, margin: j > 0 ? '4px 0 0' : 0 }}>{bl}</p>)}
        </div>
      );
      i++;
      continue;
    }

    // Table
    if (line.startsWith('|')) {
      const tableRows = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        if (!lines[i].match(/^\|[-| ]+\|$/)) {
          const cols = lines[i].split('|').filter(c => c.trim() !== '');
          tableRows.push(cols);
        }
        i++;
      }
      const isHeader = tableRows.length >= 2;
      elements.push(
        <div key={i} style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', margin: '14px 0' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 620 }}>
            <thead>
              <tr>{(tableRows[0] || []).map((c, j) => (
                <th key={j} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: theme.muted, borderBottom: `2px solid #CA8A04`, whiteSpace: 'nowrap' }}>{c.trim()}</th>
              ))}</tr>
            </thead>
            <tbody>
              {tableRows.slice(isHeader ? 1 : 0).map((row, ri) => (
                <tr key={ri} style={{ background: ri % 2 === 1 ? (theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)') : 'transparent' }}>
                  {row.map((c, j) => (
                    <td key={j} style={{ padding: '8px 12px', fontSize: 14, color: theme.text, borderBottom: `1px solid ${border}` }}>{renderInline(c.trim(), theme)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Code block
    if (line.startsWith('```')) {
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={i} style={{ background: surface2, border: `1px solid ${border}`, borderRadius: 8, padding: '12px 16px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', fontFamily: 'monospace', fontSize: 13, color: theme.text, margin: '14px 0' }}>
          {codeLines.join('\n')}
        </pre>
      );
      i++;
      continue;
    }

    // H2
    if (line.startsWith('## ')) {
      elements.push(<h2 key={i} style={{ color: theme.text, fontWeight: 700, fontSize: 18, marginTop: 28, marginBottom: 10, paddingBottom: 6, borderBottom: `1px solid ${border}` }}>{line.slice(3)}</h2>);
      i++; continue;
    }
    // H3
    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} style={{ color: theme.text, fontWeight: 600, fontSize: 16, marginTop: 20, marginBottom: 8 }}>{line.slice(4)}</h3>);
      i++; continue;
    }
    // Blank line
    if (line.trim() === '') { i++; continue; }

    // Numbered list block
    if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ''));
        i++;
      }
      elements.push(
        <ol key={i} style={{ paddingLeft: 22, margin: '10px 0' }}>
          {items.map((it, j) => <li key={j} style={{ color: theme.text, fontSize: 15, lineHeight: 1.7, marginBottom: 4 }}>{renderInline(it, theme)}</li>)}
        </ol>
      );
      continue;
    }

    // Bullet list block
    if (line.startsWith('- ')) {
      const items = [];
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={i} style={{ paddingLeft: 22, margin: '10px 0', listStyle: 'disc' }}>
          {items.map((it, j) => <li key={j} style={{ color: theme.text, fontSize: 15, lineHeight: 1.7, marginBottom: 4 }}>{renderInline(it, theme)}</li>)}
        </ul>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={i} style={{ borderLeft: `3px solid ${border}`, paddingLeft: 14, margin: '12px 0', color: theme.muted, fontStyle: 'italic', fontSize: 14 }}>
          {renderInline(line.slice(2), theme)}
        </blockquote>
      );
      i++; continue;
    }

    // Normal paragraph
    elements.push(<p key={i} style={{ color: theme.text, fontSize: 15, lineHeight: 1.75, margin: '8px 0' }}>{renderInline(line, theme)}</p>);
    i++;
  }
  return <>{elements}</>;
}

function renderInline(text, theme) {
  // bold **x**, inline code `x`, and normal text
  const parts = [];
  const re = /(\*\*(.+?)\*\*|`([^`]+)`)/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[2]) parts.push(<strong key={m.index} style={{ fontWeight: 700 }}>{m[2]}</strong>);
    else if (m[3]) parts.push(<code key={m.index} style={{ fontFamily: 'monospace', fontSize: 13, background: theme.isDark ? theme.surface2 : '#fafaf9', padding: '1px 6px', borderRadius: 4, color: '#CA8A04' }}>{m[3]}</code>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length > 1 ? parts : text;
}
// -- Main Component ------------------------------------------------------------
export default function HelpCenter() {
  const theme = useTheme();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedArticle,  setSelectedArticle]  = useState(null);
  const [query, setQuery] = useState('');
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 900);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 899px)');
    setIsMobile(mq.matches);
    const handler = (e) => { setIsMobile(e.matches); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const isDark    = theme.isDark !== false;
  const bg0       = theme.bg;
  const bg1       = theme.surface;
  const border    = theme.border;
  const text0     = theme.text;
  const textMuted = theme.muted;
  const accent    = '#CA8A04';

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return ALL_ARTICLES.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.excerpt.toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q)
    ).slice(0, 14);
  }, [query]);

  const currentCategory = CATEGORIES.find(c => c.key === selectedCategory);
  const currentArticle  = selectedArticle ? ALL_ARTICLES.find(a => a.id === selectedArticle) : null;

  const openArticle = (articleId, catKey) => {
    setSelectedArticle(articleId);
    if (catKey) setSelectedCategory(catKey);
    setQuery('');
  };

  const backToCategory = () => setSelectedArticle(null);
  const backToHome     = () => { setSelectedArticle(null); setSelectedCategory(null); setQuery(''); };
  const totalArticles  = ALL_ARTICLES.length;
  const popularArticles = POPULAR_ARTICLE_IDS.map(id => ALL_ARTICLES.find(a => a.id === id)).filter(Boolean);

  const feedbackActions = [
    { key: 'feature', title: 'Request a Feature',  description: 'Share product ideas and workflow improvements.', icon: Lightbulb,    color: '#f59e0b', href: 'mailto:support@zynth.com?subject=Feature%20Request' },
    { key: 'bug',     title: 'Report a Bug',        description: 'Send issues, screenshots and steps to reproduce.', icon: Bug,      color: '#ef4444', href: 'mailto:support@zynth.com?subject=Bug%20Report' },
    { key: 'product', title: 'General Feedback',    description: "Tell us what's confusing or should improve.",  icon: MessageSquare, color: '#CA8A04', href: 'mailto:support@zynth.com?subject=Product%20Feedback' },
  ];

  return (
    <div style={{ display: 'flex', height: '100%', background: bg0, minHeight: 0 }}>

      {/* -- Main panel -- */}
      <main style={{ flex: 1, minWidth: 0, height: '100%', overflowY: 'auto', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>

        {/* Mobile top bar */}
        {isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: `1px solid ${border}`, background: bg0, position: 'sticky', top: 0, zIndex: 10, flexShrink: 0 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: textMuted, pointerEvents: 'none' }} />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search..."
                style={{ width: '100%', padding: '8px 10px 8px 30px', borderRadius: 8, border: `1px solid ${border}`, background: bg1, color: text0, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => { e.target.style.borderColor = accent; e.target.style.boxShadow = '0 0 0 3px rgba(202,138,4,0.14)'; }}
                onBlur={e => { e.target.style.borderColor = border; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          </div>
        )}

        {/* -------------------------------------------
            ARTICLE VIEW
        ------------------------------------------- */}
        {currentArticle && (
          <div style={{ maxWidth: 780, margin: '0 auto', padding: isMobile ? '24px 16px 80px' : '44px 52px 96px', width: '100%' }}>

            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 28, flexWrap: 'wrap' }}>
              <button onClick={backToHome} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, fontSize: 13, padding: 0, fontWeight: 500 }}>Help</button>
              <ChevronRight size={13} color={textMuted} />
              <button onClick={backToCategory} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, fontSize: 13, padding: 0, fontWeight: 500 }}>{currentCategory?.title}</button>
              <ChevronRight size={13} color={textMuted} />
              <span style={{ color: text0, fontSize: 13, fontWeight: 600 }}>{currentArticle.title}</span>
            </div>

            {/* Category badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: `${currentCategory?.color || accent}14`, border: `1px solid ${currentCategory?.color || accent}28`, marginBottom: 14 }}>
              {currentCategory && <currentCategory.icon size={12} color={currentCategory.color} />}
              <span style={{ color: currentCategory?.color || accent, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{currentCategory?.title}</span>
            </div>

            {/* Title */}
            <h1 style={{ color: text0, fontWeight: 800, fontSize: isMobile ? 26 : 34, lineHeight: 1.15, margin: '0 0 12px', letterSpacing: '-0.03em' }}>
              {currentArticle.title}
            </h1>
            <p style={{ color: textMuted, fontSize: 16, margin: '0 0 0', lineHeight: 1.65 }}>
              {currentArticle.excerpt}
            </p>

            <div style={{ height: 1, background: border, margin: '28px 0 36px' }} />

            {/* Content */}
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <RenderContent content={currentArticle.content} theme={{ ...theme, isDark, text: text0, muted: textMuted, border }} />
            </div>

            {/* Related articles */}
            {currentCategory && currentCategory.articles.filter(a => a.id !== currentArticle.id).length > 0 && (
              <div style={{ marginTop: 60, paddingTop: 28, borderTop: `1px solid ${border}` }}>
                <div style={{ color: textMuted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 14 }}>
                  More in {currentCategory.title}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {currentCategory.articles.filter(a => a.id !== currentArticle.id).map(art => (
                    <button
                      key={art.id}
                      onClick={() => openArticle(art.id, currentCategory.key)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '13px 16px', borderRadius: 10, background: bg1, border: `1px solid ${border}`, cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s, background 0.15s, transform 0.15s' }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.background = isDark ? 'rgba(202,138,4,0.04)' : 'rgba(202,138,4,0.02)'; e.currentTarget.style.transform = 'translateX(3px)'; }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.background = bg1; e.currentTarget.style.transform = 'translateX(0)'; }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ color: text0, fontSize: 14, fontWeight: 600, marginBottom: 3, lineHeight: 1.35, wordBreak: 'break-word' }}>{art.title}</div>
                        <div style={{ color: textMuted, fontSize: 12, lineHeight: 1.5 }}>{art.excerpt}</div>
                      </div>
                      <ChevronRight size={15} color={textMuted} style={{ flexShrink: 0 }} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Still need help CTA */}
            <div style={{ marginTop: 52, padding: '20px 24px', borderRadius: 14, background: isDark ? 'rgba(202,138,4,0.06)' : 'rgba(202,138,4,0.04)', border: '1px solid rgba(202,138,4,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ color: text0, fontWeight: 700, fontSize: 14, marginBottom: 3 }}>Still need help?</div>
                <div style={{ color: textMuted, fontSize: 13 }}>Our support team typically replies within 24 hours.</div>
              </div>
              <a href="mailto:support@zynth.com" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 8, background: accent, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', flexShrink: 0, transition: 'opacity 0.15s' }} onMouseOver={e => { e.currentTarget.style.opacity = '0.88'; }} onMouseOut={e => { e.currentTarget.style.opacity = '1'; }}>
                <Mail size={14} />
                Contact Support
              </a>
            </div>
          </div>
        )}

        {/* -------------------------------------------
            CATEGORY VIEW
        ------------------------------------------- */}
        {!currentArticle && currentCategory && (
          <div style={{ maxWidth: 860, margin: '0 auto', padding: isMobile ? '24px 16px 80px' : '44px 52px 96px', width: '100%' }}>

            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 28, flexWrap: 'wrap' }}>
              <button onClick={backToHome} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, fontSize: 13, padding: 0, fontWeight: 500 }}>Help</button>
              <ChevronRight size={13} color={textMuted} />
              <span style={{ color: text0, fontSize: 13, fontWeight: 600 }}>{currentCategory.title}</span>
            </div>

            {/* Category header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, marginBottom: 8 }}>
              <div style={{ width: 54, height: 54, borderRadius: 15, background: `${currentCategory.color}18`, border: `1px solid ${currentCategory.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <currentCategory.icon size={26} color={currentCategory.color} />
              </div>
              <div>
                <h1 style={{ color: text0, fontWeight: 800, fontSize: isMobile ? 24 : 30, margin: 0, letterSpacing: '-0.02em' }}>{currentCategory.title}</h1>
                <p style={{ color: textMuted, fontSize: 14, margin: '6px 0 0', lineHeight: 1.65 }}>{currentCategory.description}</p>
              </div>
            </div>
            <div style={{ height: 1, background: border, margin: '22px 0 30px' }} />

            {/* Articles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {currentCategory.articles.map((art, idx) => (
                <button
                  key={art.id}
                  onClick={() => openArticle(art.id, currentCategory.key)}
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderRadius: 12, background: bg1, border: `1px solid ${border}`, cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.15s' }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.boxShadow = `0 4px 20px rgba(202,138,4,0.1)`; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${currentCategory.color}14`, border: `1px solid ${currentCategory.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: currentCategory.color, fontSize: 13, fontWeight: 700 }}>
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: text0, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{art.title}</div>
                    <div style={{ color: textMuted, fontSize: 13, lineHeight: 1.5 }}>{art.excerpt}</div>
                  </div>
                  <ChevronRight size={16} color={textMuted} style={{ flexShrink: 0 }} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* -------------------------------------------
            SEARCH RESULTS
        ------------------------------------------- */}
        {!currentArticle && !currentCategory && query.trim() !== '' && (
          <div style={{ maxWidth: 860, margin: '0 auto', padding: isMobile ? '24px 16px 80px' : '44px 52px 96px', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
              <div>
                <h1 style={{ color: text0, fontWeight: 800, fontSize: 26, letterSpacing: '-0.02em', margin: '0 0 6px' }}>Search Results</h1>
                <div style={{ color: textMuted, fontSize: 14 }}>
                  <strong style={{ color: text0 }}>{searchResults.length}</strong> result{searchResults.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
                </div>
              </div>
              <button onClick={() => setQuery('')} style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${border}`, background: bg1, color: textMuted, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                Clear
              </button>
            </div>

            {searchResults.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 28px', background: bg1, border: `1px solid ${border}`, borderRadius: 16 }}>
                <div style={{ width: 50, height: 50, margin: '0 auto 14px', borderRadius: 14, background: 'rgba(202,138,4,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Search size={22} color={accent} />
                </div>
                <div style={{ color: text0, fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No results found</div>
                <div style={{ color: textMuted, fontSize: 14, lineHeight: 1.65, marginBottom: 14 }}>Try different keywords, or contact support directly.</div>
                <a href="mailto:support@zynth.com" style={{ color: accent, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>support@zynth.com</a>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {searchResults.map(art => (
                  <button
                    key={art.id}
                    onClick={() => openArticle(art.id, art.categoryKey)}
                    style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderRadius: 12, background: bg1, border: `1px solid ${border}`, cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s, box-shadow 0.15s' }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.boxShadow = isDark ? '0 8px 24px rgba(2,6,23,0.3)' : '0 8px 20px rgba(15,23,42,0.07)'; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6, flexWrap: 'wrap' }}>
                        {art.categoryIcon && <art.categoryIcon size={12} color={art.categoryColor ?? textMuted} style={{ flexShrink: 0 }} />}
                        <span style={{ color: art.categoryColor ?? textMuted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{art.categoryTitle}</span>
                      </div>
                      <div style={{ color: text0, fontSize: 15, fontWeight: 700, marginBottom: 5 }}>{art.title}</div>
                      <div style={{ color: textMuted, fontSize: 13, lineHeight: 1.55 }}>{art.excerpt}</div>
                    </div>
                    <ChevronRight size={15} color={textMuted} style={{ flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------
            HOME VIEW
        ------------------------------------------- */}
        {!currentArticle && !currentCategory && query.trim() === '' && (
          <div style={{ maxWidth: 920, margin: '0 auto', padding: isMobile ? '24px 16px 80px' : '44px 48px 96px', width: '100%' }}>

            {/* Hero banner */}
            <div style={{
              background: isDark ? 'linear-gradient(135deg, rgba(21,33,69,0.97) 0%, rgba(10,14,29,0.99) 60%, rgba(4,10,24,1) 100%)' : 'linear-gradient(135deg, #eff6ff 0%, #f8fbff 100%)',
              border: `1px solid ${isDark ? 'rgba(202,138,4,0.2)' : 'rgba(202,138,4,0.14)'}`,
              borderRadius: isMobile ? 16 : 22,
              padding: isMobile ? '28px 20px' : '42px 44px',
              marginBottom: 32,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg, #CA8A04, #EAB308)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 28px rgba(161,98,7,0.28)', flexShrink: 0 }}>
                  <LifeBuoy size={26} color="#fff" />
                </div>
                <div>
                  <div style={{ color: isDark ? 'rgba(148,163,184,0.86)' : '#64748b', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Support Center</div>
                  <h1 style={{ color: text0, fontWeight: 800, fontSize: isMobile ? 26 : 38, lineHeight: 1.1, margin: 0, letterSpacing: '-0.03em' }}>
                    How can we help?
                  </h1>
                </div>
              </div>
              <p style={{ color: isDark ? 'rgba(226,232,240,0.78)' : '#52637a', fontSize: isMobile ? 14 : 16, lineHeight: 1.7, margin: '0 0 22px', maxWidth: 540 }}>
                Find answers quickly, explore product guides, and contact the Zynth team when you need direct help.
              </p>

              {/* Hero search */}
              <div style={{ position: 'relative', maxWidth: 580 }}>
                <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: textMuted, pointerEvents: 'none' }} />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search guides, billing, analytics, settings..."
                  style={{
                    width: '100%',
                    padding: '14px 120px 14px 48px',
                    borderRadius: 12,
                    border: `1px solid ${isDark ? 'rgba(148,163,184,0.18)' : border}`,
                    background: isDark ? 'rgba(6,10,22,0.82)' : '#ffffff',
                    color: text0,
                    fontSize: 15,
                    outline: 'none',
                    boxSizing: 'border-box',
                    boxShadow: isDark ? '0 8px 28px rgba(2,6,23,0.32)' : '0 8px 22px rgba(15,23,42,0.07)',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                  onFocus={e => { e.target.style.borderColor = accent; e.target.style.boxShadow = `0 0 0 3px rgba(202,138,4,0.15), ${isDark ? '0 8px 28px rgba(2,6,23,0.32)' : '0 8px 22px rgba(15,23,42,0.07)'}`; }}
                  onBlur={e => { e.target.style.borderColor = isDark ? 'rgba(148,163,184,0.18)' : border; e.target.style.boxShadow = isDark ? '0 8px 28px rgba(2,6,23,0.32)' : '0 8px 22px rgba(15,23,42,0.07)'; }}
                />
                <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}>
                    <Clock3 size={11} color={textMuted} />
                    <span style={{ color: textMuted, fontSize: 11, fontWeight: 600 }}>24hr response</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Popular articles */}
            <div style={{ marginBottom: 36 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Star size={14} color={accent} />
                <span style={{ color: text0, fontWeight: 700, fontSize: 15 }}>Popular Guides</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
                {popularArticles.map(art => {
                  const cat = CATEGORIES.find(c => c.key === art.categoryKey);
                  return (
                    <button
                      key={art.id}
                      onClick={() => openArticle(art.id, art.categoryKey)}
                      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, background: bg1, border: `1px solid ${border}`, cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.15s' }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.boxShadow = `0 4px 18px rgba(202,138,4,0.1)`; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: `${cat?.color || accent}14`, border: `1px solid ${cat?.color || accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {cat && <cat.icon size={18} color={cat.color} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: text0, fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{art.title}</div>
                        <div style={{ color: textMuted, fontSize: 12, lineHeight: 1.5, wordBreak: 'break-word' }}>{art.excerpt}</div>
                      </div>
                      <ChevronRight size={14} color={textMuted} style={{ flexShrink: 0 }} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Browse topics grid */}
            <div style={{ marginBottom: 36 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ color: text0, fontWeight: 700, fontSize: 15 }}>Browse by Topic</span>
                <span style={{ color: textMuted, fontSize: 12 }}>{totalArticles} articles total</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 12 }}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.key}
                    onClick={() => { setSelectedCategory(cat.key); setSelectedArticle(null); }}
                    style={{ textAlign: 'left', padding: '18px 16px', borderRadius: 14, background: bg1, border: `1px solid ${border}`, cursor: 'pointer', transition: 'border-color 0.18s, box-shadow 0.18s, transform 0.18s' }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = cat.color; e.currentTarget.style.boxShadow = `0 6px 22px ${cat.color}20`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 11, background: `${cat.color}16`, border: `1px solid ${cat.color}26`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                      <cat.icon size={20} color={cat.color} />
                    </div>
                    <div style={{ color: text0, fontWeight: 700, fontSize: 13, marginBottom: 5 }}>{cat.title}</div>
                    <div style={{ color: textMuted, fontSize: 11, lineHeight: 1.55, marginBottom: 8 }}>{cat.description}</div>
                    <div style={{ color: cat.color, fontSize: 11, fontWeight: 700 }}>{cat.articles.length} articles →</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Contact & Feedback */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>

              {/* Contact Support */}
              <div style={{ background: bg1, border: `1px solid ${border}`, borderRadius: 16, padding: '24px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(202,138,4,0.12)', border: '1px solid rgba(202,138,4,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Mail size={18} color={accent} />
                  </div>
                  <div>
                    <div style={{ color: text0, fontSize: 16, fontWeight: 800 }}>Contact Support</div>
                    <div style={{ color: textMuted, fontSize: 13, marginTop: 2 }}>Replies within 24 hours</div>
                  </div>
                </div>
                <a
                  href="mailto:support@zynth.com"
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 10, textDecoration: 'none', background: isDark ? 'rgba(15,23,42,0.6)' : '#f8fbff', border: '1px solid rgba(202,138,4,0.16)', marginBottom: 12, transition: 'border-color 0.15s' }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = accent; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(202,138,4,0.16)'; }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(135deg, #CA8A04, #EAB308)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Mail size={18} color="#fff" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: text0, fontWeight: 700, fontSize: 14 }}>support@zynth.com</div>
                    <div style={{ color: textMuted, fontSize: 12, marginTop: 2 }}>General support and account help</div>
                  </div>
                  <ArrowUpRight size={16} color={textMuted} />
                </a>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[{ label: 'Billing & Plans', desc: 'Upgrades, payments, refunds' }, { label: 'Account Setup', desc: 'Timezone, theme, profile' }].map(item => (
                    <div key={item.label} style={{ padding: '12px 14px', borderRadius: 10, background: isDark ? 'rgba(10,14,24,0.7)' : '#f8fbff', border: `1px solid ${isDark ? 'rgba(148,163,184,0.1)' : 'rgba(148,163,184,0.18)'}` }}>
                      <div style={{ color: text0, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{item.label}</div>
                      <div style={{ color: textMuted, fontSize: 12, lineHeight: 1.5 }}>{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feedback */}
              <div style={{ background: bg1, border: `1px solid ${border}`, borderRadius: 16, padding: '24px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MessageSquare size={18} color="#CA8A04" />
                  </div>
                  <div>
                    <div style={{ color: text0, fontSize: 16, fontWeight: 800 }}>Feedback & Ideas</div>
                    <div style={{ color: textMuted, fontSize: 13, marginTop: 2 }}>Help shape the product</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {feedbackActions.map(action => (
                    <a
                      key={action.key}
                      href={action.href}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, border: `1px solid ${border}`, background: isDark ? 'rgba(10,14,24,0.7)' : '#f8fbff', textDecoration: 'none', transition: 'border-color 0.15s, transform 0.15s' }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = action.color; e.currentTarget.style.transform = 'translateX(3px)'; }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.transform = 'translateX(0)'; }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${action.color}14`, border: `1px solid ${action.color}26`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <action.icon size={17} color={action.color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: text0, fontSize: 14, fontWeight: 700 }}>{action.title}</div>
                        <div style={{ color: textMuted, fontSize: 12, marginTop: 2 }}>{action.description}</div>
                      </div>
                      <ChevronRight size={14} color={textMuted} style={{ flexShrink: 0 }} />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

