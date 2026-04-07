import { useEffect, useMemo, useState } from 'react';
import {
  Brain,
  FileText,
  Loader2,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Minus,
  Clock3,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { generateReport, listReports } from '../../services/journalApi';
import { API_URL } from '../../config/api';
import { getAuthToken } from '../../utils/authStorage';

const GROUPS = [
  { key: 'labor', label: 'Labor', keys: ['nfp', 'unemployment', 'joblessclaims'] },
  { key: 'inflation', label: 'Inflation', keys: ['cpi', 'corepce'] },
  { key: 'growth', label: 'Growth', keys: ['gdp', 'retailsales', 'ismmfg'] },
  { key: 'other', label: 'Other Signals', keys: ['fedrate', 'consumerconf'] },
];

function normalizeToken(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function biasMeta(impact, impactColor, palette) {
  const text = String(impact || '').toLowerCase();
  if (impactColor === 'green' || text.includes('bull')) {
    return { label: 'Bullish', color: palette.green, icon: ArrowUpRight };
  }
  if (impactColor === 'red' || text.includes('bear')) {
    return { label: 'Bearish', color: palette.red, icon: ArrowDownRight };
  }
  return { label: 'Neutral', color: palette.blue, icon: Minus };
}

function scoreMeta(score, palette) {
  if (score > 0) return { label: 'Bullish', color: palette.green };
  if (score < 0) return { label: 'Bearish', color: palette.red };
  return { label: 'Neutral', color: palette.blue };
}

function formatRelativeTime(input) {
  if (!input) return 'Unavailable';
  const stamp = typeof input === 'number' ? input : new Date(input).getTime();
  if (!stamp || Number.isNaN(stamp)) return 'Unavailable';
  const diff = Math.max(0, Date.now() - stamp);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function parseTradeAi(trade) {
  if (!trade?.ai_analysis) return null;
  try {
    return typeof trade.ai_analysis === 'string' ? JSON.parse(trade.ai_analysis) : trade.ai_analysis;
  } catch {
    return null;
  }
}

function parseReportData(report) {
  try {
    return typeof report.report_data === 'string' ? JSON.parse(report.report_data) : report.report_data;
  } catch {
    return null;
  }
}

function ProgressRail({ value, color, background }) {
  return (
    <div className="h-2 rounded-full overflow-hidden" style={{ background }}>
      <div className="h-full rounded-full transition-all duration-200" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
    </div>
  );
}

function SoftPanel({ children, palette, className = '' }) {
  return (
    <div
      className={`rounded-3xl transition-all duration-200 hover:-tranzinc-y-[2px] ${className}`}
      style={{
        background: palette.card,
        boxShadow: palette.shadow,
      }}
    >
      {children}
    </div>
  );
}

function HeroSection({ macroScore, dashboard, palette, recommendation }) {
  const score = macroScore?.score ?? 0;
  const scoreInfo = scoreMeta(score, palette);
  const sentimentLabel = dashboard?.overallSentiment || scoreInfo.label;
  const confidence = Math.round(Math.min(100, Math.abs(score) * 10));
  const updatedAt = macroScore?.updatedAt || dashboard?.aiAnalysis?.timestamp || null;

  return (
    <SoftPanel palette={palette} className="p-5 md:p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] m-0" style={{ color: palette.sub }}>Macro Score</p>
          <div className="flex items-end gap-3 mt-2">
            <span className="text-5xl md:text-6xl font-bold tracking-tight leading-none" style={{ color: scoreInfo.color }}>
              {score > 0 ? '+' : ''}{score}
            </span>
            <span className="text-sm font-medium mb-1" style={{ color: palette.sub }}>/ 10</span>
          </div>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider" style={{ color: scoreInfo.color, background: `${scoreInfo.color}14` }}>
              {sentimentLabel}
            </span>
            <span className="text-xs" style={{ color: palette.sub }}>Market Bias: {scoreInfo.label}</span>
          </div>
        </div>

        <div className="w-full md:max-w-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: palette.sub }}>Confidence</span>
            <span className="text-sm font-semibold" style={{ color: palette.text }}>{confidence}%</span>
          </div>
          <ProgressRail value={confidence} color={palette.blue} background={palette.soft} />
          <div className="flex items-center gap-2 mt-4 text-xs" style={{ color: palette.sub }}>
            <Clock3 size={12} />
            <span>Last updated: {formatRelativeTime(updatedAt)}</span>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl p-4" style={{ background: palette.soft }}>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={14} style={{ color: palette.blue }} />
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] m-0" style={{ color: palette.sub }}>AI Recommendation</p>
        </div>
        <p className="text-sm leading-6 m-0" style={{ color: palette.text }}>
          {recommendation || 'Macro recommendation unavailable. Generate more journal history or refresh economic intelligence to populate this view.'}
        </p>
      </div>
    </SoftPanel>
  );
}

function KeyDrivers({ drivers, palette }) {
  return (
    <SoftPanel palette={palette} className="p-5 md:p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] m-0" style={{ color: palette.sub }}>Key Drivers</p>
          <p className="text-sm m-0 mt-1" style={{ color: palette.sub }}>Fast read on the indicators moving the current bias.</p>
        </div>
      </div>

      {drivers.length > 0 ? (
        <div className="space-y-2">
          {drivers.map((driver) => {
            const BiasIcon = driver.bias.icon;
            return (
              <div key={driver.code} className="rounded-2xl px-4 py-3" style={{ background: palette.soft }}>
                <div className="grid grid-cols-[minmax(0,1.2fr)_auto_auto_minmax(96px,140px)] gap-3 items-center">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate m-0" style={{ color: palette.text }}>{driver.label}</p>
                    <p className="text-xs truncate m-0 mt-1" style={{ color: palette.sub }}>{driver.value}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: driver.bias.color }}>
                    <BiasIcon size={12} />
                    <span>{driver.bias.label}</span>
                  </div>
                  <span className="text-xs font-semibold text-right" style={{ color: driver.bias.color }}>{driver.contribution}</span>
                  <ProgressRail value={driver.intensity} color={driver.bias.color} background={palette.track} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl p-4" style={{ background: palette.soft }}>
          <p className="text-sm m-0" style={{ color: palette.sub }}>No macro drivers available yet.</p>
        </div>
      )}
    </SoftPanel>
  );
}

function IndicatorRow({ item, palette }) {
  const [open, setOpen] = useState(false);
  const bias = biasMeta(item.impact, item.impactColor, palette);
  const surprisePct = Math.min(100, Math.abs(item.surprisePercentage || item.surprise || 0) * 2);

  return (
    <div className="rounded-2xl" style={{ background: palette.soft }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-3 text-left flex items-center justify-between gap-3 transition-all duration-200"
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate m-0" style={{ color: palette.text }}>{item.indicator}</p>
          <p className="text-xs truncate m-0 mt-1" style={{ color: palette.sub }}>
            Actual {item.actual ?? '—'}{item.unit || ''} · Forecast {item.forecast ?? '—'}{item.unit || ''}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide" style={{ color: bias.color, background: `${bias.color}14` }}>
            {bias.label}
          </span>
          {open ? <ChevronUp size={14} style={{ color: palette.sub }} /> : <ChevronDown size={14} style={{ color: palette.sub }} />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-[120px_1fr_88px] gap-3 items-center mb-3">
            <span className="text-xs font-semibold" style={{ color: palette.sub }}>
              Surprise {item.surprise > 0 ? '+' : ''}{item.surprise ?? 0}{item.unit || ''}
            </span>
            <ProgressRail value={surprisePct} color={bias.color} background={palette.track} />
            <span className="text-xs font-semibold text-right" style={{ color: bias.color }}>{item.impact || 'Neutral'}</span>
          </div>
          {(item.description || item.latestDate) && (
            <p className="text-xs leading-5 m-0" style={{ color: palette.sub }}>
              {item.description || 'No additional context available.'}
              {item.latestDate ? ` Updated ${item.latestDate}.` : ''}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function CategoryGroups({ groups, palette }) {
  const [openGroups, setOpenGroups] = useState(() => Object.fromEntries(groups.map((group, index) => [group.key, index === 0])));

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      groups.forEach((group, index) => {
        if (!(group.key in next)) next[group.key] = index === 0;
      });
      return next;
    });
  }, [groups]);

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const open = !!openGroups[group.key];
        return (
          <SoftPanel key={group.key} palette={palette} className="p-3 md:p-4">
            <button
              type="button"
              onClick={() => setOpenGroups((prev) => ({ ...prev, [group.key]: !prev[group.key] }))}
              className="w-full flex items-center justify-between gap-3 px-2 py-1 text-left"
            >
              <div>
                <p className="text-sm font-semibold m-0" style={{ color: palette.text }}>{group.label}</p>
                <p className="text-xs m-0 mt-1" style={{ color: palette.sub }}>{group.items.length} indicators</p>
              </div>
              {open ? <ChevronUp size={16} style={{ color: palette.sub }} /> : <ChevronDown size={16} style={{ color: palette.sub }} />}
            </button>
            {open && (
              <div className="space-y-2 mt-3">
                {group.items.map((item) => <IndicatorRow key={item.code || item.indicator} item={item} palette={palette} />)}
              </div>
            )}
          </SoftPanel>
        );
      })}
    </div>
  );
}

function ReportCard({ report, palette }) {
  const [open, setOpen] = useState(false);
  const data = parseReportData(report);
  if (!data) return null;

  const gradeColor = ({ A: palette.green, B: palette.blue, C: palette.blue, D: palette.red, F: palette.red }[data.performance_grade]) || palette.blue;

  return (
    <div className="rounded-2xl" style={{ background: palette.soft }}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="w-full px-4 py-3 text-left flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg font-bold shrink-0" style={{ color: gradeColor, background: `${gradeColor}14` }}>
            {data.performance_grade || 'B'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate m-0" style={{ color: palette.text }}>{data.title || 'Performance Report'}</p>
            <p className="text-xs m-0 mt-1" style={{ color: palette.sub }}>{report.created_at?.slice(0, 10)} · {report.report_type}</p>
          </div>
        </div>
        {open ? <ChevronUp size={14} style={{ color: palette.sub }} /> : <ChevronDown size={14} style={{ color: palette.sub }} />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3">
          {data.summary && <p className="text-sm leading-6 m-0" style={{ color: palette.text }}>{data.summary}</p>}
          {data.action_items?.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] m-0 mb-2" style={{ color: palette.sub }}>Action Items</p>
              <div className="space-y-2">
                {data.action_items.map((item, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm" style={{ color: palette.text }}>
                    <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: palette.blue }} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TradeAnalysisRow({ trade, palette }) {
  const [open, setOpen] = useState(false);
  const data = parseTradeAi(trade);
  if (!data) return null;

  const qualityColor = data.trade_quality === 'excellent'
    ? palette.green
    : data.trade_quality === 'poor'
      ? palette.red
      : palette.blue;

  return (
    <div className="rounded-2xl" style={{ background: palette.soft }}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="w-full px-4 py-3 text-left flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold" style={{ color: palette.text }}>{trade.pair}</span>
            <span className="px-2 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide" style={{ color: qualityColor, background: `${qualityColor}14` }}>
              {data.trade_quality || 'analysis'}
            </span>
            <span className="text-xs" style={{ color: palette.sub }}>{trade.created_at?.slice(0, 10)}</span>
          </div>
          <p className="text-xs truncate m-0 mt-1" style={{ color: palette.sub }}>
            {data.coach_message || 'AI analysis available'}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-semibold" style={{ color: palette.blue }}>{data.psychology_score || 0}/10</span>
          {open ? <ChevronUp size={14} style={{ color: palette.sub }} /> : <ChevronDown size={14} style={{ color: palette.sub }} />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3">
          {data.key_observations?.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] m-0 mb-2" style={{ color: palette.sub }}>Key Observations</p>
              <div className="space-y-2">
                {data.key_observations.map((item, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm" style={{ color: palette.text }}>
                    <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: palette.blue }} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {data.improvement_tips?.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] m-0 mb-2" style={{ color: palette.sub }}>Improvement Tips</p>
              <div className="space-y-2">
                {data.improvement_tips.map((item, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm" style={{ color: palette.text }}>
                    <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: palette.green }} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AiInsightsPanel({ trades, metrics, onReportGenerated }) {
  const theme = useTheme();
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState('weekly');
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportsLoaded, setReportsLoaded] = useState(false);
  const [macroDashboard, setMacroDashboard] = useState(null);
  const [macroScore, setMacroScore] = useState(null);

  const palette = {
    page: theme.isDark ? '#0b0b0f' : '#f8fafc',
    card: theme.isDark ? '#0b0b0f' : '#ffffff',
    soft: theme.isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
    track: theme.isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
    text: theme.isDark ? '#f9fafb' : '#0b0b0f',
    sub: theme.isDark ? '#9ca3af' : '#6b7280',
    blue: '#CA8A04',
    green: '#10b981',
    red: '#ef4444',
    shadow: theme.isDark
      ? '0 10px 28px rgba(0,0,0,0.34), 0 2px 8px rgba(0,0,0,0.18)'
      : '0 1px 4px rgba(0,0,0,0.06), 0 10px 28px rgba(15,23,42,0.08)',
  };

  const analyzedTrades = useMemo(() => (trades || []).filter((trade) => trade.ai_analysis).reverse(), [trades]);

  useEffect(() => {
    let cancelled = false;

    async function loadMacro() {
      const token = getAuthToken();
      if (!token) return;
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [dashboardRes, scoreRes] = await Promise.all([
          fetch(`${API_URL}/api/economic/dashboard`, { headers }),
          fetch(`${API_URL}/api/economic/macro-score`, { headers }),
        ]);

        if (!cancelled && dashboardRes.ok) {
          setMacroDashboard(await dashboardRes.json());
        }
        if (!cancelled && scoreRes.ok) {
          setMacroScore(await scoreRes.json());
        }
      } catch {
        // Macro data is optional in this view. Journal insights should still render.
      }
    }

    loadMacro();
    return () => { cancelled = true; };
  }, []);

  const indicatorList = useMemo(() => {
    const entries = Object.values(macroDashboard?.indicators || {}).filter(Boolean).filter((item) => !item.error);
    return entries.map((item) => ({
      ...item,
      normalizedCode: normalizeToken(item.code || item.indicator),
    }));
  }, [macroDashboard]);

  const groupedIndicators = useMemo(() => {
    const groups = GROUPS.map((group) => ({
      ...group,
      items: indicatorList.filter((item) => group.keys.includes(item.normalizedCode)),
    })).filter((group) => group.items.length > 0);
    return groups;
  }, [indicatorList]);

  const topDrivers = useMemo(() => {
    const contributors = macroScore?.contributors || [];
    return contributors.slice(0, 5).map((contributor) => {
      const normalized = normalizeToken(contributor.code);
      const indicator = indicatorList.find((item) => item.normalizedCode === normalized) || null;
      const bias = biasMeta(contributor.impact, contributor.impactColor, palette);
      return {
        code: contributor.code,
        label: indicator?.indicator || contributor.code,
        value: indicator?.actual != null ? `${indicator.actual}${indicator.unit || ''}` : 'Latest release',
        contribution: `${contributor.contribution > 0 ? '+' : ''}${contributor.contribution}`,
        intensity: Math.min(100, Math.abs(contributor.contribution) * 6),
        bias,
      };
    });
  }, [macroScore, indicatorList]);

  const behavioralAlerts = metrics?.behavioral || [];
  const recommendation = useMemo(() => {
    if (macroDashboard?.aiAnalysis?.analysis) return macroDashboard.aiAnalysis.analysis;
    const scoreInfo = scoreMeta(macroScore?.score ?? 0, palette);
    if (topDrivers[0]) {
      return `Bias: ${scoreInfo.label} — focus on ${topDrivers[0].label} and wait for confirmation before committing size.`;
    }
    return 'Bias unavailable. Refresh macro data or generate more journal history for stronger signal quality.';
  }, [macroDashboard, macroScore, topDrivers, palette]);

  const loadReports = async () => {
    if (reportsLoaded) return;
    setLoadingReports(true);
    try {
      const data = await listReports();
      setReports(data);
      setReportsLoaded(true);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const report = await generateReport(reportType);
      setReports((prev) => [report, ...prev]);
      setReportsLoaded(true);
      toast.success('Report generated successfully');
      onReportGenerated?.(report);
    } catch (err) {
      toast.error('Report generation failed: ' + (err.message || 'Unknown error'));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4" style={{ background: palette.page }}>
      <HeroSection macroScore={macroScore} dashboard={macroDashboard} palette={palette} recommendation={recommendation} />

      {behavioralAlerts.length > 0 && (
        <SoftPanel palette={palette} className="p-4 md:p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={15} style={{ color: palette.red }} />
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] m-0" style={{ color: palette.sub }}>Behavioral Alerts</p>
          </div>
          <div className="space-y-2">
            {behavioralAlerts.map((alert, index) => (
              <div key={index} className="rounded-2xl px-4 py-3 flex items-start gap-3" style={{ background: alert.severity === 'danger' ? `${palette.red}12` : palette.soft }}>
                <AlertTriangle size={14} className="shrink-0 mt-0.5" style={{ color: alert.severity === 'danger' ? palette.red : palette.blue }} />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide m-0" style={{ color: alert.severity === 'danger' ? palette.red : palette.blue }}>
                    {String(alert.type || '').replace(/_/g, ' ')}
                  </p>
                  <p className="text-sm m-0 mt-1" style={{ color: palette.text }}>{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </SoftPanel>
      )}

      <KeyDrivers drivers={topDrivers} palette={palette} />

      {groupedIndicators.length > 0 && <CategoryGroups groups={groupedIndicators} palette={palette} />}

      <SoftPanel palette={palette} className="p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText size={15} style={{ color: palette.blue }} />
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] m-0" style={{ color: palette.sub }}>AI Performance Report</p>
            </div>
            <p className="text-sm m-0" style={{ color: palette.sub }}>Generate a compressed report instead of scanning raw trade history.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {['weekly', 'monthly', 'custom'].map((type) => {
              const active = reportType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setReportType(type)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
                  style={{
                    border: 'none',
                    color: active ? '#ffffff' : palette.sub,
                    background: active ? palette.blue : palette.soft,
                  }}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <button
            type="button"
            onClick={handleGenerateReport}
            disabled={generating || !metrics?.totalTrades}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{
              border: 'none',
              color: '#ffffff',
              background: palette.blue,
              opacity: generating || !metrics?.totalTrades ? 0.5 : 1,
              boxShadow: generating || !metrics?.totalTrades ? 'none' : '0 10px 24px rgba(161,98,7,0.25)',
            }}
          >
            {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {generating ? 'Generating...' : 'Generate Report'}
          </button>
          {!reportsLoaded && (
            <button
              type="button"
              onClick={loadReports}
              disabled={loadingReports}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{ border: 'none', color: palette.text, background: palette.soft, opacity: loadingReports ? 0.5 : 1 }}
            >
              {loadingReports ? <Loader2 size={14} className="animate-spin" /> : <Brain size={14} />}
              {loadingReports ? 'Loading...' : 'View Past Reports'}
            </button>
          )}
        </div>

        {!metrics?.totalTrades && (
          <p className="text-xs m-0 mt-3" style={{ color: palette.sub }}>Log at least one trade to generate a report.</p>
        )}
      </SoftPanel>

      {reports.length > 0 && (
        <div>
          <p className="text-sm font-semibold mb-3" style={{ color: palette.text }}>Past Reports</p>
          <div className="space-y-2">
            {reports.map((report, index) => <ReportCard key={report.id || index} report={report} palette={palette} />)}
          </div>
        </div>
      )}

      {analyzedTrades.length > 0 ? (
        <div>
          <p className="text-sm font-semibold mb-3" style={{ color: palette.text }}>
            Trade Analyses <span className="text-xs font-normal" style={{ color: palette.sub }}>({analyzedTrades.length} analyzed)</span>
          </p>
          <div className="space-y-2">
            {analyzedTrades.slice(0, 20).map((trade) => <TradeAnalysisRow key={trade.id} trade={trade} palette={palette} />)}
          </div>
        </div>
      ) : (
        <SoftPanel palette={palette} className="p-8 text-center">
          <Brain size={34} className="mx-auto mb-3 opacity-40" style={{ color: palette.sub }} />
          <p className="text-sm m-0" style={{ color: palette.sub }}>No AI analyses yet</p>
          <p className="text-xs m-0 mt-1" style={{ color: palette.sub }}>Go to Trade History and run AI analysis on a trade to populate this view.</p>
        </SoftPanel>
      )}
    </div>
  );
}
