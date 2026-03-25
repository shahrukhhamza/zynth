import React from 'react';
import { motion } from 'framer-motion';
import { Check, Flame, Zap, Trophy, Crown } from 'lucide-react';

const PricingCard = ({ tier, price, description, features, icon: Icon, highlight, ribbon }) => (
  <motion.div 
    whileHover={{ y: -10 }}
    className={`relative flex flex-col p-8 rounded-3xl border transition-all duration-500 ${
      highlight 
        ? 'bg-[#0A0F1A] border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.1)]' 
        : 'bg-[#0A0A0B] border-white/10'
    }`}
  >
    {ribbon && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-600 text-black text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest shadow-lg">
        {ribbon}
      </div>
    )}

    <div className="mb-8">
      <div className={`inline-flex p-3 rounded-2xl mb-4 ${highlight ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-gray-400'}`}>
        <Icon size={24} />
      </div>
      <h3 className="text-2xl font-bold text-white mb-2">{tier}</h3>
      <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
    </div>

    <div className="mb-8">
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-black text-white">${price}</span>
        <span className="text-gray-500 text-sm">/month</span>
      </div>
      {highlight && <p className="text-[10px] text-emerald-500 font-bold mt-2 uppercase tracking-tighter">Billed annually — 78% OFF Founding Price</p>}
    </div>

    <ul className="space-y-4 mb-10 flex-1">
      {features.map((feature, i) => (
        <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
          <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
          {feature}
        </li>
      ))}
    </ul>

    <button className={`w-full py-4 rounded-xl font-bold transition-all ${
      highlight 
        ? 'bg-emerald-500 text-black hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]' 
        : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
    }`}>
      Get Started
    </button>
  </motion.div>
);

const Pricing = ({ spotsLeft }) => {
  return (
    <section className="relative py-24 px-6 bg-[#030303] overflow-hidden">
      {/* Visual background element */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black text-white mb-6"
          >
            Institutional Tools. <span className="text-emerald-400">Retail Prices.</span>
          </motion.h2>
          
          {/* Founding Member Urgency Banner */}
          <div className="inline-flex items-center gap-4 p-1 pr-6 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <div className="bg-amber-500/10 px-4 py-2 rounded-full flex items-center gap-2">
              <Flame size={16} className="text-amber-500 animate-pulse" />
              <span className="text-amber-500 font-bold text-xs uppercase tracking-widest">Founding Offer</span>
            </div>
            <span className="text-gray-300 text-xs font-medium">
               Only <span className="text-white font-bold">{spotsLeft || 95} spots remaining</span> — Secure $1.99/mo forever.
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <PricingCard 
            tier="Free"
            price="0"
            icon={Zap}
            description="Perfect for testing the Zynth ecosystem."
            features={[
              "10 Journal entries / month",
              "Manual trade entry",
              "Basic analytics & charts",
              "Economic calendar access"
            ]}
          />

          <PricingCard 
            tier="Pro"
            price="1.66"
            icon={Trophy}
            highlight={true}
            ribbon="Most Popular"
            description="For active traders looking to fix their edge."
            features={[
              "Unlimited Journal entries",
              "50 AI Trade Analyses / month",
              "35 Screenshot OCR imports",
              "Macro Correlation access",
              "Live Market Intelligence"
            ]}
          />

          <PricingCard 
            tier="Elite"
            price="3.99"
            icon={Crown}
            ribbon="Best Value"
            description="The full institutional suite for professionals."
            features={[
              "Everything in Pro",
              "Unlimited AI Trade Analysis",
              "Unlimited Screenshot OCR",
              "Trading DNA Profile",
              "Custom Performance Reports"
            ]}
          />
        </div>

        <p className="mt-12 text-center text-gray-500 text-xs">
          All prices in USD. Billed annually. Secure checkout via Stripe.
        </p>
      </div>
    </section>
  );
};

export default Pricing;