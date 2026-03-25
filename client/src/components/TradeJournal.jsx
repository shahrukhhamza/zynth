import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, List, BarChart2, Brain, X, RefreshCw, Activity, Fingerprint, TrendingUp, TrendingDown, ArrowRightLeft, Target, Shield, Clock, Layers, Zap, MessageSquare, Lightbulb, StickyNote, Camera, Sparkles, ChevronRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { resolveMediaUrl } from '../utils/mediaUrl';
import { listTrades, getAnalytics } from '../services/journalApi';
import TradeEntryForm from './journal/TradeEntryForm';
import TradeHistoryTable from './journal/TradeHistoryTable';
import PerformanceDashboard from './journal/PerformanceDashboard';
import AiInsightsPanel from './journal/AiInsightsPanel';
import MacroCorrelation from './MacroCorrelation';
import TradingDNA from './TradingDNA';
import TradeDetailPage from './journal/TradeDetailPage';

const TABS = [
  { key: 'log',         label: 'Log Trade',          icon: BookOpen  },
  { key: 'history',     label: 'Trade History',       icon: List      },
  { key: 'performance', label: 'Performance',         icon: BarChart2 },
  { key: 'insights',    label: 'AI Insights',         icon: Brain     },
  { key: 'macro',       label: 'Macro Correlation',   icon: Activity     },
  { key: 'dna',         label: 'Trading DNA',          icon: Fingerprint  },
];

