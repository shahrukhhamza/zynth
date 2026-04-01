/**
 * JournalCoach.jsx
 * AI coaching reports powered by the user's own journal entries.
 * Fetches / generates reports via POST /api/journal/reports.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Sparkles, RefreshCw, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle, Target, Brain,
  ArrowRight, TrendingUp, Shield, Zap, Clock,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { API_URL } from '../../config/api';
import { getAuthToken } from '../../utils/authStorage';

// ── Grade colours ─────────────────────────────────────────────────────────────
const GRADE = {
  'A+': { bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.35)',  text: '#4ade80' },
  'A':  { bg: 'rgba(34,197,94,0.10)',  border: 'rgba(34,197,94,0.28)',  text: '#4ade80' },
  'B':  { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.35)', text: '#818cf8' },
  'C':  { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)', text: '#f59e0b' },
  'D':  { bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.35)', text: '#f97316' },
  'F':  { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.35)',  text: '#ef4444' },
};

const REPORT_TYPES = [
  { value: 'weekly',  label: 'Weekly'  },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom',  label: 'Custom'  },
];

// ── Small helpers ─────────────────────────────────────────────────────────────
function Row({ icon, text, theme }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <span style={{ marginTop: 2, flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 13, color: theme.text, lineHeight: 1.55 }}>{text}</span>
    </div>
  );
}

function SectionBlock({ icon: Icon, title, color, children }) {
  return (
    <div style={{
      marginTop: 14, padding: '14px 16px', borderRadius: 12,
      background: 'var(--z-inner)', border: '1px solid var(--z-border)',
    }}>
      <p style={{
        fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
        letterSpacing: '0.1em', color, margin: '0 0 10px',
        display: 'flex', alignItems: 'center', gap: 5,
      }}>
        <Icon size={11} /> {title}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {children}
      </div>
    </div>
  );
}

// ── Single report card ────────────────────────────────────────────────────────
function ReportCard({ report, expanded, onToggle, theme }) {
  const data = report.report_data;
  if (!data) return null;

  const grade     = data.performance_grade || '—';
  const gradeStyle = GRADE[grade] || GRADE['C'];
  const date      = new Date(report.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
  const typeLabel = report.report_type
    ? report.report_type.charAt(0).toUpperCase() + report.report_type.slice(1)
    : 'Report';

  return (
    <div style={{
      borderRadius: 16,
      background: 'var(--z-card)',
      border: '1px solid var(--z-border)',
      overflow: 'hidden',
    }}>
      {/* Collapsed header */}
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 14,
          padding: '16px 20px', background: 'transparent', border: 'none',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div style={{
          width: 48, height: 48, borderRadius: 12, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: 20,
          background: gradeStyle.bg,
          border: `1px solid ${gradeStyle.border}`,
          color: gradeStyle.text,
        }}>
          {grade}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--z-text2)' }}>
              {data.title || `${typeLabel} Report`}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
              padding: '2px 8px', borderRadius: 99,
              background: 'var(--z-badge-bg)', border: '1px solid var(--z-badge-bdr)',
              color: 'var(--z-badge-text)',
            }}>
              {typeLabel}
            </span>
          </div>
          <p style={{ fontSize: 12, color: theme.muted, margin: '3px 0 0' }}>
            <Clock size={10} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
            {date}
          </p>
        </div>

        {expanded
          ? <ChevronUp size={16} color={theme.muted} />
          : <ChevronDown size={16} color={theme.muted} />}
      </button>

      {/* Expanded body */}
      {expanded && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--z-border)' }}>

          {/* Summary */}
          {data.summary && (
            <p style={{ fontSize: 14, lineHeight: 1.75, color: theme.text, margin: '16px 0 0' }}>
              {data.summary}
            </p>
          )}

          {/* Highlights + Concerns two-col grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 14, marginTop: 16,
          }}>
            {data.highlights?.length > 0 && (
              <SectionBlock icon={TrendingUp} title="Highlights" color="#4ade80">
                {data.highlights.map((h, i) => (
                  <Row key={i} icon={<CheckCircle size={13} color="#4ade80" />} text={h} theme={theme} />
                ))}
              </SectionBlock>
            )}
            {data.concerns?.length > 0 && (
              <SectionBlock icon={AlertTriangle} title="Concerns" color="#f59e0b">
                {data.concerns.map((c, i) => (
                  <Row key={i} icon={<AlertTriangle size={13} color="#f59e0b" />} text={c} theme={theme} />
                ))}
              </SectionBlock>
            )}
          </div>

          {/* Psychological assessment */}
          {data.psychological_assessment && (
            <SectionBlock icon={Brain} title="Psychological Assessment" color="#a78bfa">
              <p style={{ fontSize: 13, lineHeight: 1.7, color: theme.muted, margin: 0 }}>
                {data.psychological_assessment}
              </p>
            </SectionBlock>
          )}

          {/* Strategy insights */}
          {data.strategy_insights?.filter(Boolean).length > 0 && (
            <SectionBlock icon={Zap} title="Strategy Insights" color="#818cf8">
              {data.strategy_insights.filter(Boolean).map((s, i) => (
                <Row key={i} icon={<ArrowRight size={13} color="#818cf8" />} text={s} theme={theme} />
              ))}
            </SectionBlock>
          )}

          {/* Behavioural warnings */}
          {data.behavioral_warnings?.filter(Boolean).length > 0 && (
            <SectionBlock icon={Shield} title="Behavioural Warnings" color="#f97316">
              {data.behavioral_warnings.filter(Boolean).map((w, i) => (
                <Row key={i} icon={<AlertTriangle size={13} color="#f97316" />} text={w} theme={theme} />
              ))}
            </SectionBlock>
          )}

          {/* Action items */}
          {data.action_items?.length > 0 && (
            <SectionBlock icon={Target} title="Action Items" color="#38bdf8">
              {data.action_items.map((a, i) => (
                <Row key={i} icon={<ArrowRight size={13} color="#38bdf8" />} text={a} theme={theme} />
              ))}
            </SectionBlock>
          )}

          {/* AI Coach advice banner */}
          {data.ai_coach_advice && (
            <div style={{
              marginTop: 16, padding: '14px 16px', borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(99,102,241,0.09), rgba(139,92,246,0.06))',
              border: '1px solid rgba(99,102,241,0.22)',
              display: 'flex', gap: 12, alignItems: 'flex-start',
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Sparkles size={15} color="#fff" />
              </div>
              <div>
                <p style={{
                  fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                  letterSpacing: '0.08em', color: '#818cf8', margin: '0 0 5px',
                }}>
                  AI Coach
                </p>
                <p style={{ fontSize: 13, lineHeight: 1.7, color: theme.text, margin: 0 }}>
                  {data.ai_coach_advice}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function JournalCoach() {
  const theme = useTheme();
  const [reports, setReports]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError]           = useState(null);
  const [reportType, setReportType] = useState('weekly');
  const [expandedId, setExpandedId] = useState(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${API_URL}/api/journal/reports`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        const list = data.data || [];
        setReports(list);
        if (list.length > 0 && expandedId === null) setExpandedId(list[0].id);
      }
    } catch {
      setError('Could not load reports. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [expandedId]);

  useEffect(() => { fetchReports(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function generateReport() {
    setGenerating(true);
    setError(null);
    try {
      const res  = await fetch(`${API_URL}/api/journal/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ type: reportType }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Report generation failed');
      setReports(prev => [data.data, ...prev]);
      setExpandedId(data.data.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, flexWrap: 'wrap',
      }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: theme.text, margin: 0 }}>
            Trade Coach
          </h2>
          <p style={{ fontSize: 13, color: theme.muted, margin: '2px 0 0' }}>
            AI coaching reports built from your actual trade journal
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Report type selector */}
          <select
            value={reportType}
            onChange={e => setReportType(e.target.value)}
            style={{
              padding: '8px 12px', borderRadius: 10, fontSize: 13, fontWeight: 500,
              background: 'var(--z-input)', border: '1px solid var(--z-border)',
              color: theme.text, cursor: 'pointer', outline: 'none',
            }}
          >
            {REPORT_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label} Report</option>
            ))}
          </select>

          {/* Refresh */}
          <button
            onClick={fetchReports}
            disabled={loading || generating}
            title="Refresh reports"
            style={{
              width: 36, height: 36, borderRadius: 10, border: '1px solid var(--z-border)',
              background: 'var(--z-input)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: theme.muted,
            }}
          >
            <RefreshCw
              size={14}
              style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}
            />
          </button>

          {/* Generate */}
          <button
            onClick={generateReport}
            disabled={generating}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700,
              background: generating
                ? 'rgba(99,102,241,0.35)'
                : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff', border: 'none',
              cursor: generating ? 'not-allowed' : 'pointer',
              boxShadow: generating ? 'none' : '0 2px 12px rgba(99,102,241,0.3)',
              transition: 'all 0.15s',
            }}
          >
            <Sparkles size={14} style={{ animation: generating ? 'spin 1s linear infinite' : 'none' }} />
            {generating ? 'Generating…' : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* ── Error banner ────────────────────────────────────────────────── */}
      {error && (
        <div style={{
          padding: '12px 16px', borderRadius: 12, fontSize: 13,
          color: '#f87171', background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
        }}>
          {error}
        </div>
      )}

      {/* ── Loading skeleton ─────────────────────────────────────────────── */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '56px 0', color: theme.muted }}>
          <Sparkles size={28} style={{ margin: '0 auto 12px', opacity: 0.35, display: 'block' }} />
          <p style={{ fontSize: 14 }}>Loading your coaching reports…</p>
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────────────────────── */}
      {!loading && reports.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '60px 24px',
          background: 'var(--z-surface)', borderRadius: 16,
          border: '1px solid var(--z-border)',
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16, margin: '0 auto 18px',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))',
            border: '1px solid rgba(99,102,241,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={24} color="#818cf8" />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: theme.text, margin: '0 0 8px' }}>
            No coaching reports yet
          </h3>
          <p style={{
            fontSize: 13, color: theme.muted, maxWidth: 340,
            margin: '0 auto 22px', lineHeight: 1.65,
          }}>
            Generate your first AI coaching report to get personalised feedback,
            psychological insights, and action items based on your trade history.
          </p>
          <button
            onClick={generateReport}
            disabled={generating}
            style={{
              padding: '11px 28px', borderRadius: 12, fontSize: 14, fontWeight: 700,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff', border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 18px rgba(99,102,241,0.4)',
            }}
          >
            {generating ? 'Generating…' : '✨ Generate My First Report'}
          </button>
        </div>
      )}

      {/* ── Report cards ─────────────────────────────────────────────────── */}
      {!loading && reports.map(report => (
        <ReportCard
          key={report.id}
          report={report}
          expanded={expandedId === report.id}
          onToggle={() => setExpandedId(prev => prev === report.id ? null : report.id)}
          theme={theme}
        />
      ))}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
