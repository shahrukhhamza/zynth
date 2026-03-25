import { useState, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useTimezone } from '../contexts/TimezoneContext';
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const PAGE_SIZE = 20;

function SortIcon({ field, sortKey, direction }) {
  if (sortKey !== field) return <ChevronsUpDown className="w-3 h-3 opacity-30" />;
  return direction === 'asc'
    ? <ChevronUp className="w-3 h-3" />
    : <ChevronDown className="w-3 h-3" />;
}

function fmtDate(iso) {
  try { return format(new Date(iso), 'dd MMM yy HH:mm'); }
  catch { return iso; }
}

export default function MT5TradeHistory({ trades, onDeleteTrade, deletingTradeId }) {
  const theme = useTheme();
  const { formatDateWithTimezone } = useTimezone();
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState({ key: 'close_time', dir: 'desc' });

  const toggle = (key) =>
    setSort((prev) => ({
      key,
      dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc',
    }));

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    let rows = q
      ? trades.filter((t) => t.symbol?.toLowerCase().includes(q) || String(t.ticket).includes(q))
      : [...trades];

    rows.sort((a, b) => {
      const av = a[sort.key] ?? '';
      const bv = b[sort.key] ?? '';
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sort.dir === 'asc' ? cmp : -cmp;
    });

    return rows;
  }, [trades, query, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns = [
    { key: 'ticket', label: '#', align: 'left', w: '5rem' },
    { key: 'symbol', label: 'Symbol', align: 'left' },
    { key: 'type', label: 'Type', align: 'center', w: '5rem' },
    { key: 'volume', label: 'Lots', align: 'right', w: '5rem' },
    { key: 'open_price', label: 'Open', align: 'right' },
    { key: 'close_price', label: 'Close', align: 'right' },
    { key: 'profit', label: 'Profit', align: 'right' },
    { key: 'swap', label: 'Swap', align: 'right', w: '5.5rem' },
    { key: 'commission', label: 'Comm.', align: 'right', w: '6rem' },
    { key: 'open_time', label: 'Opened', align: 'left', w: '10rem' },
    { key: 'close_time', label: 'Closed', align: 'left', w: '10rem' },
    { key: 'duration', label: 'Duration', align: 'right', w: '7rem' },
    ...(onDeleteTrade ? [{ key: '_actions', label: '', align: 'center', w: '3rem' }] : []),
  ];

  const th = {
    padding: '8px 10px',
    fontSize: '11px',
    fontWeight: 600,
    color: theme.muted,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    userSelect: 'none',
    borderBottom: `1px solid ${theme.border}`,
  };

  const td = (extra = {}) => ({
    padding: '8px 10px',
    fontSize: '12px',
    color: theme.text,
    whiteSpace: 'nowrap',
    borderBottom: `1px solid ${theme.border}`,
    ...extra,
  });

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: theme.muted }}>
          TRADE HISTORY&nbsp;
          <span style={{ color: theme.accent }}>({filtered.length})</span>
        </h3>

        {/* Search */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
          style={{ background: theme.surface2, border: `1px solid ${theme.border}` }}
        >
          <Search className="w-3.5 h-3.5" style={{ color: theme.muted }} />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Filter symbol / ticket…"
            className="bg-transparent outline-none text-xs w-36"
            style={{ color: theme.text }}
          />
        </div>
      </div>

      <div
        className="rounded-xl overflow-hidden"
        style={{ border: `1px solid ${theme.border}` }}
      >
        <div className="overflow-x-auto">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: theme.bg }}>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    style={{ ...th, textAlign: col.align, minWidth: col.w }}
                    onClick={() => toggle(col.key)}
                  >
                    <span className="flex items-center gap-1 justify-center">
                      {col.label}
                      <SortIcon field={col.key} sortKey={sort.key} direction={sort.dir} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} style={{ ...td(), textAlign: 'center', padding: '24px' }}>
                    <span style={{ color: theme.muted }}>No trades found.</span>
                  </td>
                </tr>
              ) : (
                pageRows.map((t, i) => {
                  const profit = t.profit ?? 0;
                  const profitColor = profit > 0 ? '#10b981' : profit < 0 ? '#ef4444' : theme.muted;
                  const rowBg = i % 2 === 0 ? theme.surface : theme.bg;
                  const rowHover = theme.surface2;
                  return (
                    <tr
                      key={t.ticket ?? i}
                      style={{ backgroundColor: rowBg }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = rowHover; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = rowBg; }}
                    >
                      <td style={td({ color: theme.muted })}>{t.ticket}</td>
                      <td style={td({ fontWeight: 600 })}>{t.symbol}</td>
                      <td style={{ ...td({ textAlign: 'center' }) }}>
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: t.type === 'BUY' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                            color: t.type === 'BUY' ? '#10b981' : '#ef4444',
                          }}
                        >
                          {t.type}
                        </span>
                      </td>
                      <td style={td({ textAlign: 'right' })}>{t.volume?.toFixed(2)}</td>
                      <td style={td({ textAlign: 'right' })}>{t.open_price?.toFixed(5)}</td>
                      <td style={td({ textAlign: 'right' })}>{t.close_price?.toFixed(5)}</td>
                      <td style={td({ textAlign: 'right', color: profitColor, fontWeight: 600 })}>
                        {profit >= 0 ? '+' : ''}{profit.toFixed(2)}
                      </td>
                      <td style={td({ textAlign: 'right', color: theme.muted })}>{t.swap?.toFixed(2)}</td>
                      <td style={td({ textAlign: 'right', color: theme.muted })}>{t.commission?.toFixed(2)}</td>
                      <td style={td()}>{formatDateWithTimezone(new Date(t.open_time), 'MMM dd, yyyy HH:mm')}</td>
                      <td style={td()}>{formatDateWithTimezone(new Date(t.close_time), 'MMM dd, yyyy HH:mm')}</td>
                      <td style={td({ textAlign: 'right', color: theme.muted })}>{t.duration}</td>
                      {onDeleteTrade && (
                        <td style={td({ textAlign: 'center', padding: '4px 8px' })}>
                          <button
                            onClick={() => onDeleteTrade(t)}
                            disabled={deletingTradeId === t.id}
                            title="Delete trade"
                            style={{
                              background: 'none', border: 'none', cursor: deletingTradeId === t.id ? 'not-allowed' : 'pointer',
                              padding: '4px', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: deletingTradeId === t.id ? theme.muted : 'rgba(239,68,68,0.6)',
                              transition: 'color 0.15s',
                            }}
                            onMouseEnter={e => { if (deletingTradeId !== t.id) e.currentTarget.style.color = '#ef4444'; }}
                            onMouseLeave={e => { if (deletingTradeId !== t.id) e.currentTarget.style.color = 'rgba(239,68,68,0.6)'; }}
                          >
                            {deletingTradeId === t.id
                              ? <Loader2 style={{ width: 13, height: 13 }} className="animate-spin" />
                              : <Trash2 style={{ width: 13, height: 13 }} />}
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className="flex items-center justify-between px-4 py-2"
            style={{ borderTop: `1px solid ${theme.border}`, background: theme.surface }}
          >
            <span className="text-xs" style={{ color: theme.muted }}>
              Page {page} of {totalPages} · {filtered.length} trades
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded text-xs"
                style={{
                  background: theme.surface2,
                  border: `1px solid ${theme.border}`,
                  color: page === 1 ? theme.muted : theme.text,
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                }}
              >
                ‹ Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 rounded text-xs"
                style={{
                  background: theme.surface2,
                  border: `1px solid ${theme.border}`,
                  color: page === totalPages ? theme.muted : theme.text,
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                }}
              >
                Next ›
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
