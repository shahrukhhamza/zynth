import { useState, useEffect, useRef } from 'react';
import { X, Check, Copy, CheckCheck, ChevronDown, Moon, Sun, Mail, Key, LogOut } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { usePlanGate } from '../hooks/usePlanGate';
import PlanBadge from './PlanBadge';
import { API_URL } from '../config/api';

const SUPPORT_EMAIL = 'shahrukhhamza770@gmail.com';

const UPGRADE_PLANS = [
  {
    id: 'pro',
    name: 'Pro',
    price: '$1.99',
    priceNote: '/month',
    badge: '🔥 Founding Member',
    badgeStyle: { background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' },
    features: [
      'Unlimited journal entries',
      'AI-powered trade analysis',
      'Full Economic Intelligence',
      'Macro Surprise Score',
      'Screenshot & OCR analysis',
      'Live market feeds',
      'Advanced journaling',
      'Priority support',
    ],
    color: '#059669',
    glowColor: 'rgba(5,150,105,0.25)',
  },
  {
    id: 'elite',
    name: 'Elite',
    price: '$4.99',
    priceNote: '/month',
    badge: '👑 Best Value',
    badgeStyle: { background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' },
    features: [
      'Everything in Pro',
      'Custom AI reports',
      'Dedicated support',
      'Early access to new features',
      'Direct founder support on WhatsApp',
      'API access (coming soon)',
    ],
    color: '#f59e0b',
    glowColor: 'rgba(245,158,11,0.2)',
  },
];

const PLAN_INFO = {
  free:  { label: 'Free Plan',  sub: 'Free forever',                     color: '#9ca3af' },
  pro:   { label: 'Pro Plan',   sub: '$1.99/month (Founding Member 🔥)', color: '#34d399' },
  elite: { label: 'Elite Plan', sub: '$4.99/month (Best Value 👑)',        color: '#fbbf24' },
  admin: { label: 'Admin',      sub: 'Full Access',                       color: '#a78bfa' },
};

export default function ProfileModal({ onClose, onForgotPassword }) {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { isPro, isElite, isAdmin, isFree } = usePlanGate();

  const [journalCount, setJournalCount]     = useState('—');
  const [upgradeOpen, setUpgradeOpen]       = useState(false);
  const [selectedPlan, setSelectedPlan]     = useState(null);
  const [emailCopied, setEmailCopied]       = useState(false);
  const [pwdStatus, setPwdStatus]           = useState(null); // null | 'sending' | 'sent' | 'error'
  const accordionRef                        = useRef(null);

  const aiUsed          = user?.ai_analysis_tries ?? 0;
  const screenshotUsed  = user?.screenshot_tries ?? 0;
  const memberYear      = user?.created_at ? new Date(user.created_at).getFullYear() : 2026;

  const planKey = isAdmin ? 'admin' : (isPro ? 'pro' : (isElite ? 'elite' : 'free'));
  const planInfo = PLAN_INFO[planKey];

  // Fetch journal stats
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    fetch(`${API_URL}/api/journal/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.total != null) setJournalCount(d.total); })
      .catch(() => {});
  }, []);

  function handleCopyEmail() {
    navigator.clipboard.writeText(SUPPORT_EMAIL).then(() => {
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2000);
    });
  }

  async function handleChangePassword() {
    if (!user?.email) return;
    setPwdStatus('sending');
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });
      setPwdStatus(res.ok ? 'sent' : 'error');
    } catch {
      setPwdStatus('error');
    }
  }

  const divider = (
    <div className="my-4" style={{ borderTop: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.08)' }} />
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full sm:rounded-2xl overflow-y-auto"
        style={{
          background: isDark ? '#07090f' : '#ffffff',
          border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e5e7eb',
          maxWidth: 460,
          maxHeight: '92vh',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
        }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4"
             style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e5e7eb' }}>
          <h2 className="text-[15px] font-bold" style={{ color: isDark ? '#fff' : '#111' }}>My Profile</h2>
          <button onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  style={{ color: isDark ? '#6b7280' : '#9ca3af' }}
                  onMouseOver={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-5">

          {/* ── Section 1: Avatar + Info ── */}
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-extrabold select-none shrink-0"
                 style={{ background: 'linear-gradient(135deg,#059669 0%,#0d9488 100%)', boxShadow: '0 4px 16px rgba(5,150,105,0.35)' }}>
              {(user?.name?.[0] ?? 'U').toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[17px] font-bold truncate" style={{ color: isDark ? '#fff' : '#111' }}>{user?.name ?? 'User'}</p>
              <p className="text-[12px] truncate mb-1.5" style={{ color: isDark ? '#6b7280' : '#9ca3af' }}>{user?.email}</p>
              <div className="flex items-center gap-2">
                <PlanBadge />
                <span className="text-[11px]" style={{ color: isDark ? '#4b5563' : '#9ca3af' }}>· Member since {memberYear}</span>
              </div>
            </div>
          </div>

          {/* ── Section 2: Stats Row ── */}
          <div className="grid grid-cols-4 gap-2 mb-5">
            {[
              { label: 'Journal', value: journalCount },
              { label: 'AI Used',  value: aiUsed },
              { label: 'OCR Used', value: screenshotUsed },
              { label: 'Year',     value: memberYear },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl p-2.5 text-center"
                   style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e5e7eb' }}>
                <p className="text-[16px] font-bold" style={{ color: isDark ? '#fff' : '#111' }}>{value}</p>
                <p className="text-[10px] mt-0.5" style={{ color: isDark ? '#6b7280' : '#9ca3af' }}>{label}</p>
              </div>
            ))}
          </div>

          {divider}

          {/* ── Section 3: Current Plan Card ── */}
          <div className="rounded-xl p-4 mb-3"
               style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : '#e5e7eb'}` }}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-[13px] font-bold" style={{ color: planInfo.color }}>{planInfo.label}</p>
                <p className="text-[11px] mt-0.5" style={{ color: isDark ? '#6b7280' : '#9ca3af' }}>{planInfo.sub}</p>
              </div>
              <PlanBadge />
            </div>

            {/* Free usage bars */}
            {isFree && (
              <div className="space-y-2 mt-3">
                <div>
                  <div className="flex justify-between text-[11px] mb-1" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                    <span>AI Tries</span>
                    <span>{aiUsed}/3 used</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.07)' : '#e5e7eb' }}>
                    <div className="h-full rounded-full transition-all"
                         style={{ width: `${Math.min(100, (aiUsed / 3) * 100)}%`, background: aiUsed >= 3 ? '#ef4444' : '#059669' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-1" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                    <span>Screenshots</span>
                    <span>{screenshotUsed}/2 used</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.07)' : '#e5e7eb' }}>
                    <div className="h-full rounded-full transition-all"
                         style={{ width: `${Math.min(100, (screenshotUsed / 2) * 100)}%`, background: screenshotUsed >= 2 ? '#ef4444' : '#059669' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Section 4: Upgrade Button + Accordion ── */}
          {isFree && (
            <div className="mb-1">
              <button
                onClick={() => { setUpgradeOpen(o => !o); setSelectedPlan(null); }}
                className="w-full py-3 rounded-xl text-[14px] font-semibold text-white flex items-center justify-center gap-2 transition-all hover:brightness-110"
                style={{ background: 'linear-gradient(135deg,#059669,#0d9488)', boxShadow: '0 4px 16px rgba(5,150,105,0.3)' }}>
                ⚡ Upgrade Plan
                <ChevronDown className="w-4 h-4 transition-transform" style={{ transform: upgradeOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </button>

              {/* Accordion */}
              <div ref={accordionRef}
                   style={{
                     maxHeight: upgradeOpen ? '900px' : '0px',
                     overflow: 'hidden',
                     transition: 'max-height 0.4s cubic-bezier(0.4,0,0.2,1)',
                   }}>
                <div className="pt-4">
                  {/* Dismiss */}
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[12px] font-semibold" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>Choose your plan:</p>
                    <button onClick={() => { setUpgradeOpen(false); setSelectedPlan(null); }}
                            className="text-[11px] flex items-center gap-1 transition-colors"
                            style={{ color: isDark ? '#4b5563' : '#9ca3af' }}
                            onMouseOver={e => e.currentTarget.style.color = '#9ca3af'}
                            onMouseOut={e => e.currentTarget.style.color = isDark ? '#4b5563' : '#9ca3af'}>
                      <X className="w-3 h-3" /> Close
                    </button>
                  </div>

                  {/* Plan cards */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {UPGRADE_PLANS.map(plan => (
                      <div key={plan.id}
                           className="rounded-xl p-4 flex flex-col"
                           style={{
                             background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                             border: selectedPlan === plan.id
                               ? `1.5px solid ${plan.color}`
                               : isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e5e7eb',
                             boxShadow: selectedPlan === plan.id ? `0 0 20px ${plan.glowColor}` : 'none',
                             transition: 'all 0.2s',
                           }}>
                        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 self-start"
                              style={plan.badgeStyle}>
                          {plan.badge}
                        </span>
                        <p className="text-[15px] font-extrabold mb-0.5" style={{ color: isDark ? '#fff' : '#111' }}>
                          {plan.name}
                        </p>
                        <p className="text-[12px] mb-3" style={{ color: plan.color }}>
                          {plan.price}<span className="text-[10px] ml-0.5" style={{ color: isDark ? '#6b7280' : '#9ca3af' }}>{plan.priceNote}</span>
                        </p>
                        <ul className="space-y-1 mb-4 flex-1">
                          {plan.features.map(f => (
                            <li key={f} className="flex items-start gap-1.5 text-[11px]" style={{ color: isDark ? '#d1d5db' : '#374151' }}>
                              <Check className="w-3 h-3 shrink-0 mt-0.5" style={{ color: plan.color }} />
                              {f}
                            </li>
                          ))}
                        </ul>
                        <button
                          onClick={() => setSelectedPlan(selectedPlan === plan.id ? null : plan.id)}
                          className="w-full py-2 rounded-lg text-[12px] font-semibold text-white transition-all hover:brightness-110"
                          style={{ background: `linear-gradient(135deg,${plan.color},${plan.id === 'pro' ? '#0d9488' : '#d97706'})` }}>
                          {selectedPlan === plan.id ? '✓ Selected' : 'Select'}
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Inline info box after plan selected */}
                  {selectedPlan && (() => {
                    const p = UPGRADE_PLANS.find(x => x.id === selectedPlan);
                    return (
                      <div className="rounded-xl p-4"
                           style={{ background: isDark ? 'rgba(5,150,105,0.08)' : 'rgba(5,150,105,0.05)', border: '1px solid rgba(5,150,105,0.25)' }}>
                        <p className="text-[13px] font-bold text-emerald-400 mb-2">🎉 Great choice!</p>
                        <p className="text-[12px] leading-relaxed mb-3" style={{ color: isDark ? '#d1d5db' : '#374151' }}>
                          To lock in your founding price, email us at{' '}
                          <span className="font-semibold text-emerald-400">{SUPPORT_EMAIL}</span>{' '}
                          with subject{' '}
                          <span className="font-semibold" style={{ color: isDark ? '#fff' : '#111' }}>
                            "{p.name} Upgrade Request"
                          </span>{' '}
                          and we'll activate your account within 24 hours.
                        </p>
                        <div className="flex gap-2">
                          <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(p.name + ' Upgrade Request')}`}
                             className="flex-1 py-2 rounded-lg text-[12px] font-semibold text-white text-center transition-all hover:brightness-110"
                             style={{ background: 'linear-gradient(135deg,#059669,#0d9488)' }}>
                            <Mail className="w-3 h-3 inline mr-1" />
                            Open Email
                          </a>
                          <button onClick={handleCopyEmail}
                                  className="px-3 py-2 rounded-lg text-[12px] font-semibold transition-all"
                                  style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)', color: isDark ? '#9ca3af' : '#6b7280', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb' }}>
                            {emailCopied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {divider}

          {/* ── Section 5: Account Settings ── */}
          <div className="space-y-2">
            {/* Dark / Light toggle */}
            <div className="flex items-center justify-between px-4 py-3 rounded-xl"
                 style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e5e7eb' }}>
              <div className="flex items-center gap-2.5">
                {isDark ? <Moon className="w-4 h-4" style={{ color: '#6b7280' }} /> : <Sun className="w-4 h-4" style={{ color: '#f59e0b' }} />}
                <span className="text-[13px] font-medium" style={{ color: isDark ? '#d1d5db' : '#374151' }}>
                  {isDark ? 'Dark Mode' : 'Light Mode'}
                </span>
              </div>
              <button
                onClick={toggleTheme}
                className="relative w-10 h-5 rounded-full transition-all"
                style={{ background: isDark ? '#059669' : '#d1d5db' }}>
                <span className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all"
                      style={{ left: isDark ? '22px' : '2px' }} />
              </button>
            </div>

            {/* Change Password */}
            <button
              onClick={handleChangePassword}
              disabled={pwdStatus === 'sending' || pwdStatus === 'sent'}
              className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-[13px] font-medium text-left transition-all"
              style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e5e7eb', color: isDark ? '#d1d5db' : '#374151', opacity: pwdStatus === 'sent' ? 0.7 : 1 }}
              onMouseOver={e => { if (pwdStatus !== 'sent') e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'; }}
              onMouseOut={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'}>
              <Key className="w-4 h-4 shrink-0" style={{ color: '#6b7280' }} />
              {pwdStatus === 'sending' ? 'Sending reset email…'
                : pwdStatus === 'sent'   ? `✅ Reset email sent to ${user?.email}!`
                : pwdStatus === 'error'  ? '❌ Failed — try again'
                : '🔑 Change Password'}
            </button>

            {/* Contact Support */}
            <a href={`mailto:${SUPPORT_EMAIL}`}
               className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-[13px] font-medium transition-all"
               style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e5e7eb', color: isDark ? '#d1d5db' : '#374151', textDecoration: 'none', display: 'flex' }}
               onMouseOver={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'}
               onMouseOut={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'}>
              <Mail className="w-4 h-4 shrink-0" style={{ color: '#6b7280' }} />
              📧 Contact Support
            </a>

            {/* Sign Out */}
            <button
              onClick={() => { logout(); onClose(); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-[13px] font-semibold transition-all"
              style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', color: '#ef4444' }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(239,68,68,0.06)'}>
              <LogOut className="w-4 h-4 shrink-0" />
              🚪 Sign Out
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
