import { useState, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  ShieldCheck, Target, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle2, XCircle, Zap, BarChart3, Info, ChevronRight, Crosshair,
  Activity, Brain,
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

/* â”€â”€ helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   MATH ENGINE â€” pure functions, all client-side
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function runMonteCarlo({ balance, winRate, riskPct, trades, rrRatio = 2, sims = 1000 }) {
  const wr   = winRate / 100;
  const risk = riskPct  / 100;
  const n    = Math.min(trades, 500);
  const sampleStep = Math.max(1, Math.floor(sims / 30));
  const sampleSet  = new Set();
  for (let i = 0; i < sims; i += sampleStep) sampleSet.add(i);
  const finals       = new Float64Array(sims);
  const maxDDs       = new Float32Array(sims);
  const sampleCurves = [];
  for (let s = 0; s < sims; s++) {
    let bal = balance, maxBal = balance, maxDD = 0;
    const keep = sampleSet.has(s);
    const curve = keep ? [balance] : null;
    for (let t = 0; t < n; t++) {
      if (bal <= 0) { if (keep) curve.push(0); continue; }
      bal = Math.random() < wr ? bal * (1 + risk * rrRatio) : bal * (1 - risk);
      if (bal > maxBal) maxBal = bal;
      const dd = (maxBal - bal) / maxBal;
      if (dd > maxDD) maxDD = dd;
      if (keep) curve.push(bal);
    }
    finals[s] = bal;
    maxDDs[s]  = maxDD;
    if (keep) sampleCurves.push(curve);
  }
  const sf = Array.from(finals).sort((a, b) => a - b);
  const sd = Array.from(maxDDs).sort((a, b) => a - b);
  const ruinCount = Array.from(finals).filter(f => f < balance * 0.20).length;
  const dd30Count = Array.from(maxDDs).filter(d => d >= 0.30).length;
  return {
    worst: sf[Math.floor(sims * 0.10)], median: sf[Math.floor(sims * 0.50)], best: sf[Math.floor(sims * 0.90)],
    medianDD: sd[Math.floor(sims * 0.50)] * 100, worstDD: sd[Math.floor(sims * 0.90)] * 100,
    ruinPct: (ruinCount / sims) * 100, dd30Pct: (dd30Count / sims) * 100,
    sampleCurves, initialBalance: balance, simTrades: n,
  };
}

function calcRiskSuccessCurve({ balance, target, winRate, trades, rrRatio = 2, sims = 500 }) {
  const LEVELS = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 10];
  const wr = winRate / 100;
  const n  = Math.min(trades, 300);
  return LEVELS.map(riskPctVal => {
    const risk = riskPctVal / 100;
    let reaches = 0;
    for (let s = 0; s < sims; s++) {
      let bal = balance;
      for (let t = 0; t < n; t++) {
        if (bal >= target || bal <= 0) break;
        bal = Math.random() < wr ? bal * (1 + risk * rrRatio) : bal * (1 - risk);
      }
      if (bal >= target) reaches++;
    }
    return { riskPct: riskPctVal, successPct: (reaches / sims) * 100 };
  });
}

function calcExpectancy({ winRate, riskPct, rrRatio, balance }) {
  const wr = winRate / 100, lr = 1 - wr;
  const eR = wr * rrRatio - lr;
  const e$ = eR * balance * (riskPct / 100);
  const edgeLabel = eR >= 0.40 ? 'Strong' : eR >= 0.15 ? 'Moderate' : eR > 0 ? 'Weak' : 'Negative';
  const edgeColor = eR >= 0.40 ? '#10b981' : eR >= 0.15 ? '#f59e0b' : eR > 0 ? '#f97316' : '#ef4444';
  return { expectancyR: eR, expectancyDollar: e$, edgeLabel, edgeColor, label: eR >= 0 ? 'Positive Edge' : 'Negative Edge' };
}

function calcLosingStreak({ winRate, trades, riskPct }) {
  const q = 1 - winRate / 100;
  if (q <= 0) return { expected: 0, worst: 0, impact: 0, expectedImpact: 0 };
  const expected = Math.max(1, Math.round(Math.log(trades * q) / Math.log(1 / q)));
  const worst    = Math.round(expected * 1.75);
  const impact         = (1 - Math.pow(1 - riskPct / 100, worst))    * 100;
  const expectedImpact = (1 - Math.pow(1 - riskPct / 100, expected)) * 100;
  return { expected, worst, impact, expectedImpact };
}

function generateSmartInsights({ winRate, riskPct, rrRatio, ruinPct, expectancy, streak }) {
  const insights = [];
  const wr = winRate / 100;
  const kelly = (wr * (rrRatio + 1) - 1) / rrRatio;
  const halfKelly = kelly * 0.5;
  if (kelly <= 0) {
    insights.push({ type: 'error', text: `Negative edge detected. Kelly Criterion = ${(kelly*100).toFixed(1)}%. No risk size makes this profitable long-term.` });
  } else if (riskPct > kelly * 100 * 1.1) {
    insights.push({ type: 'error', text: `Over-leveraged. You're risking ${riskPct}% per trade â€” Kelly optimal is ${(kelly*100).toFixed(1)}% (Half-Kelly: ${(halfKelly*100).toFixed(1)}%). Reduce size.` });
  } else if (riskPct <= halfKelly * 100) {
    insights.push({ type: 'success', text: `${riskPct}% risk sits below Half-Kelly (${(halfKelly*100).toFixed(1)}%) â€” conservative and sustainable for long-term compounding.` });
  } else {
    insights.push({ type: 'info', text: `Risk is between Half-Kelly and Full-Kelly. Consider reducing to ${(halfKelly*100).toFixed(1)}% for safer compounding.` });
  }
  if (ruinPct > 50) {
    insights.push({ type: 'error', text: `${ruinPct.toFixed(0)}% blowup probability â€” 1-in-2 traders with these parameters lose everything. Reduce risk immediately.` });
  } else if (ruinPct > 20) {
    insights.push({ type: 'error', text: `${ruinPct.toFixed(0)}% ruin probability. 1-in-5 paths end in account loss. Reduce risk to 2% or below.` });
  } else if (ruinPct > 5) {
    insights.push({ type: 'warn', text: `${ruinPct.toFixed(0)}% ruin probability â€” elevated. Acceptable only for aggressive accounts with strict stop rules.` });
  } else {
    insights.push({ type: 'success', text: `${ruinPct.toFixed(1)}% ruin probability â€” excellent. This risk level is sustainable over a long trading career.` });
  }
  if (expectancy && expectancy.expectancyR < 0) {
    const minWR = (100 / (1 + rrRatio)).toFixed(0);
    const minRR = (1 / wr - 1).toFixed(2);
    insights.push({ type: 'error', text: `Negative expectancy (${expectancy.expectancyR.toFixed(3)}R). You need Win Rate â‰¥ ${minWR}% OR R:R â‰¥ ${minRR}:1 to break even.` });
  }
  if (streak && streak.impact > 50) {
    insights.push({ type: 'error', text: `Worst-case losing streak (${streak.worst} losses) wipes ${streak.impact.toFixed(0)}% of your account at ${riskPct}% per trade. Normal variance can destroy this account.` });
  } else if (streak && streak.impact > 25) {
    insights.push({ type: 'warn', text: `${streak.worst}-loss streak causes ${streak.impact.toFixed(0)}% drawdown. Have a plan: reduce size or pause trading during streaks.` });
  }
  if (ruinPct < 5 && expectancy && expectancy.expectancyR > 0.2 && streak && streak.impact < 25) {
    insights.push({ type: 'success', text: `Solid setup: ${expectancy.expectancyR.toFixed(2)}R expectancy, ${ruinPct.toFixed(1)}% ruin risk, worst-streak drawdown is manageable. Scale with discipline.` });
  }
  return insights;
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   HELPERS
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const REALISM = (s) =>
  s >= 80 ? { label: 'Highly Realistic', color: '#10b981', bg: 'rgba(16,185,129,0.10)', icon: CheckCircle2 }
  : s >= 60 ? { label: 'Realistic', color: '#CA8A04', bg: 'rgba(202,138,4,0.10)', icon: CheckCircle2 }
  : s >= 40 ? { label: 'Moderate', color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', icon: AlertTriangle }
  : s >= 20 ? { label: 'Aggressive', color: '#f97316', bg: 'rgba(249,115,22,0.10)', icon: AlertTriangle }
  : { label: 'Unrealistic', color: '#ef4444', bg: 'rgba(239,68,68,0.10)', icon: XCircle };

const RISK_TIER = (r) =>
  r > 5 ? { label: 'Extreme', color: '#ef4444' }
  : r > 3 ? { label: 'High', color: '#f97316' }
  : r > 2 ? { label: 'Elevated', color: '#f59e0b' }
  : r > 1 ? { label: 'Balanced', color: '#10b981' }
  : { label: 'Conservative', color: '#CA8A04' };

const fmtUsd = (v) => '$' + Number(v).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtPct = (v, d = 1) => Number(v).toFixed(d) + '%';

function getWarnings(form, result) {
  const w = [];
  const bal = parseFloat(form.balance) || 0;
  const tgt = parseFloat(form.target) || 0;
  const trades = parseInt(form.trades, 10) || 0;
  const growth = tgt && bal ? ((tgt - bal) / bal) * 100 : 0;

  if (growth > 100) w.push({ type: 'error', text: `Targeting ${growth.toFixed(0)}% growth â€” extremely ambitious. Consider smaller milestones.` });
  else if (growth > 50) w.push({ type: 'warn', text: `${growth.toFixed(0)}% growth target is aggressive. Ensure your edge supports it.` });

  if (trades < 20) w.push({ type: 'warn', text: 'Very few trades â€” results will have high variance. Try 50+.' });
  if (trades > 500) w.push({ type: 'info', text: 'Large trade count gives reliable projections, but execution consistency matters.' });

  if (result) {
    if (result.suggestedRiskPerTrade > 5) w.push({ type: 'error', text: `${result.suggestedRiskPerTrade}% risk per trade risks rapid drawdown. Pro traders rarely exceed 2%.` });
    else if (result.suggestedRiskPerTrade > 3) w.push({ type: 'warn', text: 'Risk per trade is above 3% â€” only sustainable with a strong win rate.' });
    if (result.realismScore < 30) w.push({ type: 'error', text: 'This plan has a low probability of success. Reduce target or increase trades.' });
  }
  return w;
}
/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
STRATEGY PRESETS
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const PRESETS = [
  { key: 'conservative', label: 'Conservative', desc: '1% risk · 1.5 R:R · slow and deep survival',       riskOverride: '1',   rrRatio: '1.5', winRate: '55', color: '#CA8A04' },
  { key: 'balanced',     label: 'Balanced',     desc: '2% risk · 2 R:R · optimal for most traders',      riskOverride: '2',   rrRatio: '2',   winRate: '55', color: '#CA8A04', recommended: true },
  { key: 'aggressive',   label: 'Aggressive',   desc: '4% risk · 2.5 R:R · higher upside, higher ruin', riskOverride: '4',   rrRatio: '2.5', winRate: '55', color: '#f97316' },
];

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
SVG CHART â€” EQUITY CURVE FAN
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function EquityCurveChart({ sampleCurves, initialBalance, isDark }) {
  if (!sampleCurves?.length) return null;
  const W = 400, H = 160;
  const P = { t: 8, r: 8, b: 24, l: 48 };
  const cW = W - P.l - P.r, cH = H - P.t - P.b;
  let minV = Infinity, maxV = -Infinity;
  for (const c of sampleCurves)
    for (const v of c) { if (v < minV) minV = v; if (v > maxV) maxV = v; }
  minV = Math.min(minV, initialBalance * 0.4);
  maxV = Math.max(maxV, initialBalance * 1.1);
  const range = maxV - minV || 1;
  const sx = (i, len) => P.l + (i / Math.max(1, len - 1)) * cW;
  const sy = (v) => P.t + cH - ((v - minV) / range) * cH;
  const pd = (c) => c.map((v, i) => `${i === 0 ? 'M' : 'L'}${sx(i, c.length).toFixed(1)},${sy(v).toFixed(1)}`).join(' ');
  const sorted = [...sampleCurves].sort((a, b) => a[a.length - 1] - b[b.length - 1]);
  const t33 = Math.floor(sorted.length * 0.33);
  const t67 = Math.floor(sorted.length * 0.67);
  const mid = Math.floor(sorted.length / 2);
  const yMarks = [minV, initialBalance, maxV];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      {yMarks.map((v, i) => (
        <g key={i}>
          <line x1={P.l} y1={sy(v)} x2={W - P.r} y2={sy(v)}
            stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'} strokeWidth="1" />
          <text x={P.l - 4} y={sy(v) + 4} textAnchor="end" fontSize="8"
            fill={isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.3)'}>{fmtUsd(v)}</text>
        </g>
      ))}
      <line x1={P.l} y1={sy(initialBalance)} x2={W - P.r} y2={sy(initialBalance)}
        stroke={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'} strokeDasharray="3,3" strokeWidth="1" />
      {sorted.slice(0, t33).map((c, i) => (
        <path key={`r${i}`} d={pd(c)} fill="none" stroke={isDark ? 'rgba(239,68,68,0.14)' : 'rgba(239,68,68,0.18)'} strokeWidth="1.2" />
      ))}
      {sorted.slice(t33, t67).map((c, i) => (
        <path key={`m${i}`} d={pd(c)} fill="none" stroke={isDark ? 'rgba(202,138,4,0.18)' : 'rgba(202,138,4,0.2)'} strokeWidth="1.2" />
      ))}
      {sorted.slice(t67).map((c, i) => (
        <path key={`g${i}`} d={pd(c)} fill="none" stroke={isDark ? 'rgba(16,185,129,0.18)' : 'rgba(16,185,129,0.2)'} strokeWidth="1.2" />
      ))}
      {sorted[mid] && (
        <path d={pd(sorted[mid])} fill="none" stroke="#CA8A04" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

function RiskSuccessChart({ curve, activeRisk, isDark }) {
  if (!curve?.length) return null;
  const W = 400, H = 140;
  const P = { t: 8, r: 12, b: 28, l: 36 };
  const cW = W - P.l - P.r, cH = H - P.t - P.b;
  const sx = (v) => P.l + (v / 10) * cW;
  const sy = (v) => P.t + cH - (v / 100) * cH;
  const lineD = curve.map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p.riskPct).toFixed(1)},${sy(p.successPct).toFixed(1)}`).join(' ');
  const areaD = lineD + ` L${sx(curve[curve.length - 1].riskPct)},${P.t + cH} L${sx(curve[0].riskPct)},${P.t + cH} Z`;
  const activePoint = activeRisk != null
    ? curve.reduce((n, p) => Math.abs(p.riskPct - activeRisk) < Math.abs(n.riskPct - activeRisk) ? p : n)
    : null;
  const yLabels = [0, 25, 50, 75, 100];
  const xLabels = [1, 2, 3, 5, 7, 10];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <linearGradient id="rscGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#CA8A04" stopOpacity={isDark ? 0.28 : 0.18} />
          <stop offset="100%" stopColor="#CA8A04" stopOpacity="0" />
        </linearGradient>
      </defs>
      {yLabels.map(v => (
        <g key={v}>
          <line x1={P.l} y1={sy(v)} x2={W - P.r} y2={sy(v)}
            stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'} strokeWidth="1" />
          <text x={P.l - 4} y={sy(v) + 3} textAnchor="end" fontSize="8"
            fill={isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.3)'}>{v}%</text>
        </g>
      ))}
      {xLabels.map(v => (
        <text key={v} x={sx(v)} y={H - 6} textAnchor="middle" fontSize="8"
          fill={isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.3)'}>{v}%</text>
      ))}
      <path d={areaD} fill="url(#rscGrad)" />
      <path d={lineD} fill="none" stroke="#CA8A04" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {activePoint && (
        <>
          <line x1={sx(activePoint.riskPct)} y1={P.t} x2={sx(activePoint.riskPct)} y2={P.t + cH}
            stroke="#f59e0b" strokeDasharray="3,3" strokeWidth="1.5" />
          <circle cx={sx(activePoint.riskPct)} cy={sy(activePoint.successPct)} r="5"
            fill="#f59e0b" stroke={isDark ? '#161618' : '#fff'} strokeWidth="2" />
          <text x={sx(activePoint.riskPct) + 7} y={sy(activePoint.successPct) + 4}
            fontSize="9" fontWeight="bold" fill="#f59e0b">{activePoint.successPct.toFixed(0)}%</text>
        </>
      )}
    </svg>
  );
}
/* â”€â”€ component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export default function RiskPlanner() {
  const theme = useTheme();
  const [form, setForm] = useState({
    balance: '', target: '', trades: '', winRate: '', riskOverride: '', rrRatio: '2',
  });
  const [sliderActive, setSliderActive]   = useState(false);
  const [activePreset, setActivePreset]   = useState(null);
  const [result,       setResult]         = useState(null);
  const [mcData,       setMcData]         = useState(null);
  const [rscData,      setRscData]        = useState(null);
  const [loading,      setLoading]        = useState(false);
  const [error,        setError]          = useState('');

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const applyPreset = (preset) => {
    setActivePreset(preset.key);
    setSliderActive(true);
    setForm(p => ({
      ...p,
      riskOverride: preset.riskOverride,
      rrRatio:      preset.rrRatio,
      winRate:      p.winRate || preset.winRate,
    }));
  };

  const plan = async () => {
    setError('');
    if (!form.balance || !form.target || !form.trades) {
      setError('Balance, target, and number of trades are required'); return;
    }
    if (parseFloat(form.target) <= parseFloat(form.balance)) {
      setError('Target must be greater than current balance'); return;
    }
    setLoading(true);
    setMcData(null);
    setRscData(null);
    try {
      const body = {
        balance: parseFloat(form.balance),
        target:  parseFloat(form.target),
        trades:  parseInt(form.trades, 10),
      };
      if (form.winRate) body.winRate = parseFloat(form.winRate);
      if (sliderActive && form.riskOverride) body.riskOverride = parseFloat(form.riskOverride);
      const { data } = await api.post('/calc/risk-plan', body);
      setResult(data.data);
      // â€” client-side advanced analysis â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”
      const balance  = parseFloat(form.balance);
      const target   = parseFloat(form.target);
      const winRate  = parseFloat(form.winRate) || 55;
      const trades   = Math.min(parseInt(form.trades, 10) || 100, 500);
      const rrRatio  = parseFloat(form.rrRatio) || 2;
      const riskPctV = (sliderActive && form.riskOverride)
        ? parseFloat(form.riskOverride)
        : data.data.suggestedRiskPerTrade;
      const mc = runMonteCarlo({ balance, winRate, riskPct: riskPctV, trades, rrRatio, sims: 1000 });
      setMcData(mc);
      const rsc = calcRiskSuccessCurve({ balance, target, winRate, trades, rrRatio, sims: 500 });
      setRscData(rsc);
    } catch (err) {
      const e = err.response?.data?.error;
      setError(typeof e === 'string' ? e : (e?.message || err.message || 'Planning failed'));
    } finally {
      setLoading(false);
    }
  };

  const goalPct = useMemo(() => {
    if (!result || !form.balance || !form.target) return 0;
    const bal  = parseFloat(form.balance);
    const tgt  = parseFloat(form.target);
    const proj = result.finalBalanceProjection;
    if (tgt <= bal) return 0;
    return Math.min(100, Math.max(0, ((proj - bal) / (tgt - bal)) * 100));
  }, [result, form.balance, form.target]);

  const warnings = useMemo(() => getWarnings(form, result), [form, result]);

  const riskPct = useMemo(() => {
    if (sliderActive && form.riskOverride) return parseFloat(form.riskOverride);
    if (result) return result.suggestedRiskPerTrade;
    return null;
  }, [result, form.riskOverride, sliderActive]);

  const expectancy = useMemo(() => {
    if (!riskPct || !form.balance) return null;
    return calcExpectancy({
      winRate: parseFloat(form.winRate) || 55,
      riskPct,
      rrRatio: parseFloat(form.rrRatio) || 2,
      balance: parseFloat(form.balance),
    });
  }, [riskPct, form.winRate, form.rrRatio, form.balance]);

  const losingStreak = useMemo(() => {
    if (!riskPct || !form.trades) return null;
    return calcLosingStreak({
      winRate: parseFloat(form.winRate) || 55,
      trades:  parseInt(form.trades) || 100,
      riskPct,
    });
  }, [riskPct, form.winRate, form.trades]);

  const smartInsights = useMemo(() => {
    if (!riskPct || !mcData) return [];
    return generateSmartInsights({
      winRate:   parseFloat(form.winRate) || 55,
      riskPct,
      rrRatio:   parseFloat(form.rrRatio) || 2,
      ruinPct:   mcData.ruinPct,
      expectancy,
      streak:    losingStreak,
    });
  }, [riskPct, mcData, expectancy, losingStreak, form.winRate, form.rrRatio]);

  const isDark   = theme.isDark;
  const bg       = theme.bg;
  const card     = theme.surface;
  const border   = theme.border;
  const inputBg  = isDark ? 'rgba(255,255,255,0.06)' : '#f8fafc';
  const LBL = 'text-[11px] font-semibold tracking-wider uppercase mb-1.5';
  const INP = 'w-full h-11 px-3.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-yellow-600/30';
  const ruinColor = !mcData ? '#CA8A04'
    : mcData.ruinPct > 30 ? '#ef4444'
    : mcData.ruinPct > 10 ? '#f97316'
    : mcData.ruinPct > 3  ? '#f59e0b'
    : '#10b981';

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8" style={{ background: bg }}>
      <div className="max-w-6xl mx-auto">

        {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-600/25"
            style={{ background: 'linear-gradient(135deg, #CA8A04, #A16207)' }}>
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: theme.text }}>AI Risk Intelligence</h1>
            <p className="text-xs mt-0.5" style={{ color: theme.muted }}>
              Monte Carlo · Risk of Ruin · Expectancy Engine · Losing Streak · Kelly Criterion
            </p>
          </div>
        </div>

        {/* â”€â”€ Strategy Preset Tabs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="flex gap-3 mb-5 flex-wrap">
          {PRESETS.map(p => (
            <button key={p.key} onClick={() => applyPreset(p)}
              className="flex-1 min-w-[120px] rounded-xl border px-4 py-3 text-left transition-all hover:brightness-105"
              style={{
                background:  activePreset === p.key ? (isDark ? 'rgba(202,138,4,0.09)' : '#fefce8') : (isDark ? 'rgba(255,255,255,0.025)' : '#fff'),
                borderColor: activePreset === p.key ? p.color : border,
                opacity:     activePreset && activePreset !== p.key ? 0.6 : 1,
              }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold" style={{ color: activePreset === p.key ? p.color : theme.text }}>{p.label}</span>
                {p.recommended && (
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(202,138,4,0.15)', color: '#CA8A04' }}>Recommended</span>
                )}
              </div>
              <p className="text-[10px] leading-relaxed" style={{ color: theme.muted }}>{p.desc}</p>
            </button>
          ))}
        </div>

        {/* â”€â”€ Main Grid â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* â•â•â•â• LEFT â€” Inputs (3 cols) â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          <div className="lg:col-span-3 space-y-5">

            {/* Account Setup */}
            <div className="rounded-2xl border p-5 shadow-sm" style={{ background: card, borderColor: border }}>
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4" style={{ color: '#CA8A04' }} />
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
              {form.balance && form.target && parseFloat(form.target) > parseFloat(form.balance) && (
                <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: isDark ? 'rgba(202,138,4,0.08)' : '#fefce8' }}>
                  <TrendingUp className="w-3.5 h-3.5" style={{ color: '#CA8A04' }} />
                  <span className="text-xs font-medium" style={{ color: isDark ? '#FDE68A' : '#854D0E' }}>
                    Growth target: +{(((parseFloat(form.target) - parseFloat(form.balance)) / parseFloat(form.balance)) * 100).toFixed(1)}%
                    ({fmtUsd(parseFloat(form.target) - parseFloat(form.balance))} gain)
                  </span>
                </div>
              )}
            </div>

            {/* Trade Parameters â€” 4-col grid */}
            <div className="rounded-2xl border p-5 shadow-sm" style={{ background: card, borderColor: border }}>
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4" style={{ color: '#CA8A04' }} />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.muted }}>Trade Parameters</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className={LBL} style={{ color: theme.muted }}>No. Trades</label>
                  <input type="number" step="1" min="1" value={form.trades} onChange={set('trades')}
                    className={INP} placeholder="100"
                    style={{ background: inputBg, borderColor: border, color: theme.text }} />
                </div>
                <div>
                  <label className={LBL} style={{ color: theme.muted }}>Win Rate %</label>
                  <input type="number" step="1" min="1" max="99" value={form.winRate} onChange={set('winRate')}
                    className={INP} placeholder="55"
                    style={{ background: inputBg, borderColor: border, color: theme.text }} />
                </div>
                <div>
                  <label className={LBL} style={{ color: theme.muted }}>R:R Ratio</label>
                  <input type="number" step="0.5" min="0.5" max="10" value={form.rrRatio} onChange={set('rrRatio')}
                    className={INP} placeholder="2.0"
                    style={{ background: inputBg, borderColor: border, color: theme.text }} />
                </div>
                <div>
                  <label className={LBL} style={{ color: theme.muted }}>Risk % Override</label>
                  <input type="number" step="0.5" min="0.1" max="10"
                    value={form.riskOverride}
                    onChange={e => { setSliderActive(!!e.target.value); set('riskOverride')(e); }}
                    className={INP} placeholder="auto"
                    style={{
                      background:  form.riskOverride ? (isDark ? 'rgba(202,138,4,0.08)' : '#fefce8') : inputBg,
                      borderColor: form.riskOverride ? 'rgba(202,138,4,0.4)' : border,
                      color: theme.text,
                    }} />
                </div>
              </div>
              {sliderActive && form.riskOverride && (
                <div className="mt-4 rounded-xl px-4 py-3 space-y-2"
                  style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#fafafa', border: `1px solid ${border}` }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold" style={{ color: theme.muted }}>Risk per trade</span>
                    <span className="text-sm font-bold tabular-nums" style={{ color: '#CA8A04' }}>{form.riskOverride}%</span>
                  </div>
                  <input type="range" min="0.5" max="10" step="0.5"
                    value={form.riskOverride || 2}
                    onChange={(e) => setForm(p => ({ ...p, riskOverride: e.target.value }))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #CA8A04 ${((parseFloat(form.riskOverride || 2) - 0.5) / 9.5) * 100}%, ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'} 0%)`,
                    }} />
                  <div className="flex gap-1">
                    {[1, 2, 3, 5].map(v => (
                      <button key={v} onClick={() => setForm(p => ({ ...p, riskOverride: String(v) }))}
                        className="flex-1 text-[10px] font-semibold py-1 rounded-md transition-all"
                        style={{
                          background: parseFloat(form.riskOverride) === v ? 'rgba(202,138,4,0.15)' : 'transparent',
                          color:      parseFloat(form.riskOverride) === v ? '#CA8A04' : theme.muted,
                        }}>{v}%</button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="space-y-2">
                {warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2.5 rounded-xl px-4 py-3 text-xs leading-relaxed"
                    style={{
                      background: w.type === 'error' ? (isDark ? 'rgba(239,68,68,0.08)' : '#fef2f2') : w.type === 'warn' ? (isDark ? 'rgba(245,158,11,0.08)' : '#fffbeb') : (isDark ? 'rgba(59,130,246,0.08)' : '#eff6ff'),
                      border: `1px solid ${w.type === 'error' ? (isDark ? 'rgba(239,68,68,0.15)' : '#fecaca') : w.type === 'warn' ? (isDark ? 'rgba(245,158,11,0.15)' : '#fde68a') : (isDark ? 'rgba(59,130,246,0.15)' : '#bfdbfe')}`,
                    }}>
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"
                      style={{ color: w.type === 'error' ? '#ef4444' : w.type === 'warn' ? '#f59e0b' : '#3b82f6' }} />
                    <span style={{ color: isDark ? (w.type === 'error' ? '#f87171' : w.type === 'warn' ? '#fbbf24' : '#60a5fa') : (w.type === 'error' ? '#991b1b' : w.type === 'warn' ? '#92400e' : '#1e40af') }}>
                      {w.text}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium"
                style={{ background: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', color: '#ef4444', border: `1px solid ${isDark ? 'rgba(239,68,68,0.2)' : '#fecaca'}` }}>
                <XCircle className="w-3.5 h-3.5" /> {error}
              </div>
            )}

            <button onClick={plan} disabled={loading}
              className="w-full h-12 rounded-2xl text-sm font-bold text-white transition-all hover:brightness-110 hover:shadow-lg hover:shadow-yellow-600/25 active:scale-[0.98] flex items-center justify-center gap-2.5 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #CA8A04, #A16207)' }}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Running 1,000 simulationsâ€¦
                </div>
              ) : (
                <><Zap className="w-4 h-4" /> Run Full Analysis</>
              )}
            </button>

            <div className="rounded-xl px-4 py-3 flex items-start gap-2.5"
              style={{ background: isDark ? 'rgba(245,158,11,0.06)' : '#fffbeb', border: `1px solid ${isDark ? 'rgba(245,158,11,0.15)' : '#fde68a'}` }}>
              <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: '#f59e0b' }} />
              <p className="text-[11px] leading-relaxed" style={{ color: isDark ? '#fbbf24' : '#92400e' }}>
                <strong>Reality Check:</strong> Fewer than 10% of retail traders sustain consistent returns over 3+ years.
                Monte Carlo results require 200+ trades for statistical significance.
              </p>
            </div>
          </div>

          {/* â•â•â•â• RIGHT â€” Results (2 cols) â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          <div className="lg:col-span-2 space-y-5">
            {!result ? (
              <div className="rounded-2xl border p-8 flex flex-col items-center justify-center text-center min-h-[440px]"
                style={{ background: card, borderColor: border }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: isDark ? 'rgba(202,138,4,0.08)' : '#fefce8' }}>
                  <Activity className="w-7 h-7" style={{ color: isDark ? '#EAB308' : '#CA8A04' }} />
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: theme.text }}>Analysis Engine Ready</p>
                <p className="text-xs leading-relaxed max-w-[220px] mb-5" style={{ color: theme.muted }}>
                  Configure your parameters and run to see probabilistic projections and risk metrics.
                </p>
                <div className="grid grid-cols-1 gap-2 text-left w-full max-w-[240px]">
                  {['Monte Carlo (1,000 simulations)', 'Risk of Ruin probability', 'Expectancy engine (R + $)', 'Losing streak + drawdown', 'Risk vs Success curve', 'Kelly Criterion analysis'].map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#CA8A04' }} />
                      <span className="text-[11px]" style={{ color: theme.muted }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* â”€â”€ 1. SURVIVAL DASHBOARD â”€â”€ */}
                <div className="rounded-2xl border overflow-hidden" style={{ background: card, borderColor: border }}>
                  <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: theme.muted }}>Account Survival Analysis</span>
                    {mcData && <span className="text-[9px]" style={{ color: theme.muted }}>1,000 Monte Carlo paths</span>}
                  </div>
                  <div className="grid grid-cols-3 gap-px" style={{ background: border }}>
                    <div className="px-3 py-4 text-center" style={{ background: card }}>
                      <p className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: theme.muted }}>Risk of Ruin</p>
                      <p className="text-[26px] font-black tabular-nums leading-none mb-1" style={{ color: ruinColor }}>
                        {mcData ? fmtPct(mcData.ruinPct, 1) : 'â€”'}
                      </p>
                      <p className="text-[8px]" style={{ color: theme.muted }}>blowup probability</p>
                    </div>
                    <div className="px-3 py-4 text-center" style={{ background: card }}>
                      <p className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: theme.muted }}>Survival Prob.</p>
                      <p className="text-[26px] font-black tabular-nums leading-none mb-1"
                        style={{ color: mcData ? (100 - mcData.ruinPct > 90 ? '#10b981' : '#f59e0b') : theme.text }}>
                        {mcData ? fmtPct(100 - mcData.ruinPct, 1) : 'â€”'}
                      </p>
                      <p className="text-[8px]" style={{ color: theme.muted }}>of capital preserved</p>
                    </div>
                    <div className="px-3 py-4 text-center" style={{ background: card }}>
                      <p className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: theme.muted }}>Expectancy</p>
                      <p className="text-[26px] font-black tabular-nums leading-none mb-1"
                        style={{ color: expectancy ? expectancy.edgeColor : theme.text }}>
                        {expectancy ? `${expectancy.expectancyR >= 0 ? '+' : ''}${expectancy.expectancyR.toFixed(2)}R` : 'â€”'}
                      </p>
                      {expectancy && (
                        <span className="inline-block text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full"
                          style={{ background: expectancy.edgeColor + '20', color: expectancy.edgeColor }}>
                          {expectancy.edgeLabel}
                        </span>
                      )}
                    </div>
                  </div>
                  {mcData && (
                    <div className="px-5 py-3 border-t grid grid-cols-2 gap-3" style={{ borderColor: border }}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px]" style={{ color: theme.muted }}>30% DD risk</span>
                        <span className="text-xs font-bold"
                          style={{ color: mcData.dd30Pct > 50 ? '#ef4444' : mcData.dd30Pct > 25 ? '#f59e0b' : '#10b981' }}>
                          {fmtPct(mcData.dd30Pct, 1)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px]" style={{ color: theme.muted }}>Median max DD</span>
                        <span className="text-xs font-bold" style={{ color: '#f97316' }}>{fmtPct(mcData.medianDD, 1)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* â”€â”€ 2. MONTE CARLO PROJECTION â”€â”€ */}
                {mcData && (
                  <div className="rounded-2xl border p-5 shadow-sm" style={{ background: card, borderColor: border }}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4" style={{ color: '#CA8A04' }} />
                        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: theme.muted }}>Monte Carlo Projection</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {[
                        { label: 'Worst',    value: mcData.worst,  sub: 'Bottom 10%', color: '#ef4444', bg: isDark ? 'rgba(239,68,68,0.07)' : '#fef2f2' },
                        { label: 'Expected', value: mcData.median, sub: 'Median',     color: '#CA8A04', bg: isDark ? 'rgba(202,138,4,0.07)' : '#fefce8' },
                        { label: 'Best',     value: mcData.best,   sub: 'Top 10%',    color: '#10b981', bg: isDark ? 'rgba(16,185,129,0.07)' : '#ecfdf5' },
                      ].map(({ label, value, sub, color, bg: bg2 }) => (
                        <div key={label} className="rounded-xl p-3 text-center" style={{ background: bg2 }}>
                          <p className="text-[9px] font-bold uppercase mb-1" style={{ color }}>{label}</p>
                          <p className="text-xs font-bold tabular-nums leading-tight" style={{ color }}>{fmtUsd(value)}</p>
                          <p className="text-[9px] mt-0.5" style={{ color: theme.muted }}>{sub}</p>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-xl overflow-hidden"
                      style={{ background: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc', border: `1px solid ${border}` }}>
                      <div className="px-3 py-1.5 flex items-center justify-between border-b" style={{ borderColor: border }}>
                        <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: theme.muted }}>Equity Curve Fan</span>
                        <div className="flex items-center gap-3">
                          {[{ c: '#10b981', l: 'Best' }, { c: '#CA8A04', l: 'Median' }, { c: '#ef4444', l: 'Worst' }].map(({ c, l }) => (
                            <div key={l} className="flex items-center gap-1">
                              <div className="w-3 h-0.5 rounded" style={{ background: c }} />
                              <span className="text-[8px]" style={{ color: theme.muted }}>{l}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="p-3">
                        <EquityCurveChart sampleCurves={mcData.sampleCurves} initialBalance={parseFloat(form.balance)} isDark={isDark} />
                      </div>
                    </div>
                    <p className="mt-2.5 text-[10px]" style={{ color: theme.muted }}>
                      Each line = one possible trading path over {mcData.simTrades} trades.
                    </p>
                  </div>
                )}

                {/* â”€â”€ 3. EXPECTANCY ENGINE â”€â”€ */}
                {expectancy && (
                  <div className="rounded-2xl border p-5 shadow-sm" style={{ background: card, borderColor: border }}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4" style={{ color: '#CA8A04' }} />
                        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: theme.muted }}>Expectancy Engine</span>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                        style={{ background: expectancy.edgeColor + '18', color: expectancy.edgeColor }}>
                        Edge: {expectancy.edgeLabel}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="rounded-xl p-3 text-center" style={{ background: isDark ? 'rgba(202,138,4,0.06)' : '#fefce8' }}>
                        <p className="text-[9px] font-bold uppercase mb-1" style={{ color: theme.muted }}>Per Trade (R)</p>
                        <p className="text-xl font-black tabular-nums" style={{ color: expectancy.expectancyR >= 0 ? '#10b981' : '#ef4444' }}>
                          {expectancy.expectancyR >= 0 ? '+' : ''}{expectancy.expectancyR.toFixed(3)}R
                        </p>
                      </div>
                      <div className="rounded-xl p-3 text-center" style={{ background: isDark ? 'rgba(16,185,129,0.06)' : '#ecfdf5' }}>
                        <p className="text-[9px] font-bold uppercase mb-1" style={{ color: theme.muted }}>Per Trade ($)</p>
                        <p className="text-xl font-black tabular-nums" style={{ color: expectancy.expectancyDollar >= 0 ? '#10b981' : '#ef4444' }}>
                          {expectancy.expectancyDollar >= 0 ? '+' : 'âˆ’'}{fmtUsd(Math.abs(expectancy.expectancyDollar))}
                        </p>
                      </div>
                    </div>
                    <p className="text-[10px] leading-relaxed" style={{ color: theme.muted }}>
                      E = (WR Ã— AvgWin) âˆ’ (LR Ã— AvgLoss)
                      = ({parseFloat(form.winRate) || 55}% Ã— {parseFloat(form.rrRatio || 2).toFixed(1)}R) âˆ’ ({100 - (parseFloat(form.winRate) || 55)}% Ã— 1R)
                      = <strong style={{ color: expectancy.edgeColor }}>{expectancy.label}</strong>
                    </p>
                  </div>
                )}

                {/* â”€â”€ 4. RISK vs SUCCESS CURVE â”€â”€ */}
                {rscData && (
                  <div className="rounded-2xl border p-5 shadow-sm" style={{ background: card, borderColor: border }}>
                    <div className="flex items-center gap-2 mb-1">
                      <Crosshair className="w-4 h-4" style={{ color: '#CA8A04' }} />
                      <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: theme.muted }}>Risk % vs Target Success</span>
                    </div>
                    <p className="text-[10px] mb-3" style={{ color: theme.muted }}>Higher risk â‰  higher success â€” the curve shows the optimal point</p>
                    <div className="rounded-xl overflow-hidden" style={{ background: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc', border: `1px solid ${border}` }}>
                      <div className="p-3">
                        <RiskSuccessChart curve={rscData} activeRisk={riskPct} isDark={isDark} />
                      </div>
                    </div>
                    {riskPct && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#f59e0b' }} />
                        <span className="text-[10px]" style={{ color: theme.muted }}>
                          At {riskPct}% risk â†’{' '}
                          <strong style={{ color: theme.text }}>
                            {(() => {
                              const p = rscData.reduce((n, pt) => Math.abs(pt.riskPct - riskPct) < Math.abs(n.riskPct - riskPct) ? pt : n);
                              return p ? `${p.successPct.toFixed(0)}% success probability` : 'â€”';
                            })()}
                          </strong>
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* â”€â”€ 5. LOSING STREAK ANALYSIS â”€â”€ */}
                {losingStreak && (
                  <div className="rounded-2xl border p-5 shadow-sm" style={{ background: card, borderColor: border }}>
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingDown className="w-4 h-4" style={{ color: '#f97316' }} />
                      <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: theme.muted }}>Losing Streak Analysis</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="rounded-xl p-3 text-center" style={{ background: isDark ? 'rgba(245,158,11,0.06)' : '#fffbeb' }}>
                        <p className="text-[9px] font-bold uppercase mb-1" style={{ color: '#f59e0b' }}>Expected Streak</p>
                        <p className="text-2xl font-black tabular-nums" style={{ color: '#f59e0b' }}>{losingStreak.expected}</p>
                        <p className="text-[9px]" style={{ color: theme.muted }}>consecutive losses</p>
                      </div>
                      <div className="rounded-xl p-3 text-center" style={{ background: isDark ? 'rgba(249,115,22,0.06)' : '#fff7ed' }}>
                        <p className="text-[9px] font-bold uppercase mb-1" style={{ color: '#f97316' }}>Worst-case Streak</p>
                        <p className="text-2xl font-black tabular-nums" style={{ color: '#f97316' }}>{losingStreak.worst}</p>
                        <p className="text-[9px]" style={{ color: theme.muted }}>consecutive losses</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: isDark ? 'rgba(245,158,11,0.05)' : '#fffbeb' }}>
                        <span className="text-[11px]" style={{ color: theme.muted }}>Expected streak drawdown</span>
                        <span className="text-sm font-bold" style={{ color: '#f59e0b' }}>{losingStreak.expectedImpact.toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: isDark ? 'rgba(249,115,22,0.07)' : '#fff7ed' }}>
                        <span className="text-[11px]" style={{ color: theme.muted }}>Worst streak drawdown</span>
                        <span className="text-sm font-bold" style={{ color: losingStreak.impact > 50 ? '#ef4444' : '#f97316' }}>
                          {losingStreak.impact.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <p className="mt-3 text-[10px] leading-relaxed" style={{ color: theme.muted }}>
                      Based on {form.winRate || 55}% win rate over {form.trades} trades. Worst-case â‰ˆ 1.75Ã— expected streak length.
                    </p>
                  </div>
                )}

                {/* â”€â”€ 6. GOAL PROGRESS â”€â”€ */}
                <div className="rounded-2xl border p-5 shadow-sm" style={{ background: card, borderColor: border }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: theme.muted }}>Goal Completion</span>
                    <span className="text-sm font-bold tabular-nums" style={{ color: goalPct >= 100 ? '#10b981' : '#CA8A04' }}>{goalPct.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0' }}>
                    <div className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${goalPct}%`,
                        background: goalPct >= 100 ? 'linear-gradient(90deg,#10b981,#059669)' : goalPct >= 70 ? 'linear-gradient(90deg,#CA8A04,#A16207)' : 'linear-gradient(90deg,#f59e0b,#d97706)',
                      }} />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] font-medium" style={{ color: theme.muted }}>{fmtUsd(form.balance)}</span>
                    <ChevronRight className="w-3 h-3" style={{ color: theme.muted }} />
                    <span className="text-[10px] font-bold" style={{ color: goalPct >= 100 ? '#10b981' : '#CA8A04' }}>{fmtUsd(result.finalBalanceProjection)}</span>
                    <ChevronRight className="w-3 h-3" style={{ color: theme.muted }} />
                    <span className="text-[10px] font-medium" style={{ color: theme.muted }}>{fmtUsd(form.target)}</span>
                  </div>
                </div>

                {/* â”€â”€ 7. RISK PLAN â”€â”€ */}
                <div className="rounded-2xl border p-5 shadow-sm space-y-3" style={{ background: card, borderColor: border }}>
                  <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: theme.muted }}>Risk Plan</span>
                  <div className="rounded-xl px-4 py-4 text-center"
                    style={{ background: isDark ? 'rgba(202,138,4,0.06)' : '#fefce8', border: `1px solid ${isDark ? 'rgba(202,138,4,0.12)' : '#fef9c3'}` }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: theme.muted }}>Suggested Risk Per Trade</p>
                    <p className="text-3xl font-black tabular-nums" style={{ color: '#CA8A04' }}>{result.suggestedRiskPerTrade}%</p>
                    <span className="inline-block mt-1.5 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full"
                      style={{ background: RISK_TIER(result.suggestedRiskPerTrade).color + '18', color: RISK_TIER(result.suggestedRiskPerTrade).color }}>
                      {RISK_TIER(result.suggestedRiskPerTrade).label}
                    </span>
                    {result.optimalRisk && (
                      <div className="mt-2 flex items-center justify-center gap-1.5">
                        <Crosshair className="w-3 h-3" style={{ color: '#10b981' }} />
                        <span className="text-[10px] font-semibold" style={{ color: '#10b981' }}>Min to reach target: {result.optimalRisk}%</span>
                      </div>
                    )}
                    {result.reachable === false && (
                      <div className="mt-2 flex items-center justify-center gap-1.5 px-2 py-1 rounded-md" style={{ background: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2' }}>
                        <AlertTriangle className="w-3 h-3" style={{ color: '#ef4444' }} />
                        <span className="text-[10px] font-semibold" style={{ color: '#ef4444' }}>Target unreachable at â‰¤5% risk.</span>
                      </div>
                    )}
                  </div>
                  <MetricRow icon={TrendingUp} iconColor="#10b981" label="Projected Balance (deterministic)"
                    value={fmtUsd(result.finalBalanceProjection)} theme={theme} isDark={isDark} />
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

                {/* â”€â”€ 8. SCENARIO BREAKDOWN â”€â”€ */}
                {result.scenarioBreakdown?.length > 0 && (
                  <div className="rounded-2xl border p-5 shadow-sm" style={{ background: card, borderColor: border }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Crosshair className="w-4 h-4" style={{ color: '#CA8A04' }} />
                      <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: theme.muted }}>Deterministic Risk Sweep</span>
                    </div>
                    <div className="space-y-1.5">
                      {result.scenarioBreakdown.map((s) => {
                        const isOptimal = result.optimalRisk && s.riskPercent === result.optimalRisk;
                        const barWidth  = Math.min(100, (s.expectedBalance / parseFloat(form.target)) * 100);
                        return (
                          <div key={s.riskPercent} className="rounded-lg px-3 py-2"
                            style={{
                              background: isOptimal ? (isDark ? 'rgba(202,138,4,0.10)' : '#fefce8') : (isDark ? 'rgba(255,255,255,0.02)' : '#fafafa'),
                              border: isOptimal ? `1px solid ${isDark ? 'rgba(202,138,4,0.25)' : '#fde68a'}` : '1px solid transparent',
                            }}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold tabular-nums" style={{ color: isOptimal ? '#CA8A04' : theme.text }}>{s.riskPercent}%</span>
                                {isOptimal && <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: 'rgba(202,138,4,0.15)', color: '#CA8A04' }}>Optimal</span>}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-semibold tabular-nums" style={{ color: s.reachesTarget ? '#10b981' : theme.muted }}>{fmtUsd(s.expectedBalance)}</span>
                                {s.reachesTarget ? <CheckCircle2 className="w-3 h-3" style={{ color: '#10b981' }} /> : <XCircle className="w-3 h-3" style={{ color: isDark ? 'rgba(255,255,255,0.15)' : '#d1d5db' }} />}
                              </div>
                            </div>
                            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0' }}>
                              <div className="h-full rounded-full" style={{
                                width: `${barWidth}%`,
                                background: s.reachesTarget ? (isOptimal ? '#CA8A04' : '#10b981') : (isDark ? 'rgba(255,255,255,0.12)' : '#cbd5e1'),
                              }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* â”€â”€ 9. REALISM SCORE â”€â”€ */}
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

                {/* â”€â”€ 10. SMART AI INSIGHTS â”€â”€ */}
                {smartInsights.length > 0 && (
                  <div className="rounded-2xl border p-5 shadow-sm" style={{ background: card, borderColor: border }}>
                    <div className="flex items-center gap-2 mb-4">
                      <Brain className="w-4 h-4" style={{ color: '#CA8A04' }} />
                      <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: theme.muted }}>AI Risk Intelligence</span>
                    </div>
                    <div className="space-y-2.5">
                      {smartInsights.map((ins, i) => {
                        const C = {
                          error:   { bg: isDark ? 'rgba(239,68,68,0.07)'  : '#fef2f2', bdr: isDark ? 'rgba(239,68,68,0.2)'  : '#fecaca', dot: '#ef4444', txt: isDark ? '#f87171' : '#991b1b' },
                          warn:    { bg: isDark ? 'rgba(245,158,11,0.07)' : '#fffbeb', bdr: isDark ? 'rgba(245,158,11,0.2)' : '#fde68a', dot: '#f59e0b', txt: isDark ? '#fbbf24' : '#92400e' },
                          success: { bg: isDark ? 'rgba(16,185,129,0.07)' : '#ecfdf5', bdr: isDark ? 'rgba(16,185,129,0.2)' : '#a7f3d0', dot: '#10b981', txt: isDark ? '#34d399' : '#065f46' },
                          info:    { bg: isDark ? 'rgba(202,138,4,0.07)' : '#eff6ff', bdr: isDark ? 'rgba(202,138,4,0.2)' : '#c7d2fe', dot: '#CA8A04', txt: isDark ? '#FDE68A' : '#854D0E' },
                        }[ins.type];
                        return (
                          <div key={i} className="flex items-start gap-3 rounded-xl px-3 py-3"
                            style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
                            <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: C.dot }} />
                            <p className="text-xs leading-relaxed" style={{ color: C.txt }}>{ins.text}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* â”€â”€ 11. RISK INSIGHTS (existing component) â”€â”€ */}
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

/* â”€â”€ sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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
