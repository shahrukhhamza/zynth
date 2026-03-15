import { useState, useEffect } from 'react';
import { fetchEconomicCalendar } from '../services/calendarApi';
import { Calendar, TrendingUp, TrendingDown, AlertCircle, ChevronDown, ChevronUp, Activity, Lightbulb, Target, Printer, Download, X, CheckSquare, Square, ShieldCheck, BarChart2, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, LabelList } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import { useTimezone } from '../contexts/TimezoneContext';
import { usePlanGate } from '../hooks/usePlanGate';
import PlanGateBanner from './PlanGateBanner';
import ProfileModal from './ProfileModal';

// ── Stable Recharts sub-components (defined at module level to keep a stable
//    reference across renders — avoids React error #31 / unmount-remount loops)
function CalendarTooltip({ active, payload, theme, formatDate }) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="border p-3 rounded-lg shadow-lg" style={{
      backgroundColor: theme.surface,
      borderColor: theme.border,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
    }}>
      <p className="text-xs mb-1" style={{ color: theme.muted }}>
        {formatDate(new Date(data.date), 'MMM dd, yyyy')}
      </p>
      <div className="space-y-1">
        <p className="text-sm">
          <span style={{ color: theme.success }}>Actual:</span>{' '}
          <span className="font-semibold" style={{ color: theme.text }}>{data.actual}</span>
        </p>
        <p className="text-sm">
          <span style={{ color: theme.accent }}>Forecast:</span>{' '}
          <span className="font-semibold" style={{ color: theme.text }}>{data.forecast}</span>
        </p>
        <p className="text-sm">
          <span style={{ color: theme.muted }}>Previous:</span>{' '}
          <span className="font-semibold" style={{ color: theme.text }}>{data.previous}</span>
        </p>
      </div>
    </div>
  );
}

function CalendarBarLabel({ x, y, width, value, theme }) {
  return (
    <text
      x={x + width / 2}
      y={y - 5}
      fill={theme.text}
      fontSize="10"
      fontWeight="600"
      textAnchor="middle"
    >
      {value}
    </text>
  );
}

