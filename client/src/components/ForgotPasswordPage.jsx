import { useState } from 'react';
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
