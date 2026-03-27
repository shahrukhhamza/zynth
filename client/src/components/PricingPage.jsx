import { Check } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { BrandMark } from './BrandLogo';

const PLANS = [
  {
    name: 'Free', priceLabel: '0', price: 0,
    desc: 'Start tracking. Discover your patterns.',
    features: [
      'Up to 10 journal entries',
      'Manual trade entry',
      'Basic analytics and charts',
      'Economic calendar',
      'Live market overview',
      '3 free AI analysis tries',
    ],
    cta: 'Start Free — No Card Needed',
    highlight: false,
  },
  {
    name: 'Pro', priceLabel: '5', price: 5,
    badge: 'MOST POPULAR',
    desc: 'For active traders serious about improving their edge.',
    features: [
      'Unlimited journal entries',
      'AI trade analysis (50 analyses / month)',
      'Full economic intelligence',
      'Macro Surprise Score',
      'Live market feeds',
      'Advanced journaling',
      'Behavioral insights',
    ],
    cta: 'Upgrade to Pro',
    highlight: true,
  },
  {
    name: 'Elite', priceLabel: '12', price: 12,
    badge: 'BEST VALUE',
    desc: 'For professional traders who want every possible edge.',
    features: [
      'Everything in Pro',
      'Unlimited AI trade analysis',
      'Custom AI reports',
      'Advanced reports',
      'Priority support',
      'Dedicated email — 4-hour response',
    ],
    cta: 'Go Elite',
    highlight: false,
  },
];

export default function PricingPage({ onBack }) {
  const { isDark } = useTheme();
  const bg     = isDark ? '#0a0a0a' : '#f4f6f9';
  const navBg  = isDark ? 'rgba(10,10,10,0.92)' : 'rgba(244,246,249,0.92)';
  const border = isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0';
  const text   = isDark ? '#f1f5f9' : '#0f172a';
  const muted  = isDark ? '#6b7280' : '#64748b';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bg, color: text }}>

      {/* ── Sticky nav ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        backgroundColor: navBg,
        backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
        borderBottom: `1px solid ${border}`,
      }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BrandMark size={32} />
            <span style={{ fontSize: 16, fontWeight: 800, color: text }}>Zynth</span>
          </div>
          <button
            onClick={() => { if (onBack) { onBack(); } else { window.history.back(); } }}
            style={{ padding: '7px 16px', borderRadius: 10, border: `1px solid ${border}`, background: 'transparent', color: muted, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.color = text)}
            onMouseLeave={e => (e.currentTarget.style.color = muted)}
          >
            ← Back
          </button>
        </div>
      </nav>

      {/* ── Hero heading ── */}
      <div style={{ textAlign: 'center', padding: '64px 24px 48px' }}>
        <h1 style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-0.02em', color: text, marginBottom: 12 }}>
          Simple, transparent pricing
        </h1>
        <p style={{ fontSize: 16, color: muted, maxWidth: 480, margin: '0 auto' }}>
          Start free. Upgrade when you’re ready.
        </p>
      </div>

      {/* ── Plan cards ── */}
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, alignItems: 'start' }}>
          {PLANS.map(plan => {
            const isH        = plan.highlight;
            const cardBg     = isDark ? (isH ? '#111111' : '#141414') : '#ffffff';
            const cardBorder = isH ? '#3b82f6' : (isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0');
            const cardShadow = isH
              ? (isDark ? '0 0 0 1px rgba(59,130,246,0.15), 0 24px 56px rgba(0,0,0,0.55), 0 0 40px rgba(59,130,246,0.10)' : '0 20px 60px rgba(59,130,246,0.14), 0 4px 20px rgba(0,0,0,0.07)')
              : (isDark ? 'none' : '0 4px 16px rgba(0,0,0,0.04)');
            return (
              <div
                key={plan.name}
                style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', border: `${isH ? 2 : 1}px solid ${cardBorder}`, background: cardBg, boxShadow: cardShadow, transform: isH ? 'scale(1.03)' : 'none', transition: 'transform 0.2s ease' }}
                onMouseEnter={e => { if (!isH) e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { if (!isH) e.currentTarget.style.transform = 'none'; }}
              >
                {isH && <div style={{ height: 3, background: 'linear-gradient(90deg, #1d4ed8, #3b82f6, #06b6d4)' }} />}

                {plan.badge && (
                  <div style={{ position: 'absolute', top: isH ? 20 : 16, right: 16 }}>
                    <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 999, fontSize: 10, fontWeight: 800, color: '#fff', background: isH ? 'linear-gradient(90deg,#f59e0b,#ef4444)' : 'linear-gradient(90deg,#3b82f6,#6366f1)' }}>
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div style={{ padding: 28 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4, color: isH ? (isDark ? '#60a5fa' : '#2563eb') : text }}>
                    {plan.name}
                  </h3>
                  <p style={{ fontSize: 13, color: muted, marginBottom: 24 }}>{plan.desc}</p>

                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, marginBottom: 6 }}>
                    <span style={{ fontSize: 15, fontWeight: 500, color: muted, marginBottom: 10 }}>$</span>
                    <span style={{ fontSize: isH ? 58 : 44, fontWeight: 900, lineHeight: 1, color: text }}>{plan.priceLabel}</span>
                    <span style={{ fontSize: 13, color: muted, marginBottom: 8 }}>/mo</span>
                  </div>
                  <p style={{ fontSize: 11, color: isDark ? '#374151' : '#94a3b8', marginBottom: 20 }}>
                    {plan.price === 0 ? 'Free forever' : 'Billed monthly'}
                  </p>

                  <div style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9'}`, marginBottom: 20 }} />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                    {plan.features.map(f => (
                      <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isH ? (isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.09)') : (isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9') }}>
                          <Check size={11} style={{ color: isH ? '#3b82f6' : (isDark ? '#6b7280' : '#64748b') }} />
                        </div>
                        <span style={{ fontSize: 13, lineHeight: 1.5, color: isDark ? '#d1d5db' : '#374151' }}>{f}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => { if (onBack) onBack(); else window.location.href = '/'; }}
                    style={{ width: '100%', padding: '13px 0', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'filter 0.15s', ...(isH ? { background: 'linear-gradient(135deg,#1d4ed8,#0284c7)', color: '#fff', border: 'none', boxShadow: '0 4px 20px rgba(59,130,246,0.35)' } : isDark ? { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#e2e8f0' } : { background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b' }) }}
                    onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.1)')}
                    onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(1)')}
                  >
                    {plan.cta}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Footer notes ── */}
        <div style={{ marginTop: 48, paddingBottom: 48, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 13, color: muted }}>Billed monthly. Cancel anytime.</p>
          <div style={{ display: 'flex', gap: 20 }}>
            <a href="/terms"   style={{ fontSize: 12, color: muted, textDecoration: 'none' }}>Terms</a>
            <a href="/privacy" style={{ fontSize: 12, color: muted, textDecoration: 'none' }}>Privacy</a>
            <a href="/refund"  style={{ fontSize: 12, color: muted, textDecoration: 'none' }}>Refund Policy</a>
          </div>
        </div>

        <p style={{ fontSize: 12, color: isDark ? '#374151' : '#94a3b8', textAlign: 'center', paddingBottom: 48 }}>
          Zynth is an analytics tool and does not provide financial advice.
        </p>
      </div>
    </div>
  );
}
