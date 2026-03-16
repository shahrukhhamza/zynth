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
  Trash2,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useTimezone } from '../contexts/TimezoneContext';
import { usePlanGate } from '../hooks/usePlanGate';
import { deleteScreenshotReport, deleteScreenshotTrade, getScreenshotReport } from '../services/mt5Api';
import ScreenshotUpload from './ScreenshotUpload';
import MT5PerformanceStats   from './MT5PerformanceStats';
import MT5PerformanceCharts  from './MT5PerformanceCharts';
import MT5AIInsights         from './MT5AIInsights';
import MT5BehaviorInsights   from './MT5BehaviorInsights';
import MT5HeatmapChart       from './MT5HeatmapChart';
import MT5TradeHistory       from './MT5TradeHistory';
import PlanGateBanner from './PlanGateBanner';
import ProfileModal from './ProfileModal';

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

function clearCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // no-op
  }
}

export default function ScreenshotImportDashboard() {
  const theme = useTheme();
  const { formatDateWithTimezone } = useTimezone();
  const { isFree, isPro, isElite, isAdmin, screenshotTriesLeft } = usePlanGate();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const triesExhausted = !isElite && !isAdmin && screenshotTriesLeft <= 0;

  // Seed state from localStorage cache immediately — data visible before service responds
  const [data,          setData]          = useState(() => loadCache());
  const [activeTab,     setActiveTab]     = useState(() => loadCache()?.trades?.length > 0 ? 'overview' : 'upload');
  const [loadingInit,   setLoadingInit]   = useState(true);
  const [serviceOnline, setServiceOnline] = useState(true);   // false = MT5 Python service unreachable
  const [serviceError,  setServiceError]  = useState(null);   // human-readable reason
  const [deleting,      setDeleting]      = useState(false);
  const [deletingTradeId, setDeletingTradeId] = useState(null);
  const [confirmModal,  setConfirmModal]  = useState(null); // { type: 'all' } | { type: 'trade', trade }

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
        // Only redirect to overview if user hasn't manually chosen a tab yet
        setActiveTab(prev => prev === 'upload' ? 'overview' : prev);
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
        setServiceError('Your session has expired. Please sign out and sign back in.');
      } else {
        setServiceError(
          'The analysis service is temporarily unavailable. Please try again in a moment.'
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

  const handleDeleteReport = () => {
    if (deleting) return;
    setConfirmModal({ type: 'all' });
  };

  const handleDeleteTrade = (trade) => {
    setConfirmModal({ type: 'trade', trade });
  };

  const handleConfirmDelete = async () => {
    if (!confirmModal) return;

    if (confirmModal.type === 'all') {
      setDeleting(true);
      try {
        await deleteScreenshotReport();
        clearCache();
        setData(null);
        setActiveTab('upload');
        setServiceOnline(true);
        setServiceError(null);
      } catch (err) {
        const status = err?.response?.status;
        if (status === 401) {
          setServiceError('Your session has expired. Please sign out and sign back in.');
        } else {
          setServiceError('Failed to delete screenshot analysis data. Please try again.');
        }
      } finally {
        setDeleting(false);
        setConfirmModal(null);
      }
    } else if (confirmModal.type === 'trade') {
      const tradeId = confirmModal.trade.id;
      setDeletingTradeId(tradeId);
      try {
        await deleteScreenshotTrade(tradeId);
        // Remove from local state and refresh analysis from server
        await loadExisting();
      } catch (err) {
        const status = err?.response?.status;
        if (status === 401) {
          setServiceError('Your session has expired. Please sign out and sign back in.');
        } else {
          setServiceError('Failed to delete trade. Please try again.');
        }
      } finally {
        setDeletingTradeId(null);
        setConfirmModal(null);
      }
    }
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
      {/* Themed delete confirmation modal */}
      <DeleteModal
        modal={confirmModal}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmModal(null)}
        isDeleting={deleting || deletingTradeId !== null}
        theme={theme}
      />

      {/* Plan gate: tries counter banner OR hard block */}
      {showUpgradeModal && <ProfileModal onClose={() => setShowUpgradeModal(false)} />}
      {triesExhausted ? (
        <div style={{
          margin: '24px 24px 0',
          padding: 28,
          borderRadius: 16,
          background: 'rgba(239,68,68,0.06)',
          border: '1px solid rgba(239,68,68,0.25)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          textAlign: 'center', gap: 12,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Camera style={{ color: '#ef4444', width: 22, height: 22 }} />
          </div>
          <p style={{ color: theme.text, fontWeight: 700, fontSize: 17, margin: 0 }}>
            Screenshot Analysis Limit Reached
          </p>
          <p style={{ color: theme.muted, fontSize: 14, maxWidth: 380, margin: 0, lineHeight: 1.5 }}>
            {isFree
              ? 'You have used your 2 lifetime free screenshot analyses. Upgrade to Pro for 35 analyses per month.'
              : 'You have used all 35 Pro analyses this month. Upgrade to Elite for unlimited screenshot OCR.'}
          </p>
          <button
            onClick={() => setShowUpgradeModal(true)}
            style={{
              background: '#10b981', color: 'white', border: 'none',
              borderRadius: 10, padding: '11px 28px',
              fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 4,
            }}
          >
            {isFree ? 'Upgrade to Pro — $1.99/mo' : 'Upgrade to Elite — $4.99/mo'}
          </button>
        </div>
      ) : (
        /* Soft banner: tries remaining */
        !isElite && !isAdmin && (
          <div style={{ margin: '16px 24px 0' }}>
            <PlanGateBanner
              feature="Screenshot Analysis"
              requiredPlan={isFree ? 'Pro' : 'Elite'}
              description={
                isElite || isAdmin ? '' :
                isPro
                  ? `${screenshotTriesLeft} of 35 pro analyses remaining this month`
                  : `${screenshotTriesLeft} of 2 free lifetime ${screenshotTriesLeft === 1 ? 'analysis' : 'analyses'} remaining`
              }
              onUpgradeClick={() => setShowUpgradeModal(true)}
            />
          </div>
        )
      )}
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
              <button
                onClick={handleDeleteReport}
                disabled={deleting}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: deleting ? theme.muted : '#ef4444' }}
                title="Delete screenshot analysis data"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>

        {/* ── Tab bar ── */}
        {hasData && (
          <div className="flex gap-1 mt-3 overflow-x-auto pb-1 scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {TABS.map(({ id, label, Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0"
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

      {/* ── Service offline banner — only show when there's no data to display ── */}
      {!serviceOnline && !hasData && (
        <div
          className="mx-6 mt-4 flex items-start gap-3 rounded-xl px-4 py-3 border"
          style={{
            backgroundColor: theme.isDark ? 'rgba(234,179,8,0.08)' : 'rgba(234,179,8,0.06)',
            borderColor: 'rgba(234,179,8,0.3)',
          }}
        >
          <WifiOff className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#eab308' }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: '#eab308' }}>
              Analysis Service Unavailable
            </p>
            <p className="text-xs mt-0.5" style={{ color: theme.muted }}>
              {serviceError}
            </p>
            {hasData && cachedAt && (
              <p className="text-xs mt-1 flex items-center gap-1" style={{ color: theme.muted }}>
                <Database className="w-3 h-3" />
                Showing data cached on{' '}
                {formatDateWithTimezone(new Date(cachedAt), 'MMM dd, yyyy HH:mm')}
              </p>
            )}
          </div>
          <button
            onClick={loadExisting}
            disabled={loadingInit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0"
            style={{ backgroundColor: 'rgba(234,179,8,0.15)', color: '#eab308' }}
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
        {(!hasData || activeTab === 'upload') && !triesExhausted && (
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
            {(heatmap.length > 0 || trades.length > 0) && <MT5HeatmapChart heatmap={heatmap} trades={trades} />}
          </div>
        )}

        {/* Behaviour */}
        {hasData && activeTab === 'behavior' && (
          <MT5BehaviorInsights behavior={behavior} aiSummary={aiSummary} />
        )}

        {/* Trade History */}
        {hasData && activeTab === 'history' && (
          <MT5TradeHistory
            trades={trades}
            onDeleteTrade={handleDeleteTrade}
            deletingTradeId={deletingTradeId}
          />
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

// ── Delete confirmation modal ──────────────────────────────────────────────
function DeleteModal({ modal, onConfirm, onCancel, isDeleting, theme }) {
  if (!modal) return null;

  const isAll = modal.type === 'all';
  const trade = modal.trade;
  const profit = trade?.profit ?? 0;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        backgroundColor: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        animation: 'fadeIn 0.15s ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget && !isDeleting) onCancel(); }}
    >
      <div
        style={{
          backgroundColor: theme.isDark ? '#1a1a2e' : theme.surface,
          border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.08)' : theme.border}`,
          borderRadius: 20,
          padding: '36px 32px 28px',
          maxWidth: 380, width: '100%',
          boxShadow: theme.isDark
            ? '0 0 0 1px rgba(255,255,255,0.04), 0 24px 60px rgba(0,0,0,0.6)'
            : '0 20px 60px rgba(0,0,0,0.18)',
          animation: 'slideUp 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {/* Icon badge */}
        <div style={{
          position: 'relative',
          width: 64, height: 64,
          margin: '0 auto 22px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {/* Outer glow ring */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(239,68,68,0.18) 0%, transparent 70%)',
          }} />
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.08) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Trash2 style={{ width: 21, height: 21, color: '#ef4444' }} />
          </div>
        </div>

        <h3 style={{
          color: theme.text, fontSize: 17, fontWeight: 700,
          textAlign: 'center', margin: '0 0 8px',
          letterSpacing: '-0.01em',
        }}>
          {isAll ? 'Delete All Screenshot Data' : 'Delete Trade'}
        </h3>

        <p style={{
          color: theme.muted, fontSize: 13.5,
          textAlign: 'center', lineHeight: 1.65, margin: '0 0 20px',
          padding: '0 4px',
        }}>
          {isAll
            ? 'This will permanently remove all screenshot analysis data and every imported trade.'
            : (
              <>
                Permanently delete the{' '}
                <strong style={{ color: theme.text }}>{trade?.symbol}</strong>{' '}
                <span style={{
                  color: trade?.type === 'BUY' ? '#10b981' : '#ef4444',
                  fontWeight: 600,
                }}>
                  {trade?.type}
                </span>{' '}
                trade{' '}
                <span style={{
                  color: profit >= 0 ? '#10b981' : '#ef4444',
                  fontWeight: 600,
                }}>
                  ({profit >= 0 ? '+' : ''}{profit.toFixed(2)})
                </span>
                ?
              </>
            )}
        </p>

        {/* Warning chip */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          backgroundColor: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.18)',
          borderRadius: 8, padding: '7px 14px',
          margin: '0 0 24px',
        }}>
          <AlertCircle style={{ width: 13, height: 13, color: '#ef4444', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 500 }}>
            This action cannot be undone
          </span>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            disabled={isDeleting}
            style={{
              flex: 1, padding: '11px 16px', borderRadius: 11,
              border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.1)' : theme.border}`,
              backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'transparent',
              color: theme.text, fontSize: 14, fontWeight: 500,
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              opacity: isDeleting ? 0.4 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            style={{
              flex: 1, padding: '11px 16px', borderRadius: 11,
              border: 'none',
              background: isDeleting
                ? 'rgba(239,68,68,0.6)'
                : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white', fontSize: 14, fontWeight: 600,
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              boxShadow: isDeleting ? 'none' : '0 4px 14px rgba(239,68,68,0.35)',
              transition: 'all 0.15s',
            }}
          >
            {isDeleting
              ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />
              : <Trash2 style={{ width: 14, height: 14 }} />}
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
      `}</style>
    </div>
  );
}
