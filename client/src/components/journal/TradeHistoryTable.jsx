import {
  ChevronLeft, ChevronRight,
  ArrowUpRight, ArrowDownRight,
  CheckCircle2, XCircle, Minus,
  Brain, CalendarDays, BarChart2,
  ChevronsRight,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const MONO = { fontFamily: "'ui-monospace','Cascadia Code','SF Mono','Consolas',monospace" };

/* ── Outcome badge ─────────────────────────────────────────────────── */
function OutcomeBadge({ outcome }) {
  const theme = useTheme();
  const cfgDark = {
    win:       { color: '#10b981', bg: '#10b98120', border: '#10b98140', Icon: CheckCircle2, label: 'WIN'  },
    loss:      { color: '#ef4444', bg: '#ef444420', border: '#ef444440', Icon: XCircle,     label: 'LOSS' },
    breakeven: { color: '#f59e0b', bg: '#f59e0b15', border: '#f59e0b35', Icon: Minus,        label: 'B/E'  },
  };
  const cfgLight = {
    win:       { color: '#047857', bg: '#d1fae5', border: '#6ee7b7', Icon: CheckCircle2, label: 'WIN'  },
    loss:      { color: '#be123c', bg: '#ffe4e6', border: '#fda4af', Icon: XCircle,     label: 'LOSS' },
    breakeven: { color: '#92400e', bg: '#fef3c7', border: '#fcd34d', Icon: Minus,        label: 'B/E'  },
  };
  const map = theme.isDark ? cfgDark : cfgLight;
  const c   = map[outcome] || { color: theme.muted, bg: 'transparent', border: theme.border, Icon: Minus, label: '—' };
  const { Icon } = c;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ backgroundColor: c.bg, color: c.color, border: `1px solid ${c.border}`, fontSize: '10px', fontWeight: 700 }}
    >
      <Icon className="w-3 h-3 flex-shrink-0" />
      {c.label}
    </span>
  );
}

/* ── Direction badge ───────────────────────────────────────────────── */
function DirectionBadge({ dir }) {
  const theme = useTheme();
  const buy  = dir?.toLowerCase() === 'buy';
  const darkC  = { color: buy ? '#10b981' : '#ef4444', bg: buy ? '#10b98115' : '#ef444415', border: buy ? '#10b98130' : '#ef444430' };
  const lightC = { color: buy ? '#047857' : '#be123c',  bg: buy ? '#d1fae5'   : '#ffe4e6',   border: buy ? '#6ee7b7'   : '#fda4af'  };
  const c    = theme.isDark ? darkC : lightC;
  const Icon = buy ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ backgroundColor: c.bg, color: c.color, border: `1px solid ${c.border}`, fontSize: '10px', fontWeight: 700 }}
    >
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      {(dir || '').toUpperCase()}
    </span>
  );
}

