import { useState, useRef, useEffect } from 'react';
import {
  Activity, Loader2, AlertCircle, TrendingUp, TrendingDown,
  Zap, Brain, RefreshCw, Lock, ChevronRight,
  BarChart2, Calendar, AlertTriangle, Info,
  CheckCircle2, XCircle, Minus,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { usePlanGate } from '../hooks/usePlanGate';
import PlanGateBanner from './PlanGateBanner';
import UpgradeModal from './UpgradeModal';
import { API_URL } from '../config/api';

// ── Tiny helpers ──────────────────────────────────────────────────────────────
function scoreColor(score) {
  if (score === null || score === undefined) return '#9ca3af';
  if (score > 4)  return '#22c55e';
  if (score > 0)  return '#86efac';
  if (score > -4) return '#fca5a5';
  return '#ef4444';
}

function winRateColor(wr) {
  if (wr === null || wr === undefined) return '#9ca3af';
  if (wr >= 60) return '#22c55e';
  if (wr >= 40) return '#f59e0b';
  return '#ef4444';
}

function fmt(n, decimals = 1) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return Number(n).toFixed(decimals);
}

// ── Section title ─────────────────────────────────────────────────────────────
function SectionTitle({ children, sub }) {
  const theme = useTheme();
  return (
    <div style={{ marginBottom: 16 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: theme.text, margin: 0 }}>{children}</h3>
      {sub && <p style={{ fontSize: 12, color: theme.muted, marginTop: 3 }}>{sub}</p>}
    </div>
  );
}

