import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

// -- Constants -----------------------------------------------------------
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const SESSIONS = [
  { label: 'Asian',     start: 0,  end: 7,  color: '#38bdf8' },
  { label: 'London',    start: 8,  end: 12, color: '#818cf8' },
  { label: 'New York',  start: 13, end: 17, color: '#f59e0b' },
  { label: 'Off-Hours', start: 18, end: 23, color: '#94a3b8' },
];

const PERIODS = [
  { key: 'week',  label: 'This Week'     },
  { key: 'month', label: 'This Month'    },
  { key: 'prev3', label: 'Last 3 Months' },
  { key: 'all',   label: 'All Time'      },
];

const DAYS      = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const HOUR_TICKS = new Set([0, 3, 6, 9, 12, 15, 18, 21]);
const CELL_W    = 38;
const CELL_H    = 38;

// -- Helpers -------------------------------------------------------------
const lerp  = (a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t));
const fmt$  = v => (v >= 0 ? '+' : '') + Number(v).toFixed(2);

function sessionOf(hour) {
  return SESSIONS.find(s => hour >= s.start && hour <= s.end) ?? SESSIONS[3];
}

/** Parse "YYYY-MM-DD HH:MM:SS" or ISO string safely */
function parseDt(raw) {
  if (!raw) return null;
  const s = (typeof raw === 'string' ? raw.trim() : String(raw)).replace(' ', 'T');
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/** Return { start, end, label } for a given period + backward-nav offset */
function computeRange(period, navOffset) {
  const now = new Date();

  if (period === 'all') {
    return { start: null, end: null, label: 'All Time' };
  }

  if (period === 'week') {
    const jsDay   = now.getDay(); // 0=Sun
    const diffMon = jsDay === 0 ? -6 : 1 - jsDay;
    const mon = new Date(now);
    mon.setDate(now.getDate() + diffMon - navOffset * 7);
    mon.setHours(0, 0, 0, 0);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    sun.setHours(23, 59, 59, 999);
    const label =
      navOffset === 0
        ? 'This Week'
        : `${MONTH_NAMES[mon.getMonth()].slice(0,3)} ${mon.getDate()}–${sun.getDate()}`;
    return { start: mon, end: sun, label };
  }

  if (period === 'month') {
    const d     = new Date(now.getFullYear(), now.getMonth() - navOffset, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end   = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end, label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}` };
  }

  // prev3
  const endM  = new Date(now.getFullYear(), now.getMonth() - navOffset, 1);
  const start = new Date(endM.getFullYear(), endM.getMonth() - 2, 1);
  const end   = new Date(endM.getFullYear(), endM.getMonth() + 1, 0, 23, 59, 59, 999);
  const sLbl  = `${MONTH_NAMES[start.getMonth()].slice(0,3)} ${start.getFullYear()}`;
  const eLbl  = `${MONTH_NAMES[endM.getMonth()].slice(0,3)} ${endM.getFullYear()}`;
  return { start, end, label: `${sLbl} – ${eLbl}` };
}

/** Aggregate raw trades into heatmap cells using *actual* calendar dates */
function buildHeatmap(trades, startDate, endDate) {
  const cells = {};
  for (const t of trades) {
    const dt = parseDt(t.close_time || t.open_time);
    if (!dt) continue;
    if (startDate && dt < startDate) continue;
    if (endDate   && dt > endDate)   continue;

    const jsDay  = dt.getDay();                        // 0=Sun…6=Sat
    const dayIdx = jsDay === 0 ? 6 : jsDay - 1;       // 0=Mon…6=Sun
    const hour   = dt.getHours();
    const key    = `${dayIdx}_${hour}`;

    if (!cells[key]) {
      cells[key] = { day: dayIdx, hour, profit: 0, trades: 0, wins: 0, losses: 0, dates: [] };
    }
    const profit = parseFloat(t.profit) || 0;
    cells[key].profit += profit;
    cells[key].trades += 1;
    if (profit > 0)      cells[key].wins++;
    else if (profit < 0) cells[key].losses++;

    const dateStr = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (!cells[key].dates.includes(dateStr)) cells[key].dates.push(dateStr);
  }
  return Object.values(cells).map(c => ({
    ...c,
    win_rate:  c.trades > 0 ? (c.wins / c.trades) * 100 : 0,
    avg_trade: c.trades > 0 ? c.profit / c.trades : 0,
  }));
}

// -- Color functions -----------------------------------------------------
function profitColor(value) {
  if (value == null || value === 0) return null;
  if (value >= 50)  return 'rgba(34,197,94,0.90)';
  if (value >= 1)   return `rgba(34,197,94,${lerp(0.42, 0.85, value / 50).toFixed(2)})`;
  if (value > -50)  return `rgba(239,68,68,${lerp(0.42, 0.85, Math.abs(value) / 50).toFixed(2)})`;
  return 'rgba(239,68,68,0.90)';
}

function winRateColor(wr) {
  if (wr >= 70) return `rgba(34,197,94,${lerp(0.55, 0.90, (wr - 70) / 30).toFixed(2)})`;
  if (wr >= 50) return `rgba(34,197,94,${lerp(0.25, 0.50, (wr - 50) / 20).toFixed(2)})`;
  if (wr >= 30) return `rgba(239,68,68,${lerp(0.25, 0.55, (50 - wr)  / 20).toFixed(2)})`;
  return `rgba(239,68,68,${lerp(0.55, 0.90, (30 - wr) / 30).toFixed(2)})`;
}

function volumeColor(count, maxCount) {
  if (!count || !maxCount) return null;
  return `rgba(99,102,241,${lerp(0.20, 0.85, count / maxCount).toFixed(2)})`;
}

// -- Stats & insights ----------------------------------------------------
function computeStats(heatmap) {
  if (!heatmap.length) {
    return { totalTrades: 0, totalProfit: 0, winRate: 0, bestDay: null, worstDay: null, bestHour: null };
  }
  const tot   = { totalTrades: 0, totalProfit: 0, wins: 0 };
  const byDay  = {};
  const byHour = {};

  for (const c of heatmap) {
    tot.totalTrades  += c.trades;
    tot.totalProfit  += c.profit;
    tot.wins         += c.wins;
    if (!byDay[c.day])    byDay[c.day]    = { profit: 0, trades: 0 };
    if (!byHour[c.hour]) byHour[c.hour]  = { profit: 0, trades: 0 };
    byDay[c.day].profit    += c.profit; byDay[c.day].trades    += c.trades;
    byHour[c.hour].profit  += c.profit; byHour[c.hour].trades  += c.trades;
  }
  const dayArr  = Object.entries(byDay).map(([d, v]) => ({ day: +d, ...v }));
  const hourArr = Object.entries(byHour).map(([h, v]) => ({ hour: +h, ...v }));
  return {
    totalTrades: tot.totalTrades,
    totalProfit: tot.totalProfit,
    winRate: tot.totalTrades ? (tot.wins / tot.totalTrades) * 100 : 0,
    bestDay:   [...dayArr].sort((a, b) => b.profit - a.profit)[0]  ?? null,
    worstDay:  [...dayArr].sort((a, b) => a.profit - b.profit)[0]  ?? null,
    bestHour:  [...hourArr].sort((a, b) => b.profit - a.profit)[0] ?? null,
  };
}

function generateInsightCards(heatmap) {
  if (!heatmap.length) return [];

  const byDay = {};
  for (const c of heatmap) {
    if (!byDay[c.day]) byDay[c.day] = { profit: 0, trades: 0, wins: 0 };
    byDay[c.day].profit += c.profit;
    byDay[c.day].trades += c.trades;
    byDay[c.day].wins   += c.wins;
  }
  const dayArr  = Object.entries(byDay)
    .map(([d, v]) => ({ day: +d, name: DAYS[+d], ...v, wr: v.trades ? (v.wins / v.trades) * 100 : 0 }))
    .sort((a, b) => b.profit - a.profit);
  const best    = dayArr[0];
  const worst   = dayArr[dayArr.length - 1];
  const peakHr  = [...heatmap].sort((a, b) => b.profit - a.profit)[0];
  const weakHr  = [...heatmap].sort((a, b) => a.profit - b.profit)[0];

  const cards = [];

  if (best) {
    cards.push({
      type: 'best', title: 'Best Performance', icon: '📈',
      headline: `${best.name} is your strongest day`,
      detail:   `${fmt$(best.profit)} profit · ${best.wr.toFixed(0)}% win rate`,
      color: '#4ade80', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.25)',
    });
  }
  if (worst && worst.day !== best?.day) {
    cards.push({
      type: 'worst', title: 'Worst Performance', icon: '📉',
      headline: `${worst.name} drags your results`,
      detail:   `${fmt$(worst.profit)} total · ${worst.wr.toFixed(0)}% win rate`,
      color: '#f87171', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)',
    });
  }
  if (weakHr && weakHr.trades >= 2 && weakHr.profit < -20) {
    const sess = sessionOf(weakHr.hour);
    cards.push({
      type: 'warning', title: 'Pattern Warning', icon: '⚠️',
      headline: `${weakHr.hour}:00 during ${sess.label} is costly`,
      detail:   `${fmt$(weakHr.profit)} on ${weakHr.trades} trades — consider avoiding`,
      color: '#fbbf24', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)',
    });
  }
  if (peakHr) {
    const sess = sessionOf(peakHr.hour);
    cards.push({
      type: 'rec', title: 'Recommendation', icon: '🎯',
      headline: `Focus on ${peakHr.hour}:00 (${sess.label} session)`,
      detail:   `Peak hour: ${fmt$(peakHr.profit)} on ${peakHr.trades} trades`,
      color: '#34d399', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)',
    });
  }
  return cards;
}

// -- CellModal -----------------------------------------------------------
function CellModal({ cell, mode, onClose }) {
  const sess = sessionOf(cell.hour);
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#0f1923', border: '1px solid #1e2d3d', borderRadius: 14,
          padding: '22px 26px', width: 310, boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 15 }}>
              {DAYS[cell.day]}&nbsp;·&nbsp;{cell.hour}:00
            </div>
            <div style={{ color: sess.color, fontSize: 12, marginTop: 2 }}>{sess.label} Session</div>
          </div>
          <button
            onClick={onClose}
            style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}
          >×</button>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          {[
            { label: 'P&L',       val: fmt$(cell.profit),                  color: cell.profit >= 0 ? '#4ade80' : '#f87171' },
            { label: 'Trades',    val: cell.trades,                        color: '#93c5fd' },
            { label: 'Win Rate',  val: `${(cell.win_rate ?? 0).toFixed(0)}%`, color: '#a78bfa' },
            { label: 'Avg Trade', val: fmt$(cell.avg_trade ?? 0),          color: (cell.avg_trade ?? 0) >= 0 ? '#4ade80' : '#f87171' },
          ].map(m => (
            <div key={m.label} style={{ background: '#0b1322', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ color: '#64748b', fontSize: 11, marginBottom: 3 }}>{m.label}</div>
              <div style={{ color: m.color, fontWeight: 700, fontSize: 14 }}>{m.val}</div>
            </div>
          ))}
        </div>

        {/* Occurred-on dates */}
        {cell.dates && cell.dates.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ color: '#64748b', fontSize: 11, marginBottom: 6 }}>OCCURRED ON</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {cell.dates.slice(0, 12).map(d => (
                <span key={d} style={{ background: '#1e2d3d', color: '#94a3b8', borderRadius: 5, padding: '2px 8px', fontSize: 11 }}>
                  {d}
                </span>
              ))}
              {cell.dates.length > 12 && (
                <span style={{ color: '#64748b', fontSize: 11, alignSelf: 'center' }}>
                  +{cell.dates.length - 12} more
                </span>
              )}
            </div>
          </div>
        )}

        <div style={{ color: '#475569', fontSize: 11, marginTop: 6 }}>
          {cell.wins}W / {cell.losses}L
          {mode === 'profit' && cell.trades > 0 && ` · ${((cell.wins / cell.trades) * 100).toFixed(0)}% win`}
        </div>
      </div>
    </div>
  );
}

// -- Main Component -------------------------------------------------------
export default function MT5HeatmapChart({ trades = [], heatmap: legacyHeatmap = [] }) {
  const { theme } = useTheme();
  const [mode,      setMode]      = useState('profit');  // 'profit' | 'winrate' | 'volume'
  const [selCell,   setSelCell]   = useState(null);
  const [hovCell,   setHovCell]   = useState(null);
  const [period,    setPeriod]    = useState('month');
  const [navOffset, setNavOffset] = useState(0);
  const containerRef = useRef(null);
  const scrollRef    = useRef(null);

  // Use raw trades when available (fixes date-mapping bug)
  const useLiveTrades = trades.length > 0;

  const { start: rangeStart, end: rangeEnd, label: rangeLabel } = useMemo(
    () => computeRange(period, navOffset),
    [period, navOffset],
  );

  const heatmap = useMemo(() => {
    if (useLiveTrades) return buildHeatmap(trades, rangeStart, rangeEnd);
    return legacyHeatmap;
  }, [useLiveTrades, trades, legacyHeatmap, rangeStart, rangeEnd]);

  const stats        = useMemo(() => computeStats(heatmap),         [heatmap]);
  const insightCards = useMemo(() => generateInsightCards(heatmap), [heatmap]);
  const noDataInRange = heatmap.length === 0;
  const maxCount      = useMemo(() => Math.max(0, ...heatmap.map(c => c.trades)), [heatmap]);

  const cellMap = useMemo(() => {
    const m = {};
    for (const c of heatmap) m[`${c.day}_${c.hour}`] = c;
    return m;
  }, [heatmap]);

  const bestCell = useMemo(
    () => heatmap.length ? [...heatmap].sort((a, b) => b.profit - a.profit)[0] : null,
    [heatmap],
  );

  const onPeriodChange = useCallback((p) => {
    setPeriod(p);
    setNavOffset(0);
  }, []);

  const canGoForward = navOffset > 0;

  const cellBg = useCallback((cell) => {
    if (!cell) return null;
    if (mode === 'profit')  return profitColor(cell.profit);
    if (mode === 'winrate') return winRateColor(cell.win_rate);
    return volumeColor(cell.trades, maxCount);
  }, [mode, maxCount]);

  // Theme colours
  const isDark = theme !== 'light';
  const bg0    = isDark ? '#060a12' : '#f8fafc';
  const bg1    = isDark ? '#0b1322' : '#ffffff';
  const bg2    = isDark ? '#111827' : '#f1f5f9';
  const border = isDark ? '#1e2d3d' : '#e2e8f0';
  const text0  = isDark ? '#e2e8f0' : '#1e293b';
  const text1  = isDark ? '#94a3b8' : '#64748b';

  return (
    <div
      ref={containerRef}
      style={{ background: bg0, borderRadius: 16, padding: '20px 18px', border: `1px solid ${border}` }}
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <div>
          <h3 style={{ color: text0, fontWeight: 700, fontSize: 15, margin: 0 }}>Trading Activity Heatmap</h3>
          <p style={{ color: text1, fontSize: 12, margin: '3px 0 0' }}>Click any cell for details</p>
        </div>

        {/* Mode tabs */}
        <div style={{ display: 'flex', background: bg2, borderRadius: 8, padding: 2, gap: 2 }}>
          {[['profit','P&L'],['winrate','Win %'],['volume','Volume']].map(([m, lbl]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11,
                background: mode === m ? '#1e3a5f' : 'transparent',
                color:      mode === m ? '#93c5fd' : text1,
                fontWeight: mode === m ? 600 : 400,
                transition: 'all 0.15s',
              }}
            >{lbl}</button>
          ))}
        </div>
      </div>

      {/* ── Period selector + nav arrows (live trades only) ─────────── */}
      {useLiveTrades && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {PERIODS.map(p => (
              <button
                key={p.key}
                onClick={() => onPeriodChange(p.key)}
                style={{
                  padding: '4px 11px', borderRadius: 6,
                  border: `1px solid ${period === p.key ? '#3b82f6' : border}`,
                  background: period === p.key ? 'rgba(59,130,246,0.15)' : bg2,
                  color:      period === p.key ? '#60a5fa' : text1,
                  cursor: 'pointer', fontSize: 11,
                  fontWeight: period === p.key ? 600 : 400,
                  transition: 'all 0.15s',
                }}
              >{p.label}</button>
            ))}
          </div>

          {period !== 'all' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => setNavOffset(n => n + 1)}
                style={{ background: bg2, border: `1px solid ${border}`, borderRadius: 6, color: text1, cursor: 'pointer', padding: '3px 7px', display: 'flex', alignItems: 'center' }}
              ><ChevronLeft size={13} /></button>

              <span style={{ color: text0, fontSize: 12, fontWeight: 600, minWidth: 140, textAlign: 'center' }}>
                {rangeLabel}
              </span>

              <button
                onClick={() => setNavOffset(n => n - 1)}
                disabled={!canGoForward}
                style={{
                  background: bg2, border: `1px solid ${border}`, borderRadius: 6,
                  color:  canGoForward ? text1 : '#334155',
                  cursor: canGoForward ? 'pointer' : 'default',
                  padding: '3px 7px', display: 'flex', alignItems: 'center',
                }}
              ><ChevronRight size={13} /></button>
            </div>
          )}
        </div>
      )}

      {/* ── Summary stats bar ────────────────────────────────────────── */}
      {stats.totalTrades > 0 && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
          {[
            { label: 'Trades',    val: stats.totalTrades,                color: '#93c5fd' },
            { label: 'Total P&L', val: fmt$(stats.totalProfit),          color: stats.totalProfit >= 0 ? '#4ade80' : '#f87171' },
            { label: 'Win Rate',  val: `${stats.winRate.toFixed(1)}%`,   color: '#a78bfa' },
          ].map(s => (
            <div key={s.label} style={{ background: bg1, border: `1px solid ${border}`, borderRadius: 8, padding: '7px 14px' }}>
              <div style={{ color: text1, fontSize: 10, marginBottom: 2 }}>{s.label}</div>
              <div style={{ color: s.color, fontWeight: 700, fontSize: 13 }}>{s.val}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Session colour key ──────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 14 }}>
        {SESSIONS.map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color, opacity: 0.85 }} />
            <span style={{ color: text1, fontSize: 11 }}>{s.label} ({s.start}–{s.end}h)</span>
          </div>
        ))}
      </div>

      {/* ── No-data state ───────────────────────────────────────────── */}
      {noDataInRange && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: text1 }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
          <div style={{ fontWeight: 600, color: text0, marginBottom: 6 }}>No trades in {rangeLabel}</div>
          <div style={{ fontSize: 12 }}>Try a different date range or import more trades.</div>
        </div>
      )}

      {/* ── Heatmap grid ────────────────────────────────────────────── */}
      {!noDataInRange && (
        <div ref={scrollRef} style={{ overflowX: 'auto', marginLeft: 34 }}>
          {/* Session colour bars above hour labels */}
          <div style={{ display: 'flex', marginBottom: 4, height: 6 }}>
            {Array.from({ length: 24 }, (_, h) => {
              const sess = sessionOf(h);
              const prevSess = h > 0 ? sessionOf(h - 1) : null;
              return (
                <div
                  key={h}
                  style={{
                    width: CELL_W + 3, flexShrink: 0,
                    background: sess.color, opacity: 0.55,
                    borderLeft: prevSess && prevSess.label !== sess.label ? '2px solid #0b1322' : 'none',
                  }}
                />
              );
            })}
          </div>

          {/* Hour labels */}
          <div style={{ display: 'flex', marginBottom: 3 }}>
            {Array.from({ length: 24 }, (_, h) => (
              <div
                key={h}
                style={{
                  width: CELL_W + 3, flexShrink: 0, textAlign: 'center',
                  color: HOUR_TICKS.has(h) ? text1 : 'transparent', fontSize: 9,
                }}
              >{h}</div>
            ))}
          </div>

          {/* Day rows */}
          {DAYS.map((dayLabel, di) => (
            <div key={di} style={{ display: 'flex', position: 'relative', marginBottom: 3 }}>
              {/* Day label */}
              <div
                style={{
                  position: 'absolute', left: -34, width: 30, textAlign: 'right',
                  top: '50%', transform: 'translateY(-50%)',
                  color: text1, fontSize: 11, fontWeight: 500,
                }}
              >{dayLabel}</div>

              {/* Hour cells */}
              {Array.from({ length: 24 }, (_, h) => {
                const cell   = cellMap[`${di}_${h}`];
                const isBest = bestCell && cell && cell.day === bestCell.day && cell.hour === bestCell.hour;
                const isHov  = hovCell?.day === di && hovCell?.hour === h;
                const bg     = isHov && cell ? 'rgba(255,255,255,0.12)' : cellBg(cell);

                // Format compact value for display inside cell
                const cellLabel = cell
                  ? mode === 'volume'
                    ? String(cell.trades)
                    : mode === 'winrate'
                    ? `${Math.round(cell.win_rate)}%`
                    : Math.abs(cell.profit) >= 1000
                    ? `${cell.profit >= 0 ? '+' : ''}${(cell.profit / 1000).toFixed(1)}k`
                    : `${cell.profit >= 0 ? '+' : ''}${Math.round(cell.profit)}`
                  : null;

                return (
                  <div
                    key={h}
                    onClick={() => cell && setSelCell(cell)}
                    onMouseEnter={() => cell && setHovCell({ day: di, hour: h })}
                    onMouseLeave={() => setHovCell(null)}
                    style={{
                      width: CELL_W, height: CELL_H, flexShrink: 0,
                      marginRight: 3,
                      background:   bg || bg2,
                      borderRadius: 5,
                      cursor: cell ? 'pointer' : 'default',
                      border: isBest && mode === 'profit'
                        ? '1.5px solid rgba(250,204,21,0.5)'
                        : `1px solid ${cell ? border : 'transparent'}`,
                      boxShadow: isBest && mode === 'profit' ? '0 0 10px rgba(250,204,21,0.3)' : 'none',
                      animation:  isBest && mode === 'profit' ? 'goldPulse 2.5s ease-in-out infinite' : 'none',
                      transition: 'transform 0.1s, box-shadow 0.1s',
                      transform:  isHov && cell ? 'scale(1.08)' : 'scale(1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    {cellLabel && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, lineHeight: 1,
                        color: 'rgba(255,255,255,0.92)',
                        textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                        pointerEvents: 'none', userSelect: 'none',
                        whiteSpace: 'nowrap',
                      }}>{cellLabel}</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* ── Legend ──────────────────────────────────────────────────── */}
      {!noDataInRange && (
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
          {mode === 'profit' && (
            <>
              <span style={{ color: text1, fontSize: 10 }}>Loss (−$50+)</span>
              {[0,1,2,3,4,5,6].map(i => (
                <div key={i} style={{
                  width: 18, height: 14, borderRadius: 3,
                  background: i < 3
                    ? `rgba(239,68,68,${lerp(0.85, 0.42, i / 2).toFixed(2)})`
                    : i > 3
                    ? `rgba(34,197,94,${lerp(0.42, 0.85, (i - 3) / 3).toFixed(2)})`
                    : bg2,
                }} />
              ))}
              <span style={{ color: text1, fontSize: 10 }}>Profit (+$50+)</span>
            </>
          )}
          {mode === 'winrate' && (
            <>
              <span style={{ color: text1, fontSize: 10 }}>0%</span>
              {[0,25,50,75,100].map(v => (
                <div key={v} style={{ width: 18, height: 14, borderRadius: 3, background: winRateColor(v) }} />
              ))}
              <span style={{ color: text1, fontSize: 10 }}>100%</span>
            </>
          )}
          {mode === 'volume' && (
            <>
              <span style={{ color: text1, fontSize: 10 }}>Low</span>
              {[0.2,0.4,0.6,0.8,1.0].map(t => (
                <div key={t} style={{ width: 18, height: 14, borderRadius: 3, background: `rgba(99,102,241,${lerp(0.20, 0.85, t).toFixed(2)})` }} />
              ))}
              <span style={{ color: text1, fontSize: 10 }}>High</span>
            </>
          )}
        </div>
      )}

      {/* ── AI Insight Cards ────────────────────────────────────────── */}
      {insightCards.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h4 style={{ color: text1, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>
            AI INSIGHTS
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {insightCards.map((card, i) => (
              <div
                key={i}
                style={{ background: card.bg, border: `1px solid ${card.border}`, borderRadius: 10, padding: '12px 14px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 14 }}>{card.icon}</span>
                  <span style={{ color: card.color, fontSize: 11, fontWeight: 700 }}>{card.title}</span>
                </div>
                <div style={{ color: text0, fontSize: 12, fontWeight: 600, marginBottom: 3 }}>{card.headline}</div>
                <div style={{ color: text1, fontSize: 11 }}>{card.detail}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cell detail modal */}
      {selCell && <CellModal cell={selCell} mode={mode} onClose={() => setSelCell(null)} />}

      {/* Keyframe animation */}
      <style>{`
        @keyframes goldPulse {
          0%, 100% { box-shadow: 0 0 8px  rgba(250,204,21,0.30); }
          50%       { box-shadow: 0 0 18px rgba(250,204,21,0.55); }
        }
      `}</style>
    </div>
  );
}
