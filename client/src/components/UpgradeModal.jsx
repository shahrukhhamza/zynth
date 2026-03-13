import { useEffect, useState } from 'react';
import { X, Check, Zap, Lock } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const TOTAL_FOUNDING = 100;

const PRO_FEATURES = [
  'AI Trade Analysis: 50/month',
  'Screenshot OCR: 35/month',
  'Unlimited journal entries',
  'Live market feeds',
  'Advanced journaling & charting',
  'Priority support',
];

/**
 * UpgradeModal
 *
 * Props:
 *   open          — boolean
 *   onClose       — () => void
 *   onUpgrade     — () => void  (navigate to /upgrade or open payment flow)
 *   spotsUsed     — number (current user count fetched from /api/admin/stats)
 */
export default function UpgradeModal({ open, onClose, onUpgrade, spotsUsed = 0 }) {
  const theme = useTheme();
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (open) setVisible(true);
  }, [open]);

  if (!visible) return null;

  const spotsLeft = Math.max(0, TOTAL_FOUNDING - spotsUsed);

  function handleClose() {
    setVisible(false);
    onClose?.();
  }

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
    >
      {/* Card wrapper — gradient border via padding trick */}
      <div
        className="relative w-full max-w-lg rounded-2xl p-[1.5px]"
        style={{
          background: 'linear-gradient(135deg, #f59e0b 0%, #059669 50%, #0d9488 100%)',
          boxShadow: '0 40px 120px rgba(0,0,0,0.9), 0 0 60px rgba(16,185,129,0.15)',
        }}
      >
        <div className="rounded-2xl overflow-hidden" style={{ background: theme.surface }}>

          {/* Close */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center transition-colors z-10"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#6b7280' }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#6b7280'; }}
          >
            <X className="w-4 h-4" />
          </button>

          {/* Top bar — fire badge */}
          <div
            className="flex items-center justify-center gap-2 py-2.5 text-[12px] font-bold tracking-wide"
            style={{ background: 'linear-gradient(90deg, rgba(245,158,11,0.18), rgba(16,185,129,0.18))' }}
          >
            <span>🔥</span>
            <span style={{ color: '#fbbf24' }}>LAUNCH DISCOUNT</span>
            <span style={{ color: '#9ca3af' }}>·</span>
            <span style={{ color: '#34d399' }}>FIRST 100 USERS GET 80% OFF</span>
          </div>

          <div className="px-7 pt-6 pb-8">
            {/* Lock icon */}
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 mx-auto"
              style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.15),rgba(16,185,129,0.12))', border: '1px solid rgba(245,158,11,0.3)' }}
            >
              <Lock className="w-7 h-7" style={{ color: '#fbbf24' }} />
            </div>

            {/* Title */}
            <h2 className="text-[24px] font-extrabold text-center text-white mb-2">
              You've used your free tries!
            </h2>
            <p className="text-[14px] text-center mb-7" style={{ color: '#9ca3af' }}>
              Upgrade to <span className="text-emerald-400 font-semibold">Pro</span> to unlock unlimited access
            </p>

            {/* Plan comparison */}
            <div className="grid grid-cols-2 gap-3 mb-7">
              {/* FREE card */}
              <div
                className="rounded-xl p-4 border"
                style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}
              >
                <div className="text-[11px] font-bold tracking-widest mb-3" style={{ color: '#6b7280' }}>
                  FREE (current)
                </div>
                <div className="flex items-end gap-0.5 mb-4">
                  <span className="text-[28px] font-extrabold text-white">$0</span>
                  <span className="text-[12px] mb-1.5" style={{ color: '#6b7280' }}>/mo</span>
                </div>
                {['3 AI analyses/month', '2 screenshot imports/month', 'Basic analytics', 'Community access'].map(f => (
                  <div key={f} className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-600 shrink-0" />
                    <span className="text-[12px]" style={{ color: '#6b7280' }}>{f}</span>
                  </div>
                ))}
              </div>

              {/* PRO card */}
              <div
                className="rounded-xl p-4 border relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg,rgba(16,185,129,0.09),rgba(13,148,136,0.06))', borderColor: 'rgba(16,185,129,0.35)' }}
              >
                {/* Glow */}
                <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full pointer-events-none"
                     style={{ background: 'radial-gradient(circle,rgba(16,185,129,0.25),transparent 70%)' }} />

                <div className="text-[11px] font-bold tracking-widest mb-3" style={{ color: '#34d399' }}>
                  PRO ✦
                </div>
                {/* Price */}
                <div className="mb-1">
                  <span className="text-[13px] line-through" style={{ color: '#6b7280' }}>$9</span>
                  <span className="text-[28px] font-extrabold text-white ml-1.5">$1.99</span>
                  <span className="text-[12px] mb-1.5 ml-0.5" style={{ color: '#9ca3af' }}>/mo</span>
                </div>
                <div className="text-[10px] font-bold mb-4 px-2 py-0.5 rounded-md inline-block"
                     style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>
                  FOUNDING PRICE
                </div>
                {PRO_FEATURES.slice(0, 4).map(f => (
                  <div key={f} className="flex items-start gap-2 mb-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-[12px] text-white">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Spots remaining */}
            <div
              className="flex items-center justify-between px-4 py-2.5 rounded-xl mb-6"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
            >
              <span className="text-[12px] font-semibold" style={{ color: '#fbbf24' }}>
                🔥 Founding member offer
              </span>
              <span className="text-[12px] font-bold" style={{ color: '#f59e0b' }}>
                Only{' '}
                <span className="text-white text-[14px]">{spotsLeft}</span>
                {' '}spots left at $1.99
              </span>
            </div>

            {/* CTA */}
            <button
              onClick={onUpgrade}
              className="w-full py-4 rounded-xl text-[15px] font-bold text-white transition-all hover:brightness-110"
              style={{
                background: 'linear-gradient(135deg,#059669 0%,#0d9488 100%)',
                boxShadow: '0 4px 24px rgba(16,185,129,0.4)',
              }}
            >
              <Zap className="w-4 h-4 inline mr-2 -mt-0.5" />
              Upgrade to Pro — $1.99/month
            </button>

            {/* Dismiss */}
            <button
              onClick={handleClose}
              className="w-full mt-3 text-[13px] transition-colors"
              style={{ color: '#4b5563' }}
              onMouseOver={e => { e.currentTarget.style.color = '#9ca3af'; }}
              onMouseOut={e => { e.currentTarget.style.color = '#4b5563'; }}
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
