import React from 'react';
import { motion } from 'framer-motion';
import { Flame, ArrowRight, Shield, Zap, Bot, Globe } from 'lucide-react';

// Upgraded Mockup with Glassmorphism and Depth
function HeroDashboardMockup() {
  return (
    <motion.div 
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.6, duration: 0.8 }}
      className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#070b14]/80 backdrop-blur-xl shadow-[0_40px_120px_rgba(0,0,0,0.7)]"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/5">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
        </div>
        <div className="flex items-center gap-2 px-6 py-1 rounded-full bg-black/40 border border-white/5 text-[10px] text-gray-500 font-mono">
          <Globe size={10} /> app.zynth.codes
        </div>
        <div className="w-12" /> {/* Spacer */}
      </div>

      {/* Content Area */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 space-y-4">
          <div className="h-32 rounded-xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/10 flex flex-col items-center justify-center">
             <div className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold mb-1">Equity Growth</div>
             <div className="text-xl font-mono text-white">+$4,280.50</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[ {l: 'Win Rate', v: '68%'}, {l: 'PF', v: '1.82'} ].map(s => (
              <div key={s.l} className="p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="text-[9px] text-gray-500 uppercase">{s.l}</div>
                <div className="text-sm font-bold text-white">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="col-span-2 rounded-xl bg-white/[0.02] border border-white/5 p-4 relative overflow-hidden">
          <div className="flex justify-between items-center mb-4">
             <div className="text-xs font-semibold text-gray-400">Behavioral Performance</div>
             <div className="flex gap-2">
                <div className="h-1.5 w-12 rounded-full bg-emerald-500/20" />
                <div className="h-1.5 w-8 rounded-full bg-white/10" />
             </div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-8 w-full rounded-lg bg-white/5 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
          {/* Decorative "AI" Glow */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-[50px]" />
        </div>
      </div>
    </motion.div>
  );
}

export default function Hero({ badgeText, spotsLeft, onGetStarted, onSignIn }) {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-32 pb-20 overflow-hidden bg-[#030303]">
      
      {/* --- Institutional Background Layers --- */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Animated Grid */}
        <div className="absolute inset-0 grid-bg opacity-40" />
        
        {/* Dynamic Mesh Gradients (The "Unicorn" Look) */}
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{ x: [0, -50, 0], y: [0, 30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]" 
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-10 border border-emerald-500/30 bg-emerald-500/5 backdrop-blur-md"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-emerald-400">
            {badgeText || "Live Intelligence"}
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-5xl md:text-[82px] font-black leading-[1.05] tracking-tighter mb-8"
        >
          <span className="text-white">You Know How To Trade.</span>
          <br />
          <span className="inline-block pb-2 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-emerald-200 to-emerald-500 animate-gradient-x">
            But Do You Know Why You Lose?
          </span>
        </motion.h1>

        {/* Subtext */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-[18px] md:text-[20px] text-gray-400 max-w-[650px] mx-auto leading-relaxed mb-10 font-medium"
        >
          Institutional-grade behavioral analytics for retail traders. Zynth maps your blind spots and optimizes your psychology in real-time.
        </motion.p>

        {/* Urgency Badge */}
        {spotsLeft > 0 && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl mb-12 border border-amber-500/20 bg-amber-500/5"
          >
            <Flame size={14} className="text-amber-400" />
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              {spotsLeft} founding spots left — pricing increases soon
            </span>
          </motion.div>
        )}

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-20">
          <button 
            onClick={onGetStarted}
            className="group relative px-8 py-5 bg-emerald-500 text-black font-black rounded-2xl transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] flex items-center gap-3 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2 text-lg">
              Start Your Free Journal <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </button>
          
          <button 
            onClick={onSignIn}
            className="px-8 py-5 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-all hover:border-white/20"
          >
            Access Terminal
          </button>
        </div>

        {/* Floating Trust Icons */}
        <div className="flex justify-center gap-3 flex-wrap opacity-60">
          {[
            {Icon: Shield, label: 'Encrypted'},
            {Icon: Zap, label: 'Real-time'},
            {Icon: Bot, label: 'Gemini AI'},
          ].map(({Icon, label}) => (
            <div key={label} className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
              <Icon size={12} className="text-emerald-500" /> {label}
            </div>
          ))}
        </div>
      </div>

      {/* Hero Mockup with Radial Shadow */}
      <div className="relative z-10 mt-20 w-full max-w-5xl mx-auto px-4">
        <HeroDashboardMockup />
        {/* Glow behind the dashboard */}
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[80%] h-40 bg-emerald-500/20 blur-[100px] pointer-events-none" />
      </div>
    </section>
  );
}