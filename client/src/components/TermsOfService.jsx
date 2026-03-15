import { ArrowLeft, Shield, AlertTriangle, FileText } from 'lucide-react';

export default function TermsOfService({ onBack }) {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  return (
    <div style={{ backgroundColor: '#060a12', minHeight: '100vh', color: '#e2e8f0' }}>
      {/* Sticky header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backgroundColor: 'rgba(6,10,18,0.95)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(16,185,129,0.15)',
        }}
      >
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={handleBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: '#6b7280',
              fontSize: 13,
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              padding: '4px 8px',
              borderRadius: 6,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#10b981')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}
          >
            <ArrowLeft size={15} />
            Back
          </button>
          <div style={{ width: 1, height: 18, backgroundColor: 'rgba(107,114,128,0.4)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={16} style={{ color: '#10b981' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>Terms of Service</span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: 'linear-gradient(135deg, #059669, #0d9488)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 13,
                color: '#fff',
              }}
            >
              Z
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>ZYNTH</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px 80px' }}>
        {/* Title block */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#f1f5f9', marginBottom: 8 }}>Terms of Service</h1>
          <p style={{ fontSize: 13, color: '#6b7280' }}>Last updated: June 2025 &nbsp;&middot;&nbsp; Effective immediately upon account creation</p>
        </div>

        {/* Critical risk warning box */}
        <div
          style={{
            backgroundColor: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.25)',
            borderLeft: '4px solid #f59e0b',
            borderRadius: 10,
            padding: '16px 20px',
            marginBottom: 36,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <AlertTriangle size={18} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24', marginBottom: 4 }}>IMPORTANT RISK WARNING</p>
              <p style={{ fontSize: 12, color: '#d1d5db', lineHeight: 1.7 }}>
                Trading foreign exchange, commodities (including gold), and other financial instruments involves substantial risk of loss and is not suitable for all investors.
                Past performance is not indicative of future results. You may lose all or more than your initial investment.
                Zynth provides information tools only — nothing on this platform constitutes financial advice, investment recommendations, or solicitation to trade.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

          {/* Section 1 */}
          <Section id="acceptance" title="1. Acceptance of Terms">
            <p>By accessing or creating an account on Zynth, you confirm that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must not use this platform.</p>
            <p>These terms apply to all visitors, registered users, and others who access or use the service.</p>
          </Section>

          {/* Section 2 */}
          <Section id="service" title="2. Nature of Service">
            <p>Zynth is a <strong style={{ color: '#10b981' }}>software information platform</strong> that aggregates and displays:</p>
            <ul>
              <li>Macroeconomic data from public and licensed sources (e.g. FRED, BLS, BEA)</li>
              <li>Market data feeds and price information</li>
              <li>AI-generated summaries and pattern analysis</li>
              <li>Economic calendar events</li>
              <li>User-supplied trade journal entries</li>
            </ul>
            <p>Zynth is <strong style={{ color: '#f87171' }}>not a brokerage, investment advisor, financial planner, or trading system</strong>. No content on this platform should be construed as a recommendation to buy, sell, or hold any financial instrument.</p>
          </Section>

          {/* Section 3 — AI disclaimer */}
          <Section id="ai" title="3. AI Analysis Disclaimer">
            <div
              style={{
                backgroundColor: 'rgba(245,158,11,0.07)',
                border: '1px solid rgba(245,158,11,0.2)',
                borderRadius: 8,
                padding: '12px 16px',
                marginBottom: 14,
              }}
            >
              <p style={{ fontSize: 12, color: '#fbbf24', fontWeight: 600, marginBottom: 4 }}>AI-Generated Content Warning</p>
              <p style={{ fontSize: 12, color: '#d1d5db', lineHeight: 1.7 }}>
                AI-generated analysis on this platform is produced by large language models (Google Gemini and rule-based systems).
                This content is experimental, may contain factual errors, hallucinations, or outdated information, and must not be used as the sole or primary basis for any trading decision.
              </p>
            </div>
            <p>You acknowledge that:</p>
            <ul>
              <li>AI models can produce plausible-sounding but incorrect analysis</li>
              <li>AI insights do not account for your personal financial situation, risk tolerance, or investment goals</li>
              <li>Zynth makes no warranty that AI outputs are accurate, complete, or timely</li>
              <li>Any trading decision made based on AI analysis is entirely at your own risk</li>
            </ul>
          </Section>

          {/* Section 4 */}
          <Section id="marketdata" title="4. Market Data and Information Accuracy">
            <p>Market data, prices, economic indicators, and news content displayed on Zynth are sourced from third-party providers and public databases. This data:</p>
            <ul>
              <li>May be delayed (typically 15 minutes or more for market prices unless stated otherwise)</li>
              <li>May contain errors, gaps, or inaccuracies due to data provider issues</li>
              <li>Is provided for informational purposes only and not as real-time trading data</li>
              <li>Should be verified against your broker or primary data source before acting</li>
            </ul>
            <p>Zynth is not liable for any trading losses resulting from reliance on data displayed on this platform.</p>
          </Section>

          {/* Section 5 — Risk warning */}
          <Section id="risk" title="5. Risk Warning for Trading">
            <div
              style={{
                backgroundColor: 'rgba(239,68,68,0.07)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 8,
                padding: '12px 16px',
                marginBottom: 14,
              }}
            >
              <p style={{ fontSize: 12, color: '#f87171', fontWeight: 600, marginBottom: 4 }}>High-Risk Activity Warning</p>
              <p style={{ fontSize: 12, color: '#d1d5db', lineHeight: 1.7 }}>
                Forex and commodities trading involves a high degree of risk. Many retail traders lose money. You should only trade with capital you can afford to lose entirely.
              </p>
            </div>
            <p>By using Zynth, you acknowledge:</p>
            <ul>
              <li>You are solely responsible for all trading decisions you make</li>
              <li>Leveraged trading can result in losses exceeding your initial deposit</li>
              <li>Past performance of any analysis, strategy, or tool is not a reliable indicator of future results</li>
              <li>You should seek independent financial advice before trading if you are unsure</li>
              <li>You are of legal age in your jurisdiction to engage in financial trading activities</li>
            </ul>
          </Section>

          {/* Section 6 */}
          <Section id="liability" title="6. Limitation of Liability">
            <p>To the maximum extent permitted by applicable law, Zynth and its operators shall not be liable for:</p>
            <ul>
              <li>Any direct, indirect, incidental, consequential, or punitive damages</li>
              <li>Trading losses of any amount, including but not limited to losses from reliance on AI analysis, market data, or economic indicators shown on this platform</li>
              <li>Loss of profit, data, or business arising from use or inability to use this service</li>
              <li>Errors, interruptions, or downtime of the platform or data feeds</li>
            </ul>
            <p>Your use of Zynth is entirely at your own risk. The platform is provided "as is" and "as available" without warranty of any kind.</p>
          </Section>

          {/* Section 7 */}
          <Section id="advisory" title="7. No Advisory Relationship">
            <p>Use of Zynth does not create any advisory, fiduciary, or professional relationship between you and Zynth or its operators. Zynth is not a Registered Investment Advisor (RIA), broker-dealer, or financial institution in any jurisdiction.</p>
            <p>Nothing communicated through this platform — including AI summaries, economic reports, chatbot responses, or any other content — constitutes professional financial, legal, or tax advice.</p>
          </Section>

          {/* Section 8 */}
          <Section title="8. Accuracy and Availability">
            <p>We strive to keep the platform available and data accurate, but we do not guarantee:</p>
            <ul>
              <li>Continuous, uninterrupted availability of the service</li>
              <li>Complete accuracy of economic data, market data, or AI analysis</li>
              <li>That the platform is free from bugs, errors, or security vulnerabilities</li>
            </ul>
            <p>Zynth reserves the right to modify, suspend, or discontinue any part of the service at any time without notice.</p>
          </Section>

          {/* Section 9 */}
          <Section title="9. User Responsibilities">
            <p>By using Zynth, you agree to:</p>
            <ul>
              <li>Provide accurate registration information and keep your account credentials secure</li>
              <li>Not use the platform for any unlawful purpose or in violation of any regulations</li>
              <li>Not attempt to reverse-engineer, scrape, or exploit the platform beyond normal use</li>
              <li>Not share your account with others</li>
              <li>Conduct your own due diligence before making any financial decisions</li>
            </ul>
            <p>We reserve the right to suspend or terminate accounts that violate these terms.</p>
          </Section>

          {/* Section 10 */}
          <Section title="10. Intellectual Property">
            <p>All software, design, branding, and original content on Zynth is the property of its operators. You are granted a limited, non-transferable, non-exclusive license to use the platform for personal, non-commercial purposes only.</p>
            <p>Economic data, news, and market data may be subject to third-party licenses and terms of their respective providers.</p>
          </Section>

          {/* Section 11 — Privacy */}
          <Section id="privacy" title="11. Privacy and Data">
            <p>Zynth collects the following data to operate the service:</p>
            <ul>
              <li><strong style={{ color: '#e2e8f0' }}>Account data:</strong> name, email address, hashed password</li>
              <li><strong style={{ color: '#e2e8f0' }}>Usage data:</strong> feature usage counts for quota management (AI analysis requests, screenshot uploads)</li>
              <li><strong style={{ color: '#e2e8f0' }}>Journal data:</strong> trade records you manually enter or upload — stored locally on our server</li>
              <li><strong style={{ color: '#e2e8f0' }}>Consent records:</strong> timestamp of when you accepted these terms</li>
            </ul>
            <p>We do not sell, rent, or share your personal data with third parties for marketing purposes.</p>
            <p>Data is stored on servers located in the United States. By using Zynth you consent to this storage and processing.</p>
            <p>You may request deletion of your account and associated data by contacting us at the address below.</p>
          </Section>

          {/* Section 12 */}
          <Section title="12. Changes to Terms">
            <p>We reserve the right to update these Terms of Service at any time. When we make material changes, we will update the "Last updated" date at the top of this page and may notify registered users via email or in-app notice.</p>
            <p>Continued use of the platform after changes constitutes your acceptance of the revised terms.</p>
          </Section>

          {/* Section 13 */}
          <Section title="13. Contact">
            <p>If you have questions about these Terms of Service, privacy practices, or need to request account deletion, please contact:</p>
            <div
              style={{
                backgroundColor: 'rgba(16,185,129,0.06)',
                border: '1px solid rgba(16,185,129,0.15)',
                borderRadius: 8,
                padding: '12px 16px',
                marginTop: 10,
              }}
            >
              <p style={{ fontSize: 13, color: '#10b981', fontWeight: 600, marginBottom: 2 }}>Zynth Support</p>
              <p style={{ fontSize: 13, color: '#9ca3af' }}>
                Email:{' '}
                <a
                  href="mailto:getzynth@gmail.com"
                  style={{ color: '#10b981', textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                >
                  getzynth@gmail.com
                </a>
              </p>
            </div>
          </Section>

        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: 48,
            borderTop: '1px solid rgba(16,185,129,0.1)',
            paddingTop: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={14} style={{ color: '#10b981' }} />
            <span style={{ fontSize: 11, color: '#4b5563' }}>Zynth Trading Intelligence Platform</span>
          </div>
          <span style={{ fontSize: 11, color: '#4b5563' }}>&copy; {new Date().getFullYear()} Zynth. All rights reserved.</span>
        </div>
      </div>
    </div>
  );
}

function Section({ id, title, children }) {
  return (
    <section id={id}>
      <style>{`
        .tos-section ul { list-style: disc; padding-left: 20px; display: flex; flex-direction: column; gap: 4px; }
        .tos-section li { font-size: 13px; color: #9ca3af; line-height: 1.7; }
        .tos-section p  { margin: 0; }
      `}</style>
      <h2
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: '#34d399',
          marginBottom: 12,
          paddingBottom: 8,
          borderBottom: '1px solid rgba(16,185,129,0.12)',
        }}
      >
        {title}
      </h2>
      <div
        className="tos-section"
        style={{
          fontSize: 13,
          color: '#9ca3af',
          lineHeight: 1.75,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {children}
      </div>
    </section>
  );
}