function TradeDetailModal({ trade, onClose }) {
  const theme = useTheme();
  if (!trade) return null;
  let aiData = null;
  try { aiData = trade.ai_analysis ? (typeof trade.ai_analysis === 'string' ? JSON.parse(trade.ai_analysis) : trade.ai_analysis) : null; } catch {}

  const pnl = parseFloat(trade.profit_loss);
  const isWin = trade.outcome === 'win';
  const isLoss = trade.outcome === 'loss';
  const isBuy = (trade.direction || '').toLowerCase() === 'buy';

  const outcomeColor = isWin ? '#22c55e' : isLoss ? '#ef4444' : '#f59e0b';
  const outcomeGradient = isWin
    ? 'linear-gradient(135deg, #052e16 0%, #14532d 50%, #166534 100%)'
    : isLoss
    ? 'linear-gradient(135deg, #2d0a0a 0%, #4c1414 50%, #7f1d1d 100%)'
    : 'linear-gradient(135deg, #1c1506 0%, #451a03 50%, #78350f 100%)';

  const SectionLabel = ({ icon: Icon, label }) => (
    <div className="flex items-center gap-2 mb-3">
      <div className="p-1.5 rounded-md" style={{ backgroundColor: `${theme.accent}20` }}>
        <Icon className="w-3.5 h-3.5" style={{ color: theme.accent }} />
      </div>
      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: theme.muted }}>{label}</span>
    </div>
  );

  const StatCard = ({ label, value, color, sub }) => (
    <div className="rounded-xl p-3 flex flex-col gap-1" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}33` }}>
      <span className="text-xs uppercase tracking-wide font-medium" style={{ color: theme.muted }}>{label}</span>
      <span className="text-sm font-bold leading-tight" style={{ color: color || theme.text }}>{value || '—'}</span>
      {sub && <span className="text-xs" style={{ color: theme.muted }}>{sub}</span>}
    </div>
  );

  const TextBlock = ({ icon: Icon, label, value, accentColor }) => (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${theme.border}33` }}>
      <div className="flex items-center gap-2 px-4 py-2.5" style={{ backgroundColor: `${accentColor || theme.accent}12`, borderBottom: `1px solid ${theme.border}22` }}>
        <Icon className="w-3.5 h-3.5" style={{ color: accentColor || theme.accent }} />
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accentColor || theme.accent }}>{label}</span>
      </div>
      <p className="px-4 py-3 text-sm leading-relaxed" style={{ color: theme.text, backgroundColor: theme.surface }}>{value}</p>
    </div>
  );

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 9999, backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl flex flex-col"
        style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}55` }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Hero Header ── */}
        <div className="relative overflow-hidden rounded-t-2xl flex-shrink-0" style={{ background: outcomeGradient, minHeight: '140px' }}>
          {/* decorative circles */}
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-10" style={{ background: outcomeColor }} />
          <div className="absolute -bottom-10 -left-6 w-28 h-28 rounded-full opacity-10" style={{ background: outcomeColor }} />

          {/* close btn */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-xl transition-all"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
          >
            <X className="w-4 h-4" />
          </button>

          <div className="relative p-5 pb-4">
            {/* Pair + outcome badge */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl font-black tracking-tight text-white">{trade.pair}</span>
              <span
                className="px-2.5 py-1 rounded-lg text-xs font-black tracking-widest uppercase"
                style={{ backgroundColor: `${outcomeColor}33`, color: outcomeColor, border: `1px solid ${outcomeColor}55` }}
              >
                {(trade.outcome || 'N/A').toUpperCase()}
              </span>
              <span
                className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase flex items-center gap-1"
                style={{ backgroundColor: isBuy ? '#22c55e22' : '#ef444422', color: isBuy ? '#22c55e' : '#ef4444', border: `1px solid ${isBuy ? '#22c55e' : '#ef4444'}44` }}
              >
                {isBuy ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {(trade.direction || '').toUpperCase()}
              </span>
            </div>

            {/* P&L hero number */}
            <div className="flex items-end gap-3">
              <div>
                <p className="text-xs uppercase tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Profit / Loss</p>
                <p className="text-4xl font-black" style={{ color: outcomeColor, textShadow: `0 0 30px ${outcomeColor}55` }}>
                  {isNaN(pnl) ? '—' : `${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}`}
                </p>
              </div>
              <div className="mb-1 px-3 py-1 rounded-lg text-xs font-semibold" style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
                {trade.created_at?.slice(0, 10) || '—'}
              </div>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="p-5 space-y-5">

          {/* Trade Stats Grid */}
          <div>
            <SectionLabel icon={BarChart2} label="Trade Details" />
            <div className="grid grid-cols-2 gap-2.5">
              <StatCard
                label="Entry → Exit"
                value={trade.entry_price && trade.exit_price ? `${trade.entry_price} → ${trade.exit_price}` : '—'}
                color={theme.text}
              />
              <StatCard
                label="Position Size"
                value={trade.position_size ? `${trade.position_size} lots` : '—'}
                color={theme.accent}
              />
              <StatCard
                label="Take Profit"
                value={trade.tp || '—'}
                color="#22c55e"
              />
              <StatCard
                label="Stop Loss"
                value={trade.sl || '—'}
                color="#ef4444"
              />
            </div>
          </div>

          {/* Context Grid */}
          <div>
            <SectionLabel icon={Layers} label="Context" />
            <div className="grid grid-cols-3 gap-2.5">
              <StatCard label="Session" value={trade.session ? trade.session.replace('_', ' ').toUpperCase() : '—'} />
              <StatCard label="Strategy" value={trade.strategy || '—'} color={theme.accent} />
              <StatCard label="Emotion" value={trade.emotional_state ? trade.emotional_state.charAt(0).toUpperCase() + trade.emotional_state.slice(1) : '—'} color="#0ea5e9" />
            </div>
          </div>

          {/* Text Blocks */}
          {(trade.reasoning || trade.lessons_learned || trade.notes) && (
            <div className="space-y-3">
              <SectionLabel icon={MessageSquare} label="Trade Notes" />
              {trade.reasoning && (
                <TextBlock icon={MessageSquare} label="Reasoning" value={trade.reasoning} accentColor={theme.accent} />
              )}
              {trade.lessons_learned && (
                <TextBlock icon={Lightbulb} label="Lessons Learned" value={trade.lessons_learned} accentColor="#f59e0b" />
              )}
              {trade.notes && (
                <TextBlock icon={StickyNote} label="Notes / Remarks" value={trade.notes} accentColor="#0ea5e9" />
              )}
            </div>
          )}

          {/* Screenshot */}
          {trade.screenshot_path && (
            <div>
              <SectionLabel icon={Camera} label="Chart Screenshot" />
              <a
                href={resolveMediaUrl(trade.screenshot_path)}
                target="_blank"
                rel="noreferrer"
                className="block rounded-xl overflow-hidden group relative"
                style={{ border: `1px solid ${theme.border}44` }}
              >
                <img
                  src={resolveMediaUrl(trade.screenshot_path)}
                  alt="Trade chart"
                  className="w-full object-cover"
                  style={{ maxHeight: '280px', backgroundColor: theme.surface }}
                  onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
                <div style={{ display: 'none', color: theme.muted }} className="items-center justify-center h-20 text-xs">
                  Screenshot unavailable
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
                  <span className="text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5" style={{ backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)' }}>
                    <Camera className="w-3.5 h-3.5" /> View Full Size
                  </span>
                </div>
              </a>
            </div>
          )}

          {/* AI Analysis */}
          {aiData && (
            <div>
              <SectionLabel icon={Sparkles} label="AI Analysis" />
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #0ea5e933', background: 'linear-gradient(135deg, #0a0a0a 0%, #050505 100%)' }}>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {aiData.psychology_score != null && (
                      <div className="rounded-lg p-3 text-center" style={{ backgroundColor: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)' }}>
                        <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'rgba(14,165,233,0.6)' }}>Psychology</p>
                        <p className="text-2xl font-black" style={{ color: '#0ea5e9' }}>{aiData.psychology_score}<span className="text-sm font-normal">/10</span></p>
                      </div>
                    )}
                    {aiData.trade_quality && (
                      <div className="rounded-lg p-3 text-center" style={{ backgroundColor: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)' }}>
                        <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'rgba(14,165,233,0.6)' }}>Quality</p>
                        <p className="text-base font-bold capitalize" style={{ color: '#0ea5e9' }}>{aiData.trade_quality}</p>
                      </div>
                    )}
                  </div>
                  {aiData.coach_message && (
                    <div className="flex gap-3 p-3 rounded-lg" style={{ backgroundColor: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.15)' }}>
                      <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#0ea5e9' }} />
                      <p className="text-sm italic leading-relaxed" style={{ color: 'rgba(14,165,233,0.9)' }}>"{aiData.coach_message}"</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Footer timestamp */}
          <div className="flex items-center justify-between pt-1 pb-1">
            <span className="text-xs flex items-center gap-1.5" style={{ color: theme.muted }}>
              <Clock className="w-3 h-3" />
              {trade.created_at?.slice(0, 19)?.replace('T', ' ') || '—'}
            </span>
            <button
              onClick={onClose}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
              style={{ backgroundColor: theme.surface, color: theme.muted, border: `1px solid ${theme.border}44` }}
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}

export default function TradeJournal() {
  const theme = useTheme();
  const [tab, setTab] = useState('log');
  const [trades, setTrades] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [metrics, setMetrics] = useState(null);
  const [loadingTrades, setLoadingTrades] = useState(false);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const LIMIT = 20;

  const fetchTrades = useCallback(async (p = page) => {
    setLoadingTrades(true);
    try {
      const res = await listTrades(p, LIMIT);
      setTrades(res.trades || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to load trades:', err);
    } finally {
      setLoadingTrades(false);
    }
  }, [page]);

  const fetchMetrics = useCallback(async () => {
    setLoadingMetrics(true);
    try {
      const m = await getAnalytics();
      setMetrics(m);
    } catch (err) {
      console.error('Failed to load metrics:', err);
    } finally {
      setLoadingMetrics(false);
    }
  }, []);

  useEffect(() => {
    fetchTrades(page);
  }, [page]);

  useEffect(() => {
    if (tab === 'performance' || tab === 'insights') {
      fetchMetrics();
      if (tab === 'insights') fetchTrades(0);
    } else if (tab === 'history') {
      fetchTrades(page);
    }
  }, [tab]);

  const handleSaved = () => {
    setTab('history');
    fetchTrades(0);
    setPage(0);
    // refresh metrics too
    fetchMetrics();
  };

  const handleAnalyze = (tradeId, analysis) => {
    setTrades(prev => prev.map(t => t.id === tradeId ? { ...t, ai_analysis: JSON.stringify(analysis) } : t));
  };

  const handlePageChange = (p) => {
    setPage(p);
    fetchTrades(p);
  };

  const tabBar = (
    <div className="flex gap-1 mb-6 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      {TABS.map(({ key, label, icon: Icon }) => {
        const active = tab === key;
        return (
          <button key={key} onClick={() => setTab(key)}
            className="flex items-center gap-2 transition-all whitespace-nowrap flex-shrink-0"
            style={{
              padding: '7px 14px',
              borderRadius: 7,
              fontSize: '13px',
              backgroundColor: active ? theme.surface2 : 'transparent',
              color: active ? theme.text : theme.muted,
              fontWeight: active ? 500 : 400,
              border: 'none',
              outline: 'none',
            }}>
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );

  const refreshBtn = (
    <button onClick={() => { fetchTrades(page); fetchMetrics(); }}
      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors hover:bg-gray-100 dark:hover:bg-white/10 mb-4"
      style={{ color: theme.muted, border: `1px solid ${theme.border}` }}>
      <RefreshCw className={`w-3 h-3 ${loadingTrades || loadingMetrics ? 'animate-spin' : ''}`} />
      Refresh
    </button>
  );

  // ── If a trade is selected, show the full-page detail view ──
  if (selectedTrade) {
    const selectedIdx = trades.findIndex(t => t.id === selectedTrade.id);
    return (
      <TradeDetailPage
        trade={selectedTrade}
        trades={trades}
        tradeIndex={selectedIdx === -1 ? 0 : selectedIdx}
        onBack={() => setSelectedTrade(null)}
        onNavigate={(idx) => setSelectedTrade(trades[idx])}
        onSaved={async (tradeId) => {
          const res = await listTrades(0, 200);
          const allTrades = res.trades || [];
          setTrades(allTrades);
          setTotal(res.total || 0);
          fetchMetrics();
          const updated = allTrades.find(t => t.id === tradeId);
          if (updated) setSelectedTrade(updated);
        }}
      />
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header + tabs — constrained width */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: theme.text }}>
              <Brain className="w-5 h-5" style={{ color: theme.accent }} />
              AI Trading Journal
            </h1>
            <p className="text-xs mt-0.5" style={{ color: theme.muted }}>
              {total} trade{total !== 1 ? 's' : ''} logged
              {metrics?.winRate != null ? ` · ${metrics.winRate}% win rate` : ''}
              {metrics?.netPnl != null ? ` · Net P&L: ${metrics.netPnl >= 0 ? '+' : ''}${metrics.netPnl}` : ''}
            </p>
          </div>
        </div>

        {tabBar}
      </div>

      {tab === 'log' && (
        <div className="max-w-xl mx-auto mt-0">
          <TradeEntryForm onSaved={handleSaved} />
        </div>
      )}

      {/* History tab — full screen width, no max-width constraint */}
      {tab === 'history' && (
        <div className="mt-0">
          <div className="max-w-6xl mx-auto">{refreshBtn}</div>
          <TradeHistoryTable
            trades={trades}
            total={total}
            page={page}
            limit={LIMIT}
            onPageChange={handlePageChange}
            onDeleted={() => { fetchTrades(0); setPage(0); fetchMetrics(); }}
            onAnalyze={handleAnalyze}
            onView={setSelectedTrade}
          />
        </div>
      )}

      {tab === 'performance' && (
        <div className="max-w-6xl mx-auto">
          {refreshBtn}
          {loadingMetrics ? (
            <div className="text-center py-16" style={{ color: theme.muted }}>
              <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin opacity-50" />
              <p>Loading analytics…</p>
            </div>
          ) : (
            <PerformanceDashboard metrics={metrics} />
          )}
        </div>
      )}

      {tab === 'insights' && (
        <div className="max-w-6xl mx-auto">
          {refreshBtn}
          <AiInsightsPanel
            trades={trades}
            metrics={metrics}
            onReportGenerated={() => {}}
          />
        </div>
      )}

      {tab === 'macro' && (
        <div className="max-w-6xl mx-auto">
          <MacroCorrelation />
        </div>
      )}

      {tab === 'dna' && (
        <div className="max-w-6xl mx-auto">
          <TradingDNA />
        </div>
      )}

    </div>
  );
}
