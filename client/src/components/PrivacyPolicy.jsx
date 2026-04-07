import { ArrowLeft, Shield, Lock, Eye, Trash2, FileText } from 'lucide-react';
import { BrandMark } from './BrandLogo';
import { useTheme } from '../contexts/ThemeContext';

function Section({ id, title, children }) {
  const { isDark } = useTheme();
  return (
    <section id={id} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: isDark ? '#FBBF24' : '#CA8A04', marginBottom: 4, borderBottom: `1px solid ${isDark ? 'rgba(202,138,4,0.12)' : 'rgba(202,138,4,0.15)'}`, paddingBottom: 10 }}>
        {title}
      </h2>
      <div style={{ fontSize: 13, color: isDark ? '#9ca3af' : '#4b5563', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPolicy({ onBack }) {
  const { isDark } = useTheme();
  const handleBack = () => {
    if (onBack) { onBack(); } else { window.history.back(); }
  };

  return (
    <div className={isDark ? '' : 'legal-light'} style={{ backgroundColor: isDark ? '#0B0B0F' : '#f8fafc', minHeight: '100vh', color: isDark ? '#e2e8f0' : '#161618' }}>
      <style>{`
        .legal-light strong { color: #0b0b0f !important; }
        .legal-light ul li { color: #4b5563 !important; }
      `}</style>
      {/* Sticky header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        backgroundColor: isDark ? 'rgba(11,11,15,0.95)' : 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderBottom: isDark ? '1px solid rgba(202,138,4,0.15)' : '1px solid rgba(0,0,0,0.08)',
      }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={handleBack} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b7280', fontSize: 13, cursor: 'pointer', background: 'none', border: 'none', padding: '4px 8px', borderRadius: 6 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#FBBF24')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}>
            <ArrowLeft size={15} /> Back
          </button>
          <div style={{ width: 1, height: 18, backgroundColor: 'rgba(107,114,128,0.4)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={16} style={{ color: '#FBBF24' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: isDark ? '#e2e8f0' : '#0b0b0f' }}>Privacy Policy</span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BrandMark size={28} />
            <span style={{ fontSize: 14, fontWeight: 700, color: isDark ? '#e2e8f0' : '#0b0b0f' }}>Zynth</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px 80px' }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: isDark ? '#fafaf9' : '#0b0b0f', marginBottom: 8 }}>Privacy Policy</h1>
          <p style={{ fontSize: 13, color: '#6b7280' }}>Last updated: March 2026 &nbsp;·&nbsp; Applies to all Zynth users</p>
        </div>

        <div style={{ backgroundColor: isDark ? 'rgba(202,138,4,0.06)' : 'rgba(202,138,4,0.04)', border: `1px solid ${isDark ? 'rgba(202,138,4,0.18)' : 'rgba(202,138,4,0.2)'}`, borderLeft: '4px solid #FBBF24', borderRadius: 10, padding: '16px 20px', marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <Lock size={18} style={{ color: '#FBBF24', flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 13, color: isDark ? '#d1d5db' : '#4b5563', lineHeight: 1.7 }}>
              Your privacy matters to us. Zynth collects only what is necessary to operate the service. We do not sell, rent, or share your personal data with third parties for marketing purposes.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

          <Section id="what-we-collect" title="1. Information We Collect">
            <p>We collect information you provide directly and information generated automatically when you use Zynth:</p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li><strong style={{ color: '#e2e8f0' }}>Account Information:</strong> Name, email address, and hashed password when you register.</li>
              <li><strong style={{ color: '#e2e8f0' }}>Profile Data:</strong> Optional profile image (avatar) and trading preferences you set during onboarding.</li>
              <li><strong style={{ color: '#e2e8f0' }}>Trade Journal Data:</strong> Trade records, journal entries, and notes you manually enter or import via screenshot upload.</li>
              <li><strong style={{ color: '#e2e8f0' }}>Usage Data:</strong> Feature usage counts (e.g. number of AI analyses used) for subscription quota management.</li>
              <li><strong style={{ color: '#e2e8f0' }}>Uploaded Files:</strong> Screenshots of trading history you upload for OCR analysis. These are stored securely and used solely to provide the analysis service.</li>
              <li><strong style={{ color: '#e2e8f0' }}>Consent Records:</strong> Timestamp of when you accepted our Terms of Service.</li>
              <li><strong style={{ color: '#e2e8f0' }}>Technical Data:</strong> Browser type, IP address, and session data collected automatically for security and service operation.</li>
            </ul>
            <p>We do <strong style={{ color: '#f87171' }}>not</strong> collect your broker credentials, live trading account access, or real-time positions.</p>
          </Section>

          <Section id="how-we-use" title="2. How We Use Your Information">
            <p>We use the information we collect to:</p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>Create and manage your account</li>
              <li>Provide the Zynth platform services (AI analysis, economic data, journal features)</li>
              <li>Enforce subscription plan limits (Free / Pro / Elite)</li>
              <li>Send account-related communications (password resets, subscription notices)</li>
              <li>Improve and maintain the platform</li>
              <li>Detect, prevent, and respond to security threats or abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p>We do not use your data for automated individual decision-making that produces legal effects.</p>
          </Section>

          <Section id="ai-processing" title="3. AI Processing and Your Data">
            <p>When you use AI features (AI Trade Analysis, Screenshot OCR, Zynth AI Assistant), your trade data and journal entries are sent to AI model providers:</p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li><strong style={{ color: '#e2e8f0' }}>Google Gemini API:</strong> Used for AI analysis, coaching narratives, and the Zynth Assistant. Data is processed under Google's API Terms of Service and Privacy Policy. Google does not use API data to train their models.</li>
            </ul>
            <p>Only the minimum data needed to generate the analysis is sent (trade details, journal notes). We do not send your email, password, or payment information to AI providers.</p>
          </Section>

          <Section id="data-storage" title="4. Data Storage and Security">
            <p>Your data is stored on secure servers in the United States. By using Zynth, you consent to this storage and processing.</p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>Passwords are stored as one-way cryptographic hashes (bcrypt) — we cannot read your password</li>
              <li>All data is transmitted over TLS 1.3 encrypted connections</li>
              <li>Uploaded files (screenshots) are stored on DigitalOcean Spaces with private access controls</li>
              <li>Database access is restricted to the Zynth application server only</li>
            </ul>
            <p>While we implement industry-standard security measures, no internet service can guarantee absolute security. You are responsible for keeping your account credentials confidential.</p>
          </Section>

          <Section id="third-party" title="5. Third-Party Services">
            <p>Zynth integrates data from the following third-party services to provide the platform:</p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li><strong style={{ color: '#e2e8f0' }}>Federal Reserve Economic Data (FRED):</strong> Public economic indicators — no personal data shared</li>
              <li><strong style={{ color: '#e2e8f0' }}>Financial Modeling Prep / Finnhub:</strong> Economic calendar and market data</li>
              <li><strong style={{ color: '#e2e8f0' }}>Polygon.io:</strong> Live market price feeds</li>
              <li><strong style={{ color: '#e2e8f0' }}>Google Gemini API:</strong> AI analysis (see Section 3)</li>
              <li><strong style={{ color: '#e2e8f0' }}>DigitalOcean Spaces:</strong> File storage for uploaded screenshots</li>
              <li><strong style={{ color: '#e2e8f0' }}>Railway:</strong> Cloud hosting infrastructure</li>
            </ul>
            <p>These services are bound by their own privacy policies. We select providers that align with data protection standards.</p>
          </Section>

          <Section id="cookies" title="6. Cookies and Local Storage">
            <p>Zynth does not use third-party advertising cookies. We use:</p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li><strong style={{ color: '#e2e8f0' }}>Authentication tokens (sessionStorage):</strong> To keep you logged in securely for the active browser session</li>
              <li><strong style={{ color: '#e2e8f0' }}>Preference storage (localStorage):</strong> Dark/light mode, sidebar state, onboarding status</li>
              <li><strong style={{ color: '#e2e8f0' }}>Session data (sessionStorage):</strong> Temporary UI state during your session</li>
            </ul>
            <p>You can clear these at any time through your browser settings. Clearing authentication tokens will log you out.</p>
          </Section>

          <Section id="data-retention" title="7. Data Retention">
            <p>We retain your data for as long as your account is active:</p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>Account data and trade journal entries are retained until you request deletion</li>
              <li>Uploaded screenshot files are retained until you delete them or request account deletion</li>
              <li>Usage logs are retained for up to 90 days for security and debugging purposes</li>
            </ul>
            <p>Upon account deletion, all personal data associated with your account is permanently deleted within 30 days, except where legal obligations require longer retention.</p>
          </Section>

          <Section id="your-rights" title="8. Your Rights">
            <p>Depending on your location, you may have the following rights regarding your personal data:</p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li><strong style={{ color: '#e2e8f0' }}>Right to Access:</strong> Request a copy of your personal data</li>
              <li><strong style={{ color: '#e2e8f0' }}>Right to Rectification:</strong> Correct inaccurate data</li>
              <li><strong style={{ color: '#e2e8f0' }}>Right to Erasure:</strong> Request deletion of your account and associated data</li>
              <li><strong style={{ color: '#e2e8f0' }}>Right to Portability:</strong> Receive your trade journal data in a structured format</li>
              <li><strong style={{ color: '#e2e8f0' }}>Right to Object:</strong> Object to processing in certain circumstances</li>
            </ul>
            <p>To exercise any of these rights, contact us at <a href="mailto:getzynth@gmail.com" style={{ color: '#FBBF24', textDecoration: 'none' }}>getzynth@gmail.com</a>. We will respond within 30 days.</p>
          </Section>

          <Section id="children" title="9. Children's Privacy">
            <p>Zynth is not directed at individuals under the age of 18. We do not knowingly collect personal information from minors. If you believe we have inadvertently collected data from a minor, please contact us immediately and we will delete it.</p>
          </Section>

          <Section id="changes" title="10. Changes to This Policy">
            <p>We may update this Privacy Policy from time to time. When we make material changes, we will update the "Last updated" date and may notify registered users via email or in-app notice. Continued use of Zynth after changes constitutes your acceptance of the updated policy.</p>
          </Section>

          <Section id="payments-billing" title="11. Payments and Billing Data">
            <p>Zynth supports paid plan activation through a secure in-app payment workflow with manual verification.</p>
            <p style={{ marginTop: 10 }}>We do not collect, store, or have access to full card information. Payment verification is based on the payment method you choose and any payment proof you submit through the platform.</p>
            <p style={{ marginTop: 10 }}>When you subscribe to a paid plan, we may store limited billing-related information, including:</p>
            <ul style={{ paddingLeft: 20, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li>Subscription status (Free, Pro, Elite)</li>
              <li>Plan activation and expiration dates</li>
              <li>Selected payment method</li>
              <li>Payment proof verification status</li>
              <li>Payment confirmation status</li>
            </ul>
            <p style={{ marginTop: 10 }}>This information is used solely to manage your subscription and enforce plan-based feature access.</p>
            <p style={{ marginTop: 10 }}>Uploaded payment proof is used only for verification, fraud prevention, and plan activation support.</p>
          </Section>

          <Section id="contact-privacy" title="12. Contact Us">
            <p>For privacy-related questions, data deletion requests, or to exercise your rights, please contact:</p>
            <div style={{ backgroundColor: isDark ? 'rgba(202,138,4,0.06)' : 'rgba(202,138,4,0.04)', border: `1px solid ${isDark ? 'rgba(202,138,4,0.15)' : 'rgba(202,138,4,0.2)'}`, borderRadius: 8, padding: '16px 20px', marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p style={{ fontSize: 14, color: '#FBBF24', fontWeight: 700 }}>Zynth — Privacy Team</p>
              <p style={{ fontSize: 13, color: isDark ? '#9ca3af' : '#4b5563' }}>Email: <a href="mailto:getzynth@gmail.com" style={{ color: '#FBBF24', textDecoration: 'none' }}>getzynth@gmail.com</a></p>
              <p style={{ fontSize: 13, color: isDark ? '#9ca3af' : '#4b5563' }}>Mailing Address: Zynth, Azeem Town, Sihala Street 2, Islamabad, Pakistan</p>
              <p style={{ fontSize: 13, color: isDark ? '#9ca3af' : '#4b5563' }}>Phone: <a href="tel:+923175516692" style={{ color: '#FBBF24', textDecoration: 'none' }}>+92 317 5516692</a></p>
            </div>
          </Section>

        </div>

        {/* Footer */}
        <div style={{ marginTop: 48, borderTop: `1px solid ${isDark ? 'rgba(202,138,4,0.1)' : 'rgba(0,0,0,0.08)'}`, paddingTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 12, color: isDark ? '#4b5563' : '#94a3b8' }}>© 2026 Zynth. All rights reserved.</p>
          <div style={{ display: 'flex', gap: 16 }}>
            <a href="/terms" style={{ fontSize: 12, color: '#6b7280', textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.color = '#FBBF24')} onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}>Terms of Service</a>
            <a href="/refund" style={{ fontSize: 12, color: '#6b7280', textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.color = '#FBBF24')} onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}>Refund Policy</a>
            <a href="/service-policy" style={{ fontSize: 12, color: '#6b7280', textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.color = '#FBBF24')} onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}>Service Policy</a>
          </div>
        </div>
      </div>
    </div>
  );
}

