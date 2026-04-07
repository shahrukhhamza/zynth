/**
 * TradeContextReport.jsx
 *
 * The "Trade Context Report" card — shown inside the Trade Detail Page.
 * Fetches from GET /api/journal/trades/:id/macro-context and displays:
 *   • Alignment badge (ALIGNED / MISALIGNED / NEUTRAL / NO DATA)
 *   • List of macro events on the trade day, each with bias pill
 *   • Supporting vs opposing event breakdown
 *   • AI-generated coaching narrative
 */

import { useState, useEffect } from 'react';
import {
  Activity, TrendingUp, TrendingDown, Minus, Brain,
  RefreshCw, Loader2, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, AlertCircle, Info,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { API_URL } from '../../config/api';
import ErrorBar from '../ErrorBar';

// ─── Alignment config ──────────────────────────────────────────────────────────
const ALIGNMENT_CONFIG = {
  aligned: {
    label:  'MACRO ALIGNED',
    color:  '#10b981',
    bg:     'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.25)',
    Icon:   CheckCircle2,
    desc:   'Macro events supported your trade direction.',
  },
  misaligned: {
    label:  'MACRO MISALIGNED',
    color:  '#ef4444',
    bg:     'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.25)',
    Icon:   XCircle,
    desc:   'Macro events opposed your trade direction.',
  },
  neutral: {
    label:  'MACRO NEUTRAL',
    color:  '#f59e0b',
    bg:     'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.25)',
    Icon:   Minus,
    desc:   'Mixed or offsetting macro signals on this day.',
  },
  no_events: {
    label:  'NO MACRO DATA',
    color:  '#6b7280',
    bg:     'rgba(107,114,128,0.08)',
    border: 'rgba(107,114,128,0.25)',
    Icon:   Info,
    desc:   'No significant economic releases found for this day.',
  },
};

const BIAS_STYLE = {
  bullish: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'BEAT ↑', Icon: TrendingUp  },
  bearish: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  label: 'MISS ↓', Icon: TrendingDown },
  neutral: { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', label: 'INLINE', Icon: Minus        },
};

const IMPACT_COLOR = { high: '#ef4444', medium: '#f59e0b', low: '#6b7280' };

// ─── Sub-components ────────────────────────────────────────────────────────────
function AlignmentBadge({ alignment }) {
  const cfg  = ALIGNMENT_CONFIG[alignment] || ALIGNMENT_CONFIG.neutral;
  const Icon = cfg.Icon;
  return (
    <div style={{
      display:         'flex',
      alignItems:      'center',
      gap:             10,
      padding:         '12px 16px',
      borderRadius:    10,
      backgroundColor: cfg.bg,
      border:          `1px solid ${cfg.border}`,
    }}>
      <Icon style={{ width: 18, height: 18, color: cfg.color, flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: cfg.color }}>
          {cfg.label}
        </div>
        <div style={{ fontSize: 12, color: cfg.color, opacity: 0.7, marginTop: 1 }}>
          {cfg.desc}
        </div>
      </div>
    </div>
  );
}

