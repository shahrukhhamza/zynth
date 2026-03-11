import { useState } from 'react';
import {
  TrendingUp, BarChart2, BookOpen, Shield, Zap, Brain, Users,
  Calendar, ChevronDown, ChevronUp, Check, ArrowRight, Menu, X,
  RefreshCw, Bot, Trophy, Activity, Bell, Star,
} from 'lucide-react';

const NAV_LINKS = ['Features', 'Pricing', 'FAQ'];

const PLANS = [
  {
    name: 'Free',
    monthly: 0, yearly: 0,
    desc: 'Perfect to get started',
    features: [
      'Up to 20 trades / month',
      'Manual trade entry',
      'Basic analytics & charts',
      'Economic calendar',
      'Community access',
    ],
    cta: 'Get Started Free',
    highlight: false,
  },
  {
    name: 'Pro',
    monthly: 12.99, yearly: 10.99,
    desc: 'For active traders',
    badge: 'MOST POPULAR',
    features: [
      'Unlimited trades',
      'MT4 / MT5 real-time sync',
      'AI-powered analysis',
      'Live market feeds',
      'Advanced journaling',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    highlight: true,
  },
  {
    name: 'Elite',
    monthly: 24.99, yearly: 19.99,
    desc: 'For professional traders',
    features: [
      'Everything in Pro',
      'Unlimited MT4/MT5 accounts',
      'Backtesting engine',
      'Custom AI reports',
      'Team collaboration',
      'Dedicated support',
    ],
    cta: 'Go Elite',
    highlight: false,
  },
];

const FAQS = [
  { q: 'What is Zynth?', a: 'Zynth is a professional trading intelligence platform that unifies economic data, live market feeds, MT5 sync, AI analysis, and trade journaling into one dashboard.' },
  { q: 'Is my data safe?', a: 'All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We never share or sell your trading data.' },
  { q: 'How does the MT5 sync work?', a: 'Install our lightweight bridge on your MT4/MT5 terminal. It connects securely and pushes your trades to Zynth in real time — no copy-pasting, ever.' },
  { q: 'Is there a free plan?', a: 'Absolutely. The Free plan supports up to 20 trades per month with core analytics and community access — no credit card required.' },
  { q: 'What does the AI analysis include?', a: 'Our AI reads your trade history, journals, and market conditions to surface patterns, blind spots, and actionable improvement plans personalised to your style.' },
  { q: 'Can I share my performance?', a: 'Yes. Generate a public performance card or share directly to the Zynth community leaderboard.' },
  { q: 'How does backtesting work?', a: 'Describe your strategy rules, and our engine runs them against historical OHLCV data, returning win rate, drawdown, Sharpe ratio, and more.' },
  { q: 'What markets are supported?', a: 'Forex, indices, commodities, crypto, and stocks. If your broker supports MT4/MT5, Zynth can sync with it.' },
];

const FEATURE_CARDS = [
  {
    Icon: RefreshCw,
    title: 'MT5 Real-Time Sync',
    desc: 'Link your MetaTrader 4 or 5 account and your trades appear automatically. No copy-pasting, no manual entry. Just connect and go.',
    bullets: ['Real-time sync with any MT4/MT5 broker', 'Auto-import trades, positions & history', 'Supports multiple accounts at once'],
  },
  {
    Icon: Bot,
    title: 'AI-Powered Reports',
    desc: "Our AI reads through your trades and gives you a full breakdown — what's working, what's not, and what to focus on next.",
    bullets: ['Personalized performance analysis', 'Blind spot & pattern detection', 'Actionable improvement plan'],
  },
  {
    Icon: Users,
    title: 'Community & Leaderboard',
    desc: 'Trade alongside thousands of others. Share your trades, climb the leaderboard, and learn from traders who are getting results.',
    bullets: ['Real-time chat & trade sharing', 'Weekly & monthly leaderboards', 'Traders Lounge for mentoring'],
  },
];

// Mini mockup used inside the hero
function HeroDashboardMockup() {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/[0.07]"
         style={{background:'#0c1527', boxShadow:'0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)'}}>
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.05]" style={{background:'#0a1220'}}>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="px-12 py-1 rounded-md text-[11px] text-gray-600 border border-white/[0.05]"
               style={{background:'rgba(255,255,255,0.02)'}}>app.zynth.io</div>
        </div>
      </div>
      {/* Body */}
      <div className="flex h-[340px] md:h-[420px]">
        {/* Sidebar */}
        <div className="w-[170px] shrink-0 border-r border-white/[0.05] p-3 flex-col gap-1 hidden md:flex"
             style={{background:'#090f1e'}}>
          <div className="flex items-center gap-2 px-2 py-1.5 mb-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                 style={{background:'linear-gradient(135deg,#059669,#0d9488)'}}>
              <TrendingUp className="w-3 h-3 text-white" />
            </div>
            <span className="text-[13px] font-bold text-white">Zynth</span>
          </div>
          {[
            {label:'Dashboard',active:true},{label:'Markets',active:false},
            {label:'Journal',active:false},{label:'Analysis',active:false},
            {label:'Calendar',active:false},{label:'Settings',active:false},
          ].map(item => (
            <div key={item.label}
                 className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12px]"
                 style={item.active ? {background:'rgba(16,185,129,0.12)',color:'#34d399'} : {color:'#4b5563'}}>
              <div className={`w-1.5 h-1.5 rounded-full ${item.active ? 'bg-emerald-400' : 'bg-gray-700'}`} />
              {item.label}
            </div>
          ))}
        </div>
        {/* Main */}
        <div className="flex-1 p-5 overflow-hidden">
          <div className="text-[14px] font-bold text-white mb-4">Dashboard Overview</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {[
              {label:'Win Rate', val:'68.4%', chg:'+2.1%'},
              {label:'Total PnL', val:'+$4,280', chg:'+$380'},
              {label:'Trades', val:'142', chg:'+12'},
              {label:'Drawdown', val:'4.2%', chg:'-0.8%'},
            ].map(s => (
              <div key={s.label} className="rounded-xl p-3 border border-white/[0.05]"
                   style={{background:'rgba(255,255,255,0.03)'}}>
                <div className="text-[10px] text-gray-600 mb-1">{s.label}</div>
                <div className="text-[15px] font-bold text-white">{s.val}</div>
                <div className="text-[10px] text-emerald-400">{s.chg}</div>
              </div>
            ))}
          </div>
          {/* Chart */}
          <div className="rounded-xl border border-white/[0.05] p-4 mb-3"
               style={{background:'rgba(255,255,255,0.02)'}}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] font-semibold text-white">PnL Curve — Last 30 Days</span>
              <span className="text-[10px] text-emerald-400">▲ +18.4%</span>
            </div>
            <svg viewBox="0 0 400 80" className="w-full h-14" preserveAspectRatio="none">
              <defs>
                <linearGradient id="pnlg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,72 L30,66 L60,60 L90,54 L110,58 L130,48 L160,40 L180,44 L210,34 L240,26 L270,28 L300,18 L330,20 L360,10 L400,5 L400,80 L0,80 Z" fill="url(#pnlg)" />
              <path d="M0,72 L30,66 L60,60 L90,54 L110,58 L130,48 L160,40 L180,44 L210,34 L240,26 L270,28 L300,18 L330,20 L360,10 L400,5"
                    fill="none" stroke="#059669" strokeWidth="2" />
            </svg>
          </div>
          {/* Recent trades */}
          <div className="space-y-1.5">
            {[
              {sym:'XAU/USD', dir:'Long',  pnl:'+$320.50', up:true},
              {sym:'BTC/USD', dir:'Short', pnl:'+$145.20', up:true},
              {sym:'EUR/USD', dir:'Long',  pnl:'-$48.30',  up:false},
            ].map(t => (
              <div key={t.sym+t.dir} className="flex items-center justify-between px-3 py-2 rounded-lg text-[11px]"
                   style={{background: t.up ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.05)', border:'1px solid rgba(255,255,255,0.04)'}}>
                <span className="font-semibold text-white">{t.sym}</span>
                <span className="text-gray-600">{t.dir}</span>
                <span className={t.up ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>{t.pnl}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage({ onSignIn, onGetStarted }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [annual, setAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="min-h-screen bg-[#07090f] text-white overflow-x-hidden">

      {/* ═══════════════════════════ NAV ═══════════════════════════ */}
      <header className="sticky top-0 z-50 border-b border-white/[0.05]"
              style={{background:'rgba(7,9,15,0.92)', backdropFilter:'blur(16px)'}}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-2.5 select-none">
            <div className="w-9 h-9 rounded-[11px] flex items-center justify-center shrink-0"
                 style={{background:'linear-gradient(145deg,#059669 0%,#0d9488 100%)'}}>
              <TrendingUp className="w-[18px] h-[18px] text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[20px] font-bold tracking-tight">Zynth</span>
          </div>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(l => (
              <a key={l} href={`#${l.toLowerCase()}`}
                 className="text-[14px] text-gray-400 hover:text-white transition-colors">{l}</a>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <button onClick={onSignIn}
                    className="text-[13px] text-gray-300 hover:text-white px-4 py-2 rounded-lg transition-colors">
              Sign In
            </button>
            <button onClick={onGetStarted}
                    className="text-[13px] font-semibold text-white px-5 py-2.5 rounded-xl transition-all hover:brightness-110"
                    style={{background:'linear-gradient(135deg,#059669,#0d9488)', boxShadow:'0 4px 16px rgba(16,185,129,0.3)'}}>
              Get Started
            </button>
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2 text-gray-400 hover:text-white" onClick={() => setMobileOpen(o => !o)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/[0.05] px-6 py-4 space-y-2"
               style={{background:'rgba(7,9,15,0.98)'}}>
            {NAV_LINKS.map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setMobileOpen(false)}
                 className="block text-[14px] text-gray-400 hover:text-white py-1.5">{l}</a>
            ))}
            <div className="flex gap-2 pt-3">
              <button onClick={() => { setMobileOpen(false); onSignIn(); }}
                      className="flex-1 text-[13px] text-gray-300 border border-white/[0.08] rounded-xl py-2.5 hover:border-white/20">
                Sign In
              </button>
              <button onClick={() => { setMobileOpen(false); onGetStarted(); }}
                      className="flex-1 text-[13px] font-semibold text-white rounded-xl py-2.5"
                      style={{background:'linear-gradient(135deg,#059669,#0d9488)'}}>
                Get Started
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ═══════════════════════════ HERO ═══════════════════════════ */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-20 pb-8 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-[15%] left-1/2 -translate-x-1/2 w-[900px] h-[700px]"
               style={{background:'radial-gradient(ellipse,rgba(16,185,129,0.08) 0%,transparent 65%)'}} />
          <div className="absolute top-[25%] left-[2%] w-[500px] h-[400px]"
               style={{background:'radial-gradient(ellipse,rgba(59,130,246,0.05) 0%,transparent 65%)'}} />
          <div className="absolute top-[15%] right-[2%] w-[400px] h-[350px]"
               style={{background:'radial-gradient(ellipse,rgba(16,185,129,0.04) 0%,transparent 65%)'}} />
          <div className="absolute inset-0 opacity-[0.025]"
               style={{backgroundImage:'linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)',backgroundSize:'60px 60px'}} />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 border"
               style={{background:'rgba(16,185,129,0.07)', borderColor:'rgba(16,185,129,0.22)'}}>
            <Trophy className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-bold tracking-[0.18em] text-emerald-400">THE TRADING INTELLIGENCE PLATFORM</span>
          </div>

          {/* Headline */}
          <h1 className="text-[52px] md:text-[70px] font-extrabold leading-[1.06] tracking-tight mb-6">
            Track Markets.{' '}
            <span style={{background:'linear-gradient(90deg,#34d399,#38bdf8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text'}}>
              Analyze Trades.
            </span>
            <br />Master Your Edge.
          </h1>

          {/* Subtitle */}
          <p className="text-[18px] text-gray-400 max-w-[580px] mx-auto leading-relaxed mb-10">
            Sync your trades, journal every setup, monitor live markets, and let AI do the heavy analysis.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <button onClick={onGetStarted}
                    className="group flex items-center gap-2 text-[16px] font-semibold text-white px-8 py-4 rounded-2xl transition-all hover:brightness-110 hover:shadow-[0_8px_32px_rgba(16,185,129,0.42)]"
                    style={{background:'linear-gradient(135deg,#059669 0%,#0d9488 100%)', boxShadow:'0 4px 20px rgba(16,185,129,0.28)'}}>
              Get Started Free
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button onClick={onSignIn}
                    className="text-[16px] font-medium text-gray-300 px-8 py-4 rounded-2xl border border-white/[0.1] hover:border-white/[0.2] hover:text-white transition-all"
                    style={{background:'rgba(255,255,255,0.03)'}}>
              Sign In
            </button>
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-3">
            <div className="flex -space-x-2">
              {['#059669','#0d9488','#3b82f6','#8b5cf6','#f59e0b'].map((c, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-[#07090f] flex items-center justify-center text-[10px] font-bold text-white"
                     style={{background:c, zIndex:5-i}}>
                  {String.fromCharCode(65+i)}
                </div>
              ))}
            </div>
            <p className="text-[13px] text-gray-500">
              Trusted by <span className="text-white font-semibold">2,400+</span> traders worldwide
            </p>
          </div>
        </div>

        {/* Hero dashboard mockup */}
        <div className="relative z-10 mt-16 w-full max-w-5xl mx-auto">
          <HeroDashboardMockup />
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 pointer-events-none"
               style={{background:'radial-gradient(ellipse,rgba(16,185,129,0.1) 0%,transparent 70%)', filter:'blur(8px)'}} />
        </div>
      </section>

      {/* ═══════════════════════════ FEATURES ═══════════════════════════ */}
      <section id="features" className="pt-32 pb-24 px-6">
        <div className="max-w-7xl mx-auto">

          {/* Section label */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 border"
                 style={{background:'rgba(59,130,246,0.07)', borderColor:'rgba(59,130,246,0.2)'}}>
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[11px] font-bold tracking-[0.18em] text-blue-400">FEATURES</span>
            </div>
            <h2 className="text-[42px] font-extrabold tracking-tight mb-4">Everything a serious trader needs</h2>
            <p className="text-[16px] text-gray-500 max-w-[480px] mx-auto">One platform to replace five tabs, three spreadsheets, and two notebooks.</p>
          </div>

          {/* Feature row 1 — Trade Journal */}
          <div className="flex flex-col lg:flex-row items-center gap-12 mb-28">
            {/* Mockup */}
            <div className="flex-1 w-full">
              <div className="rounded-2xl border border-white/[0.06] overflow-hidden"
                   style={{background:'#0c1527', boxShadow:'0 20px 60px rgba(0,0,0,0.5)'}}>
                <div className="px-4 py-3 border-b border-white/[0.05] flex items-center gap-2" style={{background:'#0a1220'}}>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                  </div>
                  <span className="text-[11px] text-gray-600 mx-auto">Trade Journal</span>
                </div>
                <div className="p-5 grid grid-cols-2 gap-3">
                  {[
                    {sym:'XAU/USD', status:'WIN',  date:'Jan 27', pnl:'+$320'},
                    {sym:'BTC/USD', status:'WIN',  date:'Jan 25', pnl:'+$145'},
                    {sym:'GBP/JPY', status:'LOSS', date:'Jan 24', pnl:'-$48'},
                    {sym:'EUR/USD', status:'WIN',  date:'Jan 23', pnl:'+$220'},
                  ].map(t => (
                    <div key={t.sym+t.date} className="rounded-xl p-3.5 border border-white/[0.05]"
                         style={{background:'rgba(255,255,255,0.02)'}}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[12px] font-bold text-white">{t.sym}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${t.status==='WIN' ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
                          {t.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-600">{t.date}</div>
                      <div className={`text-[15px] font-bold mt-1 ${t.pnl.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>{t.pnl}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Text */}
            <div className="flex-1 lg:pl-8">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                   style={{background:'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(16,185,129,0.04))', border:'1px solid rgba(16,185,129,0.2)'}}>
                <BookOpen className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-[32px] font-extrabold mb-4">
                <span className="text-white">Rich </span>
                <span style={{background:'linear-gradient(90deg,#34d399,#38bdf8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text'}}>
                  Trade Journaling
                </span>
              </h3>
              <p className="text-[15px] text-gray-400 leading-relaxed mb-6">
                Every trade tells a story. Add notes about your setup, tag your strategy, attach screenshots, and track how you felt. When you review your journal later, the patterns become obvious.
              </p>
              {[
                'Notes, tags & screenshot attachments',
                'Emotional tracking & trade ratings',
                'Pre-trade checklists & templates',
              ].map(b => (
                <div key={b} className="flex items-center gap-3 mb-3">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-[14px] text-gray-300">{b}</span>
                </div>
              ))}
              <button onClick={onGetStarted}
                      className="mt-4 flex items-center gap-2 text-[14px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
                Learn More <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Feature row 2 — Live Markets (reversed) */}
          <div className="flex flex-col lg:flex-row-reverse items-center gap-12">
            {/* Mockup */}
            <div className="flex-1 w-full">
              <div className="rounded-2xl border border-white/[0.06] overflow-hidden"
                   style={{background:'#0c1527', boxShadow:'0 20px 60px rgba(0,0,0,0.5)'}}>
                <div className="px-4 py-3 border-b border-white/[0.05] flex items-center gap-2" style={{background:'#0a1220'}}>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                  </div>
                  <span className="text-[11px] text-gray-600 mx-auto">Live Markets</span>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      {sym:'XAU/USD', val:'$3,168.40', chg:'+0.82%', up:true},
                      {sym:'BTC/USD', val:'$70,855',   chg:'+1.28%', up:true},
                      {sym:'S&P 500', val:'5,675.20',  chg:'-0.28%', up:false},
                      {sym:'EUR/USD', val:'1.0842',    chg:'+0.14%', up:true},
                      {sym:'DXY',     val:'99.26',     chg:'+0.44%', up:true},
                      {sym:'WTI OIL', val:'$88.07',    chg:'+1.54%', up:true},
                    ].map(m => (
                      <div key={m.sym} className="rounded-xl px-3.5 py-3 flex items-center justify-between"
                           style={{background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)'}}>
                        <div>
                          <div className="text-[9px] text-gray-600 font-bold tracking-widest mb-0.5">{m.sym}</div>
                          <div className="text-[14px] font-bold text-white">{m.val}</div>
                        </div>
                        <div className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg ${m.up ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
                          {m.chg}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Text */}
            <div className="flex-1 lg:pr-8">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                   style={{background:'linear-gradient(135deg,rgba(59,130,246,0.15),rgba(59,130,246,0.04))', border:'1px solid rgba(59,130,246,0.2)'}}>
                <BarChart2 className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-[32px] font-extrabold mb-4">
                <span className="text-white">Live </span>
                <span style={{background:'linear-gradient(90deg,#38bdf8,#818cf8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text'}}>
                  Market Intelligence
                </span>
              </h3>
              <p className="text-[15px] text-gray-400 leading-relaxed mb-6">
                Monitor every major asset class in real time. Forex, indices, commodities, crypto — all ticking live on one screen, with economic events overlaid for full context.
              </p>
              {[
                'Real-time Forex, indices, crypto & commodities',
                'Economic calendar events overlaid on charts',
                'Custom watchlists & price alerts',
              ].map(b => (
                <div key={b} className="flex items-center gap-3 mb-3">
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="text-[14px] text-gray-300">{b}</span>
                </div>
              ))}
              <button onClick={onGetStarted}
                      className="mt-4 flex items-center gap-2 text-[14px] font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                Learn More <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ FEATURE CARDS ═══════════════════════════ */}
      <section className="py-16 px-6" style={{background:'#060a16'}}>
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURE_CARDS.map(({ Icon, title, desc, bullets }) => (
              <div key={title}
                   className="rounded-2xl p-7 border border-white/[0.06] hover:border-white/[0.1] transition-all hover:-translate-y-1"
                   style={{background:'#0c1527'}}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                     style={{background:'linear-gradient(135deg,rgba(59,130,246,0.15),rgba(59,130,246,0.04))', border:'1px solid rgba(59,130,246,0.15)'}}>
                  <Icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-[20px] font-bold text-white mb-3">{title}</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed mb-5">{desc}</p>
                {bullets.map(b => (
                  <div key={b} className="flex items-center gap-2 mb-2.5">
                    <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="text-[12px] text-gray-400">{b}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ PRICING ═══════════════════════════ */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 border"
                 style={{background:'rgba(16,185,129,0.07)', borderColor:'rgba(16,185,129,0.22)'}}>
              <span className="text-[11px] font-bold tracking-[0.18em] text-emerald-400">PRICING</span>
            </div>
            <h2 className="text-[42px] font-extrabold tracking-tight mb-6">Plans for Every Trader</h2>
            {/* Toggle */}
            <div className="inline-flex items-center gap-1 p-1 rounded-xl border border-white/[0.07]"
                 style={{background:'rgba(255,255,255,0.03)'}}>
              <button onClick={() => setAnnual(true)}
                      className={`flex items-center gap-2 px-5 py-2 rounded-lg text-[13px] font-semibold transition-all ${annual ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                      style={annual ? {background:'rgba(255,255,255,0.08)'} : {}}>
                Yearly
                {annual && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md text-emerald-400 bg-emerald-500/15">Save 17%</span>
                )}
              </button>
              <button onClick={() => setAnnual(false)}
                      className={`px-5 py-2 rounded-lg text-[13px] font-semibold transition-all ${!annual ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                      style={!annual ? {background:'rgba(255,255,255,0.08)'} : {}}>
                Monthly
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map(plan => (
              <div key={plan.name}
                   className={`relative rounded-2xl overflow-visible border transition-all hover:-translate-y-1 ${plan.highlight ? 'border-blue-500/40' : 'border-white/[0.06]'}`}
                   style={plan.highlight
                     ? {background:'#0d1a36', boxShadow:'0 0 0 1px rgba(59,130,246,0.12), 0 24px 60px rgba(0,0,0,0.5)'}
                     : {background:'#0c1527'}}>
                {plan.badge && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <span className="px-4 py-1 rounded-full text-[11px] font-bold text-white"
                          style={{background:'linear-gradient(90deg,#3b82f6,#6366f1)'}}>
                      {plan.badge}
                    </span>
                  </div>
                )}
                <div className="p-8 pt-10">
                  <h3 className={`text-[22px] font-bold mb-1 ${plan.highlight ? 'text-blue-400' : 'text-white'}`}>{plan.name}</h3>
                  <p className="text-[13px] text-gray-500 mb-4">{plan.desc}</p>
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-[16px] text-gray-400 mb-2">$</span>
                    <span className="text-[48px] font-extrabold text-white leading-none">
                      {annual ? plan.yearly : plan.monthly}
                    </span>
                    <span className="text-[13px] text-gray-500 mb-2">/month</span>
                  </div>
                  <p className="text-[11px] text-gray-600 mb-6">
                    {plan.yearly === 0 ? 'Free forever' : annual ? 'if billed yearly' : 'billed monthly'}
                  </p>
                  <div className="space-y-3 mb-8">
                    {plan.features.map(f => (
                      <div key={f} className="flex items-center gap-3">
                        <Check className={`w-4 h-4 shrink-0 ${plan.highlight ? 'text-blue-400' : 'text-emerald-400'}`} />
                        <span className="text-[13px] text-gray-300">{f}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={onGetStarted}
                          className={`w-full py-3 rounded-xl text-[14px] font-semibold transition-all hover:brightness-110 ${plan.highlight ? 'text-white' : 'text-white'}`}
                          style={plan.highlight
                            ? {background:'linear-gradient(135deg,#3b82f6,#6366f1)', boxShadow:'0 4px 16px rgba(59,130,246,0.3)'}
                            : {background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)'}}>
                    {plan.cta}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ FAQ ═══════════════════════════ */}
      <section id="faq" className="py-24 px-6" style={{background:'#060a16'}}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 border"
                 style={{background:'rgba(255,255,255,0.03)', borderColor:'rgba(255,255,255,0.08)'}}>
              <span className="text-[11px] font-bold tracking-[0.18em] text-gray-400">SUPPORT</span>
            </div>
            <h2 className="text-[42px] font-extrabold tracking-tight">Frequently Asked Questions</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {FAQS.map((faq, i) => (
              <div key={i} className="rounded-2xl border border-white/[0.06] overflow-hidden"
                   style={{background:'#0c1527'}}>
                <button className="w-full flex items-center justify-between px-6 py-4 text-left gap-4"
                        onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span className="text-[14px] font-semibold text-white">{faq.q}</span>
                  {openFaq === i
                    ? <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-[13px] text-gray-500 leading-relaxed border-t border-white/[0.04] pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ BOTTOM CTA ═══════════════════════════ */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px]"
               style={{background:'radial-gradient(ellipse,rgba(16,185,129,0.07) 0%,transparent 65%)'}} />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="text-[42px] font-extrabold tracking-tight mb-5">Ready to trade smarter?</h2>
          <p className="text-[16px] text-gray-400 mb-10 max-w-[400px] mx-auto">
            Join 2,400+ traders already using Zynth to sharpen their edge.
          </p>
          <button onClick={onGetStarted}
                  className="group inline-flex items-center gap-2 text-[16px] font-semibold text-white px-10 py-4 rounded-2xl transition-all hover:brightness-110 hover:shadow-[0_8px_32px_rgba(16,185,129,0.45)]"
                  style={{background:'linear-gradient(135deg,#059669 0%,#0d9488 100%)', boxShadow:'0 4px 20px rgba(16,185,129,0.28)'}}>
            Get Started for Free
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
          <p className="text-[12px] text-gray-700 mt-4">No credit card required · Cancel any time</p>
        </div>
      </section>

      {/* ═══════════════════════════ FOOTER ═══════════════════════════ */}
      <footer className="border-t border-white/[0.05] py-10 px-6" style={{background:'#07090f'}}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[9px] flex items-center justify-center"
                 style={{background:'linear-gradient(145deg,#059669,#0d9488)'}}>
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="text-[16px] font-bold text-white">Zynth</span>
          </div>
          <p className="text-[12px] text-gray-700">© 2026 Zynth. All rights reserved.</p>
          <div className="flex gap-6">
            {['Privacy', 'Terms', 'Contact'].map(l => (
              <a key={l} href="#" className="text-[12px] text-gray-600 hover:text-gray-400 transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
}
