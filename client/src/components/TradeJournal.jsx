import { useState, useEffect, useCallback } from 'react';
import { BookOpen, List, BarChart2, Brain, X, RefreshCw } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { listTrades, getAnalytics } from '../services/journalApi';
import TradeEntryForm from './journal/TradeEntryForm';
import TradeHistoryTable from './journal/TradeHistoryTable';
import PerformanceDashboard from './journal/PerformanceDashboard';
import AiInsightsPanel from './journal/AiInsightsPanel';

const TABS = [
  { key: 'log',         label: 'Log Trade',     icon: BookOpen },
  { key: 'history',     label: 'Trade History', icon: List },
  { key: 'performance', label: 'Performance',   icon: BarChart2 },
  { key: 'insights',    label: 'AI Insights',   icon: Brain },
];

function TradeDetailModal({ trade, onClose }) {
  const theme = useTheme();
  if (!trade) return null;
  let aiData = null;
  try { aiData = trade.ai_analysis ? (typeof trade.ai_analysis === 'string' ? JSON.parse(trade.ai_analysis) : trade.ai_analysis) : null; } catch {}

  const row = (label, value, color) => (
    <div className="flex justify-between items-start py-2" style={{ borderBottom: `1px solid ${theme.border}22` }}>
      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: theme.muted }}>{label}</span>
      <span className="text-sm text-right max-w-xs" style={{ color: color || theme.text }}>{value || '—'}</span>
    </div>
  );

  const pnl = parseFloat(trade.profit_loss);
  const outcomeColors = { win: '#22c55e', loss: '#ef4444', breakeven: '#f59e0b' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
        style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}` }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4" style={{ borderBottom: `1px solid ${theme.border}` }}>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold" style={{ color: theme.accent }}>{trade.pair}</span>
            <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ backgroundColor: `${outcomeColors[trade.outcome] || '#888'}22`, color: outcomeColors[trade.outcome] || '#888' }}>
              {(trade.outcome || 'N/A').toUpperCase()}
            </span>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10" style={{ color: theme.muted }}><X className="w-4 h-4" /></button>
        </div>

        <div className="p-4 space-y-1">
          {row('Direction', (trade.direction || '').toUpperCase(), trade.direction === 'buy' ? '#22c55e' : '#ef4444')}
          {row('P&L', isNaN(pnl) ? '—' : `${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}`, pnl >= 0 ? '#22c55e' : '#ef4444')}
          {row('Position Size', trade.position_size)}
          {row('Entry / Exit', trade.entry_price && trade.exit_price ? `${trade.entry_price} → ${trade.exit_price}` : null)}
          {row('TP / SL', trade.tp && trade.sl ? `${trade.tp} / ${trade.sl}` : null)}
          {row('Session', trade.session)}
          {row('Strategy', trade.strategy)}
          {row('Emotional State', trade.emotional_state)}
          {row('Date', trade.created_at?.slice(0, 19)?.replace('T', ' '))}
        </div>

        {(trade.reasoning || trade.lessons_learned || trade.notes) && (
          <div className="px-4 pb-4 space-y-3">
            {trade.reasoning && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: theme.muted }}>Reasoning</p>
                <p className="text-sm p-3 rounded-lg" style={{ backgroundColor: theme.surface, color: theme.text }}>{trade.reasoning}</p>
              </div>
            )}
            {trade.lessons_learned && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: theme.muted }}>Lessons Learned</p>
                <p className="text-sm p-3 rounded-lg" style={{ backgroundColor: theme.surface, color: theme.text }}>{trade.lessons_learned}</p>
              </div>
            )}
          </div>
        )}

        {trade.screenshot_path && (
          <div className="px-4 pb-4">
            <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: theme.muted }}>Screenshot</p>
            <img src={`/${trade.screenshot_path}`} alt="Trade" className="rounded-lg w-full object-contain max-h-64"
              style={{ backgroundColor: theme.surface }} />
          </div>
        )}

        {aiData && (
          <div className="px-4 pb-4">
            <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: theme.muted }}>AI Analysis</p>
            <div className="p-3 rounded-lg space-y-2" style={{ backgroundColor: '#a78bfa11', border: '1px solid #a78bfa33' }}>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span style={{ color: theme.muted }}>Psychology: </span><span style={{ color: '#a78bfa' }}>{aiData.psychology_score}/10</span></div>
                <div><span style={{ color: theme.muted }}>Quality: </span><span style={{ color: '#a78bfa' }}>{aiData.trade_quality}</span></div>
              </div>
              {aiData.coach_message && <p className="text-xs italic" style={{ color: '#a78bfa' }}>" {aiData.coach_message} "</p>}
            </div>
          </div>
        )}
      </div>
    </div>
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
    <div className="flex gap-1 p-1 rounded-xl mb-6 overflow-x-auto"
      style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
      {TABS.map(({ key, label, icon: Icon }) => (
        <button key={key} onClick={() => setTab(key)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap flex-1 justify-center"
          style={{
            backgroundColor: tab === key ? theme.accent : 'transparent',
            color: tab === key ? '#fff' : theme.muted,
          }}>
          <Icon className="w-4 h-4" />
          {label}
        </button>
      ))}
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

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
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

      {tab === 'log' && (
        <div className="max-w-xl mx-auto">
          <TradeEntryForm onSaved={handleSaved} />
        </div>
      )}

      {tab === 'history' && (
        <div>
          {refreshBtn}
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
        <div>
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
        <div>
          {refreshBtn}
          <AiInsightsPanel
            trades={trades}
            metrics={metrics}
            onReportGenerated={() => {}}
          />
        </div>
      )}

      {selectedTrade && (
        <TradeDetailModal trade={selectedTrade} onClose={() => setSelectedTrade(null)} />
      )}
    </div>
  );
}
