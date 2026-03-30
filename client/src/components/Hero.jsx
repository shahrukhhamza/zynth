import React from 'react';
import { motion } from 'framer-motion';
import { Flame, ArrowRight, Shield, Zap, Bot, Globe } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

// Upgraded Mockup with real-looking behavioral performance data
function HeroDashboardMockup({ isDark }) {
  const BEHAVIORAL_INSIGHTS = [
    { icon: '\u26a0', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'Impulsive activity under pressure', value: '6 sessions flagged' },
    { icon: '\u2713', color: '#10b981', bg: 'rgba(16,185,129,0.1)', label: 'Best window: Morning session', value: '+31% consistency' },
    { icon: '\u2191', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Activity spikes after setbacks', value: 'Frequency +38%' },
  ];
  const STATS = [
    { l: 'Consistency', v: '\u2191 +14pts', sub: 'vs last month', color: '#10b981' },
    { l: 'Focus Score', v: '62 \u2192 81', sub: 'improving', color: '#3b82f6' },
  ];

  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.6, duration: 0.8 }}
      className="relative rounded-2xl overflow-hidden border backdrop-blur-xl"
      style={{
        borderColor: 'rgba(255,255,255,0.08)',
        background: isDark ? 'rgba(10,10,10,0.85)' : '#131c30',
        boxShadow: isDark
          ? '0 40px 120px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)'
          : '0 24px 80px rgba(0,0,0,0.22), 0 4px 24px rgba(59,130,246,0.14)',
      }}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.03]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
        </div>
        <div className="flex items-center gap-2 px-6 py-1 rounded-full bg-black/40 border border-white/5 text-[10px] text-gray-500 font-mono">
          <Globe size={10} /> app.zynth.codes
        </div>
        <div className="w-12" />
      </div>

      {/* Content Area */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Left col: equity + stats */}
        <div className="col-span-1 space-y-3">
          <div
            className="h-28 rounded-xl flex flex-col items-center justify-center gap-1 border"
            style={{
              background: 'linear-gradient(135deg,rgba(59,130,246,0.12),rgba(6,182,212,0.06))',
              borderColor: 'rgba(59,130,246,0.18)',
            }}
          >
            <div className="text-[9px] text-blue-400 uppercase tracking-widest font-bold">Performance Score · Last 30 days</div>
            <div className="text-[22px] font-black font-mono text-white">84 / 100</div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
              <span>\u2191 +14pts vs prior period</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {STATS.map(s => (
              <div key={s.l} className="p-3 rounded-xl border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="text-[9px] text-gray-500 uppercase mb-1">{s.l}</div>
                <div className="text-[12px] font-black font-mono" style={{ color: s.color }}>{s.v}</div>
                <div className="text-[9px] text-gray-600">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right col: behavioral insights */}
        <div
          className="col-span-2 rounded-xl border p-4 relative overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.015)', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bot size={12} className="text-blue-400" />
              <span className="text-[11px] font-bold text-gray-300">AI Behavioral Analysis</span>
            </div>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold tracking-wide">LIVE</span>
          </div>

          <div className="space-y-2.5">
            {BEHAVIORAL_INSIGHTS.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + i * 0.15 }}
                className="flex items-center gap-3 rounded-xl p-3 border"
                style={{ background: item.bg, borderColor: item.bg.replace('0.1', '0.25') }}
              >
                <span className="text-[14px] w-5 text-center shrink-0" style={{ color: item.color }}>{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold text-gray-200 truncate">{item.label}</div>
                </div>
                <div className="text-[10px] font-bold font-mono shrink-0" style={{ color: item.color }}>{item.value}</div>
              </motion.div>
            ))}
          </div>

          {/* AI glow */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/15 rounded-full blur-[50px] pointer-events-none" />
        </div>
      </div>
    </motion.div>
  );
}

