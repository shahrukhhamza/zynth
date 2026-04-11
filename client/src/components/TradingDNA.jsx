/**
 * TradingDNA.jsx
 * Elite-only: deep AI-generated personality profile for the trader.
 * Generates once per month from all journal data.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Fingerprint, Target, TrendingUp, RefreshCw, Newspaper, Zap, BarChart2,
  AlertTriangle, Brain, Download, Loader2, ChevronRight, CheckCircle,
  XCircle, Lock, Sparkles, Calendar, TrendingDown,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { usePlanGate } from '../hooks/usePlanGate';
import { API_URL } from '../config/api';
import ErrorBar from './ErrorBar';
import JournalUpgradePrompt, { DNA_FEATURES } from './journal/JournalUpgradePrompt';

// ── Archetype config ──────────────────────────────────────────────────────────
const ARCHETYPES = {
  'The Sniper': {
    icon: Target,
    gradient: 'from-violet-600 to-purple-700',
    textColor: 'text-violet-200',
    accentColor: '#a78bfa',
    glowColor: 'rgba(167,139,250,0.3)',
  },
  'The Momentum Rider': {
    icon: TrendingUp,
    gradient: 'from-yellow-600 to-amber-700',
    textColor: 'text-yellow-200',
    accentColor: '#CA8A04',
    glowColor: 'rgba(202,138,4,0.3)',
  },
  'The Contrarian': {
    icon: RefreshCw,
    gradient: 'from-yellow-600 to-red-700',
    textColor: 'text-yellow-200',
    accentColor: '#fb923c',
    glowColor: 'rgba(251,146,60,0.3)',
  },
  'The News Trader': {
    icon: Newspaper,
    gradient: 'from-yellow-600 to-amber-700',
    textColor: 'text-yellow-200',
    accentColor: '#fbbf24',
    glowColor: 'rgba(251,191,36,0.3)',
  },
  'The Scalper': {
    icon: Zap,
    gradient: 'from-yellow-500 to-yellow-600',
    textColor: 'text-yellow-100',
    accentColor: '#fbbf24',
    glowColor: 'rgba(251,191,36,0.3)',
  },
  'The Swing Trader': {
    icon: BarChart2,
    gradient: 'from-amber-600 to-yellow-700',
    textColor: 'text-amber-200',
    accentColor: '#f59e0b',
    glowColor: 'rgba(245,158,11,0.3)',
  },
  'The Gambler': {
    icon: AlertTriangle,
    gradient: 'from-red-700 to-rose-900',
    textColor: 'text-red-200',
    accentColor: '#f87171',
    glowColor: 'rgba(248,113,113,0.3)',
  },
};

const DEFAULT_ARCHETYPE = {
  icon: Brain,
  gradient: 'from-zinc-700 to-zinc-800',
  textColor: 'text-zinc-300',
  accentColor: '#9ca3af',
  glowColor: 'rgba(156,163,175,0.2)',
};

// ── DNA trait definitions ─────────────────────────────────────────────────────
const TRAITS = [
  { key: 'patience',          label: 'Patience',           sub: 'How long you wait for setups' },
  { key: 'discipline',        label: 'Discipline',         sub: 'How well you follow your plan' },
  { key: 'riskManagement',    label: 'Risk Management',    sub: 'How well you protect capital' },
  { key: 'emotionalControl',  label: 'Emotional Control',  sub: 'Trading psychology strength' },
  { key: 'consistency',       label: 'Consistency',        sub: 'How predictable your results are' },
  { key: 'strategyAdherence', label: 'Strategy Adherence', sub: 'How often you stick to strategies' },
  { key: 'macroAwareness',    label: 'Macro Awareness',    sub: 'How well you use macro data' },
  { key: 'learningRate',      label: 'Learning Rate',      sub: 'Are you improving over time?' },
];

function traitBarColor(v) {
  if (v >= 70) return '#22c55e';
  if (v >= 40) return '#f59e0b';
  return '#ef4444';
}

// ── Share card via Canvas API ─────────────────────────────────────────────────
function downloadDnaCard(archetype, traits, stats) {
  const W = 680, H = 360;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#0a0a0a');
  bg.addColorStop(1, '#071210');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Top accent line
  const accent = ctx.createLinearGradient(0, 0, W, 0);
  accent.addColorStop(0, '#CA8A04');
  accent.addColorStop(1, '#6366f1');
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, W, 4);

  // Label
  ctx.fillStyle = '#6ee7b7';
  ctx.font = '11px system-ui, -apple-system, sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText('YOUR TRADING DNA', 32, 36);

  // Archetype name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 38px system-ui, -apple-system, sans-serif';
  ctx.fillText(archetype, 32, 86);

  // Stats row
  const stat = (label, value, x, y) => {
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillText(label, x, y);
    ctx.fillStyle = '#CA8A04';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText(String(value), x, y + 26);
  };
  stat('TRADES', stats.totalTrades, 32, 118);
  stat('WIN RATE', `${stats.winRate}%`, 140, 118);

  // Divider
  ctx.strokeStyle = '#1f2937';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(32, 165);
  ctx.lineTo(W - 32, 165);
  ctx.stroke();

  // Trait bars
  const barTraits = TRAITS.slice(0, 6);
  barTraits.forEach((t, i) => {
    const col = i < 3 ? 0 : 1;
    const row = i % 3;
    const x = col === 0 ? 32 : 367;
    const y = 195 + row * 42;
    const val = traits?.[t.key] ?? 50;
    const barW = 260;

    ctx.fillStyle = '#374151';
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillText(t.label, x, y - 2);

    ctx.fillStyle = '#1f2937';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y + 4, barW, 10, 5) : ctx.rect(x, y + 4, barW, 10);
    ctx.fill();

    const barColor = val >= 70 ? '#22c55e' : val >= 40 ? '#f59e0b' : '#ef4444';
    ctx.fillStyle = barColor;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y + 4, (val / 100) * barW, 10, 5) : ctx.rect(x, y + 4, (val / 100) * barW, 10);
    ctx.fill();

    ctx.fillStyle = barColor;
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillText(`${val}`, x + barW + 6, y + 13);
  });

  // Footer
  ctx.fillStyle = '#141414';
  ctx.fillRect(0, H - 36, W, 36);
  ctx.fillStyle = '#4b5563';
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText('Generated by Zynth', 32, H - 14);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#4b5563';
  ctx.fillText(new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), W - 32, H - 14);

  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'zynth-trading-dna.png';
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

// ── Plan gate ─────────────────────────────────────────────────────────────────
function EliteGate() {
  return (
    <div style={{ padding: '24px 0' }}>
      <JournalUpgradePrompt
        headline="Trading DNA is an Elite feature"
        description="Discover your trader archetype, 8-trait personality score, and a personalised 30-day improvement plan — all powered by your journal data."
        badge="Elite Feature"
        features={DNA_FEATURES}
        lockIcon={Fingerprint}
        ctaLabel="Upgrade to Elite"
        openWith={{ requiredPlan: 'elite', headline: 'Unlock Your Trading DNA', message: 'Get your full trader personality profile on the Elite plan.' }}
      />
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ArchetypeCard({ archetype, tagline, archetypeDescription }) {
  const cfg = ARCHETYPES[archetype] || DEFAULT_ARCHETYPE;
  const Icon = cfg.icon;
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${cfg.gradient} p-6 md:p-8 shadow-xl`}
      style={{ boxShadow: `0 20px 60px ${cfg.glowColor}` }}
    >
      {/* Background glow circles */}
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-20"
        style={{ background: cfg.accentColor, filter: 'blur(40px)' }} />
      <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full opacity-10"
        style={{ background: cfg.accentColor, filter: 'blur(30px)' }} />

      <div className="relative z-10">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${cfg.textColor}`}>Your Trading Archetype</p>
            <h1 className="text-3xl md:text-4xl font-black text-white drop-shadow-sm">{archetype}</h1>
            {tagline && (
              <p className={`text-sm font-medium mt-1 ${cfg.textColor}`}>{tagline}</p>
            )}
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 flex-shrink-0">
            <Icon className="w-7 h-7 text-white" />
          </div>
        </div>
        {archetypeDescription && (
          <p className="mt-5 text-white/80 text-sm leading-relaxed max-w-2xl">{archetypeDescription}</p>
        )}
      </div>
    </div>
  );
}

function TraitBar({ trait, value, delay = 0 }) {
  const theme = useTheme();
  const color = traitBarColor(value);
  const label = value >= 70 ? 'Strong' : value >= 40 ? 'Moderate' : 'Needs Work';
  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1.5">
        <div>
          <span className="text-sm font-semibold" style={{ color: theme.text }}>{trait.label}</span>
          <span className="hidden md:inline text-xs ml-2" style={{ color: theme.muted }}>— {trait.sub}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color }}>{label}</span>
          <span className="text-sm font-bold" style={{ color }}>{value}</span>
        </div>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: theme.isDark ? '#27272a' : '#e4e4e7' }}>
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${value}%`, backgroundColor: color, transitionDelay: `${delay}ms` }}
        />
      </div>
    </div>
  );
}

