import React from 'react';
import { Flame, ArrowRight, Shield, Zap, Bot } from 'lucide-react';

function HeroDashboardMockup() {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/[0.07]"
         style={{background:'#0c1527', boxShadow:'0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)'}}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.05]" style={{background:'#0a1220'}}>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="px-12 py-1 rounded-md text-[11px] text-gray-600 border border-white/[0.05]"
               style={{background:'rgba(255,255,255,0.02)'}}>app.zynth.io</div>
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-start gap-5">
          <div style={{width:220}}>
            <div className="text-[11px] text-gray-400 mb-3">Equity Curve</div>
            <div style={{height:120, borderRadius:8, background:'linear-gradient(180deg,#071021,#081228)'}} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[12px] text-gray-400">Stats</div>
              <div className="text-[12px] text-gray-400">Last 30 trades</div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-md p-3" style={{background:'rgba(255,255,255,0.02)'}}>
                <div className="text-[10px] text-gray-400">Win Rate</div>
                <div className="text-[16px] font-bold">56%</div>
              </div>
              <div className="rounded-md p-3" style={{background:'rgba(255,255,255,0.02)'}}>
                <div className="text-[10px] text-gray-400">Total P&L</div>
                <div className="text-[16px] font-bold">+$1,224</div>
              </div>
              <div className="rounded-md p-3" style={{background:'rgba(255,255,255,0.02)'}}>
                <div className="text-[10px] text-gray-400">PF</div>
                <div className="text-[16px] font-bold">1.42</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Hero({ badgeText, badgeFade, spotsLeft, onGetStarted, onSignIn }) {
  return (
    <section className="relative flex flex-col items-center justify-center text-center px-6 pt-20 pb-8 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0"
             style={{backgroundImage:'linear-gradient(rgba(52,211,153,0.055) 1px,transparent 1px),linear-gradient(90deg,rgba(52,211,153,0.055) 1px,transparent 1px)',backgroundSize:'60px 60px'}} />
        <div className="absolute inset-y-0" style={{width:'480px',background:'linear-gradient(90deg,transparent 0%,rgba(16,185,129,0.06) 50%,transparent 100%)',animation:'gridSweep 9s ease-in-out infinite'}} />
        <div className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-[900px] h-[700px]"
             style={{background:'radial-gradient(ellipse,rgba(16,185,129,0.11) 0%,transparent 60%)'}} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-8 border"
             style={{background:'rgba(16,185,129,0.07)', borderColor:'rgba(16,185,129,0.22)'}}>
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
          <span className="text-[12px] font-bold tracking-[0.16em] text-emerald-400 text-center"
                style={{opacity: badgeFade ? 1 : 0, transition:'opacity 0.32s ease', minWidth:'172px', display:'inline-block'}}>
            {badgeText}
          </span>
        </div>

        <h1 className="text-[46px] md:text-[66px] font-extrabold leading-[1.1] tracking-tight mb-6">
          <span className="text-white block">You Know How To Trade.</span>
          <span className="block" style={{background:'linear-gradient(90deg,#34d399,#6ee7b7,#059669,#34d399)', backgroundSize:'300% auto', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', animation:'headlineGradient 4s ease infinite'}}>
            But Do You Know Why You Lose?
          </span>
          <span className="text-white block">Zynth Finds Out.</span>
        </h1>

        <p className="text-[18px] text-gray-400 max-w-[580px] mx-auto leading-relaxed mb-6">
          Most traders lose not because of bad strategy — but because of bad patterns they cannot see. Zynth's AI finds your blind spots, tracks your psychology, and turns your journal into your biggest competitive edge.
        </p>

        {(spotsLeft ?? 0) > 0 && (
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-8 text-[13px] font-semibold cursor-default"
               style={{background:'linear-gradient(90deg,rgba(245,158,11,0.13),rgba(239,68,68,0.08))',border:'1px solid rgba(245,158,11,0.3)',animation:'urgencyPulse 2.5s ease-in-out infinite'}}>
            <Flame className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-amber-300">{spotsLeft} founding member spots remaining</span>
            <span className="text-gray-500">— offer ends soon</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <button onClick={onGetStarted}
                  className="group relative overflow-hidden flex items-center gap-2 text-[16px] font-semibold text-white px-8 py-4 rounded-2xl hover:scale-[1.03] hover:shadow-[0_8px_32px_rgba(16,185,129,0.42)]"
                  style={{background:'linear-gradient(135deg,#059669 0%,#0d9488 100%)', boxShadow:'0 4px 20px rgba(16,185,129,0.28)'}}>
            <span className="relative z-10 flex items-center gap-2">
              Discover Your Trading Patterns
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </span>
            <span className="absolute inset-0 pointer-events-none"
                  style={{background:'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.14) 50%,transparent 100%)',backgroundSize:'200% 100%',animation:'shimmerBtn 3s linear infinite'}} />
          </button>
          <button onClick={onSignIn}
                  className="text-[16px] font-medium text-gray-300 px-8 py-4 rounded-2xl border border-white/[0.1] hover:border-white/[0.2] hover:text-white transition-all"
                  style={{background:'rgba(255,255,255,0.03)'}}>
            Sign In
          </button>
        </div>

        <div style={{display:'flex', gap:'8px', justifyContent:'center', flexWrap:'wrap'}}>
          {[
            {Icon: Shield, label: 'Secure & Private'},
            {Icon: Zap,    label: 'Real-time Data'},
            {Icon: Bot,    label: 'AI Powered'},
          ].map(({Icon, label}) => (
            <span key={label} style={{
              background:'rgba(255,255,255,0.05)',
              border:'1px solid rgba(255,255,255,0.1)',
              borderRadius:'20px',
              padding:'6px 14px',
              fontSize:'12px',
              color:'rgba(255,255,255,0.5)',
              display:'flex', alignItems:'center', gap:'5px',
            }}><Icon size={11} />{label}</span>
          ))}
        </div>
      </div>

      <div className="relative z-10 mt-16 w-full max-w-5xl mx-auto">
        <HeroDashboardMockup />
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 pointer-events-none"
             style={{background:'radial-gradient(ellipse,rgba(16,185,129,0.1) 0%,transparent 70%)', filter:'blur(8px)'}} />
      </div>
    </section>
  );
}
