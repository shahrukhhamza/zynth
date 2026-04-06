import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config/api';
import { getPublicStats } from '../utils/publicStats';
import { isInAppBrowser } from '../utils/inAppBrowser';
import { BrandMark } from './BrandLogo';
import ErrorBar from './ErrorBar';
import { useTheme } from '../contexts/ThemeContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
import {
  Eye, EyeOff, TrendingUp, AlertCircle, CheckCircle, CheckCircle2,
  Loader2, User, Mail, Lock, ArrowRight, ArrowLeft, ChevronLeft,
  BookOpen, Brain, Check, Shield, Zap, Bot, Flame,
} from 'lucide-react';

export default function SignupPage({ onSwitchToLogin, onBack, onSignupSuccess }) {
  const { register, loginWithGoogle } = useAuth();
  const { isDark } = useTheme();
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const [form, setForm]               = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [spotsLeft, setSpotsLeft]     = useState(null);
  const [consent, setConsent]         = useState({ terms: false, risk: false });
  const [fieldErrors, setFieldErrors] = useState({ name: '', email: '', password: '', confirm: '' });
  const [success, setSuccess]         = useState(false);
  const formRef                       = useRef(null);
  const initializedRef                = useRef(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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
    setGoogleLoading(true);
    try {
      await loginWithGoogle(response.credential);
    } catch (err) {
      const data = err.response?.data;
      setError(data?.error || 'Google sign-in failed. Please try again.');
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

  const p       = form.password;
  const has8    = p.length >= 8;
  const hasNum  = /[0-9]/.test(p);
  const hasCaps = /[A-Z]/.test(p);
  const hasSpec = /[^A-Za-z0-9]/.test(p);
  const strength = [has8, hasNum, hasCaps, hasSpec].filter(Boolean).length;

  const STRENGTH_META = [
    { label: '',       color: 'bg-transparent' },
    { label: 'Weak',   color: 'bg-red-500'     },
    { label: 'Fair',   color: 'bg-orange-500'  },
    { label: 'Good',   color: 'bg-amber-400'   },
    { label: 'Strong', color: 'bg-emerald-500' },
  ];
  const STRENGTH_TEXT = ['', 'text-red-400', 'text-orange-400', 'text-amber-400', 'text-emerald-400'];

  const inputStyle = {
    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.12)',
    borderRadius: '10px', color: isDark ? '#fff' : '#0f172a', width: '100%', fontSize: '14px',
    outline: 'none', transition: 'all 0.2s ease',
  };
  const focusIn  = e => { e.target.style.background = isDark ? 'rgba(255,255,255,0.06)' : '#ffffff'; e.target.style.borderColor = isDark?'rgba(255,255,255,0.28)':'rgba(0,0,0,0.3)'; e.target.style.boxShadow = isDark?'0 0 0 3px rgba(255,255,255,0.06)':'0 0 0 3px rgba(0,0,0,0.06)'; };
  const focusOut = e => { e.target.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'; e.target.style.borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'; e.target.style.boxShadow = 'none'; };

  function setField(field, value) { setForm(f => ({ ...f, [field]: value })); }

  function shakeForm() {
    if (formRef.current) {
      formRef.current.style.animation = 'formShake 0.5s ease';
      setTimeout(() => { if (formRef.current) formRef.current.style.animation = ''; }, 500);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setFieldErrors({ name: '', email: '', password: '', confirm: '' });
    if (form.password !== form.confirm) {
      setFieldErrors(fe => ({ ...fe, confirm: 'Passwords do not match.' }));
      shakeForm(); return;
    }
    if (form.password.length < 8) {
      setFieldErrors(fe => ({ ...fe, password: 'Password must be at least 8 characters.' }));
      shakeForm(); return;
    }
    if (!consent.terms || !consent.risk) {
      setError('Please accept both agreements below to create your account.');
      shakeForm(); return;
    }
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password, terms_accepted: true });
      onSignupSuccess?.();
      setSuccess(true);
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Registration failed. Please try again.';
      setError(errMsg);
      if (errMsg.toLowerCase().includes('email')) {
        setFieldErrors(fe => ({ ...fe, email: errMsg }));
      }
      shakeForm();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight:'100vh', background: isDark?'#0B0B0F':'#f8fafc', position:'relative', overflowX:'hidden', overflowY:'auto' }}>
      <style>{`
        @keyframes blobDrift {
          0%,100% { transform: translate(0px,0px)    scale(1);     }
          25%      { transform: translate(44px,-30px) scale(1.040); }
          50%      { transform: translate(-20px,24px) scale(0.968); }
          75%      { transform: translate(30px,34px)  scale(1.028); }
        }
        @keyframes blobDrift2 {
          0%,100% { transform: translate(0px,0px)     scale(1);     }
          30%      { transform: translate(-34px,24px)  scale(1.048); }
          60%      { transform: translate(30px,-18px)  scale(0.964); }
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
        @keyframes checkIn {
          from { transform:scale(0); opacity:0; }
          to   { transform:scale(1); opacity:1; }
        }
        .sp-checkbox {
          appearance:none; -webkit-appearance:none;
          width:17px; height:17px; min-width:17px; border-radius:5px;
          cursor:pointer; position:relative; margin-top:1px;
          transition:background 0.14s, border-color 0.14s; background:transparent;
        }
        .sp-checkbox:checked { background:#FF4D00; border-color:#FF4D00 !important; }
        .sp-checkbox:checked::after {
          content:''; position:absolute; left:3px; top:1px;
          width:9px; height:5px;
          border-left:2px solid #fff; border-bottom:2px solid #fff;
          transform:rotate(-45deg); animation:checkIn 0.14s ease;
        }
      `}</style>

      {/* ── Blob 1 – top-left drift ─────────────────────────────────────── */}
      <div style={{ position:'fixed', top:'-220px', left:'-180px', width:'720px', height:'720px',
        pointerEvents:'none', zIndex:0,
        background: isDark
          ? 'radial-gradient(circle, rgba(255,77,0,0.07) 0%, rgba(255,122,0,0.03) 35%, transparent 65%)'
          : 'radial-gradient(circle, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.02) 35%, transparent 65%)',
        filter:'blur(82px)', animation:'blobDrift 18s ease-in-out infinite',
      }} />

      {/* ── Blob 2 – bottom-right drift ─────────────────────────────────── */}
      <div style={{ position:'fixed', bottom:'-200px', right:'-180px', width:'640px', height:'640px',
        pointerEvents:'none', zIndex:0,
        background: isDark
          ? 'radial-gradient(circle, rgba(255,122,0,0.05) 0%, rgba(255,77,0,0.02) 35%, transparent 65%)'
          : 'radial-gradient(circle, rgba(0,0,0,0.03) 0%, rgba(0,0,0,0.015) 35%, transparent 65%)',
        filter:'blur(82px)', animation:'blobDrift2 22s ease-in-out infinite',
      }} />

      {/* ── Corner vignette ─────────────────────────────────────────────── */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0,
        background: isDark
          ? 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(11,11,15,0.62) 100%)'
          : 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 34%, rgba(223,232,245,0.78) 100%)',
      }} />

      {/* Nav */}
      <div style={{ position:'fixed', top:0, left:0, right:0, zIndex:20, height:'52px',
        display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px',
        borderBottom: isDark?'1px solid rgba(255,255,255,0.06)':'1px solid rgba(148,163,184,0.28)',
        background: isDark?'rgba(11,11,15,0.75)':'rgba(255,255,255,0.76)',
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
        <button onClick={onSwitchToLogin}
          style={{ fontSize:'12.5px', fontWeight:500, color: isDark?'rgba(255,255,255,0.36)':'#64748b', background:'none', border:'none', cursor:'pointer', padding:'4px 2px', transition:'color 0.12s' }}
          onMouseEnter={e => e.currentTarget.style.color=isDark?'rgba(255,255,255,0.86)':'#0f172a'}
          onMouseLeave={e => e.currentTarget.style.color=isDark?'rgba(255,255,255,0.36)':'#64748b'}>
          Sign in →
        </button>
      </div>

      {/* Page body */}
      <div style={{ position:'relative', zIndex:1, minHeight:'100vh', padding:'76px 24px 48px', boxSizing:'border-box' }}>
        <div style={{ width:'100%', maxWidth:'1240px', margin:'0 auto', minHeight:'calc(100vh - 124px)', display:'grid', gridTemplateColumns:isMobile?'1fr':'1.05fr 0.95fr', alignItems:'center', gap:isMobile?'0':'52px' }}>

          {!isMobile && (
            <div style={{ paddingRight:'24px', animation:'fadeUp 0.52s ease both', display:'flex', flexDirection:'column', justifyContent:'center' }}>
              <h1 style={{ fontSize:'clamp(36px,3.8vw,56px)', lineHeight:1.04, margin:'0 0 18px', letterSpacing:'-0.04em', fontWeight:800, color:isDark?'#f8fafc':'#0f172a', maxWidth:'560px' }}>
                See the macro picture.<br />Act with precision.
              </h1>
              <p style={{ margin:'0 0 44px', fontSize:'16px', lineHeight:1.68, maxWidth:'460px', color:isDark?'rgba(255,255,255,0.46)':'#5a6a82', fontWeight:400 }}>
                Turn economic data into structured trade context — with AI interpretation built into your workflow.
              </p>

              {/* Product calendar preview */}
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
                    <span style={{ fontSize:'11.5px', fontWeight:600, letterSpacing:'0.01em', color:isDark?'rgba(255,255,255,0.36)':'#94a3b8' }}>Macro Calendar</span>
                  </div>
                  <div style={{ padding:'3px 9px', borderRadius:'99px', fontSize:'10.5px', fontWeight:700, letterSpacing:'0.04em',
                    color: isDark?'rgba(255,255,255,0.55)':'#52525b',
                    background: isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.04)',
                    border: isDark?'1px solid rgba(255,255,255,0.10)':'1px solid rgba(0,0,0,0.08)',
                    animation:'fadeUp 0.46s ease 0.2s both',
                  }}>4 events this week</div>
                </div>

                {/* Section label */}
                <div style={{ padding:'10px 16px 6px', borderBottom: isDark?'1px solid rgba(255,255,255,0.038)':'1px solid rgba(203,213,225,0.44)',
                  background: isDark?'#111113':'#fff',
                  animation:'fadeUp 0.48s ease 0.23s both',
                }}>
                  <span style={{ fontSize:'10.5px', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:isDark?'rgba(255,255,255,0.24)':'#94a3b8' }}>Upcoming High-Impact Events</span>
                </div>

                {/* Calendar rows */}
                {[
                  { date:'Mar 28', day:'Fri', name:'Core PCE Price Index',     impact:'high',   expect:'2.7%',  prev:'2.8%',  ai:true  },
                  { date:'Apr 02', day:'Wed', name:'FOMC Meeting Minutes',      impact:'high',   expect:'—',     prev:'—',     ai:true  },
                  { date:'Apr 04', day:'Fri', name:'Non-Farm Payrolls',         impact:'high',   expect:'215K',  prev:'272K',  ai:false },
                  { date:'Apr 10', day:'Thu', name:'CPI · Consumer Price Index', impact:'medium', expect:'3.1%',  prev:'3.2%',  ai:true  },
                ].map((ev, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', padding:'10px 16px', gap:'12px',
                    borderTop: i===0?'none':(isDark?'1px solid rgba(255,255,255,0.038)':'1px solid rgba(203,213,225,0.44)'),
                    background: i===0?(isDark?'rgba(239,68,68,0.04)':'rgba(239,68,68,0.018)'):'transparent',
                    opacity:0, animation:`rowReveal 0.48s ease ${0.24 + i * 0.08}s forwards`,
                  }}>
                    {/* Date badge */}
                    <div style={{ minWidth:'40px', textAlign:'center', flexShrink:0 }}>
                      <div style={{ fontSize:'10px', fontWeight:600, color:isDark?'rgba(255,255,255,0.28)':'#94a3b8', textTransform:'uppercase', letterSpacing:'0.04em' }}>{ev.day}</div>
                      <div style={{ fontSize:'13px', fontWeight:700, color:isDark?'#e2e8f0':'#1e293b', letterSpacing:'-0.01em' }}>{ev.date.split(' ')[1]}</div>
                    </div>
                    {/* Impact dot */}
                    <span style={{ width:'7px', height:'7px', borderRadius:'50%', flexShrink:0,
                      background: ev.impact==='high'?'#ef4444':'#f59e0b',
                      boxShadow: ev.impact==='high'?'0 0 7px rgba(239,68,68,0.55)':'0 0 7px rgba(245,158,11,0.55)',
                      animation:'liveBlink 2.5s ease-in-out infinite',
                    }} />
                    {/* Event name */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:'12.5px', fontWeight:600, color:isDark?'rgba(255,255,255,0.76)':'#1e293b', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{ev.name}</div>
                      <div style={{ fontSize:'11px', color:isDark?'rgba(255,255,255,0.28)':'#94a3b8', marginTop:'1px' }}>Est. {ev.expect} &middot; Prev. {ev.prev}</div>
                    </div>
                    {/* AI tag */}
                    {ev.ai && (
                      <div style={{ padding:'2.5px 8px', borderRadius:'7px', flexShrink:0, fontSize:'10.5px', fontWeight:700, letterSpacing:'0.02em',
                        color: isDark?'rgba(255,255,255,0.55)':'#52525b',
                        background: isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.04)',
                        border: isDark?'1px solid rgba(255,255,255,0.10)':'1px solid rgba(0,0,0,0.08)',
                      }}>AI ⚡</div>
                    )}
                  </div>
                ))}

                {/* AI signal strip */}
                <div style={{ margin:'10px 12px 12px', padding:'11px 14px', borderRadius:'13px',
                  background: isDark?'linear-gradient(120deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))':'linear-gradient(120deg,rgba(0,0,0,0.03),rgba(0,0,0,0.015))',
                  border: isDark?'1px solid rgba(255,255,255,0.08)':'1px solid rgba(0,0,0,0.06)',
                  animation:'fadeUp 0.52s ease 0.58s both',
                }}>
                  <div style={{ fontSize:'10px', fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', color:isDark?'rgba(255,255,255,0.45)':'#52525b', marginBottom:'5px' }}>AI Context</div>
                  <div style={{ fontSize:'12.5px', lineHeight:1.58, color:isDark?'rgba(255,255,255,0.54)':'#475569' }}>
                    PCE expected below prior. Fed pivot narrative{' '}
                    <span style={{ color:isDark?'rgba(255,255,255,0.72)':'#18181b', fontWeight:600 }}>gaining traction heading into April.</span>
                  </div>
                </div>

              </div>
            </div>
          )}

          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:isMobile?'auto':'calc(100vh - 160px)' }}>

        {success ? (
          /* ── Success screen ─────────────────────────────────────────── */
          <div style={{ textAlign:'center', animation:'cardIn 0.4s ease both' }}>
            <div style={{ width:'68px', height:'68px', borderRadius:'50%', background: isDark?'linear-gradient(135deg,#FF4D00,#FF7A00)':'linear-gradient(135deg,#18181b,#27272a)',
              display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px',
              boxShadow: isDark?'0 0 40px rgba(255,77,0,0.3)':'0 0 40px rgba(0,0,0,0.20)' }}>
              <CheckCircle size={32} color='#ffffff' />
            </div>
            <h2 style={{ fontSize:'22px', fontWeight:700, letterSpacing:'-0.025em', color: isDark?'#f1f5f9':'#0f172a', marginBottom:'8px' }}>
              Account created!
            </h2>
            <p style={{ fontSize:'14px', color: isDark?'rgba(255,255,255,0.48)':'#64748b', marginBottom:0 }}>
              Redirecting you to your dashboard…
            </p>
            <div style={{ width:'36px', height:'2.5px', background: isDark?'linear-gradient(90deg,#FF4D00,#FF7A00)':'linear-gradient(90deg,#18181b,#52525b)', borderRadius:'2px', margin:'18px auto 0', animation:'blobDrift2 1.6s ease-in-out infinite' }} />
          </div>
        ) : (
          <>
            {/* Logotype above card */}
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'26px', animation:'cardIn 0.38s ease both' }}>
              <BrandMark size={33} />
              <span style={{ fontSize:'19px', fontWeight:800, letterSpacing:'-0.035em', color: isDark?'#fff':'#0f172a' }}>Zynth</span>
            </div>

            {/* Card */}
            <div ref={formRef} style={{
              width:'100%', maxWidth:'400px',
              background: isDark?'rgba(17,17,19,0.85)':'linear-gradient(168deg, rgba(255,255,255,0.97) 0%, rgba(246,250,255,0.95) 52%, rgba(241,247,255,0.93) 100%)',
              backdropFilter:'blur(32px)', WebkitBackdropFilter:'blur(32px)',
              border: isDark?'1px solid rgba(255,255,255,0.077)':'1px solid rgba(148,163,184,0.34)',
              borderRadius:'18px', padding:'28px 28px 24px',
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
              <div style={{ marginBottom:'20px', animation:'fadeUp 0.45s ease 0.11s both' }}>
                <h1 style={{ fontSize:'21px', fontWeight:700, letterSpacing:'-0.028em', margin:'0 0 5px', color: isDark?'#f1f5f9':'#0f172a', lineHeight:1.2 }}>
                  Create your account.
                </h1>
                <p style={{ fontSize:'13.5px', color: isDark?'rgba(255,255,255,0.38)':'#64748b', margin:0 }}>
                  {spotsLeft != null && <><span style={{ color:'#FF7A00', fontWeight:600 }}>{spotsLeft} spots</span> left at this price.{' '}</>}
                  Already on Zynth?{' '}
                  <button onClick={onSwitchToLogin}
                    style={{ color: isDark?'#a1a1aa':'#52525b', background:'none', border:'none', cursor:'pointer', fontSize:'13.5px', padding:0, fontWeight:500, transition:'color 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.color=isDark?'#ffffff':'#09090b'}
                    onMouseLeave={e => e.currentTarget.style.color=isDark?'#a1a1aa':'#52525b'}>
                    Sign in
                  </button>
                </p>
              </div>

              {error && <ErrorBar message={error} className="mb-4" />}

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
                        Copy the link below and open it in Chrome or Safari to sign up with Google.
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
                <span>{googleLoading ? 'Signing up…' : 'Continue with Google'}</span>
              </button>
              )}

              {/* Divider */}
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px', animation:'fadeUp 0.45s ease 0.19s both' }}>
                <div style={{ flex:1, height:'1px', background: isDark?'rgba(255,255,255,0.07)':'rgba(148,163,184,0.32)' }} />
                <span style={{ fontSize:'10.5px', fontWeight:600, color: isDark?'rgba(255,255,255,0.22)':'#94a3b8', textTransform:'uppercase', letterSpacing:'0.09em' }}>or</span>
                <div style={{ flex:1, height:'1px', background: isDark?'rgba(255,255,255,0.07)':'rgba(148,163,184,0.32)' }} />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} style={{ animation:'fadeUp 0.45s ease 0.23s both' }}>

                {/* Name */}
                <div style={{ marginBottom:'11px' }}>
                  <label style={{ display:'block', fontSize:'12px', fontWeight:600, letterSpacing:'0.01em', color: isDark?'rgba(255,255,255,0.48)':'#475569', marginBottom:'5px' }}>Full name</label>
                  <input type="text" autoComplete="name" value={form.name} required
                    onChange={e => { setField('name', e.target.value); setFieldErrors(fe => ({...fe, name:''})); }}
                    placeholder="Jane Smith"
                    style={{ width:'100%', boxSizing:'border-box', outline:'none', fontSize:'14px', transition:'all 0.18s ease',
                      background: isDark?'rgba(255,255,255,0.044)':'rgba(255,255,255,0.84)',
                      border: fieldErrors.name?'1px solid rgba(239,68,68,0.55)':isDark?'1px solid rgba(255,255,255,0.088)':'1px solid rgba(148,163,184,0.42)',
                      borderRadius:'10px', padding:'10px 13px', color: isDark?'#f1f5f9':'#0f172a' }}
                    onFocus={e => { e.target.style.borderColor=isDark?'rgba(255,77,0,0.5)':'rgba(0,0,0,0.3)'; e.target.style.boxShadow=isDark?'0 0 0 3px rgba(255,77,0,0.1)':'0 0 0 3px rgba(0,0,0,0.06)'; e.target.style.background=isDark?'rgba(255,255,255,0.06)':'#ffffff'; }}
                    onBlur={e => { if(!fieldErrors.name){ e.target.style.borderColor=isDark?'rgba(255,255,255,0.088)':'rgba(148,163,184,0.42)'; e.target.style.boxShadow='none'; e.target.style.background=isDark?'rgba(255,255,255,0.044)':'rgba(255,255,255,0.84)'; }}}
                  />
                  {fieldErrors.name && <div style={{ display:'flex', alignItems:'center', gap:'4px', marginTop:'5px' }}><AlertCircle size={11} color="#ef4444"/><span style={{ fontSize:'11px', color:'#ef4444' }}>{fieldErrors.name}</span></div>}
                </div>

                {/* Email */}
                <div style={{ marginBottom:'11px' }}>
                  <label style={{ display:'block', fontSize:'12px', fontWeight:600, letterSpacing:'0.01em', color: isDark?'rgba(255,255,255,0.48)':'#475569', marginBottom:'5px' }}>Email</label>
                  <input type="email" autoComplete="email" value={form.email} required
                    onChange={e => { setField('email', e.target.value); setFieldErrors(fe => ({...fe, email:''})); }}
                    placeholder="you@example.com"
                    style={{ width:'100%', boxSizing:'border-box', outline:'none', fontSize:'14px', transition:'all 0.18s ease',
                      background: isDark?'rgba(255,255,255,0.044)':'rgba(255,255,255,0.84)',
                      border: fieldErrors.email?'1px solid rgba(239,68,68,0.55)':isDark?'1px solid rgba(255,255,255,0.088)':'1px solid rgba(148,163,184,0.42)',
                      borderRadius:'10px', padding:'10px 13px', color: isDark?'#f1f5f9':'#0f172a' }}
                    onFocus={e => { e.target.style.borderColor=isDark?'rgba(255,77,0,0.5)':'rgba(0,0,0,0.3)'; e.target.style.boxShadow=isDark?'0 0 0 3px rgba(255,77,0,0.1)':'0 0 0 3px rgba(0,0,0,0.06)'; e.target.style.background=isDark?'rgba(255,255,255,0.06)':'#ffffff'; }}
                    onBlur={e => { if(!fieldErrors.email){ e.target.style.borderColor=isDark?'rgba(255,255,255,0.088)':'rgba(148,163,184,0.42)'; e.target.style.boxShadow='none'; e.target.style.background=isDark?'rgba(255,255,255,0.044)':'rgba(255,255,255,0.84)'; }}}
                  />
                  {fieldErrors.email && <div style={{ display:'flex', alignItems:'center', gap:'4px', marginTop:'5px' }}><AlertCircle size={11} color="#ef4444"/><span style={{ fontSize:'11px', color:'#ef4444' }}>{fieldErrors.email}</span></div>}
                </div>

                {/* Password */}
                <div style={{ marginBottom: form.password.length > 0 ? '6px' : '11px' }}>
                  <label style={{ display:'block', fontSize:'12px', fontWeight:600, letterSpacing:'0.01em', color: isDark?'rgba(255,255,255,0.48)':'#475569', marginBottom:'5px' }}>Password</label>
                  <div style={{ position:'relative' }}>
                    <input type={showPass?'text':'password'} autoComplete="new-password" value={form.password} required
                      onChange={e => { setField('password', e.target.value); setFieldErrors(fe => ({...fe, password:''})); }}
                      placeholder="Min. 8 characters"
                      style={{ width:'100%', boxSizing:'border-box', outline:'none', fontSize:'14px', transition:'all 0.18s ease',
                        background: isDark?'rgba(255,255,255,0.044)':'rgba(255,255,255,0.84)',
                        border: fieldErrors.password?'1px solid rgba(239,68,68,0.55)':isDark?'1px solid rgba(255,255,255,0.088)':'1px solid rgba(148,163,184,0.42)',
                        borderRadius:'10px', padding:'10px 36px 10px 13px', color: isDark?'#f1f5f9':'#0f172a' }}
                      onFocus={e => { e.target.style.borderColor=isDark?'rgba(255,77,0,0.5)':'rgba(0,0,0,0.3)'; e.target.style.boxShadow=isDark?'0 0 0 3px rgba(255,77,0,0.1)':'0 0 0 3px rgba(0,0,0,0.06)'; e.target.style.background=isDark?'rgba(255,255,255,0.06)':'#ffffff'; }}
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

                {/* Strength meter */}
                {form.password.length > 0 && (
                  <div style={{ marginBottom:'11px' }}>
                    <div style={{ display:'flex', gap:'3px', marginBottom:'4px' }}>
                      {[1,2,3,4].map(n => (
                        <div key={n} style={{ flex:1, height:'2.5px', borderRadius:'2px', transition:'background 0.25s',
                          background: strength >= n
                            ? (strength===1?'#ef4444':strength===2?'#f97316':strength===3?'#f59e0b':'#10b981')
                            : isDark?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.07)',
                        }} />
                      ))}
                    </div>
                    <span style={{ fontSize:'11px', fontWeight:500,
                      color: strength===1?'#ef4444':strength===2?'#f97316':strength===3?'#f59e0b':'#10b981' }}>
                      {STRENGTH_META[strength]?.label || ''}
                    </span>
                  </div>
                )}

                {/* Confirm password */}
                <div style={{ marginBottom:'14px' }}>
                  <label style={{ display:'block', fontSize:'12px', fontWeight:600, letterSpacing:'0.01em', color: isDark?'rgba(255,255,255,0.48)':'#475569', marginBottom:'5px' }}>Confirm password</label>
                  <div style={{ position:'relative' }}>
                    <input type={showConfirm?'text':'password'} autoComplete="new-password" value={form.confirm} required
                      onChange={e => { setField('confirm', e.target.value); setFieldErrors(fe => ({...fe, confirm:''})); }}
                      placeholder="••••••••"
                      style={{ width:'100%', boxSizing:'border-box', outline:'none', fontSize:'14px', transition:'all 0.18s ease',
                        background: isDark?'rgba(255,255,255,0.044)':'rgba(255,255,255,0.84)',
                        border: fieldErrors.confirm?'1px solid rgba(239,68,68,0.55)':isDark?'1px solid rgba(255,255,255,0.088)':'1px solid rgba(148,163,184,0.42)',
                        borderRadius:'10px', padding:'10px 36px 10px 13px', color: isDark?'#f1f5f9':'#0f172a' }}
                      onFocus={e => { e.target.style.borderColor=isDark?'rgba(255,77,0,0.5)':'rgba(0,0,0,0.3)'; e.target.style.boxShadow=isDark?'0 0 0 3px rgba(255,77,0,0.1)':'0 0 0 3px rgba(0,0,0,0.06)'; e.target.style.background=isDark?'rgba(255,255,255,0.06)':'#ffffff'; }}
                      onBlur={e => { if(!fieldErrors.confirm){ e.target.style.borderColor=isDark?'rgba(255,255,255,0.088)':'rgba(148,163,184,0.42)'; e.target.style.boxShadow='none'; e.target.style.background=isDark?'rgba(255,255,255,0.044)':'rgba(255,255,255,0.84)'; }}}
                    />
                    <button type="button" onClick={() => setShowConfirm(v=>!v)} tabIndex={-1}
                      style={{ position:'absolute', right:'11px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:isDark?'rgba(255,255,255,0.26)':'#94a3b8', padding:0, display:'flex', transition:'color 0.12s' }}
                      onMouseEnter={e => e.currentTarget.style.color=isDark?'rgba(255,255,255,0.68)':'#64748b'}
                      onMouseLeave={e => e.currentTarget.style.color=isDark?'rgba(255,255,255,0.26)':'#94a3b8'}>
                      {showConfirm ? <EyeOff size={14}/> : <Eye size={14}/>}
                    </button>
                  </div>
                  {fieldErrors.confirm && <div style={{ display:'flex', alignItems:'center', gap:'4px', marginTop:'5px' }}><AlertCircle size={11} color="#ef4444"/><span style={{ fontSize:'11px', color:'#ef4444' }}>{fieldErrors.confirm}</span></div>}
                </div>

                {/* Consents */}
                <div style={{ marginBottom:'16px', display:'flex', flexDirection:'column', gap:'9px' }}>
                  {[
                    { key:'terms', node: <span>I agree to the <a href="/terms" target="_blank" style={{ color: isDark?'#a1a1aa':'#52525b', textDecoration:'underline' }}>Terms of Service</a></span> },
                    { key:'risk',  node: <span>I understand trading involves risk and accept sole responsibility for my trades</span> },
                  ].map(({ key, node }) => (
                    <label key={key} style={{ display:'flex', alignItems:'flex-start', gap:'9px', cursor:'pointer' }}>
                      <input type="checkbox" className="sp-checkbox"
                        checked={consent[key]}
                        onChange={e => setConsent(c => ({...c, [key]: e.target.checked}))}
                        style={{ border: isDark?'1px solid rgba(255,255,255,0.18)':'1px solid rgba(0,0,0,0.16)', marginTop:'2px' }}
                      />
                      <span style={{ fontSize:'12px', color: isDark?'rgba(255,255,255,0.44)':'#64748b', lineHeight:1.55 }}>{node}</span>
                    </label>
                  ))}
                </div>

                {/* Submit */}
                <button type="submit" disabled={loading}
                  style={{ width:'100%', padding:'11px',
                    background: loading?(isDark?'rgba(255,77,0,0.3)':'rgba(0,0,0,0.3)'):(isDark?'linear-gradient(135deg, #FF4D00 0%, #FF7A00 100%)':'linear-gradient(135deg, #18181b 0%, #27272a 100%)'),
                    border:'none', borderRadius:'11px', color:'#fff', fontSize:'13.5px', fontWeight:600,
                    cursor:loading?'not-allowed':'pointer', transition:'all 0.18s ease',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:'7px',
                    boxShadow: loading?'none':(isDark?'0 2px 14px rgba(255,77,0,0.3), 0 1px 3px rgba(0,0,0,0.2)':'0 2px 14px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.1)'),
                    letterSpacing:'0.01em' }}
                  onMouseEnter={e => { if(!loading){ e.currentTarget.style.transform='translateY(-1.5px)'; e.currentTarget.style.boxShadow=isDark?'0 8px 28px rgba(255,77,0,0.4), 0 2px 8px rgba(0,0,0,0.2)':'0 8px 28px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.12)'; }}}
                  onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=loading?'none':(isDark?'0 2px 14px rgba(255,77,0,0.3), 0 1px 3px rgba(0,0,0,0.2)':'0 2px 14px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.1)'); }}
                  onMouseDown={e => { if(!loading) e.currentTarget.style.transform='scale(0.985)'; }}
                  onMouseUp={e => { if(!loading) e.currentTarget.style.transform='translateY(-1.5px)'; }}>
                  {loading ? <><Loader2 size={14} className="animate-spin"/><span>Creating account…</span></> : <><span>Create account</span><ArrowRight size={14}/></>}
                </button>
              </form>

              {/* Trust strip */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'14px', marginTop:'16px', animation:'fadeUp 0.45s ease 0.28s both' }}>
                <span style={{ fontSize:'11px', fontWeight:500, color: isDark?'rgba(255,255,255,0.24)':'#64748b', display:'flex', alignItems:'center', gap:'4px' }}>
                  <svg width="9" height="11" viewBox="0 0 9 11" fill="none" style={{ opacity:0.7 }}><path d="M4.5 0L0 2.25V5.25c0 2.32 1.93 4.22 4.5 5.25C7.07 9.47 9 7.57 9 5.25V2.25L4.5 0z" fill="currentColor"/></svg>
                  256-bit SSL
                </span>
                <span style={{ width:'1px', height:'10px', background: isDark?'rgba(255,255,255,0.10)':'rgba(100,116,139,0.28)' }} />
                <span style={{ fontSize:'11px', fontWeight:500, color: isDark?'rgba(255,255,255,0.24)':'#64748b' }}>Cancel anytime</span>
              </div>
            </div>

            {/* Below-card link */}
            <p style={{ marginTop:'20px', fontSize:'13px', color: isDark?'rgba(255,255,255,0.32)':'#94a3b8', animation:'cardIn 0.45s ease 0.1s both' }}>
              Already have an account?{' '}
              <button onClick={onSwitchToLogin}
                style={{ color:isDark?'#a1a1aa':'#52525b', background:'none', border:'none', cursor:'pointer', fontSize:'13px', padding:0, fontWeight:500, transition:'color 0.12s' }}
                onMouseEnter={e => e.currentTarget.style.color=isDark?'#ffffff':'#09090b'}
                onMouseLeave={e => e.currentTarget.style.color=isDark?'#a1a1aa':'#52525b'}>
                Sign in →
              </button>
            </p>
          </>
        )}
          </div>
        </div>
      </div>
    </div>
  );
}
