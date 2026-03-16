import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config/api';
import { getPublicStats } from '../utils/publicStats';
import { Eye, EyeOff, TrendingUp, TrendingDown, AlertCircle, Loader2, Mail, Lock, ArrowRight, ArrowLeft, ChevronLeft, Shield, Zap, BarChart2, Activity, BookOpen, Brain, Bot, Flame } from 'lucide-react';

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
  const initializedRef            = useRef(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const formRef                   = useRef(null);
  const [spotsLeft, setSpotsLeft] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
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
    <div style={{display:'flex',height:'100vh',width:'100vw',overflow:'hidden',background:'#000000',position:'relative'}}>

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
        @keyframes formAppear {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0);    }
        }
        @keyframes shake {
          0%,100% { transform: translateX(0);  }
          25%     { transform: translateX(-8px); }
          75%     { transform: translateX(8px);  }
        }
        @keyframes formShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
        .field-input:focus {
          border-color: #10b981 !important;
          box-shadow: 0 0 0 3px rgba(16,185,129,0.1) !important;
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

      {/* ── LEFT: Brand panel */}
      <div style={{display: isMobile ? 'none' : 'flex', flex:1, flexDirection:'column', position:'relative', overflow:'hidden', minHeight:'100vh', background:'#000000', animation:'panelFadeIn 0.6s ease'}}>

        {/* Orb 1 – bottom left */}
        <div className="pointer-events-none" style={{
          position:'absolute', width:'500px', height:'500px',
          background:'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)',
          bottom:'-150px', left:'-150px',
          filter:'blur(60px)',
          animation:'orbPulse 4s ease infinite',
        }} />
        {/* Orb 2 – top right */}
        <div className="pointer-events-none" style={{
          position:'absolute', width:'350px', height:'350px',
          background:'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)',
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
                background:'rgba(255,255,255,0.05)',
                border:'1px solid rgba(255,255,255,0.1)',
                borderRadius:'8px',
                padding:'7px 14px',
                fontSize:'13px',
                color:'rgba(255,255,255,0.5)',
                display:'flex', alignItems:'center', gap:'6px',
                cursor:'pointer',
                transition:'all 0.2s ease',
                flexShrink:0,
              }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.08)'; e.currentTarget.style.color='rgba(255,255,255,0.75)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.18)'; }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.05)'; e.currentTarget.style.color='rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'; }}
            >
              <ChevronLeft size={14} />
              Back
            </button>
          )}
          <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
            <img src="/logo.png" alt="Zynth" style={{height:'30px',width:'auto',objectFit:'contain'}} />
            <div>
              <p style={{color:'#fff',fontSize:'18px',fontWeight:700,lineHeight:1}}>Zynth</p>
              <p style={{color:'rgba(255,255,255,0.4)',fontSize:'12px',letterSpacing:'0.05em',marginTop:'3px'}}>
                Intelligence Behind Every Trade
              </p>
            </div>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center" style={{padding:'0 48px 96px'}}>
          <h1 style={{fontSize:'52px',fontWeight:800,letterSpacing:'-0.03em',lineHeight:1.1,marginBottom:'16px'}}>
            <span style={{color:'#ffffff'}}>Welcome Back,<br /></span>
            <span style={{
              background:'linear-gradient(135deg, #ffffff 30%, #10b981 100%)',
              WebkitBackgroundClip:'text',
              WebkitTextFillColor:'transparent',
              backgroundClip:'text',
            }}>Trader.</span>
          </h1>
          <p style={{fontSize:'16px',color:'rgba(255,255,255,0.45)',lineHeight:1.7,marginBottom:'36px',maxWidth:'340px'}}>
            Your journal, AI insights and live markets are waiting for you.
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
                  background:'rgba(16,185,129,0.1)',
                  border:'1px solid rgba(16,185,129,0.2)',
                  borderRadius:'10px',
                  display:'flex',alignItems:'center',justifyContent:'center',
                }}>
                  <Icon size={18} color="#10b981" />
                </div>
                <div>
                  <p style={{color:'#fff',fontSize:'14px',fontWeight:600,marginBottom:'2px'}}>{title}</p>
                  <p style={{color:'rgba(255,255,255,0.4)',fontSize:'13px',lineHeight:1.5}}>{desc}</p>
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
                background:'rgba(255,255,255,0.04)',
                border:'1px solid rgba(255,255,255,0.08)',
                borderRadius:'20px',
                padding:'5px 12px',
                fontSize:'11px',
                color:'rgba(255,255,255,0.4)',
                display:'flex',gap:'5px',alignItems:'center',
              }}>
                <Icon size={11} />{label}
              </span>
            ))}
          </div>
        </div>
      </div>

