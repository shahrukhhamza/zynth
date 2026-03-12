import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, TrendingUp, TrendingDown, AlertCircle, Loader2, Mail, Lock, ArrowRight, ArrowLeft, Shield, Zap, BarChart2, Activity } from 'lucide-react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const TICKERS = [
  { sym: 'GOLD', val: '$5,168', chg: '+0.82%', up: true,  top: '5%',  left: '4%',  delay: '0s',   dur: '4.2s' },
  { sym: 'BTC',  val: '$70,855',chg: '+1.28%', up: true,  top: '11%', left: '54%', delay: '0.9s', dur: '5.1s' },
  { sym: 'OIL',  val: '$88.07', chg: '+5.54%', up: true,  top: '18%', left: '20%', delay: '2.1s', dur: '4.0s' },
  { sym: 'DXY',  val: '99.26',  chg: '+0.44%', up: true,  top: '24%', left: '56%', delay: '0.4s', dur: '4.7s' },
  { sym: 'SPY',  val: '$675.31',chg: '-0.28%', up: false, top: '28%', left: '4%',  delay: '1.6s', dur: '3.9s' },
];

const FEATURES = [
  { Icon: Shield,   title: 'Bank-grade security', desc: 'End-to-end encrypted'       },
  { Icon: Activity, title: 'Real-time data',       desc: 'Live feeds from 10+ sources' },
  { Icon: BarChart2,title: 'AI-powered insights',  desc: 'Smart trade analysis'        },
];

