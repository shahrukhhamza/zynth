/**
 * Economic Intelligence - All 10 high-impact USD indicators
 * Professional Bloomberg-style card layout
 */

import { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, Activity, Loader2, AlertCircle,
  RefreshCcw, Brain,
} from 'lucide-react';
import { API_URL } from '../config/api';
import { useTheme } from '../contexts/ThemeContext';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

/*
 * Indicator groups - order = display order on page
 */
const GROUPS = [
  { label: 'Labor Market',      accent: '#3b82f6', keys: ['nfp', 'unemployment', 'joblessClaims'] },
  { label: 'Inflation',         accent: '#f59e0b', keys: ['cpi', 'corePCE'] },
  { label: 'Monetary Policy',   accent: '#8b5cf6', keys: ['fedRate'] },
  { label: 'Growth & Activity', accent: '#22c55e', keys: ['gdp', 'retailSales', 'ismMfg'] },
  { label: 'Sentiment',         accent: '#ec4899', keys: ['consumerConf'] },
];

/* colour scheme per impact direction */
function ic(impactColor) {
  if (impactColor === 'green') return { border: '#22c55e', glow: 'rgba(34,197,94,0.12)',  text: '#22c55e', badge: 'rgba(34,197,94,0.15)'  };
  if (impactColor === 'red')   return { border: '#ef4444', glow: 'rgba(239,68,68,0.12)',  text: '#ef4444', badge: 'rgba(239,68,68,0.15)'  };
  return                              { border: '#4b5563', glow: 'rgba(75,85,99,0.08)',   text: '#9ca3af', badge: 'rgba(75,85,99,0.15)'   };
}

function fmt(v, unit) {
  if (v == null || v === '') return '--';
  return `${v}${unit ?? ''}`;
}

/*
 * IndicatorCard - professional card matching original Bloomberg-style UI
 */
