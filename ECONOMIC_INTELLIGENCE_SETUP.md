# Economic Intelligence Setup (Current)

## Overview
Economic Intelligence now runs on the AI Insights pipeline with:
- 10 macro indicators (FRED + config fallback)
- deterministic macro scoring
- regime detection (HIGH_INFLATION, RECESSION, OVERHEATING, MIXED)
- calibrated signal quality (no false precision)
- macro-vs-price conflict validation
- optional Gemini narrative layer

## Prerequisites
1. Server running in D:\US DATA\server
2. Client running in D:\US DATA\client
3. `.env` configured with:
   - `FRED_API_KEY=<your_key>`
   - `GEMINI_API_KEY=<your_key>` (optional)
   - `USE_GEMINI_AI=true` (optional)

## Start Commands
```powershell
# terminal 1
cd "D:\US DATA\server"
node server.js

# terminal 2
cd "D:\US DATA\client"
npm run dev
```

## Main Endpoint
### AI Insights Payload
`GET /api/economic/ai-insights`

Optional query params for market validation:
- `currentPrice`
- `previousPrice`

Example:
```http
GET /api/economic/ai-insights?currentPrice=2318.4&previousPrice=2331.2
```

## Other Endpoints
- `GET /api/economic/dashboard`
- `GET /api/economic/macro-score`
- `POST /api/economic/refresh`
- `GET /api/economic/health`

## Confidence Model (Updated)
The system is now level-based and uncertainty-aware.

### Output fields in `macroScore`
- `bias`: Bullish | Bearish | Neutral
- `signalStrength`: Weak | Moderate | Strong
- `signalConfidence`: Low | Medium | High
- `uncertainty`: Low | Medium | High
- `signalConfidenceScore`: bounded helper score (max 85)
- `dataConfidence`: data quality score
- `systemStatus`: OK | Warning | Critical

### Calibration rules
- confidence is based on alignment + data quality + regime clarity + magnitude
- no overconfidence: capped to realistic ranges
- mixed/contradictory signals raise uncertainty
- never present uncertain markets as highly certain

## Regime Engine (Updated)
Regimes:
- HIGH_INFLATION
- RECESSION
- OVERHEATING
- MIXED

Regime confidence is bounded to realistic bands and avoids misleading extremes.

## Market Validation (Macro vs Price)
When price params are provided, payload includes:
```json
"marketValidation": {
  "priceDirection": "UP | DOWN | SIDEWAYS",
  "macroBias": "Bullish | Bearish | Neutral",
  "conflict": true,
  "severity": "low | moderate | high",
  "severityLabel": "Low Confidence Signal | Conflict | High Conflict",
  "message": "..."
}
```

This validates macro thesis against real price action without overriding macro signal.

## Frontend Components (Current)
- `client/src/components/EconomicIntelligence.jsx`
- `client/src/components/ai-insights/AIInsightsDashboard.jsx`
- `client/src/components/ai-insights/HeroSection.jsx`
- `client/src/components/ai-insights/MarketNarrativePanel.jsx`
- `client/src/components/ai-insights/MarketValidationPanel.jsx`
- `client/src/components/ai-insights/DataTrustPanel.jsx`

## Quick Verification
1. Open Intelligence view in app.
2. Confirm Hero shows level-based signal text (not a raw high % claim).
3. Call AI Insights with and without price params.
4. Verify `marketValidation` appears when price values are supplied.
5. Verify no build/runtime errors in client/server logs.

## Troubleshooting
### 401/403
- Ensure logged-in token and Pro/Elite gate requirements are met.

### Empty AI summary
- Check `GEMINI_API_KEY` and `USE_GEMINI_AI`.

### FRED failures
- Validate `FRED_API_KEY` and outbound connectivity.

### Market validation missing
- Include `currentPrice` and `previousPrice` query params.
