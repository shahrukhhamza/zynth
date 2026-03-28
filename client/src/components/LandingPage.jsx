import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  BarChart2, BookOpen, Shield, Zap, Brain, Users,
  AlertCircle, FileSpreadsheet,
  Calendar, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Check, ArrowRight, Menu, X,
  RefreshCw, Bot, Trophy, Activity, Bell, Star, Info,
  Sun, Moon,
} from 'lucide-react';
import { API_URL } from '../config/api';
import { getPublicStats } from '../utils/publicStats';
import Hero from './Hero';
import AIInsightsSection from './AIInsightsSection';
import HowItWorks from './HowItWorks';
import WhyTradersFail from './WhyTradersFail';
import PricingPlanSelector from './pricing/PricingPlanSelector';
import { BrandMark } from './BrandLogo';
import { useTheme } from '../contexts/ThemeContext';
import { DEFAULT_BILLING_CYCLE, DEFAULT_SELECTED_PLAN, BILLING_PRICES, ANCHORED_PRICES } from '../config/pricingPlans';
import SocialProofToast from './SocialProofToast';

// ─── Testimonial data ────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    quote: "I kept blaming news events for my losses. After logging about 30 trades, the AI pointed out I was entering before confirmation, not waiting for structure to form. That one observation changed how I build setups.",
    timeRef: 'After 3 weeks of journaling',
    name: 'Daniel O.',
    role: 'GBP/USD intraday trader',
    avatarColor: 'linear-gradient(135deg,#1d4ed8,#0ea5e9)',
  },
  {
    quote: "I swing trade gold and some weeks just felt completely off. The macro context scores helped me realise I was positioning against the broader bias without knowing it. I have been far more selective since.",
    timeRef: 'Within the first month',
    name: 'Priya R.',
    role: 'XAU/USD swing trader, Asian session',
    avatarColor: 'linear-gradient(135deg,#7c3aed,#a855f7)',
  },
  {
    quote: "Honestly didn't expect much from another trading app. But having the journal, AI feedback, and economic calendar in one place meant I actually started reviewing my trades instead of just moving on.",
    timeRef: 'First 10 trades logged',
    name: 'James F.',
    role: 'Crypto and indices, part-time trader',
    avatarColor: 'linear-gradient(135deg,#0f766e,#06b6d4)',
  },
  {
    quote: "I used to think I had a strategy. Turns out I had a collection of habits, some good and some not. The pattern analysis made that very clear within the first two weeks. Uncomfortable but genuinely useful.",
    timeRef: 'Two weeks in',
    name: 'Tom B.',
    role: 'NAS100 scalper, London open',
    avatarColor: 'linear-gradient(135deg,#b45309,#f59e0b)',
  },
  {
    quote: "The economic calendar integration is what sold me. I used to miss high-impact events and wonder why my trades went sideways. Now I can see the context before I size up.",
    timeRef: 'After first month',
    name: 'Leila M.',
    role: 'EUR/USD and USD/JPY, news trader',
    avatarColor: 'linear-gradient(135deg,#be185d,#ec4899)',
  },
  {
    quote: "I was journaling in a spreadsheet before. This is a different experience. The AI feedback doesn't just describe what happened, it asks the kind of questions I should be asking myself.",
    timeRef: 'Within the first two weeks',
    name: 'Chris A.',
    role: 'Forex swing trader, multiple pairs',
    avatarColor: 'linear-gradient(135deg,#166534,#22c55e)',
  },
];

const T_N     = TESTIMONIALS.length;
const T_DUPED = [...TESTIMONIALS, ...TESTIMONIALS, ...TESTIMONIALS];
const T_TOTAL = T_DUPED.length;