function IndicatorCard({ data, theme, accentColor }) {
  const c = ic(data.impactColor);
  const surprisePositive = data.surprise > 0;
  const surpriseNegative = data.surprise < 0;
  const surpriseColor = surprisePositive ? '#22c55e' : surpriseNegative ? '#ef4444' : '#9ca3af';

  return (
    <div
      className="rounded-xl flex flex-col relative overflow-hidden"
      style={{
        backgroundColor: theme.surface,
        border: `2px solid ${c.border}`,
        boxShadow: `0 0 20px ${c.glow}, 0 2px 8px rgba(0,0,0,0.3)`,
      }}
    >
      {/* Top accent stripe */}
      <div style={{ height: 3, backgroundColor: c.border, width: '100%' }} />

      {/* Card header */}
      <div className="flex items-start justify-between px-5 pt-4 pb-1">
        <h3 className="text-sm font-bold leading-tight" style={{ color: theme.text }}>
          {data.indicator}
        </h3>
        {data.latestDate && (
          <span
            className="text-xs px-2 py-0.5 rounded-full ml-2 shrink-0"
            style={{ backgroundColor: theme.border, color: theme.muted, fontSize: '0.68rem' }}
          >
            {data.latestDate}
          </span>
        )}
      </div>

      {/* Description */}
      {data.description && (
        <p className="px-5 text-xs leading-relaxed" style={{ color: theme.muted }}>
          {data.description.length > 72 ? data.description.slice(0, 72) + '...' : data.description}
        </p>
      )}

      {/* Divider */}
      <div className="mx-5 my-3" style={{ borderTop: `1px solid ${theme.border}` }} />

      {/* Data rows */}
      <div className="px-5 space-y-2 pb-1">
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium" style={{ color: theme.muted }}>Actual</span>
          <span className="text-xl font-extrabold tabular-nums tracking-tight" style={{ color: theme.text }}>
            {fmt(data.actual, data.unit)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium" style={{ color: theme.muted }}>Forecast</span>
          <span className="text-lg font-semibold tabular-nums" style={{ color: accentColor }}>
            {fmt(data.forecast, data.unit)}
          </span>
        </div>
        <div className="flex justify-between items-center pt-1" style={{ borderTop: `1px solid ${theme.border}` }}>
          <span className="text-xs font-semibold" style={{ color: theme.text }}>Surprise</span>
          <span className="text-xl font-extrabold tabular-nums" style={{ color: surpriseColor }}>
            {data.surprise != null ? (surprisePositive ? '+' : '') + fmt(data.surprise, data.unit) : '--'}
          </span>
        </div>
      </div>

      {/* Impact badge */}
      <div className="mx-5 mt-3 mb-5">
        <div
          className="rounded-lg py-2 text-center text-sm font-bold tracking-wide"
          style={{ backgroundColor: c.badge, color: c.text, border: `1px solid ${c.border}40` }}
        >
          {data.impact || 'Neutral'}
        </div>
      </div>
    </div>
  );
}

/*
 * HistoricalChart - themed line chart
 */
function HistoricalChart({ data, code, unit, isDark, color, title }) {
  if (!data || data.length === 0) return null;

  const gridColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
  const tickColor = isDark ? '#9ca3af' : '#6b7280';
  const bgSurface = isDark ? '#0f172a' : '#ffffff';

  const chartData = {
    labels: data.map(d => (d.date ? d.date.slice(0, 7) : '')),
    datasets: [{
      label: code,
      data: data.map(d => d.value),
      borderColor: color,
      backgroundColor: color + '18',
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 6,
      pointBackgroundColor: color,
      tension: 0.35,
      fill: true,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        titleColor: isDark ? '#e2e8f0' : '#1e293b',
        bodyColor:  isDark ? '#cbd5e1' : '#475569',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        borderWidth: 1,
        padding: 10,
        callbacks: { label: ctx => ` ${ctx.parsed.y}${unit ?? ''}` },
      },
    },
    scales: {
      x: {
        ticks: { color: tickColor, maxRotation: 45, minRotation: 45, font: { size: 9 } },
        grid:  { color: gridColor },
        border: { color: gridColor },
      },
      y: {
        ticks: { color: tickColor, font: { size: 9 }, callback: v => `${v}${unit ?? ''}` },
        grid:  { color: gridColor },
        border: { color: gridColor },
      },
    },
  };

  return (
    <div
      className="rounded-xl p-4"
      style={{ backgroundColor: bgSurface, border: `1px solid ${color}30` }}
    >
      <p className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color }}>
        {title} - Last {data.length} Releases
      </p>
      <div style={{ height: 200 }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}

/*
 * Main component
 */
function EconomicIntelligence() {
  const theme = useTheme();
  const isDark = theme.isDark;

  const [dashboard, setDashboard]   = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = async () => {
    try {
      setError(null);
      const res = await fetch(`${API_URL}/api/economic/dashboard`);
      if (!res.ok) throw new Error('Failed to load economic intelligence');
      setDashboard(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetch(`${API_URL}/api/economic/refresh`, { method: 'POST' });
      setLoading(true);
      await loadDashboard();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    const id = setInterval(loadDashboard, 300000);
    return () => clearInterval(id);
  }, []);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center" style={{ minHeight: 320 }}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: theme.accent }} />
        <p className="text-sm" style={{ color: theme.muted }}>Loading economic data...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex-1 p-6">
      <div
        className="rounded-xl border p-6 flex gap-3"
        style={{ backgroundColor: 'rgba(239,68,68,0.08)', borderColor: '#ef4444' }}
      >
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
        <div>
          <p className="font-semibold" style={{ color: '#ef4444' }}>Error loading economic intelligence</p>
          <p className="text-sm mt-1" style={{ color: theme.muted }}>{error}</p>
        </div>
      </div>
    </div>
  );

  if (!dashboard || dashboard.error) return null;

  const { indicators, overallSentiment, sentimentColor, summary, aiAnalysis } = dashboard;
  const sc = ic(sentimentColor);

  return (
    <div className="flex-1 overflow-y-auto" style={{ backgroundColor: theme.bg }}>
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-8">

        {/* Page header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-6 h-6" style={{ color: theme.accent }} />
              <h2 className="text-2xl font-bold" style={{ color: theme.text }}>Economic Intelligence</h2>
            </div>
            <p className="text-sm mt-1" style={{ color: theme.muted }}>
              Macroeconomic surprise indicators for gold (XAUUSD)
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold disabled:opacity-50 transition-opacity"
            style={{ backgroundColor: theme.accent, color: '#fff' }}
          >
            <RefreshCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Overall Sentiment banner */}
        <div
          className="rounded-xl border-2 px-7 py-6 flex items-center justify-between flex-wrap gap-4"
          style={{ borderColor: sc.border, backgroundColor: sc.glow }}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: sc.text }}>
              Overall Market Sentiment
            </p>
            <p className="text-4xl font-extrabold leading-none" style={{ color: sc.text }}>
              {overallSentiment}
            </p>
            <div className="flex flex-wrap gap-5 mt-3 text-sm font-semibold">
              <span style={{ color: '#22c55e' }}>
                &#9650; {summary.bullishIndicators} Bullish
              </span>
              <span style={{ color: '#ef4444' }}>
                &#9660; {summary.bearishIndicators} Bearish
              </span>
              <span style={{ color: '#9ca3af' }}>
                &#9679; {summary.neutralIndicators} Neutral
              </span>
              <span style={{ color: theme.muted }}>
                / {summary.totalIndicators ?? 10} indicators
              </span>
            </div>
          </div>
          {sentimentColor === 'green'
            ? <TrendingUp  className="w-14 h-14" style={{ color: '#22c55e', opacity: 0.85 }} />
            : sentimentColor === 'red'
            ? <TrendingDown className="w-14 h-14" style={{ color: '#ef4444', opacity: 0.85 }} />
            : <Activity className="w-14 h-14" style={{ color: '#9ca3af', opacity: 0.5 }} />}
        </div>

        {/* AI Analysis */}
        {aiAnalysis && !aiAnalysis.error && (
          <div
            className="rounded-xl border px-6 py-5 flex gap-4"
            style={{ backgroundColor: 'rgba(139,92,246,0.07)', borderColor: '#8b5cf6' }}
          >
            <Brain className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#8b5cf6' }} />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#a78bfa' }}>
                AI Macro Analysis
              </p>
              <p className="text-sm leading-relaxed" style={{ color: theme.text }}>{aiAnalysis.analysis}</p>
            </div>
          </div>
        )}

        {/* Indicator groups */}
        {GROUPS.map(group => {
          const items = group.keys
            .map(k => ({ key: k, data: indicators[k] }))
            .filter(({ data }) => data && !data.error);
          if (!items.length) return null;

          const withCharts = items.filter(({ data }) => data.historicalData && data.historicalData.length > 0);

          return (
            <section key={group.label}>
              {/* Section header */}
              <div className="flex items-center gap-3 mb-4">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: group.accent }} />
                <h3
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: group.accent }}
                >
                  {group.label}
                </h3>
                <div className="flex-1" style={{ height: 1, backgroundColor: group.accent + '30' }} />
              </div>

              {/* Cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-5">
                {items.map(({ key, data }) => (
                  <IndicatorCard
                    key={key}
                    data={data}
                    theme={theme}
                    accentColor={group.accent}
                  />
                ))}
              </div>

              {/* Charts grid */}
              {withCharts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {withCharts.map(({ key, data }) => (
                    <HistoricalChart
                      key={key}
                      data={data.historicalData}
                      code={data.code}
                      unit={data.unit}
                      isDark={isDark}
                      color={group.accent}
                      title={data.code}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}

        <p className="text-xs text-center pb-2" style={{ color: theme.muted }}>
          Primary source: FRED (Federal Reserve Bank of St. Louis). Monetary policy, ISM and Consumer Confidence via verified analyst consensus. Auto-refreshes every 5 minutes.
        </p>
      </div>
    </div>
  );
}

export default EconomicIntelligence;
