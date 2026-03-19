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
import { deleteScreenshotReport, deleteScreenshotTrade, deleteScreenshotBatch, getScreenshotReport, getScreenshotBatches } from '../services/mt5Api';
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
  const [confirmModal,  setConfirmModal]  = useState(null); // { type: 'all' } | { type: 'trade', trade } | { type: 'batch', batch, label }
  const [batches,       setBatches]       = useState([]);
  const [deletingBatchId, setDeletingBatchId] = useState(null);

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
      // Also fetch batches (non-critical — don't let failure break main report)
      try {
        const batchRes = await getScreenshotBatches();
        if (batchRes.success) setBatches(batchRes.batches ?? []);
      } catch { /* ignore batch fetch errors */ }
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

  const handleDeleteBatch = (batch, label) => {
    setConfirmModal({ type: 'batch', batch, label });
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
    } else if (confirmModal.type === 'batch') {
      const batchId = confirmModal.batch.upload_batch;
      setDeletingBatchId(batchId ?? 'null');
      try {
        await deleteScreenshotBatch(batchId);
        await loadExisting();
      } catch (err) {
        const status = err?.response?.status;
        if (status === 401) {
          setServiceError('Your session has expired. Please sign out and sign back in.');
        } else {
          setServiceError('Failed to delete screenshot upload. Please try again.');
        }
      } finally {
        setDeletingBatchId(null);
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
            <div className="flex items-center gap-2 flex-wrap">
              {/* Inline stats bar */}
              <div style={{
                display: 'flex', alignItems: 'stretch',
                background: theme.isDark ? '#111111' : theme.surface,
                border: `1px solid ${theme.isDark ? '#1e1e1e' : theme.border}`,
                borderRadius: 10,
                overflow: 'hidden',
              }}>
                <Pill
                  label="Win Rate"
                  value={`${analysis.win_rate ?? 0}%`}
                  color={(analysis.win_rate ?? 0) >= 50 ? '#10b981' : '#ef4444'}
                />
                <div style={{ width: 1, background: theme.isDark ? '#1e1e1e' : theme.border, alignSelf: 'stretch' }} />
                <Pill
                  label="Total P&L"
                  value={`${(analysis.total_profit ?? 0) >= 0 ? '+' : ''}${(analysis.total_profit ?? 0).toFixed(2)}`}
                  color={(analysis.total_profit ?? 0) >= 0 ? '#10b981' : '#ef4444'}
                />
                {analysis.profit_factor != null && (
                  <>
                    <div style={{ width: 1, background: theme.isDark ? '#1e1e1e' : theme.border, alignSelf: 'stretch' }} />
                    <Pill
                      label="PF"
                      value={analysis.profit_factor}
                      color={analysis.profit_factor >= 1.5 ? '#10b981' : analysis.profit_factor >= 1 ? '#f59e0b' : '#ef4444'}
                    />
                  </>
                )}
              </div>

              {/* Action buttons */}
              <button
                onClick={loadExisting}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: theme.isDark ? '#4a4a4a' : theme.muted, background: theme.isDark ? '#111111' : theme.surface, border: `1px solid ${theme.isDark ? '#1e1e1e' : theme.border}`, borderRadius: 8 }}
                title="Refresh data"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={handleDeleteReport}
                disabled={deleting}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: deleting ? (theme.isDark ? '#4a4a4a' : theme.muted) : '#ef4444', background: theme.isDark ? '#111111' : theme.surface, border: `1px solid ${theme.isDark ? '#1e1e1e' : theme.border}`, borderRadius: 8 }}
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
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all flex-shrink-0"
                  style={{
                    borderRadius: 8,
                    backgroundColor: active ? (theme.isDark ? '#1e1e1e' : theme.surface2) : 'transparent',
                    color: active ? theme.accent : (theme.isDark ? '#4a4a4a' : theme.muted),
                    border: 'none',
                    borderBottom: active ? `2px solid ${theme.accent}` : '2px solid transparent',
                    outline: 'none',
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
          <div className="space-y-6">
            <ScreenshotBatchList
              batches={batches}
              onDeleteBatch={handleDeleteBatch}
              deletingBatchId={deletingBatchId}
              theme={theme}
            />
            <MT5TradeHistory
              trades={trades}
              onDeleteTrade={handleDeleteTrade}
              deletingTradeId={deletingTradeId}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Small summary pill ─────────────────────────────────────────────────────
// ── Screenshot batch list (shown at top of History tab) ───────────────────
function ScreenshotBatchList({ batches, onDeleteBatch, deletingBatchId, theme }) {
  if (!batches || batches.length === 0) return null;

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: theme.muted }}>
        Upload Sessions
      </h3>
      <div className="space-y-2">
        {batches.map((batch, idx) => {
          const label = `Screenshot ${idx + 1}`;
          const batchKey = batch.upload_batch ?? 'null';
          const isDeleting = deletingBatchId === batchKey;
          const symbols = batch.symbols
            ? batch.symbols.split(',').slice(0, 4).join(', ') + (batch.symbols.split(',').length > 4 ? '…' : '')
            : '—';
          const uploadedDate = batch.uploaded_at
            ? new Date(batch.uploaded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            : null;

          return (
            <div
              key={batchKey}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px',
                borderRadius: 12,
                backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                border: `1px solid ${theme.border}`,
              }}
            >
              {/* Index badge */}
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: `linear-gradient(135deg, ${theme.accent}30, ${theme.accent}15)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: theme.accent,
              }}>
                {idx + 1}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>{label}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 500,
                    padding: '2px 8px', borderRadius: 20,
                    backgroundColor: `${theme.accent}18`,
                    color: theme.accent,
                  }}>
                    {batch.trade_count} trade{batch.trade_count !== 1 ? 's' : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3 }}>
                  {uploadedDate && (
                    <span style={{ fontSize: 11, color: theme.muted }}>{uploadedDate}</span>
                  )}
                  {symbols !== '—' && (
                    <span style={{ fontSize: 11, color: theme.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {symbols}
                    </span>
                  )}
                </div>
              </div>

              {/* Delete button */}
              <button
                onClick={() => onDeleteBatch(batch, label)}
                disabled={isDeleting}
                title={`Delete ${label}`}
                style={{
                  background: 'none', border: `1px solid rgba(239,68,68,0.25)`,
                  borderRadius: 8, padding: '6px 10px', flexShrink: 0,
                  display: 'flex', alignItems: 'center', gap: 5,
                  color: isDeleting ? theme.muted : 'rgba(239,68,68,0.75)',
                  fontSize: 11, fontWeight: 500,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!isDeleting) { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#ef4444'; }}}
                onMouseLeave={e => { if (!isDeleting) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(239,68,68,0.75)'; }}}
              >
                {isDeleting
                  ? <Loader2 style={{ width: 12, height: 12 }} className="animate-spin" />
                  : <Trash2 style={{ width: 12, height: 12 }} />}
                Delete
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Small inline stat (used in summary bar) ──────────────────────────────
function Pill({ label, value, color }) {
  const theme = useTheme();
  return (
    <div style={{ padding: '7px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <span style={{ fontSize: 10, textTransform: 'uppercase', color: theme.isDark ? '#4a4a4a' : theme.muted, letterSpacing: '0.08em', lineHeight: 1 }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color, lineHeight: 1.3 }}>{value}</span>
    </div>
  );
}

// ── Delete confirmation modal ──────────────────────────────────────────────
function DeleteModal({ modal, onConfirm, onCancel, isDeleting, theme }) {
  if (!modal) return null;

  const isAll   = modal.type === 'all';
  const isBatch = modal.type === 'batch';
  const isTrade = modal.type === 'trade';
  const trade   = modal.trade;
  const profit  = trade?.profit ?? 0;

  const title = isAll   ? 'Delete All Data'
              : isBatch ? `Delete ${modal.label}`
              : 'Delete Trade';

  const body = isAll ? (
    'This will permanently remove all screenshot sessions and every imported trade across all uploads.'
  ) : isBatch ? (
    <>
      All <strong style={{ color: theme.text }}>{modal.batch?.trade_count} trade{modal.batch?.trade_count !== 1 ? 's' : ''}</strong>{' '}
      from <strong style={{ color: theme.text }}>{modal.label}</strong> will be permanently removed.
    </>
  ) : (
    <>
      The <strong style={{ color: theme.text }}>{trade?.symbol}</strong>{' '}
      <span style={{ color: trade?.type === 'BUY' ? '#10b981' : '#ef4444', fontWeight: 600 }}>{trade?.type}</span>{' '}
      trade{' '}
      <span style={{ color: profit >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
        ({profit >= 0 ? '+' : ''}{profit.toFixed(2)})
      </span>
      {' '}will be permanently removed.
    </>
  );

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        animation: 'dmFadeIn 0.15s ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget && !isDeleting) onCancel(); }}
    >
      <div
        style={{
          backgroundColor: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: 20,
          padding: '32px 28px 24px',
          maxWidth: 360, width: '100%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.15)',
          animation: 'dmSlideUp 0.2s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        {/* Icon */}
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: 'rgba(239,68,68,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 18px',
        }}>
          <Trash2 style={{ width: 20, height: 20, color: '#ef4444' }} />
        </div>

        {/* Title */}
        <h3 style={{
          color: theme.text, fontSize: 16, fontWeight: 700,
          textAlign: 'center', margin: '0 0 10px', letterSpacing: '-0.01em',
        }}>
          {title}
        </h3>

        {/* Body */}
        <p style={{
          color: theme.muted, fontSize: 13, textAlign: 'center',
          lineHeight: 1.65, margin: '0 0 16px', padding: '0 4px',
        }}>
          {body}
        </p>

        {/* Warning note */}
        <p style={{
          fontSize: 11.5, textAlign: 'center', margin: '0 0 22px',
          color: 'rgba(239,68,68,0.7)', fontWeight: 500,
          letterSpacing: '0.01em',
        }}>
          This action cannot be undone.
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onCancel}
            disabled={isDeleting}
            style={{
              flex: 1, padding: '10px 16px', borderRadius: 10,
              border: `1px solid ${theme.border}`,
              backgroundColor: 'transparent',
              color: theme.text, fontSize: 13.5, fontWeight: 500,
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
              flex: 1, padding: '10px 16px', borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, #f87171 0%, #ef4444 50%, #dc2626 100%)',
              color: 'white', fontSize: 13.5, fontWeight: 600,
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              opacity: isDeleting ? 0.7 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              boxShadow: '0 2px 12px rgba(239,68,68,0.3)',
              transition: 'opacity 0.15s',
            }}
          >
            {isDeleting
              ? <Loader2 style={{ width: 13, height: 13 }} className="animate-spin" />
              : <Trash2 style={{ width: 13, height: 13 }} />}
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes dmFadeIn  { from { opacity: 0 }                            to { opacity: 1 } }
        @keyframes dmSlideUp { from { opacity: 0; transform: translateY(12px) scale(0.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
      `}</style>
    </div>
  );
}
