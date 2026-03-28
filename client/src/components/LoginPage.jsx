import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config/api';
import { getPublicStats } from '../utils/publicStats';
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
    <div style={{ minHeight: '100vh', background: isDark ? '#020617' : '#F8FAFC', position: 'relative', overflowX: 'hidden', overflowY: 'auto' }}>
      <style>{`
        @keyframes authBlobFloat { 0%,100%{transform:scale(1) translateY(0px)} 50%{transform:scale(1.05) translateY(-16px)} }
        @keyframes authCardIn { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        @keyframes formShake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} }
      `}</style>

      {/* Background radial gradients – same as landing */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0,
        backgroundImage: isDark
          ? 'radial-gradient(ellipse 90% 55% at 50% -5%, rgba(59,130,246,0.14) 0%, transparent 60%), radial-gradient(ellipse 55% 45% at 85% 90%, rgba(99,102,241,0.09) 0%, transparent 60%)'
          : 'radial-gradient(ellipse 90% 55% at 50% -5%, rgba(99,102,241,0.09) 0%, transparent 60%), radial-gradient(ellipse 55% 45% at 85% 90%, rgba(168,85,247,0.06) 0%, transparent 60%)',
      }} />
      <div style={{ position:'fixed', top:'-120px', left:'-120px', width:'520px', height:'520px', pointerEvents:'none', zIndex:0,
        background: isDark ? 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)',
        filter:'blur(70px)', animation:'authBlobFloat 9s ease-in-out infinite',
      }} />
      <div style={{ position:'fixed', bottom:'-80px', right:'-80px', width:'420px', height:'420px', pointerEvents:'none', zIndex:0,
        background: isDark ? 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(168,85,247,0.05) 0%, transparent 70%)',
        filter:'blur(60px)', animation:'authBlobFloat 11s ease-in-out infinite 2s',
      }} />

      {/* Top nav */}
      <div style={{ position:'fixed', top:0, left:0, right:0, zIndex:20, height:'60px',
        display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px',
        background: isDark ? 'rgba(2,6,23,0.75)' : 'rgba(248,250,252,0.85)',
        backdropFilter:'blur(14px)', WebkitBackdropFilter:'blur(14px)',
        borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
      }}>
        <div>
          {onBack && (
            <button onClick={onBack} style={{ display:'flex', alignItems:'center', gap:'6px',
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
              border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
              borderRadius:'8px', padding:'6px 12px', fontSize:'13px',
              color: isDark ? 'rgba(255,255,255,0.55)' : '#64748b', cursor:'pointer', transition:'all 0.15s ease' }}
              onMouseEnter={e => { e.currentTarget.style.color=isDark?'#fff':'#0f172a'; e.currentTarget.style.background=isDark?'rgba(255,255,255,0.09)':'rgba(0,0,0,0.07)'; }}
              onMouseLeave={e => { e.currentTarget.style.color=isDark?'rgba(255,255,255,0.55)':'#64748b'; e.currentTarget.style.background=isDark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)'; }}>
              <ChevronLeft size={14} /> Back
            </button>
          )}
        </div>
        <div style={{ position:'absolute', left:'50%', transform:'translateX(-50%)', display:'flex', alignItems:'center', gap:'8px' }}>
          <BrandMark size={28} />
          <span style={{ fontSize:'17px', fontWeight:700, color: isDark?'#fff':'#0f172a', letterSpacing:'-0.01em' }}>Zynth</span>
        </div>
        <button onClick={onSwitchToSignup} style={{ fontSize:'13px', fontWeight:500, background:'none', border:'none', cursor:'pointer',
          color: isDark?'rgba(255,255,255,0.55)':'#64748b', padding:'6px 2px', transition:'color 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.color='#3b82f6'; }}
          onMouseLeave={e => { e.currentTarget.style.color=isDark?'rgba(255,255,255,0.55)':'#64748b'; }}>
          Sign up →
        </button>
      </div>

      {/* Centered card */}
      <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:'80px 20px 40px', boxSizing:'border-box' }}>
        <div ref={formRef} style={{
          width:'100%', maxWidth:'420px',
          background: isDark ? 'rgba(11,18,32,0.82)' : 'rgba(255,255,255,0.93)',
          backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
          border: isDark ? '1px solid rgba(255,255,255,0.09)' : '1px solid rgba(0,0,0,0.07)',
          borderRadius:'24px', padding:'36px 32px 32px',
          boxShadow: isDark
            ? '0 0 0 1px rgba(59,130,246,0.07), 0 32px 80px rgba(0,0,0,0.75), 0 0 60px rgba(59,130,246,0.08)'
            : '0 0 0 1px rgba(0,0,0,0.04), 0 24px 64px rgba(15,23,42,0.14), 0 8px 24px rgba(15,23,42,0.06)',
          animation:'authCardIn 0.4s cubic-bezier(0.22,1,0.36,1) both',
        }}>
          <div style={{ marginBottom:'22px' }}>
            <h2 style={{ fontSize:'26px', fontWeight:800, letterSpacing:'-0.025em', color: isDark?'#fff':'#0f172a', margin:'0 0 5px' }}>Welcome back.</h2>
            <p style={{ fontSize:'14px', color: isDark?'rgba(255,255,255,0.45)':'#64748b', margin:0 }}>
              Your edge is waiting.{' '}
              <button onClick={onSwitchToSignup} style={{ color:'#3b82f6', background:'none', border:'none', cursor:'pointer', fontSize:'14px', padding:0, fontWeight:500 }}
                onMouseEnter={e => e.currentTarget.style.textDecoration='underline'}
                onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>New here?</button>
            </p>
          </div>

          {error && (isGoogleOnlyError ? (
            <div style={{ display:'flex', alignItems:'flex-start', gap:'10px', background:'rgba(66,133,244,0.08)', border:'1px solid rgba(66,133,244,0.28)', borderRadius:'12px', padding:'10px 14px', marginBottom:'16px' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" style={{ flexShrink:0, marginTop:'1px' }}>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <p style={{ fontSize:'13px', color:'#93bbfc', margin:0, lineHeight:1.5 }}>{error}</p>
            </div>
          ) : <ErrorBar message={error} className="mb-4" />)}

          <button type="button" onClick={handleGoogleClick} disabled={loading||googleLoading||!GOOGLE_CLIENT_ID}
            style={{ width:'100%', padding:'11px 16px', background:googleLoading?'#e8eaed':'#ffffff',
              border:'1px solid rgba(0,0,0,0.10)', borderRadius:'12px',
              color:!GOOGLE_CLIENT_ID?'rgba(0,0,0,0.25)':'#1f2937', fontSize:'14px', fontWeight:500,
              display:'flex', alignItems:'center', justifyContent:'center', gap:'10px',
              cursor:loading||googleLoading||!GOOGLE_CLIENT_ID?'not-allowed':'pointer',
              transition:'all 0.2s ease', marginBottom:'16px',
              boxShadow:'0 1px 4px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.05)' }}
            onMouseEnter={e => { if (!loading&&!googleLoading&&GOOGLE_CLIENT_ID){ e.currentTarget.style.background='#f8fafc'; e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.15)'; } }}
            onMouseLeave={e => { e.currentTarget.style.background=googleLoading?'#e8eaed':'#ffffff'; e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.05)'; }}>
            {googleLoading ? <Loader2 size={17} className="animate-spin" style={{ color:'rgba(0,0,0,0.45)', flexShrink:0 }} /> : (
              <svg width="17" height="17" viewBox="0 0 24 24" style={{ flexShrink:0 }}>
                <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115z"/>
                <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987z"/>
                <path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21z"/>
                <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067z"/>
              </svg>
            )}
            <span>{googleLoading ? 'Signing in...' : 'Continue with Google'}</span>
          </button>

          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px' }}>
            <div style={{ flex:1, height:'1px', background: isDark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.08)' }} />
            <span style={{ fontSize:'11px', fontWeight:500, color: isDark?'rgba(255,255,255,0.3)':'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em' }}>or with email</span>
            <div style={{ flex:1, height:'1px', background: isDark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.08)' }} />
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:'12px' }}>
              <div style={{ position:'relative' }}>
                <Mail size={15} color={isDark?'rgba(255,255,255,0.25)':'rgba(0,0,0,0.3)'} style={{ position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                <input type="email" autoComplete="email" value={email} required
                  onChange={e => { setEmail(e.target.value); setFieldErrors(fe => ({...fe, email:''})); }}
                  placeholder="Email address"
                  style={{ width:'100%', boxSizing:'border-box',
                    background: isDark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.03)',
                    border: fieldErrors.email ? '1.5px solid rgba(239,68,68,0.6)' : isDark?'1px solid rgba(255,255,255,0.1)':'1px solid rgba(0,0,0,0.1)',
                    borderRadius:'12px', padding:'12px 14px 12px 40px',
                    color: isDark?'#fff':'#0f172a', fontSize:'14px', outline:'none', transition:'all 0.2s ease' }}
                  onFocus={e => { e.target.style.borderColor='rgba(59,130,246,0.6)'; e.target.style.boxShadow='0 0 0 3px rgba(59,130,246,0.12)'; e.target.style.background=isDark?'rgba(255,255,255,0.07)':'rgba(59,130,246,0.02)'; }}
                  onBlur={e => { if (!fieldErrors.email) { e.target.style.borderColor=isDark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.1)'; e.target.style.boxShadow='none'; e.target.style.background=isDark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.03)'; } }}
                />
              </div>
              {fieldErrors.email?.trim() && <div style={{ display:'flex', alignItems:'center', gap:'4px', marginTop:'4px' }}><AlertCircle size={11} color="#ef4444"/><span style={{ fontSize:'11px', color:'#ef4444' }}>{fieldErrors.email}</span></div>}
            </div>

            <div style={{ marginBottom:'18px' }}>
              <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'5px' }}>
                <button type="button" onClick={onForgotPassword}
                  style={{ fontSize:'12px', color:'#3b82f6', background:'none', border:'none', cursor:'pointer', padding:0 }}
                  onMouseEnter={e => e.currentTarget.style.textDecoration='underline'}
                  onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>Forgot password?</button>
              </div>
              <div style={{ position:'relative' }}>
                <Lock size={15} color={isDark?'rgba(255,255,255,0.25)':'rgba(0,0,0,0.3)'} style={{ position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                <input type={showPass?'text':'password'} autoComplete="current-password" value={password} required
                  onChange={e => { setPassword(e.target.value); setFieldErrors(fe => ({...fe, password:''})); }}
                  placeholder="Password"
                  style={{ width:'100%', boxSizing:'border-box',
                    background: isDark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.03)',
                    border: fieldErrors.password?'1.5px solid rgba(239,68,68,0.6)':isDark?'1px solid rgba(255,255,255,0.1)':'1px solid rgba(0,0,0,0.1)',
                    borderRadius:'12px', padding:'12px 40px 12px 40px',
                    color: isDark?'#fff':'#0f172a', fontSize:'14px', outline:'none', transition:'all 0.2s ease' }}
                  onFocus={e => { e.target.style.borderColor='rgba(59,130,246,0.6)'; e.target.style.boxShadow='0 0 0 3px rgba(59,130,246,0.12)'; e.target.style.background=isDark?'rgba(255,255,255,0.07)':'rgba(59,130,246,0.02)'; }}
                  onBlur={e => { if (!fieldErrors.password) { e.target.style.borderColor=isDark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.1)'; e.target.style.boxShadow='none'; e.target.style.background=isDark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.03)'; } }}
                />
                <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}
                  style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:isDark?'rgba(255,255,255,0.3)':'rgba(0,0,0,0.35)', padding:0, display:'flex' }}>
                  {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
              {fieldErrors.password && <div style={{ display:'flex', alignItems:'center', gap:'4px', marginTop:'4px' }}><AlertCircle size={11} color="#ef4444"/><span style={{ fontSize:'11px', color:'#ef4444' }}>{fieldErrors.password}</span></div>}
            </div>

            <button type="submit" disabled={loading}
              style={{ width:'100%', padding:'13px',
                background: loading?'rgba(59,130,246,0.5)':'linear-gradient(135deg, #1d4ed8 0%, #0284c7 100%)',
                border:'none', borderRadius:'12px', color:'#fff', fontSize:'14px', fontWeight:700,
                cursor: loading?'not-allowed':'pointer', transition:'all 0.2s ease',
                display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
                boxShadow: loading?'none':'0 4px 20px rgba(29,78,216,0.4)', letterSpacing:'0.01em' }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 10px 32px rgba(29,78,216,0.52)'; } }}
              onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=loading?'none':'0 4px 20px rgba(29,78,216,0.4)'; }}
              onMouseDown={e => { if (!loading) e.currentTarget.style.transform='scale(0.99)'; }}
              onMouseUp={e => { if (!loading) e.currentTarget.style.transform='translateY(-2px)'; }}>
              {loading ? <><Loader2 size={15} className="animate-spin"/><span>Signing in...</span></> : <>Sign In <ArrowRight size={16}/></>}
            </button>
          </form>

          <p style={{ marginTop:'20px', textAlign:'center', fontSize:'12px', color: isDark?'rgba(255,255,255,0.25)':'#94a3b8' }}>
            🔒 256-bit SSL · Bank-grade encryption
          </p>
          <p style={{ marginTop:'12px', textAlign:'center', fontSize:'13px', color: isDark?'rgba(255,255,255,0.4)':'#64748b' }}>
            Don't have an account?{' '}
            <button onClick={onSwitchToSignup} style={{ color:'#3b82f6', background:'none', border:'none', cursor:'pointer', fontSize:'13px', padding:0, fontWeight:500 }}
              onMouseEnter={e => e.currentTarget.style.textDecoration='underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>
              Create free account →
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}