function TestimonialCarousel({ isDark }) {
  const [visibleCount, setVisibleCount] = useState(3);
  const [index, setIndex]   = useState(T_N);
  const [animated, setAnimated] = useState(true);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      const next = w < 640 ? 1 : w < 1024 ? 2 : 3;
      setVisibleCount(next);
      setAnimated(false);
      setIndex(T_N);
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimated(true)));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setIndex(i => i + 1), 4000);
    return () => clearInterval(id);
  }, [paused]);

  // Seamless loop: jump silently to middle copy after transition
  useEffect(() => {
    if (index < T_N || index >= T_N * 2) {
      const target = index >= T_N * 2 ? T_N : T_N * 2 - 1;
      const t = setTimeout(() => {
        setAnimated(false);
        setIndex(target);
        requestAnimationFrame(() => requestAnimationFrame(() => setAnimated(true)));
      }, 560);
      return () => clearTimeout(t);
    }
  }, [index]);

  const trackPct    = (T_TOTAL / visibleCount) * 100;
  const translateX  = -((index / T_TOTAL) * 100);
  const activeDot   = ((index - T_N) % T_N + T_N) % T_N;

  const arrowCls  = 'flex items-center justify-center w-8 h-8 rounded-full border transition-all duration-200 hover:scale-105';
  const arrowStyle = {
    borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
    background:  isDark ? 'rgba(255,255,255,0.04)' : '#fff',
    color:       isDark ? '#9ca3af' : '#6b7280',
  };

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 border"
             style={{background:'rgba(245,158,11,0.07)', borderColor:'rgba(245,158,11,0.22)'}}>
          <Star className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] font-bold tracking-[0.18em] text-amber-400">TESTIMONIALS</span>
        </div>
        <h2 className={`text-[42px] font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#1d4ed8] to-[#06b6d4]">What traders are saying</span>
        </h2>
        <p className={`mt-3 text-[14px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          Trusted by traders improving their edge every day
        </p>
      </div>

      {/* Slider track */}
      <div
        className="overflow-hidden -mx-3 px-3"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          style={{
            display: 'flex',
            width: `${trackPct}%`,
            transform: `translateX(${translateX}%)`,
            transition: animated ? 'transform 0.55s cubic-bezier(0.4,0,0.2,1)' : 'none',
            willChange: 'transform',
          }}
        >
          {T_DUPED.map(({ quote, timeRef, name, role, avatarColor }, i) => (
            <div key={i} style={{ width: `${100 / T_TOTAL}%`, padding: '0 12px', boxSizing: 'border-box' }}>
              <div
                className="flex flex-col rounded-2xl p-6 border h-full"
                style={{
                  background:  isDark ? '#0f172a' : '#ffffff',
                  borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
                  boxShadow:   isDark ? '0 2px 20px rgba(0,0,0,0.5)' : '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.07)',
                }}
              >
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, s) => <span key={s} className="text-[13px]" style={{color:'#f59e0b',opacity:0.85}}>★</span>)}
                </div>
                <p className={`text-[13.5px] leading-relaxed flex-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>"{quote}"</p>
                <div className="mt-4 mb-4">
                  <span className={`inline-block text-[10.5px] font-semibold px-2.5 py-1 rounded-full border tracking-wide ${
                    isDark ? 'border-white/10 bg-white/5 text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-500'
                  }`}>{timeRef}</span>
                </div>
                <div className={`border-t mb-4 ${isDark ? 'border-white/[0.06]' : 'border-gray-100'}`} />
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0"
                       style={{background: avatarColor}}>{name[0]}</div>
                  <div>
                    <p className={`text-[13px] font-semibold leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{name}</p>
                    <p className={`text-[11px] mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{role}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-3 mt-8">
        <button aria-label="Previous" className={arrowCls} style={arrowStyle}
          onClick={() => { setAnimated(true); setIndex(i => i - 1); }}>
          <ChevronLeft size={14} />
        </button>
        {TESTIMONIALS.map((_, d) => (
          <button key={d} aria-label={`Slide ${d + 1}`}
            className="rounded-full transition-all duration-300"
            style={{
              width:      activeDot === d ? 20 : 8,
              height:     8,
              background: activeDot === d
                ? (isDark ? '#60a5fa' : '#1d4ed8')
                : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'),
            }}
            onClick={() => { setAnimated(true); setIndex(T_N + d); }}
          />
        ))}
        <button aria-label="Next" className={arrowCls} style={arrowStyle}
          onClick={() => { setAnimated(true); setIndex(i => i + 1); }}>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

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

const FAQS = [
  { q: 'What is Zynth?', a: 'Zynth is a professional trading intelligence platform built for serious traders. It combines live market data, AI-powered trade analysis, economic intelligence, and a rich trade journal — all in one dashboard.' },
  { q: 'Is my data safe?', a: 'Yes. All data is encrypted in transit (TLS 1.3) and stored securely. We never share or sell your trading data to anyone.' },
  { q: 'What is the Macro Surprise Score?', a: 'The Macro Surprise Score is our proprietary indicator that analyzes 10 major economic releases and calculates a single score (-10 to +10) showing whether macro conditions are bullish or bearish for gold (XAUUSD).' },
  { q: 'Is there a free plan?', a: 'Absolutely. The Free plan gives you access to core features including live markets, economic calendar, and even 3 free AI analysis tries — no credit card required.' },
  { q: 'What does the AI analysis include?', a: 'Our AI reads your trade history and journal entries to surface patterns, identify mistakes, and give you personalized improvement suggestions.' },
  { q: 'What markets does Zynth cover?', a: 'Zynth covers Forex (XAU/USD, EUR/USD, GBP/USD, USD/JPY), major crypto (BTC, ETH, XRP, SOL, BNB), US stocks (AAPL, TSLA, NVDA, MSFT, AMZN, GOOGL), and ETFs (SPY, GLD, TLT).' },
  { q: 'What are the subscription prices?', a: 'Pro is $9/month and Elite is $19/month. Both are billed monthly and you can cancel anytime. Free plan is available with no credit card required.' },
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
    bullets: ['Advanced AI analysis', 'Personalized to your trading style'],
  },
];


function LandingPricing({ isDark, onGetStarted }) {
  const [cycle, setCycle] = useState('annual');
  const isAnnual = cycle === 'annual';

  const elite = {
    price:    BILLING_PRICES[cycle].elite,
    anchored: ANCHORED_PRICES[cycle].elite,
    savings:  isAnnual ? `Save $${(BILLING_PRICES.monthly.elite * 12) - BILLING_PRICES.annual.elite}/year` : null,
    daily:    isAnnual ? (BILLING_PRICES.annual.elite / 365).toFixed(2) : null,
  };
  const pro = {
    price:    BILLING_PRICES[cycle].pro,
    anchored: ANCHORED_PRICES[cycle].pro,
    savings:  isAnnual ? `Save $${(BILLING_PRICES.monthly.pro * 12) - BILLING_PRICES.annual.pro}/year` : null,
    daily:    isAnnual ? (BILLING_PRICES.annual.pro / 365).toFixed(2) : null,
  };

  const eliteFeatures = [
    'Unlimited AI insights — no daily limits',
    'Premium strategy breakdowns and deeper reporting',
    'Advanced analytics dashboard',
    'Economic intelligence and macro context',
    'Unlimited journal entries',
    'Priority support and early feature access',
  ];
  const proFeatures = [
    '50 AI insights per month',
    'Advanced analytics dashboard',
    'Economic intelligence and macro context',
    'Unlimited journal entries',
    'Full access to all core trading tools',
  ];

  return (
    <section id="pricing" className="relative py-28 px-6 overflow-hidden">

      {/* ── Ambient glows ─────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {isDark ? (
          <>
            <div style={{ position:'absolute', top:'5%', left:'-5%', width:760, height:760, background:'radial-gradient(ellipse, rgba(124,58,237,0.16) 0%, transparent 65%)', borderRadius:'50%' }} />
            <div style={{ position:'absolute', top:'15%', right:'-5%', width:560, height:560, background:'radial-gradient(ellipse, rgba(59,130,246,0.11) 0%, transparent 65%)', borderRadius:'50%' }} />
            <div style={{ position:'absolute', top:'-5%', left:'50%', width:900, height:450, transform:'translateX(-50%)', background:'radial-gradient(ellipse, rgba(139,92,246,0.07) 0%, transparent 60%)' }} />
            <div style={{ position:'absolute', bottom:0, left:0, right:0, height:160, background:'linear-gradient(to bottom, transparent, rgba(2,6,23,0.6))' }} />
          </>
        ) : (
          <>
            <div style={{ position:'absolute', top:'0%', left:'-8%', width:700, height:700, background:'radial-gradient(ellipse, rgba(139,92,246,0.08) 0%, transparent 65%)', borderRadius:'50%' }} />
            <div style={{ position:'absolute', top:'10%', right:'-8%', width:520, height:520, background:'radial-gradient(ellipse, rgba(59,130,246,0.07) 0%, transparent 65%)', borderRadius:'50%' }} />
          </>
        )}
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">

        {/* ── Header ───────────────────────────────────────────────── */}
        <Reveal className="text-center mb-14">
          {/* Social proof */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5 text-[12px] font-medium ${
            isDark ? 'bg-white/[0.05] border border-white/[0.08] text-slate-400' : 'bg-white border border-slate-200 text-slate-500 shadow-sm'
          }`}>
            <span className="text-yellow-400 tracking-tight text-[13px]">★★★★★</span>
            <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>|</span>
            Trusted by <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>2,400+ traders</span>
          </div>

          {/* Section label */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-5 border block"
               style={{
                 background: isDark ? 'rgba(124,58,237,0.08)' : 'rgba(124,58,237,0.05)',
                 borderColor: isDark ? 'rgba(124,58,237,0.28)' : 'rgba(124,58,237,0.18)',
               }}>
            <span className="text-[11px] font-bold tracking-[0.18em] text-violet-400">PRICING</span>
          </div>

          <h2 className="text-[46px] md:text-[54px] font-black tracking-tight leading-[1.06] mb-4">
            {isDark ? (
              <span className="bg-clip-text text-transparent bg-gradient-to-br from-white via-slate-100 to-violet-300">
                Simple pricing,<br />serious results
              </span>
            ) : (
              <span className="bg-clip-text text-transparent bg-gradient-to-br from-gray-900 via-slate-800 to-violet-700">
                Simple pricing,<br />serious results
              </span>
            )}
          </h2>
          <p className={`text-[16px] max-w-sm mx-auto leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            No surprises. No lock-in. Cancel anytime.
          </p>
        </Reveal>

        {/* ── Billing toggle ───────────────────────────────────────── */}
        <Reveal className="flex items-center justify-center gap-4 mb-12">
          <div className="inline-flex rounded-full p-1"
               style={{
                 background: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                 border: isDark ? '1px solid rgba(255,255,255,0.09)' : '1px solid rgba(0,0,0,0.07)',
               }}>
            {['monthly', 'annual'].map((c) => (
              <button
                key={c}
                onClick={() => setCycle(c)}
                className="relative px-5 py-2 rounded-full text-[13px] font-semibold transition-all duration-200"
                style={cycle === c
                  ? isDark
                    ? { background: 'rgba(255,255,255,0.12)', color: '#ffffff', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }
                    : { background: '#ffffff', color: '#0f172a', boxShadow: '0 1px 4px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.04)' }
                  : { color: isDark ? '#64748b' : '#94a3b8' }
                }
              >
                {c === 'annual' ? 'Annual' : 'Monthly'}
              </button>
            ))}
          </div>
          {isAnnual && (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border
              ${isDark
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              2 months free
            </span>
          )}
        </Reveal>

        {/* ── Cards ────────────────────────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-5 items-stretch">

          {/* ── Elite ── */}
          <Reveal>
            <div
              className="rounded-[28px] relative overflow-hidden flex flex-col h-full transition-all duration-300 hover:-translate-y-1.5"
              style={isDark ? {
                background: 'linear-gradient(150deg, #1c0d40 0%, #13092f 40%, #0f1429 100%)',
                border: '1px solid rgba(168,85,247,0.3)',
                boxShadow: '0 0 0 1px rgba(168,85,247,0.07), 0 32px 80px rgba(0,0,0,0.7), 0 0 100px rgba(124,58,237,0.14)',
              } : {
                background: 'linear-gradient(155deg, #faf5ff 0%, #f3e8ff 25%, #ede9fe 55%, #ffffff 80%)',
                border: '1.5px solid rgba(139,92,246,0.28)',
                boxShadow: '0 0 0 4px rgba(139,92,246,0.06), 0 20px 60px rgba(124,58,237,0.12), 0 4px 16px rgba(0,0,0,0.04)',
              }}
            >
              {/* Top shine */}
              <div className="absolute inset-0 pointer-events-none"
                   style={{ background: isDark
                     ? 'radial-gradient(ellipse 80% 40% at 50% -5%, rgba(168,85,247,0.22) 0%, transparent 60%)'
                     : 'radial-gradient(ellipse 80% 40% at 50% -5%, rgba(167,139,250,0.22) 0%, transparent 60%)' }} />

              <div className="relative p-8 md:p-9 flex flex-col flex-1">

                {/* Plan header */}
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] mb-3"
                          style={isDark ? {
                            background: 'rgba(168,85,247,0.18)', border: '1px solid rgba(168,85,247,0.35)', color: '#c084fc',
                          } : {
                            background: 'linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(167,139,250,0.08) 100%)',
                            border: '1px solid rgba(139,92,246,0.3)', color: '#6d28d9',
                            boxShadow: '0 1px 4px rgba(139,92,246,0.1)',
                          }}>
                      🔥 Most Popular
                    </span>
                    <h3 className={`text-[22px] font-extrabold tracking-tight leading-none ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Elite
                    </h3>
                    <p className={`text-[13.5px] mt-1.5 leading-snug ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      For traders who operate without limits
                    </p>
                  </div>
                  {isAnnual && elite.savings && (
                    <span className={`shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-lg mt-1 ${
                      isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>{elite.savings}</span>
                  )}
                </div>

                {/* Price block */}
                <div className="mb-7 pb-6"
                     style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(139,92,246,0.12)' }}>
                  <div className="flex items-end gap-2 mb-1">
                    {elite.anchored > elite.price && (
                      <span className={`pb-2.5 text-[14px] font-medium line-through ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                        ${elite.anchored}
                      </span>
                    )}
                    <span className={`text-[60px] font-black leading-none tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      ${elite.price}
                    </span>
                    <div className="pb-2.5">
                      <div className={`text-[13px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        /{isAnnual ? 'year' : 'month'}
                      </div>
                      {elite.daily && (
                        <div className={`text-[11px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                          ${elite.daily}/day
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={() => onGetStarted?.({ plan: 'elite', billingCycle: cycle })}
                  className="w-full rounded-xl py-[14px] text-[14px] font-bold text-white mb-7 transition-all duration-200 active:scale-[0.98] tracking-wide"
                  style={{ background: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 50%, #8b5cf6 100%)', boxShadow: isDark ? '0 4px 24px rgba(124,58,237,0.4), 0 1px 4px rgba(0,0,0,0.3)' : '0 6px 24px rgba(109,40,217,0.32), 0 2px 6px rgba(109,40,217,0.18)' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 10px 36px rgba(124,58,237,0.55), 0 2px 8px rgba(0,0,0,0.2)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = isDark ? '0 4px 24px rgba(124,58,237,0.4), 0 1px 4px rgba(0,0,0,0.3)' : '0 6px 24px rgba(109,40,217,0.32), 0 2px 6px rgba(109,40,217,0.18)'; e.currentTarget.style.transform = ''; }}
                >
                  Get Elite Access →
                </button>

                {/* Features */}
                <p className={`text-[10.5px] font-extrabold uppercase tracking-[0.14em] mb-4 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                  Everything in Pro, plus:
                </p>
                <ul className="space-y-3 flex-1">
                  {eliteFeatures.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <span className="shrink-0 mt-[1px] w-[18px] h-[18px] rounded-full flex items-center justify-center"
                            style={isDark
                              ? { background: 'rgba(167,139,250,0.15)', boxShadow: '0 0 0 2px rgba(167,139,250,0.08)' }
                              : { background: 'rgba(139,92,246,0.12)', boxShadow: '0 0 0 3px rgba(139,92,246,0.06)' }}>
                        <Check className="w-[9px] h-[9px]" style={{ color: isDark ? '#c084fc' : '#7c3aed' }} />
                      </span>
                      <span className={`text-[13px] leading-snug ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>

          {/* ── Pro ── */}
          <Reveal delay={0.1}>
            <div
              className="rounded-[28px] relative overflow-hidden flex flex-col h-full transition-all duration-300 hover:-translate-y-1.5"
              style={isDark ? {
                background: 'linear-gradient(150deg, #060f22 0%, #091528 50%, #0a1628 100%)',
                border: '1px solid rgba(59,130,246,0.15)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.04)',
              } : {
                background: 'linear-gradient(155deg, #eff6ff 0%, #dbeafe 25%, #e0f2fe 50%, #ffffff 80%)',
                border: '1.5px solid rgba(59,130,246,0.2)',
                boxShadow: '0 0 0 4px rgba(59,130,246,0.04), 0 16px 48px rgba(37,99,235,0.09), 0 4px 12px rgba(0,0,0,0.04)',
              }}
            >
              {/* Top shine */}
              <div className="absolute inset-0 pointer-events-none"
                   style={{ background: isDark
                     ? 'radial-gradient(ellipse 80% 40% at 50% -5%, rgba(59,130,246,0.14) 0%, transparent 60%)'
                     : 'radial-gradient(ellipse 80% 40% at 50% -5%, rgba(147,197,253,0.25) 0%, transparent 60%)' }} />

              <div className="relative p-8 md:p-9 flex flex-col flex-1">

                {/* Plan header */}
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] mb-3"
                          style={isDark ? {
                            background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)', color: '#93c5fd',
                          } : {
                            background: 'rgba(219,234,254,0.8)', border: '1px solid rgba(147,197,253,0.5)', color: '#1d4ed8',
                          }}>
                      ⚡ Great Value
                    </span>
                    <h3 className={`text-[22px] font-extrabold tracking-tight leading-none ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Pro
                    </h3>
                    <p className={`text-[13.5px] mt-1.5 leading-snug ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      AI-powered feedback to build consistency
                    </p>
                  </div>
                  {isAnnual && pro.savings && (
                    <span className={`shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-lg mt-1 ${
                      isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>{pro.savings}</span>
                  )}
                </div>

                {/* Price block */}
                <div className="mb-7 pb-6"
                     style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(59,130,246,0.1)' }}>
                  <div className="flex items-end gap-2 mb-1">
                    {pro.anchored > pro.price && (
                      <span className={`pb-2.5 text-[14px] font-medium line-through ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                        ${pro.anchored}
                      </span>
                    )}
                    <span className={`text-[60px] font-black leading-none tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      ${pro.price}
                    </span>
                    <div className="pb-2.5">
                      <div className={`text-[13px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        /{isAnnual ? 'year' : 'month'}
                      </div>
                      {pro.daily && (
                        <div className={`text-[11px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                          ${pro.daily}/day
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={() => onGetStarted?.({ plan: 'pro', billingCycle: cycle })}
                  className="w-full rounded-xl py-[14px] text-[14px] font-bold mb-7 transition-all duration-200 active:scale-[0.98] tracking-wide"
                  style={isDark ? {
                    background: 'rgba(59,130,246,0.12)',
                    border: '1px solid rgba(59,130,246,0.25)',
                    color: '#93c5fd',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                  } : {
                    background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 55%, #3b82f6 100%)',
                    color: '#ffffff',
                    boxShadow: '0 5px 20px rgba(37,99,235,0.3), 0 2px 6px rgba(37,99,235,0.15)',
                  }}
                  onMouseEnter={e => {
                    if (isDark) {
                      e.currentTarget.style.background = 'rgba(59,130,246,0.2)';
                      e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)';
                      e.currentTarget.style.color = '#ffffff';
                    } else {
                      e.currentTarget.style.boxShadow = '0 10px 32px rgba(37,99,235,0.4), 0 2px 8px rgba(37,99,235,0.2)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (isDark) {
                      e.currentTarget.style.background = 'rgba(59,130,246,0.12)';
                      e.currentTarget.style.borderColor = 'rgba(59,130,246,0.25)';
                      e.currentTarget.style.color = '#93c5fd';
                    } else {
                      e.currentTarget.style.boxShadow = '0 5px 20px rgba(37,99,235,0.3), 0 2px 6px rgba(37,99,235,0.15)';
                      e.currentTarget.style.transform = '';
                    }
                  }}
                >
                  Start with Pro →
                </button>

                {/* Features */}
                <p className={`text-[10.5px] font-extrabold uppercase tracking-[0.14em] mb-4 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                  What's included:
                </p>
                <ul className="space-y-3 flex-1">
                  {proFeatures.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <span className="shrink-0 mt-[1px] w-[18px] h-[18px] rounded-full flex items-center justify-center"
                            style={isDark
                              ? { background: 'rgba(96,165,250,0.13)', boxShadow: '0 0 0 2px rgba(96,165,250,0.07)' }
                              : { background: 'rgba(59,130,246,0.1)', boxShadow: '0 0 0 3px rgba(59,130,246,0.05)' }}>
                        <Check className="w-[9px] h-[9px]" style={{ color: isDark ? '#60a5fa' : '#2563eb' }} />
                      </span>
                      <span className={`text-[13px] leading-snug ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </div>

        {/* ── Trust signals ────────────────────────────────────────── */}
        <Reveal className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {[
            { label: 'Cancel anytime', icon: '✓' },
            { label: 'No hidden fees', icon: '✓' },
            { label: 'Secure checkout', icon: '🔒' },
            { label: 'Instant access', icon: '⚡' },
          ].map((t) => (
            <span key={t.label} className={`flex items-center gap-1.5 text-[12px] font-medium ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
              <span className={`text-emerald-500 text-[11px]`}>{t.icon}</span>
              {t.label}
            </span>
          ))}
        </Reveal>

        {/* ── Free plan ────────────────────────────────────────────── */}
        <Reveal className="mt-6 text-center">
          <div className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl ${
            isDark
              ? 'bg-white/[0.03] border border-white/[0.06]'
              : 'bg-white border border-slate-200/80 shadow-sm'
          }`}>
            <span className={`text-[13px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Not ready to commit?
            </span>
            <div className={`w-px h-3.5 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
            <button
              onClick={() => onGetStarted?.({ plan: 'free', billingCycle: 'monthly' })}
              className={`text-[13px] font-semibold transition-all hover:opacity-80
                ${isDark ? 'text-violet-400' : 'text-violet-600'}`}
            >
              Start free — no card needed →
            </button>
          </div>
        </Reveal>

      </div>
    </section>
  );
}

export default function LandingPage({ onSignIn, onGetStarted }) {
  const { isDark, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [landingBillingCycle, setLandingBillingCycle] = useState(DEFAULT_BILLING_CYCLE);
  const [selectedPlan, setSelectedPlan] = useState(DEFAULT_SELECTED_PLAN);
  const [openFaq, setOpenFaq] = useState(null);
  const [bannerDismissed, setBannerDismissed] = useState(
    () => sessionStorage.getItem('bannerDismissed') === '1'
  );
  const [spotsLeft, setSpotsLeft] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [countdown, setCountdown] = useState({ d: 30, h: 0, m: 0, s: 0 });
  // const [badgeIdx, setBadgeIdx] = useState(0);
  // const [badgeFade, setBadgeFade] = useState(true);
  const [journalStep, setJournalStep] = useState(0);
  const [liveMarkets, setLiveMarkets] = useState(INITIAL_MARKETS);
  const [flashMap, setFlashMap] = useState({});
  const [needleAngle, setNeedleAngle] = useState(-90);
  const [ctaInsightIdx, setCtaInsightIdx] = useState(0);
  const [ctaInsightVisible, setCtaInsightVisible] = useState(true);

  // ── Custom cursor state
  const cursorRingRef  = useRef(null);
  const cursorGlowRef  = useRef(null);
  const mousePos       = useRef({ x: -200, y: -200 });
  const ringPos        = useRef({ x: -200, y: -200 });
  const isHovering     = useRef(false);
  const rafId          = useRef(null);
  const [cursorVisible, setCursorVisible] = useState(false);

  useEffect(() => {
    const onMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      if (!cursorVisible) setCursorVisible(true);
      if (cursorGlowRef.current) {
        cursorGlowRef.current.style.background =
          `radial-gradient(circle 280px at ${e.clientX}px ${e.clientY}px, ${isDark ? 'rgba(59,130,246,0.055)' : 'rgba(29,78,216,0.045)'} 0%, transparent 70%)`;
      }
    };

    const onEnterInteractive = () => { isHovering.current = true; };
    const onLeaveInteractive = () => { isHovering.current = false; };
    const onLeave = () => setCursorVisible(false);
    const onEnter = () => setCursorVisible(true);

    function lerp(a, b, t) { return a + (b - a) * t; }
    function animate() {
      ringPos.current.x = lerp(ringPos.current.x, mousePos.current.x, 0.28);
      ringPos.current.y = lerp(ringPos.current.y, mousePos.current.y, 0.28);
      if (cursorRingRef.current) {
        const hover = isHovering.current;
        const size  = hover ? 110 : 72;
        cursorRingRef.current.style.transform = `translate(${ringPos.current.x - size / 2}px, ${ringPos.current.y - size / 2}px)`;
        cursorRingRef.current.style.width  = `${size}px`;
        cursorRingRef.current.style.height = `${size}px`;
        cursorRingRef.current.style.opacity = hover ? '1' : '0.6';
        const color = isDark
          ? (hover ? 'rgba(99,160,255,0.28)' : 'rgba(59,130,246,0.18)')
          : (hover ? 'rgba(29,78,216,0.2)'  : 'rgba(59,130,246,0.13)');
        cursorRingRef.current.style.background = `radial-gradient(circle, ${color} 0%, transparent 75%)`;
      }
      rafId.current = requestAnimationFrame(animate);
    }
    rafId.current = requestAnimationFrame(animate);

    const selectors = 'a, button, [role="button"], input, select, textarea, label, .hover\\:-translate-y-1';
    function attachListeners() {
      document.querySelectorAll(selectors).forEach(el => {
        el.addEventListener('mouseenter', onEnterInteractive);
        el.addEventListener('mouseleave', onLeaveInteractive);
      });
    }
    attachListeners();
    const obs = new MutationObserver(attachListeners);
    obs.observe(document.body, { childList: true, subtree: true });

    document.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseenter', onEnter);
      cancelAnimationFrame(rafId.current);
      obs.disconnect();
    };
  }, [isDark]);

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

  // Badge rotation — temporarily disabled
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setBadgeFade(false);
  //     setTimeout(() => {
  //       setBadgeIdx(i => (i + 1) % BADGE_TEXTS.length);
  //       setBadgeFade(true);
  //     }, 320);
  //   }, 2200);
  //   return () => clearInterval(interval);
  // }, []);

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

  function dismissBanner() {
    setBannerDismissed(true);
    sessionStorage.setItem('bannerDismissed', '1');
  }

  const SEO_TITLE       = 'Zynth — AI-Powered Trading Intelligence Platform';
  const SEO_DESCRIPTION = 'Institutional-grade macro analysis, AI trade journaling, and real-time market data for gold, forex and commodity traders.';
  const SEO_URL         = 'https://zynth.codes';
  const SEO_IMAGE       = 'https://zynth.codes/og-image.png';

  return (
    <>
    <Helmet>
      {/* Primary */}
      <title>{SEO_TITLE}</title>
      <meta name="description" content={SEO_DESCRIPTION} />
      <link rel="canonical" href={SEO_URL} />

      {/* Open Graph */}
      <meta property="og:type"        content="website" />
      <meta property="og:url"         content={SEO_URL} />
      <meta property="og:title"       content={SEO_TITLE} />
      <meta property="og:description" content={SEO_DESCRIPTION} />
      <meta property="og:image"       content={SEO_IMAGE} />

      {/* Twitter Card */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:url"         content={SEO_URL} />
      <meta name="twitter:title"       content={SEO_TITLE} />
      <meta name="twitter:description" content={SEO_DESCRIPTION} />
      <meta name="twitter:image"       content={SEO_IMAGE} />

      {/* Google Search Console Verification */}
      <meta name="google-site-verification" content="ar5DP4kEm7pNSlXYxO2CBLT0yc1Arr-whW3ymDjeflY" />
    </Helmet>
    <div
      className={`min-h-screen overflow-x-hidden transition-colors duration-300 ${isDark ? 'bg-[#020617] text-white' : 'bg-[#f8fafc] text-[#0a0e1a]'}`}
      style={{
        backgroundImage: isDark
          ? 'radial-gradient(ellipse 120% 50% at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 55%), radial-gradient(ellipse 120% 50% at 50% 100%, rgba(59,130,246,0.07) 0%, transparent 55%)'
          : 'radial-gradient(ellipse 110% 65% at 50% -10%, rgba(99,102,241,0.07) 0%, transparent 55%), radial-gradient(ellipse 70% 55% at 95% 105%, rgba(168,85,247,0.05) 0%, transparent 55%), radial-gradient(ellipse 140% 28% at 50% 52%, rgba(99,102,241,0.04) 0%, transparent 65%)',
      }}
    >

      {/* ── Custom cursor layers ────────────────────────────────────────── */}
      {/* Full-page ambient glow that follows mouse */}
      <div
        ref={cursorGlowRef}
        style={{
          position: 'fixed', inset: 0, zIndex: 0,
          pointerEvents: 'none',
          transition: 'opacity 0.3s ease',
          opacity: cursorVisible ? 1 : 0,
          background: 'radial-gradient(circle 280px at -400px -400px, transparent 0%, transparent 70%)',
        }}
      />
      {/* Soft glow blob trailing cursor */}
      <div
        ref={cursorRingRef}
        style={{
          position: 'fixed', top: 0, left: 0,
          width: '72px', height: '72px',
          borderRadius: '50%',
          background: isDark ? 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 75%)' : 'radial-gradient(circle, rgba(59,130,246,0.13) 0%, transparent 75%)',
          filter: 'blur(18px)',
          pointerEvents: 'none',
          zIndex: 99998,
          willChange: 'transform, width, height',
          transition: 'width 0.22s ease, height 0.22s ease, opacity 0.25s ease',
          opacity: cursorVisible ? 0.6 : 0,
          mixBlendMode: isDark ? 'screen' : 'normal',
        }}
      />
      <style>{`
        @keyframes urgencyPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.25); }
          50%       { box-shadow: 0 0 0 8px rgba(245,158,11,0); }
        }
        @keyframes proCardGlow {
          0%, 100% { box-shadow: 0 0 0 1px rgba(59,130,246,0.2), 0 24px 60px rgba(0,0,0,0.5), 0 0 30px rgba(59,130,246,0.1); }
          50%       { box-shadow: 0 0 0 1px rgba(59,130,246,0.5), 0 24px 60px rgba(0,0,0,0.5), 0 0 60px rgba(59,130,246,0.3); }
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
          0%, 100% { box-shadow: 0 0 20px rgba(59,130,246,0.3), 0 0 0 1px rgba(59,130,246,0.3), 0 24px 60px rgba(0,0,0,0.5); }
          50%       { box-shadow: 0 0 45px rgba(59,130,246,0.65), 0 0 0 1px rgba(59,130,246,0.6), 0 24px 60px rgba(0,0,0,0.5); }
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
          0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.5); }
          60%      { box-shadow: 0 0 0 5px rgba(59,130,246,0); }
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
          background: #3b82f6;
          transition: width 0.22s ease;
        }
        .nav-link-hover:hover::after { width: 100%; }
      `}</style>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          background: scrolled
            ? (isDark ? 'rgba(2,6,23,0.92)' : 'rgba(248,250,252,0.94)')
            : 'transparent',
          backdropFilter: scrolled ? 'blur(16px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
          borderBottomColor: scrolled
            ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)')
            : 'transparent',
          boxShadow: scrolled ? (isDark ? '0 4px 24px rgba(0,0,0,0.35)' : '0 4px 24px rgba(0,0,0,0.08)') : 'none',
          transition: 'background 0.3s ease, backdrop-filter 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
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
            <BrandMark size={36} />
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
                    className="text-[13px] font-semibold text-white px-5 py-2.5 rounded-xl transition-all hover:brightness-110 hover:scale-[1.03]"
                    style={{background:'linear-gradient(135deg,#1d4ed8,#0284c7)', boxShadow:'0 4px 16px rgba(59,130,246,0.3)'}}>
              Analyze My Trades
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
                 background: isDark ? 'rgba(2,6,23,0.98)' : 'rgba(244,246,249,0.98)',
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
                Analyze My Trades
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ═══════════════════════════ HERO ═══════════════════════════ */}
      <Hero
        spotsLeft={spotsLeft}
        onGetStarted={onGetStarted}
        onSignIn={onSignIn}
      />

      {/* ═══════════════ AI INSIGHTS DEMO SECTION ════════════════════ */}
      <AIInsightsSection onGetStarted={onGetStarted} />

      {/* ═══════════════════════ HOW IT WORKS ════════════════════════ */}
      <HowItWorks onGetStarted={onGetStarted} />

      {/* ════════════════════ WHY TRADERS FAIL ══════════════════════ */}
      <WhyTradersFail onGetStarted={onGetStarted} />

      {/* ═══════════════════════════ FEATURES ═══════════════════════════ */}
      <section id="features" className="pt-16 pb-24 px-6 transition-colors duration-300">
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
            <p className={`text-[16px] max-w-[480px] mx-auto ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>One platform to replace five tabs, three spreadsheets, and two notebooks.</p>
          </Reveal>

          {/* Feature row 1 — Trade Journal */}
          <Reveal delay={0.1} className="flex flex-col lg:flex-row items-center gap-12 mb-28">
            {/* Mockup */}
            <div className="flex-1 w-full">
              <div className="rounded-2xl border overflow-hidden"
                   style={{
                     background: isDark ? '#0f172a' : '#ffffff',
                     borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
                     boxShadow: isDark ? '0 24px 64px rgba(0,0,0,0.55)' : '0 4px 6px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.08)',
                   }}>
                <div className="px-4 py-3 border-b flex items-center gap-2"
                     style={{background: isDark ? '#0c1420' : '#f8fafc', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}}>
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
              <p className={`text-[15px] leading-relaxed mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Every trade tells a story. Add notes about your setup, tag your strategy, attach screenshots, and track how you felt. When you review your journal later, the patterns become obvious.
              </p>
              {[
                'Notes, tags & screenshot attachments',
                'Emotional tracking & trade ratings',
                'Pre-trade checklists & templates',
              ].map(b => (
                <div key={b} className="flex items-center gap-3 mb-3">
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className={`text-[14px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{b}</span>
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
                     background: isDark ? '#0f172a' : '#ffffff',
                     borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
                     boxShadow: isDark ? '0 24px 64px rgba(0,0,0,0.55)' : '0 4px 6px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.08)',
                   }}>
                <div className="px-4 py-3 border-b flex items-center gap-2"
                     style={{background: isDark ? '#0c1420' : '#f8fafc', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}}>
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
              <p className={`text-[15px] leading-relaxed mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Monitor every major asset class in real time. Forex, indices, commodities, crypto — all ticking live on one screen, with economic events overlaid for full context.
              </p>
              {[
                'Real-time Forex, indices, crypto & commodities',
                'Economic calendar events overlaid on charts',
                'Custom watchlists & price alerts',
              ].map(b => (
                <div key={b} className="flex items-center gap-3 mb-3">
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className={`text-[14px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{b}</span>
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
      <section className="py-16 px-6 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURE_CARDS.map(({ Icon, title, desc, bullets }, i) => (
              <Reveal key={title} delay={i * 0.12}>
                <div
                   className="rounded-2xl p-7 border h-full hover:-translate-y-1 transition-all duration-300"
                   style={{
                     background: isDark ? '#0f172a' : '#ffffff',
                     borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
                     boxShadow: isDark ? '0 4px 32px rgba(0,0,0,0.5)' : '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.07)',
                   }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                       style={{background:'linear-gradient(135deg,rgba(59,130,246,0.15),rgba(59,130,246,0.04))', border:'1px solid rgba(59,130,246,0.15)'}}>
                    <Icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className={`text-[20px] font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
                  <p className={`text-[13px] leading-relaxed mb-5 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>{desc}</p>
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
      <section className="py-24 px-6 relative overflow-hidden transition-colors duration-300">
        <div className="absolute inset-0 pointer-events-none">
          {!isDark && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px]"
                 style={{background: 'radial-gradient(ellipse,rgba(99,102,241,0.10) 0%,transparent 60%)'}} />
          )}
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
            <p className={`text-[16px] mb-14 max-w-md mx-auto ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
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
                        stroke={isDark ? 'rgba(52,211,153,0.55)' : 'rgba(59,130,246,0.55)'} strokeWidth="9" strokeLinecap="round"
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
                  <circle cx="100" cy="100" r="5.5" fill={isDark ? '#020617' : '#f8fafc'} stroke={isDark ? 'white' : '#0a0e1a'} strokeWidth="2" />
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
      <section className="py-20 px-6 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">

          {/* ── Stats cards ── */}
          <Reveal className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 border"
                 style={{background:'rgba(59,130,246,0.07)', borderColor:'rgba(59,130,246,0.22)'}}>
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[11px] font-bold tracking-[0.18em] text-blue-400">RESEARCH</span>
            </div>
            <h2 className={`text-[36px] md:text-[42px] font-extrabold tracking-tight mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <span className={`bg-clip-text text-transparent bg-gradient-to-r ${isDark ? 'from-sky-400 to-violet-400' : 'from-[#1d4ed8] to-[#0284c7]'}`}>The Data Behind Better Trading</span>
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
                       background: isDark ? '#0f172a' : '#ffffff',
                       borderColor: isDark ? 'rgba(59,130,246,0.18)' : 'rgba(59,130,246,0.14)',
                       boxShadow: isDark ? '0 4px 32px rgba(0,0,0,0.5)' : '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.07)',
                     }}>
                  <p className="text-[52px] font-extrabold leading-none mb-3 bg-clip-text text-transparent bg-gradient-to-r from-[#1d4ed8] to-[#0284c7]">
                    {stat}
                  </p>
                  <p className={`text-[13px] leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{desc}*</p>
                </div>
              </Reveal>
            ))}
          </div>
          <p className={`text-center text-[11px] mb-16 italic ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
            *Based on external trading psychology research, not Zynth-specific data
          </p>

          {/* ── Testimonial carousel ── */}
          <TestimonialCarousel isDark={isDark} />
        </div>
      </section>

      {/* ═══════════════════════════ PRICING ═══════════════════════════ */}
      <LandingPricing isDark={isDark} onGetStarted={onGetStarted} />

      {/* ═══════════════════════════ FAQ ═══════════════════════════ */}
      <section id="faq" className="py-24 px-6 transition-colors duration-300">
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
                       background: isDark ? '#0f172a' : '#ffffff',
                       borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
                       boxShadow: isDark ? '0 2px 24px rgba(0,0,0,0.45)' : '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.07)',
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
      <section className="py-24 px-6 relative overflow-hidden transition-colors duration-300">
        <div className="absolute inset-0 pointer-events-none">
          {!isDark && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px]"
                 style={{background: 'radial-gradient(ellipse,rgba(99,102,241,0.09) 0%,transparent 60%)'}} />
          )}
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
                  Start Improving My Trades
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
                <span className="absolute inset-0 pointer-events-none"
                      style={{background:'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.14) 50%,transparent 100%)',backgroundSize:'200% 100%',animation:'shimmerBtn 3s linear infinite'}} />
              </button>
              <p className={`text-[12px] mt-4 ${isDark ? 'text-gray-600' : 'text-gray-500'}`}>No credit card required · Cancel anytime</p>
            </div>

            {/* Right 40% — cycling insight cards */}
            <div className="flex-[2] w-full max-w-sm lg:max-w-none">
              <div className="rounded-2xl p-6 border"
                   style={{
                     background: isDark ? '#0f172a' : '#ffffff',
                     borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
                     boxShadow: isDark ? '0 4px 28px rgba(0,0,0,0.5)' : '0 1px 3px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.07)',
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
                             background: isAmber
                               ? (isDark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.10)')
                               : (isDark ? 'rgba(59,130,246,0.06)' : 'rgba(59,130,246,0.10)'),
                             borderColor: isAmber ? 'rgba(245,158,11,0.30)' : (isDark ? 'rgba(59,130,246,0.22)' : 'rgba(59,130,246,0.38)'),
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
                background: 'transparent',
                borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)',
              }}>
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8 mb-12">

          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <BrandMark size={36} />
              <span className={`text-[16px] font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Zynth</span>
            </div>
            <p className="text-[12px] leading-relaxed mb-4" style={{color: isDark ? 'rgba(52,211,153,0.5)' : '#6b7280'}}>Intelligence Behind Every Trade</p>
            <p className={`text-[11px] ${isDark ? 'text-gray-700' : 'text-gray-500'}`}>© 2026 Zynth. All rights reserved.</p>
          </div>

          {/* Product column */}
          <div>
            <p className={`text-[11px] font-bold tracking-[0.15em] uppercase mb-4 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Product</p>
            <ul className="space-y-2.5">
              {['Features','Pricing','FAQ','Changelog'].map(item => (
                <li key={item}>
                  <a href={item === 'Pricing' ? '/pricing' : '#'} className={`text-[13px] transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-800'}`}>{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources column */}
          <div>
            <p className={`text-[11px] font-bold tracking-[0.15em] uppercase mb-4 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Resources</p>
            <ul className="space-y-2.5">
              <li><a href="#" className={`text-[13px] transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-800'}`}>Help Center</a></li>
              <li><a href="/terms" className={`text-[13px] transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-800'}`}>Terms of Service</a></li>
              <li><a href="/privacy" className={`text-[13px] transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-800'}`}>Privacy Policy</a></li>
              <li><a href="/refund" className={`text-[13px] transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-800'}`}>Refund Policy</a></li>
              <li><a href="/service-policy" className={`text-[13px] transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-800'}`}>Service Policy</a></li>
              <li><a href="/services" className={`text-[13px] transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-800'}`}>Our Services</a></li>
            </ul>
          </div>

          {/* Connect column */}
          <div>
            <p className={`text-[11px] font-bold tracking-[0.15em] uppercase mb-4 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Connect</p>
            <ul className="space-y-2.5">
              <li>
                <a href="mailto:getzynth@gmail.com" className={`text-[13px] transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-800'}`}>getzynth@gmail.com</a>
              </li>
            </ul>
            <div className="mt-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{background: isDark ? '#34d399' : '#3b82f6', boxShadow: isDark ? '0 0 6px rgba(52,211,153,0.7)' : '0 0 6px rgba(59,130,246,0.7)'}} />
              <span className={`text-[11px] ${isDark ? 'text-gray-600' : 'text-gray-500'}`}>Built for active traders</span>
            </div>
          </div>

        </div>
        <div className="max-w-7xl mx-auto border-t pt-6 flex flex-col md:flex-row items-center justify-between gap-3"
             style={{borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)'}}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <p style={{ fontSize: 11, color: isDark ? '#374151' : '#6b7280' }}>© 2026 Zynth. All rights reserved.</p>
            <p style={{ fontSize: 11, color: isDark ? '#374151' : '#6b7280' }}>Azeem Town, Sihala Street 2, Islamabad, Pakistan &nbsp;·&nbsp; <a href="tel:+923175516692" style={{ color: isDark ? '#4b5563' : '#6b7280', textDecoration: 'none' }}>+92 317 5516692</a> &nbsp;·&nbsp; <a href="mailto:getzynth@gmail.com" style={{ color: isDark ? '#4b5563' : '#6b7280', textDecoration: 'none' }}>getzynth@gmail.com</a></p>
          </div>
          <div className="flex gap-5">
            {[
              {href:'/privacy', label:'Privacy'},
              {href:'/terms', label:'Terms'},
              {href:'/refund', label:'Refund Policy'},
              {href:'/service-policy', label:'Service Policy'},
              {href:'/services', label:'Services'},
              {href:'mailto:getzynth@gmail.com', label:'Contact'},
            ].map(({href, label}) => (
              <a key={label} href={href} className={`text-[11px] transition-colors ${isDark ? 'text-gray-700 hover:text-gray-500' : 'text-gray-500 hover:text-gray-700'}`}>{label}</a>
            ))}
          </div>
        </div>
      </footer>

      {/* Social proof live activity toast */}
      <SocialProofToast />

    </div>
    </>
  );
}
