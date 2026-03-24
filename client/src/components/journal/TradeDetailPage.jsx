import { useState } from 'react';
import {
  ArrowLeft, ChevronLeft, ChevronRight, Maximize2, X,
  MessageSquare, Sparkles, Camera,
  BarChart2, Activity, ArrowUpRight, ArrowDownRight, Pencil, TrendingUp,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import TradeEntryForm from './TradeEntryForm';
import TradeContextReport from './TradeContextReport';

const MONO = { fontFamily: "'ui-monospace','Cascadia Code','SF Mono','Consolas',monospace" };

/* ─── Pill badge ──────────────────────────────────────────────────── */
function Pill({ children, color, bg, border }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ color, backgroundColor: bg, border: `1px solid ${border}`, fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em' }}
    >
      {children}
    </span>
  );
}

/* ─── Sidebar stat line ────────────────────────────────────────────── */
function StatLine({ label, value, valueColor, mono = true, hideIfEmpty = false }) {
  const theme = useTheme();
  if (hideIfEmpty && !value) return null;
  return (
    <div
      className="flex items-center justify-between"
      style={{ padding: '10px 0', borderBottom: `1px solid ${theme.isDark ? '#111' : theme.border}` }}
    >
      <span
        className="uppercase"
        style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', color: theme.isDark ? '#555' : theme.muted }}
      >
        {label}
      </span>
      <span
        style={{ fontSize: '15px', fontWeight: 700, color: valueColor || (theme.isDark ? '#e8e8e8' : theme.text), ...(mono ? MONO : {}) }}
      >
        {value || '—'}
      </span>
    </div>
  );
}