{/* ── RIGHT: Form panel ──────────────────────────────────────────── */}
      <div style={{
             width: isMobile ? '100vw' : '480px',
             minWidth: isMobile ? 'unset' : '480px',
             flexShrink: 0,
             display:'flex', flexDirection:'column',
             alignItems:'center',
             overflowY:'auto',
             background: isMobile ? '#000000' : '#0d0d0d',
             borderLeft: isMobile ? 'none' : '1px solid rgba(255,255,255,0.06)',
             padding: isMobile ? '32px 24px' : '48px',
             minHeight:'100vh',
             boxSizing:'border-box',
           }}>

        <div style={{width:'100%', maxWidth:'380px', animation:'slideInRight 0.4s ease both', marginTop:'auto', marginBottom:'auto'}}>

          {/* Mobile back + logo */}
          {isMobile && onBack && (
            <button
              onClick={onBack}
              style={{
                background:'rgba(255,255,255,0.05)',
                border:'1px solid rgba(255,255,255,0.1)',
                borderRadius:'8px',
                padding:'7px 14px',
                fontSize:'13px',
                color:'rgba(255,255,255,0.5)',
                display:'flex', alignItems:'center', gap:'6px',
                cursor:'pointer',
                transition:'all 0.2s ease',
                marginBottom:'20px',
                alignSelf:'flex-start',
              }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.08)'; e.currentTarget.style.color='rgba(255,255,255,0.75)'; }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.05)'; e.currentTarget.style.color='rgba(255,255,255,0.5)'; }}
            >
              <ChevronLeft size={14} />
              Back
            </button>
          )}
          {isMobile && (
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',marginBottom:'28px'}}>
              <div style={{width:'28px',height:'28px',background:'#10b981',borderRadius:'7px',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <span style={{color:'#fff',fontWeight:'bold',fontSize:'14px'}}>Z</span>
              </div>
              <span style={{color:'#fff',fontWeight:'bold',fontSize:'17px'}}>Zynth</span>
            </div>
          )}

          {/* Founding banner */}
          {spotsLeft != null && spotsLeft > 0 && (
            <div style={{
              background:'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.04))',
              border:'1px solid rgba(16,185,129,0.2)',
              borderRadius:'8px',
              padding:'10px 14px',
              marginBottom:'28px',
              fontSize:'13px',
              color:'#10b981',
              textAlign:'center',
            }}>
              <Flame size={12} style={{display:'inline-block',verticalAlign:'middle',marginRight:'4px'}} />{spotsLeft} founding spots · $1.99/mo
            </div>
          )}

          {/* Header */}
          <h2 style={{fontSize: isMobile ? '22px' : '24px',fontWeight:700,color:'#fff',letterSpacing:'-0.02em',margin:0}}>Sign in</h2>
          <p style={{fontSize:'13px',marginTop:'3px',marginBottom:'14px',color:'rgba(255,255,255,0.4)'}}>
            New here?{' '}
            <button onClick={onSwitchToSignup}
                    style={{color:'#10b981',background:'none',border:'none',cursor:'pointer',fontSize:'13px',padding:0}}
                    onMouseEnter={e => e.currentTarget.style.textDecoration='underline'}
                    onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>
              Create a free account
            </button>
          </p>

          {/* Error */}
          {error && (
            isGoogleOnlyError ? (
              <div style={{display:'flex',alignItems:'flex-start',gap:'10px',background:'rgba(66,133,244,0.08)',border:'1px solid rgba(66,133,244,0.28)',borderRadius:'10px',padding:'10px 14px',marginBottom:'14px',animation:'shake 0.35s ease'}}>
                <svg width="15" height="15" viewBox="0 0 24 24" style={{flexShrink:0,marginTop:'1px'}}>
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <p style={{fontSize:'13px',color:'#93bbfc',margin:0,lineHeight:1.5}}>{error}</p>
              </div>
            ) : (
              <div style={{display:'flex',alignItems:'flex-start',gap:'10px',background:'rgba(239,68,68,0.07)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:'10px',padding:'10px 14px',marginBottom:'14px',animation:'shake 0.35s ease'}}>
                <AlertCircle size={15} color="#f87171" style={{flexShrink:0,marginTop:'1px'}} />
                <p style={{fontSize:'13px',color:'#f87171',margin:0,lineHeight:1.5}}>{error}</p>
              </div>
            )
          )}

          {/* Google button (top) */}
          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={loading || googleLoading || !GOOGLE_CLIENT_ID}
            style={{
              width:'100%', padding:'11px 16px',
              background: googleLoading ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.04)',
              border:'1px solid rgba(255,255,255,0.13)',
              borderRadius:'10px',
              color: !GOOGLE_CLIENT_ID ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.9)',
              fontSize:'14px', fontWeight:500,
              display:'flex', alignItems:'center', justifyContent:'center', gap:'10px',
              cursor: loading || googleLoading || !GOOGLE_CLIENT_ID ? 'not-allowed' : 'pointer',
              transition:'all 0.2s ease',
              letterSpacing:'0.01em',
              marginBottom:'14px',
              boxShadow:'inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
            onMouseEnter={e => {
              if (!loading && !googleLoading && GOOGLE_CLIENT_ID) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)';
                e.currentTarget.style.color = '#fff';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = googleLoading ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.04)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.13)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.05)';
              e.currentTarget.style.color = !GOOGLE_CLIENT_ID ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.9)';
            }}
            onMouseDown={e => { if (!loading && !googleLoading) e.currentTarget.style.transform = 'scale(0.99)'; }}
            onMouseUp={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
          >
            {googleLoading ? (
              <Loader2 size={17} className="animate-spin" style={{color:'rgba(255,255,255,0.55)',flexShrink:0}} />
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
            <div style={{flex:1,height:'1px',background:'linear-gradient(to right, transparent, rgba(255,255,255,0.1))'}} />
            <span style={{fontSize:'11px',fontWeight:500,color:'rgba(255,255,255,0.25)',letterSpacing:'0.08em',textTransform:'uppercase'}}>or with email</span>
            <div style={{flex:1,height:'1px',background:'linear-gradient(to left, transparent, rgba(255,255,255,0.1))'}} />
          </div>

          <form onSubmit={handleSubmit} ref={formRef}>

            {/* Email */}
            <div style={{marginBottom:'10px'}}>
              <div style={{position:'relative'}}>
                <Mail size={15} color="rgba(255,255,255,0.2)" style={{position:'absolute',left:'13px',top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}} />
                <input
                  type="email" autoComplete="email" value={email} required
                  onChange={e => { setEmail(e.target.value); setFieldErrors(fe => ({...fe, email:''})); }}
                  placeholder="Email address"
                  style={{
                    width:'100%', boxSizing:'border-box',
                    background:'rgba(255,255,255,0.04)',
                    border: fieldErrors.email ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)',
                    boxShadow: fieldErrors.email ? '0 0 0 3px rgba(239,68,68,0.07)' : 'none',
                    borderRadius:'10px',
                    padding:'11px 14px 11px 38px',
                    color:'#fff', fontSize:'14px',
                    transition:'all 0.2s ease', outline:'none',
                  }}
                  onFocus={e => { e.target.style.background='rgba(255,255,255,0.06)'; e.target.style.borderColor='rgba(16,185,129,0.45)'; e.target.style.boxShadow='0 0 0 3px rgba(16,185,129,0.07)'; }}
                  onBlur={e => { e.target.style.background='rgba(255,255,255,0.04)'; if (fieldErrors.email) { e.target.style.borderColor='rgba(239,68,68,0.5)'; e.target.style.boxShadow='0 0 0 3px rgba(239,68,68,0.07)'; } else { e.target.style.borderColor='rgba(255,255,255,0.1)'; e.target.style.boxShadow='none'; } }}
                />
              </div>
              {fieldErrors.email && fieldErrors.email.trim() && (
                <div style={{display:'flex',alignItems:'center',gap:'4px',marginTop:'4px'}}>
                  <AlertCircle size={11} color="#ef4444" />
                  <span style={{fontSize:'11px',color:'#ef4444'}}>{fieldErrors.email}</span>
                </div>
              )}
            </div>

            {/* Password */}
            <div style={{marginBottom:'14px'}}>
              <div style={{display:'flex',justifyContent:'flex-end',marginBottom:'5px'}}>
                <button type="button" onClick={onForgotPassword}
                        style={{fontSize:'12px',color:'#10b981',background:'none',border:'none',cursor:'pointer',padding:0}}
                        onMouseEnter={e => e.currentTarget.style.textDecoration='underline'}
                        onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>
                  Forgot password?
                </button>
              </div>
              <div style={{position:'relative'}}>
                <Lock size={15} color="rgba(255,255,255,0.2)" style={{position:'absolute',left:'13px',top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}} />
                <input
                  type={showPass ? 'text' : 'password'} autoComplete="current-password" value={password} required
                  onChange={e => { setPassword(e.target.value); setFieldErrors(fe => ({...fe, password:''})); }}
                  placeholder="Password"
                  style={{
                    width:'100%', boxSizing:'border-box',
                    background:'rgba(255,255,255,0.04)',
                    border: fieldErrors.password ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)',
                    boxShadow: fieldErrors.password ? '0 0 0 3px rgba(239,68,68,0.07)' : 'none',
                    borderRadius:'10px',
                    padding:'11px 40px 11px 38px',
                    color:'#fff', fontSize:'14px',
                    transition:'all 0.2s ease', outline:'none',
                  }}
                  onFocus={e => { e.target.style.background='rgba(255,255,255,0.06)'; e.target.style.borderColor='rgba(16,185,129,0.45)'; e.target.style.boxShadow='0 0 0 3px rgba(16,185,129,0.07)'; }}
                  onBlur={e => { e.target.style.background='rgba(255,255,255,0.04)'; if (fieldErrors.password) { e.target.style.borderColor='rgba(239,68,68,0.5)'; e.target.style.boxShadow='0 0 0 3px rgba(239,68,68,0.07)'; } else { e.target.style.borderColor='rgba(255,255,255,0.1)'; e.target.style.boxShadow='none'; } }}
                />
                <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}
                        style={{position:'absolute',right:'12px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.3)',padding:0,display:'flex'}}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {fieldErrors.password && (
                <div style={{display:'flex',alignItems:'center',gap:'4px',marginTop:'4px'}}>
                  <AlertCircle size={11} color="#ef4444" />
                  <span style={{fontSize:'11px',color:'#ef4444'}}>{fieldErrors.password}</span>
                </div>
              )}
            </div>

            {/* Sign in button */}
            <button
              type="submit" disabled={loading}
              style={{
                width:'100%',
                padding:'12px',
                background: loading ? 'rgba(16,185,129,0.5)' : 'linear-gradient(135deg, #10b981 0%, #0d9a6e 100%)',
                border:'none', borderRadius:'10px',
                color:'#fff', fontSize:'14px', fontWeight:600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition:'all 0.2s ease',
                letterSpacing:'0.01em',
                display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
                boxShadow: loading ? 'none' : '0 4px 15px rgba(16,185,129,0.2)',
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 8px 25px rgba(16,185,129,0.3)'; } }}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=loading?'none':'0 4px 15px rgba(16,185,129,0.2)'; }}
              onMouseDown={e => { e.currentTarget.style.transform='translateY(0) scale(0.99)'; }}
              onMouseUp={e => { e.currentTarget.style.transform='translateY(-1px) scale(1)'; }}
            >
              {loading ? <><Loader2 size={15} className="animate-spin" /><span>Signing in...</span></> : 'Sign In'}
            </button>
          </form>

          {/* Bottom link */}
          <p style={{marginTop:'18px',textAlign:'center',fontSize:'13px',color:'rgba(255,255,255,0.35)'}}>
            Don't have an account?{' '}
            <button onClick={onSwitchToSignup}
                    style={{color:'#10b981',background:'none',border:'none',cursor:'pointer',fontSize:'13px',padding:0,fontWeight:500}}
                    onMouseEnter={e => e.currentTarget.style.textDecoration='underline'}
                    onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>
              Sign up free
            </button>
          </p>

        </div>
      </div>
    </div>
  );
}