export default function Hero({ badgeText, spotsLeft, onGetStarted, onSignIn }) {
  const { isDark } = useTheme();
  return (
    <section className={`relative flex flex-col items-center justify-center text-center px-6 pt-28 pb-10 overflow-hidden transition-colors duration-300 ${isDark ? '' : 'bg-[#f8fafc]'}`}>
      
      {/* --- Institutional Background Layers --- */}
      <div className="absolute inset-0 pointer-events-none">
        {/* soft radial glow behind headline */}
        <div
          className="absolute inset-0"
          style={{
            background: isDark
              ? 'radial-gradient(70% 55% at 50% 0%, rgba(56,189,248,0.22) 0%, rgba(56,189,248,0.08) 35%, transparent 72%)'
              : 'radial-gradient(70% 55% at 50% 0%, rgba(59,130,246,0.16) 0%, rgba(59,130,246,0.06) 35%, transparent 72%)',
          }}
        />

        {/* very faint texture for depth */}
        <div
          className="absolute inset-0"
          style={{
            opacity: isDark ? 0.08 : 0.05,
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(148,163,184,0.8) 1px, transparent 0)',
            backgroundSize: '22px 22px',
          }}
        />

        {/* Animated Grid */}
        <div className={`absolute inset-0 grid-bg ${isDark ? 'opacity-40' : 'opacity-10'}`} />
        
        {/* Dynamic Mesh Gradients — only shown in dark mode */}
        {isDark && (
          <>
            <motion.div 
              animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute top-[5%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]" 
            />
            <motion.div 
              animate={{ x: [0, -50, 0], y: [0, 30, 0] }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]" 
            />
          </>
        )}
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Badge — temporarily disabled */}

        {/* Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-5xl md:text-[78px] font-black leading-[1.05] tracking-tighter mb-10"
        >
          <span className={isDark ? 'text-white' : 'text-gray-900'}>Understand Your Decisions.</span>
          <br />
          <span className="inline-block pb-2 bg-clip-text text-transparent bg-gradient-to-r from-[#1d4ed8] via-[#3b82f6] to-[#06b6d4]">
            Improve Your Outcomes.
          </span>
        </motion.h1>

        {/* Emotional trigger lines */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          className="mb-8"
        >
          <p className={`text-[16px] md:text-[18px] font-semibold leading-snug ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Zynth analyzes your activity patterns and shows you exactly what drives your behavior — and how to improve it.
          </p>
        </motion.div>

        {/* Short value line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className={`text-[17px] md:text-[19px] font-semibold mb-14 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
        >
          See your patterns. Improve faster.
        </motion.p>

        {/* Urgency Badge */}
        {false && null}

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-14">
          <button 
            onClick={() => onGetStarted()}
            className="group relative px-8 py-5 bg-blue-600 text-white font-black rounded-2xl transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(59,130,246,0.4)] flex items-center gap-3 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2 text-lg">
              Get My Insights <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </button>
          
          <button 
            onClick={onSignIn}
            className={`px-8 py-5 font-bold rounded-2xl transition-all ${isDark ? 'bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20' : 'bg-black/[0.06] border border-black/10 text-gray-900 hover:bg-black/10 hover:border-black/20'}`}
          >
            Sign In
          </button>
        </div>

        {/* Micro trust signals under CTA */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className={`text-[12px] font-medium mb-8 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}
        >
          Free to start, no card required • 60-second setup • Trusted by 2,000+ users
        </motion.p>

        {/* Floating Trust Icons */}
        <div className="flex justify-center gap-3 flex-wrap">
          {[
            {Icon: Shield, label: 'Encrypted'},
            {Icon: Zap, label: 'Activity-powered'},
            {Icon: Bot, label: 'AI by Gemini'},
          ].map(({Icon, label}) => (
            <div key={label} className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-[11px] font-bold uppercase tracking-widest ${
              isDark
                ? 'border-white/10 bg-white/5 text-gray-400'
                : 'border-blue-200 bg-white text-gray-700 shadow-sm'
            }`}>
              <Icon size={12} className={isDark ? 'text-blue-400' : 'text-blue-600'} /> {label}
            </div>
          ))}
        </div>
      </div>

      {/* Hero Mockup with Radial Shadow */}
      <div className="relative z-10 mt-12 w-full max-w-5xl mx-auto px-4">
        <HeroDashboardMockup isDark={isDark} />
        {/* Glow behind the dashboard */}
        <div className={`absolute -bottom-20 left-1/2 -translate-x-1/2 w-[80%] h-40 blur-[100px] pointer-events-none ${isDark ? 'bg-blue-500/20' : 'bg-blue-400/10'}`} />
      </div>
    </section>
  );
}