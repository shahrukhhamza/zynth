"""
Rewrites SignupPage.jsx and ForgotPasswordPage.jsx with the new
centered glassmorphism card design that matches LoginPage.jsx.
"""
import os

BASE = r"d:\US DATA\client\src\components"

# ─── helpers ──────────────────────────────────────────────────────────────────

def keep_logic(path):
    """Return everything before the last `  return (` in the file."""
    with open(path, encoding="utf-8") as f:
        content = f.read()
    idx = content.rfind("  return (")
    assert idx >= 0, f"No return found in {path}"
    return content[:idx]


def write(path, content):
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
    lines = content.count("\n") + 1
    print(f"Written {path} — {lines} lines")


# ─── SignupPage ────────────────────────────────────────────────────────────────

signup_logic = keep_logic(os.path.join(BASE, "SignupPage.jsx"))

signup_return = r"""  return (
    <div style={{ minHeight: '100vh', background: isDark ? '#020617' : '#F8FAFC', position: 'relative', overflowX: 'hidden', overflowY: 'auto' }}>
      <style>{`
        @keyframes authBlobFloat { 0%,100%{transform:scale(1) translateY(0px)} 50%{transform:scale(1.05) translateY(-16px)} }
        @keyframes authCardIn { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        @keyframes formShake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} }
        @keyframes checkIn { from{transform:scale(0);opacity:0} to{transform:scale(1);opacity:1} }
        .sp-checkbox {
          appearance:none; -webkit-appearance:none; width:18px; height:18px; min-width:18px;
          border-radius:5px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.15);
          cursor:pointer; position:relative; margin-top:1px; transition:background 0.15s,border-color 0.15s;
        }
        .sp-checkbox:checked { background:#3b82f6; border-color:#3b82f6; }
        .sp-checkbox:checked::after {
          content:''; position:absolute; left:3px; top:1px; width:10px; height:6px;
          border-left:2px solid #fff; border-bottom:2px solid #fff; transform:rotate(-45deg);
          animation:checkIn 0.18s ease;
        }
      `}</style>

      {/* Background radial gradients */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0,
        backgroundImage: isDark
          ? 'radial-gradient(ellipse 90% 55% at 50% -5%, rgba(59,130,246,0.14) 0%, transparent 60%), radial-gradient(ellipse 55% 45% at 85% 90%, rgba(99,102,241,0.09) 0%, transparent 60%)'
          : 'radial-gradient(ellipse 90% 55% at 50% -5%, rgba(99,102,241,0.09) 0%, transparent 60%), radial-gradient(ellipse 55% 45% at 85% 90%, rgba(168,85,247,0.06) 0%, transparent 60%)',
      }} />
      <div style={{ position:'fixed', top:'-120px', left:'-120px', width:'520px', height:'520px', pointerEvents:'none', zIndex:0,
        background: isDark ? 'radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)',
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
        <button onClick={onSwitchToLogin} style={{ fontSize:'13px', fontWeight:500, background:'none', border:'none', cursor:'pointer',
          color: isDark?'rgba(255,255,255,0.55)':'#64748b', padding:'6px 2px', transition:'color 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.color='#3b82f6'; }}
          onMouseLeave={e => { e.currentTarget.style.color=isDark?'rgba(255,255,255,0.55)':'#64748b'; }}>
          Sign in →
        </button>
      </div>

      {/* Centered card */}
      <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:'80px 20px 40px', boxSizing:'border-box' }}>
        {success ? (
          <div style={{ textAlign:'center', animation:'authCardIn 0.4s ease both' }}>
            <div style={{ width:'72px', height:'72px', borderRadius:'50%', background:'linear-gradient(135deg, #1d4ed8, #0284c7)',
              display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px',
              boxShadow:'0 0 40px rgba(59,130,246,0.4)' }}>
              <CheckCircle size={34} color="#fff" />
            </div>
            <h2 style={{ fontSize:'24px', fontWeight:800, color: isDark?'#fff':'#0f172a', marginBottom:'8px' }}>Account created!</h2>
            <p style={{ fontSize:'15px', color: isDark?'rgba(255,255,255,0.55)':'#64748b' }}>Redirecting you to your dashboard…</p>
            <div style={{ width:'40px', height:'3px', background:'linear-gradient(90deg,#3b82f6,#0284c7)', borderRadius:'2px', margin:'16px auto 0', animation:'authBlobFloat 1.5s ease-in-out infinite' }} />
          </div>
        ) : (
          <div ref={formRef} style={{
            width:'100%', maxWidth:'440px',
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
              <h2 style={{ fontSize:'26px', fontWeight:800, letterSpacing:'-0.025em', color: isDark?'#fff':'#0f172a', margin:'0 0 5px' }}>Create your account.</h2>
              <p style={{ fontSize:'14px', color: isDark?'rgba(255,255,255,0.45)':'#64748b', margin:0 }}>
                {spotsLeft != null && <><span style={{ color:'#f59e0b', fontWeight:600 }}>{spotsLeft} spots</span> remaining.{' '}</>}
                Already on Zynth?{' '}
                <button onClick={onSwitchToLogin} style={{ color:'#3b82f6', background:'none', border:'none', cursor:'pointer', fontSize:'14px', padding:0, fontWeight:500 }}
                  onMouseEnter={e => e.currentTarget.style.textDecoration='underline'}
                  onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>Sign in</button>
              </p>
            </div>

            {error && <ErrorBar message={error} className="mb-4" />}

            {/* Google button */}
            <button type="button" onClick={handleGoogleClick} disabled={loading||googleLoading||!GOOGLE_CLIENT_ID}
              style={{ width:'100%', padding:'11px 16px', background:googleLoading?'#e8eaed':'#ffffff',
                border:'1px solid rgba(0,0,0,0.10)', borderRadius:'12px',
                color:!GOOGLE_CLIENT_ID?'rgba(0,0,0,0.25)':'#1f2937', fontSize:'14px', fontWeight:500,
                display:'flex', alignItems:'center', justifyContent:'center', gap:'10px',
                cursor:loading||googleLoading||!GOOGLE_CLIENT_ID?'not-allowed':'pointer',
                transition:'all 0.2s ease', marginBottom:'16px',
                boxShadow:'0 1px 4px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.05)' }}
              onMouseEnter={e => { if(!loading&&!googleLoading&&GOOGLE_CLIENT_ID){ e.currentTarget.style.background='#f8fafc'; e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.15)'; }}}
              onMouseLeave={e => { e.currentTarget.style.background=googleLoading?'#e8eaed':'#ffffff'; e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.05)'; }}>
              {googleLoading ? <Loader2 size={17} className="animate-spin" style={{ color:'rgba(0,0,0,0.45)', flexShrink:0 }} /> : (
                <svg width="17" height="17" viewBox="0 0 24 24" style={{ flexShrink:0 }}>
                  <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115z"/>
                  <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987z"/>
                  <path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21z"/>
                  <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067z"/>
                </svg>
              )}
              <span>{googleLoading ? 'Signing up...' : 'Continue with Google'}</span>
            </button>

            {/* Divider */}
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px' }}>
              <div style={{ flex:1, height:'1px', background: isDark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.08)' }} />
              <span style={{ fontSize:'11px', fontWeight:500, color: isDark?'rgba(255,255,255,0.30)':'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em' }}>or with email</span>
              <div style={{ flex:1, height:'1px', background: isDark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.08)' }} />
            </div>

            <form onSubmit={handleSubmit}>
              {/* Name */}
              <div style={{ marginBottom:'12px' }}>
                <div style={{ position:'relative' }}>
                  <User size={15} color={isDark?'rgba(255,255,255,0.25)':'rgba(0,0,0,0.3)'} style={{ position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                  <input type="text" autoComplete="name" value={form.name} required
                    onChange={e => { setField('name', e.target.value); setFieldErrors(fe => ({...fe, name:''})); }}
                    placeholder="Full name"
                    style={{ width:'100%', boxSizing:'border-box', background: isDark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.03)',
                      border: fieldErrors.name?'1.5px solid rgba(239,68,68,0.6)':isDark?'1px solid rgba(255,255,255,0.1)':'1px solid rgba(0,0,0,0.1)',
                      borderRadius:'12px', padding:'12px 14px 12px 40px',
                      color: isDark?'#fff':'#0f172a', fontSize:'14px', outline:'none', transition:'all 0.2s ease' }}
                    onFocus={focusIn} onBlur={focusOut}
                  />
                </div>
                {fieldErrors.name && <div style={{ display:'flex', alignItems:'center', gap:'4px', marginTop:'4px' }}><AlertCircle size={11} color="#ef4444"/><span style={{ fontSize:'11px', color:'#ef4444' }}>{fieldErrors.name}</span></div>}
              </div>

              {/* Email */}
              <div style={{ marginBottom:'12px' }}>
                <div style={{ position:'relative' }}>
                  <Mail size={15} color={isDark?'rgba(255,255,255,0.25)':'rgba(0,0,0,0.3)'} style={{ position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                  <input type="email" autoComplete="email" value={form.email} required
                    onChange={e => { setField('email', e.target.value); setFieldErrors(fe => ({...fe, email:''})); }}
                    placeholder="Email address"
                    style={{ width:'100%', boxSizing:'border-box', background: isDark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.03)',
                      border: fieldErrors.email?'1.5px solid rgba(239,68,68,0.6)':isDark?'1px solid rgba(255,255,255,0.1)':'1px solid rgba(0,0,0,0.1)',
                      borderRadius:'12px', padding:'12px 14px 12px 40px',
                      color: isDark?'#fff':'#0f172a', fontSize:'14px', outline:'none', transition:'all 0.2s ease' }}
                    onFocus={focusIn} onBlur={focusOut}
                  />
                </div>
                {fieldErrors.email && <div style={{ display:'flex', alignItems:'center', gap:'4px', marginTop:'4px' }}><AlertCircle size={11} color="#ef4444"/><span style={{ fontSize:'11px', color:'#ef4444' }}>{fieldErrors.email}</span></div>}
              </div>

              {/* Password */}
              <div style={{ marginBottom:'6px' }}>
                <div style={{ position:'relative' }}>
                  <Lock size={15} color={isDark?'rgba(255,255,255,0.25)':'rgba(0,0,0,0.3)'} style={{ position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                  <input type={showPass?'text':'password'} autoComplete="new-password" value={form.password} required
                    onChange={e => { setField('password', e.target.value); setFieldErrors(fe => ({...fe, password:''})); }}
                    placeholder="Password"
                    style={{ width:'100%', boxSizing:'border-box', background: isDark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.03)',
                      border: fieldErrors.password?'1.5px solid rgba(239,68,68,0.6)':isDark?'1px solid rgba(255,255,255,0.1)':'1px solid rgba(0,0,0,0.1)',
                      borderRadius:'12px', padding:'12px 40px 12px 40px',
                      color: isDark?'#fff':'#0f172a', fontSize:'14px', outline:'none', transition:'all 0.2s ease' }}
                    onFocus={focusIn} onBlur={focusOut}
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}
                    style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:isDark?'rgba(255,255,255,0.3)':'rgba(0,0,0,0.35)', padding:0, display:'flex' }}>
                    {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
                {fieldErrors.password && <div style={{ display:'flex', alignItems:'center', gap:'4px', marginTop:'4px' }}><AlertCircle size={11} color="#ef4444"/><span style={{ fontSize:'11px', color:'#ef4444' }}>{fieldErrors.password}</span></div>}
              </div>

              {/* Strength meter */}
              {form.password.length > 0 && (
                <div style={{ marginBottom:'12px' }}>
                  <div style={{ display:'flex', gap:'4px', marginBottom:'4px' }}>
                    {[1,2,3,4].map(n => (
                      <div key={n} style={{ flex:1, height:'3px', borderRadius:'2px', transition:'background 0.3s',
                        background: strength>=n
                          ? (strength===1?'#ef4444':strength===2?'#f97316':strength===3?'#f59e0b':'#10b981')
                          : isDark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.08)',
                      }} />
                    ))}
                  </div>
                  <span style={{ fontSize:'11px', color: strength===1?'#ef4444':strength===2?'#f97316':strength===3?'#f59e0b':'#10b981', fontWeight:500 }}>
                    {STRENGTH_META[strength]?.label || ''}
                  </span>
                </div>
              )}

              {/* Confirm password */}
              <div style={{ marginBottom:'14px' }}>
                <div style={{ position:'relative' }}>
                  <Lock size={15} color={isDark?'rgba(255,255,255,0.25)':'rgba(0,0,0,0.3)'} style={{ position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                  <input type={showConfirm?'text':'password'} autoComplete="new-password" value={form.confirm} required
                    onChange={e => { setField('confirm', e.target.value); setFieldErrors(fe => ({...fe, confirm:''})); }}
                    placeholder="Confirm password"
                    style={{ width:'100%', boxSizing:'border-box', background: isDark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.03)',
                      border: fieldErrors.confirm?'1.5px solid rgba(239,68,68,0.6)':isDark?'1px solid rgba(255,255,255,0.1)':'1px solid rgba(0,0,0,0.1)',
                      borderRadius:'12px', padding:'12px 40px 12px 40px',
                      color: isDark?'#fff':'#0f172a', fontSize:'14px', outline:'none', transition:'all 0.2s ease' }}
                    onFocus={focusIn} onBlur={focusOut}
                  />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}
                    style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:isDark?'rgba(255,255,255,0.3)':'rgba(0,0,0,0.35)', padding:0, display:'flex' }}>
                    {showConfirm ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
                {fieldErrors.confirm && <div style={{ display:'flex', alignItems:'center', gap:'4px', marginTop:'4px' }}><AlertCircle size={11} color="#ef4444"/><span style={{ fontSize:'11px', color:'#ef4444' }}>{fieldErrors.confirm}</span></div>}
              </div>

              {/* Consent checkboxes */}
              <div style={{ marginBottom:'16px', display:'flex', flexDirection:'column', gap:'10px' }}>
                <label style={{ display:'flex', alignItems:'flex-start', gap:'10px', cursor:'pointer' }}>
                  <input type="checkbox" className="sp-checkbox" checked={consent.terms}
                    onChange={e => setConsent(c => ({...c, terms: e.target.checked}))} />
                  <span style={{ fontSize:'12px', color: isDark?'rgba(255,255,255,0.45)':'#64748b', lineHeight:1.5 }}>
                    I agree to the <a href="/terms" target="_blank" style={{ color:'#3b82f6', textDecoration:'none' }}>Terms of Service</a>
                  </span>
                </label>
                <label style={{ display:'flex', alignItems:'flex-start', gap:'10px', cursor:'pointer' }}>
                  <input type="checkbox" className="sp-checkbox" checked={consent.risk}
                    onChange={e => setConsent(c => ({...c, risk: e.target.checked}))} />
                  <span style={{ fontSize:'12px', color: isDark?'rgba(255,255,255,0.45)':'#64748b', lineHeight:1.5 }}>
                    I understand trading involves risk and I accept sole responsibility for my trades
                  </span>
                </label>
              </div>

              <button type="submit" disabled={loading}
                style={{ width:'100%', padding:'13px',
                  background: loading?'rgba(59,130,246,0.5)':'linear-gradient(135deg, #1d4ed8 0%, #0284c7 100%)',
                  border:'none', borderRadius:'12px', color:'#fff', fontSize:'14px', fontWeight:700,
                  cursor: loading?'not-allowed':'pointer', transition:'all 0.2s ease',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
                  boxShadow: loading?'none':'0 4px 20px rgba(29,78,216,0.4)', letterSpacing:'0.01em' }}
                onMouseEnter={e => { if(!loading){ e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 10px 32px rgba(29,78,216,0.52)'; }}}
                onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=loading?'none':'0 4px 20px rgba(29,78,216,0.4)'; }}
                onMouseDown={e => { if(!loading) e.currentTarget.style.transform='scale(0.99)'; }}
                onMouseUp={e => { if(!loading) e.currentTarget.style.transform='translateY(-2px)'; }}>
                {loading ? <><Loader2 size={15} className="animate-spin"/><span>Creating account...</span></> : <>Create Account <ArrowRight size={16}/></>}
              </button>
            </form>

            <p style={{ marginTop:'20px', textAlign:'center', fontSize:'12px', color: isDark?'rgba(255,255,255,0.25)':'#94a3b8' }}>
              🔒 256-bit SSL · Bank-grade encryption · Cancel anytime
            </p>
            <p style={{ marginTop:'10px', textAlign:'center', fontSize:'13px', color: isDark?'rgba(255,255,255,0.4)':'#64748b' }}>
              Already have an account?{' '}
              <button onClick={onSwitchToLogin} style={{ color:'#3b82f6', background:'none', border:'none', cursor:'pointer', fontSize:'13px', padding:0, fontWeight:500 }}
                onMouseEnter={e => e.currentTarget.style.textDecoration='underline'}
                onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>
                Sign in →
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
"""

