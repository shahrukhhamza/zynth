import { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Loader2, Mail, ArrowLeft, Shield, BarChart2, Activity } from 'lucide-react';

const TICKERS = [
  { sym: 'GOLD', val: '$5,168', chg: '+0.82%', up: true,  top: '5%',  left: '4%',  delay: '0s',   dur: '4.2s' },
  { sym: 'BTC',  val: '$70,855',chg: '+1.28%', up: true,  top: '11%', left: '54%', delay: '0.9s', dur: '5.1s' },
  { sym: 'OIL',  val: '$88.07', chg: '+5.54%', up: true,  top: '18%', left: '20%', delay: '2.1s', dur: '4.0s' },
  { sym: 'DXY',  val: '99.26',  chg: '+0.44%', up: true,  top: '24%', left: '56%', delay: '0.4s', dur: '4.7s' },
  { sym: 'SPY',  val: '$675.31',chg: '-0.28%', up: false, top: '28%', left: '4%',  delay: '1.6s', dur: '3.9s' },
];

const FEATURES = [
  { Icon: Shield,   title: 'Bank-grade security', desc: 'End-to-end encrypted'        },
  { Icon: Activity, title: 'Real-time data',       desc: 'Live feeds from 10+ sources'  },
  { Icon: BarChart2,title: 'AI-powered insights',  desc: 'Smart trade analysis'         },
];

