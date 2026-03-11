import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, TrendingUp, AlertCircle, CheckCircle2, Loader2, User, Mail, Lock, ArrowRight, Shield, Zap, BarChart2 } from 'lucide-react';

export default function SignupPage({ onSwitchToLogin }) {
  const { register } = useAuth();
  const [form, setForm]       = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const strength = (() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-emerald-500'][strength];
  const strengthText  = ['', 'text-red-400', 'text-yellow-400', 'text-blue-400', 'text-emerald-400'][strength];

  function setField(field, value) { setForm(f => ({ ...f, [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    if (form.password.length < 6)       return setError('Password must be at least 6 characters.');
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password });
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
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

        {/* ── Card ────────────────────────────────────────────── */}
        <div className="rounded-2xl p-px"
             style={{background:'linear-gradient(135deg, rgba(16,185,129,0.22) 0%, rgba(255,255,255,0.05) 50%, rgba(59,130,246,0.10) 100%)', boxShadow:'0 32px 80px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.4)'}}>
          <div className="relative rounded-2xl px-7 py-8 bg-[#0b1322]">

            {/* Top shimmer line */}
            <div className="absolute top-0 left-[15%] right-[15%] h-px"
                 style={{background:'linear-gradient(90deg, transparent, rgba(16,185,129,0.4), transparent)'}} />

            <h2 className="text-[19px] font-semibold text-white">Create your account</h2>
            <p className="text-gray-500 text-[13px] mt-1 mb-6">Start analyzing your trades today</p>

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl px-4 py-3 mb-5"
                   style={{background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.18)'}}>
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <p className="text-red-400 text-[13px]">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Full name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-gray-600 pointer-events-none" />
                  <input
                    type="text"
                    autoComplete="name"
                    value={form.name}
                    onChange={e => setField('name', e.target.value)}
                    required
                    placeholder="John Doe"
                    className="w-full pl-9 pr-4 py-[11px] rounded-xl text-[13px] text-white placeholder-gray-700 bg-[#0d1728] border border-white/[0.06] focus:outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/[0.09] transition-all duration-200"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-gray-600 pointer-events-none" />
                  <input
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={e => setField('email', e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full pl-9 pr-4 py-[11px] rounded-xl text-[13px] text-white placeholder-gray-700 bg-[#0d1728] border border-white/[0.06] focus:outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/[0.09] transition-all duration-200"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-gray-600 pointer-events-none" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={e => setField('password', e.target.value)}
                    required
                    placeholder="Min. 8 characters"
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
                {form.password && (
                  <div className="pt-0.5">
                    <div className="flex gap-1 mb-1">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={`h-[3px] flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColor : 'bg-white/[0.07]'}`} />
                      ))}
                    </div>
                    <p className={`text-[11px] ${strengthText}`}>{strengthLabel} password</p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Confirm password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-gray-600 pointer-events-none" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={form.confirm}
                    onChange={e => setField('confirm', e.target.value)}
                    required
                    placeholder="Re-enter your password"
                    className="w-full pl-9 pr-11 py-[11px] rounded-xl text-[13px] text-white placeholder-gray-700 bg-[#0d1728] border border-white/[0.06] focus:outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/[0.09] transition-all duration-200"
                  />
                  {form.confirm && (
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      {form.password === form.confirm
                        ? <CheckCircle2 className="w-[15px] h-[15px] text-emerald-400" />
                        : <AlertCircle className="w-[15px] h-[15px] text-red-400" />}
                    </span>
                  )}
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
                  ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Creating account…</span></>
                  : <><span>Create account</span><ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" /></>}
              </button>
            </form>

            <p className="text-center text-[13px] text-gray-600 mt-6">
              Already have an account?{' '}
              <button onClick={onSwitchToLogin} className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
                Sign in
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
