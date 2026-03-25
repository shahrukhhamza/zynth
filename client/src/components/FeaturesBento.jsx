import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Search, LineChart, Shield, Zap, Cpu, BarChart3, Scan Eye } from 'lucide-react';

const FeatureCard = ({ title, description, icon: Icon, className, children }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className={`relative overflow-hidden rounded-3xl border border-white/10 bg-[#0A0A0B] p-8 glass-card ${className}`}
  >
    <div className="relative z-10">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
        <Icon size={24} />
      </div>
      <h3 className="mb-2 text-xl font-bold text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-gray-400">{description}</p>
    </div>
    {children}
    <div className="absolute inset-0 z-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 transition-opacity hover:opacity-100" />
  </motion.div>
);

const FeaturesBento = () => {
  return (
    <section className="relative bg-[#030303] py-24 px-6 overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4"
          >
            Everything a <span className="text-emerald-400">Serious</span> Trader Needs
          </motion.h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Stop guessing. Start using institutional-grade data and behavioral science to fix your edge.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-4 h-full">
          
          {/* 1. Large Feature: AI Trade Journal (Spans 2 columns) */}
          <FeatureCard 
            icon={Brain}
            title="AI-Powered Trade Journaling"
            description="Every trade tells a story. Zynth extracts your psychology, identifies behavioral loops, and generates performance reports using Gemini 1.5 Pro."
            className="md:col-span-2 md:row-span-1"
          >
            <div className="mt-8 flex gap-3 overflow-hidden opacity-40">
              <div className="h-20 w-32 rounded-lg border border-emerald-500/20 bg-emerald-500/5" />
              <div className="h-20 w-32 rounded-lg border border-white/10 bg-white/5" />
              <div className="h-20 w-32 rounded-lg border border-white/10 bg-white/5" />
            </div>
          </FeatureCard>

          {/* 2. MT5 OCR Import (The Scanner Animation) */}
          <FeatureCard 
            icon={ScanEye}
            title="MT5 Screenshot OCR"
            description="Upload your MetaTrader history. Our vision engine extracts every entry, exit, and P&L instantly."
            className="md:col-span-1 md:row-span-1"
          >
            <div className="relative mt-6 h-32 w-full rounded-xl border border-white/5 bg-[#050505] overflow-hidden">
              {/* Laser Line */}
              <motion.div 
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-[2px] bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)] z-20"
              />
              <div className="p-4 space-y-2 opacity-20">
                <div className="h-2 w-full bg-white/10 rounded" />
                <div className="h-2 w-3/4 bg-white/10 rounded" />
                <div className="h-2 w-1/2 bg-white/10 rounded" />
              </div>
            </div>
          </FeatureCard>

          {/* 3. Macro Correlation (Small Card) */}
          <FeatureCard 
            icon={LineChart}
            title="Macro Correlation"
            description="Score your trades against 10 High-Impact US indicators. Know if you're fighting the trend or riding it."
            className="md:col-span-1 md:row-span-1"
          />

          {/* 4. Large Feature: Live Market Intelligence (Spans 2 columns) */}
          <FeatureCard 
            icon={Zap}
            title="Live Market Intelligence"
            description="Real-time WebSocket price tickers for Gold, Forex, and Indices with 15-minute economic calendar refreshes."
            className="md:col-span-2 md:row-span-1"
          >
             <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-2">
                {['XAU/USD', 'DXY', 'EUR/USD', 'BTC'].map(pair => (
                  <div key={pair} className="px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-[10px] font-bold text-emerald-400 flex justify-between">
                    <span>{pair}</span>
                    <span className="animate-pulse">●</span>
                  </div>
                ))}
             </div>
          </FeatureCard>

        </div>
      </div>
    </section>
  );
};

export default FeaturesBento;