function DnaStrands({ traits }) {
  const theme = useTheme();
  return (
    <div className="rounded-2xl p-6" style={{ background: theme.isDark ? 'rgba(39,39,42,0.6)' : theme.surface, border: `1px solid ${theme.border}` }}>
      <h2 className="text-lg font-bold mb-5 flex items-center gap-2" style={{ color: theme.text }}>
        <Fingerprint className="w-5 h-5 text-yellow-400" />
        DNA Trait Profile
      </h2>
      <div className="grid md:grid-cols-2 gap-x-10 gap-y-5">
        {TRAITS.map((t, i) => (
          <TraitBar key={t.key} trait={t} value={traits?.[t.key] ?? 50} delay={i * 80} />
        ))}
      </div>
    </div>
  );
}

function StrengthsWeaknesses({ strengths = [], weaknesses = [] }) {
  const theme = useTheme();
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Strengths */}
      <div className="rounded-2xl p-5" style={{ background: theme.isDark ? 'rgba(161,98,7,0.12)' : '#fefce8', border: `1px solid ${theme.isDark ? 'rgba(161,98,7,0.3)' : '#fde68a'}` }}>
        <h3 className="text-sm font-bold text-yellow-600 dark:text-yellow-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> Strengths
        </h3>
        <div className="space-y-3">
          {strengths.length === 0 && (
            <p className="text-sm" style={{ color: theme.muted }}>No data yet</p>
          )}
          {strengths.map((s, i) => (
            <div key={i} className="flex gap-3">
              <div className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(234,179,8,0.2)' }}>
                <span className="text-xs font-bold text-yellow-500">{i + 1}</span>
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: theme.text }}>{s.title}</p>
                <p className="text-xs mt-0.5" style={{ color: theme.muted }}>{s.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weaknesses */}
      <div className="rounded-2xl p-5" style={{ background: theme.isDark ? 'rgba(220,38,38,0.1)' : '#fff1f2', border: `1px solid ${theme.isDark ? 'rgba(220,38,38,0.25)' : '#fecdd3'}` }}>
        <h3 className="text-sm font-bold text-red-500 dark:text-red-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <XCircle className="w-4 h-4" /> Areas to Improve
        </h3>
        <div className="space-y-3">
          {weaknesses.length === 0 && (
            <p className="text-sm" style={{ color: theme.muted }}>No data yet</p>
          )}
          {weaknesses.map((w, i) => (
            <div key={i} className="flex gap-3">
              <div className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(239,68,68,0.15)' }}>
                <span className="text-xs font-bold text-red-500">{i + 1}</span>
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: theme.text }}>{w.title}</p>
                <p className="text-xs mt-0.5" style={{ color: theme.muted }}>{w.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RadarFingerprint({ radarData = [] }) {
  const theme = useTheme();
  if (!radarData.length) return null;
  const chartData = radarData.map(d => ({ ...d, subject: d.axis }));
  const gridColor = theme.isDark ? '#1f2937' : '#e4e4e7';
  const tickColor = theme.isDark ? '#9ca3af' : '#52525b';
  const tickColorSub = theme.isDark ? '#4b5563' : '#71717a';
  return (
    <div className="rounded-2xl p-6" style={{ background: theme.isDark ? 'rgba(39,39,42,0.6)' : theme.surface, border: `1px solid ${theme.border}` }}>
      <h2 className="text-lg font-bold mb-5 flex items-center gap-2" style={{ color: theme.text }}>
        <Sparkles className="w-5 h-5 text-purple-400" />
        Performance Fingerprint
      </h2>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
            <PolarGrid stroke={gridColor} />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: tickColor, fontSize: 12, fontWeight: 500 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: tickColorSub, fontSize: 10 }}
              tickCount={5}
            />
            <Radar
              name="Score"
              dataKey="value"
              stroke="#CA8A04"
              fill="#CA8A04"
              fillOpacity={0.15}
              strokeWidth={2}
              dot={{ fill: '#CA8A04', strokeWidth: 0, r: 4 }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ImprovementPlan({ plan = [] }) {
  const theme = useTheme();
  const colors = ['orange', 'amber', 'purple', 'yellow'];
  return (
    <div className="rounded-2xl p-6" style={{ background: theme.isDark ? 'rgba(39,39,42,0.6)' : theme.surface, border: `1px solid ${theme.border}` }}>
      <h2 className="text-lg font-bold mb-5 flex items-center gap-2" style={{ color: theme.text }}>
        <Calendar className="w-5 h-5 text-yellow-400" />
        30-Day Improvement Plan
      </h2>
      {plan.length === 0 ? (
        <p className="text-sm" style={{ color: theme.muted }}>No plan generated.</p>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {plan.map((week, i) => {
            const c = colors[i % colors.length];
            return (
              <div key={i} className={`relative rounded-xl p-4 bg-${c}-50 dark:bg-${c}-900/20 border border-${c}-200 dark:border-${c}-800/30`}>
                <div className={`text-xs font-bold uppercase tracking-wider mb-2 text-${c}-600 dark:text-${c}-400`}>
                  Week {week.week}
                </div>
                <div className="text-sm font-semibold mb-2" style={{ color: theme.text }}>{week.focus}</div>
                <div className="flex gap-2">
                  <ChevronRight className={`w-4 h-4 text-${c}-500 dark:text-${c}-400 flex-shrink-0 mt-0.5`} />
                  <p className="text-xs leading-relaxed" style={{ color: theme.muted }}>{week.action}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CoachMessage({ message, userName }) {
  const theme = useTheme();
  if (!message) return null;
  return (
    <div className="rounded-2xl p-6 md:p-8" style={{ background: theme.isDark ? 'linear-gradient(135deg, #18181b, #18181b)' : theme.surface, border: `1px solid ${theme.isDark ? '#3f3f46' : theme.border}` }}>
      <h2 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: theme.text }}>
        <Brain className="w-5 h-5 text-yellow-400" />
        Personal Message from Your AI Coach
      </h2>
      <div className="relative">
        <div className="absolute -top-2 -left-1 text-6xl font-serif leading-none select-none" style={{ color: theme.isDark ? 'rgba(161,98,7,0.3)' : 'rgba(161,98,7,0.2)' }}>&ldquo;</div>
        <div className="pl-8 space-y-4">
          {message.split('\n\n').filter(Boolean).map((para, i) => (
            <p key={i} className="text-sm leading-relaxed" style={{ color: theme.isDark ? '#d4d4d8' : theme.text }}>{para}</p>
          ))}
        </div>
        <div className="absolute -bottom-4 right-0 text-6xl font-serif leading-none select-none" style={{ color: theme.isDark ? 'rgba(161,98,7,0.3)' : 'rgba(161,98,7,0.2)' }}>&rdquo;</div>
      </div>
    </div>
  );
}

function EmptyState({ tradeCount, closedCount = 0, canGenerate, generating, nextAvailable, onGenerate }) {
  const theme = useTheme();
  const enough = tradeCount >= 10;
  const hasClosed = closedCount > 0;
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center mb-6 shadow-2xl">
        <Fingerprint className="w-10 h-10 text-white" />
      </div>
      <h2 className="text-2xl font-bold mb-2" style={{ color: theme.text }}>Discover Your Trading Identity</h2>
      <p className="max-w-lg mb-6" style={{ color: theme.muted }}>
        Based on your complete trade history, our AI will generate a deep personality profile: your archetype, 8 DNA trait scores, strengths &amp; weaknesses, and a personalised 30-day plan.
      </p>

      {/* Progress bar */}
      <div className="w-full max-w-xs mb-6">
        <div className="flex justify-between text-sm mb-2" style={{ color: theme.muted }}>
          <span>Trade history</span>
          <span>{Math.min(tradeCount, 10)}/10</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: theme.isDark ? '#27272a' : '#e4e4e7' }}>
          <div
            className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full transition-all duration-700"
            style={{ width: `${Math.min((tradeCount / 10) * 100, 100)}%` }}
          />
        </div>
        {!enough && (
          <p className="text-xs mt-2" style={{ color: theme.muted }}>Log {10 - tradeCount} more trades to unlock generation</p>
        )}
      </div>

      {!canGenerate && enough && nextAvailable && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm mb-6" style={{ background: theme.isDark ? 'rgba(120,53,15,0.3)' : '#fffbeb', border: `1px solid ${theme.isDark ? 'rgba(180,83,9,0.4)' : '#fcd34d'}`, color: theme.isDark ? '#fbbf24' : '#92400e' }}>
          <Calendar className="w-4 h-4" />
          <span>Next generation available {new Date(nextAvailable).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>
        </div>
      )}

      {enough && !hasClosed && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm mb-4" style={{ background: theme.isDark ? 'rgba(127,29,29,0.3)' : '#fff1f2', border: `1px solid ${theme.isDark ? 'rgba(185,28,28,0.4)' : '#fecdd3'}`, color: theme.isDark ? '#f87171' : '#be123c' }}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>All your trades are open — close some trades (mark as win/loss) first</span>
        </div>
      )}

      <button
        onClick={onGenerate}
        disabled={!enough || !hasClosed || !canGenerate || generating}
        className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-semibold rounded-xl shadow-lg hover:from-yellow-600 hover:to-yellow-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        {generating ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Analysing your trades...</>
        ) : (
          <><Sparkles className="w-4 h-4" /> Generate My Trading DNA</>
        )}
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function TradingDNA() {
  const { token, user } = useAuth();
  const { isElite, isAdmin } = usePlanGate();

  const [report,        setReport]        = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [generating,    setGenerating]    = useState(false);
  const [error,         setError]         = useState(null);
  const [tradeCount,    setTradeCount]    = useState(0);
  const [closedCount,   setClosedCount]   = useState(0);
  const [canGenerate,   setCanGenerate]   = useState(false);
  const [nextAvailable, setNextAvailable] = useState(null);

  const authHeaders = { Authorization: `Bearer ${token}` };

  const fetchLatest = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/analysis/trading-dna/latest`, { headers: authHeaders });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setReport(data.report);
      setTradeCount(data.tradeCount ?? 0);
      setClosedCount(data.closedCount ?? 0);
      setCanGenerate(data.canGenerate ?? false);
      setNextAvailable(data.nextAvailable ?? null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isElite || isAdmin) fetchLatest();
    else setLoading(false);
  }, [isElite, isAdmin, fetchLatest]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/analysis/trading-dna`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.insufficientData) { setError(`Need at least 10 trades (you have ${data.tradeCount}).`); return; }
        if (data.alreadyGenerated) { setError('Already generated this month.'); setCanGenerate(false); setNextAvailable(data.nextAvailable); return; }
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      // Re-fetch to get the saved report in canonical shape
      await fetchLatest();
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleShare = () => {
    if (!report) return;
    const rd = report.report_data || {};
    const st = rd.stats || { totalTrades: tradeCount, winRate: '—' };
    downloadDnaCard(report.archetype, report.trait_scores, st);
  };

  // ── Plan gate ──
  if (!isElite && !isAdmin) return <EliteGate />;

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
      </div>
    );
  }

  const rd = report?.report_data ?? {};
  const traits   = report?.trait_scores  ?? {};
  const strengths   = report?.strengths  ?? [];
  const weaknesses  = report?.weaknesses ?? [];
  const coachMsg    = report?.coach_message ?? '';
  const plan        = report?.improvement_plan ?? [];
  const radarData   = rd.radarData ?? [];
  const archetype   = report?.archetype ?? '';
  const tagline     = rd.tagline ?? '';
  const archetypeDesc = rd.archetypeDescription ?? '';

  // ── Empty / generate state ──
  if (!report) {
    return (
      <div>
        {error && <ErrorBar message={error} className="mb-4 max-w-xl mx-auto" />}
        <EmptyState
          tradeCount={tradeCount}
          closedCount={closedCount}
          canGenerate={canGenerate}
          generating={generating}
          nextAvailable={nextAvailable}
          onGenerate={handleGenerate}
        />
      </div>
    );
  }

  // ── Report view ──
  const theme = useTheme();
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: theme.text }}>Trading DNA Report</h1>
          <p className="text-xs mt-0.5" style={{ color: theme.muted }}>
            Generated {new Date(report.generated_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            {!canGenerate && nextAvailable && (
              <span className="ml-2 text-amber-400">
                · Next: {new Date(nextAvailable).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canGenerate && (
            <button
              onClick={handleGenerate}
              disabled={generating || tradeCount < 10}
              className="flex items-center gap-1.5 px-4 py-2 bg-yellow-600/20 border border-yellow-600/40 text-yellow-400 text-sm font-medium rounded-xl hover:bg-yellow-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Regenerate
            </button>
          )}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-4 py-2 bg-yellow-600/20 border border-yellow-600/40 text-yellow-400 text-sm font-medium rounded-xl hover:bg-yellow-600/30 transition-all"
          >
            <Download className="w-4 h-4" />
            Share Card
          </button>
        </div>
      </div>

      {error && <ErrorBar message={error} />}

      {/* Section 1: Archetype */}
      <ArchetypeCard archetype={archetype} tagline={tagline} archetypeDescription={archetypeDesc} />

      {/* Section 2: Trait bars */}
      <DnaStrands traits={traits} />

      {/* Section 3: Strengths & Weaknesses */}
      <StrengthsWeaknesses strengths={strengths} weaknesses={weaknesses} />

      {/* Section 4: Radar */}
      {radarData.length > 0 && <RadarFingerprint radarData={radarData} />}

      {/* Section 5: 30-day plan */}
      {plan.length > 0 && <ImprovementPlan plan={plan} />}

      {/* Section 6: Coach message */}
      {coachMsg && <CoachMessage message={coachMsg} userName={user?.name || user?.username} />}
    </div>
  );
}


