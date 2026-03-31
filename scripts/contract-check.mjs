import {
  getEconomicDashboard,
  calculateMacroSurpriseScore,
  buildAiInsightsPayload,
} from '../server/services/economicIntelligenceService.js';

const dashboard = await getEconomicDashboard();
const score = await calculateMacroSurpriseScore();
const payload = buildAiInsightsPayload(dashboard, score, null);

const required = [
  'indicators',
  'score',
  'sentiment',
  'confidence',
  'signalConflict',
  'signalConsistencyScore',
  'dataCompleteness',
  'systemHealth',
  'riskAlerts',
  'status',
  'lastUpdated',
];

const indicatorFields = [
  'name',
  'actual',
  'forecast',
  'previous',
  'change',
  'trend',
  'impact',
  'impactStrength',
  'freshness',
  'freshnessReason',
  'daysSinceRelease',
  'releaseFrequency',
  'lastReleaseDate',
  'nextReleaseDate',
  'forecastSource',
  'forecastConfidence',
  'dataWarning',
  'isReleaseDelayed',
  'delayReason',
  'isRevised',
  'revisionMagnitude',
  'revisionNote',
];

const missingTopLevel = required.filter(k => !(k in payload));
const first = payload.indicators?.[0] || {};
const indicatorMissing = indicatorFields.filter(k => !(k in first));

const report = {
  missingTopLevel,
  indicatorMissing,
  indicatorCount: Array.isArray(payload.indicators) ? payload.indicators.length : 0,
  signalConflict: payload.signalConflict,
  signalConsistencyScore: payload.signalConsistencyScore,
  dataCompleteness: payload.dataCompleteness,
  systemHealth: payload.systemHealth,
  fallbackMode: payload.fallbackMode,
  dataReliability: payload.dataReliability,
  sampleIndicator: payload.indicators?.[0] || null,
};

console.log(JSON.stringify(report, null, 2));
