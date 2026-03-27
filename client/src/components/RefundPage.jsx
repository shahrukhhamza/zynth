import { useTheme } from '../contexts/ThemeContext';
import { BrandMark } from './BrandLogo';

export default function RefundPage({ onBack }) {
  const { isDark } = useTheme();
  const bg     = isDark ? '#0a0a0a' : '#f4f6f9';
  const navBg  = isDark ? 'rgba(10,10,10,0.92)' : 'rgba(244,246,249,0.92)';
  const border = isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0';
  const text   = isDark ? '#f1f5f9' : '#0f172a';
  const muted  = isDark ? '#6b7280' : '#64748b';
  const prose  = isDark ? '#9ca3af' : '#374151';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bg, color: text }}>

      {/* ── Sticky nav ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        backgroundColor: navBg,
        backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
        borderBottom: `1px solid ${border}`,
      }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => { if (onBack) { onBack(); } else { window.history.back(); } }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: muted, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.color = text)}
            onMouseLeave={e => (e.currentTarget.style.color = muted)}
          >
            ← Back
          </button>
          <div style={{ width: 1, height: 18, backgroundColor: border }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BrandMark size={28} />
            <span style={{ fontSize: 14, fontWeight: 700, color: text }}>Zynth</span>
          </div>
        </div>
      </nav>

      {/* ── Content ── */}
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '56px 24px 100px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: text, marginBottom: 8 }}>Refund Policy</h1>
        <p style={{ fontSize: 13, color: muted, marginBottom: 40 }}>Last updated: March 2026</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontSize: 15, lineHeight: 1.85, color: prose }}>
          <p>At Zynth, we strive to provide a valuable experience for all users.</p>

          {/* 7-Day Guarantee callout */}
          <div style={{ padding: '22px 24px', borderRadius: 14, background: isDark ? 'rgba(22,163,74,0.07)' : 'rgba(22,163,74,0.05)', border: `1px solid ${isDark ? 'rgba(22,163,74,0.25)' : 'rgba(22,163,74,0.2)'}` }}>
            <p style={{ margin: '0 0 10px', fontWeight: 800, fontSize: 17, color: isDark ? '#4ade80' : '#16a34a' }}>7-Day Money Back Guarantee</p>
            <p style={{ margin: 0 }}>If you are not satisfied within the first <strong style={{ color: isDark ? '#e2e8f0' : '#0f172a' }}>7 days</strong> of your subscription, you are eligible for a full refund. No questions asked.</p>
          </div>

          <p>All subscriptions are billed in advance. Due to the nature of digital products, payments are generally non-refundable.</p>

          <p>After 7 days, refunds are not available. You may cancel your subscription anytime and retain access until the end of your billing period.</p>

          <p>Zynth reserves the right to approve or deny refund requests at its sole discretion.</p>

          <div style={{ padding: '20px 24px', borderRadius: 12, background: isDark ? 'rgba(59,130,246,0.07)' : 'rgba(59,130,246,0.05)', border: `1px solid ${isDark ? 'rgba(59,130,246,0.18)' : 'rgba(59,130,246,0.15)'}` }}>
            <p style={{ margin: 0, fontWeight: 600, color: isDark ? '#93c5fd' : '#2563eb', marginBottom: 6 }}>How to request a refund</p>
            <p style={{ margin: 0 }}>Email us at <a href="mailto:getzynth@gmail.com" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>getzynth@gmail.com</a> with the subject line <em>Refund Request</em> and include your registered email address. We respond within 1–2 business days.</p>
          </div>

          <p style={{ padding: '16px 20px', borderRadius: 10, background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', border: `1px solid ${border}`, fontSize: 13, color: muted, margin: 0 }}>
            Zynth is an analytics tool and does not provide financial advice.
          </p>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 64, paddingTop: 24, borderTop: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 12, color: isDark ? '#374151' : '#94a3b8' }}>&copy; 2026 Zynth. All rights reserved.</p>
          <div style={{ display: 'flex', gap: 16 }}>
            <a href="/terms"    style={{ fontSize: 12, color: muted, textDecoration: 'none' }}>Terms</a>
            <a href="/privacy"  style={{ fontSize: 12, color: muted, textDecoration: 'none' }}>Privacy</a>
            <a href="/pricing"  style={{ fontSize: 12, color: muted, textDecoration: 'none' }}>Pricing</a>
          </div>
        </div>
      </main>
    </div>
  );
}
