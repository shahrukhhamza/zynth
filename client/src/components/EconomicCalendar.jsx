import { useState, useEffect } from 'react';
import { fetchEconomicCalendar } from '../services/calendarApi';
import {
  Calendar, TrendingUp, TrendingDown, AlertCircle,
  ChevronDown, ChevronUp, Activity, Lightbulb, Target,
  Printer, Download, X, CheckSquare, Square, ShieldCheck,
  BarChart2, Clock, RefreshCw,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import { useTimezone } from '../contexts/TimezoneContext';
import { usePlanGate } from '../hooks/usePlanGate';
import PlanGateBanner from './PlanGateBanner';
import ProfileModal from './ProfileModal';

// ── Tooltip (stable reference) ────────────────────────────────────────────────
function CalTooltip({ active, payload, D, formatDate }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: D.cardBg, border: `1px solid ${D.border}`, borderRadius: 8, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
      {d.date && <p style={{ fontSize: 11, color: D.textSub, margin: '0 0 6px' }}>{new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {[['Actual', d.actual, D.accent], ['Forecast', d.forecast, D.blue], ['Previous', d.previous, D.textSub]].map(([lbl, val, col]) => val != null && (
          <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: D.textSub }}>{lbl}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: col }}>{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(v, unit) {
  if (v == null || v === '') return '—';
  return `${v}${unit ?? ''}`;
}

function getSurprise(actual, forecast) {
  const a = parseFloat(actual), f = parseFloat(forecast);
  if (isNaN(a) || isNaN(f) || f === 0) return null;
  return ((a - f) / Math.abs(f)) * 100;
}

function ImpactBadge({ impact, size = 'sm' }) {
  const pad   = size === 'sm' ? '3px 9px' : '4px 12px';
  const fsize = size === 'sm' ? 10 : 11;
  if (impact === 'high') return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: pad, borderRadius: 99, background: '#ef444415', border: '1px solid #ef444430', color: '#ef4444', fontSize: fsize, fontWeight: 800, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', animation: 'calPulse 1.5s ease-in-out infinite' }} />
      HIGH
    </span>
  );
  if (impact === 'medium') return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: pad, borderRadius: 99, background: '#f59e0b15', border: '1px solid #f59e0b30', color: '#f59e0b', fontSize: fsize, fontWeight: 700, whiteSpace: 'nowrap' }}>
      MED
    </span>
  );
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: pad, borderRadius: 99, background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.2)', color: '#64748b', fontSize: fsize, fontWeight: 600, whiteSpace: 'nowrap' }}>
      LOW
    </span>
  );
}

