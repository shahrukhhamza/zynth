import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Search, LineChart, Shield, Zap, Cpu, BarChart3 } from 'lucide-react';
import { IconContainer } from './ui';
import { useTheme } from '../contexts/ThemeContext';

const FeatureCard = ({ title, description, icon: Icon, iconVariant = 'blue', className, children }) => {
  const { isDark } = useTheme();
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={`relative overflow-hidden rounded-3xl border p-8 glass-card ${isDark ? 'border-white/10 bg-[#0A0A0B]' : 'border-zinc-200 bg-white'} ${className}`}
    >
      <div className="relative z-10">
        <div className="mb-5">
          <IconContainer icon={Icon} variant={iconVariant} size="lg" />
        </div>
        <h3 className={`mb-2 text-xl font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>{title}</h3>
        <p className={`text-sm leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>{description}</p>
      </div>
      {children}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 transition-opacity hover:opacity-100" />
    </motion.div>
  );
};

const FeaturesBento = () => {
  const { isDark } = useTheme();
  return (
    <section className={`relative py-24 px-6 overflow-hidden ${isDark ? 'bg-[#030303]' : 'bg-zinc-50'}`}>
      {/* Background Orbs */}
      <div className="absolute top-1/2 left-1/2 -tranzinc-x-1/2 -tranzinc-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className={`text-4xl md:text-5xl font-black tracking-tight mb-4 ${isDark ? 'text-white' : 'text-zinc-900'}`}
          >
            Everything a <span className="text-emerald-400">Serious</span> Trader Needs
          </motion.h2>
          <p className={`max-w-2xl mx-auto ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Stop guessing. Start using institutional-grade data and behavioral science to fix your edge.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-4 h-full">
          
          {/* 1. Large Feature: AI Trade Journal (Spans 2 columns) */}
          <FeatureCard 
            icon={Brain}
            iconVariant="purple"
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

          {/* 2. Macro Correlation (Small Card) */}
          <FeatureCard 
            icon={LineChart}
            iconVariant="blue"
            title="Macro Correlation"
            description="Score your trades against 10 High-Impact US indicators. Know if you're fighting the trend or riding it."
            className="md:col-span-1 md:row-span-1"
          />

          {/* 4. Large Feature: Live Market Intelligence (Spans 2 columns) */}
          <FeatureCard 
            icon={Zap}
            iconVariant="amber"
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