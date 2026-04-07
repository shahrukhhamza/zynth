import { useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  AlertTriangle, CheckCircle2, XCircle, ShieldAlert, TrendingUp,
  Flame, Shield, BarChart3, Skull,
} from 'lucide-react';

/* ── rule engine ──────────────────────────────────────── */
function generateInsights(riskPercent, winRate, trades) {
  const items = [];

  // ── Risk level ──
  if (riskPercent > 10) {
    items.push({ type: 'error', icon: Skull, text: '⚠️ Extreme risk – account blow is almost certain at this level.' });
  } else if (riskPercent > 5) {
    items.push({ type: 'error', icon: Flame, text: '⚠️ High risk – significant drawdown likely. Reduce to 1-3%.' });
  } else if (riskPercent > 3) {
    items.push({ type: 'warn', icon: AlertTriangle, text: '⚡ Elevated risk – manageable for experienced traders only.' });
  } else if (riskPercent >= 1) {
    items.push({ type: 'success', icon: Shield, text: '✅ Balanced risk – aligns with standard risk management.' });
  } else if (riskPercent > 0) {
    items.push({ type: 'info', icon: Shield, text: '🛡️ Conservative risk – slow but steady growth.' });
  }

  // ── Win rate ──
  if (winRate > 80) {
    items.push({ type: 'warn', icon: AlertTriangle, text: '⚠️ Win rate >80% is unrealistic long-term. Back-test before relying on this.' });
  } else if (winRate >= 55) {
    items.push({ type: 'success', icon: TrendingUp, text: '✅ Solid win rate – profitable with proper risk-reward.' });
  } else if (winRate >= 40) {
    items.push({ type: 'warn', icon: AlertTriangle, text: '⚡ Win rate below average – you need R:R above 1.5:1 to stay profitable.' });
  } else if (winRate > 0) {
    items.push({ type: 'error', icon: XCircle, text: '❌ Low win rate – only viable with R:R of 3:1 or higher.' });
  }

  // ── Trade count ──
  if (trades >= 200) {
    items.push({ type: 'success', icon: BarChart3, text: '✅ Large sample – projection is statistically meaningful.' });
  } else if (trades >= 50) {
    items.push({ type: 'info', icon: BarChart3, text: 'ℹ️ Decent sample for a rough projection.' });
  } else if (trades > 0) {
    items.push({ type: 'warn', icon: AlertTriangle, text: '⚠️ Small sample – results will vary significantly. Use 50+ trades.' });
  }

  // ── Combined edge cases ──
  if (riskPercent > 5 && winRate < 50) {
    items.push({ type: 'error', icon: Skull, text: '❌ High risk + low win rate = fast path to blowing the account.' });
  }
  if (riskPercent > 3 && winRate > 80) {
    items.push({ type: 'warn', icon: AlertTriangle, text: '⚠️ Target looks unrealistic within these parameters.' });
  }
  if (riskPercent <= 2 && winRate >= 55 && trades >= 50) {
    items.push({ type: 'success', icon: CheckCircle2, text: '✅ Sustainable growth strategy – low risk with a proven edge.' });
  }
  if (riskPercent <= 1 && winRate >= 60 && trades >= 100) {
    items.push({ type: 'success', icon: TrendingUp, text: '🚀 Strong compounding setup – disciplined and data-backed.' });
  }

  return items;
}

/* ── style map ────────────────────────────────────────── */
const STYLES = {
  error:   { bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.25)',   text: '#ef4444', dot: '#ef4444' },
  warn:    { bg: 'rgba(245,158,11,0.08)',   border: 'rgba(245,158,11,0.25)',  text: '#f59e0b', dot: '#f59e0b' },
  success: { bg: 'rgba(16,185,129,0.08)',   border: 'rgba(16,185,129,0.25)',  text: '#10b981', dot: '#10b981' },
  info:    { bg: 'rgba(99,102,241,0.08)',   border: 'rgba(99,102,241,0.25)',  text: '#CA8A04', dot: '#CA8A04' },
};

/* ── component ────────────────────────────────────────── */
export default function RiskInsights({ riskPercent = 0, winRate = 0, trades = 0 }) {
  const { isDark } = useTheme();

  const insights = useMemo(
    () => generateInsights(Number(riskPercent), Number(winRate), Number(trades)),
    [riskPercent, winRate, trades],
  );

  if (!insights.length) return null;

  // overall severity badge
  const hasError   = insights.some((i) => i.type === 'error');
  const hasWarn    = insights.some((i) => i.type === 'warn');
  const allSuccess = insights.every((i) => i.type === 'success' || i.type === 'info');

  const severity = hasError
    ? { label: 'High Risk', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' }
    : hasWarn
    ? { label: 'Caution', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' }
    : allSuccess
    ? { label: 'Healthy', color: '#10b981', bg: 'rgba(16,185,129,0.12)' }
    : { label: 'Review', color: '#CA8A04', bg: 'rgba(99,102,241,0.12)' };

  return (
    <div style={{
      background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
      borderRadius: 16,
      padding: '20px 24px',
    }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShieldAlert size={18} style={{ color: severity.color }} />
          <span style={{
            fontSize: 14, fontWeight: 600, letterSpacing: 0.3,
            color: isDark ? '#e2e8f0' : '#161618',
          }}>
            Risk Insights
          </span>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
          padding: '4px 12px', borderRadius: 20,
          background: severity.bg, color: severity.color,
          textTransform: 'uppercase',
        }}>
          {severity.label}
        </span>
      </div>

      {/* insight rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {insights.map((item, i) => {
          const s = STYLES[item.type];
          const Icon = item.icon;
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px', borderRadius: 12,
              background: s.bg,
              border: `1px solid ${s.border}`,
              transition: 'transform 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateX(4px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateX(0)'; }}
            >
              <Icon size={16} style={{ color: s.text, flexShrink: 0 }} />
              <span style={{
                fontSize: 13, lineHeight: 1.5, fontWeight: 500,
                color: isDark ? '#cbd5e1' : '#334155',
              }}>
                {item.text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
