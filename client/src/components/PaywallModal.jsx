/**
 * PaywallModal
 *
 * Conversion-focused modal shown when a free user clicks a locked feature.
 * Uses behaviour-driven copy to create urgency and relevance.
 *
 * Props:
 *   open          — boolean
 *   onClose       — () => void
 *   onUpgrade     — () => void     open payment / upgrade flow
 *   feature       — string | null  "Macro Correlation" | "AI Analysis" | etc.
 *   problem       — string | null  sessionStorage zynth_pre_problem value
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Brain, TrendingUp, Shuffle, Lock,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import PricingPlanSelector from './pricing/PricingPlanSelector';
import { DEFAULT_BILLING_CYCLE, DEFAULT_SELECTED_PLAN } from '../config/pricingPlans';

// ── Feature-specific copy ─────────────────────────────────────────────────────

const FEATURE_COPY = {
  'Macro Correlation': {
    headline: 'Unlock Your Full Trading Analysis',
    sub: "You're taking trades without knowing the macro environment. Zynth can show you if you're fighting the trend — or riding it.",
    icon: TrendingUp,
  },
  'AI Analysis': {
    headline: 'Get AI-Powered Trade Insights',
    sub: "Your trades contain patterns you're not seeing. Zynth's AI reads your history and tells you exactly what to stop doing.",
    icon: Brain,
  },
  'Trading DNA': {
    headline: 'Discover Your Trading Archetype',
    sub: 'Are you a Sniper, a Scalper, or a Gambler? Your Trading DNA profile is generated monthly from your actual trade behaviour.',
    icon: Shuffle,
  },
  default: {
    headline: 'Unlock Your Full Trading Analysis',
    sub: "You're repeating the same mistakes. Zynth can show you exactly how to fix them — trade by trade.",
    icon: Lock,
  },
};

// Problem-based personalisation overlay
const PROBLEM_SNIPPETS = {
  emotional: '"3 of your last 5 trades show signs of emotional entry."',
  streaks:   '"Your last drawdown lasted 6 days — Zynth can predict the pattern."',
  strategy:  '"You\'ve used 4 different strategies this month. Let\'s find which one works."',
  unknown:   '"Your best performing pair has a 71% win rate — but only on Tuesdays."',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function PaywallModal({ open, onClose, onUpgrade, feature, problem: propProblem }) {
  const theme = useTheme();
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(DEFAULT_SELECTED_PLAN);
  const [billingCycle, setBillingCycle] = useState(DEFAULT_BILLING_CYCLE);

  // Read problem from prop or sessionStorage
  const problem = propProblem || sessionStorage.getItem('zynth_pre_problem') || '';

  const copyKey = feature && FEATURE_COPY[feature] ? feature : 'default';
  const copy = FEATURE_COPY[copyKey];
  const FeatureIcon = copy.icon;
  const problemSnippet = PROBLEM_SNIPPETS[problem] || null;

  useEffect(() => {
    if (open) {
      setShow(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  function handleClose() {
    setShow(false);
    setTimeout(() => onClose?.(), 220);
  }

  function handleUpgrade() {
    handleClose();
    setTimeout(() => onUpgrade?.({ plan: selectedPlan, billingCycle }), 240);
  }

  const headingColor = theme.isDark ? '#ffffff' : '#0f172a';
  const mutedColor   = theme.isDark ? '#9ca3af' : '#64748b';

  return (
    <AnimatePresence>
      {open && show && (
        <motion.div
          key="paywalloverlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9995] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md overflow-hidden"
            style={{
              borderRadius: 20,
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              boxShadow: theme.isDark
                ? '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04), 0 0 60px rgba(59,130,246,0.08)'
                : '0 32px 80px rgba(0,0,0,0.18)',
            }}
          >
            {/* Gradient top band */}
            <div
              className="h-[3px] w-full"
              style={{ background: 'linear-gradient(90deg,#1d4ed8,#3b82f6,#06b6d4)' }}
            />

            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center transition-colors z-10"
              style={{
                background: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                color: mutedColor,
              }}
              onMouseEnter={e => (e.currentTarget.style.color = headingColor)}
              onMouseLeave={e => (e.currentTarget.style.color = mutedColor)}
            >
              <X size={15} />
            </button>

            <div className="px-7 pt-7 pb-7">
              {/* Icon */}
              <div className="flex justify-center mb-5">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg,rgba(59,130,246,0.18),rgba(6,182,212,0.10))',
                    border: '1px solid rgba(59,130,246,0.22)',
                    boxShadow: '0 0 30px rgba(59,130,246,0.15)',
                  }}
                >
                  <FeatureIcon size={26} style={{ color: '#3b82f6' }} />
                </div>
              </div>

              {/* Headline */}
              <h2
                className="text-[22px] font-extrabold text-center mb-3 leading-tight"
                style={{ color: headingColor }}
              >
                {copy.headline}
              </h2>

              {/* Sub-copy */}
              <p
                className="text-[14px] text-center leading-relaxed mb-5"
                style={{ color: mutedColor }}
              >
                {copy.sub}
              </p>

              {/* Personalised AI snippet */}
              {problemSnippet && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 }}
                  className="px-4 py-3 rounded-xl border mb-5 text-center"
                  style={{
                    background: theme.isDark ? 'rgba(239,68,68,0.07)' : 'rgba(239,68,68,0.05)',
                    borderColor: 'rgba(239,68,68,0.2)',
                  }}
                >
                  <p className="text-[13px] font-semibold italic" style={{ color: '#f87171' }}>
                    {problemSnippet}
                  </p>
                </motion.div>
              )}

              <div className="mb-3">
                <PricingPlanSelector
                  context="ai"
                  mode="compact"
                  selectedPlan={selectedPlan}
                  onSelectPlan={setSelectedPlan}
                  billingCycle={billingCycle}
                  onBillingCycleChange={setBillingCycle}
                  onContinue={handleUpgrade}
                  primaryActionLabel="Unlock Premium"
                />
              </div>

              {/* Secondary CTA */}
              <button
                onClick={handleClose}
                className="w-full py-3 rounded-xl text-[13px] font-medium border transition-all"
                style={{
                  borderColor: theme.border,
                  color: mutedColor,
                  background: 'transparent',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = theme.accent;
                  e.currentTarget.style.color = headingColor;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = theme.border;
                  e.currentTarget.style.color = mutedColor;
                }}
              >
                Continue with limited access
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
