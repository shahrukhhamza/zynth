import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config/api';
import {
  Eye, EyeOff, TrendingUp, AlertCircle, CheckCircle, CheckCircle2,
  Loader2, User, Mail, Lock, ArrowRight, ArrowLeft, ChevronLeft,
  BookOpen, Brain, Check, Shield, Zap, Bot, Flame,
} from 'lucide-react';

export default function SignupPage({ onSwitchToLogin, onBack }) {
  const { register } = useAuth();
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/admin/stats`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.totalUsers != null) setSpotsLeft(Math.max(0, 100 - d.totalUsers)); })
      .catch(() => {});
  }, []);

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
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px', color: '#fff', width: '100%', fontSize: '15px',
    outline: 'none', transition: 'all 0.2s ease',
  };
  const focusIn  = e => { e.target.style.background = 'rgba(255,255,255,0.06)'; e.target.style.borderColor = 'rgba(16,185,129,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.08)'; };
  const focusOut = e => { e.target.style.background = 'rgba(255,255,255,0.04)'; e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; };

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
    <div style={{display:'flex',height:'100vh',width:'100vw',overflow:'hidden',background:'#000000',position:'relative'}}>

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
          background: #10b981;
          border-color: #10b981;
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
              <span style={{color:'#ffffff'}}>Start Trading<br /></span>
              <span style={{
                background:'linear-gradient(135deg, #ffffff 30%, #10b981 100%)',
                WebkitBackgroundClip:'text',
                WebkitTextFillColor:'transparent',
                backgroundClip:'text',
              }}>Smarter.</span>
            </h1>
            <p style={{fontSize:'16px',color:'rgba(255,255,255,0.45)',lineHeight:1.7,marginBottom:'36px',maxWidth:'340px'}}>
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

        {/* â”€â”€ RIGHT: Signup form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div style={{
               width: isMobile ? '100vw' : '480px',
               minWidth: isMobile ? 'unset' : '480px',
               flexShrink: 0,
               display:'flex', flexDirection:'column',
               alignItems:'center',
               overflowY:'auto',
               background: isMobile ? '#000000' : '#0d0d0d',
               borderLeft: isMobile ? 'none' : '1px solid rgba(255,255,255,0.06)',
               padding: isMobile ? '24px 20px' : '28px 48px',
               minHeight:'100vh',
               boxSizing:'border-box',
             }}>

          <div style={{width:'100%', maxWidth:'380px', animation:'slideInRight 0.4s ease both', marginTop:'auto', marginBottom:'auto'}}>

            {success ? (
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',gap:'16px',padding:'48px 0'}}>
                <div style={{
                  width:'64px', height:'64px',
                  background:'rgba(16,185,129,0.1)',
                  border:'2px solid #10b981',
                  borderRadius:'50%',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  animation:'checkIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
                }}>
                  <CheckCircle size={32} color="#10b981" />
                </div>
                <div>
                  <p style={{color:'#fff',fontWeight:700,fontSize:'20px',margin:0}}>Account created!</p>
                  <p style={{color:'rgba(255,255,255,0.5)',fontSize:'14px',margin:'6px 0 0'}}>Setting up your workspace...</p>
                </div>
                <Loader2 size={20} color="rgba(255,255,255,0.3)" className="animate-spin" />
              </div>
            ) : (
              <>
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
                marginBottom:'14px',
                fontSize:'13px',
                color:'#10b981',
                textAlign:'center',
              }}>
                <Flame size={12} style={{display:'inline-block',verticalAlign:'middle',marginRight:'4px'}} />{spotsLeft} founding spots · $1.99/mo
              </div>
            )}

            {/* Header */}
            <h2 style={{fontSize: isMobile ? '22px' : '26px',fontWeight:700,color:'#fff',letterSpacing:'-0.02em',margin:0}}>Create account</h2>
            <p style={{fontSize:'14px',marginTop:'4px',marginBottom:'16px',color:'rgba(255,255,255,0.4)'}}>
              Already have one?{' '}
              <button onClick={onSwitchToLogin}
                      style={{color:'#10b981',background:'none',border:'none',cursor:'pointer',fontSize:'14px',padding:0}}
                      onMouseEnter={e => e.currentTarget.style.textDecoration='underline'}
                      onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>
                Sign in
              </button>
            </p>

            {/* Error */}
            {error && (
              <div style={{display:'flex',alignItems:'flex-start',gap:'10px',background:'rgba(239,68,68,0.07)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:'10px',padding:'12px 14px',marginBottom:'20px',animation:'shake 0.35s ease'}}>
                <AlertCircle size={16} color="#f87171" style={{flexShrink:0,marginTop:'1px'}} />
                <p style={{fontSize:'13px',color:'#f87171',margin:0,lineHeight:1.5}}>{error}</p>
              </div>
            )}

                        <form onSubmit={handleSubmit} ref={formRef}>

              {/* Full Name */}
              <div style={{marginBottom:'12px'}}>
                <label style={{display:'block',fontSize:'12px',fontWeight:500,color:'rgba(255,255,255,0.5)',marginBottom:'7px',textTransform:'uppercase',letterSpacing:'0.06em'}}>
                  Full name
                </label>
                <div style={{position:'relative'}}>
                  <User size={16} color="rgba(255,255,255,0.25)" style={{position:'absolute',left:'14px',top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}} />
                  <input type="text" autoComplete="name" required
                         value={form.name} onChange={e => { setField('name', e.target.value); setFieldErrors(fe => ({...fe, name:''})); }}
                         placeholder="John Doe"
                         style={{...inputStyle, padding: isMobile ? '11px 14px 11px 40px' : '12px 16px 12px 42px', ...(fieldErrors.name ? {border:'1px solid rgba(239,68,68,0.6)',boxShadow:'0 0 0 3px rgba(239,68,68,0.08)'} : {})}}
                         onFocus={focusIn} onBlur={focusOut} />
                </div>
                {fieldErrors.name && (
                  <div style={{display:'flex',alignItems:'center',gap:'4px',marginTop:'5px'}}>
                    <AlertCircle size={12} color="#ef4444" />
                    <span style={{fontSize:'12px',color:'#ef4444'}}>{fieldErrors.name}</span>
                  </div>
                )}
              </div>

              {/* Email */}
              <div style={{marginBottom:'12px'}}>
                <label style={{display:'block',fontSize:'12px',fontWeight:500,color:'rgba(255,255,255,0.5)',marginBottom:'7px',textTransform:'uppercase',letterSpacing:'0.06em'}}>
                  Email address
                </label>
                <div style={{position:'relative'}}>
                  <Mail size={16} color="rgba(255,255,255,0.25)" style={{position:'absolute',left:'14px',top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}} />
                  <input type="email" autoComplete="email" required
                         value={form.email} onChange={e => { setField('email', e.target.value); setFieldErrors(fe => ({...fe, email:''})); }}
                         placeholder="you@example.com"
                         style={{...inputStyle, padding: isMobile ? '11px 14px 11px 40px' : '12px 16px 12px 42px', ...(fieldErrors.email ? {border:'1px solid rgba(239,68,68,0.6)',boxShadow:'0 0 0 3px rgba(239,68,68,0.08)'} : {})}}
                         onFocus={focusIn} onBlur={focusOut} />
                </div>
                {fieldErrors.email && (
                  <div style={{display:'flex',alignItems:'center',gap:'4px',marginTop:'5px'}}>
                    <AlertCircle size={12} color="#ef4444" />
                    <span style={{fontSize:'12px',color:'#ef4444'}}>{fieldErrors.email}</span>
                  </div>
                )}
              </div>

              {/* Password */}
              <div style={{marginBottom:'12px'}}>
                <label style={{display:'block',fontSize:'12px',fontWeight:500,color:'rgba(255,255,255,0.5)',marginBottom:'7px',textTransform:'uppercase',letterSpacing:'0.06em'}}>
                  Password
                </label>
                <div style={{position:'relative'}}>
                  <Lock size={16} color="rgba(255,255,255,0.25)" style={{position:'absolute',left:'14px',top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}} />
                  <input type={showPass ? 'text' : 'password'} autoComplete="new-password" required
                         value={form.password} onChange={e => { setField('password', e.target.value); setFieldErrors(fe => ({...fe, password:''})); }}
                         placeholder="Min. 8 characters"
                         style={{...inputStyle, padding: isMobile ? '11px 44px 11px 40px' : '12px 44px 12px 42px', ...(fieldErrors.password ? {border:'1px solid rgba(239,68,68,0.6)',boxShadow:'0 0 0 3px rgba(239,68,68,0.08)'} : {})}}
                         onFocus={focusIn} onBlur={focusOut} />
                  <button type="button" tabIndex={-1} onClick={() => setShowPass(v => !v)}
                          style={{position:'absolute',right:'14px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.35)',padding:0,display:'flex'}}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {/* Strength meter */}
                {form.password && (
                  <div style={{marginTop:'10px'}}>
                    <div style={{display:'flex',gap:'4px',marginBottom:'6px'}}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{
                          height:'3px', flex:1, borderRadius:'2px',
                          transition:'all 0.3s ease',
                          background: i <= strength
                            ? (strength===1?'#ef4444':strength===2?'#f97316':strength===3?'#f59e0b':'#10b981')
                            : 'rgba(255,255,255,0.07)',
                        }} />
                      ))}
                    </div>
                    <span style={{
                      fontSize:'12px', fontWeight:500,
                      color: strength===1?'#f87171':strength===2?'#fb923c':strength===3?'#fbbf24':'#34d399',
                    }}>
                      {STRENGTH_META[strength].label} password
                    </span>
                    {/* Checklist */}
                    <div style={{marginTop:'8px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px 16px'}}>
                      {[
                        { ok: has8,    label: '8+ characters' },
                        { ok: hasNum,  label: 'Number'        },
                        { ok: hasCaps, label: 'Uppercase'     },
                        { ok: hasSpec, label: 'Symbol'        },
                      ].map(({ ok, label }) => (
                        <div key={label} style={{display:'flex',alignItems:'center',gap:'6px'}}>
                          {ok
                            ? <Check size={12} color="#34d399" style={{flexShrink:0}} />
                            : <div style={{width:'12px',height:'12px',borderRadius:'50%',border:'1px solid rgba(255,255,255,0.15)',flexShrink:0}} />}
                          <span style={{fontSize:'11px',color: ok?'#34d399':'rgba(255,255,255,0.3)',transition:'color 0.2s'}}>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {fieldErrors.password && (
                  <div style={{display:'flex',alignItems:'center',gap:'4px',marginTop:'5px'}}>
                    <AlertCircle size={12} color="#ef4444" />
                    <span style={{fontSize:'12px',color:'#ef4444'}}>{fieldErrors.password}</span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div style={{marginBottom:'4px'}}>
                <label style={{display:'block',fontSize:'12px',fontWeight:500,color:'rgba(255,255,255,0.5)',marginBottom:'7px',textTransform:'uppercase',letterSpacing:'0.06em'}}>
                  Confirm password
                </label>
                <div style={{position:'relative'}}>
                  <Lock size={16} color="rgba(255,255,255,0.25)" style={{position:'absolute',left:'14px',top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}} />
                  <input type={showConfirm ? 'text' : 'password'} autoComplete="new-password" required
                         value={form.confirm} onChange={e => { setField('confirm', e.target.value); setFieldErrors(fe => ({...fe, confirm:''})); }}
                         placeholder="Re-enter your password"
                         style={{...inputStyle, padding:'12px 68px 12px 42px', ...(fieldErrors.confirm ? {border:'1px solid rgba(239,68,68,0.6)',boxShadow:'0 0 0 3px rgba(239,68,68,0.08)'} : {})}}
                         onFocus={focusIn} onBlur={focusOut} />
                  <div style={{position:'absolute',right:'14px',top:'50%',transform:'translateY(-50%)',display:'flex',alignItems:'center',gap:'6px'}}>
                    {form.confirm && (
                      form.password === form.confirm
                        ? <CheckCircle2 size={16} color="#34d399" />
                        : <AlertCircle  size={16} color="#f87171" />
                    )}
                    <button type="button" tabIndex={-1} onClick={() => setShowConfirm(v => !v)}
                            style={{background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.35)',padding:0,display:'flex'}}>
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                {fieldErrors.confirm && (
                  <div style={{display:'flex',alignItems:'center',gap:'4px',marginTop:'5px'}}>
                    <AlertCircle size={12} color="#ef4444" />
                    <span style={{fontSize:'12px',color:'#ef4444'}}>{fieldErrors.confirm}</span>
                  </div>
                )}
              </div>

              {/* Consent checkboxes */}
              <div style={{marginTop:'10px',marginBottom:'14px',display:'flex',flexDirection:'column',gap:'8px'}}>
                <label style={{display:'flex',alignItems:'flex-start',gap:'12px',cursor:'pointer',userSelect:'none'}}>
                  <input type="checkbox" className="sp-checkbox"
                         checked={consent.terms}
                         onChange={e => setConsent(c => ({ ...c, terms: e.target.checked }))} />
                  <span style={{fontSize:'13px',color:'rgba(255,255,255,0.55)',lineHeight:1.5}}>
                    I agree to the{' '}
                    <a href="/terms" target="_blank" rel="noopener noreferrer"
                       style={{color:'#10b981',textDecoration:'none'}}
                       onMouseEnter={e => e.currentTarget.style.textDecoration='underline'}
                       onMouseLeave={e => e.currentTarget.style.textDecoration='none'}
                       onClick={e => e.stopPropagation()}>
                      Terms of Service
                    </a>
                    {' '}and understand that Zynth is a software tool, not a financial advisor.
                  </span>
                </label>
                <label style={{display:'flex',alignItems:'flex-start',gap:'12px',cursor:'pointer',userSelect:'none'}}>
                  <input type="checkbox" className="sp-checkbox"
                         checked={consent.risk}
                         onChange={e => setConsent(c => ({ ...c, risk: e.target.checked }))} />
                  <span style={{fontSize:'13px',color:'rgba(255,255,255,0.55)',lineHeight:1.5}}>
                    I understand AI analysis may contain errors and should not be the sole basis for trading decisions. I trade at my own risk.
                  </span>
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit" disabled={loading}
                style={{
                  width:'100%',
                  padding: isMobile ? '12px' : '13px',
                  background: loading ? 'rgba(16,185,129,0.5)' : '#10b981',
                  border:'none', borderRadius:'10px',
                  color:'#fff', fontSize:'15px', fontWeight:600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition:'all 0.2s ease',
                  letterSpacing:'0.01em',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
                }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.background='#0d9a6e'; e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 8px 25px rgba(16,185,129,0.25)'; } }}
                onMouseLeave={e => { e.currentTarget.style.background=loading?'rgba(16,185,129,0.5)':'#10b981'; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}
                onMouseDown={e => { e.currentTarget.style.transform='translateY(0) scale(0.99)'; }}
                onMouseUp={e => { e.currentTarget.style.transform='translateY(-1px) scale(1)'; }}
              >
                {loading
                  ? <><Loader2 size={16} className="animate-spin" /><span>Creating account...</span></>
                  : 'Create account →'}
              </button>
            </form>


              </>
            )}
          </div>
        </div>
    </div>
  );
}
