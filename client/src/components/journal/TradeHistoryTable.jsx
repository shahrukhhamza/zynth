import { useState } from 'react';
import { Trash2, Brain, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Eye } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import { deleteTrade, analyzeTrade } from '../../services/journalApi';

function OutcomeBadge({ outcome }) {
  const cfg = {
    win:       { bg: '#22c55e22', color: '#22c55e', label: 'WIN' },
    loss:      { bg: '#ef444422', color: '#ef4444', label: 'LOSS' },
    breakeven: { bg: '#f59e0b22', color: '#f59e0b', label: 'BE' },
  };
  const c = cfg[outcome] || { bg: '#64748b22', color: '#64748b', label: '—' };
  return (
    <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ backgroundColor: c.bg, color: c.color }}>
      {c.label}
    </span>
  );
}

function DirectionBadge({ dir }) {
  const buy = dir?.toLowerCase() === 'buy';
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold"
      style={{ backgroundColor: buy ? '#22c55e22' : '#ef444422', color: buy ? '#22c55e' : '#ef4444' }}>
      {buy ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {(dir || '').toUpperCase()}
    </span>
  );
}

function AiScoreBadge({ ai_analysis }) {
  if (!ai_analysis) return <span className="text-xs" style={{ color: '#94a3b8' }}>—</span>;
  let data;
  try { data = typeof ai_analysis === 'string' ? JSON.parse(ai_analysis) : ai_analysis; } catch { return null; }
  const score = data?.psychology_score;
  if (!score) return null;
  const color = score >= 7 ? '#22c55e' : score >= 4 ? '#f59e0b' : '#ef4444';
  return (
    <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ backgroundColor: `${color}22`, color }}>
      {score}/10
    </span>
  );
}

export default function TradeHistoryTable({ trades, total, page, limit, onPageChange, onDeleted, onAnalyze, onView }) {
  const theme = useTheme();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const [deleting, setDeleting] = useState(null);
  const [analyzing, setAnalyzing] = useState(null);

  const totalPages = Math.ceil(total / limit);

  const handleDelete = async (id) => {
    const ok = await confirm({
      title:   'Delete trade?',
      message: 'This action cannot be undone. The trade and its journal entry will be permanently removed.',
      confirm: 'Delete',
      cancel:  'Cancel',
      variant: 'danger',
    });
    if (!ok) return;
    setDeleting(id);
    try {
      await deleteTrade(id);
      toast.success('Trade deleted.');
      onDeleted();
    } catch (err) {
      toast.error(err.message || 'Failed to delete trade.');
    } finally {
      setDeleting(null);
    }
  };

  const handleAnalyze = async (id) => {
    setAnalyzing(id);
    try {
      const res = await analyzeTrade(id);
      onAnalyze(id, res);
      toast.success('AI analysis complete.');
    } catch (err) {
      toast.error('AI analysis failed: ' + (err.message || 'Unknown error'));
    } finally {
      setAnalyzing(null);
    }
  };

  const th = { color: theme.muted, fontSize: '0.7rem', fontWeight: 700, padding: '0.5rem 0.75rem', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `1px solid ${theme.border}`, whiteSpace: 'nowrap' };
  const td = { color: theme.text, fontSize: '0.8rem', padding: '0.6rem 0.75rem', borderBottom: `1px solid ${theme.isDark ? theme.border + '44' : theme.border}`, verticalAlign: 'middle' };

  if (!trades || trades.length === 0) {
    return (
      <div className="text-center py-16" style={{ color: theme.muted }}>
        <p className="text-lg mb-2">No trades logged yet</p>
        <p className="text-sm">Go to "Log Trade" to add your first trade.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-xl" style={{ border: `1px solid ${theme.border}` }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: theme.surface }}>
            <tr>
              <th style={th}>Date</th>
              <th style={th}>Pair</th>
              <th style={th}>Dir</th>
              <th style={th}>Size</th>
              <th style={th}>Entry</th>
              <th style={th}>Exit</th>
              <th style={th}>Outcome</th>
              <th style={th}>P&L</th>
              <th style={th}>Strategy</th>
              <th style={th}>Emotion</th>
              <th style={th}>AI</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t, i) => {
              const date = t.created_at ? (t.created_at.includes('T') ? t.created_at.split('T')[0] : t.created_at.slice(0,10)) : '—';
              const pnl = parseFloat(t.profit_loss);
              return (
                <tr key={t.id}
                  onClick={() => onView(t)}
                  style={{ backgroundColor: i % 2 === 0 ? 'transparent' : (theme.isDark ? `${theme.border}22` : `${theme.border}55`), cursor: 'pointer' }}
                  className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <td style={td}>{date}</td>
                  <td style={{ ...td, fontWeight: 700, color: theme.accent }}>{t.pair}</td>
                  <td style={td}><DirectionBadge dir={t.direction} /></td>
                  <td style={td}>{t.position_size || '—'}</td>
                  <td style={td}>{t.entry_price || '—'}</td>
                  <td style={td}>{t.exit_price || '—'}</td>
                  <td style={td}><OutcomeBadge outcome={t.outcome} /></td>
                  <td style={{ ...td, fontWeight: 700, color: pnl >= 0 ? '#22c55e' : '#ef4444' }}>
                    {isNaN(pnl) ? '—' : (pnl >= 0 ? '+' : '') + pnl.toFixed(2)}
                  </td>
                  <td style={{ ...td, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.strategy || '—'}</td>
                  <td style={td}>{t.emotional_state || '—'}</td>
                  <td style={td}><AiScoreBadge ai_analysis={t.ai_analysis} /></td>
                  <td style={td}>
                    <div className="flex items-center gap-1">
                      <button onClick={e => { e.stopPropagation(); onView(t); }} title="View"
                        className="p-1.5 rounded transition-colors hover:bg-gray-100 dark:hover:bg-white/10" style={{ color: theme.muted }}>
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); handleAnalyze(t.id); }} disabled={analyzing === t.id}
                        title="AI Analyze" className="p-1.5 rounded transition-colors hover:bg-gray-100 dark:hover:bg-white/10"
                        style={{ color: analyzing === t.id ? theme.muted : '#a78bfa', opacity: analyzing === t.id ? 0.5 : 1 }}>
                        <Brain className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); handleDelete(t.id); }} disabled={deleting === t.id}
                        title="Delete" className="p-1.5 rounded transition-colors hover:bg-red-500/20"
                        style={{ color: '#ef4444', opacity: deleting === t.id ? 0.5 : 1 }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs" style={{ color: theme.muted }}>
            Showing {page * limit + 1}–{Math.min((page + 1) * limit, total)} of {total} trades
          </p>
          <div className="flex gap-2">
            <button disabled={page === 0} onClick={() => onPageChange(page - 1)}
              className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30"
              style={{ color: theme.text, border: `1px solid ${theme.border}` }}>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="flex items-center px-3 text-sm" style={{ color: theme.muted }}>
              {page + 1} / {totalPages}
            </span>
            <button disabled={page >= totalPages - 1} onClick={() => onPageChange(page + 1)}
              className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30"
              style={{ color: theme.text, border: `1px solid ${theme.border}` }}>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