function ConfidenceBadge({ confidence, theme }) {
  if (confidence == null) return null;
  const pct   = Math.min(100, Math.max(0, Math.round(confidence)));
  const color = pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444';
  const label = pct >= 70 ? 'Strong' : pct >= 40 ? 'Moderate' : 'Weak';
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: theme.muted }}>SIGNAL CONFIDENCE</span>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>{label} · {pct}%</span>
      </div>
      <div style={{ height: 4, borderRadius: 4, backgroundColor: theme.border, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: 4, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

function EventRow({ ev, theme }) {
  const bias   = BIAS_STYLE[ev.bias] || BIAS_STYLE.neutral;
  const BiasIcon = bias.Icon;
  const impactColor = IMPACT_COLOR[ev.impact] || '#6b7280';

  return (
    <div style={{
      display:      'flex',
      alignItems:   'center',
      gap:          10,
      padding:      '10px 0',
      borderBottom: `1px solid ${theme.border}`,
    }}>
      {/* Impact dot */}
      <div style={{
        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
        backgroundColor: impactColor,
        boxShadow: `0 0 4px ${impactColor}88`,
      }} />

      {/* Name + currency */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: theme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {ev.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          {ev.dayOffset === -1 && (
            <span style={{
              fontSize: 9, fontWeight: 800, letterSpacing: '0.06em',
              color: '#f59e0b', background: 'rgba(245,158,11,0.12)',
              border: '1px solid rgba(245,158,11,0.28)',
              padding: '1px 5px', borderRadius: 4, flexShrink: 0,
            }}>PREV DAY</span>
          )}
          <span style={{ fontSize: 10, fontWeight: 700, color: impactColor, letterSpacing: '0.05em' }}>
            {(ev.impact || '').toUpperCase()}
          </span>
          <span style={{ fontSize: 10, color: theme.muted }}>·</span>
          <span style={{ fontSize: 10, color: theme.muted, fontWeight: 600 }}>{ev.currency}</span>
          {ev.actual != null && (
            <>
              <span style={{ fontSize: 10, color: theme.muted }}>·</span>
              <span style={{ fontSize: 10, color: theme.muted }}>
                A: <strong style={{ color: theme.text }}>{ev.actual}</strong>
                {ev.estimate != null ? ` / E: ${ev.estimate}` : ''}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Bias pill */}
      <div style={{
        display:         'flex',
        alignItems:      'center',
        gap:             4,
        padding:         '3px 8px',
        borderRadius:    6,
        backgroundColor: bias.bg,
        flexShrink:      0,
      }}>
        <BiasIcon style={{ width: 11, height: 11, color: bias.color }} />
        <span style={{ fontSize: 10, fontWeight: 700, color: bias.color, letterSpacing: '0.04em' }}>
          {bias.label}
        </span>
      </div>
    </div>
  );
}

function AiNarrative({ text, theme }) {
  if (!text) return null;
  return (
    <div style={{
      marginTop:       16,
      padding:         '14px 16px',
      borderRadius:    10,
      backgroundColor: theme.isDark ? 'rgba(14,165,233,0.06)' : 'rgba(14,165,233,0.04)',
      border:          '1px solid rgba(14,165,233,0.18)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 7,
          backgroundColor: 'rgba(202,138,4,0.14)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Brain style={{ width: 13, height: 13, color: '#CA8A04' }} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#CA8A04', letterSpacing: '0.06em' }}>
          ZYNTH MACRO BRIEF
        </span>
        <span style={{ fontSize: 10, color: theme.muted, marginLeft: 'auto' }}>✦ AI Analysis</span>
      </div>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: theme.isDark ? 'rgba(186,230,253,0.85)' : '#0c4a6e' }}>
        {text}
      </p>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function TradeContextReport({ tradeId, tradeDate, cacheBusted = false }) {
  const theme       = useTheme();
  const { token }   = useAuth();
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [expanded,  setExpanded]  = useState(false);

  const hdrs = token ? { Authorization: `Bearer ${token}` } : {};

  async function load(forceRefresh = false) {
    setLoading(true);
    setError(null);
    try {
      const qs = forceRefresh ? '?refresh=1' : '';
      const res = await fetch(`${API_URL}/api/journal/trades/${tradeId}/macro-context${qs}`, { headers: hdrs });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load macro context');
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tradeId) load();
  }, [tradeId]);

  const alignment = data?.alignment || 'no_events';
  const cfg       = ALIGNMENT_CONFIG[alignment] || ALIGNMENT_CONFIG.no_events;
  const events    = data?.events || [];
  const hasEvents = events.length > 0;
  const shownEvents = expanded ? events : events.slice(0, 4);

  return (
    <div style={{
      borderRadius:    14,
      overflow:        'hidden',
      border:          `1px solid ${theme.border}`,
      backgroundColor: theme.surface || (theme.isDark ? '#0d0d0f' : '#fff'),
    }}>
      {/* Header */}
      <div style={{
        height: 2,
        background: `linear-gradient(90deg, ${cfg.color}99 0%, transparent 100%)`,
      }} />
      <div style={{
        display:    'flex',
        alignItems: 'center',
        gap:        10,
        padding:    '14px 18px 12px',
        borderBottom: `1px solid ${theme.border}`,
      }}>
        <Activity style={{ width: 14, height: 14, color: theme.muted }} />
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: theme.muted }}>
          TRADE CONTEXT REPORT
        </span>
        {tradeDate && (
          <span style={{ fontSize: 11, color: theme.muted, marginLeft: 'auto', opacity: 0.6 }}>
            {tradeDate}
          </span>
        )}
        {/* Refresh */}
        <button
          onClick={() => load(true)}
          disabled={loading}
          title="Refresh macro context"
          style={{
            background: 'none', border: 'none', cursor: loading ? 'wait' : 'pointer',
            color: theme.muted, padding: '2px 4px', borderRadius: 5,
            marginLeft: tradeDate ? 0 : 'auto',
          }}
        >
          <RefreshCw style={{ width: 13, height: 13, animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      <div style={{ padding: '14px 18px' }}>
        {/* Loading */}
        {loading && !data && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 0', color: theme.muted }}>
            <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 13 }}>Analysing macro conditions for {tradeDate}…</span>
          </div>
        )}

        {/* Error */}
        {error && !loading && <ErrorBar message={error} />}

        {/* Content */}
        {data && !loading && (
          <>
            {/* Alignment badge */}
            <AlignmentBadge alignment={alignment} />
            <ConfidenceBadge confidence={data.alignmentConfidence} theme={theme} />

            {/* Events list */}
            {hasEvents && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: theme.muted, marginBottom: 4 }}>
                  ECONOMIC EVENTS · {tradeDate}
                </div>
                <div>
                  {shownEvents.map((ev, i) => (
                    <EventRow key={ev.id || i} ev={ev} theme={theme} />
                  ))}
                </div>
                {/* Show more / less toggle */}
                {events.length > 4 && (
                  <button
                    onClick={() => setExpanded(e => !e)}
                    style={{
                      display:    'flex',
                      alignItems: 'center',
                      gap:        5,
                      marginTop:  8,
                      fontSize:   12,
                      fontWeight: 600,
                      color:      theme.muted,
                      background: 'none',
                      border:     'none',
                      cursor:     'pointer',
                      padding:    '4px 0',
                    }}
                  >
                    {expanded
                      ? <><ChevronUp style={{ width: 13, height: 13 }} /> Show fewer events</>
                      : <><ChevronDown style={{ width: 13, height: 13 }} /> Show {events.length - 4} more events</>}
                  </button>
                )}
              </div>
            )}

            {/* Supporting vs Opposing summary */}
            {(data.supportingEvents?.length > 0 || data.opposingEvents?.length > 0) && (
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                {/* Supporting */}
                <div style={{
                  flex:            1,
                  padding:         '10px 12px',
                  borderRadius:    8,
                  backgroundColor: 'rgba(16,185,129,0.07)',
                  border:          '1px solid rgba(16,185,129,0.2)',
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#10b981', letterSpacing: '0.06em', marginBottom: 4 }}>
                    ✓ SUPPORTING ({data.supportingEvents.length})
                  </div>
                  {data.supportingEvents.map((e, i) => (
                    <div key={i} style={{ fontSize: 11, color: '#10b981', opacity: 0.85 }}>• {e.name}</div>
                  ))}
                </div>
                {/* Opposing */}
                {data.opposingEvents?.length > 0 && (
                  <div style={{
                    flex:            1,
                    padding:         '10px 12px',
                    borderRadius:    8,
                    backgroundColor: 'rgba(239,68,68,0.07)',
                    border:          '1px solid rgba(239,68,68,0.2)',
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', letterSpacing: '0.06em', marginBottom: 4 }}>
                      ✗ OPPOSING ({data.opposingEvents.length})
                    </div>
                    {data.opposingEvents.map((e, i) => (
                      <div key={i} style={{ fontSize: 11, color: '#ef4444', opacity: 0.85 }}>• {e.name}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* AI Narrative */}
            <AiNarrative text={data.narrative} theme={theme} />
          </>
        )}
      </div>
    </div>
  );
}
