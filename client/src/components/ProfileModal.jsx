import { useState, useEffect, useRef } from 'react';
import { X, Check, ChevronDown, Key, LogOut, TrendingUp, Bell, Zap, Camera, Loader2, CheckCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { usePlanGate } from '../hooks/usePlanGate';
import PlanBadge from './PlanBadge';
import ImageCropModal from './ImageCropModal';
import PaymentOptionsModal from './PaymentOptionsModal';
import PricingPlanSelector from './pricing/PricingPlanSelector';
import { API_URL } from '../config/api';
import { DEFAULT_BILLING_CYCLE, DEFAULT_SELECTED_PLAN, getPlanMonthlyLabel } from '../config/pricingPlans';
import { resolveMediaUrl } from '../utils/mediaUrl';
import { setAuthSession } from '../utils/authStorage';

const AVATAR_COLOR_MAP = {
  emerald: '#CA8A04', blue: '#CA8A04', purple: '#8b5cf6', orange: '#f97316',
  rose: '#f43f5e', amber: '#f59e0b', cyan: '#06b6d4', indigo: '#CA8A04',
};

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const PLAN_INFO = {
  free:  { label: 'Basic Plan', sub: 'Free forever',                     color: '#9ca3af' },
  pro:   { label: 'Pro Plan',   sub: getPlanMonthlyLabel('pro'),         color: '#CA8A04' },
  elite: { label: 'Elite Plan', sub: getPlanMonthlyLabel('elite'),       color: '#fbbf24' },
  admin: { label: 'Admin',      sub: 'Full Access',                       color: '#CA8A04' },
};

export default function ProfileModal({ onClose, onForgotPassword }) {
  const theme = useTheme();
  const { user, token, logout, refreshUser } = useAuth();
  const { isPro, isElite, isAdmin, isFree } = usePlanGate();

  const [journalCount, setJournalCount]     = useState('--');
  const [tradingStats, setTradingStats]     = useState(null);
  const [upgradeOpen, setUpgradeOpen]       = useState(false);
  const [selectedPlan, setSelectedPlan]     = useState(DEFAULT_SELECTED_PLAN);
  const [billingCycle, setBillingCycle]     = useState(DEFAULT_BILLING_CYCLE);
  const [paymentPlan, setPaymentPlan]       = useState(null);
  const [pwdStatus, setPwdStatus]           = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUploadDone, setAvatarUploadDone] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState('');
  const [pendingAvatar, setPendingAvatar] = useState(null);
  const [cropSrc, setCropSrc] = useState(null);
  const [avatarError, setAvatarError] = useState(false);
  const accordionRef                        = useRef(null);
  const avatarFileRef                       = useRef(null);

  const aiUsed          = user?.ai_analysis_tries ?? 0;
  const memberYear      = user?.created_at ? new Date(user.created_at).getFullYear() : 2026;

  const planKey = isAdmin ? 'admin' : (isPro ? 'pro' : (isElite ? 'elite' : 'free'));
  const planInfo = PLAN_INFO[planKey];

  const avatarBg   = AVATAR_COLOR_MAP[user?.avatar_color] ?? '#CA8A04';
  const avatarSrc  = user?.avatar_url ? resolveMediaUrl(user.avatar_url) : (user?.avatar ?? null);

  useEffect(() => {
    setAvatarError(false);
  }, [avatarSrc, pendingAvatar]);

  function applyComputedStats(tradesResponse) {
    const trades = Array.isArray(tradesResponse?.data) ? tradesResponse.data : [];
    const totalTrades = Number.isFinite(tradesResponse?.total) ? tradesResponse.total : trades.length;
    const wins = trades.filter(t => t.outcome === 'win').length;
    const totalPnl = trades.reduce((sum, trade) => sum + (Number(trade.profit_loss) || 0), 0);
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : null;

    setJournalCount(totalTrades);
    setTradingStats({
      win_rate: winRate,
      total_pnl: totalPnl,
      total_trades: totalTrades,
    });
  }

  // Fetch journal stats
  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function loadStats() {
      try {
        const statsResponse = await fetch(`${API_URL}/api/journal/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (statsResponse.ok) {
          const data = await statsResponse.json();
          if (cancelled) return;

          if (data.total != null) setJournalCount(data.total);
          if (typeof data.total_trades === 'number') {
            setTradingStats({
              win_rate: data.win_rate ?? null,
              total_pnl: data.total_pnl ?? null,
              total_trades: data.total_trades ?? null,
            });
            return;
          }
        }
      } catch (err) {
        console.error('Journal stats fetch error:', err);
      }

      try {
        const tradesResponse = await fetch(`${API_URL}/api/journal/trades?limit=500&page=0`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!tradesResponse.ok) throw new Error(`Trades fallback failed with ${tradesResponse.status}`);

        const tradesData = await tradesResponse.json();
        if (cancelled) return;
        applyComputedStats(tradesData);
      } catch (err) {
        console.error('Journal trades fallback error:', err);
        if (!cancelled) {
          setJournalCount('--');
          setTradingStats(null);
        }
      }
    }

    loadStats();

    return () => {
      cancelled = true;
    };
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
      setAuthSession(updatedUser, newToken);
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
    {paymentPlan && (
      <PaymentOptionsModal
        plan={paymentPlan}
        billingCycle={billingCycle}
        onClose={() => {
          setPaymentPlan(null);
          setUpgradeOpen(false);
          setSelectedPlan(DEFAULT_SELECTED_PLAN);
          setBillingCycle(DEFAULT_BILLING_CYCLE);
        }}
      />
    )}
    <div
      className="fixed inset-0 z-[100] modal-overlay flex items-end sm:items-center justify-center p-2 sm:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="modal-content relative w-[95%] sm:w-full sm:rounded-2xl overflow-y-auto"
        style={{
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          maxWidth: 460,
          maxHeight: 'min(92vh, calc(100dvh - 16px))',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
        }}
      >
        {/* -- Header -- */}
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

          {/* -- Section 1: Avatar + Info -- */}
          <div className="flex items-start gap-4 mb-5">
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-extrabold select-none overflow-hidden"
                   style={{ background: (pendingAvatar || (avatarSrc && !avatarError)) ? 'transparent' : `linear-gradient(135deg,${avatarBg} 0%,${avatarBg}cc 100%)`, boxShadow: `0 4px 16px ${avatarBg}55` }}>
                {pendingAvatar
                  ? <img src={pendingAvatar} alt="Preview" className="w-full h-full object-cover" />
                  : avatarSrc && !avatarError
                    ? <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" onError={() => setAvatarError(true)} />
                    : (user?.name?.[0] ?? 'U').toUpperCase()}
              </div>
              {/* Camera overlay � hidden while pending */}
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
                <span className="text-[11px]" style={{ color: theme.muted }}>&bull; Member since {memberYear}</span>
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
                      ? <><Loader2 className="w-3 h-3 animate-spin" /> Saving...</>
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

          {/* -- Section 2: Stats Row -- */}
          <div className="grid grid-cols-4 gap-2 mb-5">
            {[
              { label: 'Journal', value: journalCount },
              { label: 'AI Used',  value: aiUsed },
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

          {/* -- Section 3: Current Plan Card -- */}
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
              </div>
            )}
          </div>

          {/* -- Section 4: Upgrade Button + Accordion -- */}
          {isFree && (
            <div className="mb-1">
              <button
                onClick={() => {
                  setUpgradeOpen(o => !o);
                  setSelectedPlan(DEFAULT_SELECTED_PLAN);
                  setBillingCycle(DEFAULT_BILLING_CYCLE);
                }}
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
                    <button onClick={() => {
                      setUpgradeOpen(false);
                      setSelectedPlan(DEFAULT_SELECTED_PLAN);
                      setBillingCycle(DEFAULT_BILLING_CYCLE);
                    }}
                            className="text-[11px] flex items-center gap-1 transition-colors"
                            style={{ color: theme.muted }}
                            onMouseOver={e => e.currentTarget.style.color = theme.text}
                            onMouseOut={e => e.currentTarget.style.color = theme.muted}>
                      <X className="w-3 h-3" /> Close
                    </button>
                  </div>

                  <PricingPlanSelector
                    context="upgrade"
                    mode="compact"
                    selectedPlan={selectedPlan}
                    onSelectPlan={setSelectedPlan}
                    billingCycle={billingCycle}
                    onBillingCycleChange={setBillingCycle}
                    onContinue={() => setPaymentPlan(selectedPlan)}
                    ctaLabel="Continue to Payment"
                  />
                </div>
              </div>
            </div>
          )}

          {divider}

          {/* -- Section 5: Account Settings -- */}
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
                    <p className="text-[14px] font-bold" style={{ color: '#10b981' }}>
                      {tradingStats.win_rate != null ? `${tradingStats.win_rate.toFixed(1)}%` : '--'}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: theme.muted }}>Win Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[14px] font-bold"
                       style={{ color: tradingStats.total_pnl != null && tradingStats.total_pnl >= 0 ? '#10b981' : '#ef4444' }}>
                      {tradingStats.total_pnl != null
                        ? `${tradingStats.total_pnl >= 0 ? '+' : ''}${tradingStats.total_pnl.toFixed(2)}`
                        : '--'}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: theme.muted }}>Total PnL</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[14px] font-bold" style={{ color: theme.text }}>
                      {tradingStats.total_trades ?? '--'}
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
              <span className="text-[12px]" style={{ color: theme.muted }}>Manage in Settings</span>
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
              {pwdStatus === 'sending' ? 'Sending reset email...'
                : pwdStatus === 'sent'   ? `Reset email sent to ${user?.email}`
                : pwdStatus === 'error'  ? 'Failed - try again'
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

