import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config/api';
import { getPublicStats } from '../utils/publicStats';
import { isInAppBrowser } from '../utils/inAppBrowser';
import { Eye, EyeOff, TrendingUp, TrendingDown, AlertCircle, Loader2, Mail, Lock, ArrowRight, ArrowLeft, ChevronLeft, Shield, Zap, BarChart2, Activity, BookOpen, Brain, Bot, Flame } from 'lucide-react';
import { BrandMark } from './BrandLogo';
import ErrorBar from './ErrorBar';
import { useTheme } from '../contexts/ThemeContext';

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
  const { isDark } = useTheme();
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [error, setError]         = useState('');
  const [isGoogleOnlyError, setIsGoogleOnlyError] = useState(false);
  const [loading, setLoading]     = useState(false);
  const initializedRef            = useRef(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const formRef                   = useRef(null);
  const [spotsLeft, setSpotsLeft] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isIAB, setIsIAB] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => { setIsIAB(isInAppBrowser()); }, []);

  useEffect(() => {
    getPublicStats()
      .then(d => { if (d?.totalUsers != null) setSpotsLeft(Math.max(0, 100 - d.totalUsers)); })
      .catch(() => {});
  }, []);

  const handleGoogleCredential = useCallback(async (response) => {
    setError('');
    setIsGoogleOnlyError(false);
    setGoogleLoading(true);
    try {
      await loginWithGoogle(response.credential);
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.detail || data?.error || 'Google sign-in failed. Please try again.';
      setError(msg);
    } finally {
      setGoogleLoading(false);
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
      return true;
    }
    if (!initGoogle()) {
      const interval = setInterval(() => { if (initGoogle()) clearInterval(interval); }, 100);
      return () => clearInterval(interval);
    }
  }, [handleGoogleCredential]);

  function handleGoogleClick() {
    if (!GOOGLE_CLIENT_ID || !window.google?.accounts?.id) return;
    setGoogleLoading(true);
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        setGoogleLoading(false);
      }
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setFieldErrors({ email: '', password: '' });
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
        const errMsg = data?.error || 'Login failed. Please check your credentials.';
        setError(errMsg);
        setFieldErrors({ email: ' ', password: errMsg });
      }
      if (formRef.current) {
        formRef.current.style.animation = 'formShake 0.5s ease';
        setTimeout(() => { if (formRef.current) formRef.current.style.animation = ''; }, 500);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight:'100vh', background: isDark?'#09090b':'#f8fafc', position:'relative', overflowX:'hidden', overflowY:'auto' }}>
      <style>{`
        @keyframes blobDrift {
          0%,100% { transform: translate(0px,0px)   scale(1);     }
          25%      { transform: translate(44px,-30px) scale(1.040); }
          50%      { transform: translate(-20px,24px) scale(0.968); }
          75%      { transform: translate(30px,34px)  scale(1.028); }
        }
        @keyframes blobDrift2 {
          0%,100% { transform: translate(0px,0px)    scale(1);     }
          30%      { transform: translate(-34px,24px) scale(1.048); }
          60%      { transform: translate(30px,-18px) scale(0.964); }
          85%      { transform: translate(-14px,-28px) scale(1.022); }
        }
        @keyframes cardIn {
          from { opacity:0; transform:translateY(20px) scale(0.988); }
          to   { opacity:1; transform:translateY(0)     scale(1);     }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes panelFloat {
          0%,100% { transform:translateY(0px); }
          50%     { transform:translateY(-6px); }
        }
        @keyframes rowReveal {
          from { opacity:0; transform:translateY(7px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes drawStroke {
          from { stroke-dashoffset:620; }
          to   { stroke-dashoffset:0; }
        }
        @keyframes liveBlink {
          0%,100% { opacity:1; transform:scale(1); }
          50%     { opacity:0.55; transform:scale(0.9); }
        }
        @keyframes formShake {
          0%,100% { transform:translateX(0);   }
          20%     { transform:translateX(-7px); }
          40%     { transform:translateX(7px);  }
          60%     { transform:translateX(-4px); }
          80%     { transform:translateX(4px);  }
        }
      `}</style>

      {/* ── Blob 1 – top-left drift ─────────────────────────────────────── */}
      <div style={{ position:'fixed', top:'-220px', left:'-180px', width:'720px', height:'720px',
        pointerEvents:'none', zIndex:0,
        background: isDark
          ? 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 35%, transparent 65%)'
          : 'radial-gradient(circle, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.02) 35%, transparent 65%)',
        filter:'blur(82px)', animation:'blobDrift 18s ease-in-out infinite',
      }} />

      {/* ── Blob 2 – bottom-right drift ─────────────────────────────────── */}
      <div style={{ position:'fixed', bottom:'-200px', right:'-180px', width:'640px', height:'640px',
        pointerEvents:'none', zIndex:0,
        background: isDark
          ? 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.015) 35%, transparent 65%)'
          : 'radial-gradient(circle, rgba(0,0,0,0.03) 0%, rgba(0,0,0,0.015) 35%, transparent 65%)',
        filter:'blur(82px)', animation:'blobDrift2 22s ease-in-out infinite',
      }} />

      {/* ── Corner vignette ─────────────────────────────────────────────── */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0,
        background: isDark
          ? 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(9,9,11,0.62) 100%)'
          : 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 34%, rgba(223,232,245,0.78) 100%)',
      }} />

      {/* ── Nav bar ─────────────────────────────────────────────────────── */}
      <div style={{ position:'fixed', top:0, left:0, right:0, zIndex:20, height:'52px',
        display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px',
        borderBottom: isDark?'1px solid rgba(255,255,255,0.06)':'1px solid rgba(148,163,184,0.28)',
        background: isDark?'rgba(9,9,11,0.75)':'rgba(255,255,255,0.76)',
        backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
        boxShadow: isDark?'none':'0 2px 14px rgba(148,163,184,0.18)',
      }}>
        <div>
          {onBack && (
            <button onClick={onBack}
              style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'12.5px',
                color: isDark?'rgba(255,255,255,0.36)':'#64748b', background:'none', border:'none',
                cursor:'pointer', padding:'4px 7px', borderRadius:'6px', transition:'all 0.12s' }}
              onMouseEnter={e => { e.currentTarget.style.color=isDark?'rgba(255,255,255,0.76)':'#475569'; e.currentTarget.style.background=isDark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.03)'; }}
              onMouseLeave={e => { e.currentTarget.style.color=isDark?'rgba(255,255,255,0.36)':'#64748b'; e.currentTarget.style.background='transparent'; }}>
              <ChevronLeft size={13} /> Back
            </button>
          )}
        </div>
        <div style={{ position:'absolute', left:'50%', transform:'translateX(-50%)', display:'flex', alignItems:'center', gap:'7px' }}>
          <BrandMark size={21} />
          <span style={{ fontSize:'14px', fontWeight:700, letterSpacing:'-0.022em', color: isDark?'rgba(255,255,255,0.86)':'#0f172a' }}>Zynth</span>
        </div>
        <button onClick={onSwitchToSignup}
          style={{ fontSize:'12.5px', fontWeight:500, color: isDark?'rgba(255,255,255,0.36)':'#64748b', background:'none', border:'none', cursor:'pointer', padding:'4px 2px', transition:'color 0.12s' }}
          onMouseEnter={e => e.currentTarget.style.color=isDark?'rgba(255,255,255,0.86)':'#0f172a'}
          onMouseLeave={e => e.currentTarget.style.color=isDark?'rgba(255,255,255,0.36)':'#64748b'}>
          Sign up →
        </button>
      </div>

      {/* ── Page body ───────────────────────────────────────────────────── */}
      <div style={{ position:'relative', zIndex:1, minHeight:'100vh', padding:'76px 24px 48px', boxSizing:'border-box' }}>
        <div style={{ width:'100%', maxWidth:'1240px', margin:'0 auto', minHeight:'calc(100vh - 124px)', display:'grid', gridTemplateColumns:isMobile?'1fr':'1.05fr 0.95fr', alignItems:'center', gap:isMobile?'0':'52px' }}>

          {!isMobile && (
            <div style={{ paddingRight:'24px', animation:'fadeUp 0.52s ease both', display:'flex', flexDirection:'column', justifyContent:'center' }}>
              <h1 style={{ fontSize:'clamp(36px,3.8vw,56px)', lineHeight:1.04, margin:'0 0 18px', letterSpacing:'-0.04em', fontWeight:800, color:isDark?'#f8fafc':'#0f172a', maxWidth:'560px' }}>
                Trade with clarity,<br />not guesswork.
              </h1>
              <p style={{ margin:'0 0 44px', fontSize:'16px', lineHeight:1.68, maxWidth:'460px', color:isDark?'rgba(255,255,255,0.46)':'#5a6a82', fontWeight:400 }}>
                Connect macro events, AI-assisted context, and your execution plan in one focused workspace.
              </p>

              {/* Product dashboard preview */}
              <div style={{ width:'100%', maxWidth:'560px', borderRadius:'20px', overflow:'hidden', animation:'fadeUp 0.6s ease 0.14s both, panelFloat 8s ease-in-out 1.1s infinite',
                background: isDark?'#111113':'#ffffff',
                border: isDark?'1px solid rgba(255,255,255,0.07)':'1px solid rgba(203,213,225,0.65)',
                boxShadow: isDark?'0 28px 72px rgba(0,0,0,0.60), 0 0 0 0.5px rgba(255,255,255,0.05) inset':'0 20px 56px rgba(15,23,42,0.12), 0 1px 0 #fff inset',
              }}>

                {/* Window chrome */}
                <div style={{ padding:'11px 16px', display:'flex', alignItems:'center', justifyContent:'space-between',
                  background: isDark?'#0c0c0e':'rgba(248,250,252,1)',
                  borderBottom: isDark?'1px solid rgba(255,255,255,0.055)':'1px solid rgba(203,213,225,0.55)',
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                    <div style={{ display:'flex', gap:'5px' }}>
                      <span style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#f87171' }} />
                      <span style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#fbbf24' }} />
                      <span style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#4ade80' }} />
                    </div>
                    <span style={{ fontSize:'11.5px', fontWeight:600, letterSpacing:'0.01em', color:isDark?'rgba(255,255,255,0.36)':'#94a3b8' }}>Economic Dashboard</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'5px', padding:'3px 9px', borderRadius:'99px',
                    background:isDark?'rgba(34,197,94,0.10)':'rgba(34,197,94,0.07)',
                    border:isDark?'1px solid rgba(34,197,94,0.24)':'1px solid rgba(34,197,94,0.22)',
                  }}>
                    <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#22c55e', animation:'liveBlink 2s ease-in-out infinite' }} />
                    <span style={{ fontSize:'10px', fontWeight:700, color:'#22c55e', letterSpacing:'0.05em' }}>LIVE</span>
                  </div>
                </div>

                {/* Chart section */}
                <div style={{ padding:'14px 16px 0', background:isDark?'#111113':'#fff', position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', inset:0, pointerEvents:'none',
                    background:isDark
                      ? 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.04) 48%, transparent 66%)'
                      : 'linear-gradient(120deg, transparent 30%, rgba(0,0,0,0.03) 48%, transparent 66%)',
                    transform:'translateX(-100%)', animation:'blobDrift2 11s ease-in-out infinite' }} />
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:'10px' }}>
                    <div>
                      <div style={{ fontSize:'11px', fontWeight:500, color:isDark?'rgba(255,255,255,0.28)':'#94a3b8', marginBottom:'3px' }}>DXY Index · 30 days</div>
                      <div style={{ fontSize:'22px', fontWeight:700, letterSpacing:'-0.03em', color:isDark?'#f1f5f9':'#0f172a', lineHeight:1 }}>99.26</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:'12.5px', fontWeight:700, color:'#10b981' }}>▲ +0.44%</div>
                      <div style={{ fontSize:'11px', color:isDark?'rgba(255,255,255,0.22)':'#94a3b8', marginTop:'2px' }}>vs prior close</div>
                    </div>
                  </div>
                  <svg width="100%" height="58" viewBox="0 0 520 58" preserveAspectRatio="none" style={{ display:'block', marginLeft:'-1px', marginRight:'-1px', width:'calc(100% + 2px)' }}>
                    <defs>
                      <linearGradient id="lgLogin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={isDark?'rgba(255,255,255,0.12)':'rgba(0,0,0,0.06)'} />
                        <stop offset="100%" stopColor="transparent" />
                      </linearGradient>
                    </defs>
                    <path d="M0,50 C30,48 55,42 100,34 C140,27 165,31 210,21 C248,13 268,17 308,9 C348,3 372,7 412,5 C450,3 478,7 520,2 L520,58 L0,58 Z"
                      fill="url(#lgLogin)" />
                    <path d="M0,50 C30,48 55,42 100,34 C140,27 165,31 210,21 C248,13 268,17 308,9 C348,3 372,7 412,5 C450,3 478,7 520,2"
                      fill="none" stroke={isDark?'rgba(255,255,255,0.45)':'rgba(0,0,0,0.30)'} strokeWidth="1.8" strokeLinecap="round" style={{ strokeDasharray:'620', strokeDashoffset:'620', animation:'drawStroke 1.4s ease 0.28s forwards' }} />
                  </svg>
                </div>

                {/* Data rows */}
                {[
                  { name:'CPI  (Core YoY)',    val:'3.2%',   tag:'↓ Beat',    tagUp:false, dot:'#ef4444', hi:true  },
                  { name:'Non-Farm Payrolls', val:'272K',   tag:'↑ Strong',  tagUp:true,  dot:'#ef4444', hi:true  },
                  { name:'Fed Funds Rate',    val:'5.25%',  tag:'Hold',      tagUp:null,  dot:'#f59e0b', hi:false },
                ].map((row, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', padding:'9px 16px',
                    borderTop: isDark?'1px solid rgba(255,255,255,0.038)':'1px solid rgba(203,213,225,0.44)',
                    background: i===0?(isDark?'rgba(255,255,255,0.03)':'rgba(0,0,0,0.015)'):'transparent',
                    opacity:0, animation:`rowReveal 0.48s ease ${0.18 + i * 0.08}s forwards`,
                  }}>
                    <span style={{ width:'6px', height:'6px', borderRadius:'50%', flexShrink:0, marginRight:'11px',
                      background:row.dot, boxShadow:`0 0 6px ${row.dot}88`, animation:'liveBlink 2.6s ease-in-out infinite',
                    }} />
                    <span style={{ flex:1, fontSize:'12.5px', fontWeight:500, color:isDark?'rgba(255,255,255,0.68)':'#334155' }}>{row.name}</span>
                    <span style={{ fontSize:'13px', fontWeight:700, color:isDark?'#f1f5f9':'#0f172a', marginRight:'12px' }}>{row.val}</span>
                    <span style={{ fontSize:'11px', fontWeight:600, padding:'2.5px 8px', borderRadius:'7px', whiteSpace:'nowrap',
                      color: row.tagUp===true?'#10b981':row.tagUp===false?'#f87171':'#94a3b8',
                      background: row.tagUp===true?(isDark?'rgba(16,185,129,0.12)':'rgba(16,185,129,0.09)'):
                                  row.tagUp===false?(isDark?'rgba(248,113,113,0.12)':'rgba(248,113,113,0.09)'):
                                  (isDark?'rgba(148,163,184,0.10)':'rgba(148,163,184,0.09)'),
                    }}>{row.tag}</span>
                  </div>
                ))}

                {/* AI Briefing strip */}
                <div style={{ margin:'10px 12px 12px', padding:'11px 14px', borderRadius:'13px',
                  background: isDark?'linear-gradient(120deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))':'linear-gradient(120deg,rgba(0,0,0,0.03),rgba(0,0,0,0.015))',
                  border: isDark?'1px solid rgba(255,255,255,0.08)':'1px solid rgba(0,0,0,0.06)',
                  animation:'fadeUp 0.52s ease 0.46s both',
                }}>
                  <div style={{ fontSize:'10px', fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', color:isDark?'rgba(255,255,255,0.45)':'#52525b', marginBottom:'5px' }}>AI Briefing</div>
                  <div style={{ fontSize:'12.5px', lineHeight:1.58, color:isDark?'rgba(255,255,255,0.54)':'#475569' }}>
                    Disinflation trend intact. Dollar momentum fading post-CPI.{' '}
                    <span style={{ color:isDark?'rgba(255,255,255,0.72)':'#18181b', fontWeight:600 }}>Risk-on bias favored near-term.</span>
                  </div>
                </div>

              </div>
            </div>
          )}

          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:isMobile?'auto':'calc(100vh - 160px)' }}>

            {/* Logotype above card */}
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'26px', animation:'cardIn 0.38s ease both' }}>
              <BrandMark size={33} />
              <span style={{ fontSize:'19px', fontWeight:800, letterSpacing:'-0.035em', color: isDark?'#fff':'#0f172a' }}>Zynth</span>
            </div>

        {/* ── Auth card ───────────────────────────────────────────────── */}
        <div ref={formRef} style={{
          width:'100%', maxWidth:'400px',
          background: isDark?'rgba(17,17,19,0.85)':'linear-gradient(168deg, rgba(255,255,255,0.97) 0%, rgba(246,250,255,0.95) 52%, rgba(241,247,255,0.93) 100%)',
          backdropFilter:'blur(32px)', WebkitBackdropFilter:'blur(32px)',
          border: isDark?'1px solid rgba(255,255,255,0.077)':'1px solid rgba(148,163,184,0.34)',
          borderRadius:'18px', padding:'30px 28px 26px',
          overflow:'hidden', position:'relative',
          boxShadow: isDark
            ? '0 0 0 0.5px rgba(255,255,255,0.055) inset, 0 20px 60px rgba(0,0,0,0.84)'
            : '0 0 0 1px rgba(148,163,184,0.18), 0 24px 52px rgba(15,23,42,0.16), 0 10px 28px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.9) inset',
          animation:'cardIn 0.45s cubic-bezier(0.22,1,0.36,1) 0.06s both',
        }}>

          <div style={{ position:'absolute', top:0, left:0, right:0, height:'1px',
            background:isDark?'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)':'linear-gradient(90deg, transparent, rgba(0,0,0,0.12), transparent)',
            opacity:0.8 }} />

          {/* Heading */}
          <div style={{ marginBottom:'22px', animation:'fadeUp 0.45s ease 0.11s both' }}>
            <h1 style={{ fontSize:'21px', fontWeight:700, letterSpacing:'-0.028em', margin:'0 0 5px', color: isDark?'#f1f5f9':'#0f172a', lineHeight:1.2 }}>
              Welcome back.
            </h1>
            <p style={{ fontSize:'13.5px', color: isDark?'rgba(255,255,255,0.38)':'#64748b', margin:0, lineHeight:1.5 }}>
              Sign in to your trading dashboard.{' '}
              <button onClick={onSwitchToSignup}
                style={{ color: isDark?'#a1a1aa':'#52525b', background:'none', border:'none', cursor:'pointer', fontSize:'13.5px', padding:0, fontWeight:500, transition:'color 0.12s' }}
                onMouseEnter={e => e.currentTarget.style.color=isDark?'#ffffff':'#09090b'}
                onMouseLeave={e => e.currentTarget.style.color=isDark?'#a1a1aa':'#52525b'}>
                New here?
              </button>
            </p>
          </div>

          {/* Error */}
          {error && (isGoogleOnlyError ? (
            <div style={{ display:'flex', alignItems:'flex-start', gap:'10px',
              background: isDark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.025)',
              border:isDark?'1px solid rgba(255,255,255,0.10)':'1px solid rgba(0,0,0,0.08)', borderRadius:'10px', padding:'10px 14px', marginBottom:'16px' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" style={{ flexShrink:0, marginTop:'1px' }}>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <p style={{ fontSize:'13px', color: isDark?'#a1a1aa':'#52525b', margin:0, lineHeight:1.5 }}>{error}</p>
            </div>
          ) : <ErrorBar message={error} className="mb-4" />)}

          {/* Google button */}
          {isIAB ? (
            <div style={{ marginBottom:'14px', borderRadius:'11px', overflow:'hidden',
              border:'1px solid rgba(251,191,36,0.35)',
              background: isDark?'rgba(251,191,36,0.08)':'rgba(254,252,232,0.9)',
              animation:'fadeUp 0.45s ease 0.15s both' }}>
              <div style={{ padding:'11px 14px', display:'flex', alignItems:'flex-start', gap:'10px' }}>
                <span style={{ fontSize:'15px', flexShrink:0, marginTop:'1px' }}>⚠️</span>
                <div style={{ flex:1 }}>
                  <p style={{ margin:'0 0 4px', fontSize:'12.5px', fontWeight:600, color: isDark?'#fcd34d':'#92400e', lineHeight:1.4 }}>
                    Google Sign-in is blocked in Instagram's browser
                  </p>
                  <p style={{ margin:'0 0 10px', fontSize:'12px', color: isDark?'rgba(253,230,138,0.8)':'#78350f', lineHeight:1.5 }}>
                    Copy the link below and open it in Chrome or Safari to sign in with Google.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href).then(() => {
                        setLinkCopied(true);
                        setTimeout(() => setLinkCopied(false), 2500);
                      }).catch(() => {});
                    }}
                    style={{ fontSize:'12px', fontWeight:600, padding:'6px 12px', borderRadius:'7px', border:'none', cursor:'pointer',
                      background: isDark?'rgba(251,191,36,0.22)':'rgba(251,191,36,0.30)',
                      color: isDark?'#fcd34d':'#92400e', transition:'opacity 0.15s' }}>
                    {linkCopied ? '✓ Link copied!' : 'Copy Link'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
          <button type="button" onClick={handleGoogleClick} disabled={loading||googleLoading||!GOOGLE_CLIENT_ID}
            style={{ width:'100%', padding:'10px 16px',
              background: isDark?'rgba(255,255,255,0.96)':'#ffffff',
              border: isDark?'1px solid rgba(255,255,255,0.10)':'1px solid rgba(148,163,184,0.34)',
              borderRadius:'11px', color:!GOOGLE_CLIENT_ID?'rgba(0,0,0,0.3)':'#1e293b',
              fontSize:'13.5px', fontWeight:500,
              display:'flex', alignItems:'center', justifyContent:'center', gap:'10px',
              cursor:loading||googleLoading||!GOOGLE_CLIENT_ID?'not-allowed':'pointer',
              transition:'all 0.18s ease', marginBottom:'14px',
              boxShadow: isDark?'0 1px 0 rgba(255,255,255,0.10) inset, 0 2px 8px rgba(0,0,0,0.36)':'0 6px 16px rgba(15,23,42,0.08), 0 1px 0 rgba(255,255,255,0.8) inset',
              animation:'fadeUp 0.45s ease 0.15s both' }}
            onMouseEnter={e => { if(!loading&&!googleLoading&&GOOGLE_CLIENT_ID){ e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow=isDark?'0 1px 0 rgba(255,255,255,0.10) inset, 0 6px 20px rgba(0,0,0,0.46)':'0 10px 24px rgba(15,23,42,0.12), 0 1px 0 rgba(255,255,255,0.85) inset'; }}}
            onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=isDark?'0 1px 0 rgba(255,255,255,0.10) inset, 0 2px 8px rgba(0,0,0,0.36)':'0 6px 16px rgba(15,23,42,0.08), 0 1px 0 rgba(255,255,255,0.8) inset'; }}>
            {googleLoading
              ? <Loader2 size={16} className="animate-spin" style={{ color:'rgba(0,0,0,0.40)', flexShrink:0 }} />
              : <svg width="16" height="16" viewBox="0 0 24 24" style={{ flexShrink:0 }}>
                <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115z"/>
                <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987z"/>
                <path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21z"/>
                <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067z"/>
              </svg>}
            <span>{googleLoading ? 'Signing in…' : 'Continue with Google'}</span>
          </button>
          )}

          {/* Divider */}
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px', animation:'fadeUp 0.45s ease 0.19s both' }}>
            <div style={{ flex:1, height:'1px', background: isDark?'rgba(255,255,255,0.07)':'rgba(148,163,184,0.32)' }} />
            <span style={{ fontSize:'10.5px', fontWeight:600, color: isDark?'rgba(255,255,255,0.22)':'#94a3b8', textTransform:'uppercase', letterSpacing:'0.09em' }}>or</span>
            <div style={{ flex:1, height:'1px', background: isDark?'rgba(255,255,255,0.07)':'rgba(148,163,184,0.32)' }} />
          </div>

          <form onSubmit={handleSubmit} style={{ animation:'fadeUp 0.45s ease 0.23s both' }}>
            {/* Email */}
            <div style={{ marginBottom:'13px' }}>
              <label style={{ display:'block', fontSize:'12px', fontWeight:600, letterSpacing:'0.01em', color: isDark?'rgba(255,255,255,0.48)':'#475569', marginBottom:'6px' }}>
                Email
              </label>
              <input type="email" autoComplete="email" value={email} required
                onChange={e => { setEmail(e.target.value); setFieldErrors(fe => ({...fe, email:''})); }}
                placeholder="you@example.com"
                style={{ width:'100%', boxSizing:'border-box', outline:'none', fontSize:'14px', transition:'all 0.18s ease',
                  background: isDark?'rgba(255,255,255,0.044)':'rgba(255,255,255,0.84)',
                  border: fieldErrors.email?'1px solid rgba(239,68,68,0.55)':isDark?'1px solid rgba(255,255,255,0.088)':'1px solid rgba(148,163,184,0.42)',
                  borderRadius:'10px', padding:'10px 13px', color: isDark?'#f1f5f9':'#0f172a' }}
                onFocus={e => { e.target.style.borderColor=isDark?'rgba(255,255,255,0.28)':'rgba(0,0,0,0.3)'; e.target.style.boxShadow=isDark?'0 0 0 3px rgba(255,255,255,0.06)':'0 0 0 3px rgba(0,0,0,0.06)'; e.target.style.background=isDark?'rgba(255,255,255,0.06)':'#ffffff'; }}
                onBlur={e => { if(!fieldErrors.email){ e.target.style.borderColor=isDark?'rgba(255,255,255,0.088)':'rgba(148,163,184,0.42)'; e.target.style.boxShadow='none'; e.target.style.background=isDark?'rgba(255,255,255,0.044)':'rgba(255,255,255,0.84)'; }}}
              />
              {fieldErrors.email?.trim() && <div style={{ display:'flex', alignItems:'center', gap:'4px', marginTop:'5px' }}><AlertCircle size={11} color="#ef4444"/><span style={{ fontSize:'11px', color:'#ef4444' }}>{fieldErrors.email}</span></div>}
            </div>

            {/* Password */}
            <div style={{ marginBottom:'18px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
                <label style={{ fontSize:'12px', fontWeight:600, letterSpacing:'0.01em', color: isDark?'rgba(255,255,255,0.48)':'#475569' }}>Password</label>
                <button type="button" onClick={onForgotPassword}
                  style={{ fontSize:'12px', color: isDark?'#a1a1aa':'#52525b', background:'none', border:'none', cursor:'pointer', padding:0, transition:'color 0.12s' }}
                  onMouseEnter={e => e.currentTarget.style.color=isDark?'#ffffff':'#09090b'}
                  onMouseLeave={e => e.currentTarget.style.color=isDark?'#a1a1aa':'#52525b'}>Forgot?</button>
              </div>
              <div style={{ position:'relative' }}>
                <input type={showPass?'text':'password'} autoComplete="current-password" value={password} required
                  onChange={e => { setPassword(e.target.value); setFieldErrors(fe => ({...fe, password:''})); }}
                  placeholder="••••••••"
                  style={{ width:'100%', boxSizing:'border-box', outline:'none', fontSize:'14px', transition:'all 0.18s ease',
                    background: isDark?'rgba(255,255,255,0.044)':'rgba(255,255,255,0.84)',
                    border: fieldErrors.password?'1px solid rgba(239,68,68,0.55)':isDark?'1px solid rgba(255,255,255,0.088)':'1px solid rgba(148,163,184,0.42)',
                    borderRadius:'10px', padding:'10px 36px 10px 13px', color: isDark?'#f1f5f9':'#0f172a' }}
                  onFocus={e => { e.target.style.borderColor=isDark?'rgba(255,255,255,0.28)':'rgba(0,0,0,0.3)'; e.target.style.boxShadow=isDark?'0 0 0 3px rgba(255,255,255,0.06)':'0 0 0 3px rgba(0,0,0,0.06)'; e.target.style.background=isDark?'rgba(255,255,255,0.06)':'#ffffff'; }}
                  onBlur={e => { if(!fieldErrors.password){ e.target.style.borderColor=isDark?'rgba(255,255,255,0.088)':'rgba(148,163,184,0.42)'; e.target.style.boxShadow='none'; e.target.style.background=isDark?'rgba(255,255,255,0.044)':'rgba(255,255,255,0.84)'; }}}
                />
                <button type="button" onClick={() => setShowPass(v=>!v)} tabIndex={-1}
                  style={{ position:'absolute', right:'11px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:isDark?'rgba(255,255,255,0.26)':'#94a3b8', padding:0, display:'flex', transition:'color 0.12s' }}
                  onMouseEnter={e => e.currentTarget.style.color=isDark?'rgba(255,255,255,0.68)':'#64748b'}
                  onMouseLeave={e => e.currentTarget.style.color=isDark?'rgba(255,255,255,0.26)':'#94a3b8'}>
                  {showPass ? <EyeOff size={14}/> : <Eye size={14}/>}
                </button>
              </div>
              {fieldErrors.password && <div style={{ display:'flex', alignItems:'center', gap:'4px', marginTop:'5px' }}><AlertCircle size={11} color="#ef4444"/><span style={{ fontSize:'11px', color:'#ef4444' }}>{fieldErrors.password}</span></div>}
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              style={{ width:'100%', padding:'11px',
                background: loading?(isDark?'rgba(255,255,255,0.2)':'rgba(0,0,0,0.3)'):(isDark?'linear-gradient(135deg, #ffffff 0%, #e4e4e7 100%)':'linear-gradient(135deg, #18181b 0%, #27272a 100%)'),
                border:'none', borderRadius:'11px', color: isDark?'#09090b':'#fff', fontSize:'13.5px', fontWeight:600,
                cursor:loading?'not-allowed':'pointer', transition:'all 0.18s ease',
                display:'flex', alignItems:'center', justifyContent:'center', gap:'7px',
                boxShadow: loading?'none':(isDark?'0 2px 14px rgba(255,255,255,0.1), 0 1px 3px rgba(0,0,0,0.2)':'0 2px 14px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.1)'),
                letterSpacing:'0.01em' }}
              onMouseEnter={e => { if(!loading){ e.currentTarget.style.transform='translateY(-1.5px)'; e.currentTarget.style.boxShadow=isDark?'0 8px 28px rgba(255,255,255,0.16), 0 2px 8px rgba(0,0,0,0.2)':'0 8px 28px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.12)'; }}}
              onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=loading?'none':(isDark?'0 2px 14px rgba(255,255,255,0.1), 0 1px 3px rgba(0,0,0,0.2)':'0 2px 14px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.1)'); }}
              onMouseDown={e => { if(!loading) e.currentTarget.style.transform='scale(0.985)'; }}
              onMouseUp={e => { if(!loading) e.currentTarget.style.transform='translateY(-1.5px)'; }}>
              {loading ? <><Loader2 size={14} className="animate-spin"/><span>Signing in…</span></> : <><span>Sign in</span><ArrowRight size={14}/></>}
            </button>
          </form>

          {/* Trust strip */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'14px', marginTop:'18px', animation:'fadeUp 0.45s ease 0.28s both' }}>
            <span style={{ fontSize:'11px', fontWeight:500, color: isDark?'rgba(255,255,255,0.24)':'#64748b', display:'flex', alignItems:'center', gap:'4px' }}>
              <svg width="9" height="11" viewBox="0 0 9 11" fill="none" style={{ opacity:0.7 }}><path d="M4.5 0L0 2.25V5.25c0 2.32 1.93 4.22 4.5 5.25C7.07 9.47 9 7.57 9 5.25V2.25L4.5 0z" fill="currentColor"/></svg>
              256-bit SSL
            </span>
            <span style={{ width:'1px', height:'10px', background: isDark?'rgba(255,255,255,0.10)':'rgba(100,116,139,0.28)' }} />
            <span style={{ fontSize:'11px', fontWeight:500, color: isDark?'rgba(255,255,255,0.24)':'#64748b' }}>Bank-grade security</span>
          </div>
        </div>

            {/* Below-card link */}
            <p style={{ marginTop:'20px', fontSize:'13px', color: isDark?'rgba(255,255,255,0.32)':'#94a3b8', animation:'cardIn 0.45s ease 0.1s both' }}>
          Don't have an account?{' '}
          <button onClick={onSwitchToSignup}
            style={{ color: isDark?'#a1a1aa':'#52525b', background:'none', border:'none', cursor:'pointer', fontSize:'13px', padding:0, fontWeight:500, transition:'color 0.12s' }}
            onMouseEnter={e => e.currentTarget.style.color=isDark?'#ffffff':'#09090b'}
            onMouseLeave={e => e.currentTarget.style.color=isDark?'#a1a1aa':'#52525b'}>
            Create one free →
          </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