export default function ForgotPasswordPage({ onBack }) {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-[#060a12]">
      <style>{`
        @keyframes floatCard {
          0%,100% { transform: translateY(0px);   }
          50%      { transform: translateY(-10px); }
        }
        @keyframes chartDraw {
          from { stroke-dashoffset: 800; }
          to   { stroke-dashoffset: 0;   }
        }
        @keyframes tickerIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes liveBlip {
          0%,100% { transform: scale(1);   opacity: 1;   }
          50%      { transform: scale(1.7); opacity: 0.3; }
        }
        .fp-ticker-float {
          animation:
            floatCard var(--dur, 4s) ease-in-out var(--delay, 0s) infinite,
            tickerIn  0.7s ease both var(--delay, 0s);
        }
      `}</style>

      {/* ── Top nav ─────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between px-8 h-[52px] border-b border-white/[0.06]"
           style={{background:'rgba(6,10,18,0.98)'}}>
        <button onClick={onBack}
                className="group flex items-center gap-2 text-[13px] font-medium text-gray-400 hover:text-white transition-all duration-200 px-3 py-1.5 rounded-lg hover:bg-white/[0.05]">
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          Back to login
        </button>
        <div className="flex items-center gap-2 select-none">
          <div className="w-7 h-7 rounded-[9px] flex items-center justify-center"
               style={{background:'linear-gradient(145deg,#059669,#0d9488)'}}>
            <TrendingUp className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-[15px] font-bold text-white tracking-tight">Zynth</span>
        </div>
      </div>

      {/* ── Panels ──────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT: Decorative animated panel ─────────────────────────── */}
        <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden"
             style={{background:'linear-gradient(150deg,#060e1c 0%,#060c18 55%,#07111f 100%)'}}>

          <div className="absolute inset-0 pointer-events-none"
               style={{backgroundImage:'linear-gradient(rgba(16,185,129,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(16,185,129,0.04) 1px,transparent 1px)',backgroundSize:'60px 60px'}} />
          <div className="absolute pointer-events-none"
               style={{top:'-10%',left:'15%',width:'500px',height:'400px',background:'radial-gradient(ellipse,rgba(16,185,129,0.12) 0%,transparent 65%)'}} />
          <div className="absolute pointer-events-none"
               style={{bottom:'5%',right:'5%',width:'380px',height:'320px',background:'radial-gradient(ellipse,rgba(59,130,246,0.08) 0%,transparent 65%)'}} />

          <div className="absolute inset-x-0 pointer-events-none" style={{top:'18%',opacity:0.18}}>
            <svg viewBox="0 0 620 200" className="w-full" style={{height:'220px'}} preserveAspectRatio="none">
              <defs>
                <linearGradient id="fp-cg1" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%"   stopColor="#059669" stopOpacity="0" />
                  <stop offset="35%"  stopColor="#059669" stopOpacity="1" />
                  <stop offset="100%" stopColor="#0d9488" stopOpacity="0.7" />
                </linearGradient>
                <linearGradient id="fp-fg1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#059669" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0"    />
                </linearGradient>
              </defs>
              <path d="M0,170 L50,148 L90,162 L130,118 L170,132 L210,96 L250,112 L290,74 L330,92 L370,58 L410,74 L450,42 L490,58 L530,26 L570,42 L620,16 L620,200 L0,200 Z"
                    fill="url(#fp-fg1)" />
              <path d="M0,170 L50,148 L90,162 L130,118 L170,132 L210,96 L250,112 L290,74 L330,92 L370,58 L410,74 L450,42 L490,58 L530,26 L570,42 L620,16"
                    fill="none" stroke="url(#fp-cg1)" strokeWidth="2.5"
                    strokeDasharray="800" strokeDashoffset="800"
                    style={{animation:'chartDraw 2.8s ease forwards 0.4s'}} />
            </svg>
          </div>

          {TICKERS.map(t => (
            <div key={t.sym} className="fp-ticker-float absolute"
                 style={{top:t.top,left:t.left,'--dur':t.dur,'--delay':t.delay}}>
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl"
                   style={{background:'rgba(9,17,32,0.88)',border:'1px solid rgba(255,255,255,0.07)',backdropFilter:'blur(12px)',boxShadow:'0 8px 32px rgba(0,0,0,0.45)'}}>
                <div className="flex flex-col leading-none">
                  <span className="text-[9px] font-bold tracking-[0.18em] text-gray-500 mb-0.5">{t.sym}</span>
                  <span className="text-[14px] font-bold text-white">{t.val}</span>
                </div>
                <div className={`flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-lg ${t.up ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
                  {t.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {t.chg}
                </div>
              </div>
            </div>
          ))}

          <div className="absolute bottom-0 left-0 right-0 h-60 pointer-events-none z-[5]"
               style={{background:'linear-gradient(to bottom, transparent 0%, rgba(6,12,24,0.85) 60%, #060c18 100%)'}} />

          <div className="absolute bottom-0 left-0 right-0 p-10 z-10">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"
                    style={{animation:'liveBlip 1.5s ease-in-out infinite'}} />
              <span className="text-[10px] font-bold tracking-[0.22em] text-emerald-500">LIVE MARKETS</span>
            </div>
            <h2 className="text-[30px] font-bold text-white leading-tight mb-2">
              Trade smarter with<br />
              <span style={{background:'linear-gradient(90deg,#34d399,#2dd4bf)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>
                AI-powered analytics
              </span>
            </h2>
            <p className="text-gray-500 text-[13px] mb-7 max-w-[280px] leading-relaxed">
              Real-time market intelligence, trade journaling, and smart insights — all in one place.
            </p>
            <div className="space-y-3">
              {FEATURES.map(({ Icon, title, desc }) => (
                <div key={title} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                       style={{background:'rgba(16,185,129,0.1)',border:'1px solid rgba(16,185,129,0.15)'}}>
                    <Icon className="w-[14px] h-[14px] text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-white">{title}</p>
                    <p className="text-[11px] text-gray-600">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Form panel ────────────────────────────────────────── */}
        <div className="w-full lg:w-[460px] shrink-0 flex flex-col h-full items-center justify-center relative overflow-hidden"
             style={{borderLeft:'1px solid rgba(255,255,255,0.04)',background:'linear-gradient(180deg,#07101e 0%,#060a12 100%)'}}>

          <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-36"
               style={{background:'radial-gradient(ellipse,rgba(16,185,129,0.13) 0%,transparent 70%)'}} />

          <div className="w-full max-w-[340px] px-4">

            {/* Card */}
            <div className="rounded-2xl p-px"
                 style={{background:'linear-gradient(135deg,rgba(16,185,129,0.18) 0%,rgba(255,255,255,0.04) 50%,rgba(59,130,246,0.09) 100%)',boxShadow:'0 24px 60px rgba(0,0,0,0.55)'}}>
              <div className="relative rounded-2xl px-5 py-5 bg-[#0b1322]">
                <div className="absolute top-0 left-[12%] right-[12%] h-px"
                     style={{background:'linear-gradient(90deg,transparent,rgba(16,185,129,0.35),transparent)'}} />

                {success ? (
                  /* ── Success state ───────────────────────────────────── */
                  <div className="flex flex-col items-center text-center py-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                         style={{background:'rgba(16,185,129,0.1)',border:'1px solid rgba(16,185,129,0.2)'}}>
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h2 className="text-[16px] font-semibold text-white mb-1">Check your email!</h2>
                    <p className="text-gray-500 text-[12px] leading-relaxed mb-5 max-w-[240px]">
                      If an account exists for <span className="text-gray-300 font-medium">{email}</span>, you'll receive a password reset link shortly.
                    </p>
                    <p className="text-[11px] text-gray-600 mb-4">Didn't get it? Check your spam folder.</p>
                    <button onClick={onBack}
                            className="text-[12px] text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
                      ← Back to login
                    </button>
                  </div>
                ) : (
                  /* ── Form state ──────────────────────────────────────── */
                  <>
                    <h2 className="text-[16px] font-semibold text-white">Forgot password?</h2>
                    <p className="text-gray-500 text-[11px] mt-0.5 mb-4">Enter your email and we'll send you a reset link</p>

                    {error && (
                      <div className="flex items-start gap-2 rounded-xl px-3 py-2.5 mb-4"
                           style={{background:'rgba(239,68,68,0.07)',border:'1px solid rgba(239,68,68,0.18)'}}>
                        <AlertCircle className="w-[13px] h-[13px] text-red-400 mt-0.5 shrink-0" />
                        <p className="text-red-400 text-[12px]">{error}</p>
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-3">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-widest">Email address</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-[13px] h-[13px] text-gray-600 pointer-events-none" />
                          <input
                            type="email" autoComplete="email" value={email}
                            onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
                            className="w-full pl-8 pr-4 py-[8px] rounded-xl text-[13px] text-white placeholder-gray-700 bg-[#0d1728] border border-white/[0.06] focus:outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/[0.09] transition-all duration-200"
                          />
                        </div>
                      </div>

                      <button
                        type="submit" disabled={loading}
                        className="group w-full flex items-center justify-center gap-2 text-white font-semibold text-[13px] rounded-xl py-[10px] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed hover:brightness-110 hover:shadow-[0_6px_24px_rgba(16,185,129,0.38)]"
                        style={{background:'linear-gradient(135deg,#059669 0%,#0d9488 100%)',boxShadow:'0 4px 16px rgba(16,185,129,0.22),0 1px 0 rgba(255,255,255,0.07) inset'}}
                      >
                        {loading
                          ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Sending…</span></>
                          : <span>Send reset link</span>}
                      </button>
                    </form>

                    <p className="text-center text-[12px] text-gray-600 mt-4">
                      Remember your password?{' '}
                      <button onClick={onBack} className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
                        Back to login
                      </button>
                    </p>
                  </>
                )}
              </div>
            </div>

            <p className="text-center text-[10px] text-gray-800 mt-2 tracking-wide">
              © 2026 Zynth. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