function EconomicCalendar() {
  const theme = useTheme();
  const { formatDateWithTimezone } = useTimezone();
  const { isFree } = usePlanGate();
  const [indicators, setIndicators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [filterImpact, setFilterImpact] = useState('all');
  const [printModal, setPrintModal] = useState(false);
  const [printSelection, setPrintSelection] = useState({});

  useEffect(() => {
    loadCalendar();
  }, []);

  const loadCalendar = async () => {
    try {
      setLoading(true);
      const data = await fetchEconomicCalendar();
      setIndicators(data);
      setError(null);
    } catch (err) {
      setError('Failed to load economic calendar');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-terminal-muted';
    }
  };

  const getImpactBg = (impact) => {
    switch (impact) {
      case 'high':
        return 'bg-red-500/20 border-red-500';
      case 'medium':
        return 'bg-yellow-500/20 border-yellow-500';
      case 'low':
        return 'bg-green-500/20 border-green-500';
      default:
        return 'bg-terminal-border border-terminal-border';
    }
  };

  const formatValue = (value, unit) => {
    if (value === null || value === undefined) return '-';
    return `${value}${unit}`;
  };

  const getValueColor = (actual, forecast) => {
    if (!actual || !forecast) return '';
    const diff = parseFloat(actual) - parseFloat(forecast);
    if (Math.abs(diff) < 0.01) return 'text-terminal-text';
    return diff > 0 ? 'text-terminal-success' : 'text-terminal-error';
  };

  const getSurprise = (actual, forecast) => {
    const a = parseFloat(actual);
    const f = parseFloat(forecast);
    if (isNaN(a) || isNaN(f) || f === 0) return null;
    return ((a - f) / Math.abs(f)) * 100;
  };

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  // Must be declared before the print helpers that reference them
  const filteredIndicators = filterImpact === 'all'
    ? indicators
    : indicators.filter(ind => ind.impact === filterImpact);

  // ── Print / Download helpers ──────────────────────────────────────────
  const openPrintModal = () => {
    // Pre-select all currently visible indicators
    const sel = {};
    filteredIndicators.forEach(ind => { sel[ind.id] = true; });
    setPrintSelection(sel);
    setPrintModal(true);
  };

  const togglePrintItem = (id) => {
    setPrintSelection(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const selectAllPrint = () => {
    const sel = {};
    filteredIndicators.forEach(ind => { sel[ind.id] = true; });
    setPrintSelection(sel);
  };

  const deselectAllPrint = () => {
    const sel = {};
    filteredIndicators.forEach(ind => { sel[ind.id] = false; });
    setPrintSelection(sel);
  };

  const selectedForPrint = filteredIndicators.filter(ind => printSelection[ind.id]);

  const buildPrintHTML = () => {
    // Build one section per selected indicator with its full history
    const sections = selectedForPrint.map(ind => {
      // Merge releases + historicalData, deduplicate by date, sort newest first
      const releaseRows = (ind.releases || []).map(r => ({
        date: r.date,
        actual: r.actual,
        forecast: r.forecast,
        previous: r.previous,
        period: r.reportingPeriod || '',
      }));
      const histRows = (ind.historicalData || []).map(h => ({
        date: h.date,
        actual: h.actual,
        forecast: h.forecast,
        previous: h.previous,
        period: '',
      }));

      // Merge: prefer release data over historicalData when same date
      const seen = new Set();
      const allRows = [...releaseRows, ...histRows].filter(r => {
        if (!r.date || seen.has(r.date)) return false;
        seen.add(r.date);
        return true;
      }).sort((a, b) => new Date(b.date) - new Date(a.date));

      // If we have no history at all, fall back to the current snapshot row
      const dataRows = allRows.length > 0 ? allRows : [{
        date: ind.date || '',
        actual: ind.current,
        forecast: ind.forecast,
        previous: ind.previous,
        period: ind.reportingPeriod || '',
      }];

      const impactClass = `impact-${ind.impact}`;
      const impactLabel = ind.impact.toUpperCase();

      const tableRows = dataRows.map((r, i) => {
        const diff = parseFloat(r.actual) - parseFloat(r.forecast);
        const actualClass = isNaN(diff) ? '' : diff >= 0 ? 'green' : 'red';
        const formattedDate = r.date
          ? new Date(r.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
          : '-';
        return `
        <tr>
          <td>${formattedDate}</td>
          ${r.period ? `<td>${r.period}</td>` : '<td>-</td>'}
          <td class="num ${actualClass}">${r.actual != null ? r.actual + ind.unit : '-'}</td>
          <td class="num">${r.forecast != null ? r.forecast + ind.unit : '-'}</td>
          <td class="num">${r.previous != null ? r.previous + ind.unit : '-'}</td>
        </tr>`;
      }).join('');

      return `
      <div class="indicator-block">
        <div class="indicator-header">
          <div class="indicator-title">
            <span class="ind-name">${ind.name}</span>
            <span class="ind-meta">${ind.currency} &nbsp;·&nbsp; <span class="${impactClass}">${impactLabel}</span></span>
          </div>
          <div class="ind-summary">
            Latest: <strong class="${parseFloat(ind.current) >= parseFloat(ind.forecast) ? 'green' : 'red'}">${formatValue(ind.current, ind.unit)}</strong>
            &nbsp; Forecast: <strong>${formatValue(ind.forecast, ind.unit)}</strong>
            &nbsp; Previous: <strong>${formatValue(ind.previous, ind.unit)}</strong>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Release Date</th>
              <th>Period</th>
              <th class="num">Actual</th>
              <th class="num">Forecast</th>
              <th class="num">Previous</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>`;
    }).join('');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Economic Calendar — ${new Date().toLocaleDateString()}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1a1a2e; padding: 24px; }
    h1 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
    .subtitle { font-size: 11px; color: #64748b; margin-bottom: 28px; }
    .indicator-block { margin-bottom: 32px; page-break-inside: avoid; }
    .indicator-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; flex-wrap: wrap; gap: 4px; }
    .indicator-title { display: flex; align-items: center; gap: 10px; }
    .ind-name { font-size: 14px; font-weight: 700; color: #2a2a2a; }
    .ind-meta { font-size: 11px; color: #64748b; }
    .ind-summary { font-size: 11px; color: #475569; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #2a2a2a; color: #fff; padding: 7px 10px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
    th.num, td.num { text-align: right; }
    td { padding: 6px 10px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) td { background: #f8fafc; }
    .green { color: #16a34a; font-weight: 600; }
    .red   { color: #dc2626; font-weight: 600; }
    .impact-high   { color: #dc2626; font-weight: 700; }
    .impact-medium { color: #d97706; font-weight: 600; }
    .impact-low    { color: #16a34a; }
    .footer { margin-top: 8px; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
    @media print {
      body { padding: 12px; }
      .indicator-block { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <h1>Economic Calendar</h1>
  <p class="subtitle">Generated: ${new Date().toLocaleString()} &nbsp;·&nbsp; ${selectedForPrint.length} indicator${selectedForPrint.length !== 1 ? 's' : ''} with full release history</p>
  ${sections}
  <p class="footer">Source: AI-powered analysis &nbsp;·&nbsp; Data for informational purposes only.</p>
</body>
</html>`;
  };

  const handlePrint = () => {
    if (selectedForPrint.length === 0) return;
    const html = buildPrintHTML();
    const win = window.open('', '_blank', 'width=900,height=650');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
    setPrintModal(false);
  };

  const handleDownload = () => {
    if (selectedForPrint.length === 0) return;
    const html = buildPrintHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `economic-calendar-${new Date().toISOString().split('T')[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
    setPrintModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div style={{ color: theme.accent }}>
          <Activity className="w-8 h-8 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-2" style={{ color: theme.danger }} />
          <p style={{ color: theme.danger }}>{error}</p>
          <button
            onClick={loadCalendar}
            className="mt-4 px-4 py-2 text-white rounded-lg text-sm"
            style={{ backgroundColor: theme.accent }}
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Plan gate banner for free users */}
      {isFree && (
        <PlanGateBanner
          feature="AI-Powered Insights"
          requiredPlan="Pro"
          description="Upgrade to Pro or Elite to unlock AI-generated macro analysis, impact predictions, and surprise scoring for every release."
          onUpgradeClick={() => setShowUpgradeModal(true)}
        />
      )}
      {showUpgradeModal && <ProfileModal onClose={() => setShowUpgradeModal(false)} />}

      {/* Print Selection Modal */}
      {printModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setPrintModal(false); }}
        >
          <div className="rounded-xl shadow-2xl w-full max-w-md" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: theme.border }}>
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5" style={{ color: theme.accent }} />
                <h3 className="text-base font-semibold" style={{ color: theme.text }}>Select Indicators to Print</h3>
              </div>
              <button onClick={() => setPrintModal(false)} style={{ color: theme.muted }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Select all / none */}
            <div className="flex gap-3 px-5 py-3 border-b" style={{ borderColor: theme.border }}>
              <button onClick={selectAllPrint} className="text-xs font-medium" style={{ color: theme.accent }}>Select All</button>
              <span style={{ color: theme.border }}>|</span>
              <button onClick={deselectAllPrint} className="text-xs font-medium" style={{ color: theme.muted }}>Deselect All</button>
              <span className="ml-auto text-xs" style={{ color: theme.muted }}>
                {selectedForPrint.length} of {filteredIndicators.length} selected
              </span>
            </div>

            {/* Indicator list */}
            <div className="overflow-y-auto max-h-72 px-3 py-2">
              {filteredIndicators.map(ind => (
                <label
                  key={ind.id}
                  className="flex items-center gap-3 px-2 py-2.5 rounded-lg cursor-pointer transition-colors"
                  style={{ color: theme.text }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme.bg}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span style={{ color: printSelection[ind.id] ? theme.accent : theme.muted }}>
                    {printSelection[ind.id]
                      ? <CheckSquare className="w-4 h-4" />
                      : <Square className="w-4 h-4" />}
                  </span>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={!!printSelection[ind.id]}
                    onChange={() => togglePrintItem(ind.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{ind.name}</div>
                    <div className="text-xs" style={{ color: theme.muted }}>
                      {ind.reportingPeriod || ind.date || ''} &nbsp;·&nbsp;
                      <span className={
                        ind.impact === 'high' ? 'text-red-500' :
                        ind.impact === 'medium' ? 'text-yellow-500' : 'text-green-500'
                      }>{ind.impact}</span>
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-right" style={{
                    color: parseFloat(ind.current) >= parseFloat(ind.forecast) ? '#22c55e' : '#ef4444'
                  }}>
                    {formatValue(ind.current, ind.unit)}
                  </div>
                </label>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3 px-5 py-4 border-t" style={{ borderColor: theme.border }}>
              <button
                onClick={handlePrint}
                disabled={selectedForPrint.length === 0}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-opacity"
                style={{
                  backgroundColor: theme.accent,
                  color: '#fff',
                  opacity: selectedForPrint.length === 0 ? 0.4 : 1,
                  cursor: selectedForPrint.length === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={handleDownload}
                disabled={selectedForPrint.length === 0}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-opacity"
                style={{
                  backgroundColor: 'rgba(34,197,94,0.15)',
                  border: `1px solid ${theme.success}`,
                  color: theme.success,
                  opacity: selectedForPrint.length === 0 ? 0.4 : 1,
                  cursor: selectedForPrint.length === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        {/* Row 1: Title + Print button */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 14px rgba(16,185,129,0.35)' }}>
              <Calendar size={20} color="#fff" />
            </div>
            <div>
              <h2 style={{ color: theme.text, fontWeight: 800, fontSize: 20, margin: 0, lineHeight: 1.2, letterSpacing: '-0.01em' }}>Economic Calendar</h2>
              <p style={{ color: theme.muted, fontSize: 12, margin: '2px 0 0' }}>17 US macro indicators — Updated automatically</p>
            </div>
          </div>
          <button
            onClick={openPrintModal}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, border: `1px solid ${theme.border}`, background: 'transparent', color: theme.text, cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'border-color 0.15s, color 0.15s', flexShrink: 0 }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.color = '#10b981'; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.text; }}
          >
            <Printer size={15} /> <span className="cal-print-label">Print / Download</span>
          </button>
        </div>
        {/* Row 2: Filter pills — scrollable on mobile */}
        <div className="cal-filter-row" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, overflowX: 'auto', paddingBottom: 2 }}>
          {['all', 'high', 'medium', 'low'].map(level => (
            <button
              key={level}
              onClick={() => setFilterImpact(level)}
              style={{ flexShrink: 0, padding: '6px 16px', borderRadius: 999, border: `1px solid ${filterImpact === level ? '#10b981' : theme.border}`, background: filterImpact === level ? '#10b981' : 'transparent', color: filterImpact === level ? '#fff' : theme.muted, cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.15s' }}
            >
              {level === 'all' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      {(() => {
        const now = new Date();
        const beats = filteredIndicators.filter(ind => { const s = getSurprise(ind.current, ind.forecast); return s !== null && s > 0.5; }).length;
        const misses = filteredIndicators.filter(ind => { const s = getSurprise(ind.current, ind.forecast); return s !== null && s < -0.5; }).length;
        const netScore = beats - misses;
        const nextInd = [...filteredIndicators].filter(i => i.date).sort((a, b) => new Date(a.date) - new Date(b.date)).find(i => new Date(i.date) > now);
        const pill = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 999, background: theme.surface, border: `1px solid ${theme.border}`, fontSize: 12, fontWeight: 500 };
        return (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ ...pill, color: theme.muted }}><BarChart2 size={12} style={{display:'inline-block',verticalAlign:'middle',marginRight:'4px'}} />{filteredIndicators.length} Indicators</span>
            <span style={{ ...pill, color: theme.muted }}><Clock size={12} style={{display:'inline-block',verticalAlign:'middle',marginRight:'4px'}} />Last Updated: {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
            {nextInd && (
              <span style={{ ...pill, color: theme.muted }}><Calendar size={12} style={{display:'inline-block',verticalAlign:'middle',marginRight:'4px'}} />Next: {nextInd.name} · {new Date(nextInd.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            )}
            <span style={{ ...pill, color: netScore >= 0 ? '#22c55e' : '#ef4444' }}>
              {netScore >= 0 ? <TrendingUp size={12} style={{display:'inline-block',verticalAlign:'middle',marginRight:'4px'}} /> : <TrendingDown size={12} style={{display:'inline-block',verticalAlign:'middle',marginRight:'4px'}} />}
              Macro Score: {netScore >= 0 ? '+' : ''}{netScore} {netScore > 2 ? 'Bullish' : netScore < -2 ? 'Bearish' : 'Neutral'}
            </span>
          </div>
        );
      })()}

      {/* Table */}
      <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: theme.isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.06)' }}>
        <div className="cal-table-scroll">
        <table className="w-full">
          <thead style={{ background: theme.bg, borderBottom: '2px solid #10b981' }}>
            <tr>
              <th style={{ padding: '11px 12px', textAlign: 'left',   fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.muted }}>Event</th>
              <th className="cal-col-currency" style={{ padding: '11px 12px', textAlign: 'center', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.muted }}>Currency</th>
              <th className="cal-col-impact" style={{ padding: '11px 12px', textAlign: 'center', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.muted }}>Impact</th>
              <th style={{ padding: '11px 12px', textAlign: 'right',  fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.muted }}>Actual</th>
              <th className="cal-col-forecast" style={{ padding: '11px 12px', textAlign: 'right',  fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.muted }}>Forecast</th>
              <th className="cal-col-previous" style={{ padding: '11px 12px', textAlign: 'right',  fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.muted }}>Previous</th>
              <th className="cal-col-surprise" style={{ padding: '11px 12px', textAlign: 'center', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.muted }}>Surprise</th>
              <th style={{ width: 36 }} />
            </tr>
          </thead>
          <tbody>
            {filteredIndicators.map((indicator, rowIdx) => (
              <>
                <tr
                  key={indicator.id}
                  className="transition-colors cursor-pointer"
                  onClick={() => toggleRow(indicator.id)}
                  style={{ backgroundColor: rowIdx % 2 === 1 ? (theme.isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.012)') : theme.surface, borderBottom: `1px solid ${theme.border}` }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme.bg}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = rowIdx % 2 === 1 ? (theme.isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.012)') : theme.surface}
                >
                  {/* Event */}
                  <td style={{ padding: '12px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {(() => {
                        const a = parseFloat(indicator.current);
                        const p = parseFloat(indicator.previous);
                        if (!isNaN(a) && !isNaN(p)) {
                          return a >= p
                            ? <TrendingUp size={15} style={{ color: '#22c55e', flexShrink: 0 }} />
                            : <TrendingDown size={15} style={{ color: '#ef4444', flexShrink: 0 }} />;
                        }
                        return <Activity size={15} style={{ color: theme.muted, flexShrink: 0 }} />;
                      })()}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ color: theme.text, fontWeight: 700, fontSize: 14 }}>{indicator.name}</span>
                          {indicator.webVerified && (
                            <span title="Data verified via Gemini + Google Search" style={{ color: '#22c55e' }}>
                              <ShieldCheck size={12} />
                            </span>
                          )}
                          {indicator.corrected && (
                            <span style={{ background: 'rgba(234,179,8,0.15)', color: '#eab308', fontSize: 10, padding: '1px 5px', borderRadius: 4 }}>corrected</span>
                          )}
                        </div>
                        <div style={{ color: theme.muted, fontSize: 11, fontStyle: 'italic', marginTop: 2 }}>
                          {indicator.reportingPeriod
                            ? `${indicator.reportingPeriod} · ${indicator.frequency}`
                            : indicator.frequency}
                        </div>
                        {/* Mobile-only impact badge */}
                        <span className="cal-impact-mobile" style={{ marginTop: 4 }}>
                          {indicator.impact === 'high' ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 4, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', fontSize: 10, fontWeight: 700 }}>HIGH</span>
                          ) : indicator.impact === 'medium' ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 7px', borderRadius: 4, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.4)', color: '#fbbf24', fontSize: 10, fontWeight: 700 }}>MED</span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 7px', borderRadius: 4, background: 'rgba(100,116,139,0.12)', border: '1px solid rgba(100,116,139,0.4)', color: '#94a3b8', fontSize: 10, fontWeight: 600 }}>LOW</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </td>
                  {/* Currency */}
                  <td className="cal-col-currency" style={{ padding: '12px 12px', textAlign: 'center' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {indicator.currency}
                    </span>
                  </td>
                  {/* Impact */}
                  <td className="cal-col-impact" style={{ padding: '12px 12px', textAlign: 'center' }}>
                    {indicator.impact === 'high' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 11px', borderRadius: 6, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f87171', display: 'inline-block', animation: 'calPulse 1.5s ease-in-out infinite' }} />
                        HIGH
                      </span>
                    ) : indicator.impact === 'medium' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 11px', borderRadius: 6, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.4)', color: '#fbbf24', fontSize: 11, fontWeight: 700 }}>
                        MED
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 11px', borderRadius: 6, background: 'rgba(100,116,139,0.12)', border: '1px solid rgba(100,116,139,0.4)', color: '#94a3b8', fontSize: 11, fontWeight: 600 }}>
                        LOW
                      </span>
                    )}
                  </td>
                  {/* Actual */}
                  <td style={{ padding: '12px 12px', textAlign: 'right' }}>
                    {(() => {
                      const a = parseFloat(indicator.current);
                      const f = parseFloat(indicator.forecast);
                      const color = (isNaN(a) || isNaN(f)) ? theme.text : a > f ? '#22c55e' : a < f ? '#ef4444' : theme.muted;
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                          {!isNaN(a) && !isNaN(f) && a !== f && (
                            a > f ? <TrendingUp size={13} color="#22c55e" /> : <TrendingDown size={13} color="#ef4444" />
                          )}
                          <span className="cal-actual-val" style={{ color, fontWeight: 700, fontSize: 17 }}>{formatValue(indicator.current, indicator.unit)}</span>
                        </div>
                      );
                    })()}
                  </td>
                  {/* Forecast */}
                  <td className="cal-col-forecast" style={{ padding: '12px 12px', textAlign: 'right', color: theme.muted, fontSize: 14 }}>
                    ({formatValue(indicator.forecast, indicator.unit)})
                  </td>
                  {/* Previous */}
                  <td className="cal-col-previous" style={{ padding: '12px 12px', textAlign: 'right', color: theme.muted, fontSize: 14 }}>
                    {formatValue(indicator.previous, indicator.unit)}
                  </td>
                  {/* Surprise */}
                  <td className="cal-col-surprise" style={{ padding: '12px 12px', textAlign: 'center' }}>
                    {(() => {
                      const surp = getSurprise(indicator.current, indicator.forecast);
                      if (surp === null) return <span style={{ color: theme.muted, fontSize: 11 }}>—</span>;
                      if (Math.abs(surp) < 0.5) return (
                        <span style={{ padding: '3px 9px', borderRadius: 999, background: 'rgba(100,116,139,0.12)', border: '1px solid rgba(100,116,139,0.35)', color: '#94a3b8', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>In Line</span>
                      );
                      return surp > 0
                        ? <span style={{ padding: '3px 9px', borderRadius: 999, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.35)', color: '#4ade80', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>+{surp.toFixed(1)}% Beat</span>
                        : <span style={{ padding: '3px 9px', borderRadius: 999, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: '#f87171', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{surp.toFixed(1)}% Miss</span>;
                    })()}
                  </td>
                  {/* Expand */}
                  <td style={{ padding: '12px 8px', textAlign: 'center', width: 36 }}>
                    {expandedRow === indicator.id
                      ? <ChevronUp size={16} style={{ color: theme.accent, margin: '0 auto' }} />
                      : <ChevronDown size={16} style={{ color: theme.muted, margin: '0 auto' }} />
                    }
                  </td>
                </tr>
                
                {/* Expanded Row - AI Insights + Historical Chart */}
                {expandedRow === indicator.id && (
                  <tr>
                    <td colSpan="8" className="cal-expanded-td" style={{ padding: '0 16px 24px', backgroundColor: theme.bg }}>
                      <div className="space-y-4">
                        
                        {/* AI Insights Section */}
                        {indicator.aiInsights && (
                          <div className="rounded-lg border p-4" style={{ 
                            backgroundColor: theme.isDark ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)',
                            borderColor: '#8b5cf6'
                          }}>
                            <div className="flex items-center gap-2 mb-3">
                              <Lightbulb className="w-5 h-5" style={{ color: '#8b5cf6' }} />
                              <h4 className="text-sm font-semibold uppercase" style={{ color: theme.text }}>
                                AI Market Analysis
                              </h4>
                            </div>
                            <p className="text-sm mb-3" style={{ color: theme.text }}>
                              {indicator.aiInsights.summary}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                              <div className="rounded p-2" style={{ backgroundColor: theme.surface }}>
                                <div style={{ color: theme.muted }}>Impact</div>
                                <div className="font-semibold mt-1" style={{ 
                                  color: indicator.aiInsights.impact === 'bullish_usd' ? theme.success : theme.danger 
                                }}>
                                  {indicator.aiInsights.impact.replace('_', ' ').toUpperCase()}
                                </div>
                              </div>
                              <div className="rounded p-2" style={{ backgroundColor: theme.surface }}>
                                <div style={{ color: theme.muted }}>Market Reaction</div>
                                <div className="font-semibold mt-1" style={{ color: theme.text }}>
                                  {indicator.aiInsights.marketReaction}
                                </div>
                              </div>
                              <div className="rounded p-2" style={{ backgroundColor: theme.surface }}>
                                <div style={{ color: theme.muted }}>Trading Bias</div>
                                <div className="font-semibold mt-1" style={{ color: theme.accent }}>
                                  {indicator.aiInsights.tradingBias}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Scenario Analysis */}
                        {indicator.scenarioAnalysis && (
                          <div className="rounded-lg border p-4" style={{ 
                            backgroundColor: theme.surface,
                            borderColor: theme.border
                          }}>
                            <div className="flex items-center gap-2 mb-3">
                              <Target className="w-5 h-5" style={{ color: theme.accent }} />
                              <h4 className="text-sm font-semibold uppercase" style={{ color: theme.text }}>
                                Pre-Release Scenario Analysis
                              </h4>
                            </div>
                            <pre className="text-xs whitespace-pre-wrap font-sans" style={{ color: theme.text }}>
                              {indicator.scenarioAnalysis}
                            </pre>
                          </div>
                        )}

                        {/* Specs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                          <div>
                            <h4 className="text-xs font-semibold uppercase mb-2" style={{ color: theme.muted }}>
                              Source
                            </h4>
                            <div className="flex items-start gap-1.5">
                              {indicator.webVerified && (
                                <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: theme.success }} />
                              )}
                              <p className="text-sm" style={{ color: theme.text }}>{indicator.source}</p>
                            </div>
                            {/* Verification source links */}
                            {indicator.verificationSources && indicator.verificationSources.length > 0 && (
                              <div className="mt-1 space-y-0.5">
                                {indicator.verificationSources.map((url, i) => (
                                  <div key={i} className="text-xs truncate" style={{ color: theme.accent }}>
                                    {url}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold uppercase mb-2" style={{ color: theme.muted }}>
                              Usual Effect
                            </h4>
                            <p className="text-sm" style={{ color: theme.text }}>{indicator.usualEffect}</p>
                          </div>
                          <div className="col-span-2">
                            <h4 className="text-xs font-semibold uppercase mb-2" style={{ color: theme.muted }}>
                              Measures
                            </h4>
                            <p className="text-sm" style={{ color: theme.text }}>{indicator.description}</p>
                          </div>
                        </div>

                        {/* Historical Chart */}
                        <div>
                          <h4 className="text-xs font-semibold uppercase mb-3" style={{ color: theme.muted }}>
                            Historical Data (12 Months)
                          </h4>
                          <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={indicator.historicalData} margin={{ top: 20, right: 5, left: 5, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGrid} />
                              <XAxis
                                dataKey="date"
                                stroke={theme.chartAxis}
                                fontSize={10}
                                tickFormatter={(date) => formatDateWithTimezone(new Date(date), 'MMM yy')}
                              />
                              <YAxis
                                stroke={theme.chartAxis}
                                fontSize={10}
                                tickFormatter={(value) => `${value}${indicator.unit}`}
                              />
                              <Tooltip content={<CalendarTooltip theme={theme} formatDate={formatDateWithTimezone} />} cursor={{ fill: theme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }} />
                              <ReferenceLine y={0} stroke={theme.chartAxis} />
                              <Bar dataKey="actual" fill="#22C55E" name="Actual" radius={[4, 4, 0, 0]}>
                                <LabelList content={<CalendarBarLabel theme={theme} />} />
                              </Bar>
                              <Bar dataKey="forecast" fill="#3B82F6" name="Forecast" radius={[4, 4, 0, 0]}>
                                <LabelList content={<CalendarBarLabel theme={theme} />} />
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Recent Releases Table */}
                        <div>
                          <h4 className="text-xs font-semibold uppercase mb-3" style={{ color: theme.muted }}>
                            Recent Releases
                          </h4>
                          <table className="w-full text-sm">
                            <thead className="border-b" style={{ borderColor: theme.border }}>
                              <tr>
                                <th className="px-3 py-2 text-left text-xs" style={{ color: theme.muted }}>Date</th>
                                <th className="px-3 py-2 text-right text-xs" style={{ color: theme.muted }}>Actual</th>
                                <th className="px-3 py-2 text-right text-xs" style={{ color: theme.muted }}>Forecast</th>
                                <th className="px-3 py-2 text-right text-xs" style={{ color: theme.muted }}>Previous</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y" style={{ borderColor: theme.border }}>
                              {indicator.releases.map((release, idx) => (
                                <tr 
                                  key={idx} 
                                  className="transition-colors"
                                  style={{ backgroundColor: 'transparent' }}
                                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme.surface}
                                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                  <td className="px-3 py-2" style={{ color: theme.text }}>
                                    {formatDateWithTimezone(new Date(release.date), 'MMM dd, yyyy')}
                                  </td>
                                  <td className={`px-3 py-2 text-right font-semibold ${getValueColor(release.actual, release.forecast)}`}>
                                    {formatValue(release.actual, indicator.unit)}
                                  </td>
                                  <td className="px-3 py-2 text-right" style={{ color: theme.accent }}>
                                    {formatValue(release.forecast, indicator.unit)}
                                  </td>
                                  <td className="px-3 py-2 text-right" style={{ color: theme.muted }}>
                                    {formatValue(release.previous, indicator.unit)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {filteredIndicators.length === 0 && (
        <div className="text-center py-12 text-terminal-muted">
          <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No indicators found for selected filter</p>
        </div>
      )}

      {/* Impact colour legend */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22, paddingTop: 4 }}>
        {[
          { color: '#f87171', label: 'High Impact' },
          { color: '#fbbf24', label: 'Medium Impact' },
          { color: '#94a3b8', label: 'Low Impact' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
            <span style={{ color: theme.muted, fontSize: 11 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Keyframe for HIGH impact pulse dot */}
      <style>{`
        @keyframes calPulse {
          0%, 100% { opacity: 1;   transform: scale(1);   }
          50%       { opacity: 0.35; transform: scale(0.65); }
        }
        .cal-filter-row::-webkit-scrollbar { display: none; }
        .cal-filter-row { -ms-overflow-style: none; scrollbar-width: none; }
        .cal-impact-mobile { display: none; }
        .cal-table-scroll { width: 100%; }
        @media (max-width: 639px) {
          .cal-col-currency,
          .cal-col-impact,
          .cal-col-forecast,
          .cal-col-previous,
          .cal-col-surprise { display: none; }
          .cal-impact-mobile { display: inline-flex; }
          .cal-print-label { display: none; }
          .cal-table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .cal-expanded-td { padding: 0 8px 16px !important; }
          .col-span-2 { grid-column: span 1 !important; }
          .cal-actual-val { font-size: 15px !important; }
        }
      `}</style>
    </div>
  );
}

export default EconomicCalendar;
