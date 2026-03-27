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
          <p>At Zynth, we aim to provide a high-quality experience for all users.</p>

          {/* 7-Day Guarantee callout */}
          <div style={{ padding: '22px 24px', borderRadius: 14, background: isDark ? 'rgba(22,163,74,0.07)' : 'rgba(22,163,74,0.05)', border: `1px solid ${isDark ? 'rgba(22,163,74,0.25)' : 'rgba(22,163,74,0.2)'}` }}>
            <p style={{ margin: '0 0 10px', fontWeight: 800, fontSize: 17, color: isDark ? '#4ade80' : '#16a34a' }}>7-Day Money-Back Guarantee</p>
            <p style={{ margin: 0 }}>If you are not satisfied with your subscription, you may request a full refund within <strong style={{ color: isDark ? '#e2e8f0' : '#0f172a' }}>7 days</strong> of your initial payment.</p>
          </div>

          {/* Eligibility */}
          <div>
            <p style={{ fontWeight: 700, color: isDark ? '#e2e8f0' : '#0f172a', marginBottom: 8 }}>Eligibility</p>
            <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li>Refunds are only available for first-time subscriptions within the 7-day period.</li>
              <li>Refund requests submitted after 7 days are not eligible.</li>
            </ul>
          </div>

          {/* Abuse Prevention */}
          <div>
            <p style={{ fontWeight: 700, color: isDark ? '#e2e8f0' : '#0f172a', marginBottom: 8 }}>Abuse Prevention</p>
            <p style={{ margin: '0 0 8px' }}>To maintain fairness, Zynth reserves the right to deny refund requests in cases of abuse, including but not limited to:</p>
            <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li>Repeated subscription and refund attempts</li>
              <li>Excessive usage of premium features (such as AI analysis) followed by refund requests</li>
            </ul>
          </div>

          {/* Billing and Cancellation */}
          <div>
            <p style={{ fontWeight: 700, color: isDark ? '#e2e8f0' : '#0f172a', marginBottom: 8 }}>Billing and Cancellation</p>
            <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li>All subscriptions are billed in advance on a recurring monthly basis.</li>
              <li>You may cancel your subscription at any time.</li>
              <li>After cancellation, you will retain access until the end of your current billing period.</li>
              <li>No partial refunds are provided for unused time beyond the refund window.</li>
            </ul>
          </div>

          {/* Payment Processing */}
          <div>
            <p style={{ fontWeight: 700, color: isDark ? '#e2e8f0' : '#0f172a', marginBottom: 8 }}>Payment Processing</p>
            <p style={{ margin: 0 }}>Payments are submitted through Zynth's secure in-app payment flow and verified manually. Zynth does not store card details, and uploaded payment proof is used only for verification and account activation.</p>
          </div>

          {/* Refund Processing */}
          <div>
            <p style={{ fontWeight: 700, color: isDark ? '#e2e8f0' : '#0f172a', marginBottom: 8 }}>Refund Processing</p>
            <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li>Approved refunds are typically processed within 3–5 business days.</li>
              <li>The time it takes for funds to appear in your account may vary depending on your payment provider.</li>
            </ul>
          </div>

          {/* How to Request */}
          <div style={{ padding: '20px 24px', borderRadius: 12, background: isDark ? 'rgba(59,130,246,0.07)' : 'rgba(59,130,246,0.05)', border: `1px solid ${isDark ? 'rgba(59,130,246,0.18)' : 'rgba(59,130,246,0.15)'}` }}>
            <p style={{ margin: '0 0 6px', fontWeight: 700, color: isDark ? '#93c5fd' : '#2563eb' }}>How to Request a Refund</p>
            <p style={{ margin: '0 0 10px' }}>Email us at <a href="mailto:getzynth@gmail.com" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>getzynth@gmail.com</a></p>
            <p style={{ margin: '0 0 4px', fontSize: 13, color: muted }}><strong style={{ color: isDark ? '#d1d5db' : '#374151' }}>Subject:</strong> Refund Request</p>
            <p style={{ margin: 0, fontSize: 13, color: muted }}><strong style={{ color: isDark ? '#d1d5db' : '#374151' }}>Include:</strong> your registered email address</p>
            <p style={{ margin: '10px 0 0', fontSize: 13, color: muted }}>We typically respond within 1–2 business days.</p>
          </div>

          <p style={{ padding: '16px 20px', borderRadius: 10, background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', border: `1px solid ${border}`, fontSize: 13, color: muted, margin: 0 }}>
            Zynth is an analytics platform and does not provide financial advice.
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
