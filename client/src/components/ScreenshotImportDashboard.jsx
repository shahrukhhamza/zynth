import { useState, useEffect, useCallback } from 'react';
import {
  Camera,
  BarChart3,
  TrendingUp,
  Brain,
  Clock,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader2,
  ImageIcon,
  ListOrdered,
  Activity,
  WifiOff,
  Database,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { getScreenshotReport } from '../services/mt5Api';
import ScreenshotUpload from './ScreenshotUpload';
import MT5PerformanceStats   from './MT5PerformanceStats';
import MT5PerformanceCharts  from './MT5PerformanceCharts';
import MT5AIInsights         from './MT5AIInsights';
import MT5BehaviorInsights   from './MT5BehaviorInsights';
import MT5HeatmapChart       from './MT5HeatmapChart';
import MT5TradeHistory       from './MT5TradeHistory';

// ── Tab definitions ────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',  label: 'Overview',    Icon: BarChart3    },
  { id: 'charts',    label: 'Charts',      Icon: TrendingUp   },
  { id: 'behavior',  label: 'Behaviour',   Icon: Brain        },
  { id: 'history',   label: 'History',     Icon: ListOrdered  },
  { id: 'upload',    label: 'Upload New',  Icon: Camera       },
];

const CACHE_KEY = 'screenshot_report_cache';

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveCache(result) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...result, _cachedAt: Date.now() }));
  } catch { /* storage full — ignore */ }
}

