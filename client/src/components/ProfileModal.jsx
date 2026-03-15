import { useState, useEffect, useRef } from 'react';
import { X, Check, Copy, CheckCheck, ChevronDown, Mail, Key, LogOut, TrendingUp, Bell, Zap, Camera, Loader2, CheckCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { usePlanGate } from '../hooks/usePlanGate';
import PlanBadge from './PlanBadge';
import ImageCropModal from './ImageCropModal';
import { API_URL } from '../config/api';

const SUPPORT_EMAIL = 'getzynth@gmail.com';

const AVATAR_COLOR_MAP = {
  emerald: '#10b981', blue: '#3b82f6', purple: '#a855f7', orange: '#f97316',
  rose: '#f43f5e', amber: '#f59e0b', cyan: '#06b6d4', indigo: '#6366f1',
};

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const UPGRADE_PLANS = [
  {
    id: 'pro',
    name: 'Pro',
    price: '$1.99',
    priceNote: '/month',
    badge: 'Founding Member',
    badgeStyle: { background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' },
    features: [
      'Unlimited journal entries',
      'AI Trade Analysis: 50/month',
      'Screenshot OCR: 35/month',
      'Full Economic Intelligence',
      'Macro Surprise Score',
      'Live market feeds',
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
    badge: 'Best Value',
    badgeStyle: { background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' },
    features: [
      'Everything in Pro',
      'Unlimited AI Trade Analysis',
      'Unlimited Screenshot OCR',
      'Custom AI reports',
      'Beta access to new features',
      'Direct founder support on WhatsApp',
      'API access (coming soon)',
    ],
    color: '#f59e0b',
    glowColor: 'rgba(245,158,11,0.2)',
  },
];

const PLAN_INFO = {
  free:  { label: 'Basic Plan', sub: 'Free forever',                     color: '#9ca3af' },
  pro:   { label: 'Pro Plan',   sub: '$1.99/month (Founding Member)', color: '#34d399' },
  elite: { label: 'Elite Plan', sub: '$4.99/month (Best Value)',       color: '#fbbf24' },
  admin: { label: 'Admin',      sub: 'Full Access',                       color: '#a78bfa' },
};

export default function ProfileModal({ onClose, onForgotPassword }) {
  const theme = useTheme();
  const { user, token, logout, refreshUser } = useAuth();
  const { isPro, isElite, isAdmin, isFree } = usePlanGate();

  const [journalCount, setJournalCount]     = useState('—');
  const [tradingStats, setTradingStats]     = useState(null);
  const [upgradeOpen, setUpgradeOpen]       = useState(false);
  const [selectedPlan, setSelectedPlan]     = useState(null);
  const [emailCopied, setEmailCopied]       = useState(false);
  const [pwdStatus, setPwdStatus]           = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUploadDone, setAvatarUploadDone] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState('');
  const [pendingAvatar, setPendingAvatar] = useState(null);
  const [cropSrc, setCropSrc] = useState(null);
  const accordionRef                        = useRef(null);
  const avatarFileRef                       = useRef(null);

  const aiUsed          = user?.ai_analysis_tries ?? 0;
  const screenshotUsed  = user?.screenshot_tries ?? 0;
  const memberYear      = user?.created_at ? new Date(user.created_at).getFullYear() : 2026;

  const planKey = isAdmin ? 'admin' : (isPro ? 'pro' : (isElite ? 'elite' : 'free'));
  const planInfo = PLAN_INFO[planKey];

  const avatarBg   = AVATAR_COLOR_MAP[user?.avatar_color] ?? '#059669';
  const avatarUrl  = user?.avatar_url ? `${API_URL}${user.avatar_url}` : null;

  // Fetch journal stats
  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/journal/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return;
        if (d.total != null) setJournalCount(d.total);
        if (d.win_rate != null || d.total_pnl != null || d.total_trades != null) {
          setTradingStats({
            win_rate:     d.win_rate     ?? null,
            total_pnl:    d.total_pnl    ?? null,
            total_trades: d.total_trades ?? null,
          });
        }
      })
      .catch(err => console.error('Journal stats fetch error:', err));
  }, [token]);

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setAvatarUploadError('Image too large. Max 10MB.');
      return;
    }
    // Read as data URL and open crop modal
    const reader = new FileReader();
    reader.onload = ev => setCropSrc(ev.target.result);
    reader.readAsDataURL(file);
  }

  async function handleCropConfirm(croppedBase64) {
    setCropSrc(null);
    setPendingAvatar(croppedBase64);
    setAvatarUploadError('');
  }

  async function handleSaveAvatar() {
    if (!pendingAvatar) return;
    setAvatarUploading(true);
    setAvatarUploadError('');
    try {
      const res = await fetch(`${API_URL}/api/auth/update-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ avatar_base64: pendingAvatar }),
      });
      if (!res.ok) throw new Error('Upload failed');
      const { user: updatedUser, token: newToken } = await res.json();
      localStorage.setItem('auth_token', newToken);
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
      await refreshUser();
      setPendingAvatar(null);
      setAvatarUploadDone(true);
      setTimeout(() => setAvatarUploadDone(false), 3000);
    } catch {
      setAvatarUploadError('Upload failed. Please try again.');
    } finally {
      setAvatarUploading(false);
    }
  }

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
    <div className="my-4" style={{ borderTop: `1px solid ${theme.border}` }} />
  );

  return (
    <>
    {cropSrc && (
      <ImageCropModal
        imageSrc={cropSrc}
        onConfirm={handleCropConfirm}
        onCancel={() => setCropSrc(null)}
      />
    )}
    <div
      className="fixed inset-0 z-[100] modal-overlay flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="modal-content relative w-full sm:rounded-2xl overflow-y-auto"
        style={{
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          maxWidth: 460,
          maxHeight: '92vh',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
        }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4"
             style={{ borderBottom: `1px solid ${theme.border}` }}>
          <h2 className="text-[15px] font-bold" style={{ color: theme.text }}>My Profile</h2>
          <button onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  style={{ color: theme.muted }}
                  onMouseOver={e => e.currentTarget.style.background = theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-5">

          {/* ── Section 1: Avatar + Info ── */}
          <div className="flex items-start gap-4 mb-5">
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-extrabold select-none overflow-hidden"
                   style={{ background: (pendingAvatar || avatarUrl) ? 'transparent' : `linear-gradient(135deg,${avatarBg} 0%,${avatarBg}cc 100%)`, boxShadow: `0 4px 16px ${avatarBg}55` }}>
                {pendingAvatar
                  ? <img src={pendingAvatar} alt="Preview" className="w-full h-full object-cover" />
                  : avatarUrl
                    ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    : (user?.name?.[0] ?? 'U').toUpperCase()}
              </div>
              {/* Camera overlay — hidden while pending */}
              {!pendingAvatar && (
                <button
                  onClick={() => avatarFileRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-110 disabled:opacity-70"
                  style={{ backgroundColor: theme.accent, color: '#fff' }}
                  title="Change photo"
                >
                  {avatarUploading
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : avatarUploadDone
                      ? <CheckCircle className="w-3 h-3" />
                      : <Camera className="w-3 h-3" />}
                </button>
              )}
              <input ref={avatarFileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[17px] font-bold truncate" style={{ color: theme.text }}>{user?.name ?? 'User'}</p>
              <p className="text-[12px] truncate mb-1.5" style={{ color: theme.muted }}>{user?.email}</p>
              <div className="flex items-center gap-2">
                <PlanBadge />
                <span className="text-[11px]" style={{ color: theme.muted }}>· Member since {memberYear}</span>
              </div>
              {avatarUploadError && (
                <p className="text-[11px] mt-1" style={{ color: theme.danger }}>{avatarUploadError}</p>
              )}
              {/* Pending avatar save/discard row */}
              {pendingAvatar && (
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={handleSaveAvatar}
                    disabled={avatarUploading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                    style={{ backgroundColor: theme.accent }}
                  >
                    {avatarUploading
                      ? <><Loader2 className="w-3 h-3 animate-spin" /> Saving…</>
                      : <><Check className="w-3 h-3" /> Save Photo</>}
                  </button>
                  <button
                    onClick={() => { setPendingAvatar(null); setAvatarUploadError(''); }}
                    disabled={avatarUploading}
                    className="px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors disabled:opacity-60"
                    style={{ borderColor: theme.border, color: theme.muted }}
                  >
                    Discard
                  </button>
                </div>
              )}
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
                   style={{ background: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', border: `1px solid ${theme.border}` }}>
                <p className="text-[16px] font-bold" style={{ color: theme.text }}>{value}</p>
                <p className="text-[10px] mt-0.5" style={{ color: theme.muted }}>{label}</p>
              </div>
            ))}
          </div>

          {divider}

          {/* ── Section 3: Current Plan Card ── */}
          <div className="rounded-xl p-4 mb-3"
               style={{ background: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', border: `1px solid ${theme.border}` }}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-[13px] font-bold" style={{ color: planInfo.color }}>{planInfo.label}</p>
                <p className="text-[11px] mt-0.5" style={{ color: theme.muted }}>{planInfo.sub}</p>
              </div>
              <PlanBadge />
            </div>

            {/* Free usage bars */}
            {isFree && (
              <div className="space-y-2 mt-3">
                <div>
                  <div className="flex justify-between text-[11px] mb-1" style={{ color: theme.muted }}>
                    <span>AI Tries</span>
                    <span>{aiUsed}/3 used</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: theme.border }}>
                    <div className="h-full rounded-full transition-all"
                         style={{ width: `${Math.min(100, (aiUsed / 3) * 100)}%`, background: aiUsed >= 3 ? '#ef4444' : '#059669' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-1" style={{ color: theme.muted }}>
                    <span>Screenshots</span>
                    <span>{screenshotUsed}/2 used</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: theme.border }}>
                    <div className="h-full rounded-full transition-all"
                         style={{ width: `${Math.min(100, (screenshotUsed / 2) * 100)}%`, background: screenshotUsed >= 2 ? '#ef4444' : '#059669' }} />
                  </div>
                </div>
              </div>
            )}
            {/* Pro usage bars */}
            {isPro && (
              <div className="space-y-2 mt-3">
                <div>
                  <div className="flex justify-between text-[11px] mb-1" style={{ color: theme.muted }}>
                    <span>AI Analysis</span>
                    <span>{aiUsed}/50 used</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: theme.border }}>
                    <div className="h-full rounded-full transition-all"
                         style={{ width: `${Math.min(100, (aiUsed / 50) * 100)}%`, background: aiUsed >= 50 ? '#ef4444' : '#059669' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-1" style={{ color: theme.muted }}>
                    <span>Screenshots</span>
                    <span>{screenshotUsed}/35 used</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: theme.border }}>
                    <div className="h-full rounded-full transition-all"
                         style={{ width: `${Math.min(100, (screenshotUsed / 35) * 100)}%`, background: screenshotUsed >= 35 ? '#ef4444' : '#059669' }} />
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
                <Zap className="w-4 h-4" />
                Upgrade Plan
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
                    <p className="text-[12px] font-semibold" style={{ color: theme.muted }}>Choose your plan:</p>
                    <button onClick={() => { setUpgradeOpen(false); setSelectedPlan(null); }}
                            className="text-[11px] flex items-center gap-1 transition-colors"
                            style={{ color: theme.muted }}
                            onMouseOver={e => e.currentTarget.style.color = theme.text}
                            onMouseOut={e => e.currentTarget.style.color = theme.muted}>
                      <X className="w-3 h-3" /> Close
                    </button>
                  </div>

                  {/* Plan cards */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {UPGRADE_PLANS.map(plan => (
                      <div key={plan.id}
                           className="rounded-xl p-4 flex flex-col"
                           style={{
                             background: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                             border: selectedPlan === plan.id
                               ? `1.5px solid ${plan.color}`
                               : `1px solid ${theme.border}`,
                             boxShadow: selectedPlan === plan.id ? `0 0 20px ${plan.glowColor}` : 'none',
                             transition: 'all 0.2s',
                           }}>
                        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 self-start"
                              style={plan.badgeStyle}>
                          {plan.badge}
                        </span>
                        <p className="text-[15px] font-extrabold mb-0.5" style={{ color: theme.text }}>
                          {plan.name}
                        </p>
                        <p className="text-[12px] mb-3" style={{ color: plan.color }}>
                          {plan.price}<span className="text-[10px] ml-0.5" style={{ color: theme.muted }}>{plan.priceNote}</span>
                        </p>
                        <ul className="space-y-1 mb-4 flex-1">
                          {plan.features.map(f => (
                            <li key={f} className="flex items-start gap-1.5 text-[11px]" style={{ color: theme.text }}>
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
                           style={{ background: theme.isDark ? 'rgba(5,150,105,0.08)' : 'rgba(5,150,105,0.05)', border: '1px solid rgba(5,150,105,0.25)' }}>
                        <p className="text-[13px] font-bold text-emerald-400 mb-2">Great choice!</p>
                        <p className="text-[12px] leading-relaxed mb-3" style={{ color: theme.text }}>
                          To lock in your founding price, email us at{' '}
                          <span className="font-semibold text-emerald-400">{SUPPORT_EMAIL}</span>{' '}
                          with subject{' '}
                          <span className="font-semibold" style={{ color: theme.text }}>
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
                                  style={{ background: theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)', color: theme.muted, border: `1px solid ${theme.border}` }}>
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
            {/* Trading Stats */}
            <div className="rounded-xl px-4 py-3"
                 style={{ background: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', border: `1px solid ${theme.border}` }}>
              <div className="flex items-center gap-2.5 mb-2">
                <TrendingUp className="w-4 h-4 shrink-0" style={{ color: theme.muted }} />
                <span className="text-[13px] font-semibold" style={{ color: theme.text }}>My Trading Stats</span>
              </div>
              {tradingStats ? (
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <p className="text-[14px] font-bold" style={{ color: '#34d399' }}>
                      {tradingStats.win_rate != null ? `${tradingStats.win_rate.toFixed(1)}%` : '—'}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: theme.muted }}>Win Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[14px] font-bold"
                       style={{ color: tradingStats.total_pnl != null && tradingStats.total_pnl >= 0 ? '#34d399' : '#ef4444' }}>
                      {tradingStats.total_pnl != null
                        ? `${tradingStats.total_pnl >= 0 ? '+' : ''}${tradingStats.total_pnl.toFixed(2)}`
                        : '—'}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: theme.muted }}>Total PnL</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[14px] font-bold" style={{ color: theme.text }}>
                      {tradingStats.total_trades ?? '—'}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: theme.muted }}>Trades</p>
                  </div>
                </div>
              ) : (
                <p className="text-[12px]" style={{ color: theme.muted }}>No trading data yet.</p>
              )}
            </div>

            {/* Notification Preferences */}
            <button
              onClick={onClose}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-medium text-left transition-all"
              style={{ background: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', border: `1px solid ${theme.border}`, color: theme.text }}
              onMouseOver={e => e.currentTarget.style.opacity = '0.8'}
              onMouseOut={e => e.currentTarget.style.opacity = '1'}>
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 shrink-0" style={{ color: theme.muted }} />
                <span>Notification Preferences</span>
              </div>
              <span className="text-[12px]" style={{ color: theme.muted }}>Manage in Settings →</span>
            </button>

            {/* Change Password */}
            <button
              onClick={handleChangePassword}
              disabled={pwdStatus === 'sending' || pwdStatus === 'sent'}
              className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-[13px] font-medium text-left transition-all"
              style={{ background: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', border: `1px solid ${theme.border}`, color: theme.text, opacity: pwdStatus === 'sent' ? 0.7 : 1 }}
              onMouseOver={e => { if (pwdStatus !== 'sent') e.currentTarget.style.opacity = '0.8'; }}
              onMouseOut={e => e.currentTarget.style.opacity = pwdStatus === 'sent' ? '0.7' : '1'}>
              <Key className="w-4 h-4 shrink-0" style={{ color: theme.muted }} />
              {pwdStatus === 'sending' ? 'Sending reset email…'
                : pwdStatus === 'sent'   ? `Reset email sent to ${user?.email}`
                : pwdStatus === 'error'  ? 'Failed — try again'
                : 'Change Password'}
            </button>

            {/* Sign Out */}
            <button
              onClick={() => { logout(); onClose(); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-[13px] font-semibold transition-all"
              style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', color: '#ef4444' }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(239,68,68,0.06)'}>
              <LogOut className="w-4 h-4 shrink-0" />
              Sign Out
            </button>
          </div>

        </div>
      </div>
    </div>
    </>
  );
}