write(os.path.join(BASE, "SignupPage.jsx"), signup_logic + signup_return)


# ─── ForgotPasswordPage ────────────────────────────────────────────────────────

forgot_full = r"""import { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';
import { AlertCircle, CheckCircle2, Loader2, Mail, ChevronLeft } from 'lucide-react';
import { BrandMark } from './BrandLogo';
import ErrorBar from './ErrorBar';
import { useTheme } from '../contexts/ThemeContext';

export default function ForgotPasswordPage({ onBack }) {
  const { isDark } = useTheme();
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
    <div style={{ minHeight: '100vh', background: isDark ? '#020617' : '#F8FAFC', position: 'relative', overflowX: 'hidden', overflowY: 'auto' }}>
      <style>{`
        @keyframes authBlobFloat { 0%,100%{transform:scale(1) translateY(0px)} 50%{transform:scale(1.05) translateY(-16px)} }
        @keyframes authCardIn { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0,
        backgroundImage: isDark
          ? 'radial-gradient(ellipse 90% 55% at 50% -5%, rgba(59,130,246,0.14) 0%, transparent 60%), radial-gradient(ellipse 55% 45% at 85% 90%, rgba(99,102,241,0.09) 0%, transparent 60%)'
          : 'radial-gradient(ellipse 90% 55% at 50% -5%, rgba(99,102,241,0.09) 0%, transparent 60%), radial-gradient(ellipse 55% 45% at 85% 90%, rgba(168,85,247,0.06) 0%, transparent 60%)',
      }} />
      <div style={{ position:'fixed', top:'-120px', left:'-120px', width:'520px', height:'520px', pointerEvents:'none', zIndex:0,
        background: isDark ? 'radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)',
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
        <button onClick={onBack} style={{ display:'flex', alignItems:'center', gap:'6px',
          background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
          border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
          borderRadius:'8px', padding:'6px 12px', fontSize:'13px',
          color: isDark ? 'rgba(255,255,255,0.55)' : '#64748b', cursor:'pointer', transition:'all 0.15s ease' }}
          onMouseEnter={e => { e.currentTarget.style.color=isDark?'#fff':'#0f172a'; e.currentTarget.style.background=isDark?'rgba(255,255,255,0.09)':'rgba(0,0,0,0.07)'; }}
          onMouseLeave={e => { e.currentTarget.style.color=isDark?'rgba(255,255,255,0.55)':'#64748b'; e.currentTarget.style.background=isDark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)'; }}>
          <ChevronLeft size={14} /> Back to login
        </button>
        <div style={{ position:'absolute', left:'50%', transform:'translateX(-50%)', display:'flex', alignItems:'center', gap:'8px' }}>
          <BrandMark size={28} />
          <span style={{ fontSize:'17px', fontWeight:700, color: isDark?'#fff':'#0f172a', letterSpacing:'-0.01em' }}>Zynth</span>
        </div>
        <div style={{ width:'100px' }} />
      </div>

      <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:'80px 20px 40px', boxSizing:'border-box' }}>
        <div style={{
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
          {success ? (
            <div style={{ textAlign:'center', padding:'8px 0' }}>
              <div style={{ width:'64px', height:'64px', borderRadius:'50%', background:'linear-gradient(135deg, #1d4ed8, #0284c7)',
                display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px',
                boxShadow:'0 0 36px rgba(59,130,246,0.35)' }}>
                <CheckCircle2 size={30} color="#fff" />
              </div>
              <h2 style={{ fontSize:'24px', fontWeight:800, color: isDark?'#fff':'#0f172a', marginBottom:'8px' }}>Check your email</h2>
              <p style={{ fontSize:'14px', color: isDark?'rgba(255,255,255,0.50)':'#64748b', lineHeight:1.6, marginBottom:'6px' }}>
                If an account exists for
              </p>
              <p style={{ fontSize:'14px', fontWeight:600, color: isDark?'rgba(255,255,255,0.80)':'#0f172a', marginBottom:'12px' }}>{email}</p>
              <p style={{ fontSize:'14px', color: isDark?'rgba(255,255,255,0.50)':'#64748b', lineHeight:1.6, marginBottom:'20px' }}>
                you'll receive a password reset link shortly. Check your spam folder too.
              </p>
              <button onClick={onBack} style={{ fontSize:'13px', fontWeight:500, color:'#3b82f6', background:'none', border:'none', cursor:'pointer', padding:0 }}
                onMouseEnter={e => e.currentTarget.style.textDecoration='underline'}
                onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>
                ← Back to login
              </button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom:'22px' }}>
                <h2 style={{ fontSize:'26px', fontWeight:800, letterSpacing:'-0.025em', color: isDark?'#fff':'#0f172a', margin:'0 0 5px' }}>Reset password.</h2>
                <p style={{ fontSize:'14px', color: isDark?'rgba(255,255,255,0.45)':'#64748b', margin:0 }}>
                  Enter your email and we'll send a reset link.
                </p>
              </div>

              {error && <ErrorBar message={error} className="mb-4" />}

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom:'18px' }}>
                  <div style={{ position:'relative' }}>
                    <Mail size={15} color={isDark?'rgba(255,255,255,0.25)':'rgba(0,0,0,0.3)'} style={{ position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                    <input type="email" value={email} required autoComplete="email"
                      onChange={e => setEmail(e.target.value)}
                      placeholder="Email address"
                      style={{ width:'100%', boxSizing:'border-box',
                        background: isDark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.03)',
                        border: isDark?'1px solid rgba(255,255,255,0.1)':'1px solid rgba(0,0,0,0.1)',
                        borderRadius:'12px', padding:'12px 14px 12px 40px',
                        color: isDark?'#fff':'#0f172a', fontSize:'14px', outline:'none', transition:'all 0.2s ease' }}
                      onFocus={e => { e.target.style.borderColor='rgba(59,130,246,0.6)'; e.target.style.boxShadow='0 0 0 3px rgba(59,130,246,0.12)'; e.target.style.background=isDark?'rgba(255,255,255,0.07)':'rgba(59,130,246,0.02)'; }}
                      onBlur={e => { e.target.style.borderColor=isDark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.1)'; e.target.style.boxShadow='none'; e.target.style.background=isDark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.03)'; }}
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  style={{ width:'100%', padding:'13px',
                    background: loading?'rgba(59,130,246,0.5)':'linear-gradient(135deg, #1d4ed8 0%, #0284c7 100%)',
                    border:'none', borderRadius:'12px', color:'#fff', fontSize:'14px', fontWeight:700,
                    cursor: loading?'not-allowed':'pointer', transition:'all 0.2s ease',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
                    boxShadow: loading?'none':'0 4px 20px rgba(29,78,216,0.4)', letterSpacing:'0.01em' }}
                  onMouseEnter={e => { if(!loading){ e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 10px 32px rgba(29,78,216,0.52)'; }}}
                  onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=loading?'none':'0 4px 20px rgba(29,78,216,0.4)'; }}
                  onMouseDown={e => { if(!loading) e.currentTarget.style.transform='scale(0.99)'; }}
                  onMouseUp={e => { if(!loading) e.currentTarget.style.transform='translateY(-2px)'; }}>
                  {loading ? <><Loader2 size={15} className="animate-spin"/><span>Sending...</span></> : <>Send reset link</>}
                </button>
              </form>

              <p style={{ marginTop:'20px', textAlign:'center', fontSize:'12px', color: isDark?'rgba(255,255,255,0.25)':'#94a3b8' }}>
                🔒 Secure · We never share your email
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
"""

write(os.path.join(BASE, "ForgotPasswordPage.jsx"), forgot_full)

print("Done.")
