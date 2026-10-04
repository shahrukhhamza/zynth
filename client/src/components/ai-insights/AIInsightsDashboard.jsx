/**
 * AIInsightsDashboard — the macro intelligence page.
 *
 *  1. Verdict      bias gauge + what to do about it (trader insight) + the numbers behind it
 *  2. Markets      one card per instrument; click one to see why it is moving
 *  3. Drivers      every indicator with a contribution bar (expand for the reasoning)
 *  4. Side rail    why the market moved · price vs macro · risk alerts · data reliability · AI summary
 */
import { useEffect, useId, useState } from 'react';
import { AnimatePresence, animate, motion } from 'framer-motion';
import {
  Activity, AlertCircle, AlertTriangle, ArrowDownRight, ArrowUpRight, CheckCircle2, ChevronDown, Clock, Coins, Crosshair,
  Database, Droplet, Euro, Info, JapaneseYen, Minus, PauseCircle, PoundSterling, ShieldAlert, Sparkles, TrendingDown, TrendingUp, Zap,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { Card } from '../ui/Card';
import { Pill, Ring, SectionTitle } from '../ui/Widgets';
import { EASE, Rise, Stagger } from '../ui/motion';

/* ── helpers ─────────────────────────────────────────────────────────────── */
const GREEN = '#10b981';
const RED = '#ef4444';
const AMBER = '#f59e0b';
const GREY = '#71717a';

function relativeTime(iso) {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return null;
  if (ms < 60_000) return 'Just now';
  const m = Math.floor(ms / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function biasMeta(bias) {
  const b = String(bias || '').toLowerCase();
  if (b === 'bullish') return { label: 'Bullish', color: GREEN, icon: TrendingUp, sign: 1 };
  if (b === 'bearish') return { label: 'Bearish', color: RED, icon: TrendingDown, sign: -1 };
  if (b === 'mixed') return { label: 'Mixed', color: AMBER, icon: Activity, sign: 0 };
  return { label: 'Neutral', color: GREY, icon: Minus, sign: 0 };
}

const STRENGTH_LEVEL = { strong: 3, moderate: 2, weak: 1 };
const strengthLevel = (s) => STRENGTH_LEVEL[String(s || '').toLowerCase()] ?? 1;
const strengthLabel = (s) => ['', 'Weak', 'Moderate', 'Strong'][strengthLevel(s)];

/** Gauge needle position in [-1, 1]. */
function gaugeValue(bias, strength) {
  return biasMeta(bias).sign * [0, 0.3, 0.6, 0.9][strengthLevel(strength)];
}

function actionMeta(action) {
  if (action === 'No Trade') return { color: RED, icon: ShieldAlert, hint: 'Stay out. Conditions are not in your favour.' };
  if (action === 'Wait') return { color: AMBER, icon: PauseCircle, hint: 'No clear edge yet. Let the market show its hand.' };
  return { color: GREEN, icon: Crosshair, hint: 'Conditions support looking for setups.' };
}

const ASSETS = [
  { key: 'gold', label: 'Gold', sub: 'XAU/USD', icon: Coins },
  { key: 'EURUSD', label: 'EUR/USD', sub: 'Euro', icon: Euro },
  { key: 'GBPUSD', label: 'GBP/USD', sub: 'Pound', icon: PoundSterling },
  { key: 'USDJPY', label: 'USD/JPY', sub: 'Yen', icon: JapaneseYen },
  { key: 'oil', label: 'Oil', sub: 'WTI', icon: Droplet },
  { key: 'AUDUSD', label: 'AUD/USD', sub: 'Derived', icon: Activity },
  { key: 'USDCHF', label: 'USD/CHF', sub: 'Derived', icon: Activity },
];
const getSignal = (s, a) => (a === 'gold' ? s?.gold : a === 'oil' ? s?.commodities?.oil : s?.forex?.[a]);
const getExplanation = (s, a) => (a === 'gold' ? s?.explanation?.gold : a === 'oil' ? s?.explanation?.commodities?.oil : s?.explanation?.forex?.[a]);

const BASELINE_WEIGHTS = {
  CPI: 2.0, NFP: 1.8, FedRate: 1.8, CorePCE: 1.6, UNEMPLOYMENT: 1.2,
  GDP: 1.2, JoblessClaims: 0.8, RetailSales: 0.8, ISMManufacturing: 0.7, ConsumerConf: 0.7,
};

function pickExplanation(summary) {
  const gold = summary?.explanation?.gold?.summary;
  if (gold) return gold;
  for (const k of ['EURUSD', 'GBPUSD', 'USDJPY']) {
    const line = summary?.explanation?.forex?.[k]?.summary;
    if (line) return line;
  }
  return summary?.dataInfo?.uncertainty ?? null;
}

/* ── small parts ─────────────────────────────────────────────────────────── */
function Tint({ color, className = '', style, children }) {
  return (
    <div className={className} style={{ background: `${color}14`, border: `1px solid ${color}33`, ...style }}>
      {children}
    </div>
  );
}

function Label({ children }) {
  const theme = useTheme();
  return <div className="text-[10.5px] font-bold uppercase tracking-[0.14em]" style={{ color: theme.textMuted }}>{children}</div>;
}

function BiasGauge({ value, color }) {
  const theme = useTheme();
  const uid = useId().replace(/:/g, '');
  const [v, setV] = useState(0);
  useEffect(() => {
    const c = animate(0, value, { duration: 1.5, ease: EASE, delay: 0.2, onUpdate: setV });
    return () => c.stop();
  }, [value]);

  const cx = 130; const cy = 126; const r = 96;
  const ang = (v * 84 * Math.PI) / 180;
  const nx = cx + Math.sin(ang) * (r - 24);
  const ny = cy - Math.cos(ang) * (r - 24);
  const arc = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const ticks = [-84, -42, 0, 42, 84];

  return (
    <svg viewBox="0 0 260 156" className="mx-auto block w-full max-w-[300px]" role="img" aria-label="Macro bias gauge">
      <defs>
        <linearGradient id={`${uid}g`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={RED} />
          <stop offset="50%" stopColor="#a1a1aa" />
          <stop offset="100%" stopColor={GREEN} />
        </linearGradient>
      </defs>
      <path d={arc} fill="none" stroke={`url(#${uid}g)`} strokeOpacity="0.3" strokeWidth="16" strokeLinecap="round" />
      {ticks.map((t) => {
        const a = (t * Math.PI) / 180;
        return (
          <line
            key={t}
            x1={cx + Math.sin(a) * (r + 14)} y1={cy - Math.cos(a) * (r + 14)}
            x2={cx + Math.sin(a) * (r + 20)} y2={cy - Math.cos(a) * (r + 20)}
            stroke={theme.textMuted} strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round"
          />
        );
      })}
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={color} strokeWidth="4.5" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="10" fill={theme.surface} stroke={color} strokeWidth="4.5" />
      <text x={cx - r} y={cy + 28} textAnchor="middle" fontSize="10" fontWeight="700" letterSpacing="1.2" fill={theme.textMuted}>BEARISH</text>
      <text x={cx + r} y={cy + 28} textAnchor="middle" fontSize="10" fontWeight="700" letterSpacing="1.2" fill={theme.textMuted}>BULLISH</text>
    </svg>
  );
}

function StrengthBars({ level, color }) {
  return (
    <span className="inline-flex items-end gap-[3px]" aria-label={`Strength ${level} of 3`}>
      {[1, 2, 3].map((i) => (
        <span key={i} className="w-[5px] rounded-full" style={{ height: 6 + i * 4, background: i <= level ? color : `${color}33` }} />
      ))}
    </span>
  );
}

/* ── 1. verdict ──────────────────────────────────────────────────────────── */
function Verdict({ summary, macroScore, tradeInsight, tradeNarrative, generatedAt }) {
  const theme = useTheme();
  const bias = biasMeta(summary?.marketBias);
  const strength = strengthLabel(summary?.strength);
  const BiasIcon = bias.icon;

  const insight = tradeInsight ?? null;
  const act = actionMeta(insight?.action);
  const ActIcon = act.icon;
  const headline = tradeNarrative?.headline || (insight ? `${insight.strength ?? strength} ${insight.bias ?? bias.label} bias` : null);
  const why = tradeNarrative?.explanation || insight?.explanation || null;

  const quality = Number(macroScore?.dataConfidence ?? 45);
  const qualityColor = quality >= 70 ? GREEN : quality >= 55 ? AMBER : RED;
  const regime = (macroScore?.regime || 'MIXED').replace(/_/g, ' ');
  const uncertainty = macroScore?.uncertainty || 'Medium';
  const signal = `${macroScore?.signalStrength || 'Moderate'} · ${macroScore?.signalConfidence || 'Medium'}`;
  const explain = pickExplanation(summary);
  const released = relativeTime(summary?.dataInfo?.lastUpdated);
  const fetched = relativeTime(generatedAt ?? summary?.generatedAt ?? summary?.dataInfo?.generatedAt);

  return (
    <Card className="relative">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(ellipse 60% 90% at 12% 0%, ${bias.color}22, transparent 70%)` }} />
      <div className="relative grid gap-0 lg:grid-cols-[340px_1fr]">
        {/* left: gauge */}
        <div className="flex flex-col items-center justify-center border-b px-6 py-8 lg:border-b-0 lg:border-r" style={{ borderColor: theme.border }}>
          <Label>Macro bias</Label>
          <div className="mt-3 w-full"><BiasGauge value={gaugeValue(summary?.marketBias, summary?.strength)} color={bias.color} /></div>
          <div className="mt-1 flex items-center gap-2.5">
            <BiasIcon size={26} style={{ color: bias.color }} strokeWidth={2.4} />
            <span className="font-display text-[34px] font-bold leading-none tracking-tight" style={{ color: bias.color }}>{bias.label}</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[13px]" style={{ color: theme.textMuted }}>
            <StrengthBars level={strengthLevel(summary?.strength)} color={bias.color} /> {strength} conviction
          </div>
        </div>

        {/* right: what to do */}
        <div className="flex flex-col gap-5 px-6 py-7 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Label>Trader insight</Label>
            <div className="flex items-center gap-3 text-[11.5px]" style={{ color: theme.textMuted }}>
              {released && <span className="flex items-center gap-1"><Clock size={12} /> Data released {released}</span>}
              {fetched && <span>· Fetched {fetched}</span>}
            </div>
          </div>

          {insight ? (
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl" style={{ background: `${act.color}1f`, color: act.color, border: `1px solid ${act.color}40` }}>
                <ActIcon size={26} />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-display text-[26px] font-bold leading-none tracking-tight" style={{ color: act.color }}>{insight.action || 'Wait'}</span>
                  <span className="text-[13px]" style={{ color: theme.textMuted }}>{act.hint}</span>
                </div>
                {headline && <p className="m-0 mt-2 text-[15px] font-semibold" style={{ color: theme.text }}>{headline}</p>}
                {why && <p className="m-0 mt-1 text-[13.5px] leading-relaxed" style={{ color: theme.textMuted }}>{why}</p>}
              </div>
            </div>
          ) : (
            <p className="m-0 text-[14px] leading-relaxed" style={{ color: theme.textMuted }}>A trade recommendation will appear here once enough indicators have been released.</p>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { k: 'Signal', v: signal },
              { k: 'Uncertainty', v: uncertainty, color: uncertainty === 'High' ? AMBER : uncertainty === 'Low' ? GREEN : undefined },
              { k: 'Regime', v: regime, sub: `${macroScore?.regimeConfidence ?? 25}% confidence` },
            ].map((m) => (
              <div key={m.k} className="rounded-xl border px-3.5 py-3" style={{ background: theme.surface2, borderColor: theme.border }}>
                <Label>{m.k}</Label>
                <div className="mt-1 text-[14px] font-bold leading-tight" style={{ color: m.color || theme.text }}>{m.v}</div>
                {m.sub && <div className="mt-0.5 text-[11px]" style={{ color: theme.textMuted }}>{m.sub}</div>}
              </div>
            ))}
            <div className="flex items-center gap-3 rounded-xl border px-3.5 py-3" style={{ background: theme.surface2, borderColor: theme.border }}>
              <Ring value={quality} size={44} stroke={5} color={qualityColor}>
                <span className="text-[10px] font-bold" style={{ color: theme.text }}>{quality}</span>
              </Ring>
              <div>
                <Label>Data quality</Label>
                <div className="mt-0.5 text-[13px] font-bold" style={{ color: qualityColor }}>{quality >= 70 ? 'Good' : quality >= 55 ? 'Fair' : 'Low'}</div>
              </div>
            </div>
          </div>

          {explain && (
            <p className="m-0 border-l-2 pl-3.5 text-[13px] italic leading-relaxed" style={{ borderColor: `${bias.color}66`, color: theme.textMuted }}>{explain}</p>
          )}
        </div>
      </div>
    </Card>
  );
}

/* ── 2. markets ──────────────────────────────────────────────────────────── */
function Markets({ summary }) {
  const theme = useTheme();
  const available = ASSETS.filter((a) => getSignal(summary, a.key) || getExplanation(summary, a.key));
  const [active, setActive] = useState(available[0]?.key ?? 'gold');
  if (available.length === 0) return null;

  const signal = getSignal(summary, active);
  const expl = getExplanation(summary, active);
  const meta = biasMeta(signal?.bias);
  const reasons = (Array.isArray(expl?.reasoning) ? expl.reasoning : []).filter(Boolean).slice(0, 5);
  const activeAsset = ASSETS.find((a) => a.key === active);

  return (
    <section>
      <SectionTitle icon={Crosshair}>Markets · tap one to see why it&apos;s moving</SectionTitle>
      <div data-tour="insights-markets" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {available.map((a) => {
          const m = biasMeta(getSignal(summary, a.key)?.bias);
          const sel = a.key === active;
          const Icon = a.icon;
          const Arrow = m.sign > 0 ? ArrowUpRight : m.sign < 0 ? ArrowDownRight : Minus;
          return (
            <button
              key={a.key} type="button" onClick={() => setActive(a.key)} aria-pressed={sel}
              className="group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: sel ? `${m.color}12` : theme.surface, borderColor: sel ? m.color : theme.border,
                boxShadow: sel ? `0 0 0 3px ${m.color}22` : theme.shadow,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: theme.surface2, color: theme.textMuted }}><Icon size={17} /></span>
                <Arrow size={20} style={{ color: m.color }} strokeWidth={2.4} />
              </div>
              <div className="mt-3 text-[15px] font-bold leading-tight" style={{ color: theme.text }}>{a.label}</div>
              <div className="text-[11.5px]" style={{ color: theme.textMuted }}>{a.sub}</div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[13px] font-bold" style={{ color: m.color }}>{m.label}</span>
                <StrengthBars level={strengthLevel(getSignal(summary, a.key)?.strength)} color={m.color} />
              </div>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.28, ease: EASE }}
          className="mt-3 rounded-2xl border p-5 sm:p-6" style={{ background: `${meta.color}0d`, borderColor: `${meta.color}33` }}
        >
          <div className="mb-3 flex items-center gap-2">
            <span className="text-[12px] font-bold uppercase tracking-[0.12em]" style={{ color: meta.color }}>Why {activeAsset?.label} is {meta.label.toLowerCase()}</span>
          </div>
          {expl?.summary ? (
            <p className="m-0 text-[15px] leading-relaxed" style={{ color: theme.text }}>{expl.summary}</p>
          ) : (
            <p className="m-0 text-[14px]" style={{ color: theme.textMuted }}>No detailed explanation for this market yet. It is derived from the indicators below.</p>
          )}
          {reasons.length > 0 && (
            <ul className="m-0 mt-3.5 flex list-none flex-col gap-2.5 p-0">
              {reasons.map((line, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[13.5px] leading-relaxed" style={{ color: theme.textMuted }}>
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: meta.color }} />{line}
                </li>
              ))}
            </ul>
          )}
          {expl?.marketImpact && (
            <div className="mt-4 flex gap-2.5 rounded-xl px-4 py-3" style={{ background: `${meta.color}14`, color: meta.color }}>
              <Zap size={15} className="mt-0.5 shrink-0" />
              <p className="m-0 text-[13px] font-medium leading-relaxed">{expl.marketImpact}</p>
            </div>
          )}
          {signal?.hasConflict && signal?.conflictExplanation && (
            <div className="mt-3 flex gap-2.5 rounded-xl px-4 py-3" style={{ background: `${AMBER}14`, color: AMBER }}>
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              <p className="m-0 text-[13px] leading-relaxed">{signal.conflictExplanation}</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

/* ── 3. drivers ──────────────────────────────────────────────────────────── */
const freshMeta = (f) => (f === 'fresh' ? { c: GREEN, t: 'Fresh data' } : f === 'stale' ? { c: AMBER, t: 'Stale data' } : { c: RED, t: 'Outdated data' });
const trendMeta = (t) => (t === 'rising' ? { icon: ArrowUpRight, c: GREEN, t: 'Rising' } : t === 'falling' ? { icon: ArrowDownRight, c: RED, t: 'Falling' } : { icon: Minus, c: GREY, t: 'Flat' });

function Drivers({ drivers }) {
  const theme = useTheme();
  const [open, setOpen] = useState(null);
  const max = Math.max(0.01, ...(drivers || []).map((d) => Math.abs(Number(d.contribution) || 0)));

  return (
    <section>
      <SectionTitle icon={Database}>Key drivers</SectionTitle>
      <Card>
        {!drivers || drivers.length === 0 ? (
          <p className="m-0 px-6 py-8 text-[14px]" style={{ color: theme.textMuted }}>No driver data available yet.</p>
        ) : (
          <>
            <div className="hidden items-center gap-4 border-b px-5 py-2.5 text-[10.5px] font-bold uppercase tracking-[0.12em] sm:flex" style={{ borderColor: theme.border, color: theme.textMuted }}>
              <span className="w-6" /><span className="w-48">Indicator</span><span className="flex-1 text-center">← Bearish · Contribution · Bullish →</span><span className="w-20 text-right">Bias</span><span className="w-12" />
            </div>
            {drivers.map((d, i) => {
              const m = biasMeta(d.bias);
              const c = Number(d.contribution) || 0;
              const trend = trendMeta(d.trend);
              const fresh = freshMeta(d.freshness);
              const TrendIcon = trend.icon;
              const isOpen = open === d.code;
              const barColor = c > 0 ? GREEN : c < 0 ? RED : GREY;
              return (
                <div key={d.code} className="border-b last:border-0" style={{ borderColor: theme.border }}>
                  <button
                    type="button" onClick={() => setOpen(isOpen ? null : d.code)} aria-expanded={isOpen}
                    className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 text-left transition-colors hover:bg-black/[0.025] dark:hover:bg-white/[0.03]"
                  >
                    <span className="w-6 font-mono text-[11px]" style={{ color: theme.textMuted }}>{String(i + 1).padStart(2, '0')}</span>
                    <span className="w-48 min-w-0">
                      <span className="block text-[14px] font-semibold leading-tight" style={{ color: theme.text }}>{d.name}</span>
                      <span className="block truncate text-[11.5px] tabular-nums" style={{ color: theme.textMuted }}>{d.value ?? '—'}</span>
                    </span>
                    <span className="relative order-last h-2.5 w-full min-w-[120px] flex-1 rounded-full sm:order-none sm:w-auto" style={{ background: theme.surface2 }}>
                      <span className="absolute left-1/2 top-[-3px] h-[16px] w-px" style={{ background: theme.border }} />
                      <motion.span
                        className="absolute top-0 h-full rounded-full"
                        style={{ background: barColor, [c >= 0 ? 'left' : 'right']: '50%' }}
                        initial={{ width: 0 }} animate={{ width: `${(Math.abs(c) / max) * 50}%` }} transition={{ duration: 0.9, ease: EASE, delay: 0.1 + i * 0.05 }}
                      />
                    </span>
                    <span className="w-20 text-right">
                      <span className="text-[13px] font-bold" style={{ color: m.color }}>{d.bias || 'Neutral'}</span>
                      <span className="block text-[11px] tabular-nums" style={{ color: barColor }}>{Number.isFinite(d.contribution) ? `${c > 0 ? '+' : ''}${c}` : '—'}</span>
                    </span>
                    <span className="flex w-12 items-center justify-end gap-2">
                      <span title={fresh.t} className="h-2 w-2 rounded-full" style={{ background: fresh.c }} />
                      <TrendIcon size={15} style={{ color: trend.c }} aria-label={trend.t} />
                      <ChevronDown size={15} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} style={{ color: theme.textMuted }} />
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: EASE }} className="overflow-hidden">
                        <div className="flex flex-col gap-3 px-5 pb-5 pl-[60px]">
                          <div className="flex flex-wrap gap-2">
                            <Pill color={d.validation?.valid ? GREEN : d.validation ? AMBER : GREY}>{d.validation ? (d.validation.valid ? 'Validated' : 'Partially validated') : 'Unchecked'}</Pill>
                            <Pill color="#CA8A04">{d.dataSource || 'FRED API'}</Pill>
                            <Pill color="#6366f1">Reliability: {d.sourceReliability || 'medium'}</Pill>
                            <Pill color={GREY}>Weight {d.weight || BASELINE_WEIGHTS[d.code] || '—'}</Pill>
                          </div>
                          <div className="flex flex-wrap gap-x-5 text-[12px]" style={{ color: theme.textMuted }}>
                            {fmtDate(d.releaseTime) && <span>Released {fmtDate(d.releaseTime)}</span>}
                            {fmtDate(d.fetchedAt) && <span>Fetched {fmtDate(d.fetchedAt)}</span>}
                            {!fmtDate(d.releaseTime) && !fmtDate(d.fetchedAt) && <span>Timing data pending</span>}
                          </div>
                          <div className="rounded-xl border px-4 py-3" style={{ background: theme.surface2, borderColor: theme.border }}>
                            <Label>Why this matters</Label>
                            <p className="m-0 mt-1.5 text-[13.5px] leading-relaxed" style={{ color: theme.text }}>{d.reasoning || 'Analysis pending. Data is being validated.'}</p>
                          </div>
                          {d.historicalValidation && (
                            <Tint color="#CA8A04" className="rounded-xl px-4 py-3">
                              <Label>Backtest · last {d.historicalValidation.sampleSize || 10} releases</Label>
                              <p className="m-0 mt-1.5 text-[13px] leading-relaxed" style={{ color: theme.text }}>{d.historicalValidation.statement}</p>
                            </Tint>
                          )}
                          {Array.isArray(d.validation?.issues) && d.validation.issues.length > 0 && (
                            <Tint color={AMBER} className="rounded-xl px-4 py-3">
                              <Label>Validation notes</Label>
                              {d.validation.issues.map((issue) => <p key={issue} className="m-0 mt-1 text-[13px]" style={{ color: theme.text }}>• {issue}</p>)}
                            </Tint>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </>
        )}
      </Card>
    </section>
  );
}

/* ── 4. side rail ────────────────────────────────────────────────────────── */
function RailCard({ title, icon, children, tone }) {
  return (
    <section>
      <SectionTitle icon={icon}>{title}</SectionTitle>
      <Card className="p-5" style={tone ? { background: `${tone}0d`, borderColor: `${tone}33` } : undefined}>{children}</Card>
    </section>
  );
}

function Narrative({ narrative }) {
  const theme = useTheme();
  if (!narrative) return null;
  if (narrative.reason && narrative.reason.includes('indicator') && narrative.drivers?.length === 0) {
    return (
      <RailCard title="Why the market moved" icon={Info}>
        <p className="m-0 text-[13.5px] leading-relaxed" style={{ color: theme.textMuted }}>{narrative.reason}</p>
      </RailCard>
    );
  }
  const m = biasMeta(narrative.finalBias);
  const Icon = m.icon;
  return (
    <RailCard title="Why the market moved" icon={Info} tone={m.color}>
      <div className="flex items-start gap-3">
        <Icon size={20} className="mt-0.5 shrink-0" style={{ color: m.color }} />
        <div>
          <p className="m-0 text-[14.5px] leading-relaxed" style={{ color: theme.text }}>{narrative.summary}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {narrative.maxConfidence && <Pill color={narrative.maxConfidence === 'High' ? GREEN : narrative.maxConfidence === 'Medium' ? AMBER : GREY}>{narrative.maxConfidence} confidence</Pill>}
            {narrative.regime && narrative.regime !== 'NEUTRAL' && <Pill color="#8b5cf6">{narrative.regime.replace(/_/g, ' ')}</Pill>}
          </div>
        </div>
      </div>
    </RailCard>
  );
}

function Validation({ marketValidation, macroScore }) {
  const theme = useTheme();
  if (!marketValidation) return null;
  const { priceDirection, macroBias, conflict, severity, severityLabel, message } = marketValidation;
  if (!priceDirection) {
    return (
      <RailCard title="Price vs macro" icon={Activity}>
        <p className="m-0 flex items-start gap-2 text-[13.5px] leading-relaxed" style={{ color: theme.textMuted }}><AlertCircle size={15} className="mt-0.5 shrink-0" />{message || 'Awaiting price data for validation.'}</p>
      </RailCard>
    );
  }
  const price = priceDirection === 'UP' ? GREEN : priceDirection === 'DOWN' ? RED : GREY;
  const macro = biasMeta(macroBias);
  const tone = conflict ? (severity === 'high' ? RED : AMBER) : GREEN;
  return (
    <RailCard title="Price vs macro" icon={Activity}>
      <div className="flex flex-wrap items-center gap-2">
        <Pill color={price}>Price {priceDirection}</Pill>
        <span className="text-[12px]" style={{ color: theme.textMuted }}>vs</span>
        <Pill color={macro.color}>Macro {macro.label}</Pill>
        {conflict && <Pill color={tone}>{severityLabel || (severity === 'high' ? 'Conflict' : 'Diverging')}</Pill>}
      </div>
      <p className="m-0 mt-3 rounded-xl px-3.5 py-3 text-[13px] leading-relaxed" style={{ background: `${tone}12`, color: theme.text }}>{message}</p>
      {macroScore && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px]" style={{ color: theme.textMuted }}>
          <span>Score <strong style={{ color: macroScore.score > 0 ? GREEN : macroScore.score < 0 ? RED : theme.text }}>{macroScore.score > 0 ? '+' : ''}{macroScore.score}</strong></span>
          <span>Quality <strong style={{ color: theme.text }}>{macroScore.dataConfidence ?? 45}%</strong></span>
        </div>
      )}
    </RailCard>
  );
}

function riskItems(summary) {
  const items = [];
  if (Array.isArray(summary?.riskAlerts)) {
    items.push(...summary.riskAlerts.map((text) => ({
      text, sev: /outdated|missing|delayed/i.test(text) ? 'high' : /conflict|mixed|stale|low confidence/i.test(text) ? 'medium' : 'low',
    })));
  }
  const di = summary?.dataInfo ?? {};
  if (di.outdatedCodes?.length) items.push({ text: `Outdated data: ${di.outdatedCodes.join(', ')}`, sev: 'high' });
  if (di.missingCodes?.length) items.push({ text: `Missing data: ${di.missingCodes.join(', ')}`, sev: 'high' });
  if (di.staleCodes?.length) items.push({ text: `Updates expected soon: ${di.staleCodes.join(', ')}`, sev: 'medium' });
  const seen = new Set();
  return items.filter((it) => (seen.has(it.text) ? false : seen.add(it.text)));
}

function Risks({ summary }) {
  const theme = useTheme();
  const items = riskItems(summary);
  if (items.length === 0) {
    return (
      <RailCard title="Risk alerts" icon={ShieldAlert} tone={GREEN}>
        <p className="m-0 flex items-center gap-2.5 text-[14px] font-medium" style={{ color: GREEN }}><CheckCircle2 size={18} /> All signals clean. No active risks.</p>
      </RailCard>
    );
  }
  const high = items.some((i) => i.sev === 'high');
  return (
    <RailCard title={`${items.length} risk alert${items.length > 1 ? 's' : ''}`} icon={ShieldAlert} tone={high ? RED : AMBER}>
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[13px] leading-relaxed" style={{ color: theme.text }}>
            <AlertCircle size={15} className="mt-0.5 shrink-0" style={{ color: it.sev === 'high' ? RED : it.sev === 'medium' ? AMBER : GREY }} />{it.text}
          </li>
        ))}
      </ul>
    </RailCard>
  );
}

function Reliability({ dataInfo, macroScore }) {
  const theme = useTheme();
  if (!dataInfo && !macroScore) return null;
  const q = Number(macroScore?.dataConfidence ?? 45);
  const status = macroScore?.systemStatus || 'OK';
  const statusColor = status === 'OK' ? GREEN : status === 'Warning' ? AMBER : RED;
  const rows = [
    { k: 'Signal alignment', v: macroScore?.signalConfidence || 'Medium' },
    { k: 'System status', v: status === 'OK' ? 'OK' : status === 'Warning' ? 'Warning' : 'Degraded', color: statusColor },
    { k: 'Next update', v: dataInfo?.nextUpdateExpected },
    { k: 'Released', v: relativeTime(dataInfo?.lastUpdated) },
  ].filter((r) => r.v);
  return (
    <RailCard title="Data reliability" icon={Database}>
      <div className="flex items-center gap-4">
        <Ring value={q} size={72} stroke={8} color={q >= 70 ? GREEN : q >= 55 ? AMBER : RED}>
          <span className="text-[17px] font-bold tabular-nums" style={{ color: theme.text }}>{q}%</span>
        </Ring>
        <div className="min-w-0">
          <div className="text-[14px] font-semibold" style={{ color: theme.text }}>{dataInfo?.dataDelay || 'Latest available economic data'}</div>
          <div className="text-[12px]" style={{ color: theme.textMuted }}>Freshness, completeness and validity</div>
        </div>
      </div>
      <dl className="m-0 mt-4 flex flex-col divide-y text-[13px]" style={{ borderColor: theme.border }}>
        {rows.map((r) => (
          <div key={r.k} className="flex items-center justify-between gap-3 py-2" style={{ borderColor: theme.border }}>
            <dt style={{ color: theme.textMuted }}>{r.k}</dt>
            <dd className="m-0 text-right font-semibold" style={{ color: r.color || theme.text }}>{r.v}</dd>
          </div>
        ))}
      </dl>
      {dataInfo?.uncertainty && (
        <p className="m-0 mt-3 flex items-start gap-2 text-[12px] leading-relaxed" style={{ color: theme.textMuted }}><Info size={14} className="mt-0.5 shrink-0" />{dataInfo.uncertainty}</p>
      )}
    </RailCard>
  );
}

function AiSummary({ aiSummary, aiStatus, actionContext }) {
  const theme = useTheme();
  const hasAi = aiSummary && !aiSummary.error && aiSummary.summary;
  if (!hasAi && !actionContext) return null;
  return (
    <RailCard title={aiStatus === 'ai_generated' ? 'AI summary' : 'Analysis summary'} icon={Sparkles}>
      {hasAi && (
        <>
          <p className="m-0 text-[14px] leading-relaxed" style={{ color: theme.text }}>{aiSummary.summary}</p>
          {Array.isArray(aiSummary.keyPoints) && aiSummary.keyPoints.length > 0 && (
            <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
              {aiSummary.keyPoints.slice(0, 3).map((pt, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[13px] leading-relaxed" style={{ color: theme.textMuted }}>
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />{pt}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      {actionContext && (
        <p className={`m-0 text-[13px] italic leading-relaxed ${hasAi ? 'mt-3 border-t pt-3' : ''}`} style={{ color: theme.textMuted, borderColor: theme.border }}>{actionContext}</p>
      )}
    </RailCard>
  );
}

/* ── page ────────────────────────────────────────────────────────────────── */
function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <div className="z-skeleton rounded-[20px]" style={{ height: 300 }} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="z-skeleton rounded-2xl" style={{ height: 124 }} />)}</div>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="z-skeleton rounded-[20px]" style={{ height: 420 }} />
        <div className="z-skeleton rounded-[20px]" style={{ height: 420 }} />
      </div>
    </div>
  );
}

export default function AIInsightsDashboard({ macroData }) {
  if (!macroData) return <LoadingSkeleton />;

  const summary = macroData.macroSummary ?? macroData;
  const generatedAt = macroData.generatedAt ?? macroData.meta?.generatedAt ?? macroData.meta?.lastUpdated ?? macroData.lastUpdated ?? null;
  const macroScore = macroData.macroScore ?? null;

  return (
    <Stagger className="flex flex-col gap-7" gap={0.08}>
      <Rise data-tour="insights-verdict">
        <Verdict summary={summary} macroScore={macroScore} tradeInsight={macroData.tradeInsight} tradeNarrative={macroData.tradeNarrative} generatedAt={generatedAt} />
      </Rise>
      <Rise><Markets summary={summary} /></Rise>
      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Rise><Drivers drivers={macroData.drivers ?? []} /></Rise>
        <Rise className="flex flex-col gap-7">
          <Narrative narrative={macroData.marketNarrative ?? null} />
          <Validation marketValidation={macroData.marketValidation ?? null} macroScore={macroScore} />
          <Risks summary={summary} />
          <Reliability dataInfo={summary?.dataInfo ?? macroData.dataTransparency} macroScore={macroScore} />
          <AiSummary aiSummary={macroData.aiSummary ?? null} aiStatus={macroData.aiStatus ?? null} actionContext={macroData.actionContext ?? null} />
        </Rise>
      </div>
    </Stagger>
  );
}
