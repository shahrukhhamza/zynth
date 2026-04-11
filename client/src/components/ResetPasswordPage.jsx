import { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Loader2, Lock, Eye, EyeOff, ArrowLeft, Shield, BarChart2, Activity } from 'lucide-react';
import { BrandMark } from './BrandLogo';
import { useTheme } from '../contexts/ThemeContext';

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

export default function ResetPasswordPage({ onBack }) {
  const token = new URLSearchParams(window.location.search).get('token') || '';
  const { isDark } = useTheme();

  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [showConf, setShowConf]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState(false);

  // Password strength
  const strength = (() => {
    const p = password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', 'bg-red-500', 'bg-yellow-500', 'bg-amber-500', 'bg-emerald-500'][strength];
  const strengthText  = ['', 'text-red-400', 'text-yellow-400', 'text-amber-400', 'text-emerald-400'][strength];

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirm) return setError('Passwords do not match.');
    if (password.length < 8)  return setError('Password must be at least 8 characters.');
    if (!token)               return setError('Invalid reset link. Please request a new one.');
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/reset-password`, { token, newPassword: password });
      setSuccess(true);
      // Auto-redirect to login after 2 seconds
      setTimeout(() => {
        // Clear the token from the URL without a full reload
        window.history.replaceState({}, '', '/');
        onBack();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`h-screen overflow-hidden flex flex-col ${isDark ? 'bg-[#0B0B0F]' : 'bg-[#f8fafc]'}`}>
      <style>{`
        @keyframes floatCard {
          0%,100% { transform: translateY(0px);   }
          50%      { transform: translateY(-10px); }
        }
        @keyframes chartDrawRp {
          from { stroke-dashoffset: 800; }
          to   { stroke-dashoffset: 0;   }
        }
        @keyframes tickerInRp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes liveBlipRp {
          0%,100% { transform: scale(1);   opacity: 1;   }
          50%      { transform: scale(1.7); opacity: 0.3; }
        }
        .rp-ticker-float {
          animation:
            floatCard  var(--dur, 4s) ease-in-out var(--delay, 0s) infinite,
            tickerInRp 0.7s ease both var(--delay, 0s);
        }
      `}</style>

      {/* ── Top nav ─────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between px-8 h-[52px]"
           style={{background: isDark ? 'rgba(11,11,15,0.98)' : 'rgba(255,255,255,0.98)', borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(148,163,184,0.2)' }}>
        <button onClick={onBack}
                className={`group flex items-center gap-2 text-[13px] font-medium transition-all duration-200 px-3 py-1.5 rounded-lg ${isDark ? 'text-zinc-400 hover:text-white hover:bg-white/[0.05]' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}`}>
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-tranzinc-x-0.5" />
          Back to login
        </button>
        <div className="flex items-center gap-2 select-none">
          <BrandMark size={28} />
          <span className={`text-[15px] font-bold tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>Zynth</span>
        </div>
      </div>

      {/* ── Panels ──────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT: Decorative animated panel ─────────────────────────── */}
        <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden"
             style={{background:'linear-gradient(150deg,#0B0B0F 0%,#0B0B0F 55%,#0B0B0F 100%)'}}>

          <div className="absolute inset-0 pointer-events-none"
               style={{backgroundImage:'linear-gradient(rgba(202,138,4,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(202,138,4,0.04) 1px,transparent 1px)',backgroundSize:'60px 60px'}} />
          <div className="absolute pointer-events-none"
               style={{top:'-10%',left:'15%',width:'500px',height:'400px',background:'radial-gradient(ellipse,rgba(202,138,4,0.12) 0%,transparent 65%)'}} />
          <div className="absolute pointer-events-none"
               style={{bottom:'5%',right:'5%',width:'380px',height:'320px',background:'radial-gradient(ellipse,rgba(255,122,0,0.08) 0%,transparent 65%)'}} />

          <div className="absolute inset-x-0 pointer-events-none" style={{top:'18%',opacity:0.18}}>
            <svg viewBox="0 0 620 200" className="w-full" style={{height:'220px'}} preserveAspectRatio="none">
              <defs>
                <linearGradient id="rp-cg1" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%"   stopColor="#CA8A04" stopOpacity="0" />
                  <stop offset="35%"  stopColor="#CA8A04" stopOpacity="1" />
                  <stop offset="100%" stopColor="#FBBF24" stopOpacity="0.7" />
                </linearGradient>
                <linearGradient id="rp-fg1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#CA8A04" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#CA8A04" stopOpacity="0"    />
                </linearGradient>
              </defs>
              <path d="M0,170 L50,148 L90,162 L130,118 L170,132 L210,96 L250,112 L290,74 L330,92 L370,58 L410,74 L450,42 L490,58 L530,26 L570,42 L620,16 L620,200 L0,200 Z"
                    fill="url(#rp-fg1)" />
              <path d="M0,170 L50,148 L90,162 L130,118 L170,132 L210,96 L250,112 L290,74 L330,92 L370,58 L410,74 L450,42 L490,58 L530,26 L570,42 L620,16"
                    fill="none" stroke="url(#rp-cg1)" strokeWidth="2.5"
                    strokeDasharray="800" strokeDashoffset="800"
                    style={{animation:'chartDrawRp 2.8s ease forwards 0.4s'}} />
            </svg>
          </div>

          {TICKERS.map(t => (
            <div key={t.sym} className="rp-ticker-float absolute"
                 style={{top:t.top,left:t.left,'--dur':t.dur,'--delay':t.delay}}>
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl"
                   style={{background:'rgba(10,10,10,0.88)',border:'1px solid rgba(255,255,255,0.07)',backdropFilter:'blur(12px)',boxShadow:'0 8px 32px rgba(0,0,0,0.45)'}}>
                <div className="flex flex-col leading-none">
                  <span className="text-[9px] font-bold tracking-[0.18em] text-zinc-500 mb-0.5">{t.sym}</span>
                  <span className="text-[14px] font-bold text-white">{t.val}</span>
                </div>
                <div className={`flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-lg ${t.up ? 'text-yellow-400 bg-yellow-500/10' : 'text-red-400 bg-red-500/10'}`}>
                  {t.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {t.chg}
                </div>
              </div>
            </div>
          ))}

          <div className="absolute bottom-0 left-0 right-0 h-60 pointer-events-none z-[5]"
               style={{background:'linear-gradient(to bottom, transparent 0%, rgba(11,11,15,0.85) 60%, #0B0B0F 100%)'}} />

          <div className="absolute bottom-0 left-0 right-0 p-10 z-10">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0"
                    style={{animation:'liveBlipRp 1.5s ease-in-out infinite'}} />
              <span className="text-[10px] font-bold tracking-[0.22em] text-yellow-500">LIVE MARKETS</span>
            </div>
            <h2 className="text-[30px] font-bold text-white leading-tight mb-2">
              Trade smarter with<br />
              <span style={{background:'linear-gradient(90deg,#CA8A04,#FBBF24)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>
                AI-powered analytics
              </span>
            </h2>
            <p className="text-zinc-500 text-[13px] mb-7 max-w-[280px] leading-relaxed">
              Real-time market intelligence, trade journaling, and smart insights — all in one place.
            </p>
            <div className="space-y-3">
              {FEATURES.map(({ Icon, title, desc }) => (
                <div key={title} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                       style={{background:'rgba(202,138,4,0.1)',border:'1px solid rgba(202,138,4,0.15)'}}>
                    <Icon className="w-[14px] h-[14px] text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-white">{title}</p>
                    <p className="text-[11px] text-zinc-600">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Form panel ────────────────────────────────────────── */}
        <div className="w-full lg:w-[460px] shrink-0 flex flex-col h-full items-center justify-center relative overflow-hidden"
             style={{borderLeft: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(148,163,184,0.2)', background: isDark ? 'linear-gradient(180deg,#0B0B0F 0%,#0B0B0F 100%)' : 'linear-gradient(180deg,#f8fafc 0%,#f8fafc 100%)'}}>

          <div className="pointer-events-none absolute -top-16 left-1/2 -tranzinc-x-1/2 w-64 h-36"
               style={{background:'radial-gradient(ellipse,rgba(202,138,4,0.13) 0%,transparent 70%)'}} />

          <div className="w-full max-w-[340px] px-4">

            {/* Card */}
            <div className="rounded-2xl p-px"
                 style={{background:'linear-gradient(135deg,rgba(202,138,4,0.18) 0%,rgba(255,255,255,0.04) 50%,rgba(255,122,0,0.09) 100%)',boxShadow:'0 24px 60px rgba(0,0,0,0.55)'}}>
              <div className="relative rounded-2xl px-5 py-5" style={{ background: isDark ? '#111111' : '#ffffff' }}>
                <div className="absolute top-0 left-[12%] right-[12%] h-px"
                     style={{background:'linear-gradient(90deg,transparent,rgba(202,138,4,0.35),transparent)'}} />

                {/* No token guard */}
                {!token ? (
                  <div className="flex flex-col items-center text-center py-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                         style={{background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)'}}>
                      <AlertCircle className="w-6 h-6 text-red-400" />
                    </div>
                    <h2 className={`text-[16px] font-semibold mb-2 ${isDark ? 'text-white' : 'text-zinc-900'}`}>Invalid reset link</h2>
                    <p className="text-zinc-500 text-[12px] leading-relaxed mb-5">
                      This link is missing or invalid. Please request a new password reset.
                    </p>
                    <button onClick={onBack}
                            className="text-[13px] font-semibold px-4 py-2 rounded-xl transition-all duration-200 hover:brightness-110"
                            style={{background:'linear-gradient(135deg,#CA8A04 0%,#FBBF24 100%)',color:'#fff'}}>
                      Request new link
                    </button>
                  </div>

                ) : success ? (
                  /* ── Success state ───────────────────────────────────── */
                  <div className="flex flex-col items-center text-center py-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                         style={{background:'rgba(202,138,4,0.1)',border:'1px solid rgba(202,138,4,0.2)'}}>
                      <CheckCircle2 className="w-6 h-6 text-yellow-400" />
                    </div>
                    <h2 className={`text-[16px] font-semibold mb-1 ${isDark ? 'text-white' : 'text-zinc-900'}`}>Password updated!</h2>
                    <p className="text-zinc-500 text-[12px] mt-1">Redirecting you to login…</p>
                    <Loader2 className="w-4 h-4 text-yellow-500 animate-spin mt-4" />
                  </div>

                ) : (
                  /* ── Form state ──────────────────────────────────────── */
                  <>
                    <h2 className={`text-[16px] font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Set new password</h2>
                    <p className="text-zinc-500 text-[11px] mt-0.5 mb-4">Choose a strong password for your account</p>

                    {error && (
                      <div className="flex items-start gap-2.5 rounded-xl px-3.5 py-3 mb-4"
                           style={{background:'rgba(239,68,68,0.07)',border:'1px solid rgba(239,68,68,0.18)',borderLeft:'3px solid #f87171'}}>
                        <AlertCircle className="w-[13px] h-[13px] text-red-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-red-400 text-[12px]">{error}</p>
                          {(error.includes('expired') || error.includes('Invalid')) && (
                            <button onClick={onBack}
                                    className="text-[11px] text-red-300 hover:text-white underline mt-1 transition-colors">
                              Request a new link
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-3">
                      {/* New password */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest">New password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -tranzinc-y-1/2 w-[13px] h-[13px] text-zinc-600 pointer-events-none" />
                          <input
                            type={showPass ? 'text' : 'password'} autoComplete="new-password"
                            value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••••"
                            className={`w-full pl-8 pr-10 py-[8px] rounded-xl text-[13px] placeholder-zinc-500 border focus:outline-none focus:border-yellow-500/40 focus:ring-2 focus:ring-yellow-500/[0.09] transition-all duration-200 ${isDark ? 'text-white bg-[#131313] border-white/[0.06]' : 'text-zinc-900 bg-zinc-50 border-zinc-200'}`}
                          />
                          <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}
                                  className="absolute right-3 top-1/2 -tranzinc-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors">
                            {showPass ? <EyeOff className="w-[13px] h-[13px]" /> : <Eye className="w-[13px] h-[13px]" />}
                          </button>
                        </div>
                        {/* Strength meter */}
                        {password && (
                          <div className="space-y-1 pt-0.5">
                            <div className="flex gap-1">
                              {[1,2,3,4].map(i => (
                                <div key={i} className={`flex-1 h-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColor : isDark ? 'bg-white/[0.06]' : 'bg-zinc-200'}`} />
                              ))}
                            </div>
                            <p className={`text-[10px] font-medium ${strengthText}`}>{strengthLabel}</p>
                          </div>
                        )}
                      </div>

                      {/* Confirm password */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Confirm password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -tranzinc-y-1/2 w-[13px] h-[13px] text-zinc-600 pointer-events-none" />
                          <input
                            type={showConf ? 'text' : 'password'} autoComplete="new-password"
                            value={confirm} onChange={e => setConfirm(e.target.value)} required placeholder="••••••••••"
                            className={`w-full pl-8 pr-10 py-[8px] rounded-xl text-[13px] placeholder-zinc-500 border focus:outline-none focus:border-yellow-500/40 focus:ring-2 focus:ring-yellow-500/[0.09] transition-all duration-200 ${isDark ? 'text-white bg-[#131313] border-white/[0.06]' : 'text-zinc-900 bg-zinc-50 border-zinc-200'}`}
                          />
                          <button type="button" onClick={() => setShowConf(v => !v)} tabIndex={-1}
                                  className="absolute right-3 top-1/2 -tranzinc-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors">
                            {showConf ? <EyeOff className="w-[13px] h-[13px]" /> : <Eye className="w-[13px] h-[13px]" />}
                          </button>
                        </div>
                        {confirm && password !== confirm && (
                          <p className="text-[10px] text-red-400 mt-0.5">Passwords don't match</p>
                        )}
                      </div>

                      <button
                        type="submit" disabled={loading}
                        className="group w-full flex items-center justify-center gap-2 text-white font-semibold text-[13px] rounded-xl py-[10px] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed hover:brightness-110 hover:shadow-[0_6px_24px_rgba(202,138,4,0.38)]"
                        style={{background:'linear-gradient(135deg,#CA8A04 0%,#FBBF24 100%)',boxShadow:'0 4px 16px rgba(202,138,4,0.22),0 1px 0 rgba(255,255,255,0.07) inset'}}
                      >
                        {loading
                          ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Updating…</span></>
                          : <span>Update password</span>}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>

            <p className="text-center text-[10px] text-zinc-800 mt-2 tracking-wide">
              © 2026 Zynth. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