function SurpriseBadge({ actual, forecast }) {
  const surp = getSurprise(actual, forecast);
  if (surp === null) return <span style={{ color: '#64748b', fontSize: 11 }}>—</span>;
  if (Math.abs(surp) < 0.5) return (
    <span style={{ padding: '3px 9px', borderRadius: 99, background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.2)', color: '#64748b', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
      In Line
    </span>
  );
  return surp > 0
    ? <span style={{ padding: '3px 9px', borderRadius: 99, background: '#10b98115', border: '1px solid #10b98130', color: '#10b981', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>+{surp.toFixed(1)}% Beat</span>
    : <span style={{ padding: '3px 9px', borderRadius: 99, background: '#ef444415', border: '1px solid #ef444430', color: '#ef4444', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{surp.toFixed(1)}% Miss</span>;
}

// ── Main Component ────────────────────────────────────────────────────────────
function EconomicCalendar() {
  const theme  = useTheme();
  const { formatDateWithTimezone } = useTimezone();
  const { isFree } = usePlanGate();

  const [indicators,      setIndicators]      = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);
  const [showUpgradeModal,setShowUpgradeModal] = useState(false);
  const [expandedRow,     setExpandedRow]     = useState(null);
  const [filterImpact,    setFilterImpact]    = useState('all');
  const [printModal,      setPrintModal]      = useState(false);
  const [printSelection,  setPrintSelection]  = useState({});

  // ── Design tokens ────────────────────────────────────────────────────────
  const D = {
    isDark:  theme.isDark,
    pageBg:  theme.isDark ? '#000000' : '#f1f3f6',
    cardBg:  theme.isDark ? '#0d0d0d' : '#ffffff',
    cardBg2: theme.isDark ? '#111111' : '#f7f8fa',
    border:  theme.isDark ? '#1e1e1e' : '#e5e8ed',
    border2: theme.isDark ? '#2a2a2a' : '#d0d5de',
    text:    theme.isDark ? '#f0f0f0' : '#0d1117',
    textSub: theme.isDark ? '#5a6472' : '#5a6472',
    textMute:theme.isDark ? '#2a2a2a' : '#b0b8c4',
    accent:  '#10b981',
    blue:    theme.isDark ? '#60a5fa' : '#2563eb',
    gold:    theme.isDark ? '#f59e0b' : '#d97706',
    red:     '#ef4444',
  };

  useEffect(() => { loadCalendar(); }, []);

  const loadCalendar = async () => {
    try {
      setLoading(true);
      const data = await fetchEconomicCalendar();
      setIndicators(data);
      setError(null);
    } catch (err) {
      setError('Failed to load economic calendar');
    } finally {
      setLoading(false);
    }
  };

  const filtered = filterImpact === 'all' ? indicators : indicators.filter(i => i.impact === filterImpact);

  // ── Print helpers ────────────────────────────────────────────────────────
  const openPrintModal = () => {
    const sel = {};
    filtered.forEach(i => { sel[i.id] = true; });
    setPrintSelection(sel);
    setPrintModal(true);
  };
  const selectedForPrint = filtered.filter(i => printSelection[i.id]);

  const buildPrintHTML = () => {
    const rows = selectedForPrint.map(ind => `
      <tr>
        <td>${ind.name}</td>
        <td style="text-align:center">${ind.currency}</td>
        <td style="text-align:center;font-weight:700;color:${ind.impact === 'high' ? '#dc2626' : ind.impact === 'medium' ? '#d97706' : '#16a34a'}">${ind.impact.toUpperCase()}</td>
        <td style="text-align:right;font-weight:700">${fmt(ind.current, ind.unit)}</td>
        <td style="text-align:right">${fmt(ind.forecast, ind.unit)}</td>
        <td style="text-align:right">${fmt(ind.previous, ind.unit)}</td>
        <td style="text-align:center">${(() => { const s = getSurprise(ind.current, ind.forecast); return s === null ? '—' : Math.abs(s) < 0.5 ? 'In Line' : s > 0 ? `+${s.toFixed(1)}% Beat` : `${s.toFixed(1)}% Miss`; })()}</td>
      </tr>`).join('');
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Economic Calendar</title>
      <style>*{box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;padding:24px;color:#1a1a2e}h1{font-size:20px;font-weight:700;margin-bottom:4px}.sub{font-size:11px;color:#64748b;margin-bottom:20px}table{width:100%;border-collapse:collapse}th{background:#1e293b;color:#fff;padding:8px 12px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.06em}td{padding:8px 12px;border-bottom:1px solid #e2e8f0}tr:nth-child(even) td{background:#f8fafc}.footer{margin-top:16px;font-size:10px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:8px}</style>
      </head><body><h1>Economic Calendar</h1><p class="sub">Generated ${new Date().toLocaleString()} · ${selectedForPrint.length} indicators</p>
      <table><thead><tr><th>Event</th><th style="text-align:center">Currency</th><th style="text-align:center">Impact</th><th style="text-align:right">Actual</th><th style="text-align:right">Forecast</th><th style="text-align:right">Previous</th><th style="text-align:center">Surprise</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <p class="footer">Data for informational purposes only. Verify before trading.</p></body></html>`;
  };

  const handlePrint = () => {
    if (!selectedForPrint.length) return;
    const win = window.open('', '_blank', 'width=900,height=650');
    win.document.write(buildPrintHTML());
    win.document.close();
    setTimeout(() => win.print(), 400);
    setPrintModal(false);
  };

  const handleDownload = () => {
    if (!selectedForPrint.length) return;
    const blob = new Blob([buildPrintHTML()], { type: 'text/html' });
    const a    = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `economic-calendar-${new Date().toISOString().split('T')[0]}.html` });
    a.click();
    URL.revokeObjectURL(a.href);
    setPrintModal(false);
  };

  // ── Stats ────────────────────────────────────────────────────────────────
  const beats    = filtered.filter(i => { const s = getSurprise(i.current, i.forecast); return s !== null && s > 0.5; }).length;
  const misses   = filtered.filter(i => { const s = getSurprise(i.current, i.forecast); return s !== null && s < -0.5; }).length;
  const netScore = beats - misses;
  const nextInd  = [...filtered].filter(i => i.date).sort((a, b) => new Date(a.date) - new Date(b.date)).find(i => new Date(i.date) > new Date());

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240, background: D.pageBg }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 28, height: 28, border: `2px solid ${D.accent}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />
        <p style={{ fontSize: 13, color: D.textSub, margin: 0 }}>Loading calendar…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240, background: D.pageBg }}>
      <div style={{ textAlign: 'center' }}>
        <AlertCircle style={{ width: 32, height: 32, color: D.red, margin: '0 auto 10px' }} />
        <p style={{ color: D.red, margin: '0 0 14px', fontSize: 13 }}>{error}</p>
        <button onClick={loadCalendar} style={{ padding: '8px 18px', background: D.accent, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Retry</button>
      </div>
    </div>
  );

  return (
    <div style={{ background: D.pageBg, minHeight: '100%' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes calPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.35;transform:scale(.65)} }
        .cal-tr { transition: background 0.12s ease; cursor: pointer; }
        .cal-tr:hover td { background: ${D.cardBg2} !important; }
        @media (max-width: 767px) {
          .cal-col-hide { display: none !important; }
          .cal-mobile-grid { display: grid !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 56px' }}>

        {isFree && (
          <div style={{ marginBottom: 20 }}>
            <PlanGateBanner feature="AI-Powered Insights" requiredPlan="Pro" description="Upgrade to Pro to unlock AI macro analysis, impact predictions, and surprise scoring." onUpgradeClick={() => setShowUpgradeModal(true)} />
          </div>
        )}
        {showUpgradeModal && <ProfileModal onClose={() => setShowUpgradeModal(false)} />}

        {/* ── Print Modal ─────────────────────────────────────────────── */}
        {printModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', padding: 16 }} onClick={e => e.target === e.currentTarget && setPrintModal(false)}>
            <div style={{ background: D.cardBg, border: `1px solid ${D.border}`, borderRadius: 14, width: '100%', maxWidth: 440, boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${D.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Printer style={{ width: 16, height: 16, color: D.accent }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: D.text }}>Print / Download</span>
                </div>
                <button onClick={() => setPrintModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: D.textSub, display: 'flex' }}>
                  <X style={{ width: 16, height: 16 }} />
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 20px', borderBottom: `1px solid ${D.border}` }}>
                <button onClick={() => { const s = {}; filtered.forEach(i => s[i.id] = true); setPrintSelection(s); }} style={{ fontSize: 12, color: D.accent, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Select all</button>
                <button onClick={() => { const s = {}; filtered.forEach(i => s[i.id] = false); setPrintSelection(s); }} style={{ fontSize: 12, color: D.textSub, background: 'none', border: 'none', cursor: 'pointer' }}>Deselect all</button>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: D.textSub }}>{selectedForPrint.length}/{filtered.length}</span>
              </div>
              <div style={{ maxHeight: 280, overflowY: 'auto', padding: '6px' }}>
                {filtered.map(ind => (
                  <label key={ind.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = D.cardBg2}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <input type="checkbox" style={{ display: 'none' }} checked={!!printSelection[ind.id]} onChange={() => setPrintSelection(p => ({ ...p, [ind.id]: !p[ind.id] }))} />
                    {printSelection[ind.id]
                      ? <CheckSquare style={{ width: 15, height: 15, color: D.accent, flexShrink: 0 }} />
                      : <Square     style={{ width: 15, height: 15, color: D.textSub, flexShrink: 0 }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: D.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ind.name}</div>
                      <div style={{ fontSize: 11, color: D.textSub, marginTop: 2 }}>{ind.impact} impact</div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: parseFloat(ind.current) >= parseFloat(ind.forecast) ? D.accent : D.red, flexShrink: 0 }}>{fmt(ind.current, ind.unit)}</span>
                  </label>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, padding: '16px 20px', borderTop: `1px solid ${D.border}` }}>
                <button onClick={handlePrint} disabled={!selectedForPrint.length} style={{ flex: 1, padding: '10px', background: D.accent, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: selectedForPrint.length ? 'pointer' : 'not-allowed', opacity: selectedForPrint.length ? 1 : 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Printer style={{ width: 13, height: 13 }} /> Print
                </button>
                <button onClick={handleDownload} disabled={!selectedForPrint.length} style={{ flex: 1, padding: '10px', background: D.cardBg2, color: D.accent, border: `1px solid ${D.accent}40`, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: selectedForPrint.length ? 'pointer' : 'not-allowed', opacity: selectedForPrint.length ? 1 : 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Download style={{ width: 13, height: 13 }} /> Download
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Page Header ──────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: D.text, margin: 0, letterSpacing: '-0.02em' }}>Economic Calendar</h1>
            <p style={{ fontSize: 13, color: D.textSub, margin: '4px 0 0' }}>17 US macro indicators — Updated automatically</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={loadCalendar} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: D.cardBg, border: `1px solid ${D.border}`, borderRadius: 8, color: D.textSub, fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'border-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = D.border2}
              onMouseLeave={e => e.currentTarget.style.borderColor = D.border}
            >
              <RefreshCw style={{ width: 13, height: 13 }} /> Refresh
            </button>
            <button onClick={openPrintModal} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: D.cardBg, border: `1px solid ${D.border}`, borderRadius: 8, color: D.textSub, fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = D.accent; e.currentTarget.style.color = D.accent; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = D.border; e.currentTarget.style.color = D.textSub; }}
            >
              <Printer style={{ width: 13, height: 13 }} /> Print / Download
            </button>
          </div>
        </div>

        {/* ── Filter tabs ───────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {[
            { key: 'all',    label: 'All' },
            { key: 'high',   label: 'High',   color: '#ef4444' },
            { key: 'medium', label: 'Medium', color: '#f59e0b' },
            { key: 'low',    label: 'Low',    color: '#64748b' },
          ].map(f => {
            const active = filterImpact === f.key;
            return (
              <button key={f.key} onClick={() => setFilterImpact(f.key)} style={{
                padding: '7px 18px', borderRadius: 99, fontSize: 12, fontWeight: 700,
                background: active ? (f.color ?? D.accent) : D.cardBg,
                color: active ? '#fff' : D.textSub,
                border: `1px solid ${active ? (f.color ?? D.accent) : D.border}`,
                cursor: 'pointer', transition: 'all 0.15s',
                letterSpacing: '0.02em',
              }}>
                {f.label}
              </button>
            );
          })}
        </div>

        {/* ── Stats bar ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {[
            { icon: BarChart2, label: `${filtered.length} Indicators` },
            { icon: Clock,     label: `Updated: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` },
            nextInd && { icon: Calendar, label: `Next: ${nextInd.name} · ${new Date(nextInd.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` },
          ].filter(Boolean).map((item, i) => (
            <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 99, background: D.cardBg, border: `1px solid ${D.border}`, fontSize: 12, color: D.textSub }}>
              <item.icon style={{ width: 12, height: 12 }} />
              {item.label}
            </div>
          ))}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 99, background: netScore >= 0 ? '#10b98110' : '#ef444410', border: `1px solid ${netScore >= 0 ? '#10b98130' : '#ef444430'}`, fontSize: 12, fontWeight: 700, color: netScore >= 0 ? D.accent : D.red }}>
            {netScore >= 0 ? <TrendingUp style={{ width: 12, height: 12 }} /> : <TrendingDown style={{ width: 12, height: 12 }} />}
            Macro Score: {netScore >= 0 ? '+' : ''}{netScore} {netScore > 2 ? 'Bullish' : netScore < -2 ? 'Bearish' : 'Neutral'}
          </div>
        </div>

        {/* ── Table ─────────────────────────────────────────────────────── */}
        <div style={{ background: D.cardBg, border: `1px solid ${D.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: D.cardBg2, borderBottom: `1px solid ${D.border}` }}>
                  {[
                    { label: 'Event',    align: 'left',   cls: '' },
                    { label: 'Currency', align: 'center', cls: 'cal-col-hide' },
                    { label: 'Impact',   align: 'center', cls: 'cal-col-hide' },
                    { label: 'Actual',   align: 'right',  cls: 'cal-col-hide' },
                    { label: 'Forecast', align: 'right',  cls: 'cal-col-hide' },
                    { label: 'Previous', align: 'right',  cls: 'cal-col-hide' },
                    { label: 'Surprise', align: 'center', cls: 'cal-col-hide' },
                    { label: '',         align: 'center', cls: '' },
                  ].map((col, i) => (
                    <th key={i} className={col.cls} style={{ padding: '12px 16px', textAlign: col.align, fontSize: 10, fontWeight: 700, color: D.textSub, letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((ind, idx) => {
                  const isExp  = expandedRow === ind.id;
                  const aNum   = parseFloat(ind.current);
                  const pNum   = parseFloat(ind.previous);
                  const trend  = !isNaN(aNum) && !isNaN(pNum) ? (aNum >= pNum ? 'up' : 'down') : null;

                  return (
                    <>
                      {/* Main row */}
                      <tr
                        key={ind.id}
                        className="cal-tr"
                        onClick={() => setExpandedRow(isExp ? null : ind.id)}
                        style={{ borderBottom: `1px solid ${D.border}` }}
                      >
                        {/* Event */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, background: trend === 'up' ? '#10b98115' : trend === 'down' ? '#ef444415' : D.cardBg2, border: `1px solid ${trend === 'up' ? '#10b98130' : trend === 'down' ? '#ef444430' : D.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                              {trend === 'up'   ? <TrendingUp   style={{ width: 13, height: 13, color: '#10b981' }} />
                               : trend === 'down' ? <TrendingDown style={{ width: 13, height: 13, color: '#ef4444' }} />
                               : <Activity style={{ width: 13, height: 13, color: D.textSub }} />}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 14, fontWeight: 700, color: D.text }}>{ind.name}</span>
                                {ind.webVerified && <ShieldCheck style={{ width: 12, height: 12, color: D.accent, flexShrink: 0 }} />}
                                {ind.corrected && <span style={{ fontSize: 9, fontWeight: 700, color: '#f59e0b', background: '#f59e0b15', border: '1px solid #f59e0b30', padding: '1px 6px', borderRadius: 4, letterSpacing: '0.06em' }}>CORRECTED</span>}
                              </div>
                              <div style={{ fontSize: 11, color: D.textSub, marginTop: 3, fontStyle: 'italic' }}>
                                {ind.reportingPeriod ? `${ind.reportingPeriod} · ` : ''}{ind.frequency}
                              </div>
                              {/* Mobile: impact + data grid */}
                              <div className="cal-mobile-grid" style={{ display: 'none', marginTop: 8 }}>
                                <div style={{ marginBottom: 6 }}><ImpactBadge impact={ind.impact} /></div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                                  {[['Actual', fmt(ind.current, ind.unit), D.text, true], ['Forecast', `(${fmt(ind.forecast, ind.unit)})`, D.textSub, false], ['Previous', fmt(ind.previous, ind.unit), D.textSub, false]].map(([lbl, val, col, bold]) => (
                                    <div key={lbl} style={{ background: D.cardBg2, border: `1px solid ${D.border}`, borderRadius: 6, padding: '7px 9px' }}>
                                      <div style={{ fontSize: 9, fontWeight: 700, color: D.textSub, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>{lbl}</div>
                                      <div style={{ fontSize: 13, fontWeight: bold ? 700 : 500, color: col }}>{val}</div>
                                    </div>
                                  ))}
                                  <div style={{ background: D.cardBg2, border: `1px solid ${D.border}`, borderRadius: 6, padding: '7px 9px' }}>
                                    <div style={{ fontSize: 9, fontWeight: 700, color: D.textSub, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>Surprise</div>
                                    <SurpriseBadge actual={ind.current} forecast={ind.forecast} />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Currency */}
                        <td className="cal-col-hide" style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: 99, background: D.cardBg2, border: `1px solid ${D.border}`, fontSize: 11, fontWeight: 700, color: D.text }}>
                            {ind.currency}
                          </span>
                        </td>

                        {/* Impact */}
                        <td className="cal-col-hide" style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <ImpactBadge impact={ind.impact} />
                        </td>

                        {/* Actual */}
                        <td className="cal-col-hide" style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5 }}>
                            {trend === 'up'   && <TrendingUp   style={{ width: 13, height: 13, color: '#10b981' }} />}
                            {trend === 'down' && <TrendingDown style={{ width: 13, height: 13, color: '#ef4444' }} />}
                            <span style={{ fontSize: 16, fontWeight: 800, color: !isNaN(aNum) ? D.text : D.textSub, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                              {fmt(ind.current, ind.unit)}
                            </span>
                          </div>
                        </td>

                        {/* Forecast */}
                        <td className="cal-col-hide" style={{ padding: '14px 16px', textAlign: 'right', fontSize: 14, color: D.textSub }}>
                          ({fmt(ind.forecast, ind.unit)})
                        </td>

                        {/* Previous */}
                        <td className="cal-col-hide" style={{ padding: '14px 16px', textAlign: 'right', fontSize: 14, color: D.textSub }}>
                          {fmt(ind.previous, ind.unit)}
                        </td>

                        {/* Surprise */}
                        <td className="cal-col-hide" style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <SurpriseBadge actual={ind.current} forecast={ind.forecast} />
                        </td>

                        {/* Expand */}
                        <td style={{ padding: '14px 10px', textAlign: 'center', width: 36 }}>
                          {isExp
                            ? <ChevronUp   style={{ width: 15, height: 15, color: D.accent, display: 'block', margin: '0 auto' }} />
                            : <ChevronDown style={{ width: 15, height: 15, color: D.textSub, display: 'block', margin: '0 auto' }} />}
                        </td>
                      </tr>

                      {/* Expanded row */}
                      {isExp && (
                        <tr key={`${ind.id}-exp`} style={{ borderBottom: `1px solid ${D.border}` }}>
                          <td colSpan={8} style={{ padding: '0 16px 24px', background: D.cardBg2 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 16 }}>

                              {/* AI Insights */}
                              {ind.aiInsights && (
                                <div style={{ background: D.cardBg, border: '1px solid #0ea5e930', borderLeft: '3px solid #0ea5e9', borderRadius: 10, padding: '16px 18px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                    <Lightbulb style={{ width: 14, height: 14, color: '#0ea5e9' }} />
                                    <span style={{ fontSize: 10, fontWeight: 700, color: '#0ea5e9', letterSpacing: '0.1em', textTransform: 'uppercase' }}>AI Market Analysis</span>
                                  </div>
                                  <p style={{ fontSize: 13, color: D.text, margin: '0 0 12px', lineHeight: 1.7 }}>{ind.aiInsights.summary}</p>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                                    {[
                                      { label: 'Impact',         value: ind.aiInsights.impact?.replace('_', ' ').toUpperCase() },
                                      { label: 'Market Reaction',value: ind.aiInsights.marketReaction },
                                      { label: 'Trading Bias',   value: ind.aiInsights.tradingBias },
                                    ].map(c => (
                                      <div key={c.label} style={{ background: D.cardBg2, border: `1px solid ${D.border}`, borderRadius: 7, padding: '9px 12px' }}>
                                        <div style={{ fontSize: 9, fontWeight: 700, color: D.textSub, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>{c.label}</div>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: D.text }}>{c.value}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Scenario Analysis */}
                              {ind.scenarioAnalysis && (
                                <div style={{ background: D.cardBg, border: `1px solid ${D.border}`, borderLeft: `3px solid ${D.accent}`, borderRadius: 10, padding: '16px 18px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                    <Target style={{ width: 14, height: 14, color: D.accent }} />
                                    <span style={{ fontSize: 10, fontWeight: 700, color: D.accent, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Pre-Release Scenario Analysis</span>
                                  </div>
                                  <pre style={{ fontSize: 12, color: D.text, whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0, lineHeight: 1.7 }}>{ind.scenarioAnalysis}</pre>
                                </div>
                              )}

                              {/* Details */}
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                {[
                                  { label: 'Source',       value: ind.source },
                                  { label: 'Usual Effect', value: ind.usualEffect },
                                  { label: 'Description',  value: ind.description, full: true },
                                ].map(d => d.value && (
                                  <div key={d.label} style={{ gridColumn: d.full ? '1 / -1' : undefined }}>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: D.textSub, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>{d.label}</div>
                                    <p style={{ fontSize: 13, color: D.text, margin: 0, lineHeight: 1.6 }}>{d.value}</p>
                                  </div>
                                ))}
                              </div>

                              {/* Historical Chart */}
                              {ind.historicalData?.length > 0 && (
                                <div>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: D.textSub, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
                                    Historical Data (12 Months)
                                  </div>
                                  <ResponsiveContainer width="100%" height={240}>
                                    <BarChart data={ind.historicalData} margin={{ top: 16, right: 4, left: 4, bottom: 4 }}>
                                      <CartesianGrid strokeDasharray="3 3" stroke={D.border} />
                                      <XAxis dataKey="date" stroke={D.textSub} fontSize={10} tickFormatter={d => new Date(d).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })} />
                                      <YAxis stroke={D.textSub} fontSize={10} tickFormatter={v => `${v}${ind.unit}`} />
                                      <Tooltip content={<CalTooltip D={D} />} cursor={{ fill: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }} />
                                      <ReferenceLine y={0} stroke={D.border2} />
                                      <Bar dataKey="actual"   fill={D.accent} radius={[4,4,0,0]} name="Actual" />
                                      <Bar dataKey="forecast" fill={D.blue}   radius={[4,4,0,0]} name="Forecast" opacity={0.6} />
                                    </BarChart>
                                  </ResponsiveContainer>
                                </div>
                              )}

                              {/* Recent Releases */}
                              {ind.releases?.length > 0 && (
                                <div>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: D.textSub, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Recent Releases</div>
                                  <div style={{ background: D.cardBg, border: `1px solid ${D.border}`, borderRadius: 10, overflow: 'hidden' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                      <thead>
                                        <tr style={{ background: D.cardBg2, borderBottom: `1px solid ${D.border}` }}>
                                          {['Date','Actual','Forecast','Previous'].map((h, i) => (
                                            <th key={h} style={{ padding: '9px 14px', textAlign: i === 0 ? 'left' : 'right', fontSize: 10, fontWeight: 700, color: D.textSub, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {ind.releases.map((r, i) => {
                                          const diff = parseFloat(r.actual) - parseFloat(r.forecast);
                                          const col  = isNaN(diff) ? D.text : diff >= 0 ? D.accent : D.red;
                                          return (
                                            <tr key={i} style={{ borderBottom: `1px solid ${D.border}` }}>
                                              <td style={{ padding: '10px 14px', fontSize: 13, color: D.textSub }}>{r.date ? new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>
                                              <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: col }}>{fmt(r.actual, ind.unit)}</td>
                                              <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: 13, color: D.textSub }}>{fmt(r.forecast, ind.unit)}</td>
                                              <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: 13, color: D.textSub }}>{fmt(r.previous, ind.unit)}</td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: D.textSub }}>
              <Calendar style={{ width: 32, height: 32, margin: '0 auto 10px', opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: 13 }}>No indicators for selected filter</p>
            </div>
          )}
        </div>

        {/* ── Legend ───────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginTop: 16 }}>
          {[['#ef4444','High Impact'],['#f59e0b','Medium Impact'],['#64748b','Low Impact']].map(([c, l]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, display: 'inline-block' }} />
              <span style={{ fontSize: 11, color: D.textSub }}>{l}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

export default EconomicCalendar;