/* ── AI Score badge ────────────────────────────────────────────────── */
function AiScoreBadge({ ai_analysis }) {
  const theme = useTheme();
  if (!ai_analysis) return <span style={{ color: theme.muted }}>—</span>;
  let data;
  try { data = typeof ai_analysis === 'string' ? JSON.parse(ai_analysis) : ai_analysis; }
  catch { return <span style={{ color: theme.muted }}>—</span>; }
  const score = data?.psychology_score;
  if (score == null) return <span style={{ color: theme.muted }}>—</span>;
  const color = score >= 7 ? '#10B981' : score >= 4 ? '#f59e0b' : '#F43F5E';
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold"
      style={{ backgroundColor: `${color}12`, color, border: `1px solid ${color}30`, ...MONO }}
    >
      <Brain className="w-3 h-3 flex-shrink-0" />
      {score}<span className="opacity-50 font-normal">/10</span>
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Main component
══════════════════════════════════════════════════════════════════════ */
export default function TradeHistoryTable({ trades, total, page, limit, onPageChange, onDeleted, onAnalyze, onView }) {
  const theme = useTheme();
  const totalPages = Math.ceil(total / limit);

  /* shared header cell style */
  const thBase = {
    color: theme.muted,
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    padding: '12px 16px',
    textAlign: 'left',
    backgroundColor: theme.isDark ? theme.bg : theme.surface,
    borderBottom: `1px solid ${theme.border}`,
    userSelect: 'none',
  };

  /* shared body cell style */
  const tdBase = {
    fontSize: '0.82rem',
    padding: '14px 16px',
    borderBottom: `1px solid ${theme.border}`,
    verticalAlign: 'middle',
    color: theme.text,
  };

  /* ── Empty state ── */
  if (!trades || trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4" style={{ color: theme.muted }}>
        <BarChart2 className="w-10 h-10 opacity-20" />
        <div className="text-center">
          <p className="text-base font-semibold mb-1" style={{ color: theme.text }}>No trades logged yet</p>
          <p className="text-sm opacity-60">Use the "Log Trade" tab to record your first trade.</p>
        </div>
      </div>
    );
  }

  const COLS = [
    { label: 'Date',      mono: true  },
    { label: 'Pair',      mono: false },
    { label: 'Direction', mono: false },
    { label: 'Entry',     mono: true  },
    { label: 'Exit',      mono: true  },
    { label: 'Size',      mono: true  },
    { label: 'Outcome',   mono: false },
    { label: 'P & L',     mono: true  },
    { label: 'Strategy',  mono: false },
    { label: 'Emotion',   mono: false },
    { label: 'AI Score',  mono: false },
  ];

  return (
    <div className="flex flex-col gap-4">

      {/* ── Table ── */}
      <div
        className="overflow-x-auto w-full"
        style={{ borderRadius: '10px', border: `1px solid ${theme.border}`, backgroundColor: theme.surface }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>

          {/* Head */}
          <thead>
            <tr>
              {COLS.map(({ label, mono }) => (
                <th key={label} style={{ ...thBase, ...(mono ? MONO : {}) }}>{label}</th>
              ))}
              {/* chevron hint col — no label */}
              <th style={{ ...thBase, width: '40px', padding: '12px 0.75rem' }} />
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {trades.map((t, i) => {
              const rawDate  = t.created_at
                ? (t.created_at.includes('T') ? t.created_at.split('T')[0] : t.created_at.slice(0, 10))
                : null;
              const pnl      = parseFloat(t.profit_loss);
              const pnlColor = isNaN(pnl) ? theme.muted : pnl >= 0 ? '#10b981' : '#ef4444';
              const isLast   = i === trades.length - 1;
              const noBorder = isLast ? { borderBottom: 'none' } : {};

              return (
                <tr
                  key={t.id}
                  onClick={() => onView(t)}
                  style={{ cursor: 'pointer', transition: 'background-color 0.12s ease', backgroundColor: theme.isDark ? theme.surface2 : 'transparent' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = theme.isDark
                      ? theme.surface
                      : 'rgba(0,0,0,0.022)';
                    const ch = e.currentTarget.querySelector('.row-chevron');
                    if (ch) ch.style.opacity = '1';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = theme.isDark ? theme.surface2 : 'transparent';
                    const ch = e.currentTarget.querySelector('.row-chevron');
                    if (ch) ch.style.opacity = '0';
                  }}
                >
                  {/* Date */}
                  <td style={{ ...tdBase, ...noBorder, color: theme.muted, ...MONO, fontSize: '12px' }}>
                    {rawDate ? (
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="w-3 h-3 opacity-40 flex-shrink-0" />
                        {rawDate}
                      </span>
                    ) : '—'}
                  </td>

                  {/* Pair */}
                  <td style={{ ...tdBase, ...noBorder, fontWeight: 600, fontSize: '13px', letterSpacing: '0.04em', color: theme.text }}>
                    {t.pair || '—'}
                  </td>

                  {/* Direction */}
                  <td style={{ ...tdBase, ...noBorder }}>
                    <DirectionBadge dir={t.direction} />
                  </td>

                  {/* Entry */}
                  <td style={{ ...tdBase, ...noBorder, ...MONO }}>{t.entry_price || '—'}</td>

                  {/* Exit */}
                  <td style={{ ...tdBase, ...noBorder, ...MONO }}>{t.exit_price || '—'}</td>

                  {/* Size */}
                  <td style={{ ...tdBase, ...noBorder, ...MONO, color: theme.muted }}>
                    {t.position_size
                      ? <span>{t.position_size} <span style={{ fontSize: '0.7rem', opacity: 0.45 }}>lots</span></span>
                      : '—'}
                  </td>

                  {/* Outcome */}
                  <td style={{ ...tdBase, ...noBorder }}>
                    <OutcomeBadge outcome={t.outcome} />
                  </td>

                  {/* P&L */}
                  <td style={{ ...tdBase, ...noBorder, ...MONO, fontWeight: 600, fontSize: '0.88rem', color: pnlColor }}>
                    {isNaN(pnl) ? '—' : `${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}`}
                  </td>

                  {/* Strategy */}
                  <td style={{ ...tdBase, ...noBorder, maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: theme.muted, fontSize: '0.8rem' }}>
                    {t.strategy || <span style={{ opacity: 0.35 }}>—</span>}
                  </td>

                  {/* Emotion */}
                  <td style={{ ...tdBase, ...noBorder, color: theme.muted, textTransform: 'capitalize', fontSize: '0.8rem' }}>
                    {t.emotional_state || <span style={{ opacity: 0.35 }}>—</span>}
                  </td>

                  {/* AI Score */}
                  <td style={{ ...tdBase, ...noBorder }}>
                    <AiScoreBadge ai_analysis={t.ai_analysis} />
                  </td>

                  {/* Chevron row hint */}
                  <td style={{ ...tdBase, ...noBorder, padding: '0.95rem 0.75rem', width: '40px' }}>
                    <ChevronsRight
                      className="row-chevron w-3.5 h-3.5"
                      style={{ color: theme.muted, opacity: 0, transition: 'opacity 0.15s' }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs" style={{ color: theme.muted, ...MONO }}>
            {page * limit + 1}–{Math.min((page + 1) * limit, total)}
            <span className="opacity-50"> / {total} trades</span>
          </p>

          <div className="flex items-center gap-1.5">
            <button
              disabled={page === 0}
              onClick={() => onPageChange(page - 1)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-30"
              style={{ color: theme.muted, border: `1px solid ${theme.border}`, backgroundColor: 'transparent' }}
              onMouseEnter={e => { if (page !== 0) { e.currentTarget.style.color = theme.text; e.currentTarget.style.backgroundColor = theme.surface2; } }}
              onMouseLeave={e => { e.currentTarget.style.color = theme.muted; e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </button>

            <span
              className="px-3 py-1.5 text-xs font-semibold rounded-lg"
              style={{ color: theme.text, backgroundColor: theme.surface2, border: `1px solid ${theme.border}`, ...MONO }}
            >
              {page + 1} / {totalPages}
            </span>

            <button
              disabled={page >= totalPages - 1}
              onClick={() => onPageChange(page + 1)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-30"
              style={{ color: theme.muted, border: `1px solid ${theme.border}`, backgroundColor: 'transparent' }}
              onMouseEnter={e => { if (page < totalPages - 1) { e.currentTarget.style.color = theme.text; e.currentTarget.style.backgroundColor = theme.surface2; } }}
              onMouseLeave={e => { e.currentTarget.style.color = theme.muted; e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
