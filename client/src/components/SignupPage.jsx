import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config/api';
import { getPublicStats } from '../utils/publicStats';
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

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
  const focusIn  = e => { e.target.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(59,130,246,0.03)'; e.target.style.borderColor = 'rgba(59,130,246,0.55)'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.10)'; };
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
    if (form.password.length < 6) {
      setFieldErrors(fe => ({ ...fe, password: 'Password must be at least 6 characters.' }));
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
    <div style={{ minHeight:'100vh', background: isDark?'#020617':'#f8fafc', position:'relative', overflowX:'hidden', overflowY:'auto' }}>
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
        .sp-checkbox:checked { background:#3b82f6; border-color:#3b82f6 !important; }
        .sp-checkbox:checked::after {
          content:''; position:absolute; left:3px; top:1px;
          width:9px; height:5px;
          border-left:2px solid #fff; border-bottom:2px solid #fff;
          transform:rotate(-45deg); animation:checkIn 0.14s ease;
        }
      `}</style>

      {/* ── Grid texture ───────────────────────────────────────────────── */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0,
        backgroundImage: isDark
          ? 'linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)'
          : 'linear-gradient(rgba(0,0,0,0.034) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.034) 1px, transparent 1px)',
        backgroundSize:'42px 42px',
      }} />

      {/* ── Blob 1 – top-left drift ─────────────────────────────────────── */}
      <div style={{ position:'fixed', top:'-220px', left:'-180px', width:'720px', height:'720px',
        pointerEvents:'none', zIndex:0,
        background: isDark
          ? 'radial-gradient(circle, rgba(59,130,246,0.11) 0%, rgba(99,102,241,0.055) 35%, transparent 65%)'
          : 'radial-gradient(circle, rgba(99,102,241,0.09) 0%, rgba(168,85,247,0.04) 35%, transparent 65%)',
        filter:'blur(82px)', animation:'blobDrift 18s ease-in-out infinite',
      }} />

      {/* ── Blob 2 – bottom-right drift ─────────────────────────────────── */}
      <div style={{ position:'fixed', bottom:'-200px', right:'-180px', width:'640px', height:'640px',
        pointerEvents:'none', zIndex:0,
        background: isDark
          ? 'radial-gradient(circle, rgba(99,102,241,0.09) 0%, rgba(59,130,246,0.04) 35%, transparent 65%)'
          : 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, rgba(99,102,241,0.03) 35%, transparent 65%)',
        filter:'blur(82px)', animation:'blobDrift2 22s ease-in-out infinite',
      }} />

      {/* ── Corner vignette ─────────────────────────────────────────────── */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0,
        background: isDark
          ? 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(2,6,23,0.62) 100%)'
          : 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(240,244,250,0.64) 100%)',
      }} />

      {/* Nav */}
      <div style={{ position:'fixed', top:0, left:0, right:0, zIndex:20, height:'52px',
        display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px',
        borderBottom: isDark?'1px solid rgba(255,255,255,0.045)':'1px solid rgba(0,0,0,0.045)',
        background: isDark?'rgba(2,6,23,0.65)':'rgba(248,250,252,0.75)',
        backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
      }}>
        <div>
          {onBack && (
            <button onClick={onBack}
              style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'12.5px',
                color: isDark?'rgba(255,255,255,0.36)':'#94a3b8', background:'none', border:'none',
                cursor:'pointer', padding:'4px 7px', borderRadius:'6px', transition:'all 0.12s' }}
              onMouseEnter={e => { e.currentTarget.style.color=isDark?'rgba(255,255,255,0.76)':'#475569'; e.currentTarget.style.background=isDark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.03)'; }}
              onMouseLeave={e => { e.currentTarget.style.color=isDark?'rgba(255,255,255,0.36)':'#94a3b8'; e.currentTarget.style.background='transparent'; }}>
              <ChevronLeft size={13} /> Back
            </button>
          )}
        </div>
        <div style={{ position:'absolute', left:'50%', transform:'translateX(-50%)', display:'flex', alignItems:'center', gap:'7px' }}>
          <BrandMark size={21} />
          <span style={{ fontSize:'14px', fontWeight:700, letterSpacing:'-0.022em', color: isDark?'rgba(255,255,255,0.86)':'#0f172a' }}>Zynth</span>
        </div>
        <button onClick={onSwitchToLogin}
          style={{ fontSize:'12.5px', fontWeight:500, color: isDark?'rgba(255,255,255,0.36)':'#94a3b8', background:'none', border:'none', cursor:'pointer', padding:'4px 2px', transition:'color 0.12s' }}
          onMouseEnter={e => e.currentTarget.style.color='#3b82f6'}
          onMouseLeave={e => e.currentTarget.style.color=isDark?'rgba(255,255,255,0.36)':'#94a3b8'}>
          Sign in →
        </button>
      </div>

      {/* Page body */}
      <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:'64px 20px 48px', boxSizing:'border-box' }}>

        {success ? (
          /* ── Success screen ─────────────────────────────────────────── */
          <div style={{ textAlign:'center', animation:'cardIn 0.4s ease both' }}>
            <div style={{ width:'68px', height:'68px', borderRadius:'50%', background:'linear-gradient(135deg,#2563eb,#0284c7)',
              display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px',
              boxShadow:'0 0 40px rgba(37,99,235,0.40)' }}>
              <CheckCircle size={32} color="#fff" />
            </div>
            <h2 style={{ fontSize:'22px', fontWeight:700, letterSpacing:'-0.025em', color: isDark?'#f1f5f9':'#0f172a', marginBottom:'8px' }}>
              Account created!
            </h2>
            <p style={{ fontSize:'14px', color: isDark?'rgba(255,255,255,0.48)':'#64748b', marginBottom:0 }}>
              Redirecting you to your dashboard…
            </p>
            <div style={{ width:'36px', height:'2.5px', background:'linear-gradient(90deg,#2563eb,#0284c7)', borderRadius:'2px', margin:'18px auto 0', animation:'blobDrift2 1.6s ease-in-out infinite' }} />
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
              background: isDark?'rgba(9,14,30,0.78)':'rgba(255,255,255,0.97)',
              backdropFilter:'blur(32px)', WebkitBackdropFilter:'blur(32px)',
              border: isDark?'1px solid rgba(255,255,255,0.077)':'1px solid rgba(0,0,0,0.060)',
              borderRadius:'18px', padding:'28px 28px 24px',
              boxShadow: isDark
                ? '0 0 0 0.5px rgba(255,255,255,0.055) inset, 0 20px 60px rgba(0,0,0,0.84), 0 0 0 1px rgba(59,130,246,0.07)'
                : '0 0 0 1px rgba(0,0,0,0.033), 0 6px 28px rgba(15,23,42,0.09), 0 1.5px 6px rgba(15,23,42,0.04)',
              animation:'cardIn 0.45s cubic-bezier(0.22,1,0.36,1) 0.06s both',
            }}>

              {/* Heading */}
              <div style={{ marginBottom:'20px' }}>
                <h1 style={{ fontSize:'21px', fontWeight:700, letterSpacing:'-0.028em', margin:'0 0 5px', color: isDark?'#f1f5f9':'#0f172a', lineHeight:1.2 }}>
                  Create your account.
                </h1>
                <p style={{ fontSize:'13.5px', color: isDark?'rgba(255,255,255,0.38)':'#94a3b8', margin:0 }}>
                  {spotsLeft != null && <><span style={{ color:'#f59e0b', fontWeight:600 }}>{spotsLeft} spots</span> left at this price.{' '}</>}
                  Already on Zynth?{' '}
                  <button onClick={onSwitchToLogin}
                    style={{ color:'#3b82f6', background:'none', border:'none', cursor:'pointer', fontSize:'13.5px', padding:0, fontWeight:500, transition:'color 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.color='#60a5fa'}
                    onMouseLeave={e => e.currentTarget.style.color='#3b82f6'}>
                    Sign in
                  </button>
                </p>
              </div>

              {error && <ErrorBar message={error} className="mb-4" />}

              {/* Google button */}
              <button type="button" onClick={handleGoogleClick} disabled={loading||googleLoading||!GOOGLE_CLIENT_ID}
                style={{ width:'100%', padding:'10px 16px',
                  background: isDark?'rgba(255,255,255,0.96)':'#ffffff',
                  border: isDark?'1px solid rgba(255,255,255,0.10)':'1px solid rgba(0,0,0,0.08)',
                  borderRadius:'11px', color:!GOOGLE_CLIENT_ID?'rgba(0,0,0,0.3)':'#1e293b',
                  fontSize:'13.5px', fontWeight:500,
                  display:'flex', alignItems:'center', justifyContent:'center', gap:'10px',
                  cursor:loading||googleLoading||!GOOGLE_CLIENT_ID?'not-allowed':'pointer',
                  transition:'all 0.18s ease', marginBottom:'14px',
                  boxShadow: isDark?'0 1px 0 rgba(255,255,255,0.10) inset, 0 2px 8px rgba(0,0,0,0.36)':'0 1px 3px rgba(15,23,42,0.09), 0 0 0 1px rgba(0,0,0,0.04)' }}
                onMouseEnter={e => { if(!loading&&!googleLoading&&GOOGLE_CLIENT_ID){ e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow=isDark?'0 1px 0 rgba(255,255,255,0.10) inset, 0 6px 20px rgba(0,0,0,0.46)':'0 4px 14px rgba(15,23,42,0.12)'; }}}
                onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=isDark?'0 1px 0 rgba(255,255,255,0.10) inset, 0 2px 8px rgba(0,0,0,0.36)':'0 1px 3px rgba(15,23,42,0.09), 0 0 0 1px rgba(0,0,0,0.04)'; }}>
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

              {/* Divider */}
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
                <div style={{ flex:1, height:'1px', background: isDark?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.07)' }} />
                <span style={{ fontSize:'10.5px', fontWeight:500, color: isDark?'rgba(255,255,255,0.22)':'#cbd5e1', textTransform:'uppercase', letterSpacing:'0.09em' }}>or</span>
                <div style={{ flex:1, height:'1px', background: isDark?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.07)' }} />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>

                {/* Name */}
                <div style={{ marginBottom:'11px' }}>
                  <label style={{ display:'block', fontSize:'12px', fontWeight:500, letterSpacing:'0.01em', color: isDark?'rgba(255,255,255,0.48)':'#64748b', marginBottom:'5px' }}>Full name</label>
                  <input type="text" autoComplete="name" value={form.name} required
                    onChange={e => { setField('name', e.target.value); setFieldErrors(fe => ({...fe, name:''})); }}
                    placeholder="Jane Smith"
                    style={{ width:'100%', boxSizing:'border-box', outline:'none', fontSize:'14px', transition:'all 0.18s ease',
                      background: isDark?'rgba(255,255,255,0.044)':'rgba(0,0,0,0.024)',
                      border: fieldErrors.name?'1px solid rgba(239,68,68,0.55)':isDark?'1px solid rgba(255,255,255,0.088)':'1px solid rgba(0,0,0,0.088)',
                      borderRadius:'10px', padding:'10px 13px', color: isDark?'#f1f5f9':'#0f172a' }}
                    onFocus={e => { e.target.style.borderColor='rgba(59,130,246,0.52)'; e.target.style.boxShadow='0 0 0 3px rgba(59,130,246,0.10)'; e.target.style.background=isDark?'rgba(255,255,255,0.06)':'#fff'; }}
                    onBlur={e => { if(!fieldErrors.name){ e.target.style.borderColor=isDark?'rgba(255,255,255,0.088)':'rgba(0,0,0,0.088)'; e.target.style.boxShadow='none'; e.target.style.background=isDark?'rgba(255,255,255,0.044)':'rgba(0,0,0,0.024)'; }}}
                  />
                  {fieldErrors.name && <div style={{ display:'flex', alignItems:'center', gap:'4px', marginTop:'5px' }}><AlertCircle size={11} color="#ef4444"/><span style={{ fontSize:'11px', color:'#ef4444' }}>{fieldErrors.name}</span></div>}
                </div>

                {/* Email */}
                <div style={{ marginBottom:'11px' }}>
                  <label style={{ display:'block', fontSize:'12px', fontWeight:500, letterSpacing:'0.01em', color: isDark?'rgba(255,255,255,0.48)':'#64748b', marginBottom:'5px' }}>Email</label>
                  <input type="email" autoComplete="email" value={form.email} required
                    onChange={e => { setField('email', e.target.value); setFieldErrors(fe => ({...fe, email:''})); }}
                    placeholder="you@example.com"
                    style={{ width:'100%', boxSizing:'border-box', outline:'none', fontSize:'14px', transition:'all 0.18s ease',
                      background: isDark?'rgba(255,255,255,0.044)':'rgba(0,0,0,0.024)',
                      border: fieldErrors.email?'1px solid rgba(239,68,68,0.55)':isDark?'1px solid rgba(255,255,255,0.088)':'1px solid rgba(0,0,0,0.088)',
                      borderRadius:'10px', padding:'10px 13px', color: isDark?'#f1f5f9':'#0f172a' }}
                    onFocus={e => { e.target.style.borderColor='rgba(59,130,246,0.52)'; e.target.style.boxShadow='0 0 0 3px rgba(59,130,246,0.10)'; e.target.style.background=isDark?'rgba(255,255,255,0.06)':'#fff'; }}
                    onBlur={e => { if(!fieldErrors.email){ e.target.style.borderColor=isDark?'rgba(255,255,255,0.088)':'rgba(0,0,0,0.088)'; e.target.style.boxShadow='none'; e.target.style.background=isDark?'rgba(255,255,255,0.044)':'rgba(0,0,0,0.024)'; }}}
                  />
                  {fieldErrors.email && <div style={{ display:'flex', alignItems:'center', gap:'4px', marginTop:'5px' }}><AlertCircle size={11} color="#ef4444"/><span style={{ fontSize:'11px', color:'#ef4444' }}>{fieldErrors.email}</span></div>}
                </div>

                {/* Password */}
                <div style={{ marginBottom: form.password.length > 0 ? '6px' : '11px' }}>
                  <label style={{ display:'block', fontSize:'12px', fontWeight:500, letterSpacing:'0.01em', color: isDark?'rgba(255,255,255,0.48)':'#64748b', marginBottom:'5px' }}>Password</label>
                  <div style={{ position:'relative' }}>
                    <input type={showPass?'text':'password'} autoComplete="new-password" value={form.password} required
                      onChange={e => { setField('password', e.target.value); setFieldErrors(fe => ({...fe, password:''})); }}
                      placeholder="Min. 8 characters"
                      style={{ width:'100%', boxSizing:'border-box', outline:'none', fontSize:'14px', transition:'all 0.18s ease',
                        background: isDark?'rgba(255,255,255,0.044)':'rgba(0,0,0,0.024)',
                        border: fieldErrors.password?'1px solid rgba(239,68,68,0.55)':isDark?'1px solid rgba(255,255,255,0.088)':'1px solid rgba(0,0,0,0.088)',
                        borderRadius:'10px', padding:'10px 36px 10px 13px', color: isDark?'#f1f5f9':'#0f172a' }}
                      onFocus={e => { e.target.style.borderColor='rgba(59,130,246,0.52)'; e.target.style.boxShadow='0 0 0 3px rgba(59,130,246,0.10)'; e.target.style.background=isDark?'rgba(255,255,255,0.06)':'#fff'; }}
                      onBlur={e => { if(!fieldErrors.password){ e.target.style.borderColor=isDark?'rgba(255,255,255,0.088)':'rgba(0,0,0,0.088)'; e.target.style.boxShadow='none'; e.target.style.background=isDark?'rgba(255,255,255,0.044)':'rgba(0,0,0,0.024)'; }}}
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
                  <label style={{ display:'block', fontSize:'12px', fontWeight:500, letterSpacing:'0.01em', color: isDark?'rgba(255,255,255,0.48)':'#64748b', marginBottom:'5px' }}>Confirm password</label>
                  <div style={{ position:'relative' }}>
                    <input type={showConfirm?'text':'password'} autoComplete="new-password" value={form.confirm} required
                      onChange={e => { setField('confirm', e.target.value); setFieldErrors(fe => ({...fe, confirm:''})); }}
                      placeholder="••••••••"
                      style={{ width:'100%', boxSizing:'border-box', outline:'none', fontSize:'14px', transition:'all 0.18s ease',
                        background: isDark?'rgba(255,255,255,0.044)':'rgba(0,0,0,0.024)',
                        border: fieldErrors.confirm?'1px solid rgba(239,68,68,0.55)':isDark?'1px solid rgba(255,255,255,0.088)':'1px solid rgba(0,0,0,0.088)',
                        borderRadius:'10px', padding:'10px 36px 10px 13px', color: isDark?'#f1f5f9':'#0f172a' }}
                      onFocus={e => { e.target.style.borderColor='rgba(59,130,246,0.52)'; e.target.style.boxShadow='0 0 0 3px rgba(59,130,246,0.10)'; e.target.style.background=isDark?'rgba(255,255,255,0.06)':'#fff'; }}
                      onBlur={e => { if(!fieldErrors.confirm){ e.target.style.borderColor=isDark?'rgba(255,255,255,0.088)':'rgba(0,0,0,0.088)'; e.target.style.boxShadow='none'; e.target.style.background=isDark?'rgba(255,255,255,0.044)':'rgba(0,0,0,0.024)'; }}}
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
                    { key:'terms', node: <span>I agree to the <a href="/terms" target="_blank" style={{ color:'#3b82f6', textDecoration:'none' }}>Terms of Service</a></span> },
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
                    background: loading?'rgba(59,130,246,0.45)':'linear-gradient(135deg, #2563eb 0%, #0284c7 100%)',
                    border:'none', borderRadius:'11px', color:'#fff', fontSize:'13.5px', fontWeight:600,
                    cursor:loading?'not-allowed':'pointer', transition:'all 0.18s ease',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:'7px',
                    boxShadow: loading?'none':'0 2px 14px rgba(37,99,235,0.38), 0 1px 3px rgba(37,99,235,0.22)',
                    letterSpacing:'0.01em' }}
                  onMouseEnter={e => { if(!loading){ e.currentTarget.style.transform='translateY(-1.5px)'; e.currentTarget.style.boxShadow='0 8px 28px rgba(37,99,235,0.52), 0 2px 8px rgba(37,99,235,0.28)'; }}}
                  onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=loading?'none':'0 2px 14px rgba(37,99,235,0.38), 0 1px 3px rgba(37,99,235,0.22)'; }}
                  onMouseDown={e => { if(!loading) e.currentTarget.style.transform='scale(0.985)'; }}
                  onMouseUp={e => { if(!loading) e.currentTarget.style.transform='translateY(-1.5px)'; }}>
                  {loading ? <><Loader2 size={14} className="animate-spin"/><span>Creating account…</span></> : <><span>Create account</span><ArrowRight size={14}/></>}
                </button>
              </form>

              {/* Trust strip */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'14px', marginTop:'16px' }}>
                <span style={{ fontSize:'11px', color: isDark?'rgba(255,255,255,0.17)':'#cbd5e1', display:'flex', alignItems:'center', gap:'4px' }}>
                  <svg width="9" height="11" viewBox="0 0 9 11" fill="none" style={{ opacity:0.7 }}><path d="M4.5 0L0 2.25V5.25c0 2.32 1.93 4.22 4.5 5.25C7.07 9.47 9 7.57 9 5.25V2.25L4.5 0z" fill="currentColor"/></svg>
                  256-bit SSL
                </span>
                <span style={{ width:'1px', height:'10px', background: isDark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.06)' }} />
                <span style={{ fontSize:'11px', color: isDark?'rgba(255,255,255,0.17)':'#cbd5e1' }}>Cancel anytime</span>
              </div>
            </div>

            {/* Below-card link */}
            <p style={{ marginTop:'20px', fontSize:'13px', color: isDark?'rgba(255,255,255,0.32)':'#94a3b8', animation:'cardIn 0.45s ease 0.1s both' }}>
              Already have an account?{' '}
              <button onClick={onSwitchToLogin}
                style={{ color:'#3b82f6', background:'none', border:'none', cursor:'pointer', fontSize:'13px', padding:0, fontWeight:500, transition:'color 0.12s' }}
                onMouseEnter={e => e.currentTarget.style.color='#60a5fa'}
                onMouseLeave={e => e.currentTarget.style.color='#3b82f6'}>
                Sign in →
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