/* ─── Card wrapper ────────────────────────────────────────────────── */
function Card({ children, className = '', style = {} }) {
  const theme = useTheme();
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{
        backgroundColor: theme.surface,
        border: `1px solid ${theme.border}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Section label inside a card ────────────────────────────────── */
function CardLabel({ icon: Icon, label, accent, right }) {
  const theme = useTheme();
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span
        className="uppercase"
        style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', color: theme.isDark ? '#444' : theme.muted }}
      >
        {label}
      </span>
      {right && <div className="ml-auto">{right}</div>}
    </div>
  );
}

/* ─── Individual note entry inside the notes card ────────────────── */
function NoteEntry({ label, value, dotColor, isLast }) {
  const theme = useTheme();
  if (!value) return null;
  return (
    <div
      style={{
        padding: '16px 0',
        borderBottom: isLast ? 'none' : `1px solid ${theme.border}`,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="flex-shrink-0 rounded-full"
          style={{ width: '6px', height: '6px', backgroundColor: dotColor }}
        />
        <span
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: dotColor }}
        >
          {label}
        </span>
      </div>
      <p
        className="text-[13px] leading-relaxed"
        style={{
          color: theme.isDark ? 'rgba(250,250,250,0.78)' : theme.text,
          lineHeight: '1.8',
          paddingLeft: '14px',
        }}
      >
        {value}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Main component
═══════════════════════════════════════════════════════════════════ */
export default function TradeDetailPage({ trade, trades, tradeIndex, onBack, onNavigate, onSaved }) {
  const theme = useTheme();
  const [imgFullscreen, setImgFullscreen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  if (!trade) return null;

  let aiData = null;
  try {
    aiData = trade.ai_analysis
      ? (typeof trade.ai_analysis === 'string' ? JSON.parse(trade.ai_analysis) : trade.ai_analysis)
      : null;
  } catch { /* ignore */ }

  const pnl     = parseFloat(trade.profit_loss);
  const isWin   = trade.outcome === 'win';
  const isLoss  = trade.outcome === 'loss';
  const isBuy   = (trade.direction || '').toLowerCase() === 'buy';
  const hasPrev = tradeIndex > 0;
  const hasNext = tradeIndex < trades.length - 1;

  const pnlColor    = isWin ? '#10B981' : isLoss ? '#F43F5E' : '#f59e0b';
  const dirColor    = isBuy ? '#10B981' : '#F43F5E';
  const dirColorDim = isBuy ? '#10B98115' : '#F43F5E15';
  const dirBorder   = isBuy ? '#10B98140' : '#F43F5E40';

  const outcomeColorMap = { win: '#10B981', loss: '#F43F5E', breakeven: '#f59e0b' };
  const outcomeColor    = outcomeColorMap[trade.outcome] || theme.muted;

  // Compute Risk:Reward ratio
  let rrRatio = null;
  try {
    const ep = parseFloat(trade.entry_price);
    const tp = parseFloat(trade.tp);
    const sl = parseFloat(trade.sl);
    if (!isNaN(ep) && !isNaN(tp) && !isNaN(sl) && ep !== sl) {
      const risk = Math.abs(ep - sl);
      const reward = Math.abs(tp - ep);
      if (risk > 0) rrRatio = `1 : ${(reward / risk).toFixed(1)}`;
    }
  } catch {}

  const date = trade.created_at ? trade.created_at.slice(0, 10) : '—';
  const time = trade.created_at
    ? (trade.created_at.includes('T')
        ? trade.created_at.split('T')[1]?.slice(0, 5)
        : trade.created_at.slice(11, 16))
    : '';

  const navBase = { color: theme.isDark ? '#888' : theme.muted, border: `1px solid ${theme.isDark ? '#1e1e1e' : theme.border}`, backgroundColor: theme.isDark ? '#111' : 'transparent', borderRadius: '7px' };
  const navIn   = e => { e.currentTarget.style.color = theme.isDark ? '#ccc' : theme.text; e.currentTarget.style.backgroundColor = theme.isDark ? '#1e1e1e' : theme.surface2; };
  const navOut  = e => { e.currentTarget.style.color = theme.isDark ? '#888' : theme.muted; e.currentTarget.style.backgroundColor = theme.isDark ? '#111' : 'transparent'; };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: theme.bg }}>

      {/* ══════════════════════════════════════════════════
          COMPACT SINGLE-ROW HEADER
      ══════════════════════════════════════════════════ */}
      <div
        className="sticky top-0 z-40 flex-shrink-0"
        style={{
          backgroundColor: theme.isDark ? 'rgba(9,9,11,0.88)' : 'rgba(255,255,255,0.88)',
          borderBottom: `1px solid ${theme.border}`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-center gap-2 px-3 sm:px-5" style={{ height: '56px' }}>

          {/* ── BACK — always visible, never inside a shrinkable container ── */}
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium flex-shrink-0 transition-colors"
            style={navBase}
            onMouseEnter={navIn}
            onMouseLeave={navOut}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="w-px h-5 flex-shrink-0" style={{ backgroundColor: theme.border }} />

          {/* ── MIDDLE: P&L · pair · badges — shrinks gracefully on small screens ── */}
          <div className="flex items-center gap-2 min-w-0 overflow-hidden flex-1">
            <span
              className="tabular-nums flex-shrink-0 leading-none"
              style={{ color: pnlColor, fontSize: '20px', fontWeight: 700, ...MONO }}
            >
              {isNaN(pnl) ? '—' : `${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}`}
            </span>

            <div className="w-px h-5 flex-shrink-0" style={{ backgroundColor: theme.border }} />

            <span className="tracking-tight flex-shrink-0" style={{ fontSize: '14px', fontWeight: 600, color: theme.isDark ? '#e8e8e8' : theme.text }}>
              {trade.pair}
            </span>

            <Pill color={outcomeColor} bg={`${outcomeColor}15`} border={`${outcomeColor}40`}>
              {(trade.outcome || 'N/A').toUpperCase()}
            </Pill>

            <span className="hidden sm:flex">
              <Pill color={dirColor} bg={dirColorDim} border={dirBorder}>
                {isBuy ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {(trade.direction || '').toUpperCase()}
              </Pill>
            </span>
          </div>

          {/* ── RIGHT: edit · date · tags · nav ── */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex-shrink-0"
              style={{ color: theme.accent, border: `1px solid ${theme.accent}44`, backgroundColor: `${theme.accent}0d` }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = `${theme.accent}1a`}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = `${theme.accent}0d`}
            >
              <Pencil className="w-3 h-3" />
              <span className="hidden sm:inline">Edit</span>
            </button>
            <span className="tabular-nums hidden sm:block" style={{ fontSize: '11px', background: theme.isDark ? '#111' : theme.surface2, border: `1px solid ${theme.isDark ? '#1e1e1e' : theme.border}`, color: theme.isDark ? '#666' : theme.muted, padding: '4px 10px', borderRadius: '6px', ...MONO }}>
              {date}{time ? ` · ${time}` : ''}
            </span>
            {trade.session && (
              <span className="hidden md:inline-flex" style={{ fontSize: '11px', background: theme.isDark ? '#111' : theme.surface2, border: `1px solid ${theme.isDark ? '#1e1e1e' : theme.border}`, color: theme.isDark ? '#666' : theme.muted, padding: '4px 10px', borderRadius: '6px' }}>
                {trade.session.replace(/_/g, ' ').toUpperCase()}
              </span>
            )}
            {trade.strategy && (
              <span className="hidden md:inline-flex" style={{ fontSize: '11px', background: theme.isDark ? '#111' : theme.surface2, border: `1px solid ${theme.isDark ? '#1e1e1e' : theme.border}`, color: theme.isDark ? '#666' : theme.muted, padding: '4px 10px', borderRadius: '6px' }}>
                {trade.strategy}
              </span>
            )}

            <div className="w-px h-5 hidden sm:block" style={{ backgroundColor: theme.border }} />

            <span className="text-xs hidden sm:inline" style={{ color: theme.muted }}>{tradeIndex + 1} / {trades.length}</span>

            <button
              onClick={() => hasPrev && onNavigate(tradeIndex - 1)}
              disabled={!hasPrev}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-25"
              style={navBase}
              onMouseEnter={e => { if (hasPrev) navIn(e); }}
              onMouseLeave={navOut}
            >
              <ChevronLeft className="w-3.5 h-3.5" /><span className="hidden sm:inline"> Prev</span>
            </button>
            <button
              onClick={() => hasNext && onNavigate(tradeIndex + 1)}
              disabled={!hasNext}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-25"
              style={navBase}
              onMouseEnter={e => { if (hasNext) navIn(e); }}
              onMouseLeave={navOut}
            >
              <span className="hidden sm:inline">Next </span><ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          AI INSIGHT BANNER
      ══════════════════════════════════════════════════ */}
      {aiData?.coach_message && (
        <div className="px-4 pt-3" style={{ maxWidth: '1440px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          {/* gradient-border wrapper: 1px gradient border via padding trick */}
          <div
            className="rounded-2xl p-px"
            style={{
              background: 'linear-gradient(135deg, rgba(14,165,233,0.75) 0%, rgba(2,132,199,0.6) 50%, rgba(59,130,246,0.75) 100%)',
            }}
          >
            <div
              className="rounded-[calc(1rem-1px)] flex items-center gap-3.5 px-5 py-3.5"
              style={{
                backgroundColor: theme.isDark ? '#040d18' : '#eff9ff',
              }}
            >
              {/* Icon */}
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.2) 0%, rgba(59,130,246,0.2) 100%)' }}
              >
                <Sparkles className="w-3.5 h-3.5" style={{ color: '#0ea5e9' }} />
              </div>
              {/* Label + message */}
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 min-w-0">
                <span
                  className="text-xs font-bold uppercase tracking-widest whitespace-nowrap flex-shrink-0"
                  style={{ color: '#0ea5e9' }}
                >
                  AI Insight
                </span>
                <span className="w-px h-3 self-center flex-shrink-0" style={{ backgroundColor: 'rgba(14,165,233,0.35)' }} />
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: theme.isDark ? 'rgba(186,230,253,0.82)' : '#0c4a6e' }}
                >
                  {aiData.coach_message}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          ASYMMETRIC BENTO GRID  70 / 30
      ══════════════════════════════════════════════════ */}
      <div className="flex-1 p-4">
        <div className="flex flex-col xl:flex-row gap-4 mx-auto" style={{ maxWidth: '1440px' }}>

          {/* ── PRIMARY — left 70% ─────────────────────── */}
          <div className="flex flex-col gap-6 xl:w-[70%]">

            {/* Hero chart card */}
            <Card style={{ overflow: 'hidden' }}>
              {/* Outcome accent line */}
              <div style={{ height: '3px', backgroundColor: outcomeColor, opacity: 0.7, borderRadius: '1rem 1rem 0 0' }} />
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: `1px solid ${theme.border}` }}
              >
                <div className="flex items-center gap-2.5">
                  <Camera className="w-4 h-4" style={{ color: theme.muted }} />
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: theme.muted }}>
                    Chart Screenshot
                  </span>
                </div>
                {trade.screenshot_path && (
                  <button
                    onClick={() => setImgFullscreen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                    style={{ color: theme.accent, border: `1px solid ${theme.accent}44`, backgroundColor: `${theme.accent}0d` }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = `${theme.accent}1a`}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = `${theme.accent}0d`}
                  >
                    <Maximize2 className="w-3 h-3" />
                    Full Screen
                  </button>
                )}
              </div>

              {trade.screenshot_path ? (
                <div className="p-3 cursor-zoom-in" onClick={() => setImgFullscreen(true)}>
                  <div
                    className="overflow-hidden rounded-xl"
                    style={{ boxShadow: `0 0 0 1px ${theme.border}, 0 8px 40px rgba(0,0,0,0.45)` }}
                  >
                    <img
                      src={resolveMediaUrl(trade.screenshot_path)}
                      alt="Trade chart"
                      className="w-full transition-transform duration-300 hover:scale-[1.012]"
                      style={{ display: 'block', backgroundColor: theme.surface2, objectFit: 'contain', objectPosition: 'top left' }}
                      onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                    />
                    <div style={{ display: 'none' }} className="items-center justify-center py-20 flex-col gap-3">
                      <Camera className="w-10 h-10 opacity-20" style={{ color: theme.muted }} />
                      <p className="text-sm" style={{ color: theme.muted }}>Screenshot unavailable</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 gap-3" style={{ color: theme.muted }}>
                  <Camera className="w-12 h-12 opacity-15" />
                  <p className="text-sm">No chart screenshot attached</p>
                </div>
              )}
            </Card>

            {/* ── Notes inline below chart ── */}
            {(trade.reasoning || trade.lessons_learned || trade.notes) && (
              <Card className="overflow-hidden">
                <div
                  className="flex items-center justify-between px-5 py-3.5"
                  style={{ borderBottom: `1px solid ${theme.border}` }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-0.5 h-4 rounded-full" style={{ backgroundColor: theme.accent }} />
                    <MessageSquare className="w-3.5 h-3.5" style={{ color: theme.accent }} />
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: theme.muted }}>Trade Notes</span>
                  </div>
                  <span
                    className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${theme.accent}12`, color: theme.accent, border: `1px solid ${theme.accent}28` }}
                  >
                    {[trade.reasoning, trade.lessons_learned, trade.notes].filter(Boolean).length}
                  </span>
                </div>
                <div className="px-5">
                  {(() => {
                    const entries = [
                      trade.reasoning       && { label: 'Reasoning',       value: trade.reasoning,       dotColor: theme.accent },
                      trade.lessons_learned && { label: 'Lessons Learned', value: trade.lessons_learned, dotColor: '#f59e0b'    },
                      trade.notes           && { label: 'Notes / Remarks', value: trade.notes,           dotColor: '#0ea5e9'    },
                    ].filter(Boolean);
                    return entries.map((e, idx) => (
                      <NoteEntry
                        key={e.label}
                        label={e.label}
                        value={e.value}
                        dotColor={e.dotColor}
                        isLast={idx === entries.length - 1}
                      />
                    ));
                  })()}
                </div>
              </Card>
            )}

          </div>

          {/* ── METRICS SIDEBAR — right 30% ────────────── */}
          <div className="flex flex-col gap-4 xl:w-[30%]">

            {/* Trade Stats + Context card */}
            <Card className="overflow-hidden">
              {/* Subtle outcome accent top */}
              <div style={{ height: '2px', background: `linear-gradient(90deg, ${outcomeColor}88 0%, transparent 100%)` }} />

              <div className="px-5 pt-4 pb-3">
                <CardLabel
                  icon={BarChart2}
                  label="Trade Stats"
                  accent={outcomeColor}
                  right={
                    rrRatio && (
                      <span
                        className="flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-md"
                        style={{ color: theme.muted, border: `1px solid ${theme.border}`, backgroundColor: theme.surface2 }}
                      >
                        <TrendingUp className="w-3 h-3" />
                        R:R {rrRatio}
                      </span>
                    )
                  }
                />
                <StatLine label="Entry"        value={trade.entry_price}                          valueColor={theme.text} />
                <StatLine label="Exit"         value={trade.exit_price}                           valueColor={theme.muted} />
                <StatLine label="Take Profit"  value={trade.tp}                                    valueColor="#10B981" />
                <StatLine label="Stop Loss"    value={trade.sl}                                    valueColor="#F43F5E" />
                <StatLine label="Position Size" value={trade.position_size ? `${trade.position_size} lots` : null} valueColor={theme.accent} mono={false} />
              </div>

              <div className="mx-5" style={{ height: '1px', backgroundColor: theme.border }} />

              <div className="px-5 pt-3 pb-4">
                <CardLabel icon={Activity} label="Context" />
                <StatLine label="Session"  value={trade.session ? trade.session.replace(/_/g, ' ').toUpperCase() : null} valueColor={theme.accent} mono={false} hideIfEmpty />
                <StatLine label="Strategy" value={trade.strategy} valueColor={theme.accent} mono={false} hideIfEmpty />
                <StatLine
                  label="Emotion"
                  value={trade.emotional_state ? trade.emotional_state.charAt(0).toUpperCase() + trade.emotional_state.slice(1) : null}
                  valueColor="#0ea5e9"
                  mono={false}
                  hideIfEmpty
                />
              </div>
            </Card>

            {/* AI Analysis */}
            {aiData && (
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  border: '1px solid rgba(14,165,233,0.22)',
                  background: theme.isDark
                    ? 'linear-gradient(160deg, #030d1a 0%, #051525 100%)'
                    : 'linear-gradient(160deg, #eff9ff 0%, #f0f9ff 100%)',
                }}
              >
                <div className="flex items-center gap-2.5 px-5 py-4" style={{ borderBottom: '1px solid rgba(14,165,233,0.14)' }}>
                  <Sparkles className="w-3.5 h-3.5" style={{ color: '#0ea5e9' }} />
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(14,165,233,0.6)' }}>
                    AI Analysis
                  </span>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {aiData.psychology_score != null && (
                      <div className="rounded-xl p-4 text-center" style={{ backgroundColor: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.18)' }}>
                        <p className="text-xs uppercase tracking-wide mb-1.5" style={{ color: 'rgba(14,165,233,0.5)' }}>Psychology</p>
                        <p className="text-2xl font-black tabular-nums" style={{ color: '#0ea5e9', ...MONO }}>
                          {aiData.psychology_score}<span className="text-xs font-normal">/10</span>
                        </p>
                      </div>
                    )}
                    {aiData.trade_quality && (
                      <div className="rounded-xl p-4 text-center" style={{ backgroundColor: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.18)' }}>
                        <p className="text-xs uppercase tracking-wide mb-1.5" style={{ color: 'rgba(14,165,233,0.5)' }}>Quality</p>
                        <p className="text-sm font-black capitalize" style={{ color: '#0ea5e9' }}>{aiData.trade_quality}</p>
                      </div>
                    )}
                  </div>
                  {aiData.coach_message && (
                    <div className="flex gap-3 p-4 rounded-xl" style={{ backgroundColor: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.14)' }}>
                      <Sparkles className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#0ea5e9' }} />
                      <p className="text-xs italic leading-relaxed" style={{ color: 'rgba(14,165,233,0.8)' }}>
                        "{aiData.coach_message}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Trade Context Report (Macro Alignment) ─── */}
            <TradeContextReport
              tradeId={trade.id}
              tradeDate={date}
            />

          </div>
        </div>
      </div>



      {/* ── Edit trade modal overlay ───────────────────────────────── */}
      {isEditing && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(6px)' }}
          onClick={() => setIsEditing(false)}
        >
          <div
            className="w-full max-w-xl flex flex-col rounded-2xl overflow-hidden"
            style={{
              maxHeight: 'calc(100vh - 48px)',
              border: `1px solid ${theme.border}`,
              boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Sticky modal header */}
            <div
              className="flex items-center justify-between px-5 py-3.5 flex-shrink-0"
              style={{
                backgroundColor: theme.surface,
                borderBottom: `1px solid ${theme.border}`,
              }}
            >
              <div className="flex items-center gap-2.5">
                <Pencil className="w-4 h-4" style={{ color: theme.accent }} />
                <span className="text-sm font-bold" style={{ color: theme.text }}>Edit Trade</span>
                <span
                  className="text-xs px-2 py-0.5 rounded-md"
                  style={{ backgroundColor: theme.surface2, color: theme.muted, border: `1px solid ${theme.border}` }}
                >
                  {trade.pair}
                </span>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: theme.muted, backgroundColor: 'transparent' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.surface2}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable form body */}
            <div
              className="overflow-y-auto flex-1"
              style={{ backgroundColor: theme.bg }}
            >
              <TradeEntryForm
                editTrade={trade}
                onSaved={() => {
                  setIsEditing(false);
                  if (onSaved) onSaved(trade.id);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Full-screen image overlay ──────────────────────────────── */}
      {imgFullscreen && trade.screenshot_path && (
        <div
          className="fixed inset-0 z-[1000] flex flex-col"
          style={{ backgroundColor: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(12px)' }}
          onClick={() => setImgFullscreen(false)}
        >
          {/* Top bar */}
          <div
            className="flex items-center justify-between px-5 flex-shrink-0"
            style={{ height: '56px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <Camera className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
              <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {trade.pair} — Chart Screenshot
              </span>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                · {date}
              </span>
            </div>
            <button
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.12)' }}
              onClick={() => setImgFullscreen(false)}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'}
            >
              <X className="w-4 h-4" />
              Close
            </button>
          </div>

          {/* Image area — click backdrop to close */}
          <div className="flex-1 flex items-center justify-center p-6 min-h-0">
            <img
              src={resolveMediaUrl(trade.screenshot_path)}
              alt="Trade chart – full screen"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: '12px',
                boxShadow: '0 0 80px rgba(0,0,0,0.8)',
                display: 'block',
              }}
              onClick={e => e.stopPropagation()}
            />
          </div>

          {/* Bottom hint */}
          <div
            className="flex items-center justify-center flex-shrink-0 pb-4"
            style={{ color: 'rgba(255,255,255,0.25)' }}
            onClick={e => e.stopPropagation()}
          >
            <span className="text-xs">Click outside image to close</span>
          </div>
        </div>
      )}
    </div>
  );
}