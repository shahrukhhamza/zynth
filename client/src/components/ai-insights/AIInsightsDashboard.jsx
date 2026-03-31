/**
 * AIInsightsDashboard
 */

import HeroSection from './HeroSection';
import TradeInsightPanel from './TradeInsightPanel';
import WhyPanel from './WhyPanel';
import RiskPanel from './RiskPanel';
import MultiAssetImpact from './MultiAssetImpact';
import KeyDrivers from './KeyDrivers';
import DataTrustPanel from './DataTrustPanel';
import MarketNarrativePanel from './MarketNarrativePanel';
import MarketValidationPanel from './MarketValidationPanel';
import AiSummary from './AiSummary';

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

export default function AIInsightsDashboard({ macroData }) {
  if (!macroData) return <LoadingSkeleton />;

  const summary = macroData.macroSummary ?? macroData;
  const generatedAt =
    macroData.generatedAt
    ?? macroData.meta?.generatedAt
    ?? macroData.meta?.lastUpdated
    ?? macroData.lastUpdated
    ?? null;

  const drivers = macroData.drivers ?? [];
  const macroScore = macroData.macroScore ?? null;
  const indicators = macroData.indicators ?? [];
  const marketNarrative = macroData.marketNarrative ?? null;
  const marketValidation = macroData.marketValidation ?? null;
  const tradeInsight = macroData.tradeInsight ?? null;
  const tradeNarrative = macroData.tradeNarrative ?? null;

  const aiSummary = macroData.aiSummary ?? null;
  const aiStatus = macroData.aiStatus ?? null;
  const actionContext = macroData.actionContext ?? null;

  return (
    <div className="space-y-6">
      <TradeInsightPanel tradeInsight={tradeInsight} tradeNarrative={tradeNarrative} />
      <HeroSection summary={summary} generatedAt={generatedAt} macroScore={macroScore} />
      <MarketNarrativePanel narrative={marketNarrative} />
      <MarketValidationPanel marketValidation={marketValidation} macroScore={macroScore} />
      <WhyPanel summary={summary} />
      <RiskPanel summary={summary} />
      <MultiAssetImpact summary={summary} />
      <KeyDrivers drivers={drivers} indicators={indicators} macroScore={macroScore} />
      <DataTrustPanel dataInfo={summary?.dataInfo ?? macroData.dataTransparency} macroScore={macroScore} />
      <AiSummary aiSummary={aiSummary} aiStatus={aiStatus} actionContext={actionContext} />
    </div>
  );
}
