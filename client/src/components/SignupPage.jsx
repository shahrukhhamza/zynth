import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config/api';
import { getPublicStats } from '../utils/publicStats';
import { BrandMark } from './BrandLogo';
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
    <div style={{display:'flex',height:'100vh',width:'100%',overflow:'hidden',background: isDark ? '#020617' : '#F8FAFC',position:'relative'}}>

      <style>{`
        @keyframes formAppear {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0);    }
        }
        @keyframes shake {
          0%,100% { transform: translateX(0);    }
          20%      { transform: translateX(-6px); }
          40%      { transform: translateX(6px);  }
          60%      { transform: translateX(-4px); }
          80%      { transform: translateX(4px);  }
        }
        @keyframes formShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
        @keyframes checkIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .sp-checkbox {
          appearance: none; -webkit-appearance: none;
          width: 18px; height: 18px; min-width: 18px;
          border-radius: 5px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.15);
          cursor: pointer; position: relative; margin-top: 1px;
          transition: background 0.15s, border-color 0.15s;
        }
        .sp-checkbox:checked {
          background: #3b82f6;
          border-color: #3b82f6;
        }
        .sp-checkbox:checked::after {
          content: '';
          position: absolute;
          left: 4px; top: 1px;
          width: 5px; height: 9px;
          border: 2px solid #fff;
          border-top: none; border-left: none;
          transform: rotate(45deg);
        }
        @keyframes orbPulse {
          0%, 100% { transform: scale(1);    opacity: 0.6; }
          50%       { transform: scale(1.15); opacity: 1;   }
        }
        @keyframes panelFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      {/* â”€â”€ Top nav â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {/* placeholder - nav bar removed */}

      {/* â”€â”€ Panels â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}

        {/* â”€â”€ LEFT: Brand panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div style={{display: isMobile ? 'none' : 'flex', flex:1, flexDirection:'column', position:'relative', overflow:'hidden', minHeight:'100vh', background: isDark ? '#030303' : '#ebf0f7', animation:'panelFadeIn 0.6s ease'}}>

          {/* Orb 1 – bottom left */}
          <div className="pointer-events-none" style={{
            position:'absolute', width:'500px', height:'500px',
            background:'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
            bottom:'-150px', left:'-150px',
            filter:'blur(60px)',
            animation:'orbPulse 4s ease infinite',
          }} />
          {/* Orb 2 – top right */}
          <div className="pointer-events-none" style={{
            position:'absolute', width:'350px', height:'350px',
            background:'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)',
            top:'-100px', right:'-50px',
            filter:'blur(50px)',
            animation:'orbPulse 4s ease infinite 2s',
          }} />

          {/* Top-left branding */}
          <div className="relative z-10 flex items-center" style={{padding:'32px 48px 0', gap:'16px'}}>
            {onBack && (
              <button
                onClick={onBack}
                style={{
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                borderRadius:'8px',
                padding:'7px 14px',
                fontSize:'13px',
                color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b',
                display:'flex', alignItems:'center', gap:'6px',
                cursor:'pointer',
                transition:'all 0.2s ease',
                flexShrink:0,
              }}
              onMouseEnter={e => { e.currentTarget.style.background= isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'; e.currentTarget.style.color= isDark ? 'rgba(255,255,255,0.75)' : '#334155'; e.currentTarget.style.borderColor= isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)'; }}
              onMouseLeave={e => { e.currentTarget.style.background= isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'; e.currentTarget.style.color= isDark ? 'rgba(255,255,255,0.5)' : '#64748b'; e.currentTarget.style.borderColor= isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'; }}
              >
                <ChevronLeft size={14} />
                Back
              </button>
            )}
            <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
              <BrandMark size={30} />
              <div>
                <p style={{color: isDark ? '#fff' : '#0f172a',fontSize:'18px',fontWeight:700,lineHeight:1}}>Zynth</p>
                <p style={{color: isDark ? 'rgba(255,255,255,0.4)' : '#64748b',fontSize:'12px',letterSpacing:'0.05em',marginTop:'3px'}}>
                  Intelligence Behind Every Trade
                </p>
              </div>
            </div>
          </div>

          {/* Center content */}
          <div className="relative z-10 flex-1 flex flex-col justify-center" style={{padding:'0 48px 96px'}}>
            <h1 style={{fontSize:'52px',fontWeight:800,letterSpacing:'-0.03em',lineHeight:1.1,marginBottom:'16px'}}>
              <span style={{color: isDark ? '#ffffff' : '#0f172a'}}>Start Trading<br /></span>
              <span style={{
                background: isDark ? 'linear-gradient(135deg, #ffffff 30%, #3b82f6 100%)' : 'linear-gradient(135deg, #0f172a 30%, #2563eb 100%)',
                WebkitBackgroundClip:'text',
                WebkitTextFillColor:'transparent',
                backgroundClip:'text',
              }}>Smarter.</span>
            </h1>
            <p style={{fontSize:'16px',color: isDark ? 'rgba(255,255,255,0.45)' : '#475569',lineHeight:1.7,marginBottom:'36px',maxWidth:'340px'}}>
              Join traders who use data to improve their edge, not guesswork.
            </p>
            <div>
              {[
                { Icon: BookOpen,   title: 'Smart Trade Journal',  desc: 'Log trades in seconds with AI coaching' },
                { Icon: Brain,      title: 'AI Pattern Detection', desc: 'Find why you win and lose with data'    },
                { Icon: TrendingUp, title: 'Macro Intelligence',   desc: 'Trade with economic data on your side'  },
              ].map(({ Icon, title, desc }) => (
                <div key={title} style={{display:'flex',gap:'14px',marginBottom:'22px'}}>
                  <div style={{
                    width:'40px',height:'40px',minWidth:'40px',
                    background:'rgba(59,130,246,0.1)',
                  border:'1px solid rgba(59,130,246,0.22)',
                  borderRadius:'10px',
                  display:'flex',alignItems:'center',justifyContent:'center',
                  boxShadow:'0 0 20px rgba(59,130,246,0.14)',
                  }}>
                    <Icon size={18} color="#3b82f6" />
                  </div>
                  <div>
                    <p style={{color: isDark ? '#fff' : '#0f172a',fontSize:'14px',fontWeight:600,marginBottom:'2px'}}>{title}</p>
                    <p style={{color: isDark ? 'rgba(255,255,255,0.4)' : '#64748b',fontSize:'13px',lineHeight:1.5}}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom trust badges */}
          <div className="relative z-10" style={{position:'absolute',bottom:'32px',left:'48px',right:'48px'}}>
            <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
              {[
                {Icon: Shield, label: '256-bit SSL'},
                {Icon: Zap,    label: 'Live Data'},
                {Icon: Bot,    label: 'AI'},
              ].map(({Icon, label}) => (
                <span key={label} style={{
                  background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                  border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                  borderRadius:'20px',
                  padding:'5px 12px',
                  fontSize:'11px',
                  color: isDark ? 'rgba(255,255,255,0.4)' : '#64748b',
                  display:'flex',gap:'5px',alignItems:'center',
                }}>
                  <Icon size={11} />{label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* â”€â”€ RIGHT: Signup form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div style={{
               width: isMobile ? '100%' : '460px',
               minWidth: isMobile ? 'unset' : '460px',
               flexShrink: 0,
               display:'flex', flexDirection:'column',
               alignItems:'center',
               overflowY:'auto',
               background: isMobile ? (isDark ? '#020617' : '#F8FAFC') : (isDark ? 'rgba(11,18,32,0.97)' : 'rgba(255,255,255,0.98)'),
               backdropFilter: isMobile ? 'none' : 'blur(12px)',
               borderLeft: isMobile ? 'none' : isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.07)',
               boxShadow: isMobile ? 'none' : isDark ? '-1px 0 40px rgba(0,0,0,0.4)' : '-1px 0 24px rgba(0,0,0,0.06)',
               padding: isMobile ? '24px 20px' : '24px 44px',
               minHeight:'100vh',
               boxSizing:'border-box',
             }}>

          <div style={{width:'100%', maxWidth:'380px', animation:'slideInRight 0.4s ease both', marginTop:'auto', marginBottom:'auto'}}>

            {success ? (
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',gap:'16px',padding:'48px 0'}}>
                <div style={{
                  width:'64px', height:'64px',
                  background:'rgba(59,130,246,0.1)',
                  border:'2px solid #3b82f6',
                  borderRadius:'50%',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  animation:'checkIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
                }}>
                  <CheckCircle size={32} color="#3b82f6" />
                </div>
                <div>
                  <p style={{color: isDark ? '#fff' : '#0f172a',fontWeight:700,fontSize:'20px',margin:0}}>Account created!</p>
                  <p style={{color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b',fontSize:'14px',margin:'6px 0 0'}}>Setting up your workspace...</p>
                </div>
                <Loader2 size={20} color={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"} className="animate-spin" />
              </div>
            ) : (
              <>
            {/* Mobile back + logo */}
            {isMobile && onBack && (
              <button
                onClick={onBack}
                style={{
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                  borderRadius:'8px',
                  padding:'7px 14px',
                  fontSize:'13px',
                  color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b',
                  display:'flex', alignItems:'center', gap:'6px',
                  cursor:'pointer',
                  transition:'all 0.2s ease',
                  marginBottom:'20px',
                  alignSelf:'flex-start',
                }}
                onMouseEnter={e => { e.currentTarget.style.background= isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'; e.currentTarget.style.color= isDark ? 'rgba(255,255,255,0.75)' : '#334155'; }}
                onMouseLeave={e => { e.currentTarget.style.background= isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'; e.currentTarget.style.color= isDark ? 'rgba(255,255,255,0.5)' : '#64748b'; }}
              >
                <ChevronLeft size={14} />
                Back
              </button>
            )}
            {isMobile && (
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',marginBottom:'28px'}}>
                <div style={{width:'28px',height:'28px',background:'#3b82f6',borderRadius:'7px',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <span style={{color:'#fff',fontWeight:'bold',fontSize:'14px'}}>Z</span>
                </div>
                <span style={{color: isDark ? '#fff' : '#0f172a',fontWeight:'bold',fontSize:'17px'}}>Zynth</span>
              </div>
            )}

            {/* Pro plan callout */}
            {false && (
              <div style={{
                background:'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(59,130,246,0.04))',
                border:'1px solid rgba(59,130,246,0.2)',
                borderRadius:'8px',
                padding:'10px 14px',
                marginBottom:'14px',
                fontSize:'13px',
                color:'#3b82f6',
                textAlign:'center',
              }}>
                <Flame size={12} style={{display:'inline-block',verticalAlign:'middle',marginRight:'4px'}} />{spotsLeft} founding spots · $1.99/mo
              </div>
            )}

            {/* Header */}
            <h2 style={{fontSize: isMobile ? '22px' : '26px',fontWeight:800,color: isDark ? '#fff' : '#0f172a',letterSpacing:'-0.025em',margin:0,lineHeight:1.15}}>Start trading with clarity,</h2>
            <p style={{fontSize:'14px',fontWeight:500,color: isDark ? 'rgba(255,255,255,0.45)' : '#64748b',marginTop:'5px',marginBottom:'16px'}}>not guesswork.</p>
            <p style={{fontSize:'13px',marginBottom:'14px',color: isDark ? 'rgba(255,255,255,0.4)' : '#64748b'}}>
              Already have one?{' '}
              <button onClick={onSwitchToLogin}
                      style={{color:'#3b82f6',background:'none',border:'none',cursor:'pointer',fontSize:'13px',padding:0}}
                      onMouseEnter={e => e.currentTarget.style.textDecoration='underline'}
                      onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>
                Sign in
              </button>
            </p>

            {/* Error */}
            {error && (
              <div style={{display:'flex',alignItems:'flex-start',gap:'10px',background:'rgba(239,68,68,0.07)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:'10px',padding:'10px 14px',marginBottom:'14px',animation:'shake 0.35s ease'}}>
                <AlertCircle size={15} color="#f87171" style={{flexShrink:0,marginTop:'1px'}} />
                <p style={{fontSize:'13px',color:'#f87171',margin:0,lineHeight:1.5}}>{error}</p>
              </div>
            )}

            {/* ── Google button (top CTA) */}
            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={loading || googleLoading || !GOOGLE_CLIENT_ID}
              style={{
                width:'100%', padding:'11px 16px',
                background: googleLoading ? '#e8eaed' : '#ffffff',
                border:'1px solid rgba(0,0,0,0.10)',
                borderRadius:'10px',
                color: !GOOGLE_CLIENT_ID ? 'rgba(0,0,0,0.25)' : '#1f2937',
                fontSize:'14px', fontWeight:500,
                display:'flex', alignItems:'center', justifyContent:'center', gap:'10px',
                cursor: loading || googleLoading || !GOOGLE_CLIENT_ID ? 'not-allowed' : 'pointer',
                transition:'all 0.2s ease',
                letterSpacing:'0.01em',
                marginBottom:'14px',
                boxShadow:'0 1px 4px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.06)',
              }}
              onMouseEnter={e => {
                if (!loading && !googleLoading && GOOGLE_CLIENT_ID) {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.borderColor = 'rgba(0,0,0,0.16)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.20), 0 0 0 1px rgba(0,0,0,0.08)';
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = googleLoading ? '#e8eaed' : '#ffffff';
                e.currentTarget.style.borderColor = 'rgba(0,0,0,0.10)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.06)';
              }}
              onMouseDown={e => { if (!loading && !googleLoading) e.currentTarget.style.transform = 'scale(0.99)'; }}
              onMouseUp={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
            >
              {googleLoading ? (
                <Loader2 size={17} className="animate-spin" style={{color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)',flexShrink:0}} />
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" style={{flexShrink:0}}>
                  <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115z"/>
                  <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987z"/>
                  <path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21z"/>
                  <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067z"/>
                </svg>
              )}
              <span>{googleLoading ? 'Signing in...' : 'Continue with Google'}</span>
            </button>

            {/* OR divider */}
            <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'14px'}}>
              <div style={{flex:1,height:'1px',background: isDark ? 'linear-gradient(to right, transparent, rgba(255,255,255,0.1))' : 'linear-gradient(to right, transparent, rgba(0,0,0,0.1))'}} />
              <span style={{fontSize:'11px',fontWeight:500,color: isDark ? 'rgba(255,255,255,0.25)' : '#94a3b8',letterSpacing:'0.08em',textTransform:'uppercase'}}>or with email</span>
              <div style={{flex:1,height:'1px',background: isDark ? 'linear-gradient(to left, transparent, rgba(255,255,255,0.1))' : 'linear-gradient(to left, transparent, rgba(0,0,0,0.1))'}} />
            </div>

                        <form onSubmit={handleSubmit} ref={formRef}>

              {/* Full Name */}
              <div style={{marginBottom:'10px'}}>
                <div style={{position:'relative'}}>
                  <User size={15} color={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)'} style={{position:'absolute',left:'13px',top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}} />
                  <input type="text" autoComplete="name" required
                         value={form.name} onChange={e => { setField('name', e.target.value); setFieldErrors(fe => ({...fe, name:''})); }}
                         placeholder="Full name"
                         style={{...inputStyle, padding:'11px 14px 11px 38px', ...(fieldErrors.name ? {border:'1px solid rgba(239,68,68,0.5)',boxShadow:'0 0 0 3px rgba(239,68,68,0.07)'} : {})}}
                         onFocus={focusIn} onBlur={focusOut} />
                </div>
                {fieldErrors.name && (
                  <div style={{display:'flex',alignItems:'center',gap:'4px',marginTop:'4px'}}>
                    <AlertCircle size={11} color="#ef4444" />
                    <span style={{fontSize:'11px',color:'#ef4444'}}>{fieldErrors.name}</span>
                  </div>
                )}
              </div>

              {/* Email */}
              <div style={{marginBottom:'10px'}}>
                <div style={{position:'relative'}}>
                  <Mail size={15} color={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)'} style={{position:'absolute',left:'13px',top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}} />
                  <input type="email" autoComplete="email" required
                         value={form.email} onChange={e => { setField('email', e.target.value); setFieldErrors(fe => ({...fe, email:''})); }}
                         placeholder="Email address"
                         style={{...inputStyle, padding:'11px 14px 11px 38px', ...(fieldErrors.email ? {border:'1px solid rgba(239,68,68,0.5)',boxShadow:'0 0 0 3px rgba(239,68,68,0.07)'} : {})}}
                         onFocus={focusIn} onBlur={focusOut} />
                </div>
                {fieldErrors.email && (
                  <div style={{display:'flex',alignItems:'center',gap:'4px',marginTop:'4px'}}>
                    <AlertCircle size={11} color="#ef4444" />
                    <span style={{fontSize:'11px',color:'#ef4444'}}>{fieldErrors.email}</span>
                  </div>
                )}
              </div>

              {/* Password */}
              <div style={{marginBottom:'10px'}}>
                <div style={{position:'relative'}}>
                  <Lock size={15} color={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)'} style={{position:'absolute',left:'13px',top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}} />
                  <input type={showPass ? 'text' : 'password'} autoComplete="new-password" required
                         value={form.password} onChange={e => { setField('password', e.target.value); setFieldErrors(fe => ({...fe, password:''})); }}
                         placeholder="Password (min. 8 characters)"
                         style={{...inputStyle, padding:'11px 40px 11px 38px', ...(fieldErrors.password ? {border:'1px solid rgba(239,68,68,0.5)',boxShadow:'0 0 0 3px rgba(239,68,68,0.07)'} : {})}}
                         onFocus={focusIn} onBlur={focusOut} />
                  <button type="button" tabIndex={-1} onClick={() => setShowPass(v => !v)}
                          style={{position:'absolute',right:'12px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)',padding:0,display:'flex'}}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {/* Strength meter */}
                {form.password && (
                  <div style={{marginTop:'7px'}}>
                    <div style={{display:'flex',gap:'3px',marginBottom:'4px'}}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{
                          height:'2px', flex:1, borderRadius:'2px',
                          transition:'all 0.3s ease',
                          background: i <= strength
                            ? (strength===1?'#ef4444':strength===2?'#f97316':strength===3?'#f59e0b':'#3b82f6')
                            : isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.1)',
                        }} />
                      ))}
                    </div>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <span style={{fontSize:'11px',fontWeight:500,color:strength===1?'#f87171':strength===2?'#fb923c':strength===3?'#fbbf24':'#34d399'}}>
                        {STRENGTH_META[strength].label} password
                      </span>
                      <div style={{display:'flex',gap:'8px'}}>
                        {[{ok:has8,label:'8+'},{ok:hasNum,label:'123'},{ok:hasCaps,label:'Aa'},{ok:hasSpec,label:'!@'}].map(({ok,label})=>(
                          <span key={label} style={{fontSize:'10px',color:ok?'#3b82f6': isDark ?'rgba(255,255,255,0.2)':'rgba(0,0,0,0.25)',fontWeight:500,transition:'color 0.2s'}}>{label}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {fieldErrors.password && (
                  <div style={{display:'flex',alignItems:'center',gap:'4px',marginTop:'4px'}}>
                    <AlertCircle size={11} color="#ef4444" />
                    <span style={{fontSize:'11px',color:'#ef4444'}}>{fieldErrors.password}</span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div style={{marginBottom:'12px'}}>
                <div style={{position:'relative'}}>
                  <Lock size={15} color={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)'} style={{position:'absolute',left:'13px',top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}} />
                  <input type={showConfirm ? 'text' : 'password'} autoComplete="new-password" required
                         value={form.confirm} onChange={e => { setField('confirm', e.target.value); setFieldErrors(fe => ({...fe, confirm:''})); }}
                         placeholder="Confirm password"
                         style={{...inputStyle, padding:'11px 60px 11px 38px', ...(fieldErrors.confirm ? {border:'1px solid rgba(239,68,68,0.5)',boxShadow:'0 0 0 3px rgba(239,68,68,0.07)'} : {})}}
                         onFocus={focusIn} onBlur={focusOut} />
                  <div style={{position:'absolute',right:'12px',top:'50%',transform:'translateY(-50%)',display:'flex',alignItems:'center',gap:'5px'}}>
                    {form.confirm && (
                      form.password === form.confirm
                        ? <CheckCircle2 size={14} color="#34d399" />
                        : <AlertCircle  size={14} color="#f87171" />
                    )}
                    <button type="button" tabIndex={-1} onClick={() => setShowConfirm(v => !v)}
                            style={{background:'none',border:'none',cursor:'pointer',color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)',padding:0,display:'flex'}}>
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                {fieldErrors.confirm && (
                  <div style={{display:'flex',alignItems:'center',gap:'4px',marginTop:'4px'}}>
                    <AlertCircle size={11} color="#ef4444" />
                    <span style={{fontSize:'11px',color:'#ef4444'}}>{fieldErrors.confirm}</span>
                  </div>
                )}
              </div>

              {/* Consent checkboxes */}
              <div style={{marginBottom:'14px',display:'flex',flexDirection:'column',gap:'7px',padding:'10px 12px',background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.07)',borderRadius:'9px'}}>
                <label style={{display:'flex',alignItems:'flex-start',gap:'10px',cursor:'pointer',userSelect:'none'}}>
                  <input type="checkbox" className="sp-checkbox"
                         checked={consent.terms}
                         onChange={e => setConsent(c => ({ ...c, terms: e.target.checked }))} />
                  <span style={{fontSize:'12px',color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b',lineHeight:1.5}}>
                    I agree to the{' '}
                    <a href="/terms" target="_blank" rel="noopener noreferrer"
                     style={{color:'#3b82f6',textDecoration:'none'}}
                       onMouseEnter={e => e.currentTarget.style.textDecoration='underline'}
                       onMouseLeave={e => e.currentTarget.style.textDecoration='none'}
                       onClick={e => e.stopPropagation()}>
                      Terms of Service
                    </a>
                    {' '}— Zynth is a tool, not a financial advisor.
                  </span>
                </label>
                <div style={{height:'1px',background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}} />
                <label style={{display:'flex',alignItems:'flex-start',gap:'10px',cursor:'pointer',userSelect:'none'}}>
                  <input type="checkbox" className="sp-checkbox"
                         checked={consent.risk}
                         onChange={e => setConsent(c => ({ ...c, risk: e.target.checked }))} />
                  <span style={{fontSize:'12px',color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b',lineHeight:1.5}}>
                    AI analysis may contain errors. I trade at my own risk.
                  </span>
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit" disabled={loading}
                style={{
                  width:'100%',
                  padding:'12px',
                  background: loading ? 'rgba(59,130,246,0.5)' : 'linear-gradient(135deg, #1d4ed8 0%, #0284c7 100%)',
                  border:'none', borderRadius:'10px',
                  color:'#fff', fontSize:'14px', fontWeight:600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition:'all 0.2s ease',
                  letterSpacing:'0.01em',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
                  boxShadow: loading ? 'none' : '0 4px 15px rgba(59,130,246,0.25)',
                }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 8px 25px rgba(59,130,246,0.4)'; } }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=loading?'none':'0 4px 15px rgba(59,130,246,0.25)'; }}
                onMouseDown={e => { e.currentTarget.style.transform='translateY(0) scale(0.99)'; }}
                onMouseUp={e => { e.currentTarget.style.transform='translateY(-1px) scale(1)'; }}
              >
                {loading
                  ? <><Loader2 size={15} className="animate-spin" /><span>Creating account...</span></>
                  : 'Create account →'}
              </button>
            </form>

            {/* Trust signals */}
            <div style={{marginTop:'12px',textAlign:'center',lineHeight:1.8}}>
              <span style={{fontSize:'11px',color: isDark ? 'rgba(255,255,255,0.28)' : '#94a3b8',letterSpacing:'0.01em'}}>🔒 Secure signup · 256-bit encryption</span>
              <br />
              <span style={{fontSize:'11px',color: isDark ? 'rgba(255,255,255,0.2)' : '#94a3b8',letterSpacing:'0.01em'}}>Built for serious traders</span>
            </div>

              </>
            )}
          </div>
        </div>
    </div>
  );
}
