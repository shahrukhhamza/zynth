import { useTheme } from '../contexts/ThemeContext'

export default function RefundPage({ onBack }) {
  const theme = useTheme();
  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, color: theme.text }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 50, backgroundColor: theme.surface, borderBottom: `1px solid ${theme.border}` }}> 
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>Refund Policy</div>
          <div style={{ marginLeft: 'auto' }}>
            <button onClick={() => onBack ? onBack() : window.history.back()} style={{ padding: '8px 12px', borderRadius: 10, border: `1px solid ${theme.border}`, background: 'transparent', color: theme.text }}>Back</button>
          </div>
        </div>
      </div>

      <main style={{ maxWidth: 860, margin: '0 auto', padding: '40px 20px 80px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Refund Policy</h1>
        <p style={{ color: theme.muted, marginBottom: 18 }}>At Zynth, we strive to provide a valuable experience for all users.</p>

        <div style={{ fontSize: 15, color: theme.text, lineHeight: 1.8 }}>
          <p>All subscriptions are billed in advance. Due to the nature of digital products, payments are generally non-refundable.</p>
          <p>However, users may request a refund within 7 days of the initial purchase by contacting support. Each request will be reviewed on a case-by-case basis.</p>
          <p>Zynth reserves the right to approve or deny refund requests at its sole discretion.</p>
          <p>Zynth is an analytics tool and does not provide financial advice.</p>
          <p>For support, contact: <a href="mailto:getzynth@gmail.com" style={{ color: '#3b82f6', textDecoration: 'none' }}>getzynth@gmail.com</a></p>
        </div>
      </main>
    </div>
  )
}
