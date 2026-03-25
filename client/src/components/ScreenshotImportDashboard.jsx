import { useState, useEffect, useCallback } from 'react';
import {
  Camera, BarChart3, TrendingUp, Brain, ListOrdered,
  RefreshCw, Loader2, WifiOff, Database, Trash2,
  Upload, Target, Activity, Zap,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useTimezone } from '../contexts/TimezoneContext';
import { usePlanGate } from '../hooks/usePlanGate';
import {
  deleteScreenshotReport, deleteScreenshotTrade,
  deleteScreenshotBatch, getScreenshotReport, getScreenshotBatches,
} from '../services/mt5Api';
import ScreenshotUpload      from './ScreenshotUpload';
import MT5PerformanceStats   from './MT5PerformanceStats';
import MT5PerformanceCharts  from './MT5PerformanceCharts';
import MT5AIInsights         from './MT5AIInsights';
import MT5BehaviorInsights   from './MT5BehaviorInsights';
import MT5HeatmapChart       from './MT5HeatmapChart';
import MT5TradeHistory       from './MT5TradeHistory';
import PlanGateBanner        from './PlanGateBanner';
import ProfileModal          from './ProfileModal';

const TABS = [
  { id: 'overview',  label: 'Overview',   Icon: BarChart3   },
  { id: 'charts',    label: 'Charts',     Icon: TrendingUp  },
  { id: 'behavior',  label: 'Behaviour',  Icon: Brain       },
  { id: 'history',   label: 'History',    Icon: ListOrdered },
  { id: 'upload',    label: 'Upload New', Icon: Upload      },
];

const CACHE_KEY = 'screenshot_report_cache';
const loadCache  = () => { try { const r = localStorage.getItem(CACHE_KEY); return r ? JSON.parse(r) : null; } catch { return null; } };
const saveCache  = (d) => { try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ...d, _cachedAt: Date.now() })); } catch {} };
const clearCache = ()  => { try { localStorage.removeItem(CACHE_KEY); } catch {} };