// ── Card wrapper ──────────────────────────────────────────────────────────────
function Card({ children, style }) {
  const theme = useTheme();
  return (
    <div style={{
      backgroundColor: theme.surface,
      border:          `1px solid ${theme.border}`,
      borderRadius:    12,
      padding:         20,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Insight box ───────────────────────────────────────────────────────────────
function Insight({ icon: Icon, text, color = '#f59e0b' }) {
  const theme = useTheme();
  return (
    <div style={{
      display:         'flex',
      alignItems:      'flex-start',
      gap:             10,
      padding:         '12px 14px',
      borderRadius:    10,
      backgroundColor: `${color}10`,
      border:          `1px solid ${color}30`,
      marginTop:       14,
    }}>
      {Icon && <Icon style={{ width: 15, height: 15, color, flexShrink: 0, marginTop: 1 }} />}
      <p style={{ fontSize: 13, color: theme.text, lineHeight: 1.55, margin: 0 }}>{text}</p>
    </div>
  );
}

// ── Section 5: Macro Alignment Stats ─────────────────────────────────────────
const ALIGN_CFG = {
  aligned:    { label: 'Aligned',    color: '#10b981', Icon: CheckCircle2, desc: 'Macro events supported your direction' },
  misaligned: { label: 'Misaligned', color: '#ef4444', Icon: XCircle,      desc: 'Macro events opposed your direction'  },
  neutral:    { label: 'Neutral',    color: '#f59e0b', Icon: Minus,        desc: 'Mixed or no macro signals'             },
};

function AlignmentStats({ hdrs }) {
  const theme = useTheme();
  const [stats,    setStats]    = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${API_URL}/api/journal/macro-stats`, { headers: hdrs });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed');
      setStats(json.data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 0', color: theme.muted }}>
      <Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} />
      <span style={{ fontSize: 13 }}>Loading alignment stats…</span>
    </div>
  );

  if (error) return (
    <div style={{ fontSize: 13, color: '#ef4444', display: 'flex', gap: 8 }}>
      <AlertCircle style={{ width: 14, height: 14 }} />{error}
    </div>
  );

  if (!stats) return null;

  const CATS = ['aligned', 'misaligned', 'neutral'];
  const hasSomeData = CATS.some(c => stats.stats?.[c]?.total > 0);

  if (!hasSomeData) return (
    <div style={{ textAlign: 'center', padding: '28px 0', color: theme.muted, fontSize: 13 }}>
      No macro-analysed trades yet. Open any trade's detail page — the Trade Context Report auto-generates macro alignment for each trade.
    </div>
  );

  const best = CATS.reduce((acc, c) => {
    const wr = stats.stats?.[c]?.winRate;
    if (wr === null || wr === undefined) return acc;
    return (acc === null || wr > stats.stats?.[acc]?.winRate) ? c : acc;
  }, null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Coverage badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: theme.muted }}>
        <CheckCircle2 style={{ width: 13, height: 13, color: '#10b981' }} />
        <span>{stats.analysedCount} of {stats.totalClosed} closed trades analysed ({stats.coveragePct}% coverage)</span>
        <button onClick={load} title="Refresh" style={{ background:'none',border:'none',cursor:'pointer',color:theme.muted,padding:'2px',marginLeft:4 }}>
          <RefreshCw style={{ width: 12, height: 12 }} />
        </button>
      </div>

      {/* Win rate bars */}
      {CATS.map(cat => {
        const s   = stats.stats?.[cat];
        if (!s || s.total === 0) return null;
        const cfg = ALIGN_CFG[cat];
        const Icon = cfg.Icon;
        const wr  = s.winRate;
        return (
          <div key={cat}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Icon style={{ width: 14, height: 14, color: cfg.color }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: theme.text }}>{cfg.label}</span>
                <span style={{ fontSize: 11, color: theme.muted }}>{cfg.desc}</span>
                {cat === best && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.12)', padding: '1px 7px', borderRadius: 20 }}>BEST</span>
                )}
              </div>
              <span style={{ fontSize: 12, color: theme.muted }}>{s.wins}W / {s.losses}L · {s.total} trades</span>
            </div>
            <div style={{ height: 30, borderRadius: 7, backgroundColor: theme.border, overflow: 'hidden', position: 'relative' }}>
              <div style={{ height: '100%', width: `${wr ?? 0}%`, backgroundColor: cfg.color, borderRadius: 7, transition: 'width 0.7s ease' }} />
              {wr !== null && (
                <div style={{ position: 'absolute', top: 0, left: 10, right: 10, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: (wr ?? 0) > 45 ? 'flex-start' : 'flex-end' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: (wr ?? 0) > 45 ? '#fff' : cfg.color }}>{wr}% win rate</span>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Key insight */}
      {best && stats.stats?.[best]?.winRate != null && (
        <div style={{ padding: '12px 14px', borderRadius: 10, backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.22)', fontSize: 13, color: theme.text, lineHeight: 1.6 }}>
          <span style={{ color: '#10b981', fontWeight: 700 }}>⚡ Key Insight: </span>
          Your win rate when macro is <strong style={{ color: ALIGN_CFG[best].color }}>{best}</strong> is{' '}
          <strong style={{ color: ALIGN_CFG[best].color }}>{stats.stats[best].winRate}%</strong>
          {stats.stats?.misaligned?.winRate != null && best === 'aligned'
            ? ` vs ${stats.stats.misaligned.winRate}% when misaligned — a ${stats.stats.aligned.winRate - stats.stats.misaligned.winRate}pp edge from waiting for macro alignment.`
            : `. Consider waiting for macro alignment before entering trades.`}
        </div>
      )}

      {/* Pair breakdown */}
      {stats.pairBreakdown?.length > 0 && (
        <div style={{ marginTop: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: theme.muted, marginBottom: 8 }}>PER-PAIR BREAKDOWN</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                  {['Pair','Aligned','Misaligned','Neutral'].map(h => (
                    <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600, color: theme.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.pairBreakdown.map(row => (
                  <tr key={row.pair} style={{ borderBottom: `1px solid ${theme.border}` }}>
                    <td style={{ padding: '8px 10px', fontWeight: 700, color: theme.text }}>{row.pair}</td>
                    <td style={{ padding: '8px 10px', color: '#10b981', fontWeight: 600 }}>{row.aligned || 0}</td>
                    <td style={{ padding: '8px 10px', color: '#ef4444', fontWeight: 600 }}>{row.misaligned || 0}</td>
                    <td style={{ padding: '8px 10px', color: theme.muted }}>{row.neutral || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Section 1: Horizontal bar chart (CSS) ─────────────────────────────────────
function MacroRangeChart({ data }) {
  const theme = useTheme();
  const hasData = data.some(r => r.count > 0);

  if (!hasData) {
    return (
      <div style={{ textAlign: 'center', padding: '28px 0', color: theme.muted, fontSize: 13 }}>
        No closed trades yet. Log some trades to see macro correlation.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {data.map(row => {
        const wr  = row.winRate;
        const col = winRateColor(wr);
        const pct = wr ?? 0;
        return (
          <div key={row.range}>
            {/* Label row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>
                {row.emoji} {row.range}
              </span>
              <span style={{ fontSize: 12, color: theme.muted }}>
                {row.count > 0
                  ? `${row.wins}W / ${row.count - row.wins}L · ${row.count} trades`
                  : 'No trades'}
              </span>
            </div>
            {/* Bar */}
            <div style={{ height: 28, borderRadius: 6, backgroundColor: theme.border, overflow: 'hidden', position: 'relative' }}>
              {row.count > 0 && (
                <div style={{
                  height: '100%',
                  width:  `${pct}%`,
                  backgroundColor: col,
                  borderRadius: 6,
                  transition: 'width 0.6s ease',
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: 10,
                  minWidth: pct > 10 ? undefined : 0,
                }} />
              )}
              {row.count > 0 && (
                <div style={{
                  position: 'absolute',
                  top: 0, left: 10, right: 10, bottom: 0,
                  display: 'flex', alignItems: 'center', justifyContent: pct > 45 ? 'flex-start' : 'flex-end',
                }}>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: pct > 45 ? '#fff' : col,
                  }}>
                    {wr !== null ? `${wr}% win rate` : 'N/A'}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Section 2: Indicator impact table ────────────────────────────────────────
function IndicatorTable({ data }) {
  const theme = useTheme();
  if (!data.length) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0', color: theme.muted, fontSize: 13 }}>
        No trades detected on or near indicator release days. Continue trading to build this data.
      </div>
    );
  }

  const worst = [...data].sort((a, b) => a.winRate - b.winRate)[0];

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
              {['Indicator', 'Release Date', 'Trades on Day', 'Win Rate'].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: theme.muted, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map(row => {
              const col = winRateColor(row.winRate);
              const isWorst = row.indicator === worst?.indicator;
              return (
                <tr key={row.code} style={{ borderBottom: `1px solid ${theme.border}` }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: theme.text }}>
                    {isWorst && <AlertTriangle size={13} style={{ marginRight: 5, color: '#f87171', display:'inline-block', verticalAlign:'middle' }}/>}{row.indicator}
                  </td>
                  <td style={{ padding: '10px 12px', color: theme.muted }}>{row.releaseDate}</td>
                  <td style={{ padding: '10px 12px', color: theme.text }}>{row.tradesCount}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontWeight: 700, color: col }}>
                      {row.winRate}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {worst && worst.winRate < 50 && (
        <Insight
          icon={AlertCircle}
          color="#ef4444"
          text={`You lose ${100 - worst.winRate}% of trades on ${worst.indicator} release days (${worst.tradesCount} trades). Consider reducing position size or avoiding trading on these dates.`}
        />
      )}
    </div>
  );
}

// ── Section 3: Scatter / SVG timeline ────────────────────────────────────────
function CorrelationScatter({ timelineTrades, macroTimeline }) {
  const theme  = useTheme();
  const svgRef = useRef(null);
  const [dims, setDims] = useState({ w: 600, h: 220 });

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      setDims({ w: el.clientWidth || 600, h: 220 });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  if (!timelineTrades.length) {
    return (
      <div style={{ textAlign: 'center', padding: '28px 0', color: theme.muted, fontSize: 13 }}>
        No trade data for chart.
      </div>
    );
  }

  const PAD = { top: 16, right: 20, bottom: 36, left: 44 };
  const W   = dims.w - PAD.left - PAD.right;
  const H   = dims.h - PAD.top  - PAD.bottom;

  // Combine trade dates + macro timeline dates for X axis
  const allDates = [
    ...timelineTrades.map(t => t.date),
    ...macroTimeline.map(p => p.date),
  ].filter(Boolean).sort();
  const minDate = allDates[0];
  const maxDate = allDates[allDates.length - 1];

  const allScores = [
    ...timelineTrades.map(t => t.macroScore),
    ...macroTimeline.map(p => p.score),
    -2, 2, // always show neutral band
  ].filter(v => v !== null && v !== undefined);
  const minY = Math.min(-3, ...allScores);
  const maxY = Math.max(3,  ...allScores);

  const toX = (dateStr) => {
    if (!dateStr || minDate === maxDate) return PAD.left + W / 2;
    const t  = new Date(dateStr).getTime();
    const t0 = new Date(minDate).getTime();
    const t1 = new Date(maxDate).getTime();
    return PAD.left + ((t - t0) / (t1 - t0)) * W;
  };

  const toY = (score) => {
    return PAD.top + H - ((score - minY) / (maxY - minY)) * H;
  };

  // Macro score line path
  const linePts = macroTimeline.filter(p => p.date && p.score !== null);
  const linePath = linePts.length >= 2
    ? 'M ' + linePts.map(p => `${toX(p.date).toFixed(1)},${toY(p.score).toFixed(1)}`).join(' L ')
    : null;

  // Y-axis tick labels
  const yTicks = [];
  for (let v = Math.ceil(minY); v <= Math.floor(maxY); v += 2) yTicks.push(v);

  // X-axis months
  const monthSet = new Set(allDates.map(d => d?.slice(0, 7)));
  const months   = [...monthSet].sort().filter((_, i) => i % Math.max(1, Math.floor(monthSet.size / 5)) === 0);

  return (
    <div>
      <svg ref={svgRef} style={{ width: '100%', height: dims.h, display: 'block', overflow: 'visible' }}>
        {/* Neutral band */}
        <rect
          x={PAD.left} y={toY(2)}
          width={W} height={toY(-2) - toY(2)}
          fill={theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}
        />

        {/* Zero line */}
        <line
          x1={PAD.left} y1={toY(0)} x2={PAD.left + W} y2={toY(0)}
          stroke={theme.border} strokeWidth={1} strokeDasharray="4,3"
        />

        {/* Macro score line */}
        {linePath && (
          <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth={2} strokeLinejoin="round" opacity={0.85} />
        )}

        {/* Trade dots */}
        {timelineTrades.map((t, i) => {
          const x   = toX(t.date);
          const y   = toY(t.macroScore);
          const col = t.outcome === 'win' ? '#22c55e' : '#ef4444';
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={5} fill={col} stroke={theme.surface} strokeWidth={1.5} opacity={0.9} />
            </g>
          );
        })}

        {/* Y-axis labels */}
        {yTicks.map(v => (
          <text key={v} x={PAD.left - 6} y={toY(v) + 4}
            fill={theme.muted} fontSize={10} textAnchor="end">
            {v > 0 ? `+${v}` : v}
          </text>
        ))}

        {/* X-axis labels */}
        {months.map(m => (
          <text key={m} x={toX(m + '-15')} y={dims.h - 6}
            fill={theme.muted} fontSize={10} textAnchor="middle">
            {m}
          </text>
        ))}

        {/* Y-axis label */}
        <text
          x={10} y={PAD.top + H / 2}
          transform={`rotate(-90, 10, ${PAD.top + H / 2})`}
          fill={theme.muted} fontSize={10} textAnchor="middle">
          Macro Score
        </text>
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
        {linePts.length >= 2 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: theme.muted }}>
            <div style={{ width: 20, height: 2, backgroundColor: '#3b82f6' }} />
            Macro Score (monthly)
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: theme.muted }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#22c55e' }} />
          Win
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: theme.muted }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ef4444' }} />
          Loss
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: theme.muted }}>
          <div style={{ width: 30, height: 10, borderRadius: 3, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />
          Neutral zone (−2 to +2)
        </div>
      </div>
    </div>
  );
}

// ── Section 4: AI narrative ───────────────────────────────────────────────────
function AiNarrative({ text }) {
  const theme = useTheme();
  if (!text) return null;

  const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0);

  return (
    <div style={{
      padding:         20,
      borderRadius:    12,
      backgroundColor: theme.isDark ? 'rgba(14,165,233,0.07)' : 'rgba(14,165,233,0.05)',
      border:          `1px solid rgba(14,165,233,0.2)`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(14,165,233,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Brain style={{ width: 14, height: 14, color: '#0ea5e9' }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: theme.text }}>AI Macro Analysis</span>
        <span style={{ fontSize: 11, color: theme.muted, marginLeft: 'auto' }}>✦ Zynth AI</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {paragraphs.map((p, i) => (
          <p key={i} style={{ margin: 0, fontSize: 13, color: theme.text, lineHeight: 1.65 }}>{p}</p>
        ))}
      </div>
    </div>
  );
}

// ── Current macro score badge ─────────────────────────────────────────────────
function MacroBadge({ score, label }) {
  const theme = useTheme();
  const col   = scoreColor(score);
  const icon  = score > 0 ? TrendingUp : score < 0 ? TrendingDown : Activity;
  const Icon  = icon;
  return (
    <div style={{
      display:         'inline-flex',
      alignItems:      'center',
      gap:             7,
      padding:         '6px 12px',
      borderRadius:    20,
      backgroundColor: `${col}15`,
      border:          `1px solid ${col}40`,
      fontSize:        13,
      fontWeight:      700,
      color:           col,
    }}>
      <Icon style={{ width: 14, height: 14 }} />
      Macro: {score !== null ? `${score > 0 ? '+' : ''}${fmt(score)}` : '—'} · {label ?? 'Unknown'}
    </div>
  );
}

// ── Empty / not-yet-generated state ──────────────────────────────────────────
function EmptyState({ theme, onGenerate, loading }) {
  return (
    <div style={{
      display:         'flex',
      flexDirection:   'column',
      alignItems:      'center',
      justifyContent:  'center',
      padding:         '48px 24px',
      textAlign:       'center',
      gap:             16,
    }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: `${theme.accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Activity style={{ width: 28, height: 28, color: theme.accent }} />
      </div>
      <div>
        <h4 style={{ fontSize: 15, fontWeight: 700, color: theme.text, margin: '0 0 6px' }}>
          Macro-Journal Correlation
        </h4>
        <p style={{ fontSize: 13, color: theme.muted, margin: 0, maxWidth: 360, lineHeight: 1.6 }}>
          Discover whether you perform better during bullish or bearish macro conditions.
          Analysis uses FRED historical economic data matched to your trade dates.
        </p>
      </div>
      <button onClick={onGenerate} disabled={loading}
        style={{
          display:         'flex',
          alignItems:      'center',
          gap:             8,
          padding:         '11px 28px',
          borderRadius:    10,
          border:          'none',
          cursor:          loading ? 'wait' : 'pointer',
          fontWeight:      700,
          fontSize:        14,
          backgroundColor: '#10b981',
          color:           '#fff',
          opacity:         loading ? 0.7 : 1,
        }}>
        {loading ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> : <ChevronRight style={{ width: 16, height: 16 }} />}
        {loading ? 'Analysing…' : 'Generate Analysis'}
      </button>
    </div>
  );
}

// ── Pro gate ──────────────────────────────────────────────────────────────────
function ProGate() {
  const theme = useTheme();
  const [showModal, setShowModal] = useState(false);
  return (
    <div style={{ padding: '24px 0' }}>
      <PlanGateBanner
        feature="Macro-Journal Correlation"
        requiredPlan="Pro"
        description="See how macro conditions affect your trades and which economic events you should avoid. Pro and Elite users only."
        onUpgradeClick={() => setShowModal(true)}
      />
      <UpgradeModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MacroCorrelation() {
  const theme      = useTheme();
  const { token }  = useAuth();
  const { isPro, isElite, isAdmin } = usePlanGate();

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const hdrs = token ? { Authorization: `Bearer ${token}` } : {};

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`${API_URL}/api/analysis/macro-correlation`, { headers: hdrs });
      const json = await resp.json();
      if (!resp.ok || !json.success) throw new Error(json.error || 'Failed to load analysis');
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Plan gate
  if (!isPro && !isElite && !isAdmin) return <ProGate />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: theme.text, margin: '0 0 4px' }}>
            Macro-Journal Correlation
          </h2>
          <p style={{ fontSize: 13, color: theme.muted, margin: 0 }}>
            How macro conditions affect YOUR trades
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {data && (
            <MacroBadge score={data.currentMacroScore} label={data.currentMacroLabel} />
          )}
          <button onClick={generate} disabled={loading}
            style={{
              display:         'flex',
              alignItems:      'center',
              gap:             7,
              padding:         '9px 18px',
              borderRadius:    10,
              border:          'none',
              cursor:          loading ? 'wait' : 'pointer',
              fontWeight:      700,
              fontSize:        13,
              backgroundColor: '#10b981',
              color:           '#fff',
              opacity:         loading ? 0.7 : 1,
            }}>
            {loading
              ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
              : data ? <RefreshCw style={{ width: 14, height: 14 }} /> : <Activity style={{ width: 14, height: 14 }} />}
            {loading ? 'Analysing…' : data ? 'Refresh' : 'Generate Analysis'}
          </button>
        </div>
      </div>

      {/* Spin keyframe */}
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>

      {/* Error */}
      {error && !loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', fontSize: 13 }}>
          <AlertCircle style={{ width: 15, height: 15, flexShrink: 0 }} />
          {error}
        </div>
      )}

      {/* Not yet generated */}
      {!data && !loading && !error && (
        <Card>
          <EmptyState theme={theme} onGenerate={generate} loading={loading} />
        </Card>
      )}

      {/* Loading skeleton */}
      {loading && !data && (
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {['100%', '80%', '90%', '60%', '75%'].map((w, i) => (
              <div key={i} style={{ height: 32, width: w, borderRadius: 7, backgroundColor: theme.border, animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }`}</style>
        </Card>
      )}

      {/* ── Analysis sections ── */}
      {data && (
        <>
          {/* Stats row */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { label: 'Total Trades',   value: data.totalTrades },
              { label: 'Closed Trades',  value: data.closedTradesCount },
              { label: 'Data Source',    value: data.dataSource === 'fred_historical' ? 'FRED Historical' : 'Current Score' },
              { label: 'Snapshots Saved', value: data.snapshots?.length ?? 0 },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, minWidth: 120, padding: '12px 16px', borderRadius: 10, backgroundColor: theme.surface, border: `1px solid ${theme.border}`, textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: theme.text }}>{s.value}</div>
                <div style={{ fontSize: 11, color: theme.muted, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Section 1: Macro Score vs Win Rate */}
          <Card>
            <SectionTitle
              sub="Does your win rate improve when macro conditions are bullish?"
            >
              <BarChart2 size={15} style={{display:'inline-block',verticalAlign:'middle',marginRight:'6px'}} />Macro Score vs Win Rate
            </SectionTitle>
            <MacroRangeChart data={data.macroRangeStats} />
            {data.keyInsight && (
              <Insight icon={Zap} text={`${data.keyInsight}`} color="#10b981" />
            )}
            {data.dataSource !== 'fred_historical' && (
              <Insight
                icon={AlertCircle}
                color="#f59e0b"
                text="Macro scores are based on current conditions. Historical accuracy improves as daily snapshots accumulate. Run analysis daily to build your history."
              />
            )}
          </Card>

          {/* Section 2: Indicator Impact */}
          <Card>
            <SectionTitle
              sub="How you perform on economic indicator release days"
            >
              <Calendar size={15} style={{display:'inline-block',verticalAlign:'middle',marginRight:'6px'}} />Indicator Release Day Impact
            </SectionTitle>
            <IndicatorTable data={data.indicatorImpact} />
          </Card>

          {/* Section 3: Correlation Chart */}
          <Card>
            <SectionTitle
              sub="Trade outcomes plotted against macro score over time. Green dots = wins, red dots = losses."
            >
              <TrendingUp size={15} style={{display:'inline-block',verticalAlign:'middle',marginRight:'6px'}} />Macro Score vs Trade Outcomes
            </SectionTitle>
            <CorrelationScatter
              timelineTrades={data.timelineTrades}
              macroTimeline={data.macroTimeline}
            />
            {data.macroTimeline.length < 3 && (
              <p style={{ fontSize: 12, color: theme.muted, marginTop: 10 }}>
                <Info size={13} style={{display:'inline-block',verticalAlign:'middle',marginRight:'4px'}} /> Run this analysis daily to build your macro score history and see the trend line.
              </p>
            )}
          </Card>

          {/* Section 5: Trade Context Report — Alignment Stats */}
          <Card>
            <SectionTitle
              sub="Win rate split by whether macro events supported or opposed your trade direction. Powered by Trade Context Reports."
            >
              <CheckCircle2 size={15} style={{display:'inline-block',verticalAlign:'middle',marginRight:'6px'}} />Trade Context — Macro Alignment
            </SectionTitle>
            <AlignmentStats hdrs={hdrs} />
          </Card>

          {/* Section 4: AI Narrative */}
          {data.aiNarrative && (
            <AiNarrative text={data.aiNarrative} />
          )}
          {!data.aiNarrative && (
            <div style={{ padding: '12px 16px', borderRadius: 10, backgroundColor: theme.surface, border: `1px solid ${theme.border}`, fontSize: 13, color: theme.muted }}>
              AI narrative unavailable — configure <code>GEMINI_API_KEY</code> to enable AI analysis.
            </div>
          )}
        </>
      )}
    </div>
  );
}
