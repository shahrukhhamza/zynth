import { ArrowLeft, RefreshCw, CreditCard, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getPlanMonthlyLabel } from '../config/pricingPlans';
import { useTheme } from '../contexts/ThemeContext';
import { BrandMark } from './BrandLogo';

function Section({ id, title, children }) {
  const { isDark } = useTheme();
  return (
    <section id={id} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: isDark ? '#FF7A00' : '#FF4D00', marginBottom: 4, borderBottom: `1px solid ${isDark ? 'rgba(255,77,0,0.12)' : 'rgba(255,77,0,0.15)'}`, paddingBottom: 10 }}>
        {title}
      </h2>
      <div style={{ fontSize: 13, color: isDark ? '#9ca3af' : '#4b5563', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {children}
      </div>
    </section>
  );
}

export default function RefundPolicy({ onBack }) {
  const { isDark } = useTheme();
  const proMonthlyPrice = getPlanMonthlyLabel('pro');
  const eliteMonthlyPrice = getPlanMonthlyLabel('elite');

  const handleBack = () => {
    if (onBack) { onBack(); } else { window.history.back(); }
  };

  return (
    <div className={isDark ? '' : 'legal-light'} style={{ backgroundColor: isDark ? '#0B0B0F' : '#f8fafc', minHeight: '100vh', color: isDark ? '#e2e8f0' : '#1e293b' }}>
      <style>{`
        .legal-light strong { color: #0f172a !important; }
        .legal-light ul li { color: #4b5563 !important; }
      `}</style>
      {/* Sticky header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        backgroundColor: isDark ? 'rgba(11,11,15,0.95)' : 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderBottom: isDark ? '1px solid rgba(255,77,0,0.15)' : '1px solid rgba(0,0,0,0.08)',
      }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={handleBack} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b7280', fontSize: 13, cursor: 'pointer', background: 'none', border: 'none', padding: '4px 8px', borderRadius: 6 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#FF7A00')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}>
            <ArrowLeft size={15} /> Back
          </button>
          <div style={{ width: 1, height: 18, backgroundColor: 'rgba(107,114,128,0.4)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <RefreshCw size={16} style={{ color: '#FF7A00' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: isDark ? '#e2e8f0' : '#0f172a' }}>Return &amp; Refund Policy</span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <BrandMark size={28} />
            <span style={{ fontSize: 13, fontWeight: 700, color: isDark ? '#e2e8f0' : '#0f172a' }}>ZYNTH</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px 80px' }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: isDark ? '#f1f5f9' : '#0f172a', marginBottom: 8 }}>Return &amp; Refund Policy</h1>
          <p style={{ fontSize: 13, color: '#6b7280' }}>Last updated: March 2026 &nbsp;·&nbsp; Applies to all paid Zynth subscriptions</p>
        </div>

        {/* Quick summary boxes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 36 }}>
          <div style={{ padding: '16px 18px', borderRadius: 10, backgroundColor: isDark ? 'rgba(16,185,129,0.07)' : 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <CheckCircle2 size={18} style={{ color: '#FF7A00', marginBottom: 8 }} />
            <p style={{ fontSize: 13, fontWeight: 700, color: '#FF7A00', marginBottom: 4 }}>7-Day Money Back</p>
            <p style={{ fontSize: 12, color: isDark ? '#6b7280' : '#64748b', lineHeight: 1.6 }}>New subscribers are eligible for a full refund within 7 days of their first payment.</p>
          </div>
          <div style={{ padding: '16px 18px', borderRadius: 10, backgroundColor: isDark ? 'rgba(245,158,11,0.07)' : 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <CreditCard size={18} style={{ color: '#f59e0b', marginBottom: 8 }} />
            <p style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>Cancel Anytime</p>
            <p style={{ fontSize: 12, color: isDark ? '#6b7280' : '#64748b', lineHeight: 1.6 }}>Cancel your subscription at any time. No lock-in contracts. Access continues until end of billing period.</p>
          </div>
          <div style={{ padding: '16px 18px', borderRadius: 10, backgroundColor: isDark ? 'rgba(239,68,68,0.07)' : 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <AlertCircle size={18} style={{ color: '#ef4444', marginBottom: 8 }} />
            <p style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', marginBottom: 4 }}>Digital Service</p>
            <p style={{ fontSize: 12, color: isDark ? '#6b7280' : '#64748b', lineHeight: 1.6 }}>Zynth is a fully digital service. There are no physical goods to return or ship.</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

          <Section id="overview" title="1. Overview">
            <p>
              Zynth is a digital subscription service providing access to a trading intelligence platform including an AI-powered trade journal, economic data tools, live market feeds, and AI analysis. Because Zynth delivers immediate access to digital services upon payment, our refund policy is designed to be fair while reflecting the nature of digital goods.
            </p>
            <p>This policy applies to all paid subscription plans: <strong style={{ color: '#e2e8f0' }}>Pro</strong> and <strong style={{ color: '#e2e8f0' }}>Elite</strong>. The Free plan is always free and not subject to this policy.</p>
          </Section>

          <Section id="refund-eligibility" title="2. Refund Eligibility">
            <p>You are eligible for a <strong style={{ color: '#FF7A00' }}>full refund</strong> if:</p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>You are a <strong style={{ color: '#e2e8f0' }}>new subscriber</strong> requesting a refund within <strong style={{ color: '#e2e8f0' }}>7 days</strong> of your first payment</li>
              <li>The service was not substantially used (fewer than 5 AI analyses consumed)</li>
              <li>The service was unavailable for more than 24 consecutive hours due to a platform outage on our end</li>
            </ul>
            <p>You may be eligible for a <strong style={{ color: '#f59e0b' }}>partial refund or credit</strong> if:</p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>There was a documented technical issue preventing you from accessing a paid feature for an extended period</li>
              <li>You were charged an incorrect amount due to a billing error on our part</li>
            </ul>
          </Section>

          <Section id="non-refundable" title="3. Non-Refundable Circumstances">
            <p>Refunds will <strong style={{ color: '#f87171' }}>not</strong> be issued in the following cases:</p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>Refund requests made after 7 days from the payment date</li>
              <li>Renewal charges for recurring subscriptions where no refund request was made before the renewal date</li>
              <li>Dissatisfaction with AI-generated analysis, economic data accuracy, or market data (these are information tools, not trading signals)</li>
              <li>Account suspension or termination due to violation of our Terms of Service</li>
              <li>Partially used subscription periods (except in cases of documented service failures)</li>
              <li>Loss of data due to user actions</li>
            </ul>
          </Section>

          <Section id="how-to-request" title="4. How to Request a Refund">
            <p>To request a refund, please contact us within the eligible timeframe:</p>
            <div style={{ backgroundColor: isDark ? 'rgba(255,77,0,0.06)' : 'rgba(255,77,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,77,0,0.15)' : 'rgba(255,77,0,0.2)'}`, borderRadius: 8, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#FF7A00' }}>Contact Zynth Support</p>
              <p style={{ fontSize: 13, color: isDark ? '#9ca3af' : '#4b5563' }}>Email: <a href="mailto:getzynth@gmail.com" style={{ color: '#FF7A00', textDecoration: 'none' }}>getzynth@gmail.com</a></p>
              <p style={{ fontSize: 13, color: isDark ? '#9ca3af' : '#4b5563' }}>Subject line: <em style={{ color: isDark ? '#d1d5db' : '#374151' }}>Refund Request — [Your Account Email]</em></p>
            </div>
            <p>Please include in your message:</p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>Your registered email address</li>
              <li>Date of payment</li>
              <li>Reason for the refund request</li>
            </ul>
            <p>We process refund requests within <strong style={{ color: '#e2e8f0' }}>3–5 business days</strong>. Approved refunds are returned to the original payment method and may take an additional 5–10 business days to appear depending on your bank or card issuer.</p>
          </Section>

          <Section id="cancellation" title="5. Subscription Cancellation">
            <p>You can cancel your Zynth subscription at any time:</p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>Go to <strong style={{ color: '#e2e8f0' }}>Settings</strong> inside the Zynth platform and select <strong style={{ color: '#e2e8f0' }}>Manage Subscription</strong></li>
              <li>Alternatively, email <a href="mailto:getzynth@gmail.com" style={{ color: '#FF7A00', textDecoration: 'none' }}>getzynth@gmail.com</a> with your cancellation request</li>
            </ul>
            <p>After cancellation, you will retain access to your paid plan features until the end of your current billing period. Your account will then automatically revert to the Free plan. Your trade journal data is preserved and accessible on the Free plan.</p>
          </Section>

          <Section id="plan-changes" title="6. Plan Upgrades and Downgrades">
            <p>
              If you <strong style={{ color: '#e2e8f0' }}>upgrade</strong> your plan mid-cycle, you will be charged a prorated amount for the remainder of the billing period. The upgrade takes effect immediately.
            </p>
            <p>
              If you <strong style={{ color: '#e2e8f0' }}>downgrade</strong>, the change takes effect at the start of the next billing cycle. No refund is issued for the difference on the current period.
            </p>
          </Section>

          <Section id="current-pricing" title="7. Current Pricing">
            <p>
              All subscriptions are billed at the current published rates: Pro at {proMonthlyPrice} and Elite at {eliteMonthlyPrice}. Prices are subject to change with prior notice to active subscribers.
            </p>
          </Section>

          <Section id="contact-refund" title="8. Contact">
            <p>For all refund, billing, or cancellation queries:</p>
            <div style={{ backgroundColor: isDark ? 'rgba(255,77,0,0.06)' : 'rgba(255,77,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,77,0,0.15)' : 'rgba(255,77,0,0.2)'}`, borderRadius: 8, padding: '16px 20px', marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p style={{ fontSize: 14, color: '#FF7A00', fontWeight: 700 }}>Zynth Billing Support</p>
              <p style={{ fontSize: 13, color: isDark ? '#9ca3af' : '#4b5563' }}>Email: <a href="mailto:getzynth@gmail.com" style={{ color: '#FF7A00', textDecoration: 'none' }}>getzynth@gmail.com</a></p>
              <p style={{ fontSize: 13, color: isDark ? '#9ca3af' : '#4b5563' }}>Address: Zynth, Azeem Town, Sihala Street 2, Islamabad, Pakistan</p>
              <p style={{ fontSize: 13, color: isDark ? '#9ca3af' : '#4b5563' }}>Phone: <a href="tel:+923175516692" style={{ color: '#FF7A00', textDecoration: 'none' }}>+92 317 5516692</a></p>
              <p style={{ fontSize: 13, color: isDark ? '#9ca3af' : '#4b5563' }}>Response time: Within 1–2 business days</p>
            </div>
          </Section>

        </div>

        {/* Footer */}
        <div style={{ marginTop: 48, borderTop: `1px solid ${isDark ? 'rgba(255,77,0,0.1)' : 'rgba(0,0,0,0.08)'}`, paddingTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 12, color: isDark ? '#4b5563' : '#94a3b8' }}>© 2026 Zynth. All rights reserved.</p>
          <div style={{ display: 'flex', gap: 16 }}>
            <a href="/terms" style={{ fontSize: 12, color: '#6b7280', textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.color = '#FF7A00')} onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}>Terms of Service</a>
            <a href="/privacy" style={{ fontSize: 12, color: '#6b7280', textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.color = '#FF7A00')} onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}>Privacy Policy</a>
            <a href="/service-policy" style={{ fontSize: 12, color: '#6b7280', textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.color = '#FF7A00')} onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}>Service Policy</a>
          </div>
        </div>
      </div>
    </div>
  );
}


