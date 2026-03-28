import { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';
import { CheckCircle2, Loader2, ChevronLeft } from 'lucide-react';
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
    <div style={{ minHeight:'100vh', background: isDark?'#020617':'#f8fafc', position:'relative', overflowX:'hidden', overflowY:'auto' }}>
      <style>{`
        @keyframes blobDrift {
          0%,100% { transform: translate(0px,0px) scale(1); }
          25%  { transform: translate(44px,-30px) scale(1.04); }
          50%  { transform: translate(-20px,24px) scale(0.967); }
          75%  { transform: translate(30px,34px) scale(1.028); }
        }
        @keyframes blobDrift2 {
          0%,100% { transform: translate(0px,0px) scale(1); }
          30%  { transform: translate(-34px,24px) scale(1.048); }
          60%  { transform: translate(30px,-18px) scale(0.964); }
          85%  { transform: translate(-14px,-28px) scale(1.022); }
        }
        @keyframes cardIn {
          from { opacity:0; transform:translateY(20px) scale(0.988); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
      `}</style>

      {/* Grid texture */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0,
        backgroundImage: isDark
          ? 'linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)'
          : 'linear-gradient(rgba(0,0,0,0.034) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.034) 1px, transparent 1px)',
        backgroundSize:'42px 42px',
      }} />

      {/* Blob 1 */}
      <div style={{ position:'fixed', top:'-220px', left:'-180px', width:'720px', height:'720px',
        pointerEvents:'none', zIndex:0,
        background: isDark
          ? 'radial-gradient(circle, rgba(59,130,246,0.11) 0%, rgba(99,102,241,0.06) 35%, transparent 65%)'
          : 'radial-gradient(circle, rgba(99,102,241,0.09) 0%, rgba(168,85,247,0.04) 35%, transparent 65%)',
        filter:'blur(82px)', animation:'blobDrift 18s ease-in-out infinite',
      }} />

      {/* Blob 2 */}
      <div style={{ position:'fixed', bottom:'-200px', right:'-180px', width:'640px', height:'640px',
        pointerEvents:'none', zIndex:0,
        background: isDark
          ? 'radial-gradient(circle, rgba(99,102,241,0.09) 0%, rgba(59,130,246,0.04) 35%, transparent 65%)'
          : 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, rgba(99,102,241,0.03) 35%, transparent 65%)',
        filter:'blur(82px)', animation:'blobDrift2 22s ease-in-out infinite',
      }} />

      {/* Corner vignette */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0,
        background: isDark
          ? 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(2,6,23,0.6) 100%)'
          : 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(240,244,250,0.6) 100%)',
      }} />

      {/* Nav */}
      <div style={{ position:'fixed', top:0, left:0, right:0, zIndex:20, height:'52px',
        display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px',
        borderBottom: isDark?'1px solid rgba(255,255,255,0.045)':'1px solid rgba(0,0,0,0.045)',
        background: isDark?'rgba(2,6,23,0.65)':'rgba(248,250,252,0.75)',
        backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
      }}>
        <button onClick={onBack}
          style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'12.5px',
            color: isDark?'rgba(255,255,255,0.38)':'#94a3b8', background:'none', border:'none', cursor:'pointer',
            padding:'4px 7px', borderRadius:'6px', transition:'all 0.12s' }}
          onMouseEnter={e => { e.currentTarget.style.color=isDark?'rgba(255,255,255,0.78)':'#475569'; e.currentTarget.style.background=isDark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.03)'; }}
          onMouseLeave={e => { e.currentTarget.style.color=isDark?'rgba(255,255,255,0.38)':'#94a3b8'; e.currentTarget.style.background='transparent'; }}>
          <ChevronLeft size={13} /> Back
        </button>
        <div style={{ position:'absolute', left:'50%', transform:'translateX(-50%)', display:'flex', alignItems:'center', gap:'7px' }}>
          <BrandMark size={22} />
          <span style={{ fontSize:'14px', fontWeight:700, color: isDark?'rgba(255,255,255,0.88)':'#0f172a', letterSpacing:'-0.02em' }}>Zynth</span>
        </div>
        <div style={{ width:'60px' }} />
      </div>

      {/* Page body */}
      <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:'64px 20px 48px', boxSizing:'border-box' }}>

        {/* Logotype above card */}
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'24px', animation:'cardIn 0.38s ease both' }}>
          <BrandMark size={34} />
          <span style={{ fontSize:'19px', fontWeight:800, letterSpacing:'-0.035em', color: isDark?'#fff':'#0f172a' }}>Zynth</span>
        </div>

        {/* Card */}
        <div style={{
          width:'100%', maxWidth:'392px',
          background: isDark?'rgba(9,14,30,0.77)':'rgba(255,255,255,0.97)',
          backdropFilter:'blur(32px)', WebkitBackdropFilter:'blur(32px)',
          border: isDark?'1px solid rgba(255,255,255,0.076)':'1px solid rgba(0,0,0,0.06)',
          borderRadius:'18px', padding:'30px 28px 26px',
          boxShadow: isDark
            ? '0 0 0 0.5px rgba(255,255,255,0.055) inset, 0 20px 60px rgba(0,0,0,0.82), 0 0 0 1px rgba(59,130,246,0.07)'
            : '0 0 0 1px rgba(0,0,0,0.035), 0 6px 28px rgba(15,23,42,0.09), 0 1.5px 6px rgba(15,23,42,0.04)',
          animation:'cardIn 0.45s cubic-bezier(0.22,1,0.36,1) 0.06s both',
        }}>
          {success ? (
            <div style={{ textAlign:'center', padding:'8px 0' }}>
              <div style={{ width:'58px', height:'58px', borderRadius:'50%',
                background:'linear-gradient(135deg, #2563eb, #0284c7)',
                display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px',
                boxShadow:'0 0 32px rgba(37,99,235,0.35)' }}>
                <CheckCircle2 size={26} color="#fff" />
              </div>
              <h2 style={{ fontSize:'20px', fontWeight:700, letterSpacing:'-0.025em', color: isDark?'#f1f5f9':'#0f172a', marginBottom:'8px' }}>Check your email</h2>
              <p style={{ fontSize:'13.5px', color: isDark?'rgba(255,255,255,0.42)':'#64748b', lineHeight:1.65, marginBottom:'6px' }}>
                If an account exists for
              </p>
              <p style={{ fontSize:'13.5px', fontWeight:600, color: isDark?'rgba(255,255,255,0.78)':'#0f172a', marginBottom:'12px' }}>{email}</p>
              <p style={{ fontSize:'13.5px', color: isDark?'rgba(255,255,255,0.42)':'#64748b', lineHeight:1.65, marginBottom:'22px' }}>
                you'll receive a reset link shortly. Check your spam folder too.
              </p>
              <button onClick={onBack}
                style={{ fontSize:'13px', fontWeight:500, color:'#3b82f6', background:'none', border:'none', cursor:'pointer', padding:0, transition:'color 0.12s' }}
                onMouseEnter={e => e.currentTarget.style.color='#60a5fa'}
                onMouseLeave={e => e.currentTarget.style.color='#3b82f6'}>
                ← Back to sign in
              </button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom:'22px' }}>
                <h1 style={{ fontSize:'21px', fontWeight:700, letterSpacing:'-0.028em', margin:'0 0 5px', color: isDark?'#f1f5f9':'#0f172a', lineHeight:1.2 }}>
                  Reset password.
                </h1>
                <p style={{ fontSize:'13.5px', color: isDark?'rgba(255,255,255,0.38)':'#94a3b8', margin:0 }}>
                  Enter your email and we'll send a reset link.
                </p>
              </div>

              {error && <ErrorBar message={error} className="mb-4" />}

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom:'18px' }}>
                  <label style={{ display:'block', fontSize:'12px', fontWeight:500, letterSpacing:'0.01em', color: isDark?'rgba(255,255,255,0.48)':'#64748b', marginBottom:'6px' }}>Email</label>
                  <input type="email" value={email} required autoComplete="email"
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={{ width:'100%', boxSizing:'border-box', outline:'none', fontSize:'14px', transition:'all 0.18s ease',
                      background: isDark?'rgba(255,255,255,0.044)':'rgba(0,0,0,0.024)',
                      border: isDark?'1px solid rgba(255,255,255,0.088)':'1px solid rgba(0,0,0,0.088)',
                      borderRadius:'10px', padding:'10px 13px',
                      color: isDark?'#f1f5f9':'#0f172a' }}
                    onFocus={e => { e.target.style.borderColor='rgba(59,130,246,0.52)'; e.target.style.boxShadow='0 0 0 3px rgba(59,130,246,0.10)'; e.target.style.background=isDark?'rgba(255,255,255,0.06)':'#fff'; }}
                    onBlur={e => { e.target.style.borderColor=isDark?'rgba(255,255,255,0.088)':'rgba(0,0,0,0.088)'; e.target.style.boxShadow='none'; e.target.style.background=isDark?'rgba(255,255,255,0.044)':'rgba(0,0,0,0.024)'; }}
                  />
                </div>

                <button type="submit" disabled={loading}
                  style={{ width:'100%', padding:'11px',
                    background: loading?'rgba(59,130,246,0.45)':'linear-gradient(135deg,#2563eb 0%,#0284c7 100%)',
                    border:'none', borderRadius:'11px', color:'#fff', fontSize:'13.5px', fontWeight:600,
                    cursor: loading?'not-allowed':'pointer', transition:'all 0.18s ease',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:'7px',
                    boxShadow: loading?'none':'0 2px 14px rgba(37,99,235,0.38), 0 1px 3px rgba(37,99,235,0.22)',
                    letterSpacing:'0.01em' }}
                  onMouseEnter={e => { if(!loading){ e.currentTarget.style.transform='translateY(-1.5px)'; e.currentTarget.style.boxShadow='0 8px 28px rgba(37,99,235,0.50), 0 2px 8px rgba(37,99,235,0.28)'; }}}
                  onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=loading?'none':'0 2px 14px rgba(37,99,235,0.38), 0 1px 3px rgba(37,99,235,0.22)'; }}
                  onMouseDown={e => { if(!loading) e.currentTarget.style.transform='scale(0.985)'; }}
                  onMouseUp={e => { if(!loading) e.currentTarget.style.transform='translateY(-1.5px)'; }}>
                  {loading ? <><Loader2 size={14} className="animate-spin"/><span>Sending…</span></> : <span>Send reset link</span>}
                </button>
              </form>

              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'14px', marginTop:'18px' }}>
                <span style={{ fontSize:'11px', color: isDark?'rgba(255,255,255,0.17)':'#cbd5e1', display:'flex', alignItems:'center', gap:'4px' }}>
                  <svg width="10" height="12" viewBox="0 0 10 12" fill="none"><path d="M5 0L0 2.5V6c0 2.485 2 4.5 5 5.5 3-1 5-3.015 5-5.5V2.5L5 0z" fill="currentColor" opacity="0.7"/></svg>
                  256-bit SSL
                </span>
                <span style={{ width:'1px', height:'10px', background: isDark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.06)' }} />
                <span style={{ fontSize:'11px', color: isDark?'rgba(255,255,255,0.17)':'#cbd5e1' }}>We never share your email</span>
              </div>
            </>
          )}
        </div>

        {/* Back link below card */}
        <p style={{ marginTop:'20px', fontSize:'13px', color: isDark?'rgba(255,255,255,0.32)':'#94a3b8', animation:'cardIn 0.45s ease 0.1s both' }}>
          Remember it?{' '}
          <button onClick={onBack}
            style={{ color:'#3b82f6', background:'none', border:'none', cursor:'pointer', fontSize:'13px', padding:0, fontWeight:500, transition:'color 0.12s' }}
            onMouseEnter={e => e.currentTarget.style.color='#60a5fa'}
            onMouseLeave={e => e.currentTarget.style.color='#3b82f6'}>
            Back to sign in →
          </button>
        </p>
      </div>
    </div>
  );
}