export default function LoginPage({ onSwitchToSignup, onBack, onForgotPassword }) {
  const { login, loginWithGoogle } = useAuth();
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [error, setError]         = useState('');
  const [isGoogleOnlyError, setIsGoogleOnlyError] = useState(false);
  const [loading, setLoading]     = useState(false);
  const googleBtnRef              = useRef(null);
  const initializedRef            = useRef(false);

  const handleGoogleCredential = useCallback(async (response) => {
    setError('');
    setIsGoogleOnlyError(false);
    setLoading(true);
    try {
      await loginWithGoogle(response.credential);
    } catch (err) {
      setError(err.response?.data?.error || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [loginWithGoogle]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    function initGoogle() {
      if (initializedRef.current) return true;
      if (!window.google?.accounts?.id) return false;
      initializedRef.current = true;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      if (googleBtnRef.current) {
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'filled_black', size: 'large',
          width: googleBtnRef.current.offsetWidth || 340,
          text: 'continue_with', shape: 'rectangular', logo_alignment: 'center',
        });
      }
      return true;
    }
    if (!initGoogle()) {
      const interval = setInterval(() => { if (initGoogle()) clearInterval(interval); }, 100);
      return () => clearInterval(interval);
    }
  }, [handleGoogleCredential]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
    } catch (err) {
      const data = err.response?.data;
      if (data?.code === 'GOOGLE_ONLY_ACCOUNT') {
        setIsGoogleOnlyError(true);
        setError(data.error);
      } else {
        setIsGoogleOnlyError(false);
        setError(data?.error || 'Login failed. Please check your credentials.');
      }
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
        @keyframes gradShift {
          0%,100% { background-position: 0% 50%;   }
          50%      { background-position: 100% 50%; }
        }
        .ticker-float {
          animation:
            floatCard var(--dur, 4s) ease-in-out var(--delay, 0s) infinite,
            tickerIn  0.7s ease both var(--delay, 0s);
        }
      `}</style>

      {/* ── Top navigation bar ─────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between px-8 h-[52px] border-b border-white/[0.06]"
           style={{background:'rgba(6,10,18,0.98)'}}>
        {onBack ? (
          <button onClick={onBack}
                  className="group flex items-center gap-2 text-[13px] font-medium text-gray-400 hover:text-white transition-all duration-200 px-3 py-1.5 rounded-lg hover:bg-white/[0.05]">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            Back to home
          </button>
        ) : <div />}
        <div className="flex items-center gap-2 select-none">
          <div className="w-7 h-7 rounded-[9px] flex items-center justify-center"
               style={{background:'linear-gradient(145deg,#059669,#0d9488)'}}>
            <TrendingUp className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-[15px] font-bold text-white tracking-tight">Zynth</span>
        </div>
      </div>

      {/* ── Panels ───────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
      {/* ── LEFT: Decorative animated panel ──────────────────────────────── */}
      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden"
           style={{background:'linear-gradient(150deg,#060e1c 0%,#060c18 55%,#07111f 100%)'}}>

        {/* Grid */}
        <div className="absolute inset-0 pointer-events-none"
             style={{backgroundImage:'linear-gradient(rgba(16,185,129,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(16,185,129,0.04) 1px,transparent 1px)', backgroundSize:'60px 60px'}} />
        {/* Glow blobs */}
        <div className="absolute pointer-events-none"
             style={{top:'-10%',left:'15%',width:'500px',height:'400px',background:'radial-gradient(ellipse,rgba(16,185,129,0.12) 0%,transparent 65%)'}} />
        <div className="absolute pointer-events-none"
             style={{bottom:'5%',right:'5%',width:'380px',height:'320px',background:'radial-gradient(ellipse,rgba(59,130,246,0.08) 0%,transparent 65%)'}} />

        {/* Animated SVG chart */}
        <div className="absolute inset-x-0 pointer-events-none" style={{top:'18%',opacity:0.18}}>
          <svg viewBox="0 0 620 200" className="w-full" style={{height:'220px'}} preserveAspectRatio="none">
            <defs>
              <linearGradient id="cg1" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stopColor="#059669" stopOpacity="0" />
                <stop offset="35%"  stopColor="#059669" stopOpacity="1" />
                <stop offset="100%" stopColor="#0d9488" stopOpacity="0.7" />
              </linearGradient>
              <linearGradient id="fg1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#059669" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#059669" stopOpacity="0"    />
              </linearGradient>
            </defs>
            <path d="M0,170 L50,148 L90,162 L130,118 L170,132 L210,96 L250,112 L290,74 L330,92 L370,58 L410,74 L450,42 L490,58 L530,26 L570,42 L620,16 L620,200 L0,200 Z"
                  fill="url(#fg1)" />
            <path d="M0,170 L50,148 L90,162 L130,118 L170,132 L210,96 L250,112 L290,74 L330,92 L370,58 L410,74 L450,42 L490,58 L530,26 L570,42 L620,16"
                  fill="none" stroke="url(#cg1)" strokeWidth="2.5"
                  strokeDasharray="800" strokeDashoffset="800"
                  style={{animation:'chartDraw 2.8s ease forwards 0.4s'}} />
          </svg>
        </div>

        {/* Floating ticker cards */}
        {TICKERS.map(t => (
          <div key={t.sym} className="ticker-float absolute"
               style={{top:t.top, left:t.left, '--dur':t.dur, '--delay':t.delay}}>
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

        {/* Gradient scrim — fades tickers into bottom content cleanly */}
        <div className="absolute bottom-0 left-0 right-0 h-60 pointer-events-none z-[5]"
             style={{background:'linear-gradient(to bottom, transparent 0%, rgba(6,12,24,0.85) 60%, #060c18 100%)'}} />

        {/* Bottom content */}
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

      {/* ── RIGHT: Form panel ─────────────────────────────────────────────── */}
      <div className="w-full lg:w-[460px] shrink-0 flex flex-col h-full items-center justify-center relative overflow-hidden"
           style={{borderLeft:'1px solid rgba(255,255,255,0.04)',background:'linear-gradient(180deg,#07101e 0%,#060a12 100%)'}}>

        {/* Top glow */}
        <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-36"
             style={{background:'radial-gradient(ellipse,rgba(16,185,129,0.13) 0%,transparent 70%)'}} />

        <div className="w-full max-w-[340px] px-4">

          {/* Card */}
          <div className="rounded-2xl p-px"
               style={{background:'linear-gradient(135deg,rgba(16,185,129,0.18) 0%,rgba(255,255,255,0.04) 50%,rgba(59,130,246,0.09) 100%)',boxShadow:'0 24px 60px rgba(0,0,0,0.55)'}}>
            <div className="relative rounded-2xl px-5 py-5 bg-[#0b1322]">
              <div className="absolute top-0 left-[12%] right-[12%] h-px"
                   style={{background:'linear-gradient(90deg,transparent,rgba(16,185,129,0.35),transparent)'}} />

              <h2 className="text-[16px] font-semibold text-white">Welcome back</h2>
              <p className="text-gray-500 text-[11px] mt-0.5 mb-4">Sign in to your account to continue</p>

              {error && (
                isGoogleOnlyError ? (
                  <div className="flex items-start gap-2.5 rounded-xl px-3 py-2.5 mb-4"
                       style={{background:'rgba(66,133,244,0.08)',border:'1px solid rgba(66,133,244,0.28)'}}>
                    {/* Google G icon */}
                    <svg className="w-4 h-4 shrink-0 mt-0.5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <p className="text-[12px] leading-relaxed" style={{color:'#93bbfc'}}>{error}</p>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 rounded-xl px-3 py-2.5 mb-4"
                       style={{background:'rgba(239,68,68,0.07)',border:'1px solid rgba(239,68,68,0.18)'}}>
                    <AlertCircle className="w-[13px] h-[13px] text-red-400 mt-0.5 shrink-0" />
                    <p className="text-red-400 text-[12px]">{error}</p>
                  </div>
                )
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

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-widest">Password</label>
                    <button type="button" onClick={onForgotPassword} className="text-[11px] text-emerald-500 hover:text-emerald-400 font-medium transition-colors">Forgot password?</button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-[13px] h-[13px] text-gray-600 pointer-events-none" />
                    <input
                      type={showPass ? 'text' : 'password'} autoComplete="current-password"
                      value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••••"
                      className="w-full pl-8 pr-10 py-[8px] rounded-xl text-[13px] text-white placeholder-gray-700 bg-[#0d1728] border border-white/[0.06] focus:outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/[0.09] transition-all duration-200"
                    />
                    <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors">
                      {showPass ? <EyeOff className="w-[13px] h-[13px]" /> : <Eye className="w-[13px] h-[13px]" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit" disabled={loading}
                  className="group w-full flex items-center justify-center gap-2 text-white font-semibold text-[13px] rounded-xl py-[10px] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed hover:brightness-110 hover:shadow-[0_6px_24px_rgba(16,185,129,0.38)]"
                  style={{background:'linear-gradient(135deg,#059669 0%,#0d9488 100%)',boxShadow:'0 4px 16px rgba(16,185,129,0.22),0 1px 0 rgba(255,255,255,0.07) inset'}}
                >
                  {loading
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Signing in…</span></>
                    : <><span>Sign in</span><ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" /></>}
                </button>
              </form>

              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-white/[0.05]" />
                <span className="text-[10px] font-bold text-gray-700 tracking-[0.2em]">OR</span>
                <div className="flex-1 h-px bg-white/[0.05]" />
              </div>

              {GOOGLE_CLIENT_ID ? (
                <div ref={googleBtnRef} className="w-full flex justify-center" style={{minHeight:'40px'}} />
              ) : (
                <button disabled className="w-full flex items-center justify-center gap-2 rounded-xl py-[10px] text-[12px] text-gray-600 cursor-not-allowed"
                        style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.05)'}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" className="opacity-40 shrink-0">
                    <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115z"/>
                    <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987z"/>
                    <path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21z"/>
                    <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067z"/>
                  </svg>
                  <span className="opacity-40">Continue with Google</span>
                </button>
              )}

              <p className="text-center text-[12px] text-gray-600 mt-3">
                Don't have an account?{' '}
                <button onClick={onSwitchToSignup} className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
                  Create one
                </button>
              </p>
            </div>
          </div>

          <p className="text-center text-[10px] text-gray-800 mt-2 tracking-wide">
            256-bit SSL encrypted · © 2026 Zynth
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
