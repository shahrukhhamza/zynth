import { X, Check, Lock, Zap, Crown, Sparkles, Shield } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 'Free',
    priceNote: 'forever',
    color: '#6b7280',
    gradientFrom: '#374151',
    gradientTo: '#1f2937',
    badgeColor: 'rgba(107,114,128,0.2)',
    badgeText: '#9ca3af',
    icon: Shield,
    current: true,
    locked: false,
    features: [
      'Real-time news feed',
      'Economic calendar',
      'Basic market charts',
      '1 trading account',
      'Standard support',
    ],
    missing: [
      'MT5 trade analytics',
      'AI-powered insights',
      'Advanced alerts',
      'API access',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$29',
    priceNote: '/ month',
    color: '#3b82f6',
    gradientFrom: '#1e3a5f',
    gradientTo: '#1e2d4a',
    badgeColor: 'rgba(59,130,246,0.2)',
    badgeText: '#60a5fa',
    icon: Zap,
    current: false,
    locked: true,
    comingSoon: false,
    features: [
      'Everything in Basic',
      'MT5 trade analytics',
      'AI-powered market insights',
      'Advanced performance charts',
      'Up to 5 trading accounts',
      'Priority email support',
      'Custom news filters',
    ],
    missing: [
      'API access',
      'White-label exports',
    ],
  },
  {
    id: 'elite',
    name: 'Elite',
    price: '$79',
    priceNote: '/ month',
    color: '#f59e0b',
    gradientFrom: '#3d2a0a',
    gradientTo: '#2a1d07',
    badgeColor: 'rgba(245,158,11,0.2)',
    badgeText: '#fbbf24',
    icon: Crown,
    current: false,
    locked: true,
    comingSoon: true,
    features: [
      'Everything in Pro',
      'Unlimited trading accounts',
      'Full REST API access',
      'Advanced AI risk scoring',
      'Custom alert automations',
      'White-label PDF exports',
      'Dedicated account manager',
      '24/7 priority support',
    ],
    missing: [],
  },
];

export default function ProfileModal({ onClose }) {
  const theme = useTheme();
  const { user } = useAuth();

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full rounded-2xl overflow-hidden"
        style={{
          backgroundColor: theme.surface,
          border: `1px solid ${theme.border}`,
          maxWidth: '860px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: theme.border, background: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
            >
              <Shield className="w-4.5 h-4.5 text-white w-5 h-5" style={{ color: '#fff' }} />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: theme.text }}>My Profile</h2>
              <p className="text-xs" style={{ color: theme.muted }}>Manage your account and subscription</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: theme.muted }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {/* User info card */}
          <div
            className="flex items-center gap-4 p-4 rounded-xl mb-6"
            style={{ background: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', border: `1px solid ${theme.border}` }}
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-14 h-14 rounded-xl object-cover" />
            ) : (
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-2xl font-bold select-none flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)' }}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold truncate" style={{ color: theme.text }}>{user?.name}</p>
              <p className="text-sm truncate" style={{ color: theme.muted }}>{user?.email}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold"
                  style={{ backgroundColor: 'rgba(107,114,128,0.15)', color: '#9ca3af' }}
                >
                  <Shield className="w-3 h-3" />
                  Basic Plan
                </span>
                <span className="text-xs" style={{ color: theme.muted }}>·</span>
                <span className="text-xs" style={{ color: theme.muted }}>Member since {new Date().getFullYear()}</span>
              </div>
            </div>
          </div>

          {/* Plans heading */}
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4" style={{ color: '#f59e0b' }} />
            <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: theme.text }}>
              Subscription Plans
            </h3>
          </div>

          {/* Plan cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PLANS.map(plan => {
              const Icon = plan.icon;
              return (
                <div
                  key={plan.id}
                  className="relative rounded-xl overflow-hidden flex flex-col"
                  style={{
                    border: plan.current
                      ? `1.5px solid ${plan.color}60`
                      : `1px solid ${theme.border}`,
                    background: theme.isDark
                      ? `linear-gradient(160deg, ${plan.gradientFrom}80 0%, ${plan.gradientTo}40 100%)`
                      : 'rgba(0,0,0,0.02)',
                    opacity: plan.locked ? 0.85 : 1,
                  }}
                >
                  {/* Current badge */}
                  {plan.current && (
                    <div
                      className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{ backgroundColor: `${plan.color}25`, color: plan.color, border: `1px solid ${plan.color}40` }}
                    >
                      Current
                    </div>
                  )}

                  {/* Coming soon badge */}
                  {plan.comingSoon && (
                    <div
                      className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}
                    >
                      Soon
                    </div>
                  )}

                  <div className="p-4 flex-1">
                    {/* Icon + name */}
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: plan.badgeColor }}
                      >
                        <Icon className="w-4 h-4" style={{ color: plan.badgeText }} />
                      </div>
                      <div>
                        <p className="text-sm font-bold" style={{ color: theme.text }}>{plan.name}</p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-4">
                      <span className="text-2xl font-black" style={{ color: plan.current ? plan.color : theme.text }}>
                        {plan.price}
                      </span>
                      <span className="text-xs ml-1" style={{ color: theme.muted }}>{plan.priceNote}</span>
                    </div>

                    {/* Feature list */}
                    <ul className="space-y-1.5 mb-3">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-start gap-2 text-xs" style={{ color: theme.text }}>
                          <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: plan.color }} />
                          {f}
                        </li>
                      ))}
                      {plan.missing.map(f => (
                        <li key={f} className="flex items-start gap-2 text-xs" style={{ color: theme.muted, opacity: 0.5 }}>
                          <X className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA */}
                  <div className="px-4 pb-4">
                    {plan.current ? (
                      <div
                        className="w-full py-2 rounded-lg text-center text-xs font-semibold"
                        style={{ backgroundColor: `${plan.color}15`, color: plan.color, border: `1px solid ${plan.color}30` }}
                      >
                        Active Plan
                      </div>
                    ) : (
                      <button
                        disabled
                        className="w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed"
                        style={{
                          backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                          color: theme.muted,
                          border: `1px solid ${theme.border}`,
                        }}
                      >
                        <Lock className="w-3 h-3" />
                        {plan.comingSoon ? 'Coming Soon' : 'Upgrade — Coming Soon'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-center text-xs mt-4" style={{ color: theme.muted }}>
            Paid plans coming soon. You'll be notified when they launch.
          </p>
        </div>
      </div>
    </div>
  );
}
