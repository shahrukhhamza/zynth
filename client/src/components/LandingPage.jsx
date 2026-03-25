import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  BarChart2, BookOpen, Shield, Zap, Brain, Users,
  AlertCircle, FileSpreadsheet,
  Calendar, ChevronDown, ChevronUp, Check, ArrowRight, Menu, X,
  RefreshCw, Bot, Trophy, Activity, Bell, Star, Flame, Info, Clock,
  Sun, Moon,
} from 'lucide-react';
import { API_URL } from '../config/api';
import { getPublicStats } from '../utils/publicStats';
import Hero from './Hero';
import { useTheme } from '../contexts/ThemeContext';

// Scroll-reveal wrapper — fades + slides up when entering viewport
function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px 0px' });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

const TOTAL_FOUNDING = 100;
const OFFER_END_DATE = new Date('2026-04-12T23:59:59');

const NAV_LINKS = ['Features', 'Pricing', 'FAQ'];
const BADGE_TEXTS = ['For Gold Traders', 'For Forex Traders', 'For Serious Traders'];

function fmtPrice(sym, val) {
  if (sym === 'XAU/USD') return '$' + val.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (sym === 'BTC/USD') return '$' + Math.round(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (sym === 'S&P 500') return val.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (sym === 'WTI OIL') return '$' + val.toFixed(2);
  return val.toFixed(4);
}

const INITIAL_MARKETS = [
  { sym: 'XAU/USD', val: 3168.40, fmt: '$3,168.40', chg: '+0.82%', up: true,  step: 1.2  },
  { sym: 'BTC/USD', val: 70855,   fmt: '$70,855',   chg: '+1.28%', up: true,  step: 45   },
  { sym: 'S&P 500', val: 5675.20, fmt: '5,675.20',  chg: '-0.28%', up: false, step: 0.8  },
  { sym: 'EUR/USD', val: 1.0842,  fmt: '1.0842',    chg: '+0.14%', up: true,  step: 0.0003 },
  { sym: 'DXY',     val: 99.26,   fmt: '99.26',     chg: '+0.44%', up: true,  step: 0.04 },
  { sym: 'WTI OIL', val: 88.07,   fmt: '$88.07',    chg: '+1.54%', up: true,  step: 0.06 },
];

const PLANS = [
  {
    name: 'Free',
    monthly: 0, yearly: 0,
    desc: 'Perfect to get started',
    features: [
      'Up to 10 journal entries',
      'Manual trade entry',
      'Basic analytics & charts',
      'Economic calendar',
      'Live market overview',
      '3 free AI analysis tries',
      '2 free screenshot analyses',
    ],
    cta: 'Get Started Free',
    highlight: false,
  },
  {
    name: 'Pro',
    monthly: 1.99, yearly: 1.66,
    originalMonthly: 9, originalYearly: 7.50, yearlyBilled: 19.99,
    desc: 'For active traders',
    badge: 'FOUNDING MEMBER',
    discountBadge: '78% OFF',
    features: [
      'Unlimited journal entries',
      'AI Trade Analysis: 50 analyses/month',
      'Screenshot OCR Analysis: 35/month',
      'Full Economic Intelligence',
      'Macro Surprise Score',
      'Live market feeds',
      'Advanced journaling',
      'Priority support',
    ],
    cta: 'Claim Founding Price',
    highlight: true,
  },
  {
    name: 'Elite',
    monthly: 4.99, yearly: 3.99,
    originalMonthly: 25, originalYearly: 20, yearlyBilled: 47.99,
    desc: 'For professional traders',
    badge: 'BEST VALUE',
    discountBadge: '80% OFF',
    features: [
      'Everything in Pro',
      'Unlimited AI Trade Analysis',
      'Unlimited Screenshot OCR',
      'Custom AI reports',
      'Dedicated support',
      'Beta access to new features before public release',
      'Dedicated email support — 4hr response',
      'API access (coming soon)',
    ],
    cta: 'Go Elite',
    highlight: false,
  },
];

const FAQS = [
  { q: 'What is Zynth?', a: 'Zynth is a professional trading intelligence platform built for serious traders. It combines live market data, AI-powered trade analysis, economic intelligence, and a rich trade journal — all in one dashboard.' },
  { q: 'Is my data safe?', a: 'Yes. All data is encrypted in transit (TLS 1.3) and stored securely. We never share or sell your trading data to anyone.' },
  { q: 'What is the Macro Surprise Score?', a: 'The Macro Surprise Score is our proprietary indicator that analyzes 10 major economic releases and calculates a single score (-10 to +10) showing whether macro conditions are bullish or bearish for gold (XAUUSD).' },
  { q: 'Is there a free plan?', a: 'Absolutely. The Free plan gives you access to core features including live markets, economic calendar, and even 3 free AI analysis tries — no credit card required.' },
  { q: 'What does the AI analysis include?', a: 'Our AI reads your trade history and journal entries to surface patterns, identify mistakes, and give you personalized improvement suggestions.' },
  { q: 'What is the Screenshot Analysis feature?', a: 'Upload a screenshot of your MT5 trading history and our AI will automatically extract your trades using OCR and provide a detailed performance analysis.' },
  { q: 'What markets does Zynth cover?', a: 'Zynth covers Forex (XAU/USD, EUR/USD, GBP/USD, USD/JPY), major crypto (BTC, ETH, XRP, SOL, BNB), US stocks (AAPL, TSLA, NVDA, MSFT, AMZN, GOOGL), and ETFs (SPY, GLD, TLT).' },
  { q: 'How do I get the Founding Member price?', a: 'Simply sign up and upgrade to Pro during our launch period. The first 100 users lock in $1.99/month forever — even after we raise prices.' },
];

const FEATURE_CARDS = [
  {
    Icon: BarChart2,
    title: 'Macro Surprise Score',
    desc: 'A proprietary -10 to +10 score showing real-time macro conditions for gold, updated automatically from official sources.',
    bullets: ['Tracks 10 major economic releases', 'Single score for instant context', 'Automatically updated from official data'],
  },
  {
    Icon: Bot,
    title: 'AI-Powered Reports',
    desc: "Our AI reads through your trades and gives you a full breakdown — what's working, what's not, and what to focus on next.",
    bullets: ['Personalized performance analysis', 'Blind spot & pattern detection', 'Actionable improvement plan'],
  },
  {
    Icon: Brain,
    title: 'AI Trade Coaching',
    desc: 'Upload your trades or journal entries and get personalized AI feedback on your patterns, mistakes, and improvement areas.',
    bullets: ['Advanced AI analysis', 'Screenshot & OCR trade extraction', 'Personalized to your trading style'],
  },
];


export default function LandingPage({ onSignIn, onGetStarted }) {
  const { isDark, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [annual, setAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);
  const [bannerDismissed, setBannerDismissed] = useState(
    () => sessionStorage.getItem('bannerDismissed') === '1'
  );
  const [spotsLeft, setSpotsLeft] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [countdown, setCountdown] = useState({ d: 30, h: 0, m: 0, s: 0 });
  const [badgeIdx, setBadgeIdx] = useState(0);
  const [badgeFade, setBadgeFade] = useState(true);
  const [journalStep, setJournalStep] = useState(0);
  const [liveMarkets, setLiveMarkets] = useState(INITIAL_MARKETS);
  const [flashMap, setFlashMap] = useState({});
  const [needleAngle, setNeedleAngle] = useState(-90);
  const [ctaInsightIdx, setCtaInsightIdx] = useState(0);
  const [ctaInsightVisible, setCtaInsightVisible] = useState(true);

  useEffect(() => {
    getPublicStats()
      .then(d => { setSpotsLeft(d?.totalUsers != null ? Math.max(0, TOTAL_FOUNDING - d.totalUsers) : 0); })
      .catch(() => { setSpotsLeft(0); });
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    function tick() {
      const diff = Math.max(0, OFFER_END_DATE - Date.now());
      setCountdown({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setBadgeFade(false);
      setTimeout(() => {
        setBadgeIdx(i => (i + 1) % BADGE_TEXTS.length);
        setBadgeFade(true);
      }, 320);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  // Journal card stagger animation
  useEffect(() => {
    const sequence = [[1, 600], [2, 600], [3, 600], [4, 2500], [0, 400]];
    let handle;
    let i = 0;
    function tick() {
      setJournalStep(sequence[i][0]);
      handle = setTimeout(() => { i = (i + 1) % sequence.length; tick(); }, sequence[i][1]);
    }
    handle = setTimeout(tick, 800);
    return () => clearTimeout(handle);
  }, []);

  // Live price ticker
  useEffect(() => {
    const id = setInterval(() => {
      const idx = Math.floor(Math.random() * INITIAL_MARKETS.length);
      setLiveMarkets(prev => {
        const next = [...prev];
        const p = next[idx];
        const delta = (Math.random() - 0.48) * p.step;
        const newVal = p.val + delta;
        const up = delta >= 0;
        const prevPct = parseFloat(p.chg);
        const newPct = prevPct + (Math.random() - 0.5) * 0.04;
        next[idx] = { ...p, val: newVal, fmt: fmtPrice(p.sym, newVal), up, chg: (newPct >= 0 ? '+' : '') + newPct.toFixed(2) + '%' };
        return next;
      });
      setFlashMap(fm => ({ ...fm, [idx]: true }));
      setTimeout(() => setFlashMap(fm => { const c = { ...fm }; delete c[idx]; return c; }), 750);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  // Macro Score needle
  useEffect(() => {
    const t = setTimeout(() => setNeedleAngle(40.5), 800);
    return () => clearTimeout(t);
  }, []);

  // CTA insight card cycle
  const CTA_INSIGHTS = [
    { color: 'amber',   text: '\u26a0 Revenge trading detected on 6 trades this month' },
    { color: 'emerald', text: '\u2705 Best session: London (71% win rate)' },
    { color: 'emerald', text: '\ud83d\udcc8 Win rate improving: +12% vs last month' },
  ];
  useEffect(() => {
    const id = setInterval(() => {
      setCtaInsightVisible(false);
      setTimeout(() => {
        setCtaInsightIdx(i => (i + 1) % CTA_INSIGHTS.length);
        setCtaInsightVisible(true);
      }, 380);
    }, 1900);
    return () => clearInterval(id);
  }, []);

  const activePlans = PLANS;

  function dismissBanner() {
    setBannerDismissed(true);
    sessionStorage.setItem('bannerDismissed', '1');
  }

  return (
    <div className={`min-h-screen overflow-x-hidden transition-colors duration-300 ${isDark ? 'bg-[#07090f] text-white' : 'bg-[#f4f6f9] text-[#0a0e1a]'}`}>
      <style>{`
        @keyframes urgencyPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.25); }
          50%       { box-shadow: 0 0 0 8px rgba(245,158,11,0); }
        }
        @keyframes proCardGlow {
          0%, 100% { box-shadow: 0 0 0 1px rgba(16,185,129,0.2), 0 24px 60px rgba(0,0,0,0.5), 0 0 30px rgba(16,185,129,0.1); }
          50%       { box-shadow: 0 0 0 1px rgba(16,185,129,0.5), 0 24px 60px rgba(0,0,0,0.5), 0 0 60px rgba(16,185,129,0.3); }
        }
        @keyframes shimmerBtn {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes gridSweep {
          0%   { transform: translateX(-700px); opacity: 0; }
          12%  { opacity: 1; }
          88%  { opacity: 1; }
          100% { transform: translateX(calc(100vw + 700px)); opacity: 0; }
        }
        @keyframes headlineGradient {
          0%, 100% { background-position: 0% center; }
          50%       { background-position: 100% center; }
        }
        @keyframes winPop {
          0%   { transform: scale(0.4); opacity: 0; }
          65%  { transform: scale(1.22); }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes needleGlow {
          0%, 100% { opacity: 0.35; }
          50%      { opacity: 0.85; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-6px); }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(16,185,129,0.3), 0 0 0 1px rgba(16,185,129,0.3), 0 24px 60px rgba(0,0,0,0.5); }
          50%       { box-shadow: 0 0 45px rgba(16,185,129,0.65), 0 0 0 1px rgba(16,185,129,0.6), 0 24px 60px rgba(0,0,0,0.5); }
        }
        @keyframes priceDrop {
          from { transform: translateY(-18px); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
        @keyframes digitFlip {
          0%   { transform: perspective(300px) rotateX(0deg);   opacity: 1; }
          45%  { transform: perspective(300px) rotateX(88deg);  opacity: 0.15; }
          55%  { transform: perspective(300px) rotateX(-88deg); opacity: 0.15; }
          100% { transform: perspective(300px) rotateX(0deg);   opacity: 1; }
        }
        @keyframes liveDot {
          0%, 100% { box-shadow: 0 0 0 0 rgba(52,211,153,0.5); }
          60%      { box-shadow: 0 0 0 5px rgba(52,211,153,0); }
        }
        @keyframes insightFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes priceReveal {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .nav-link-hover { position: relative; }
        .nav-link-hover::after {
          content: '';
          position: absolute;
          bottom: -3px; left: 0;
          width: 0; height: 1.5px;
          background: #34d399;
          transition: width 0.22s ease;
        }
        .nav-link-hover:hover::after { width: 100%; }
      `}</style>

      {/* ═══════════════════════ FOUNDING MEMBER BANNER ═══════════════════════ */}
      {!bannerDismissed && (
        <div
          className="relative flex items-center justify-center text-center px-12 py-3 text-[13px] font-semibold"
          style={{
            background: 'linear-gradient(90deg, #065f46 0%, #064e3b 40%, #0f766e 80%, #065f46 100%)',
            borderBottom: '1px solid rgba(52,211,153,0.2)',
          }}
        >
          <span>
            <Flame className="w-3.5 h-3.5 text-amber-400 inline-block mr-1" />{' '}
            <span className="text-blue-300 font-bold">FOUNDING MEMBER OFFER</span>
            {' '}—{' '}
            First 100 users get Pro for{' '}
            <span className="text-white font-bold">$1.99/month</span>
            {' '}(regularly{' '}
            <span className="line-through text-blue-600">$9</span>)
            {' '}·{' '}
            <span className="text-amber-300 font-bold">Only {spotsLeft} spots remaining!</span>
          </span>
          <button
            onClick={dismissBanner}
            className="absolute right-3 w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: 'rgba(147,197,253,0.6)', top: 'calc(50% - 14px)' }}
            onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseOut={e => { e.currentTarget.style.color = 'rgba(147,197,253,0.6)'; e.currentTarget.style.background = 'transparent'; }}
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          background: isDark ? 'rgba(7,9,15,0.88)' : 'rgba(244,246,249,0.92)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
          boxShadow: scrolled ? (isDark ? '0 4px 24px rgba(0,0,0,0.35)' : '0 4px 24px rgba(0,0,0,0.08)') : 'none',
          transition: 'box-shadow 0.3s ease',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Logo + Live dot */}
          <div className="flex items-center gap-2.5 select-none">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0"
                    style={{animation:'liveDot 2s ease-in-out infinite', boxShadow:'0 0 6px rgba(59,130,246,0.7)'}} />
              <span className="text-[10px] font-medium text-blue-500/70 hidden sm:block">Live</span>
            </div>
            <img src="/logo.png" alt="Zynth" className="w-9 h-9 object-contain" />
            <span className="text-[20px] font-bold tracking-tight">Zynth</span>
          </div>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(l => (
              <a key={l} href={`#${l.toLowerCase()}`}
                 className={`nav-link-hover text-[14px] transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>{l}</a>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-all hover:scale-110"
              style={{
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
              }}
              aria-label="Toggle theme"
            >
              {isDark
                ? <Sun className="w-4 h-4 text-amber-400" />
                : <Moon className="w-4 h-4 text-indigo-500" />
              }
            </button>
            <button onClick={onSignIn}
                    className={`text-[13px] px-4 py-2 rounded-lg transition-colors ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
              Sign In
            </button>
            <button onClick={onGetStarted}
                    className="text-[13px] font-semibold text-white px-5 py-2.5 rounded-xl transition-all hover:brightness-110"
                    style={{background:'linear-gradient(135deg,#1d4ed8,#0284c7)', boxShadow:'0 4px 16px rgba(59,130,246,0.3)'}}>
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
          <div className="md:hidden border-t px-6 py-4 space-y-2"
               style={{
                 background: isDark ? 'rgba(7,9,15,0.98)' : 'rgba(244,246,249,0.98)',
                 borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)',
               }}>
            {NAV_LINKS.map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setMobileOpen(false)}
                 className={`block text-[14px] py-1.5 transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>{l}</a>
            ))}
            <div className="flex gap-2 pt-3">
              {/* Mobile theme toggle */}
              <button
                onClick={toggleTheme}
                className="w-11 h-11 flex items-center justify-center rounded-xl border transition-all"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                }}
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
              </button>
              <button onClick={() => { setMobileOpen(false); onSignIn(); }}
                      className={`flex-1 text-[13px] rounded-xl py-2.5 transition-colors border ${isDark ? 'text-gray-300 border-white/[0.08] hover:border-white/20' : 'text-gray-700 border-gray-200 hover:border-gray-300'}`}>
                Sign In
              </button>
              <button onClick={() => { setMobileOpen(false); onGetStarted(); }}
                      className="flex-1 text-[13px] font-semibold text-white rounded-xl py-2.5"
                      style={{background:'linear-gradient(135deg,#1d4ed8,#0284c7)'}}>
                Get Started
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ═══════════════════════════ HERO ═══════════════════════════ */}
      <Hero
        badgeText={BADGE_TEXTS[badgeIdx]}
        badgeFade={badgeFade}
        spotsLeft={spotsLeft}
        onGetStarted={onGetStarted}
        onSignIn={onSignIn}
      />

      {/* ═══════════════════════════ FEATURES ═══════════════════════════ */}
      <section id="features" className={`pt-16 pb-24 px-6 transition-colors duration-300 ${isDark ? '' : 'bg-[#f4f6f9]'}`}>
        <div className="max-w-7xl mx-auto">

          {/* Section label */}
          <Reveal className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 border"
                 style={{background:'rgba(59,130,246,0.07)', borderColor:'rgba(59,130,246,0.2)'}}>  
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[11px] font-bold tracking-[0.18em] text-blue-400">FEATURES</span>
            </div>
            <h2 className="text-[42px] font-extrabold tracking-tight mb-4">
              <span className={`bg-clip-text text-transparent bg-gradient-to-r ${isDark ? 'from-white to-blue-400' : 'from-[#0a0e1a] to-blue-600'}`}>
                Everything a serious trader needs
              </span>
            </h2>
            <p className={`text-[16px] max-w-[480px] mx-auto ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>One platform to replace five tabs, three spreadsheets, and two notebooks.</p>
          </Reveal>

          {/* Feature row 1 — Trade Journal */}
          <Reveal delay={0.1} className="flex flex-col lg:flex-row items-center gap-12 mb-28">
            {/* Mockup */}
            <div className="flex-1 w-full">
              <div className="rounded-2xl border overflow-hidden"
                   style={{
                     background: isDark ? '#0c1527' : '#ffffff',
                     borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
                     boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.5)' : '0 20px 60px rgba(0,0,0,0.08)',
                   }}>
                <div className="px-4 py-3 border-b flex items-center gap-2"
                     style={{background: isDark ? '#0a1220' : '#f9fafb', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}}>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                  </div>
                  <span className={`text-[11px] mx-auto ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Trade Journal</span>
                </div>
                <div className="p-5 grid grid-cols-2 gap-3">
                  {[
                    { sym:'XAU/USD', status:'WIN',  date:'Jan 27', pnl:'+$320' },
                    { sym:'BTC/USD', status:'WIN',  date:'Jan 25', pnl:'+$145' },
                    { sym:'GBP/JPY', status:'LOSS', date:'Jan 24', pnl:'-$48'  },
                    { sym:'EUR/USD', status:'WIN',  date:'Jan 23', pnl:'+$220' },
                  ].map((t, i) => (
                    <div key={t.sym+t.date}
                         className="rounded-xl p-3.5 border"
                         style={{
                           background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                           borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                           opacity: journalStep > i ? 1 : 0.06,
                           transform: journalStep > i ? 'translateY(0)' : 'translateY(8px)',
                           transition: 'opacity 0.4s ease, transform 0.4s ease',
                         }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[12px] font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.sym}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${t.status==='WIN' ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}
                          style={journalStep === i + 1 ? {animation:'winPop 0.45s cubic-bezier(0.34,1.56,0.64,1)'} : {}}>
                          {t.status}
                        </span>
                      </div>
                      <div className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{t.date}</div>
                      <div className={`text-[15px] font-bold mt-1 ${t.pnl.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>{t.pnl}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Text */}
            <div className="flex-1 lg:pl-8">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                   style={{background:'linear-gradient(135deg,rgba(59,130,246,0.15),rgba(59,130,246,0.04))', border:'1px solid rgba(59,130,246,0.2)'}}>
                <BookOpen className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-[32px] font-extrabold mb-4">
                <span className={isDark ? 'text-white' : 'text-gray-900'}>Rich </span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#1d4ed8] to-[#06b6d4]">
                  Trade Journaling
                </span>
              </h3>
              <p className={`text-[15px] leading-relaxed mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Every trade tells a story. Add notes about your setup, tag your strategy, attach screenshots, and track how you felt. When you review your journal later, the patterns become obvious.
              </p>
              {[
                'Notes, tags & screenshot attachments',
                'Emotional tracking & trade ratings',
                'Pre-trade checklists & templates',
              ].map(b => (
                <div key={b} className="flex items-center gap-3 mb-3">
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className={`text-[14px] ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{b}</span>
                </div>
              ))}
              <button onClick={onGetStarted}
                      className="mt-4 flex items-center gap-2 text-[14px] font-semibold text-blue-500 hover:text-blue-400 transition-colors">
                Learn More <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </Reveal>

          {/* Feature row 2 — Live Markets (reversed) */}
          <Reveal delay={0.1} className="flex flex-col lg:flex-row-reverse items-center gap-12">
            {/* Mockup */}
            <div className="flex-1 w-full">
              <div className="rounded-2xl border overflow-hidden"
                   style={{
                     background: isDark ? '#0c1527' : '#ffffff',
                     borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
                     boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.5)' : '0 20px 60px rgba(0,0,0,0.08)',
                   }}>
                <div className="px-4 py-3 border-b flex items-center gap-2"
                     style={{background: isDark ? '#0a1220' : '#f9fafb', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}}>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                  </div>
                  <span className={`text-[11px] mx-auto ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Live Markets</span>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 gap-2.5">
                    {liveMarkets.map((m, i) => (
                      <div key={m.sym}
                           className={`rounded-xl px-3.5 py-3 flex items-center justify-between ${flashMap[i] ? (m.up ? 'price-up' : 'price-down') : ''}`}
                           style={{
                             background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                             border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
                           }}>
                        <div>
                          <div className={`text-[9px] font-bold tracking-widest mb-0.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{m.sym}</div>
                          <div className={`text-[14px] font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{m.fmt}</div>
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
                <span className={isDark ? 'text-white' : 'text-gray-900'}>Live </span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-violet-400">
                  Market Intelligence
                </span>
              </h3>
              <p className={`text-[15px] leading-relaxed mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Monitor every major asset class in real time. Forex, indices, commodities, crypto — all ticking live on one screen, with economic events overlaid for full context.
              </p>
              {[
                'Real-time Forex, indices, crypto & commodities',
                'Economic calendar events overlaid on charts',
                'Custom watchlists & price alerts',
              ].map(b => (
                <div key={b} className="flex items-center gap-3 mb-3">
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className={`text-[14px] ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{b}</span>
                </div>
              ))}
              <button onClick={onGetStarted}
                      className="mt-4 flex items-center gap-2 text-[14px] font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                Learn More <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════ FEATURE CARDS ═══════════════════════════ */}
      <section className={`py-16 px-6 transition-colors duration-300`} style={{background: isDark ? '#060a16' : '#eef1f7'}}>
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURE_CARDS.map(({ Icon, title, desc, bullets }, i) => (
              <Reveal key={title} delay={i * 0.12}>
                <div
                   className="rounded-2xl p-7 border h-full hover:-translate-y-1 transition-all duration-300"
                   style={{
                     background: isDark ? '#0c1527' : '#ffffff',
                     borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
                     boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.05)',
                   }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                       style={{background:'linear-gradient(135deg,rgba(59,130,246,0.15),rgba(59,130,246,0.04))', border:'1px solid rgba(59,130,246,0.15)'}}>
                    <Icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className={`text-[20px] font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
                  <p className={`text-[13px] leading-relaxed mb-5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{desc}</p>
                  {bullets.map(b => (
                    <div key={b} className="flex items-center gap-2 mb-2.5">
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className={`text-[12px] ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{b}</span>
                    </div>
                  ))}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ MACRO SCORE SHOWCASE ══════════════════════ */}
      <section className="py-24 px-6 relative overflow-hidden transition-colors duration-300" style={{background: isDark ? '#07090f' : '#f4f6f9'}}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px]"
               style={{background:'radial-gradient(ellipse,rgba(16,185,129,0.08) 0%,transparent 65%)'}} />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {/* Pro badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 border"
               style={{background:'rgba(59,130,246,0.08)', borderColor:'rgba(59,130,246,0.32)'}}>
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shrink-0" />
            <span className="text-[10px] font-bold tracking-[0.2em] text-blue-400">PRO FEATURE</span>
          </div>
          <Reveal>
            <h2 className={`text-[36px] md:text-[48px] font-extrabold tracking-tight mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              See the Macro Score{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#1d4ed8] to-[#06b6d4]">
                in Action
              </span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className={`text-[16px] mb-14 max-w-md mx-auto ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Our proprietary indicator — exclusive to Zynth
            </p>
          </Reveal>

          {/* Gauge */}
          <Reveal delay={0.2} className="inline-flex flex-col items-center gap-5">
            <div className="relative">
              <svg viewBox="0 0 200 110" className="w-64 md:w-[340px]" aria-hidden="true">
                <defs>
                  <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stopColor="#ef4444" />
                    <stop offset="42%"  stopColor="#f59e0b" />
                    <stop offset="68%"  stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
                {/* Track */}
                <path d="M 10,100 A 90,90 0 0,1 190,100"
                      fill="none" stroke={isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'} strokeWidth="13" strokeLinecap="round" />
                {/* Colored arc */}
                <path d="M 10,100 A 90,90 0 0,1 190,100"
                      fill="none" stroke="url(#gaugeGrad)" strokeWidth="13" strokeLinecap="round" />
                {/* Labels */}
                <text x="4"  y="110" fill="#ef4444" fontSize="8" fontWeight="700" fontFamily="monospace">-10</text>
                <text x="93" y="12"  fill="#94a3b8" fontSize="8" fontWeight="700" fontFamily="monospace">0</text>
                <text x="181" y="110" fill="#10b981" fontSize="8" fontWeight="700" fontFamily="monospace">+10</text>
                {/* Needle glow */}
                <g style={{
                  transformBox: 'view-box',
                  transformOrigin: '100px 100px',
                  transform: `rotate(${needleAngle}deg)`,
                  transition: 'transform 1.6s cubic-bezier(0.34,1.2,0.64,1)',
                }}>
                  <line x1="100" y1="100" x2="100" y2="20"
                        stroke="rgba(52,211,153,0.55)" strokeWidth="9" strokeLinecap="round"
                        style={{filter:'blur(4px)', animation:'needleGlow 2.2s ease-in-out infinite'}} />
                </g>
                {/* Needle main */}
                <g style={{
                  transformBox: 'view-box',
                  transformOrigin: '100px 100px',
                  transform: `rotate(${needleAngle}deg)`,
                  transition: 'transform 1.6s cubic-bezier(0.34,1.2,0.64,1)',
                }}>
                  <line x1="100" y1="100" x2="100" y2="20"
                        stroke={isDark ? 'white' : '#0a0e1a'} strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="100" cy="100" r="5.5" fill={isDark ? '#07090f' : '#f4f6f9'} stroke={isDark ? 'white' : '#0a0e1a'} strokeWidth="2" />
                </g>
              </svg>
              {/* Score number */}
              <div className="text-center mt-3">
                <div className="inline-flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold tracking-[0.15em] px-2 py-0.5 rounded-md"
                        style={{background:'rgba(245,158,11,0.12)', color:'#fbbf24', border:'1px solid rgba(245,158,11,0.25)'}}>
                    SAMPLE DATA
                  </span>
                </div>
                <p className="text-[52px] md:text-[60px] font-extrabold leading-none bg-clip-text text-transparent bg-gradient-to-r from-[#1d4ed8] to-[#06b6d4]">
                  +4.5
                </p>
                <p className={`text-[14px] mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Example output — score updates live from real economic data <span style={{display:'inline-block',width:8,height:8,borderRadius:'50%',backgroundColor:'#22c55e',verticalAlign:'middle',marginLeft:2}}/></p>
              </div>
            </div>

            {/* Indicator pills */}
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {[
                { label:'NFP', status:'Beat',    Icon: Check,      delay:'0s',   bg:'rgba(16,185,129,0.12)', border:'rgba(16,185,129,0.35)', color:'#34d399' },
                { label:'CPI', status:'In Line', Icon: ArrowRight,  delay:'0.2s', bg:'rgba(245,158,11,0.1)',  border:'rgba(245,158,11,0.35)', color:'#fbbf24' },
                { label:'GDP', status:'Miss',    Icon: X,           delay:'0.4s', bg:'rgba(239,68,68,0.1)',   border:'rgba(239,68,68,0.3)',   color:'#f87171' },
              ].map(({ label, status, Icon, delay, bg, border, color }) => (
                <div key={label}
                     className="px-5 py-2.5 rounded-full text-[13px] font-bold border"
                     style={{ background: bg, borderColor: border, color, transitionDelay: delay }}>
                  {label}: {status} <Icon size={12} style={{display:'inline-block',verticalAlign:'middle'}}/>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════ STATS + TESTIMONIALS ═══════════════════════ */}
      <section className="py-20 px-6 transition-colors duration-300" style={{background: isDark ? '#07090f' : '#f4f6f9'}}>
        <div className="max-w-7xl mx-auto">

          {/* ── Stats cards ── */}
          <Reveal className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 border"
                 style={{background:'rgba(59,130,246,0.07)', borderColor:'rgba(59,130,246,0.22)'}}>
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[11px] font-bold tracking-[0.18em] text-blue-400">RESEARCH</span>
            </div>
            <h2 className={`text-[36px] md:text-[42px] font-extrabold tracking-tight mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-violet-400">The Data Behind Better Trading</span>
            </h2>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            {[
              { stat: '23%', desc: 'average win rate improvement for traders who journal consistently' },
              { stat: '68%', desc: 'of trading losses are linked to emotional decision making' },
              { stat: '3×',  desc: 'more likely to be profitable when reviewing trades weekly' },
            ].map(({ stat, desc }, i) => (
              <Reveal key={stat} delay={i * 0.12}>
                <div className="rounded-2xl p-7 text-center border"
                     style={{
                       background: isDark ? '#0c1527' : '#ffffff',
                       borderColor: isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.12)',
                       boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.05)',
                     }}>
                  <p className="text-[52px] font-extrabold leading-none mb-3 bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-violet-400">
                    {stat}
                  </p>
                  <p className={`text-[13px] leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{desc}*</p>
                </div>
              </Reveal>
            ))}
          </div>
          <p className={`text-center text-[11px] mb-16 italic ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
            *Based on external trading psychology research, not Zynth-specific data
          </p>

          {/* ── Testimonial cards ── */}
          <Reveal className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 border"
                 style={{background:'rgba(245,158,11,0.07)', borderColor:'rgba(245,158,11,0.22)'}}>
              <Star className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-bold tracking-[0.18em] text-amber-400">TESTIMONIALS</span>
            </div>
            <h2 className={`text-[42px] font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#1d4ed8] to-[#06b6d4]">What traders are saying</span>
            </h2>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { quote: 'Game changer for my gold trading. The Macro Surprise Score alone is worth it.', name: 'Ahmed K.', pair: 'XAU/USD Trader',  floatDelay: '0s'   },
              { quote: 'Finally a platform that combines journal + AI + market data. I found patterns I never knew existed.', name: 'Sarah M.',  pair: 'EUR/USD Trader',  floatDelay: '1s'   },
              { quote: 'The AI analysis identified I was overtrading on Mondays. Saved me hundreds.',                        name: 'Marcus T.', pair: 'Multi-pair Trader', floatDelay: '2s'   },
            ].map(({ quote, name, pair, floatDelay }, i) => (
              <Reveal key={name} delay={i * 0.14}>
                <div className="rounded-2xl p-7"
                     style={{
                       background: isDark ? '#0c1527' : '#ffffff',
                       border: '1px solid transparent',
                       backgroundImage: isDark
                         ? 'linear-gradient(#0c1527,#0c1527), linear-gradient(135deg,rgba(59,130,246,0.5),rgba(2,132,199,0.3),rgba(245,158,11,0.2))'
                         : 'linear-gradient(#ffffff,#ffffff), linear-gradient(135deg,rgba(59,130,246,0.4),rgba(2,132,199,0.2),rgba(245,158,11,0.15))',
                       backgroundOrigin: 'border-box',
                       backgroundClip: 'padding-box, border-box',
                       animation: `float 3.5s ease-in-out ${floatDelay} infinite`,
                       boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.05)',
                     }}>
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-[17px]" style={{color:'#f59e0b'}}>★</span>
                    ))}
                  </div>
                  <p className={`text-[14px] leading-relaxed mb-5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>"{quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0"
                         style={{background:'linear-gradient(135deg,#1d4ed8,#0284c7)'}}>
                      {name[0]}
                    </div>
                    <div>
                      <p className={`text-[13px] font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{name}</p>
                      <p className="text-[11px] text-blue-500/70">{pair}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ PRICING ═══════════════════════════ */}
      <section id="pricing" className={`py-24 px-6 transition-colors duration-300 ${isDark ? '' : 'bg-[#eef1f7]'}`} style={isDark ? {background:'#07090f'} : {}}>
        <div className="max-w-7xl mx-auto">
          <Reveal className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 border"
                 style={{background:'rgba(59,130,246,0.07)', borderColor:'rgba(59,130,246,0.22)'}}>
              <span className="text-[11px] font-bold tracking-[0.18em] text-blue-400">PRICING</span>
            </div>
            <h2 className={`text-[42px] font-extrabold tracking-tight mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#1d4ed8] to-[#06b6d4]">Plans for Every Trader</span>
            </h2>
            {/* Toggle */}
            <div className="inline-flex items-center gap-1 p-1 rounded-xl border"
                 style={{
                   background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                   borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
                 }}>
              <button onClick={() => setAnnual(false)}
                      className={`px-5 py-2 rounded-lg text-[13px] font-semibold transition-all ${!annual ? (isDark ? 'text-white bg-white/[0.08]' : 'text-gray-900 bg-black/[0.06]') : (isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600')}`}>
                Monthly
              </button>
              <button onClick={() => setAnnual(true)}
                      className={`flex items-center gap-2 px-5 py-2 rounded-lg text-[13px] font-semibold transition-all ${annual ? (isDark ? 'text-white bg-white/[0.08]' : 'text-gray-900 bg-black/[0.06]') : (isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600')}`}>
                Yearly
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md text-blue-400 bg-blue-500/15">Save 17%</span>
              </button>
            </div>
          </Reveal>

          {/* Founding member callout above grid */}
          {(spotsLeft ?? 0) > 0 && (
            <div style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))'
                : 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.04))',
              border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: '10px',
              padding: '14px 20px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}>
              <div>
                <p className="text-[13px]">
                  <Flame className="w-3.5 h-3.5 text-amber-400 inline-block mr-1" />{' '}<span style={{fontWeight:'bold', color:'#fbbf24'}}>FOUNDING MEMBER OFFER</span>{' '}
                  — First 100 users get Pro for{' '}
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>$1.99/month</span>{' '}
                  (regularly <span className="line-through opacity-60">$9</span>)
                </p>
                <p className={`text-[12px] mt-0.5 ${isDark ? 'opacity-50' : 'opacity-60 text-gray-700'}`}>
                  Only{' '}<span style={{color:'#fbbf24', fontWeight:'bold'}}>{spotsLeft}</span>{' '}spots remaining!
                </p>
              </div>
              <div className={`shrink-0 text-[12px] ${isDark ? '' : 'text-gray-600'}`} style={isDark ? {color:'rgba(255,255,255,0.6)'} : {}}>
                Expires in:{' '}
                <span style={{color:'#fbbf24', fontWeight:'bold'}}>
                  {countdown.d}d {countdown.h}h {countdown.m}m
                </span>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6">
            {activePlans.map((plan, i) => (
              <Reveal key={plan.name} delay={i * 0.12}>
                <div
                   className={`relative rounded-2xl overflow-visible border transition-all hover:-translate-y-1 ${plan.highlight ? 'border-blue-500/50' : ''}`}
                   style={plan.highlight
                     ? {background: isDark ? '#080f1a' : '#eff6ff', animation:'glowPulse 2.2s ease-in-out infinite', borderColor: undefined}
                     : {
                         background: isDark ? '#0c1527' : '#ffffff',
                         borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
                         boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.05)',
                       }}>
                  {/* Badge */}
                  {plan.highlight ? (
                    <div className="absolute -top-5 left-0 right-0 flex justify-center">
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold text-white flex items-center gap-1"
                            style={{background:'linear-gradient(90deg,#f59e0b,#ef4444)'}}>
                        <Flame className="w-2.5 h-2.5" /> {plan.badge}
                      </span>
                    </div>
                  ) : plan.badge ? (
                    <div className="absolute -top-4 left-0 right-0 flex justify-center">
                      <span className="px-4 py-1 rounded-full text-[11px] font-bold text-white"
                            style={{background:'linear-gradient(90deg,#3b82f6,#6366f1)'}}>
                        {plan.badge}
                      </span>
                    </div>
                  ) : null}

                  <div className="p-8 pt-12">
                    <h3 className={`text-[22px] font-bold mb-1 ${plan.highlight ? 'text-blue-400' : (isDark ? 'text-white' : 'text-gray-900')}`}>{plan.name}</h3>
                    <p className={`text-[13px] mb-4 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{plan.desc}</p>

                    {/* Price — show discount for plans with originalMonthly */}
                    {plan.originalMonthly ? (
                      <div className="mb-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[15px] line-through ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>${annual && plan.originalYearly ? plan.originalYearly : plan.originalMonthly}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                                style={{background:'rgba(245,158,11,0.18)', color:'#fbbf24'}}>
                            {plan.discountBadge}
                          </span>
                        </div>
                        {/* Price with drop-in + savings tooltip */}
                        <div className="relative group flex items-end gap-1">
                          <span className={`text-[16px] mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>$</span>
                          <span key={`${plan.name}-${annual}`}
                                className={`font-extrabold leading-none ${isDark ? 'text-white' : 'text-gray-900'} ${plan.highlight ? 'text-[68px]' : 'text-[48px]'}`}
                                style={{animation: plan.highlight ? 'priceDrop 0.55s cubic-bezier(0.34,1.2,0.64,1) both' : 'priceReveal 0.2s ease'}}>
                            {annual ? plan.yearly : plan.monthly}
                          </span>
                          <span className={`text-[13px] mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>/month</span>
                          {plan.highlight && (
                            <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                 style={{background:'rgba(59,130,246,0.18)', border:'1px solid rgba(59,130,246,0.35)', color:'#3b82f6'}}>
                              You save $85/year vs regular price
                            </div>
                          )}
                        </div>
                        {annual && plan.yearlyBilled && (
                          <p className="text-[11px] text-blue-500/80 mt-1">Billed as ${plan.yearlyBilled}/year</p>
                        )}
                        {annual && (
                          <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md text-blue-400 bg-blue-500/15 mt-1">Save 17%</span>
                        )}
                        {plan.highlight && (spotsLeft ?? 0) > 0 ? (
                          <>
                            <p className="text-[11px] text-amber-500/90 mt-1 font-semibold">
                              <Flame className="w-3 h-3 inline-block mr-0.5" /> Founding price · {spotsLeft} spots left
                            </p>
                            <div className="flex items-center gap-2 mt-1 mb-5">
                              <span className={`text-[10px] flex items-center gap-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}><Clock className="w-3 h-3" /> Offer expires in:</span>
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold" style={{color:'#fbbf24'}}>
                                {[{v: countdown.d, u:'d'},{v: countdown.h, u:'h'},{v: countdown.m, u:'m'},{v: countdown.s, u:'s'}].map(({v, u}) => (
                                  <span key={u} className="inline-flex items-center gap-0.5">
                                    <span key={`${u}-${v}`} style={{display:'inline-block', animation:'digitFlip 0.35s ease'}}>{v}</span>{u}
                                  </span>
                                ))}
                              </span>
                            </div>
                          </>
                        ) : (
                          !annual && <p className={`text-[11px] mb-6 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>billed monthly</p>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="flex items-end gap-1 mb-1">
                          <span className={`text-[16px] mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>$</span>
                          <span className={`text-[48px] font-extrabold leading-none ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {annual ? plan.yearly : plan.monthly}
                          </span>
                          <span className={`text-[13px] mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>/month</span>
                        </div>
                        <p className={`text-[11px] mb-6 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                          {plan.yearly === 0 ? 'Free forever' : annual ? 'if billed yearly' : 'billed monthly'}
                        </p>
                      </>
                    )}

                    <div className="space-y-3 mb-8">
                      {plan.features.map(f => (
                        <div key={f} className="flex items-center gap-3">
                          <Check className="w-4 h-4 shrink-0 text-blue-400" />
                          <span className={`text-[13px] ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{f}</span>
                        </div>
                      ))}
                    </div>
                    <button onClick={onGetStarted}
                            className="w-full py-3 rounded-xl text-[14px] font-semibold transition-all hover:brightness-110 text-white"
                            style={plan.highlight
                              ? {background:'linear-gradient(135deg,#1d4ed8,#0284c7)', boxShadow:'0 4px 16px rgba(59,130,246,0.35)'}
                              : {background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)', color: isDark ? 'white' : '#374151'}}>
                      {plan.highlight && (spotsLeft ?? 0) > 0 ? 'Claim Founding Price' : plan.cta}
                    </button>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          {annual && (
            <p className={`text-center mt-6 flex items-center justify-center gap-1.5 text-[13px] ${isDark ? '' : 'text-gray-400'}`} style={isDark ? {color:'rgba(255,255,255,0.35)'} : {}}>
              <Info className="w-3.5 h-3.5 shrink-0" /> Yearly plan billed as one payment. Cancel anytime within 7 days for full refund.
            </p>
          )}
        </div>
      </section>

      {/* ═══════════════════════════ FAQ ═══════════════════════════ */}
      <section id="faq" className="py-24 px-6 transition-colors duration-300" style={{background: isDark ? '#060a16' : '#f4f6f9'}}>
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 border"
                 style={{background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}}>  
              <span className={`text-[11px] font-bold tracking-[0.18em] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>SUPPORT</span>
            </div>
            <h2 className={`text-[42px] font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Frequently Asked Questions</h2>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-4">
            {FAQS.map((faq, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <div className="rounded-2xl border overflow-hidden"
                     style={{
                       background: isDark ? '#0c1527' : '#ffffff',
                       borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
                       boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.04)',
                     }}>
                  <button className="w-full flex items-center justify-between px-6 py-4 text-left gap-4"
                          onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <span className={`text-[14px] font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{faq.q}</span>
                    {openFaq === i
                      ? <ChevronUp className={`w-4 h-4 shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                      : <ChevronDown className={`w-4 h-4 shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />}
                  </button>
                  {openFaq === i && (
                    <div className={`px-6 pb-5 text-[13px] leading-relaxed border-t pt-3 ${isDark ? 'text-gray-500 border-white/[0.04]' : 'text-gray-500 border-black/[0.04]'}`}>
                      {faq.a}
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ BOTTOM CTA ═══════════════════════════ */}
      <section className="py-24 px-6 relative overflow-hidden transition-colors duration-300" style={{background: isDark ? '#07090f' : '#eef1f7'}}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px]"
               style={{background:'radial-gradient(ellipse,rgba(16,185,129,0.07) 0%,transparent 65%)'}} />
        </div>
        <Reveal className="relative z-10 max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

            {/* Left 60% */}
            <div className="flex-[3] text-center lg:text-left">
              <h2 className={`text-[38px] md:text-[50px] font-extrabold tracking-tight leading-[1.08] mb-5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Your Next Trade Could Be<br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#1d4ed8] to-[#06b6d4]">
                  Your Best Trade.
                </span>
              </h2>
              <p className={`text-[16px] mb-8 max-w-[420px] lg:max-w-none leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Join traders who use data instead of guessing. Start free, upgrade when you see the results.
              </p>
              <button onClick={onGetStarted}
                      className="group relative overflow-hidden inline-flex items-center gap-2 text-[16px] font-semibold text-white px-9 py-4 rounded-2xl hover:scale-[1.03] hover:shadow-[0_8px_32px_rgba(59,130,246,0.45)]"
                      style={{background:'linear-gradient(135deg,#1d4ed8 0%,#0284c7 100%)', boxShadow:'0 4px 20px rgba(59,130,246,0.28)'}}>
                <span className="relative z-10 flex items-center gap-2">
                  Start Finding My Patterns
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
                <span className="absolute inset-0 pointer-events-none"
                      style={{background:'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.14) 50%,transparent 100%)',backgroundSize:'200% 100%',animation:'shimmerBtn 3s linear infinite'}} />
              </button>
              <p className={`text-[12px] mt-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>No credit card required · Cancel anytime</p>
            </div>

            {/* Right 40% — cycling insight cards */}
            <div className="flex-[2] w-full max-w-sm lg:max-w-none">
              <div className="rounded-2xl p-6 border"
                   style={{
                     background: isDark ? '#0c1527' : '#ffffff',
                     borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
                     boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.06)',
                     minHeight:'180px', display:'flex', flexDirection:'column', justifyContent:'center',
                   }}>
                <p className={`text-[11px] font-bold tracking-[0.16em] mb-5 uppercase ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>AI Insights Panel</p>
                <div style={{
                  opacity: ctaInsightVisible ? 1 : 0,
                  transform: ctaInsightVisible ? 'translateY(0)' : 'translateY(10px)',
                  transition: 'opacity 0.38s ease, transform 0.38s ease',
                  willChange: 'opacity, transform',
                }}>
                  {(() => {
                    const insight = CTA_INSIGHTS[ctaInsightIdx];
                    const isAmber = insight.color === 'amber';
                    return (
                      <div className="rounded-xl px-4 py-4 border"
                           style={{
                             background: isAmber ? 'rgba(245,158,11,0.08)' : 'rgba(59,130,246,0.06)',
                             borderColor: isAmber ? 'rgba(245,158,11,0.25)' : 'rgba(59,130,246,0.22)',
                           }}>
                        <p className="text-[14px] font-semibold leading-snug"
                           style={{color: isAmber ? '#fbbf24' : '#3b82f6'}}>
                          {insight.text}
                        </p>
                      </div>
                    );
                  })()}
                </div>
                <div className="flex justify-center gap-2 mt-6">
                  {CTA_INSIGHTS.map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                         style={{background: i === ctaInsightIdx ? '#3b82f6' : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'), transform: i === ctaInsightIdx ? 'scale(1.3)' : 'scale(1)'}} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ═══════════════════════════ FOOTER ═══════════════════════════ */}
      <footer className={`border-t pt-16 pb-10 px-6 transition-colors duration-300`}
              style={{
                background: isDark ? '#07090f' : '#f4f6f9',
                borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)',
              }}>
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8 mb-12">

          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <img src="/logo.png" alt="Zynth" className="w-9 h-9 object-contain" />
              <span className={`text-[16px] font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Zynth</span>
            </div>
            <p className="text-[12px] leading-relaxed mb-4" style={{color:'rgba(52,211,153,0.5)'}}>Intelligence Behind Every Trade</p>
            <p className={`text-[11px] ${isDark ? 'text-gray-700' : 'text-gray-400'}`}>© 2026 Zynth. All rights reserved.</p>
          </div>

          {/* Product column */}
          <div>
            <p className={`text-[11px] font-bold tracking-[0.15em] uppercase mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Product</p>
            <ul className="space-y-2.5">
              {['Features','Pricing','FAQ','Changelog'].map(item => (
                <li key={item}>
                  <a href="#" className={`text-[13px] transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-700'}`}>{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources column */}
          <div>
            <p className={`text-[11px] font-bold tracking-[0.15em] uppercase mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Resources</p>
            <ul className="space-y-2.5">
              <li><a href="#" className={`text-[13px] transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-700'}`}>Help Center</a></li>
              <li><a href="/terms" className={`text-[13px] transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-700'}`}>Terms of Service</a></li>
              <li><a href="/privacy" className={`text-[13px] transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-700'}`}>Privacy Policy</a></li>
              <li><a href="/refund-policy" className={`text-[13px] transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-700'}`}>Refund Policy</a></li>
              <li><a href="/service-policy" className={`text-[13px] transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-700'}`}>Service Policy</a></li>
              <li><a href="/services" className={`text-[13px] transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-700'}`}>Our Services</a></li>
            </ul>
          </div>

          {/* Connect column */}
          <div>
            <p className={`text-[11px] font-bold tracking-[0.15em] uppercase mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Connect</p>
            <ul className="space-y-2.5">
              <li>
                <a href="mailto:getzynth@gmail.com" className={`text-[13px] transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-700'}`}>getzynth@gmail.com</a>
              </li>
            </ul>
            <div className="mt-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{background:'#34d399', boxShadow:'0 0 6px rgba(52,211,153,0.7)'}} />
              <span className={`text-[11px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Built for active traders</span>
            </div>
          </div>

        </div>
        <div className="max-w-7xl mx-auto border-t pt-6 flex flex-col md:flex-row items-center justify-between gap-3"
             style={{borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)'}}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <p style={{ fontSize: 11, color: isDark ? '#374151' : '#9ca3af' }}>© 2026 Zynth. All rights reserved.</p>
            <p style={{ fontSize: 11, color: isDark ? '#374151' : '#9ca3af' }}>Azeem Town, Sihala Street 2, Islamabad, Pakistan &nbsp;·&nbsp; <a href="tel:+923175516692" style={{ color: isDark ? '#4b5563' : '#6b7280', textDecoration: 'none' }}>+92 317 5516692</a> &nbsp;·&nbsp; <a href="mailto:getzynth@gmail.com" style={{ color: isDark ? '#4b5563' : '#6b7280', textDecoration: 'none' }}>getzynth@gmail.com</a></p>
          </div>
          <div className="flex gap-5">
            {[
              {href:'/privacy', label:'Privacy'},
              {href:'/terms', label:'Terms'},
              {href:'/refund-policy', label:'Refund Policy'},
              {href:'/service-policy', label:'Service Policy'},
              {href:'/services', label:'Services'},
              {href:'mailto:getzynth@gmail.com', label:'Contact'},
            ].map(({href, label}) => (
              <a key={label} href={href} className={`text-[11px] transition-colors ${isDark ? 'text-gray-700 hover:text-gray-500' : 'text-gray-400 hover:text-gray-600'}`}>{label}</a>
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
}
