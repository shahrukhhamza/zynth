import { ArrowLeft, BarChart2, BookOpen, Brain, Camera, Calendar, TrendingUp, Bot, Activity, ClipboardCheck, Layers, Bell } from 'lucide-react';

const SERVICES = [
  {
    Icon: BookOpen,
    number: '01',
    name: 'AI-Powered Trade Journal',
    tagline: 'Log, review, and grow from every trade',
    color: '#3b82f6',
    bg: 'rgba(16,185,129,0.07)',
    border: 'rgba(16,185,129,0.2)',
    desc: 'A professional-grade digital trade journal that stores your complete trading history. Log entries manually or import from screenshots. Add notes, emotions, strategy tags, and session context. Gain a full picture of your trading behavior over time.',
    features: [
      'Unlimited trade entries (Pro & Elite)',
      'Manual entry with all key fields (pair, direction, entry/exit, PnL, session, notes)',
      'Strategy and emotion tagging',
      'Searchable and filterable trade history',
      'AI-generated macro context per trade',
    ],
    plans: ['Free (10 entries)', 'Pro (Unlimited)', 'Elite (Unlimited)'],
  },
  {
    Icon: Brain,
    number: '02',
    name: 'AI Trade Analysis Reports',
    tagline: 'Personalized coaching powered by AI',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.07)',
    border: 'rgba(139,92,246,0.2)',
    desc: 'Our AI reads through your complete trade history and journal entries to surface hidden patterns, identify recurring mistakes, and build a personalized improvement plan. Each report is unique to your trading style and data.',
    features: [
      'Full trade history pattern analysis',
      'Blind spot and behavioral bias detection',
      'Win rate by session, pair, and strategy',
      'Personalized coaching recommendations',
      'Emotional trading pattern analysis',
    ],
    plans: ['Free (3 tries)', 'Pro (50/month)', 'Elite (Unlimited)'],
  },
  {
    Icon: Camera,
    number: '03',
    name: 'Screenshot OCR Trade Import',
    tagline: 'Import trades from any broker in seconds',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.07)',
    border: 'rgba(245,158,11,0.2)',
    desc: 'Upload a screenshot of your MT5 or broker trading history and our AI automatically extracts all your trades using optical character recognition (OCR). No manual data entry needed — get a full AI performance review instantly.',
    features: [
      'Supports MT5, MT4, and most broker interfaces',
      'Automatic trade data extraction via OCR',
      'AI performance analysis on extracted trades',
      'Statistical breakdown: win rate, best pairs, worst sessions',
      'Recommendations based on your screenshot data',
    ],
    plans: ['Free (2 analyses)', 'Pro (35/month)', 'Elite (Unlimited)'],
  },
  {
    Icon: BarChart2,
    number: '04',
    name: 'Macro Surprise Score & Economic Intelligence',
    tagline: 'Know the macro before you trade',
    color: '#0ea5e9',
    bg: 'rgba(14,165,233,0.07)',
    border: 'rgba(14,165,233,0.2)',
    desc: 'A proprietary -10 to +10 Macro Surprise Score that aggregates 10 major US economic releases to give you an instant read on whether macro conditions are bullish or bearish for gold and risk assets. Updated automatically from official government sources.',
    features: [
      'Real-time score from NFP, CPI, PMI, GDP, Retail Sales, and more',
      'FRED-sourced actual data (most authoritative)',
      'Bullish/bearish signal with full breakdown',
      'Historical score comparison',
      'AI-generated macro narrative with coaching insight',
    ],
    plans: ['Pro', 'Elite'],
  },
  {
    Icon: Calendar,
    number: '05',
    name: 'Economic Calendar',
    tagline: 'Never miss a high-impact release',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.07)',
    border: 'rgba(239,68,68,0.2)',
    desc: 'A real-time economic calendar showing upcoming and recent data releases with impact ratings, consensus forecasts, and actual values. Filter by currency, impact level, or date range to focus on what matters for your trades.',
    features: [
      'Full global economic calendar (USD, EUR, GBP, JPY, AUD, CAD, and more)',
      'Impact rating: High / Medium / Low',
      'Actual vs Forecast vs Previous comparison',
      'Filter by currency pair and date range',
      'Beat/miss indicator with directional bias',
    ],
    plans: ['Free', 'Pro', 'Elite'],
  },
  {
    Icon: TrendingUp,
    number: '06',
    name: 'Live Market Data & Price Feeds',
    tagline: 'Real-time prices for the markets you trade',
    color: '#3b82f6',
    bg: 'rgba(16,185,129,0.07)',
    border: 'rgba(16,185,129,0.2)',
    desc: 'Live and near-real-time price feeds for Forex, Gold, Crypto, US Stocks, and Indices. Monitor the markets you trade directly inside Zynth — alongside your charts, news, and economic data — for a complete trading context view.',
    features: [
      'Forex: EUR/USD, GBP/USD, USD/JPY, XAU/USD, and more',
      'Crypto: BTC, ETH, XRP, SOL, BNB',
      'US Stocks: AAPL, TSLA, NVDA, MSFT, AMZN, GOOGL',
      'Indices: S&P 500, NASDAQ, DJI',
      'Live price charts with multiple timeframes',
    ],
    plans: ['Free', 'Pro', 'Elite'],
  },
  {
    Icon: Bot,
    number: '07',
    name: 'Zynth AI Assistant',
    tagline: 'Your personal trading intelligence chatbot',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.07)',
    border: 'rgba(167,139,250,0.2)',
    desc: 'An AI chatbot embedded directly in the platform that has full context of your trade history, journal entries, and current macro conditions. Ask it about your performance, get trade coaching, or query the latest economic data — all in natural language.',
    features: [
      'Full access to your personal trade data and journals',
      'Real-time awareness of current macro conditions',
      'Market analysis and economic event interpretation',
      'Performance coaching and strategy feedback',
      'Natural language queries about your trading patterns',
    ],
    plans: ['Free (limited)', 'Pro', 'Elite'],
  },
  {
    Icon: Activity,
    number: '08',
    name: 'Macro Correlation Analysis',
    tagline: 'See how macro aligns with your trades',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.07)',
    border: 'rgba(249,115,22,0.2)',
    desc: "For every trade in your journal, Zynth automatically analyses whether the economic events on that day supported or opposed your trade direction, calculates an alignment score and confidence level, and generates a coaching narrative explaining the macro context.",
    features: [
      'Per-trade macro alignment rating (Aligned / Misaligned / Neutral)',
      'Alignment confidence score (0–100%)',
      'Session × alignment win-rate matrix',
      'Per-pair: aligned vs misaligned win rate comparison',
      'AI-generated 4-sentence coaching brief per trade',
    ],
    plans: ['Pro', 'Elite'],
  },
  {
    Icon: ClipboardCheck,
    number: '09',
    name: 'Pre-Trade Checklist',
    tagline: 'Build discipline before every entry',
    color: '#22d3ee',
    bg: 'rgba(34,211,238,0.07)',
    border: 'rgba(34,211,238,0.2)',
    desc: 'A customizable pre-trade checklist that enforces trading discipline before you enter a position. The checklist uses your own historical data to warn you when you are about to trade in a session or macro context where your win rate is historically low.',
    features: [
      'Customizable checklist items',
      'Historical win-rate warnings by session',
      'Macro condition awareness',
      'Strategy and risk management reminders',
    ],
    plans: ['Pro', 'Elite'],
  },
  {
    Icon: Layers,
    number: '10',
    name: 'Backtesting & Advanced Charts',
    tagline: 'Test strategies on historical data',
    color: '#6b7280',
    bg: 'rgba(107,114,128,0.07)',
    border: 'rgba(107,114,128,0.2)',
    desc: 'Integrated charting with backtesting capabilities. Test your trading strategies against historical price data, overlay economic event markers, and validate your setups before applying them in live markets.',
    features: [
      'Multi-timeframe charting',
      'Economic event overlays on charts',
      'Strategy backtesting module',
      'Performance statistics on backtested trades',
    ],
    plans: ['Pro', 'Elite'],
  },
];

