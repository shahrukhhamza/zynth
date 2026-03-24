import { ArrowLeft, Zap, Clock, CheckCircle2, Server } from 'lucide-react';

function Section({ id, title, children }) {
  return (
    <section id={id} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: '#f1f5f9', marginBottom: 4, borderBottom: '1px solid rgba(16,185,129,0.12)', paddingBottom: 10 }}>
        {title}
      </h2>
      <div style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {children}
      </div>
    </section>
  );
}

export default function ServicePolicy({ onBack }) {
  const handleBack = () => {
    if (onBack) { onBack(); } else { window.history.back(); }
  };

  return (
    <div style={{ backgroundColor: '#060a12', minHeight: '100vh', color: '#e2e8f0' }}>
      {/* Sticky header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        backgroundColor: 'rgba(6,10,18,0.95)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(16,185,129,0.15)',
      }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={handleBack} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b7280', fontSize: 13, cursor: 'pointer', background: 'none', border: 'none', padding: '4px 8px', borderRadius: 6 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#10b981')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}>
            <ArrowLeft size={15} /> Back
          </button>
          <div style={{ width: 1, height: 18, backgroundColor: 'rgba(107,114,128,0.4)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={16} style={{ color: '#10b981' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>Service &amp; Delivery Policy</span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, #059669, #0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: '#fff' }}>Z</div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>ZYNTH</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px 80px' }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#f1f5f9', marginBottom: 8 }}>Service &amp; Delivery Policy</h1>
          <p style={{ fontSize: 13, color: '#6b7280' }}>Last updated: March 2026 &nbsp;·&nbsp; Applies to all Zynth subscription plans</p>
        </div>

        {/* Key stat boxes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 36 }}>
          <div style={{ padding: '16px 18px', borderRadius: 10, backgroundColor: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <Zap size={18} style={{ color: '#10b981', marginBottom: 8 }} />
            <p style={{ fontSize: 13, fontWeight: 700, color: '#10b981', marginBottom: 4 }}>Instant Access</p>
            <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>Service access is granted immediately upon successful payment — no waiting period.</p>
          </div>
          <div style={{ padding: '16px 18px', borderRadius: 10, backgroundColor: 'rgba(14,165,233,0.07)', border: '1px solid rgba(14,165,233,0.2)' }}>
            <Server size={18} style={{ color: '#0ea5e9', marginBottom: 8 }} />
            <p style={{ fontSize: 13, fontWeight: 700, color: '#0ea5e9', marginBottom: 4 }}>100% Digital</p>
            <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>All services are delivered digitally via the Zynth web platform. No physical goods are shipped.</p>
          </div>
          <div style={{ padding: '16px 18px', borderRadius: 10, backgroundColor: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <Clock size={18} style={{ color: '#f59e0b', marginBottom: 8 }} />
            <p style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>99% Uptime Target</p>
            <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>We target 99% monthly uptime. Planned maintenance is communicated in advance where possible.</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

          <Section id="service-description" title="1. Service Description">
            <p>
              Zynth is a <strong style={{ color: '#e2e8f0' }}>web-based trading intelligence platform</strong> delivered as a Software-as-a-Service (SaaS). All services are provided exclusively through the Zynth web application accessible at <a href="https://app.zynth.io" style={{ color: '#10b981', textDecoration: 'none' }}>app.zynth.io</a>.
            </p>
            <p>The platform includes the following services depending on your subscription plan:</p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li><strong style={{ color: '#e2e8f0' }}>Free Plan:</strong> Trade journal (10 entries), live market overview, economic calendar, basic analytics, 3 AI analysis tries, 2 screenshot analyses</li>
              <li><strong style={{ color: '#e2e8f0' }}>Pro Plan ($1.99/month):</strong> Unlimited journal entries, 50 AI analyses/month, 35 screenshot OCR analyses/month, full economic intelligence, macro surprise score, live market feeds</li>
              <li><strong style={{ color: '#e2e8f0' }}>Elite Plan ($4.99/month):</strong> All Pro features plus unlimited AI analyses, unlimited screenshot OCR, custom AI reports, dedicated email support, and priority access to new features</li>
            </ul>
          </Section>

          <Section id="delivery" title="2. Service Delivery">
            <p>Zynth delivers services digitally via the internet:</p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li><strong style={{ color: '#e2e8f0' }}>Delivery method:</strong> Web browser — no download, installation, or physical delivery required</li>
              <li><strong style={{ color: '#e2e8f0' }}>Delivery time:</strong> Immediate — access is granted within seconds of completing payment</li>
              <li><strong style={{ color: '#e2e8f0' }}>Access requirements:</strong> An internet connection and a modern web browser (Chrome, Firefox, Safari, Edge)</li>
              <li><strong style={{ color: '#e2e8f0' }}>Geographic availability:</strong> Zynth is accessible worldwide. Some third-party data sources may have regional restrictions for certain economic indicators</li>
            </ul>
            <p>There are <strong style={{ color: '#e2e8f0' }}>no physical goods, downloads, or shipments</strong> associated with any Zynth subscription. This is a fully digital service.</p>
          </Section>

          <Section id="availability" title="3. Service Availability">
            <p>We strive to maintain high availability of the Zynth platform:</p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li><strong style={{ color: '#e2e8f0' }}>Target uptime:</strong> 99% per calendar month</li>
              <li><strong style={{ color: '#e2e8f0' }}>Planned maintenance:</strong> Announced at least 24 hours in advance via email or in-app notice where possible</li>
              <li><strong style={{ color: '#e2e8f0' }}>Unplanned outages:</strong> Addressed within 4 hours. If an outage exceeds 24 consecutive hours, affected subscribers are eligible for a service credit (see Refund Policy)</li>
            </ul>
            <p>Availability of third-party data feeds (economic calendar, market prices, news) may be subject to the uptime of external data providers, which is outside our direct control.</p>
          </Section>

          <Section id="ai-services" title="4. AI Services Delivery">
            <p>AI-powered features (AI Trade Analysis, Screenshot OCR, Zynth Assistant, Macro Intelligence Briefs) are delivered on-demand:</p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>AI analysis results are typically generated within 5–30 seconds of a request</li>
              <li>During periods of high traffic or AI provider throttling, response times may be longer</li>
              <li>AI analysis quotas (e.g. 50/month for Pro) reset on the 1st of each calendar month</li>
              <li>Unused quota does not roll over to the next month</li>
            </ul>
            <p>AI-generated content is produced using Google Gemini and may occasionally produce inaccurate or incomplete results. See our <a href="/terms" style={{ color: '#10b981', textDecoration: 'none' }}>Terms of Service</a> AI disclaimer for full details.</p>
          </Section>

          <Section id="data-services" title="5. Economic and Market Data Services">
            <p>Economic calendar, FRED data, and live market prices are sourced from licensed and public third-party providers:</p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li><strong style={{ color: '#e2e8f0' }}>Economic calendar:</strong> Updated in real-time from Financial Modeling Prep / Finnhub</li>
              <li><strong style={{ color: '#e2e8f0' }}>FRED economic data:</strong> Updated daily from the St. Louis Federal Reserve</li>
              <li><strong style={{ color: '#e2e8f0' }}>Live market prices:</strong> Provided via Polygon.io — data may be delayed up to 15 minutes for certain instruments unless otherwise stated</li>
              <li><strong style={{ color: '#e2e8f0' }}>News feeds:</strong> Aggregated from licensed financial news sources, updated every few minutes</li>
            </ul>
          </Section>

          <Section id="modifications" title="6. Service Modifications">
            <p>Zynth reserves the right to:</p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>Add new features to existing plans at no additional cost</li>
              <li>Modify or remove features with at least 30 days' notice for material changes affecting paid subscribers</li>
              <li>Adjust AI analysis quotas — any reductions to paid plan quotas will be communicated at least 30 days in advance</li>
              <li>Update third-party data sources where equivalent or better alternatives are available</li>
            </ul>
            <p>In the event of a material reduction in paid plan features, subscribers will be notified and may cancel and request a refund for any unused paid period under our Refund Policy.</p>
          </Section>

          <Section id="support" title="7. Customer Support">
            <p>Support is available to all Zynth users:</p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li><strong style={{ color: '#e2e8f0' }}>Free plan:</strong> Email support, responses within 5–7 business days</li>
              <li><strong style={{ color: '#e2e8f0' }}>Pro plan:</strong> Priority email support, responses within 2–3 business days</li>
              <li><strong style={{ color: '#e2e8f0' }}>Elite plan:</strong> Dedicated email support, responses within 4 hours during business hours</li>
            </ul>
            <p>Support is provided in English. Support hours: Monday–Friday, 9:00 AM – 6:00 PM Gulf Standard Time (GST, UTC+4).</p>
          </Section>

          <Section id="contact-service" title="8. Contact">
            <p>For service-related enquiries or technical support:</p>
            <div style={{ backgroundColor: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 8, padding: '16px 20px', marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p style={{ fontSize: 14, color: '#10b981', fontWeight: 700 }}>Zynth Support</p>
              <p style={{ fontSize: 13, color: '#9ca3af' }}>Email: <a href="mailto:getzynth@gmail.com" style={{ color: '#10b981', textDecoration: 'none' }}>getzynth@gmail.com</a></p>
              <p style={{ fontSize: 13, color: '#9ca3af' }}>Address: Zynth, Azeem Town, Sihala Street 2, Islamabad, Pakistan</p>
              <p style={{ fontSize: 13, color: '#9ca3af' }}>Phone: <a href="tel:+923175516692" style={{ color: '#10b981', textDecoration: 'none' }}>+92 317 5516692</a></p>
            </div>
          </Section>

        </div>

        {/* Footer */}
        <div style={{ marginTop: 48, borderTop: '1px solid rgba(16,185,129,0.1)', paddingTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 12, color: '#4b5563' }}>© 2026 Zynth. All rights reserved.</p>
          <div style={{ display: 'flex', gap: 16 }}>
            <a href="/terms" style={{ fontSize: 12, color: '#6b7280', textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.color = '#10b981')} onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}>Terms of Service</a>
            <a href="/privacy" style={{ fontSize: 12, color: '#6b7280', textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.color = '#10b981')} onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}>Privacy Policy</a>
            <a href="/refund-policy" style={{ fontSize: 12, color: '#6b7280', textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.color = '#10b981')} onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}>Refund Policy</a>
          </div>
        </div>
      </div>
    </div>
  );
}
