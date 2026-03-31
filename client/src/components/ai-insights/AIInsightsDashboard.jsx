/**
 * AIInsightsDashboard
 *
 * Decision-engine UI. Consumes the `macroSummary` object from buildMacroSummary().
 *
 * Layout:
 *   HeroSection      — market direction + confidence at a glance
 *   WhyPanel         — per-asset reasoning bullets
 *   RiskPanel        — risk alerts + conflict warnings
 *   MultiAssetImpact — gold / forex / oil bias grid
 *   KeyDrivers       — ranked macro drivers
 *   DataTrustPanel   — freshness, next release, uncertainty
 *   AiSummary        — AI narrative if present
 */

import { useState } from 'react';
import {
  TrendingUp, TrendingDown, Minus,
  AlertTriangle, AlertCircle, ShieldCheck,
  Clock, Database, ChevronDown, ChevronUp,
  Activity, BarChart2, Zap, Minus as MinusIcon,
} from 'lucide-react';
import HeroSection from './HeroSection';
import WhyPanel from './WhyPanel';
import RiskPanel from './RiskPanel';
import MultiAssetImpact from './MultiAssetImpact';
import KeyDrivers from './KeyDrivers';
import DataTrustPanel from './DataTrustPanel';
import AiSummary from './AiSummary';
// ─────────────────────────────────────────────────────────────────────────────
// Design tokens (dark-first)
// ─────────────────────────────────────────────────────────────────────────────
const T = {
  bg:         'bg-[#09090f]',
  surface:    'bg-[#0d1120]',
  border:     'border-white/[0.07]',
  divider:    'border-white/[0.05]',
  text:       'text-white',
  textSub:    'text-slate-400',
  textMuted:  'text-slate-600',
  label:      'text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500',
  mono:       'font-mono tabular-nums',
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function biasConfig(bias) {
  const b = String(bias || '').toLowerCase();
  if (b === 'bullish') return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: TrendingUp,   label: bias };
  if (b === 'bearish') return { color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20',     icon: TrendingDown, label: bias };
  if (b === 'mixed')   return { color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   icon: Activity,     label: 'Mixed' };
  return                      { color: 'text-slate-400',   bg: 'bg-slate-500/10',   border: 'border-slate-500/20',   icon: Minus,        label: 'Neutral' };
}

function strengthConfig(strength) {
  const s = String(strength || '').toLowerCase();
  if (s === 'strong')   return { color: 'text-white',      weight: 'font-bold'     };
  if (s === 'moderate') return { color: 'text-slate-300',  weight: 'font-semibold' };
  return                       { color: 'text-slate-500',  weight: 'font-normal'   };
}

function confidenceColor(n) {
  if (n >= 70) return { bar: 'bg-emerald-500', text: 'text-emerald-400' };
  if (n >= 45) return { bar: 'bg-amber-400',   text: 'text-amber-400'   };
  return               { bar: 'bg-red-500',    text: 'text-red-400'     };
}

function relativeTime(iso) {
  if (!iso) return null;
  const d = Math.round((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d <= 0) return 'Today';
  if (d === 1) return 'Yesterday';
  return `${d}d ago`;
}


// ─────────────────────────────────────────────────────────────────────────────


const FRESHNESS_DOT = { fresh: 'bg-emerald-500', stale: 'bg-amber-400', outdated: 'bg-red-500' };


// ─────────────────────────────────────────────────────────────────────────────
// Loading skeleton
// ─────────────────────────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="space-y-5">
      {[200, 120, 60, 120, 120, 100].map((h, i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl bg-white/[0.04]"
          style={{ height: h }}
        />
      ))}
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

/**
 * AIInsightsDashboard
 *
 * Props:
 *   macroData  {object}  – full /api/economic/ai-insights response
 *                          (must include `macroSummary` key from buildMacroSummary())
 */
export default function AIInsightsDashboard({ macroData }) {
  if (!macroData) return <LoadingSkeleton />;

  // Prefer the new unified summary; fall back to top-level shape for compatibility
  const summary = macroData.macroSummary ?? macroData;

  // Drivers: prefer the existing `drivers` array from the payload
  const drivers = macroData.drivers ?? [];

  // AI narrative fields (top-level payload)
  const aiSummary     = macroData.aiSummary     ?? null;
  const aiStatus      = macroData.aiStatus      ?? null;
  const actionContext = macroData.actionContext  ?? null;

  return (
    <div className="space-y-6">
      <HeroSection summary={summary} />
      <WhyPanel summary={summary} />
      <RiskPanel summary={summary} />
      <MultiAssetImpact summary={summary} />
      <KeyDrivers drivers={drivers} />
      <DataTrustPanel   dataInfo={summary?.dataInfo ?? macroData.dataTransparency} />
      <AiSummary
        aiSummary={aiSummary}
        aiStatus={aiStatus}
        actionContext={actionContext}
      />
    </div>
  );
}
