import { useState, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  ShieldCheck, Target, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle2, XCircle, Zap, BarChart3, Info, ChevronRight, Crosshair,
} from 'lucide-react';
import RiskInsights from './RiskInsights';
import axios from 'axios';
import { API_URL } from '../config/api';
import { getAuthToken } from '../utils/authStorage';

const api = axios.create({ baseURL: `${API_URL}/api`, timeout: 15000 });
api.interceptors.request.use((c) => {
  const t = getAuthToken();
  if (t) c.headers['Authorization'] = `Bearer ${t}`;
  return c;
});

/* ── helpers ─────────────────────────────────────────── */
const REALISM = (s) =>
  s >= 80 ? { label: 'Highly Realistic', color: '#10b981', bg: 'rgba(16,185,129,0.10)', icon: CheckCircle2 }
  : s >= 60 ? { label: 'Realistic', color: '#22d3ee', bg: 'rgba(34,211,238,0.10)', icon: CheckCircle2 }
  : s >= 40 ? { label: 'Moderate', color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', icon: AlertTriangle }
  : s >= 20 ? { label: 'Aggressive', color: '#f97316', bg: 'rgba(249,115,22,0.10)', icon: AlertTriangle }
  : { label: 'Unrealistic', color: '#ef4444', bg: 'rgba(239,68,68,0.10)', icon: XCircle };

const RISK_TIER = (r) =>
  r > 5 ? { label: 'Extreme', color: '#ef4444' }
  : r > 3 ? { label: 'High', color: '#f97316' }
  : r > 2 ? { label: 'Elevated', color: '#f59e0b' }
  : r > 1 ? { label: 'Balanced', color: '#10b981' }
  : { label: 'Conservative', color: '#22d3ee' };

const fmtUsd = (v) => '$' + Number(v).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

function getWarnings(form, result) {
  const w = [];
  const bal = parseFloat(form.balance) || 0;
  const tgt = parseFloat(form.target) || 0;
  const trades = parseInt(form.trades, 10) || 0;
  const growth = tgt && bal ? ((tgt - bal) / bal) * 100 : 0;

  if (growth > 100) w.push({ type: 'error', text: `Targeting ${growth.toFixed(0)}% growth — extremely ambitious. Consider smaller milestones.` });
  else if (growth > 50) w.push({ type: 'warn', text: `${growth.toFixed(0)}% growth target is aggressive. Ensure your edge supports it.` });

  if (trades < 20) w.push({ type: 'warn', text: 'Very few trades — results will have high variance. Try 50+.' });
  if (trades > 500) w.push({ type: 'info', text: 'Large trade count gives reliable projections, but execution consistency matters.' });

  if (result) {
    if (result.suggestedRiskPerTrade > 5) w.push({ type: 'error', text: `${result.suggestedRiskPerTrade}% risk per trade risks rapid drawdown. Pro traders rarely exceed 2%.` });
    else if (result.suggestedRiskPerTrade > 3) w.push({ type: 'warn', text: 'Risk per trade is above 3% — only sustainable with a strong win rate.' });
    if (result.realismScore < 30) w.push({ type: 'error', text: 'This plan has a low probability of success. Reduce target or increase trades.' });
  }
  return w;
}

/* ── component ───────────────────────────────────────── */
export default function RiskPlanner() {
  const theme = useTheme();
  const [form, setForm] = useState({ balance: '', target: '', trades: '', winRate: '', riskOverride: '' });
  const [sliderActive, setSliderActive] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const plan = async () => {
    setError('');
    if (!form.balance || !form.target || !form.trades) { setError('Balance, target, and trades are required'); return; }
    if (parseFloat(form.target) <= parseFloat(form.balance)) { setError('Target must be greater than current balance'); return; }
    setLoading(true);
    try {
      const body = {
        balance: parseFloat(form.balance),
        target: parseFloat(form.target),
        trades: parseInt(form.trades, 10),
      };
      if (form.winRate) body.winRate = parseFloat(form.winRate);
      if (sliderActive && form.riskOverride) body.riskOverride = parseFloat(form.riskOverride);
      const { data } = await api.post('/calc/risk-plan', body);
      setResult(data.data);
    } catch (err) {
      const e = err.response?.data?.error;
      setError(typeof e === 'string' ? e : (e?.message || err.message || 'Planning failed'));
    } finally {
      setLoading(false);
    }
  };

  /* goal completion % */
  const goalPct = useMemo(() => {
    if (!result || !form.balance || !form.target) return 0;
    const bal = parseFloat(form.balance);
    const tgt = parseFloat(form.target);
    const proj = result.finalBalanceProjection;
    if (tgt <= bal) return 0;
    return Math.min(100, Math.max(0, ((proj - bal) / (tgt - bal)) * 100));
  }, [result, form.balance, form.target]);

  const warnings = useMemo(() => getWarnings(form, result), [form, result]);

  const isDark = theme.isDark;
  const bg = isDark ? '#0f172a' : '#f1f5f9';
  const card = isDark ? 'rgba(255,255,255,0.035)' : '#ffffff';
  const cardHover = isDark ? 'rgba(255,255,255,0.055)' : '#fafafa';
  const border = theme.border;
  const inputBg = isDark ? 'rgba(255,255,255,0.06)' : '#f8fafc';
  const LBL = 'text-[11px] font-semibold tracking-wider uppercase mb-1.5';
  const INP = 'w-full h-11 px-3.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-violet-500/30';

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8" style={{ background: bg }}>
      <div className="max-w-5xl mx-auto">

        {/* ── Header ─────────────────────────────── */}
        <div className="flex items-center gap-3.5 mb-7">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
            <ShieldCheck className="w-5.5 h-5.5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: theme.text }}>Risk Planner</h1>
            <p className="text-xs mt-0.5" style={{ color: theme.muted }}>
              Model your path from current balance to target — see exactly what risk profile is needed
            </p>
          </div>
        </div>

        {/* ── Main Grid ──────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* ── LEFT: Inputs (3 cols) ──────────── */}
          <div className="lg:col-span-3 space-y-5">

            {/* Balance & Target */}
            <div className="rounded-2xl border p-5 shadow-sm" style={{ background: card, borderColor: border }}>
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4" style={{ color: '#8b5cf6' }} />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.muted }}>Account Setup</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LBL} style={{ color: theme.muted }}>Current Balance</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold" style={{ color: theme.muted }}>$</span>
                    <input type="number" step="any" min="1" value={form.balance} onChange={set('balance')}
                      className={`${INP} pl-7`} placeholder="10,000"
                      style={{ background: inputBg, borderColor: border, color: theme.text }} />
                  </div>
                </div>
                <div>
                  <label className={LBL} style={{ color: theme.muted }}>Target Balance</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold" style={{ color: theme.muted }}>$</span>
                    <input type="number" step="any" min="1" value={form.target} onChange={set('target')}
                      className={`${INP} pl-7`} placeholder="15,000"
                      style={{ background: inputBg, borderColor: border, color: theme.text }} />
                  </div>
                </div>
              </div>

              {/* Growth preview */}
              {form.balance && form.target && parseFloat(form.target) > parseFloat(form.balance) && (
                <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: isDark ? 'rgba(139,92,246,0.08)' : '#f5f3ff' }}>
                  <TrendingUp className="w-3.5 h-3.5" style={{ color: '#8b5cf6' }} />
                  <span className="text-xs font-medium" style={{ color: isDark ? '#c4b5fd' : '#7c3aed' }}>
                    Growth target: +{(((parseFloat(form.target) - parseFloat(form.balance)) / parseFloat(form.balance)) * 100).toFixed(1)}%
                    ({fmtUsd(parseFloat(form.target) - parseFloat(form.balance))} gain)
                  </span>
                </div>
              )}
            </div>

            {/* Trade Parameters */}
            <div className="rounded-2xl border p-5 shadow-sm" style={{ background: card, borderColor: border }}>
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4" style={{ color: '#8b5cf6' }} />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.muted }}>Trade Parameters</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LBL} style={{ color: theme.muted }}>Number of Trades</label>
                  <input type="number" step="1" min="1" value={form.trades} onChange={set('trades')}
                    className={INP} placeholder="100"
                    style={{ background: inputBg, borderColor: border, color: theme.text }} />
                </div>
                <div>
                  <label className={LBL} style={{ color: theme.muted }}>
                    Win Rate % <span className="opacity-50 normal-case">(optional, default 55%)</span>
                  </label>
                  <input type="number" step="1" min="1" max="99" value={form.winRate} onChange={set('winRate')}
                    className={INP} placeholder="55"
                    style={{ background: inputBg, borderColor: border, color: theme.text }} />
                </div>
              </div>

              {/* Risk % Slider */}
              <div className="mt-5">
                <div className="flex items-center justify-between mb-2">
                  <label className={LBL + ' mb-0'} style={{ color: theme.muted }}>
                    Risk % Override <span className="opacity-50 normal-case">(optional)</span>
                  </label>
                  <button onClick={() => { setSliderActive(!sliderActive); if (sliderActive) setForm(p => ({ ...p, riskOverride: '' })); }}
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-md transition-all"
                    style={{
                      background: sliderActive ? 'rgba(139,92,246,0.15)' : isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                      color: sliderActive ? '#8b5cf6' : theme.muted,
                    }}>
                    {sliderActive ? 'Enabled' : 'Use Slider'}
                  </button>
                </div>

                {sliderActive && (
                  <div className="rounded-xl px-4 py-3 space-y-2" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#fafafa', border: `1px solid ${border}` }}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: theme.muted }}>0.5%</span>
                      <span className="text-sm font-bold tabular-nums" style={{ color: '#8b5cf6' }}>
                        {form.riskOverride || '2.0'}%
                      </span>
                      <span className="text-xs" style={{ color: theme.muted }}>10%</span>
                    </div>
                    <input type="range" min="0.5" max="10" step="0.5"
                      value={form.riskOverride || 2}
                      onChange={(e) => setForm(p => ({ ...p, riskOverride: e.target.value }))}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #8b5cf6 ${((parseFloat(form.riskOverride || 2) - 0.5) / 9.5) * 100}%, ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'} 0%)`,
                      }} />
                    <div className="flex gap-1">
                      {[1, 2, 3, 5].map((v) => (
                        <button key={v} onClick={() => setForm(p => ({ ...p, riskOverride: String(v) }))}
                          className="flex-1 text-[10px] font-semibold py-1 rounded-md transition-all"
                          style={{
                            background: parseFloat(form.riskOverride) === v ? 'rgba(139,92,246,0.15)' : 'transparent',
                            color: parseFloat(form.riskOverride) === v ? '#8b5cf6' : theme.muted,
                          }}>
                          {v}%
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="space-y-2">
                {warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2.5 rounded-xl px-4 py-3 text-xs leading-relaxed"
                    style={{
                      background: w.type === 'error' ? (isDark ? 'rgba(239,68,68,0.08)' : '#fef2f2')
                        : w.type === 'warn' ? (isDark ? 'rgba(245,158,11,0.08)' : '#fffbeb')
                        : (isDark ? 'rgba(59,130,246,0.08)' : '#eff6ff'),
                      border: `1px solid ${w.type === 'error' ? (isDark ? 'rgba(239,68,68,0.15)' : '#fecaca')
                        : w.type === 'warn' ? (isDark ? 'rgba(245,158,11,0.15)' : '#fde68a')
                        : (isDark ? 'rgba(59,130,246,0.15)' : '#bfdbfe')}`,
                      color: w.type === 'error' ? '#ef4444' : w.type === 'warn' ? '#f59e0b' : '#3b82f6',
                    }}>
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span style={{ color: isDark ? undefined : (w.type === 'error' ? '#991b1b' : w.type === 'warn' ? '#92400e' : '#1e40af') }}>
                      {w.text}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Submit */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium"
                style={{ background: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', color: '#ef4444', border: `1px solid ${isDark ? 'rgba(239,68,68,0.2)' : '#fecaca'}` }}>
                <XCircle className="w-3.5 h-3.5" /> {error}
              </div>
            )}

            <button onClick={plan} disabled={loading}
              className="w-full h-12 rounded-2xl text-sm font-bold text-white transition-all hover:brightness-110 hover:shadow-lg hover:shadow-violet-500/25 active:scale-[0.98] flex items-center justify-center gap-2.5 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Simulating...
                </div>
              ) : (
                <><Zap className="w-4 h-4" /> Generate Risk Plan</>
              )}
            </button>
          </div>

          {/* ── RIGHT: Results (2 cols) ────────── */}
          <div className="lg:col-span-2 space-y-5">

            {!result ? (
              /* Empty state */
              <div className="rounded-2xl border p-8 flex flex-col items-center justify-center text-center min-h-[340px]"
                style={{ background: card, borderColor: border }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: isDark ? 'rgba(139,92,246,0.08)' : '#f5f3ff' }}>
                  <BarChart3 className="w-7 h-7" style={{ color: isDark ? '#a78bfa' : '#8b5cf6' }} />
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: theme.text }}>No plan generated yet</p>
                <p className="text-xs leading-relaxed max-w-[220px]" style={{ color: theme.muted }}>
                  Fill in your account details and hit Generate to see your risk profile
                </p>
              </div>
            ) : (
              <>
                {/* Goal Progress */}
                <div className="rounded-2xl border p-5 shadow-sm" style={{ background: card, borderColor: border }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: theme.muted }}>Goal Completion</span>
                    <span className="text-sm font-bold tabular-nums" style={{ color: goalPct >= 100 ? '#10b981' : '#8b5cf6' }}>
                      {goalPct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0' }}>
                    <div className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${goalPct}%`,
                        background: goalPct >= 100
                          ? 'linear-gradient(90deg, #10b981, #059669)'
                          : goalPct >= 70
                          ? 'linear-gradient(90deg, #8b5cf6, #6d28d9)'
                          : 'linear-gradient(90deg, #f59e0b, #d97706)',
                      }} />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] font-medium" style={{ color: theme.muted }}>{fmtUsd(form.balance)}</span>
                    <ChevronRight className="w-3 h-3" style={{ color: theme.muted }} />
                    <span className="text-[10px] font-bold" style={{ color: goalPct >= 100 ? '#10b981' : '#8b5cf6' }}>
                      {fmtUsd(result.finalBalanceProjection)}
                    </span>
                    <ChevronRight className="w-3 h-3" style={{ color: theme.muted }} />
                    <span className="text-[10px] font-medium" style={{ color: theme.muted }}>{fmtUsd(form.target)}</span>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="rounded-2xl border p-5 shadow-sm space-y-3" style={{ background: card, borderColor: border }}>
                  <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: theme.muted }}>Risk Plan</span>

                  {/* Risk Per Trade — hero stat */}
                  <div className="rounded-xl px-4 py-4 text-center"
                    style={{ background: isDark ? 'rgba(139,92,246,0.06)' : '#f5f3ff', border: `1px solid ${isDark ? 'rgba(139,92,246,0.12)' : '#ede9fe'}` }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: theme.muted }}>Suggested Risk Per Trade</p>
                    <p className="text-3xl font-black tabular-nums" style={{ color: '#8b5cf6' }}>{result.suggestedRiskPerTrade}%</p>
                    <span className="inline-block mt-1.5 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full"
                      style={{ background: RISK_TIER(result.suggestedRiskPerTrade).color + '18', color: RISK_TIER(result.suggestedRiskPerTrade).color }}>
                      {RISK_TIER(result.suggestedRiskPerTrade).label}
                    </span>
                    {result.optimalRisk && (
                      <div className="mt-2 flex items-center justify-center gap-1.5">
                        <Crosshair className="w-3 h-3" style={{ color: '#10b981' }} />
                        <span className="text-[10px] font-semibold" style={{ color: '#10b981' }}>
                          Min risk to reach target: {result.optimalRisk}%
                        </span>
                      </div>
                    )}
                    {result.reachable === false && (
                      <div className="mt-2 flex items-center justify-center gap-1.5 px-2 py-1 rounded-md" style={{ background: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2' }}>
                        <AlertTriangle className="w-3 h-3" style={{ color: '#ef4444' }} />
                        <span className="text-[10px] font-semibold" style={{ color: '#ef4444' }}>
                          Target unreachable at ≤5% risk. Increase trades or lower target.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Projected Balance */}
                  <MetricRow icon={TrendingUp} iconColor="#10b981" label="Projected Balance"
                    value={fmtUsd(result.finalBalanceProjection)} theme={theme} isDark={isDark} />

                  {/* Wins / Losses */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl px-3 py-3 text-center" style={{ background: isDark ? 'rgba(16,185,129,0.06)' : '#ecfdf5' }}>
                      <p className="text-[10px] font-semibold uppercase mb-0.5" style={{ color: '#10b981' }}>Expected Wins</p>
                      <p className="text-xl font-bold tabular-nums" style={{ color: '#10b981' }}>{result.expectedWins}</p>
                    </div>
                    <div className="rounded-xl px-3 py-3 text-center" style={{ background: isDark ? 'rgba(239,68,68,0.06)' : '#fef2f2' }}>
                      <p className="text-[10px] font-semibold uppercase mb-0.5" style={{ color: '#ef4444' }}>Expected Losses</p>
                      <p className="text-xl font-bold tabular-nums" style={{ color: '#ef4444' }}>{result.expectedLosses}</p>
                    </div>
                  </div>
                </div>

                {/* Scenario Breakdown */}
                {result.scenarioBreakdown && result.scenarioBreakdown.length > 0 && (
                  <div className="rounded-2xl border p-5 shadow-sm" style={{ background: card, borderColor: border }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Crosshair className="w-4 h-4" style={{ color: '#8b5cf6' }} />
                      <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: theme.muted }}>Risk Sweep (0.5% → 5%)</span>
                    </div>
                    <div className="space-y-1.5">
                      {result.scenarioBreakdown.map((s) => {
                        const isOptimal = result.optimalRisk && s.riskPercent === result.optimalRisk;
                        const barWidth = Math.min(100, (s.expectedBalance / parseFloat(form.target)) * 100);
                        return (
                          <div key={s.riskPercent}
                            className="rounded-lg px-3 py-2 transition-all"
                            style={{
                              background: isOptimal
                                ? (isDark ? 'rgba(139,92,246,0.10)' : '#f5f3ff')
                                : (isDark ? 'rgba(255,255,255,0.02)' : '#fafafa'),
                              border: isOptimal ? `1px solid ${isDark ? 'rgba(139,92,246,0.25)' : '#ddd6fe'}` : '1px solid transparent',
                            }}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold tabular-nums" style={{ color: isOptimal ? '#8b5cf6' : theme.text }}>
                                  {s.riskPercent}%
                                </span>
                                {isOptimal && (
                                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                                    style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6' }}>
                                    Optimal
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-semibold tabular-nums" style={{ color: s.reachesTarget ? '#10b981' : theme.muted }}>
                                  {fmtUsd(s.expectedBalance)}
                                </span>
                                {s.reachesTarget
                                  ? <CheckCircle2 className="w-3 h-3" style={{ color: '#10b981' }} />
                                  : <XCircle className="w-3 h-3" style={{ color: isDark ? 'rgba(255,255,255,0.15)' : '#d1d5db' }} />
                                }
                              </div>
                            </div>
                            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0' }}>
                              <div className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${barWidth}%`,
                                  background: s.reachesTarget
                                    ? (isOptimal ? '#8b5cf6' : '#10b981')
                                    : (isDark ? 'rgba(255,255,255,0.12)' : '#cbd5e1'),
                                }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-2.5 flex items-center gap-1.5 px-1">
                      <div className="w-2 h-2 rounded-full" style={{ background: '#10b981' }} />
                      <span className="text-[10px]" style={{ color: theme.muted }}>Reaches target</span>
                      <div className="w-2 h-2 rounded-full ml-2" style={{ background: isDark ? 'rgba(255,255,255,0.12)' : '#cbd5e1' }} />
                      <span className="text-[10px]" style={{ color: theme.muted }}>Below target</span>
                    </div>
                  </div>
                )}

                {/* Realism Indicator */}
                <div className="rounded-2xl border p-5 shadow-sm" style={{ background: card, borderColor: border }}>
                  {(() => {
                    const r = REALISM(result.realismScore);
                    const Icon = r.icon;
                    return (
                      <>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: theme.muted }}>Realism Score</span>
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: r.bg }}>
                            <Icon className="w-3.5 h-3.5" style={{ color: r.color }} />
                            <span className="text-xs font-bold" style={{ color: r.color }}>{r.label}</span>
                          </div>
                        </div>
                        <div className="flex items-end gap-3 mb-2">
                          <span className="text-4xl font-black tabular-nums leading-none" style={{ color: r.color }}>{result.realismScore}</span>
                          <span className="text-sm font-medium pb-0.5" style={{ color: theme.muted }}>/100</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0' }}>
                          <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${result.realismScore}%`, background: r.color }} />
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* AI Insight */}
                {result.insight && (
                  <div className="rounded-2xl border p-4 shadow-sm" style={{ background: isDark ? 'rgba(139,92,246,0.04)' : '#faf5ff', borderColor: isDark ? 'rgba(139,92,246,0.12)' : '#ede9fe' }}>
                    <div className="flex items-start gap-2.5">
                      <Info className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#8b5cf6' }} />
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: isDark ? '#a78bfa' : '#7c3aed' }}>Strategy Insight</p>
                        <p className="text-xs leading-relaxed" style={{ color: isDark ? '#c4b5fd' : '#6d28d9' }}>
                          {result.insight}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Dynamic Risk Insights */}
                <RiskInsights
                  riskPercent={result.suggestedRiskPerTrade}
                  winRate={parseFloat(form.winRate) || 55}
                  trades={parseInt(form.trades, 10) || 0}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── sub-components ──────────────────────────────────── */
function MetricRow({ icon: Icon, iconColor, label, value, theme, isDark }) {
  return (
    <div className="flex items-center justify-between rounded-xl px-4 py-3"
      style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc' }}>
      <div className="flex items-center gap-2.5">
        <Icon className="w-4 h-4" style={{ color: iconColor }} />
        <span className="text-xs font-medium" style={{ color: theme.muted }}>{label}</span>
      </div>
      <span className="text-sm font-bold tabular-nums" style={{ color: theme.text }}>{value}</span>
    </div>
  );
}
