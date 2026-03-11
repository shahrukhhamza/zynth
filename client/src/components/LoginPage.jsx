import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, TrendingUp, AlertCircle, Loader2, Mail, Lock, ArrowRight, Shield, Zap, BarChart2 } from 'lucide-react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export default function LoginPage({ onSwitchToSignup }) {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const googleBtnRef              = useRef(null);
  const initializedRef            = useRef(false);

  const handleGoogleCredential = useCallback(async (response) => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle(response.credential);
    } catch (err) {
      setError(err.response?.data?.error || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
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
      if (googleBtnRef.current) {
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'filled_black', size: 'large',
          width: googleBtnRef.current.offsetWidth || 340,
          text: 'continue_with', shape: 'rectangular', logo_alignment: 'center',
        });
      }
      return true;
    }
    if (!initGoogle()) {
      const interval = setInterval(() => { if (initGoogle()) clearInterval(interval); }, 100);
      return () => clearInterval(interval);
    }
  }, [handleGoogleCredential]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#060a12] px-4 py-10">

      {/* Ambient glow — top-center emerald */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[480px]"
           style={{background:'radial-gradient(ellipse at center, rgba(16,185,129,0.16) 0%, transparent 68%)', filter:'blur(2px)'}} />
      {/* Ambient glow — bottom-right blue */}
      <div className="pointer-events-none absolute bottom-0 right-0 w-[480px] h-[360px]"
           style={{background:'radial-gradient(ellipse at bottom right, rgba(59,130,246,0.09) 0%, transparent 65%)'}} />
      {/* Subtle grid */}
      <div className="pointer-events-none absolute inset-0"
           style={{backgroundImage:'linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)', backgroundSize:'48px 48px'}} />

      <div className="relative z-10 w-full max-w-[420px]">

        {/* ── Brand ───────────────────────────────────────────── */}
        <div className="flex flex-col items-center mb-8 select-none">
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-[18px] scale-125 opacity-50"
                 style={{background:'linear-gradient(135deg,#059669,#0d9488)', filter:'blur(18px)'}} />
            <div className="relative w-[60px] h-[60px] rounded-[18px] flex items-center justify-center"
                 style={{background:'linear-gradient(145deg,#059669 0%,#0d9488 100%)', boxShadow:'0 0 0 1px rgba(255,255,255,0.1) inset'}}>
              <TrendingUp className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-[28px] font-bold text-white tracking-tight leading-none">Zynth</h1>
          <p className="text-gray-500 text-[13px] mt-1.5 tracking-wide">Professional Trading Analytics</p>

          <div className="flex items-center gap-4 mt-4 text-[11px] text-gray-600">
            <span className="flex items-center gap-1.5"><Shield className="w-3 h-3 text-emerald-600" />Bank-grade security</span>
            <span className="h-3 w-px bg-gray-800" />
            <span className="flex items-center gap-1.5"><Zap className="w-3 h-3 text-emerald-600" />Real-time data</span>
            <span className="h-3 w-px bg-gray-800" />
            <span className="flex items-center gap-1.5"><BarChart2 className="w-3 h-3 text-emerald-600" />AI-powered</span>
          </div>
        </div>

        {/* ── Card (gradient border wrapper) ──────────────────── */}
        <div className="rounded-2xl p-px"
             style={{background:'linear-gradient(135deg, rgba(16,185,129,0.22) 0%, rgba(255,255,255,0.05) 50%, rgba(59,130,246,0.10) 100%)', boxShadow:'0 32px 80px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.4)'}}>
          <div className="relative rounded-2xl px-7 py-8 bg-[#0b1322]">

            {/* Top shimmer line */}
            <div className="absolute top-0 left-[15%] right-[15%] h-px"
                 style={{background:'linear-gradient(90deg, transparent, rgba(16,185,129,0.4), transparent)'}} />

            <h2 className="text-[19px] font-semibold text-white">Welcome back</h2>
            <p className="text-gray-500 text-[13px] mt-1 mb-6">Sign in to your account to continue</p>

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl px-4 py-3 mb-5"
                   style={{background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.18)'}}>
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <p className="text-red-400 text-[13px]">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-gray-600 pointer-events-none" />
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full pl-9 pr-4 py-[11px] rounded-xl text-[13px] text-white placeholder-gray-700 bg-[#0d1728] border border-white/[0.06] focus:outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/[0.09] transition-all duration-200"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Password</label>
                  <button type="button" className="text-[11px] text-emerald-500 hover:text-emerald-400 transition-colors font-medium">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-gray-600 pointer-events-none" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••"
                    className="w-full pl-9 pr-11 py-[11px] rounded-xl text-[13px] text-white placeholder-gray-700 bg-[#0d1728] border border-white/[0.06] focus:outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/[0.09] transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    tabIndex={-1}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
                  >
                    {showPass ? <EyeOff className="w-[15px] h-[15px]" /> : <Eye className="w-[15px] h-[15px]" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="group w-full flex items-center justify-center gap-2 text-white font-semibold text-[14px] rounded-xl py-[13px] mt-1 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed hover:brightness-110 hover:shadow-[0_8px_30px_rgba(16,185,129,0.35)]"
                style={{background:'linear-gradient(135deg,#059669 0%,#0d9488 100%)', boxShadow:'0 4px 20px rgba(16,185,129,0.22), 0 1px 0 rgba(255,255,255,0.07) inset'}}
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Signing in…</span></>
                  : <><span>Sign in</span><ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" /></>}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-white/[0.05]" />
              <span className="text-[11px] font-semibold text-gray-700 tracking-[0.15em]">OR</span>
              <div className="flex-1 h-px bg-white/[0.05]" />
            </div>

            {/* Google */}
            {GOOGLE_CLIENT_ID ? (
              <div ref={googleBtnRef} className="w-full flex justify-center" style={{minHeight:'44px'}} />
            ) : (
              <button disabled className="w-full flex items-center justify-center gap-2.5 rounded-xl py-[11px] text-[13px] text-gray-600 cursor-not-allowed"
                      style={{background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.05)'}}>
                <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-40 shrink-0">
                  <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115z"/>
                  <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987z"/>
                  <path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21z"/>
                  <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067z"/>
                </svg>
                <span className="opacity-40">Continue with Google</span>
              </button>
            )}

            <p className="text-center text-[13px] text-gray-600 mt-6">
              Don't have an account?{' '}
              <button onClick={onSwitchToSignup} className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
                Create one
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-[11px] text-gray-800 mt-5 tracking-wide">
          256-bit SSL encrypted · © 2026 Zynth
        </p>
      </div>
    </div>
  );
}
