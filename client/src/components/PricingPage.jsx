import { useTheme } from '../contexts/ThemeContext'
import { BrandMark } from './BrandLogo'

function PriceCard({ title, price, features, ctaLabel, accent = 'blue' }) {
  const theme = useTheme();
  const bg = theme.isDark ? theme.surface : '#fff';
  const text = theme.text;
  const muted = theme.muted;
  const accentColor = accent === 'blue' ? '#3b82f6' : (accent === 'green' ? '#10b981' : '#f59e0b');

  return (
    <div style={{ background: bg, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: text }}>{title}</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: accentColor }}>{price}</div>
        </div>
      </div>
      <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, color: muted, fontSize: 13 }}>
        {features.map((f, i) => <li key={i}>• {f}</li>)}
      </ul>
      <div style={{ marginTop: 'auto' }}>
        <button style={{ width: '100%', padding: '10px 12px', borderRadius: 10, background: accentColor, color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer' }}>{ctaLabel}</button>
      </div>
    </div>
  )
}

export default function PricingPage({ onBack }) {
  const theme = useTheme();
  const isDark = theme.isDark;

  const plans = [
    {
      title: 'Free', price: '$0/mo', accent: 'green', cta: 'Start Free', features: [
        'Up to 10 journal entries',
        'Manual trade entry',
        'Basic analytics',
        'Economic calendar',
        '3 free AI analysis tries'
      ]
    },
    {
      title: 'Pro', price: '~$5/mo', accent: 'blue', cta: 'Upgrade to Pro', features: [
        'Unlimited journal entries',
        'AI trade analysis (monthly limit)',
        'Full economic intelligence',
        'Behavioral insights'
      ]
    },
    {
      title: 'Elite', price: '~$12/mo', accent: 'amber', cta: 'Go Elite', features: [
        'Everything in Pro',
        'Unlimited AI analysis',
        'Advanced reports',
        'Priority support'
      ]
    }
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, color: theme.text }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 50, backgroundColor: theme.surface, borderBottom: `1px solid ${theme.border}` }}> 
        <div style={{ maxWidth: 980, margin: '0 auto', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BrandMark size={36} />
            <div style={{ fontSize: 16, fontWeight: 800 }}>Zynth</div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <button onClick={() => onBack ? onBack() : window.history.back()} style={{ padding: '8px 12px', borderRadius: 10, border: `1px solid ${theme.border}`, background: 'transparent', color: theme.text }}>Back</button>
          </div>
        </div>
      </div>

      <main style={{ maxWidth: 980, margin: '0 auto', padding: '40px 20px 80px' }}>
        <header style={{ marginBottom: 18 }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: theme.text, marginBottom: 6 }}>Simple, transparent pricing</h1>
          <p style={{ fontSize: 15, color: theme.muted }}>Start free. Upgrade when you’re ready.</p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginTop: 18 }}>
          {plans.map(p => (
            <PriceCard key={p.title} title={p.title} price={p.price} features={p.features} ctaLabel={p.cta} accent={p.accent} />
          ))}
        </div>

        <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ color: theme.muted, fontSize: 13 }}>Billed monthly. Cancel anytime.</div>
          <div style={{ color: theme.muted, fontSize: 13 }}>Zynth is an analytics tool and does not provide financial advice.</div>
        </div>

      </main>
    </div>
  )
}
