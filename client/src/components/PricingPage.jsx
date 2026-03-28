import { Check } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { BrandMark } from './BrandLogo';

const PLANS = [
  {
    name: 'Free',
    priceLabel: '0',
    price: 0,
    desc: 'Start tracking your trades with zero risk.',
    features: [
      'Up to 10 journal entries',
      'Basic analytics dashboard',
      'Economic calendar access',
      '3 AI analyses included',
    ],
    cta: 'Start Free',
    highlight: false,
  },
  {
    name: 'Pro',
    priceLabel: '9',
    price: 9,
    badge: 'Most Popular',
    desc: 'Built for active traders who want faster improvement.',
    features: [
      'Unlimited journal entries',
      '50 AI analyses per month',
      'Full economic intelligence',
      'Macro surprise score',
    ],
    cta: 'Upgrade to Pro',
    highlight: true,
  },
  {
    name: 'Elite',
    priceLabel: '19',
    price: 19,
    badge: 'Best Value',
    desc: 'Everything you need for deep, professional analysis.',
    features: [
      'Everything in Pro',
      'Unlimited AI analyses',
      'Trading DNA profile',
      'Priority support',
    ],
    cta: 'Go Elite',
    highlight: false,
  },
];

function PricingCard({ plan, isDark, border, muted, onCTA }) {
  return (
    <div
      className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
      style={{
        borderColor: plan.highlight ? '#3b82f6' : border,
        boxShadow: plan.highlight
          ? (isDark ? '0 8px 30px rgba(59,130,246,0.24)' : '0 12px 32px rgba(59,130,246,0.16)')
          : 'none',
      }}
    >
      {plan.badge && (
        <div style={{ marginBottom: 12 }}>
          <span
            style={{
              display: 'inline-block',
              padding: '4px 10px',
              borderRadius: 999,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#1d4ed8',
              background: isDark ? 'rgba(59,130,246,0.16)' : 'rgba(59,130,246,0.12)',
              border: `1px solid ${isDark ? 'rgba(59,130,246,0.35)' : 'rgba(59,130,246,0.25)'}`,
            }}
          >
            {plan.badge}
          </span>
        </div>
      )}

      <h3 className="text-[20px] font-extrabold text-gray-900 dark:text-gray-100 mb-1.5">{plan.name}</h3>
      <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">{plan.desc}</p>

      <div style={{ marginBottom: 18 }}>
        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          ${plan.priceLabel}
        </span>
        <span className="text-[13px] text-gray-500 dark:text-gray-400 ml-1">/mo</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 22 }}>
        {plan.features.slice(0, 4).map((feature) => (
          <div key={feature} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                flexShrink: 0,
                marginTop: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isDark ? 'rgba(59,130,246,0.16)' : 'rgba(59,130,246,0.10)',
              }}
            >
              <Check size={10} style={{ color: '#2563eb' }} />
            </div>
            <span className="text-[13px] leading-snug text-gray-700 dark:text-gray-300">{feature}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onCTA}
        className="w-full bg-blue-600 text-white rounded-lg py-2 transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-95 hover:brightness-110"
        style={{ border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
      >
        {plan.cta}
      </button>
    </div>
  );
}

export default function PricingPage({ onBack }) {
  const { isDark } = useTheme();
  const bg = isDark ? '#020617' : '#f4f6f9';
  const navBg = isDark ? 'rgba(10,10,10,0.92)' : 'rgba(244,246,249,0.92)';
  const border = isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0';
  const muted = isDark ? '#6b7280' : '#64748b';

  return (
    <div className="min-h-screen text-gray-900 dark:text-gray-100" style={{ backgroundColor: bg }}>
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backgroundColor: navBg,
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: `1px solid ${border}`,
        }}
      >
        <div
          style={{
            maxWidth: 1080,
            margin: '0 auto',
            padding: '0 16px',
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BrandMark size={32} />
            <span className="text-[16px] font-extrabold text-gray-900 dark:text-gray-100">Zynth</span>
          </div>
          <button
            onClick={() => {
              if (onBack) {
                onBack();
              } else {
                window.history.back();
              }
            }}
            style={{
              padding: '7px 16px',
              borderRadius: 10,
              border: `1px solid ${border}`,
              background: 'transparent',
              color: muted,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = isDark ? '#f1f5f9' : '#0f172a')}
            onMouseLeave={(e) => (e.currentTarget.style.color = muted)}
          >
            ← Back
          </button>
        </div>
      </nav>

      <div style={{ textAlign: 'center', padding: '52px 16px 40px' }}>
        <h1 className="text-[clamp(30px,8vw,40px)] font-black tracking-tight text-gray-900 dark:text-gray-100 mb-3">
          Simple, transparent pricing
        </h1>
        <p className="text-[15px] text-gray-500 dark:text-gray-400 max-w-[480px] mx-auto">
          Choose the plan that fits your trading stage and upgrade anytime.
        </p>
      </div>

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, alignItems: 'start' }}>
          {PLANS.map((plan) => (
            <PricingCard
              key={plan.name}
              plan={plan}
              isDark={isDark}
              border={border}
              muted={muted}
              onCTA={() => {
                if (onBack) onBack();
                else window.location.href = '/';
              }}
            />
          ))}
        </div>

        <div
          style={{
            marginTop: 40,
            paddingBottom: 48,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <p style={{ fontSize: 13, color: muted }}>Billed monthly. Cancel anytime.</p>
          <div style={{ display: 'flex', gap: 20 }}>
            <a href="/terms" style={{ fontSize: 12, color: muted, textDecoration: 'none' }}>Terms</a>
            <a href="/privacy" style={{ fontSize: 12, color: muted, textDecoration: 'none' }}>Privacy</a>
            <a href="/refund" style={{ fontSize: 12, color: muted, textDecoration: 'none' }}>Refund Policy</a>
          </div>
        </div>
      </div>
    </div>
  );
}
