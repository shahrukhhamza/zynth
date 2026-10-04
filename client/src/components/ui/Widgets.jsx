/**
 * Zynth UI widgets — small, theme-aware building blocks used across the signed-in app.
 *   Sparkline, Ring, StatCard, EmptyState, Skeleton, Tabs, SectionTitle, Pill, ProgressBar
 */
import { useId } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { CountUp, EASE } from './motion';

/* ── Sparkline ───────────────────────────────────────────────────────────── */
export function smoothPath(points) {
  if (points.length < 2) return '';
  const p = (i) => points[Math.max(0, Math.min(points.length - 1, i))];
  let d = `M ${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const [x0, y0] = p(i - 1); const [x1, y1] = p(i); const [x2, y2] = p(i + 1); const [x3, y3] = p(i + 2);
    d += ` C ${(x1 + (x2 - x0) / 6).toFixed(1)} ${(y1 + (y2 - y0) / 6).toFixed(1)}, ${(x2 - (x3 - x1) / 6).toFixed(1)} ${(y2 - (y3 - y1) / 6).toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  }
  return d;
}

export function Sparkline({ data = [], color = '#10b981', height = 44, fill = true, className = '' }) {
  const uid = useId().replace(/:/g, '');
  if (data.length < 2) {
    return <div className={className} style={{ height }} aria-hidden="true" />;
  }
  const W = 200; const H = 60; const pad = 4;
  const min = Math.min(...data); const max = Math.max(...data); const span = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * W, H - pad - ((v - min) / span) * (H - pad * 2)]);
  const line = smoothPath(pts);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={className} style={{ width: '100%', height, display: 'block' }} aria-hidden="true">
      <defs>
        <linearGradient id={`${uid}-f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={`${line} L ${W} ${H} L 0 ${H} Z`} fill={`url(#${uid}-f)`} />}
      <motion.path
        d={line} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: EASE }}
      />
    </svg>
  );
}

/* ── Ring gauge ──────────────────────────────────────────────────────────── */
export function Ring({ value = 0, size = 76, stroke = 8, color = '#CA8A04', children }) {
  const r = (size - stroke) / 2; const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value)) / 100;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ duration: 1.3, ease: EASE, delay: 0.15 }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

/* ── Pill ────────────────────────────────────────────────────────────────── */
export function Pill({ children, color = '#CA8A04', className = '', dot = false }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${className}`}
      style={{ color, background: `${color}1a` }}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />}
      {children}
    </span>
  );
}

/* ── Section title ───────────────────────────────────────────────────────── */
export function SectionTitle({ children, action, icon: Icon }) {
  const theme = useTheme();
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3 className="m-0 flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.14em]" style={{ color: theme.textMuted }}>
        {Icon && <Icon size={14} style={{ color: '#CA8A04' }} />}
        {children}
      </h3>
      {action}
    </div>
  );
}

/* ── Stat card ───────────────────────────────────────────────────────────── */
export function StatCard({
  label, value, format, sub, color, icon: Icon, spark, ring, badge, className = '', style,
}) {
  const theme = useTheme();
  const numeric = typeof value === 'number';
  return (
    <div
      className={`relative overflow-hidden rounded-[20px] border p-5 ${className}`}
      style={{ background: theme.surface, borderColor: theme.border, boxShadow: theme.shadow, ...style }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full"
        style={{ background: `radial-gradient(circle, ${color || '#CA8A04'}22, transparent 70%)` }}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: theme.textMuted }}>{label}</span>
            {badge}
          </div>
          <div className="font-display mt-2.5 text-[30px] font-bold leading-none tracking-tight" style={{ color: color || theme.text }}>
            {numeric ? <CountUp value={value} format={format} /> : value}
          </div>
          {sub && <p className="m-0 mt-2 text-[12.5px] font-medium" style={{ color: theme.textMuted }}>{sub}</p>}
        </div>
        {ring != null ? (
          ring
        ) : Icon ? (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: `${color || '#CA8A04'}1a`, color: color || '#CA8A04' }}>
            <Icon size={18} />
          </span>
        ) : null}
      </div>
      {spark && <div className="relative mt-4">{spark}</div>}
    </div>
  );
}

/* ── Empty state ─────────────────────────────────────────────────────────── */
export function EmptyState({ icon: Icon, title, description, action, compact = false }) {
  const theme = useTheme();
  return (
    <div className={`flex flex-col items-center text-center ${compact ? 'py-8' : 'py-14'}`}>
      <div className="relative mb-5">
        <div aria-hidden="true" className="absolute inset-0 -m-4 rounded-full" style={{ background: 'radial-gradient(circle, rgba(202,138,4,0.18), transparent 70%)' }} />
        <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl border" style={{ background: theme.surface, borderColor: 'rgba(202,138,4,0.3)', color: '#CA8A04' }}>
          {Icon && <Icon size={24} />}
        </span>
      </div>
      <h3 className="m-0 text-[17px] font-bold" style={{ color: theme.text }}>{title}</h3>
      {description && <p className="m-0 mt-1.5 max-w-xs text-[13px] leading-relaxed" style={{ color: theme.textMuted }}>{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ── Skeleton ────────────────────────────────────────────────────────────── */
export function Skeleton({ className = '', style }) {
  return <div className={`z-skeleton rounded-xl ${className}`} style={style} />;
}

/* ── Tabs (animated pill) ────────────────────────────────────────────────── */
export function Tabs({ tabs, value, onChange, layoutId = 'tabs-pill', className = '' }) {
  const theme = useTheme();
  return (
    <div role="tablist" className={`inline-flex gap-1 rounded-2xl border p-1 ${className}`} style={{ background: theme.surface2, borderColor: theme.border }}>
      {tabs.map((t) => {
        const active = t.key === value;
        const Icon = t.icon;
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.key)}
            className="relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-colors"
            style={{ color: active ? theme.text : theme.textMuted }}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-xl"
                style={{ background: theme.surface, boxShadow: theme.isDark ? '0 1px 0 rgba(255,255,255,0.06) inset, 0 4px 14px -6px rgba(0,0,0,0.6)' : '0 1px 2px rgba(24,24,27,0.08), 0 4px 14px -8px rgba(24,24,27,0.2)', border: `1px solid ${theme.border}` }}
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative flex items-center gap-2">
              {Icon && <Icon size={14} style={{ color: active ? '#CA8A04' : undefined }} />}
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Progress bar ────────────────────────────────────────────────────────── */
export function ProgressBar({ value = 0, color = '#CA8A04', height = 6 }) {
  const theme = useTheme();
  return (
    <div className="overflow-hidden rounded-full" style={{ height, background: theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(24,24,27,0.07)' }}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: `linear-gradient(90deg, ${color}, ${color}cc)` }}
        initial={{ width: 0 }} animate={{ width: `${Math.max(0, Math.min(100, value))}%` }} transition={{ duration: 1, ease: EASE, delay: 0.1 }}
      />
    </div>
  );
}