export default function ScreenshotImportDashboard() {
  const theme = useTheme();

  // Seed state from localStorage cache immediately — data visible before service responds
  const [data,          setData]          = useState(() => loadCache());
  const [activeTab,     setActiveTab]     = useState(() => loadCache()?.trades?.length > 0 ? 'overview' : 'upload');
  const [loadingInit,   setLoadingInit]   = useState(true);
  const [serviceOnline, setServiceOnline] = useState(true);   // false = MT5 Python service unreachable
  const [serviceError,  setServiceError]  = useState(null);   // human-readable reason

  // ── On mount: check if we already have stored screenshot trades ──────────
  const loadExisting = useCallback(async () => {
    setLoadingInit(true);
    setServiceOnline(true);
    setServiceError(null);
    try {
      const result = await getScreenshotReport();
      if (result.success && result.trades?.length > 0) {
        setData(result);
        saveCache(result);           // keep fresh copy in localStorage
        setActiveTab('overview');
      } else if (!loadCache()?.trades?.length) {
        // Live service says no data and no cache — go to upload
        setActiveTab('upload');
      }
      setServiceOnline(true);
    } catch (err) {
      // Service is down — but DON'T wipe existing data; show offline banner instead
      setServiceOnline(false);
      const status = err?.response?.status;
      if (status === 401) {
        setServiceError('Session expired. Please log out and log in again.');
      } else {
        setServiceError(
          'The MT5 analysis service is not running. ' +
          'Start it with: cd mt5_service && python main.py'
        );
      }
      console.warn('[ScreenshotDashboard] Could not reach analysis service:', err.message);
    } finally {
      setLoadingInit(false);
    }
  }, []);

  useEffect(() => {
    loadExisting();
  }, [loadExisting]);

  // ── After a successful upload ─────────────────────────────────────────────
  const handleUploaded = (result) => {
    setData(result);
    saveCache(result);
    setServiceOnline(true);
    setServiceError(null);
    setActiveTab('overview');
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const analysis   = data?.analysis   ?? null;
  const behavior   = data?.behavior   ?? null;
  const aiSummary  = data?.ai_summary ?? null;
  const trades     = data?.trades     ?? [];
  const heatmap    = analysis?.heatmap ?? [];
  const hasData    = Boolean(trades.length > 0);
  const cachedAt   = data?._cachedAt  ?? null;

  // ── Loading state (only show spinner on first load when no cache) ────────
  if (loadingInit && !hasData) {
    return (
      <div
        className="flex-1 flex items-center justify-center h-full"
        style={{ color: theme.muted }}
      >
        <Loader2 className="w-6 h-6 animate-spin mr-3" />
        <span>Loading trade data…</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* ── Header ── */}
      <div
        className="sticky top-0 z-10 px-6 py-4 border-b"
        style={{ backgroundColor: theme.surface, borderColor: theme.border }}
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Title + trade count */}
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${theme.accent}20`, color: theme.accent }}
            >
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight" style={{ color: theme.text }}>
                Trade Journal
              </h1>
              {hasData && (
                <p className="text-xs" style={{ color: theme.muted }}>
                  {trades.length} trade{trades.length !== 1 ? 's' : ''} · Screenshot import
                </p>
              )}
            </div>
          </div>

          {/* Summary pills */}
          {hasData && analysis && (
            <div className="flex items-center gap-3 flex-wrap">
              <Pill
                label="Win Rate"
                value={`${analysis.win_rate ?? 0}%`}
                color={
                  (analysis.win_rate ?? 0) >= 50
                    ? theme.success
                    : theme.danger
                }
                theme={theme}
              />
              <Pill
                label="Total P&L"
                value={`${(analysis.total_profit ?? 0) >= 0 ? '+' : ''}${(analysis.total_profit ?? 0).toFixed(2)}`}
                color={
                  (analysis.total_profit ?? 0) >= 0
                    ? theme.success
                    : theme.danger
                }
                theme={theme}
              />
              {analysis.profit_factor != null && (
                <Pill
                  label="PF"
                  value={analysis.profit_factor}
                  color={
                    analysis.profit_factor >= 1.5
                      ? theme.success
                      : analysis.profit_factor >= 1
                      ? theme.warning
                      : theme.danger
                  }
                  theme={theme}
                />
              )}

              {/* Refresh */}
              <button
                onClick={loadExisting}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: theme.muted }}
                title="Refresh data"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* ── Tab bar ── */}
        {hasData && (
          <div className="flex gap-1 mt-3">
            {TABS.map(({ id, label, Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    backgroundColor: active ? `${theme.accent}20` : 'transparent',
                    color:           active ? theme.accent : theme.muted,
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Service offline banner ─────────────────────────────────────── */}
      {!serviceOnline && (
        <div
          className="mx-6 mt-4 flex items-start gap-3 rounded-xl px-4 py-3 border"
          style={{
            backgroundColor: theme.isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.08)',
            borderColor: 'rgba(239,68,68,0.4)',
          }}
        >
          <WifiOff className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: '#ef4444' }}>
              MT5 Analysis Service Offline
            </p>
            <p className="text-xs mt-0.5" style={{ color: theme.muted }}>
              {serviceError}
            </p>
            {hasData && cachedAt && (
              <p className="text-xs mt-1 flex items-center gap-1" style={{ color: theme.muted }}>
                <Database className="w-3 h-3" />
                Showing data cached on{' '}
                {new Date(cachedAt).toLocaleString([], {
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </p>
            )}
          </div>
          <button
            onClick={loadExisting}
            disabled={loadingInit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0"
            style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
          >
            {loadingInit
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <RefreshCw className="w-3.5 h-3.5" />}
            Retry
          </button>
        </div>
      )}

      {/* ── Tab content ── */}
      <div className="p-6">
        {/* No data / upload tab */}
        {(!hasData || activeTab === 'upload') && (
          <ScreenshotUpload onUploaded={handleUploaded} />
        )}

        {/* Overview */}
        {hasData && activeTab === 'overview' && analysis && (
          <div className="space-y-6">
            <MT5PerformanceStats analysis={analysis} />
            <MT5AIInsights aiSummary={aiSummary} />
          </div>
        )}

        {/* Charts */}
        {hasData && activeTab === 'charts' && analysis && (
          <div className="space-y-6">
            <MT5PerformanceCharts analysis={analysis} trades={trades} />
            {heatmap.length > 0 && <MT5HeatmapChart heatmap={heatmap} />}
          </div>
        )}

        {/* Behaviour */}
        {hasData && activeTab === 'behavior' && (
          <MT5BehaviorInsights behavior={behavior} aiSummary={aiSummary} />
        )}

        {/* Trade History */}
        {hasData && activeTab === 'history' && (
          <MT5TradeHistory trades={trades} />
        )}
      </div>
    </div>
  );
}

// ── Small summary pill ─────────────────────────────────────────────────────
function Pill({ label, value, color, theme }) {
  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium"
      style={{ backgroundColor: `${color}15`, color }}
    >
      <span style={{ color: theme.muted }}>{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