export default function ScreenshotImportDashboard() {
  const theme = useTheme();
  const { formatDateWithTimezone } = useTimezone();
  const { isFree, isPro, isElite, isAdmin, screenshotTriesLeft } = usePlanGate();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const triesExhausted = !isElite && !isAdmin && screenshotTriesLeft <= 0;

  const [data,            setData]            = useState(() => loadCache());
  const [activeTab,       setActiveTab]       = useState(() => loadCache()?.trades?.length > 0 ? 'overview' : 'upload');
  const [loadingInit,     setLoadingInit]     = useState(true);
  const [serviceOnline,   setServiceOnline]   = useState(true);
  const [serviceError,    setServiceError]    = useState(null);
  const [deleting,        setDeleting]        = useState(false);
  const [deletingTradeId, setDeletingTradeId] = useState(null);
  const [confirmModal,    setConfirmModal]    = useState(null);
  const [batches,         setBatches]         = useState([]);
  const [deletingBatchId, setDeletingBatchId] = useState(null);

  const loadExisting = useCallback(async () => {
    setLoadingInit(true);
    setServiceOnline(true);
    setServiceError(null);
    try {
      const result = await getScreenshotReport();
      if (result.success && result.trades?.length > 0) {
        setData(result);
        saveCache(result);
        setActiveTab(prev => prev === 'upload' ? 'overview' : prev);
      } else if (!loadCache()?.trades?.length) {
        setActiveTab('upload');
      }
      setServiceOnline(true);
      try {
        const batchRes = await getScreenshotBatches();
        if (batchRes.success) setBatches(batchRes.batches ?? []);
      } catch {}
    } catch (err) {
      setServiceOnline(false);
      const status = err?.response?.status;
      setServiceError(status === 401
        ? 'Your session has expired. Please sign out and sign back in.'
        : 'The analysis service is temporarily unavailable. Please try again in a moment.'
      );
    } finally {
      setLoadingInit(false);
    }
  }, []);

  useEffect(() => { loadExisting(); }, [loadExisting]);

  const handleUploaded = (result) => {
    setData(result); saveCache(result);
    setServiceOnline(true); setServiceError(null);
    setActiveTab('overview');
  };

  const handleConfirmDelete = async () => {
    if (!confirmModal) return;
    if (confirmModal.type === 'all') {
      setDeleting(true);
      try {
        await deleteScreenshotReport();
        clearCache(); setData(null); setActiveTab('upload');
        setServiceOnline(true); setServiceError(null);
      } catch (err) {
        setServiceError(err?.response?.status === 401
          ? 'Your session has expired.'
          : 'Failed to delete. Please try again.');
      } finally { setDeleting(false); setConfirmModal(null); }
    } else if (confirmModal.type === 'trade') {
      setDeletingTradeId(confirmModal.trade.id);
      try { await deleteScreenshotTrade(confirmModal.trade.id); await loadExisting(); }
      catch (err) { setServiceError('Failed to delete trade.'); }
      finally { setDeletingTradeId(null); setConfirmModal(null); }
    } else if (confirmModal.type === 'batch') {
      const batchId = confirmModal.batch.upload_batch;
      setDeletingBatchId(batchId ?? 'null');
      try { await deleteScreenshotBatch(batchId); await loadExisting(); }
      catch (err) { setServiceError('Failed to delete upload.'); }
      finally { setDeletingBatchId(null); setConfirmModal(null); }
    }
  };

  const analysis  = data?.analysis   ?? null;
  const behavior  = data?.behavior   ?? null;
  const aiSummary = data?.ai_summary ?? null;
  const trades    = data?.trades     ?? [];
  const heatmap   = analysis?.heatmap ?? [];
  const hasData   = trades.length > 0;
  const cachedAt  = data?._cachedAt  ?? null;

  // ── Design tokens ─────────────────────────────────────────────────────
  const D = {
    pageBg:  theme.isDark ? theme.bg        : '#f1f3f6',
    cardBg:  theme.isDark ? theme.surface    : '#ffffff',
    cardBg2: theme.isDark ? theme.surface2   : '#f7f8fa',
    border:  theme.isDark ? theme.border     : '#e5e8ed',
    border2: theme.isDark ? 'rgba(255,255,255,0.10)' : '#d0d5de',
    text:    theme.isDark ? theme.text      : '#0d1117',
    textSub: theme.isDark ? '#8892a4'       : '#5a6472',
    accent:  '#3b82f6',
    red:     '#ef4444',
    gold:    theme.isDark ? '#f59e0b' : '#d97706',
  };

  if (loadingInit && !hasData) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: D.pageBg, gap: 10 }}>
      <div style={{ width: 24, height: 24, border: `2px solid ${D.accent}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ fontSize: 13, color: D.textSub }}>Loading trade data…</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: D.pageBg, overflow: 'hidden' }}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px) scale(0.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
        .tab-btn { transition: all 0.15s ease; }
        .tab-btn:hover { opacity: 0.8; }
      `}</style>

      {/* ── Delete modal ────────────────────────────────────────────────── */}
      <DeleteModal
        modal={confirmModal}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmModal(null)}
        isDeleting={deleting || deletingTradeId !== null}
        D={D}
      />

      {showUpgradeModal && <ProfileModal onClose={() => setShowUpgradeModal(false)} />}

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{
        background: D.cardBg,
        borderBottom: `1px solid ${D.border}`,
        padding: '18px 24px 0',
        flexShrink: 0,
      }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          {/* Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: `${D.accent}15`, border: `1px solid ${D.accent}28`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Camera style={{ width: 18, height: 18, color: D.accent }} />
            </div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: D.text, margin: 0, letterSpacing: '-0.02em' }}>
                Screenshot Analysis
              </h1>
              <p style={{ fontSize: 12, color: D.textSub, margin: '2px 0 0' }}>
                {hasData
                  ? `${trades.length} trade${trades.length !== 1 ? 's' : ''} · AI-powered chart analysis`
                  : 'Upload MT4/MT5 screenshots for AI analysis'}
              </p>
            </div>
          </div>

          {/* Stats + actions */}
          {hasData && analysis && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {/* Stat pills */}
              <div style={{
                display: 'flex', alignItems: 'stretch',
                background: D.cardBg2, border: `1px solid ${D.border}`,
                borderRadius: 10, overflow: 'hidden',
              }}>
                {[
                  { label: 'Win Rate', value: `${analysis.win_rate ?? 0}%`, color: (analysis.win_rate ?? 0) >= 50 ? D.accent : D.red },
                  { label: 'Total P&L', value: `${(analysis.total_profit ?? 0) >= 0 ? '+' : ''}$${Math.abs(analysis.total_profit ?? 0).toFixed(2)}`, color: (analysis.total_profit ?? 0) >= 0 ? D.accent : D.red },
                  ...(analysis.profit_factor != null ? [{ label: 'Prof. Factor', value: analysis.profit_factor, color: analysis.profit_factor >= 1.5 ? D.accent : analysis.profit_factor >= 1 ? D.gold : D.red }] : []),
                ].map((s, i, arr) => (
                  <div key={s.label} style={{
                    padding: '8px 14px', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 2,
                    borderRight: i < arr.length - 1 ? `1px solid ${D.border}` : 'none',
                  }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: D.textSub, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: s.color, letterSpacing: '-0.01em' }}>{s.value}</span>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <button onClick={loadExisting} style={{ width: 34, height: 34, borderRadius: 8, background: D.cardBg2, border: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: D.textSub, transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = D.accent; e.currentTarget.style.color = D.accent; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = D.border; e.currentTarget.style.color = D.textSub; }}
                title="Refresh">
                <RefreshCw style={{ width: 14, height: 14 }} />
              </button>
              <button onClick={() => setConfirmModal({ type: 'all' })} disabled={deleting} style={{ width: 34, height: 34, borderRadius: 8, background: D.cardBg2, border: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: deleting ? 'not-allowed' : 'pointer', color: D.red, opacity: deleting ? 0.5 : 1, transition: 'all 0.15s' }}
                onMouseEnter={e => { if (!deleting) { e.currentTarget.style.borderColor = D.red; e.currentTarget.style.background = `${D.red}10`; } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = D.border; e.currentTarget.style.background = D.cardBg2; }}
                title="Delete all data">
                {deleting ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 0.8s linear infinite' }} /> : <Trash2 style={{ width: 14, height: 14 }} />}
              </button>
            </div>
          )}
        </div>

        {/* Tab bar */}
        {hasData && (
          <div style={{ display: 'flex', gap: 2, overflowX: 'auto', paddingBottom: 0 }}>
            {TABS.map(({ id, label, Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className="tab-btn"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px', fontSize: 12, fontWeight: 600,
                    border: 'none', borderRadius: 0, cursor: 'pointer',
                    background: 'transparent', flexShrink: 0,
                    color: active ? D.accent : D.textSub,
                    borderBottom: `2px solid ${active ? D.accent : 'transparent'}`,
                    transition: 'all 0.15s',
                  }}
                >
                  <Icon style={{ width: 13, height: 13 }} />
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Plan gate ───────────────────────────────────────────────────── */}
      {triesExhausted ? (
        <div style={{ margin: '24px', padding: 28, borderRadius: 14, background: `${D.red}08`, border: `1px solid ${D.red}25`, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: `${D.red}10`, border: `1px solid ${D.red}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Camera style={{ color: D.red, width: 22, height: 22 }} />
          </div>
          <p style={{ color: D.text, fontWeight: 700, fontSize: 17, margin: 0 }}>Screenshot Analysis Limit Reached</p>
          <p style={{ color: D.textSub, fontSize: 14, maxWidth: 380, margin: 0, lineHeight: 1.6 }}>
            {isFree
              ? 'You have used your 2 lifetime free analyses. Upgrade to Pro for 35 analyses per month.'
              : 'You have used all 35 Pro analyses this month. Upgrade to Elite for unlimited analyses.'}
          </p>
          <button onClick={() => setShowUpgradeModal(true)} style={{ background: D.accent, color: '#fff', border: 'none', borderRadius: 10, padding: '11px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 14px ${D.accent}40` }}>
            {isFree ? 'Upgrade to Pro — $1.99/mo' : 'Upgrade to Elite — $4.99/mo'}
          </button>
        </div>
      ) : !isElite && !isAdmin && (
        <div style={{ margin: '16px 24px 0' }}>
          <PlanGateBanner
            feature="Screenshot Analysis"
            requiredPlan={isFree ? 'Pro' : 'Elite'}
            description={isPro
              ? `${screenshotTriesLeft} of 35 pro analyses remaining this month`
              : `${screenshotTriesLeft} of 2 free lifetime ${screenshotTriesLeft === 1 ? 'analysis' : 'analyses'} remaining`}
            onUpgradeClick={() => setShowUpgradeModal(true)}
          />
        </div>
      )}

      {/* ── Offline banner ───────────────────────────────────────────────── */}
      {!serviceOnline && !hasData && (
        <div style={{ margin: '16px 24px 0', padding: '14px 16px', borderRadius: 10, background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.25)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <WifiOff style={{ width: 16, height: 16, color: '#eab308', flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#eab308', margin: '0 0 3px' }}>Analysis Service Unavailable</p>
            <p style={{ fontSize: 12, color: D.textSub, margin: 0 }}>{serviceError}</p>
            {hasData && cachedAt && (
              <p style={{ fontSize: 11, color: D.textSub, margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Database style={{ width: 11, height: 11 }} />
                Cached {formatDateWithTimezone(new Date(cachedAt), 'MMM dd, yyyy HH:mm')}
              </p>
            )}
          </div>
          <button onClick={loadExisting} disabled={loadingInit} style={{ padding: '6px 12px', borderRadius: 7, background: 'rgba(234,179,8,0.15)', color: '#eab308', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            {loadingInit ? <Loader2 style={{ width: 12, height: 12, animation: 'spin 0.8s linear infinite' }} /> : <RefreshCw style={{ width: 12, height: 12 }} />}
            Retry
          </button>
        </div>
      )}

      {/* ── Tab content ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

        {/* Upload tab / no data */}
        {(!hasData || activeTab === 'upload') && !triesExhausted && (
          <ScreenshotUpload onUploaded={handleUploaded} />
        )}

        {/* Overview */}
        {hasData && activeTab === 'overview' && analysis && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <MT5PerformanceStats analysis={analysis} />
            <MT5AIInsights aiSummary={aiSummary} />
          </div>
        )}

        {/* Charts */}
        {hasData && activeTab === 'charts' && analysis && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <MT5PerformanceCharts analysis={analysis} trades={trades} />
            {(heatmap.length > 0 || trades.length > 0) && <MT5HeatmapChart heatmap={heatmap} trades={trades} />}
          </div>
        )}

        {/* Behaviour */}
        {hasData && activeTab === 'behavior' && (
          <MT5BehaviorInsights behavior={behavior} aiSummary={aiSummary} />
        )}

        {/* History */}
        {hasData && activeTab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <ScreenshotBatchList
              batches={batches}
              onDeleteBatch={(batch, label) => setConfirmModal({ type: 'batch', batch, label })}
              deletingBatchId={deletingBatchId}
              D={D}
            />
            <MT5TradeHistory
              trades={trades}
              onDeleteTrade={(trade) => setConfirmModal({ type: 'trade', trade })}
              deletingTradeId={deletingTradeId}
            />
          </div>
        )}

        {/* Empty upload state when has data but on upload tab */}
        {hasData && activeTab === 'upload' && triesExhausted && null}
      </div>
    </div>
  );
}

// ── Batch list ────────────────────────────────────────────────────────────────
function ScreenshotBatchList({ batches, onDeleteBatch, deletingBatchId, D }) {
  if (!batches?.length) return null;
  return (
    <div>
      <h3 style={{ fontSize: 11, fontWeight: 700, color: D.textSub, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 12px' }}>
        Upload Sessions
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {batches.map((batch, idx) => {
          const label    = `Screenshot ${idx + 1}`;
          const batchKey = batch.upload_batch ?? 'null';
          const isDeleting = deletingBatchId === batchKey;
          const symbols  = batch.symbols ? batch.symbols.split(',').slice(0, 4).join(', ') + (batch.symbols.split(',').length > 4 ? '…' : '') : '—';
          const date     = batch.uploaded_at ? new Date(batch.uploaded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null;
          return (
            <div key={batchKey} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, background: D.cardBg, border: `1px solid ${D.border}` }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: `${D.accent}15`, border: `1px solid ${D.accent}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: D.accent }}>
                {idx + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: D.text }}>{label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: `${D.accent}15`, color: D.accent }}>{batch.trade_count} trade{batch.trade_count !== 1 ? 's' : ''}</span>
                </div>
                <div style={{ fontSize: 11, color: D.textSub, marginTop: 3 }}>
                  {date && <span>{date}</span>}
                  {symbols !== '—' && <span style={{ marginLeft: 8 }}>{symbols}</span>}
                </div>
              </div>
              <button onClick={() => onDeleteBatch(batch, label)} disabled={isDeleting} style={{ padding: '6px 12px', borderRadius: 7, background: 'none', border: `1px solid ${D.red}30`, color: isDeleting ? D.textSub : D.red, fontSize: 11, fontWeight: 600, cursor: isDeleting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s' }}
                onMouseEnter={e => { if (!isDeleting) e.currentTarget.style.background = `${D.red}10`; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
              >
                {isDeleting ? <Loader2 style={{ width: 11, height: 11, animation: 'spin 0.8s linear infinite' }} /> : <Trash2 style={{ width: 11, height: 11 }} />}
                Delete
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Delete modal ──────────────────────────────────────────────────────────────
function DeleteModal({ modal, onConfirm, onCancel, isDeleting, D }) {
  if (!modal) return null;
  const isAll   = modal.type === 'all';
  const isBatch = modal.type === 'batch';
  const trade   = modal.trade;
  const profit  = trade?.profit ?? 0;

  const title = isAll ? 'Delete All Data' : isBatch ? `Delete ${modal.label}` : 'Delete Trade';
  const body  = isAll
    ? 'This will permanently remove all screenshot sessions and every imported trade.'
    : isBatch
    ? `All ${modal.batch?.trade_count} trade${modal.batch?.trade_count !== 1 ? 's' : ''} from ${modal.label} will be permanently removed.`
    : `The ${trade?.symbol} ${trade?.type} trade (${profit >= 0 ? '+' : ''}${profit.toFixed(2)}) will be permanently removed.`;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(8px)', animation: 'fadeIn 0.15s ease' }}
      onClick={e => { if (e.target === e.currentTarget && !isDeleting) onCancel(); }}>
      <div style={{ background: D.cardBg, border: `1px solid ${D.border}`, borderRadius: 16, padding: '28px 24px', maxWidth: 360, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.4)', animation: 'slideUp 0.2s cubic-bezier(0.22,1,0.36,1)' }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: `${D.red}12`, border: `1px solid ${D.red}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Trash2 style={{ width: 20, height: 20, color: D.red }} />
        </div>
        <h3 style={{ color: D.text, fontSize: 16, fontWeight: 700, textAlign: 'center', margin: '0 0 8px', letterSpacing: '-0.01em' }}>{title}</h3>
        <p style={{ color: D.textSub, fontSize: 13, textAlign: 'center', lineHeight: 1.7, margin: '0 0 8px' }}>{body}</p>
        <p style={{ fontSize: 11, textAlign: 'center', color: `${D.red}90`, fontWeight: 600, margin: '0 0 20px' }}>This action cannot be undone.</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} disabled={isDeleting} style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${D.border}`, background: 'transparent', color: D.text, fontSize: 13, fontWeight: 600, cursor: isDeleting ? 'not-allowed' : 'pointer', opacity: isDeleting ? 0.4 : 1 }}>Cancel</button>
          <button onClick={onConfirm} disabled={isDeleting} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: D.red, color: '#fff', fontSize: 13, fontWeight: 700, cursor: isDeleting ? 'not-allowed' : 'pointer', opacity: isDeleting ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: `0 4px 14px ${D.red}35` }}>
            {isDeleting ? <Loader2 style={{ width: 13, height: 13, animation: 'spin 0.8s linear infinite' }} /> : <Trash2 style={{ width: 13, height: 13 }} />}
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

