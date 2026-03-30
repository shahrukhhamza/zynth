import HeroSummary from './HeroSummary';
import KeyDrivers from './KeyDrivers';
import CategorySection from './CategorySection';
import AIRecommendation from './AIRecommendation';

export default function NewAiInsightsDashboard({ macroData }) {
  if (!macroData) {
    return (
      <div className="space-y-8">
        <div className="rounded-3xl bg-white p-8 shadow-sm dark:bg-[#111827] dark:shadow-[0_12px_32px_rgba(0,0,0,0.28)]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading AI insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <HeroSummary macroData={macroData} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.9fr)]">
        <KeyDrivers drivers={macroData.drivers} />
        <AIRecommendation ai={macroData.ai} />
      </div>

      <div className="space-y-4">
        {macroData.categories.map((category, index) => (
          <CategorySection
            key={category.key}
            title={category.title}
            indicators={category.indicators}
            defaultOpen={index === 0}
          />
        ))}
      </div>
    </div>
  );
}