export default function ServicesPage({ onBack }) {
  const handleBack = () => {
    if (onBack) { onBack(); } else { window.history.back(); }
  };

  return (
    <div style={{ backgroundColor: '#060a12', minHeight: '100vh', color: '#e2e8f0' }}>
      {/* Sticky header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        backgroundColor: 'rgba(6,10,18,0.95)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(16,185,129,0.15)',
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={handleBack} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b7280', fontSize: 13, cursor: 'pointer', background: 'none', border: 'none', padding: '4px 8px', borderRadius: 6 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#3b82f6')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}>
            <ArrowLeft size={15} /> Back
          </button>
          <div style={{ width: 1, height: 18, backgroundColor: 'rgba(107,114,128,0.4)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={16} style={{ color: '#3b82f6' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>Services</span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, #059669, #0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: '#fff' }}>Z</div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>ZYNTH</span>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '56px 24px 0' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 20, backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', marginBottom: 20 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6', letterSpacing: '0.08em' }}>TRADING INTELLIGENCE PLATFORM</span>
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: '#f1f5f9', marginBottom: 14, lineHeight: 1.2 }}>
            Everything You Need to Trade<br />
            <span style={{ color: '#3b82f6' }}>Smarter</span>
          </h1>
          <p style={{ fontSize: 15, color: '#6b7280', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
            Zynth combines AI-powered analysis, live market data, and economic intelligence into a single platform built for serious traders.
          </p>
        </div>

        {/* Services grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 80 }}>
          {SERVICES.map((svc) => {
            const Icon = svc.Icon;
            return (
              <div key={svc.number} style={{
                borderRadius: 14,
                border: `1px solid ${svc.border}`,
                backgroundColor: svc.bg,
                padding: '24px 28px',
                display: 'flex',
                gap: 24,
                alignItems: 'flex-start',
              }}>
                {/* Left: icon + number */}
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: svc.bg, border: `1px solid ${svc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={22} style={{ color: svc.color }} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, color: svc.color, letterSpacing: '0.06em', opacity: 0.6 }}>{svc.number}</span>
                </div>

                {/* Right: content */}
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: 12 }}>
                    <h2 style={{ fontSize: 17, fontWeight: 800, color: '#f1f5f9', marginBottom: 3 }}>{svc.name}</h2>
                    <p style={{ fontSize: 12, fontWeight: 600, color: svc.color, letterSpacing: '0.04em' }}>{svc.tagline}</p>
                  </div>
                  <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.7, marginBottom: 14 }}>{svc.desc}</p>

                  <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                    {/* Feature bullets */}
                    <ul style={{ flex: 2, minWidth: 200, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 4, margin: 0 }}>
                      {svc.features.map((f, i) => (
                        <li key={i} style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.6 }}>
                          <span style={{ color: svc.color, marginRight: 6 }}>✓</span>{f}
                        </li>
                      ))}
                    </ul>

                    {/* Plan availability */}
                    <div style={{ flexShrink: 0 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', letterSpacing: '0.06em', marginBottom: 6 }}>AVAILABLE ON</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {svc.plans.map((plan, i) => (
                          <span key={i} style={{ fontSize: 11, fontWeight: 600, color: svc.color, background: svc.bg, border: `1px solid ${svc.border}`, padding: '3px 10px', borderRadius: 6, whiteSpace: 'nowrap' }}>
                            {plan}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', padding: '40px 0 80px', borderTop: '1px solid rgba(16,185,129,0.1)' }}>
          <p style={{ fontSize: 15, color: '#9ca3af', marginBottom: 20 }}>Ready to trade with intelligence?</p>
          <a href="/"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 28px', borderRadius: 10,
              background: 'linear-gradient(135deg, #059669, #0d9488)',
              color: '#fff', fontWeight: 700, fontSize: 14,
              textDecoration: 'none', letterSpacing: '0.02em',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Get Started Free →
          </a>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid rgba(16,185,129,0.08)', padding: '24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap', marginBottom: 10 }}>
          {[['Terms of Service', '/terms'], ['Privacy Policy', '/privacy'], ['Refund Policy', '/refund-policy'], ['Service Policy', '/service-policy']].map(([label, href]) => (
            <a key={label} href={href} style={{ fontSize: 12, color: '#6b7280', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#3b82f6')}
              onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}>{label}</a>
          ))}
        </div>
        <p style={{ fontSize: 11, color: '#374151' }}>© 2026 Zynth. All rights reserved. Trading involves risk.</p>
      </div>
    </div>
  );
}


