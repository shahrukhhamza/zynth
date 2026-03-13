import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

// -- Constants ------------------------------------------------------------------
const DAY_NAMES  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS      = Array.from({ length: 24 }, (_, i) => i);
const HOUR_TICKS = new Set([0, 3, 6, 9, 12, 15, 18, 21, 23]);
const SESSIONS   = [
  { label: 'Asian',    start: 0,  end: 7,  color: '#818cf8' },
  { label: 'London',   start: 8,  end: 12, color: '#38bdf8' },
  { label: 'New York', start: 13, end: 17, color: '#f59e0b' },
  { label: 'Evening',  start: 18, end: 23, color: '#94a3b8' },
];

const MODES = [
  { key: 'profit',  label: 'P&L'      },
  { key: 'winrate', label: 'Win Rate' },
  { key: 'count',   label: 'Volume'   },
];

const CELL_H = 38;
const GAP    = 2;
const DAY_W  = 36;

// -- Helpers --------------------------------------------------------------------
function lerp(a, b, t) { return a + (b - a) * t; }
function hexToRgb(hex) {
  const m = (hex || '#888').replace('#', '').match(/.{2}/g);
  return m ? m.map(x => parseInt(x, 16)) : [128, 128, 128];
}
function fmt$(v, decimals = 2) {
  if (v == null) return '--';
  const abs = Math.abs(v), sign = v >= 0 ? '+' : '-';
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(1)}k`;
  if (abs >= 100)  return `${sign}$${abs.toFixed(0)}`;
  return `${sign}$${abs.toFixed(decimals)}`;
}
function fmtCell(val, mode) {
  if (val == null || val === 0) return null;
  if (mode === 'count')   return String(val);
  if (mode === 'winrate') return `${val.toFixed(0)}%`;
  return fmt$(val);
}
function sessionOf(hour) {
  return SESSIONS.find(s => hour >= s.start && hour <= s.end) || SESSIONS[3];
}

// -- Color engines --------------------------------------------------------------
function profitColor(value, maxVal, minVal) {
  if (value == null || value === 0) return null;
  if (value > 0) {
    // sqrt scale so small values still get vivid color
    const t = Math.sqrt(Math.min(value / (maxVal || 1), 1));
    const [r, g, b] = hexToRgb('#22c55e');
    return `rgba(${r},${g},${b},${lerp(0.48, 0.97, t).toFixed(2)})`;
  }
  const t = Math.sqrt(Math.min(Math.abs(value) / (Math.abs(minVal) || 1), 1));
  const [r, g, b] = hexToRgb('#ef4444');
  return `rgba(${r},${g},${b},${lerp(0.48, 0.97, t).toFixed(2)})`;
}
function winrateColor(wr) {
  if (wr == null) return null;
  if (wr >= 60) { const t = (wr - 60) / 40; const [r,g,b] = hexToRgb('#22c55e'); return `rgba(${r},${g},${b},${lerp(0.4, 0.9, t).toFixed(2)})`; }
  if (wr >= 40) { const t = (wr - 40) / 20; const [r,g,b] = hexToRgb('#f59e0b'); return `rgba(${r},${g},${b},${lerp(0.2, 0.6, t).toFixed(2)})`; }
  const t = 1 - wr / 40; const [r,g,b] = hexToRgb('#ef4444'); return `rgba(${r},${g},${b},${lerp(0.2, 0.75, t).toFixed(2)})`;
}
function countColor(value, maxVal) {
  if (!value) return null;
  const t = Math.min(value / (maxVal || 1), 1);
  const [r, g, b] = hexToRgb('#6366f1');
  return `rgba(${r},${g},${b},${lerp(0.15, 0.9, t).toFixed(2)})`;
}
function getCellBg(cell, mode, maxVal, minVal) {
  if (!cell) return null;
  if (mode === 'profit')  return profitColor(cell.profit, maxVal, minVal);
  if (mode === 'winrate') return cell.count >= 2 ? winrateColor(cell.win_rate ?? (cell.wins / cell.count * 100)) : null;
  return countColor(cell.count, maxVal);
}

// -- Insight generator ---------------------------------------------------------
function generateInsights(heatmap) {
  if (!heatmap?.length) return [];
  const insights = [];
  const sorted = [...heatmap].sort((a, b) => b.profit - a.profit);
  const best   = sorted[0];
  const worst  = sorted[sorted.length - 1];

  if (best)  insights.push({ type: 'positive', text: `Most profitable session: ${best.day_name} ${String(best.hour).padStart(2,'0')}:00 (${fmt$(best.profit)})` });
  if (worst) insights.push({ type: 'negative', text: `Avoid ${worst.day_name} ${String(worst.hour).padStart(2,'0')}:00 - historically worst (${fmt$(worst.profit)})` });

  const hourMap = {};
  heatmap.forEach(c => { hourMap[c.hour] = (hourMap[c.hour] || { p: 0, n: 0 }); hourMap[c.hour].p += c.profit; hourMap[c.hour].n += c.count; });
  const morningP   = [8,9,10,11,12].reduce((s,h) => s + (hourMap[h]?.p || 0), 0);
  const afternoonP = [13,14,15,16,17].reduce((s,h) => s + (hourMap[h]?.p || 0), 0);
  if (afternoonP > morningP) insights.push({ type: 'neutral', text: 'Performance improves during afternoon sessions (13:00-17:00) vs morning.' });
  else if (morningP > afternoonP) insights.push({ type: 'neutral', text: 'Morning sessions (08:00-12:00) outperform afternoon. Front-load your trading day.' });

  const dayMap = {};
  heatmap.forEach(c => { dayMap[c.day] = (dayMap[c.day] || 0) + c.profit; });
  const bestDay  = Object.entries(dayMap).sort((a,b) => b[1]-a[1])[0];
  const worstDay = Object.entries(dayMap).sort((a,b) => a[1]-b[1])[0];
  if (bestDay)  insights.push({ type: 'positive', text: `${DAY_NAMES[bestDay[0]]} is your strongest trading day (${fmt$(bestDay[1])})` });
  if (worstDay && worstDay[0] !== bestDay[0]) insights.push({ type: 'negative', text: `${DAY_NAMES[worstDay[0]]} consistently underperforms - consider reducing size` });

  const highWrCells = heatmap.filter(c => c.count >= 3 && (c.win_rate ?? 0) >= 70);
  if (highWrCells.length) {
    const top = highWrCells.sort((a, b) => (b.win_rate ?? 0) - (a.win_rate ?? 0))[0];
    insights.push({ type: 'positive', text: `${top.day_name} ${String(top.hour).padStart(2,'0')}:00 has ${(top.win_rate ?? 0).toFixed(0)}% win rate - high-confidence window` });
  }
  return insights.slice(0, 5);
}

// -- Modal ---------------------------------------------------------------------
function CellModal({ cell, onClose }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!cell) return null;
  const wr  = cell.win_rate ?? (cell.wins && cell.count ? cell.wins / cell.count * 100 : null);
  const avg = cell.avg_trade ?? (cell.count ? cell.profit / cell.count : null);
  const session = sessionOf(cell.hour);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="rounded-xl shadow-2xl w-80 overflow-hidden"
        style={{ backgroundColor: '#161616', border: '1px solid #2a2a2a' }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#2a2a2a' }}>
          <div>
            <span className="font-bold text-sm" style={{ color: '#e8e8e8' }}>
              {cell.day_name}&nbsp;
            </span>
            <span className="text-sm font-mono" style={{ color: session.color }}>
              {String(cell.hour).padStart(2,'0')}:00 - {String(cell.hour+1).padStart(2,'0')}:00
            </span>
            <div className="text-xs mt-0.5" style={{ color: '#475569' }}>
              {session.label} Session
            </div>
          </div>
          <button onClick={onClose} className="rounded-md px-2 py-1 text-xs"
            style={{ color: '#64748b', backgroundColor: '#2a2a2a' }}>ESC</button>
        </div>

        <div className="grid grid-cols-2 gap-px" style={{ backgroundColor: '#2a2a2a' }}>
          {[
            { label: 'Total Trades', val: cell.count,                                  color: '#94a3b8' },
            { label: 'Total P&L',    val: fmt$(cell.profit),                            color: cell.profit >= 0 ? '#22c55e' : '#ef4444' },
            { label: 'Win Rate',     val: wr != null ? `${wr.toFixed(1)}%` : '--',      color: wr >= 50 ? '#22c55e' : '#ef4444' },
            { label: 'Avg / Trade',  val: avg != null ? fmt$(avg) : '--',               color: avg >= 0 ? '#22c55e' : '#ef4444' },
            { label: 'Wins',         val: cell.wins ?? '--',                            color: '#22c55e' },
            { label: 'Losses',       val: cell.losses ?? '--',                          color: '#ef4444' },
          ].map(s => (
            <div key={s.label} className="px-4 py-3" style={{ backgroundColor: '#161616' }}>
              <div className="text-xs mb-1" style={{ color: '#475569' }}>{s.label}</div>
              <div className="text-base font-bold tabular-nums" style={{ color: s.color }}>{s.val}</div>
            </div>
          ))}
        </div>

        {cell.wins != null && cell.count > 0 && (
          <div className="px-4 py-3 border-t" style={{ borderColor: '#2a2a2a' }}>
            <div className="text-xs mb-2" style={{ color: '#475569' }}>Win / Loss Distribution</div>
            <div className="flex rounded-sm overflow-hidden h-2">
              <div style={{ width: `${(cell.wins / cell.count) * 100}%`, backgroundColor: '#22c55e' }} />
              <div style={{ width: `${((cell.count - cell.wins) / cell.count) * 100}%`, backgroundColor: '#ef4444' }} />
            </div>
            <div className="flex justify-between mt-1" style={{ fontSize: 10, color: '#475569' }}>
              <span>{cell.wins} W</span><span>{cell.count - (cell.wins ?? 0)} L</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// -- Main Component ------------------------------------------------------------
export default function MT5HeatmapChart({ heatmap }) {
  const theme = useTheme();
  const [mode, setMode]           = useState('profit');
  const [tooltip, setTooltip]     = useState(null);
  const [hoverRow, setHoverRow]   = useState(null);
  const [hoverCol, setHoverCol]   = useState(null);
  const [modalCell, setModalCell] = useState(null);
  const tooltipRef                = useRef(null);

  const grid = useMemo(() => {
    const map = {};
    (heatmap || []).forEach(cell => { map[`${cell.day}_${cell.hour}`] = cell; });
    return map;
  }, [heatmap]);

  const { maxVal, minVal } = useMemo(() => {
    if (!heatmap?.length) return { maxVal: 0, minVal: 0 };
    let max = 0, min = 0;
    heatmap.forEach(c => {
      const v = mode === 'profit' ? c.profit : mode === 'winrate' ? (c.win_rate ?? 0) : c.count;
      if (v > max) max = v;
      if (v < min) min = v;
    });
    return { maxVal: max, minVal: min };
  }, [heatmap, mode]);

  const stats = useMemo(() => {
    if (!heatmap?.length) return null;
    const sorted   = [...heatmap].sort((a, b) => b.profit - a.profit);
    const best     = sorted[0];
    const worst    = sorted[sorted.length - 1];
    const total    = heatmap.reduce((s, c) => s + c.count,  0);
    const pnl      = heatmap.reduce((s, c) => s + c.profit, 0);
    const wins     = heatmap.reduce((s, c) => s + (c.wins ?? 0), 0);
    const wr       = total > 0 ? wins / total * 100 : null;
    const avgTrd   = total > 0 ? pnl / total : null;
    const hourMap  = {};
    heatmap.forEach(c => { hourMap[c.hour] = (hourMap[c.hour] || 0) + c.count; });
    const peakHour = Object.entries(hourMap).sort((a,b) => b[1]-a[1])[0]?.[0];
    return { best, worst, total, pnl, winRate: wr, avgTrade: avgTrd, peakHour };
  }, [heatmap]);

  const insights = useMemo(() => generateInsights(heatmap), [heatmap]);

  const handleCellEnter = useCallback((e, cell, dayIdx, hour) => {
    if (!cell) return;
    setHoverRow(dayIdx);
    setHoverCol(hour);
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({ cell, x: rect.left + rect.width / 2, y: rect.top - 8 });
  }, []);
  const handleCellLeave = useCallback(() => {
    setHoverRow(null); setHoverCol(null); setTooltip(null);
  }, []);

  if (!heatmap?.length) {
    return (
      <div className="rounded-xl p-12 text-center"
        style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, border: `2px solid ${theme.border}`, margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,7px)', gap: 2 }}>
            {[...Array(9)].map((_,i) => <div key={i} style={{ height: 7, borderRadius: 1, backgroundColor: theme.border }} />)}
          </div>
        </div>
        <p className="text-sm font-medium" style={{ color: theme.muted }}>No heatmap data yet</p>
        <p className="text-xs mt-1" style={{ color: theme.muted }}>Import trades to see performance patterns</p>
      </div>
    );
  }

  const BG   = theme.bg;
  const SURF = theme.surface;
  const BORD = theme.border;
  const MUTE = theme.muted;
  const TEXT = theme.text;
  const SUBT = theme.textMuted;

  return (
    <>
      <div className="rounded-xl overflow-hidden select-none"
        style={{ backgroundColor: BG, border: `1px solid ${BORD}`, fontFamily: "'Inter', system-ui, sans-serif" }}>

        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: `1px solid ${BORD}`, backgroundColor: SURF }}>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: '#22c55e', boxShadow: '0 0 6px #22c55e88' }} />
            <span className="font-bold text-sm tracking-wide" style={{ color: TEXT }}>
              TRADING ACTIVITY HEATMAP
            </span>
            <span className="text-xs px-2 py-0.5 rounded font-mono"
              style={{ backgroundColor: BORD, color: SUBT }}>
              Day x Hour
            </span>
          </div>
          <div className="flex rounded-md overflow-hidden" style={{ border: `1px solid ${BORD}` }}>
            {MODES.map(m => (
              <button key={m.key} onClick={() => setMode(m.key)}
                className="px-3 py-1 text-xs font-semibold tracking-wide transition-all duration-200"
                style={{
                  backgroundColor: mode === m.key ? theme.accent : 'transparent',
                  color: mode === m.key ? '#fff' : MUTE,
                  borderRight: `1px solid ${BORD}`,
                }}>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* METRICS BAR */}
        {stats && (() => {
          const cards = [
            {
              label: 'TOTAL P&L',
              val: fmt$(stats.pnl),
              color: stats.pnl >= 0 ? '#22c55e' : '#ef4444',
              sub: stats.pnl >= 0 ? 'Net profitable' : 'Net loss',
            },
            {
              label: 'WIN RATE',
              val: stats.winRate != null ? `${stats.winRate.toFixed(1)}%` : '--',
              color: stats.winRate >= 50 ? '#22c55e' : '#f59e0b',
              sub: `${heatmap.reduce((s,c)=>s+(c.wins??0),0)}W / ${heatmap.reduce((s,c)=>s+(c.losses??0),0)}L`,
            },
            {
              label: 'AVG / TRADE',
              val: stats.avgTrade != null ? fmt$(stats.avgTrade) : '--',
              color: stats.avgTrade >= 0 ? '#22c55e' : '#ef4444',
              sub: `${stats.total} total trades`,
            },
            {
              label: 'BEST SESSION',
              val: stats.best ? `${stats.best.day_name} ${String(stats.best.hour).padStart(2,'0')}:00` : '--',
              color: '#22c55e',
              sub: stats.best ? fmt$(stats.best.profit) : '',
            },
            {
              label: 'WORST SESSION',
              val: stats.worst ? `${stats.worst.day_name} ${String(stats.worst.hour).padStart(2,'0')}:00` : '--',
              color: '#ef4444',
              sub: stats.worst ? fmt$(stats.worst.profit) : '',
            },
            {
              label: 'PEAK HOUR',
              val: stats.peakHour != null ? `${String(stats.peakHour).padStart(2,'0')}:00` : '--',
              color: '#6366f1',
              sub: sessionOf(Number(stats.peakHour)).label,
            },
            {
              label: 'TOTAL TRADES',
              val: String(stats.total),
              color: SUBT,
              sub: `${heatmap.length} active cells`,
            },
          ];
          return (
            <div className="grid" style={{ gridTemplateColumns: `repeat(${cards.length}, 1fr)`, borderBottom: `1px solid ${BORD}` }}>
              {cards.map((c, i) => (
                <div key={c.label} className="px-3 py-2.5"
                  style={{ borderRight: i < cards.length - 1 ? `1px solid ${BORD}` : 'none', backgroundColor: SURF }}>
                  <div className="text-xs uppercase tracking-wider font-semibold mb-1"
                    style={{ color: MUTE, letterSpacing: '0.06em', fontSize: 10 }}>{c.label}</div>
                  <div className="font-bold tabular-nums truncate"
                    style={{ color: c.color, fontSize: 14 }}>{c.val}</div>
                  <div className="text-xs mt-0.5 truncate"
                    style={{ color: '#334155', fontSize: 10 }}>{c.sub}</div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* HEATMAP GRID - fills full width */}
        <div className="px-4 pt-3 pb-1">

          {/* Session color band */}
          <div style={{ display: 'grid', gridTemplateColumns: `${DAY_W}px repeat(24, 1fr)`, gap: GAP, marginBottom: 3 }}>
            <div />
            {HOURS.map(h => (
              <div key={h} style={{ height: 3, borderRadius: 2, backgroundColor: sessionOf(h).color, opacity: 0.5 }} />
            ))}
          </div>

          {/* Hour tick labels */}
          <div style={{ display: 'grid', gridTemplateColumns: `${DAY_W}px repeat(24, 1fr)`, gap: GAP, marginBottom: 5 }}>
            <div />
            {HOURS.map(h => (
              <div key={h} style={{
                textAlign: 'center',
                color: HOUR_TICKS.has(h) ? SUBT : 'transparent',
                fontSize: 9, fontWeight: 700, letterSpacing: '0.05em', fontFamily: 'monospace',
              }}>
                {String(h).padStart(2, '0')}
              </div>
            ))}
          </div>

          {/* Day rows */}
          <div style={{ display: 'grid', gridTemplateColumns: `${DAY_W}px repeat(24, 1fr)`, gap: GAP }}>
            {DAY_NAMES.map((day, dayIdx) => (
              <>
                <div key={`lbl-${dayIdx}`} className="flex items-center" style={{
                  color: hoverRow === dayIdx ? TEXT : MUTE,
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                  fontFamily: 'monospace', transition: 'color 0.1s',
                }}>
                  {day}
                </div>

                {HOURS.map(hour => {
                  const cell       = grid[`${dayIdx}_${hour}`];
                  const bg         = getCellBg(cell, mode, maxVal, minVal);
                  const val        = cell ? (mode === 'profit' ? cell.profit : mode === 'winrate' ? (cell.win_rate ?? 0) : cell.count) : null;
                  const label      = fmtCell(val, mode);
                  const isHoverRow = hoverRow === dayIdx;
                  const isHoverCol = hoverCol === hour;
                  const isBest     = stats?.best && stats.best.day === dayIdx && stats.best.hour === hour;

                  return (
                    <div key={`${dayIdx}_${hour}`}
                      style={{
                        height: CELL_H,
                        borderRadius: 3,
                        backgroundColor: bg ?? (isHoverRow || isHoverCol ? '#ffffff08' : '#ffffff05'),
                        border: `1px solid ${
                          isBest && mode === 'profit' ? '#22c55e66'
                          : (isHoverRow || isHoverCol) && cell ? '#ffffff22'
                          : bg ? '#ffffff11' : 'transparent'
                        }`,
                        cursor: cell ? 'pointer' : 'default',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', gap: 1,
                        transition: 'filter 0.1s, transform 0.1s, box-shadow 0.1s',
                        position: 'relative',
                        opacity: (hoverRow !== null && !isHoverRow && !isHoverCol && cell) ? 0.45 : 1,
                        boxShadow: isBest && mode === 'profit' ? '0 0 8px #22c55e55' : 'none',
                        animation: isBest && mode === 'profit' ? 'bestPulse 2.5s ease-in-out infinite' : 'none',
                      }}
                      onMouseEnter={e => {
                        if (cell) {
                          e.currentTarget.style.transform = 'scale(1.12)';
                          e.currentTarget.style.filter    = 'brightness(1.35)';
                          e.currentTarget.style.zIndex    = '10';
                        }
                        handleCellEnter(e, cell, dayIdx, hour);
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = '';
                        e.currentTarget.style.filter    = '';
                        e.currentTarget.style.zIndex    = '';
                        handleCellLeave();
                      }}
                      onClick={() => cell && setModalCell(cell)}>

                      {cell && label && (
                        <span style={{
                          fontSize: 10.5, fontWeight: 900, color: '#fff',
                          lineHeight: 1, letterSpacing: '-0.3px',
                          textShadow: '0 0 8px rgba(0,0,0,1), 0 1px 3px rgba(0,0,0,1)',
                          whiteSpace: 'nowrap',
                        }}>
                          {label}
                        </span>
                      )}
                      {cell && mode !== 'count' && cell.count > 0 && label && (
                        <span style={{
                          fontSize: 8, fontWeight: 700,
                          color: 'rgba(255,255,255,0.85)', lineHeight: 1,
                          textShadow: '0 1px 3px rgba(0,0,0,1)',
                        }}>
                          {cell.count}t
                        </span>
                      )}
                    </div>
                  );
                })}
              </>
            ))}
          </div>

          {/* Gradient legend */}
          <div className="flex items-center gap-4 pt-3 pb-2 flex-wrap">
            {mode === 'profit' && (
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 9, color: MUTE }}>Loss</span>
                <div style={{
                  width: 96, height: 6, borderRadius: 3,
                  background: 'linear-gradient(to right, rgba(239,68,68,0.9), rgba(239,68,68,0.1) 50%, rgba(34,197,94,0.1) 50%, rgba(34,197,94,0.9))',
                }} />
                <span style={{ fontSize: 9, color: MUTE }}>Profit</span>
              </div>
            )}
            {mode === 'winrate' && (
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 9, color: MUTE }}>0%</span>
                <div style={{
                  width: 96, height: 6, borderRadius: 3,
                  background: 'linear-gradient(to right, rgba(239,68,68,0.8), rgba(245,158,11,0.7), rgba(34,197,94,0.9))',
                }} />
                <span style={{ fontSize: 9, color: MUTE }}>100%</span>
              </div>
            )}
            {mode === 'count' && (
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 9, color: MUTE }}>Low</span>
                <div style={{
                  width: 96, height: 6, borderRadius: 3,
                  background: 'linear-gradient(to right, rgba(99,102,241,0.15), rgba(99,102,241,0.9))',
                }} />
                <span style={{ fontSize: 9, color: MUTE }}>High</span>
              </div>
            )}
            <div className="flex items-center gap-3 ml-2">
              {SESSIONS.map(s => (
                <div key={s.label} className="flex items-center gap-1">
                  <div style={{ width: 12, height: 3, borderRadius: 1, backgroundColor: s.color, opacity: 0.7 }} />
                  <span style={{ fontSize: 9, color: MUTE }}>{s.label}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <div style={{ width: 8, height: 8, borderRadius: 2, border: '1px solid #22c55e66', boxShadow: '0 0 4px #22c55e55' }} />
              <span style={{ fontSize: 9, color: MUTE }}>Best cell</span>
              <span style={{ fontSize: 9, color: '#334155', marginLeft: 8 }}>Click cell for details</span>
            </div>
          </div>
        </div>

        {/* AI INSIGHTS */}
        {insights.length > 0 && (
          <div style={{ borderTop: `1px solid ${BORD}`, backgroundColor: SURF, padding: '10px 16px' }}>
            <div className="flex items-center gap-2 mb-2">
              <span style={{ fontSize: 10, color: MUTE, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                AI Insights
              </span>
              <div style={{ flex: 1, height: 1, backgroundColor: BORD }} />
            </div>
            <div className="flex flex-col gap-1.5">
              {insights.map((ins, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div style={{
                    width: 7, height: 7, borderRadius: '50%', marginTop: 3, flexShrink: 0,
                    backgroundColor: ins.type === 'positive' ? '#22c55e' : ins.type === 'negative' ? '#ef4444' : '#6366f1',
                  }} />
                  <span style={{
                    fontSize: 11, lineHeight: 1.5,
                    color: ins.type === 'positive' ? '#86efac' : ins.type === 'negative' ? '#fca5a5' : SUBT,
                  }}>
                    {ins.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* TOOLTIP */}
      {tooltip && (
        <div ref={tooltipRef} className="fixed z-50 rounded-lg pointer-events-none"
          style={{
            top: tooltip.y - 125,
            left: tooltip.x,
            transform: 'translateX(-50%)',
            backgroundColor: SURF,
            border: `1px solid ${BORD}`,
            padding: '8px 12px',
            minWidth: 152,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          }}>
          <div style={{ position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)', width: 8, height: 8, backgroundColor: SURF, border: `1px solid ${BORD}`, borderTop: 'none', borderLeft: 'none', rotate: '45deg' }} />
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold" style={{ color: TEXT, fontSize: 12 }}>
              {tooltip.cell.day_name}{' '}
              <span style={{ color: sessionOf(tooltip.cell.hour).color }}>
                {String(tooltip.cell.hour).padStart(2,'0')}:00
              </span>
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: BORD, color: MUTE }}>
              {sessionOf(tooltip.cell.hour).label}
            </span>
          </div>
          {[
            ['Trades',    tooltip.cell.count,    SUBT],
            ['P&L',       fmt$(tooltip.cell.profit), tooltip.cell.profit >= 0 ? '#22c55e' : '#ef4444'],
            ['Win Rate',  tooltip.cell.win_rate != null ? `${tooltip.cell.win_rate.toFixed(1)}%` : '--',
                          tooltip.cell.win_rate >= 50 ? '#22c55e' : '#ef4444'],
            ['Avg Trade', tooltip.cell.avg_trade != null ? fmt$(tooltip.cell.avg_trade) : '--',
                          (tooltip.cell.avg_trade ?? 0) >= 0 ? '#22c55e' : '#ef4444'],
          ].map(([label, val, color]) => (
            <div key={label} className="flex justify-between items-center gap-6" style={{ marginBottom: 2 }}>
              <span style={{ fontSize: 10, color: MUTE }}>{label}</span>
              <strong style={{ fontSize: 11, color, fontFamily: 'monospace' }}>{val}</strong>
            </div>
          ))}
          <div className="mt-1.5 pt-1.5" style={{ borderTop: `1px solid ${BORD}`, fontSize: 9, color: MUTE, textAlign: 'center' }}>
            Click cell for full details
          </div>
        </div>
      )}

      {/* CELL MODAL */}
      {modalCell && <CellModal cell={modalCell} onClose={() => setModalCell(null)} />}

      <style>{`
        @keyframes bestPulse {
          0%, 100% { box-shadow: 0 0 6px #22c55e44; }
          50%       { box-shadow: 0 0 14px #22c55e99; }
        }
      `}</style>
    </>
  );
}
