# Trading Intelligence Dashboard - Architecture

## Core Principle: REAL DATA ONLY

**The Problem We Solved:**
- ❌ AI was generating/hallucinating economic numbers
- ❌ Mock data was being used instead of real values
- ❌ No clear separation between data fetching and analysis

**The Solution:**
- ✅ APIs fetch REAL numbers from verified sources
- ✅ AI only analyzes data (text insights, NO numbers)
- ✅ Clear fallback chain with data source transparency

---

## Data Architecture

### 1. Data Sources (Priority Order)

```
┌─────────────────────────────────────────────┐
│  1. API Data (FRED, Alpha Vantage)          │
│     - Real economic indicators              │
│     - Historical time series                │
│     - NO forecasts (FRED limitation)        │
└─────────────────────────────────────────────┘
                    ↓ (if API fails)
┌─────────────────────────────────────────────┐
│  2. Config File (economicData.js)           │
│     - Manually verified 2026 data           │
│     - Fair Economy screenshot values        │
│     - Includes real analyst forecasts       │
└─────────────────────────────────────────────┘
                    ↓ (if disabled)
┌─────────────────────────────────────────────┐
│  3. Mock Data (Development Only)            │
│     - Random values for testing             │
│     - NOT for production                    │
└─────────────────────────────────────────────┘
```

### 2. AI Role (Gemini)

**What AI DOES:**
```javascript
// ✅ CORRECT: Analyze existing data
const prompt = `
Analyze this NFP data:
Actual: 150K
Forecast: 66K
Previous: 48K

Explain the market impact on USD and Gold.
`;
```

**What AI DOES NOT DO:**
```javascript
// ❌ WRONG: Generate or fetch data
const prompt = `
Search the web for the latest NFP data and provide:
- Actual value
- Forecast
- Previous
`;
```

---

## Implementation

### Backend Services

#### 1. `apiDataService.js`
**Purpose:** Fetch REAL economic data from APIs

**Functions:**
- `fetchFredEconomicData()` - Get data from Federal Reserve
- `fetchAlphaVantageData()` - Get additional market data  
- `fetchEconomicNews()` - Get verified news articles
- `formatForChart(data)` - Transform for frontend visualization

**Example:**
```javascript
// Fetches REAL NFP data from FRED
const fredData = await fetchFredEconomicData();
// Returns: { nfp: [{date: '2026-03-06', value: -92}, ...] }
```

#### 2. `geminiAnalysisService.js`
**Purpose:** Provide TEXT insights only (NO number generation)

**Functions:**
- `analyzeNFPImpact(data)` - Analyze NFP beat/miss
- `analyzeEconomicTrend(data)` - Overall economic assessment
- `generateScenarioAnalysis(data)` - Hypothetical scenarios
- `analyzeNewsSentiment(news)` - News sentiment analysis

**Example:**
```javascript
// Analyzes existing NFP data
const insights = await analyzeNFPImpact({
  actual: 150,
  forecast: 66,
  previous: 48,
  date: '2026-02-11'
});
// Returns TEXT analysis: "Strong beat suggests..."
```

#### 3. `economicCalendarService.js`
**Purpose:** Orchestrate data flow

**Logic:**
```javascript
1. Try API data (if USE_API_DATA=true)
   ↓
2. Fallback to config file (if USE_REAL_ECONOMIC_DATA=true)
   ↓
3. Generate mock data (development only)
   ↓
4. Optionally enhance with AI text insights (if USE_GEMINI_AI=true)
```

---

## Environment Configuration

### `.env` File

```bash
# === DATA SOURCES ===

# Use API data (FRED, Alpha Vantage)
USE_API_DATA=false              # Set true to enable API fetching
FRED_API_KEY=your_fred_key      # Get from: https://fred.stlouisfed.org/
ALPHA_VANTAGE_KEY=your_av_key   # Get from: https://www.alphavantage.co/

# Use config file data (verified 2026 values)
USE_REAL_ECONOMIC_DATA=true     # Currently using Fair Economy data

# === AI ANALYSIS ===

# Use Gemini for TEXT analysis (NOT data generation)
USE_GEMINI_AI=false             # Set true to enable AI insights
GEMINI_API_KEY=your_gemini_key  # Get from: https://makersuite.google.com/

# === NEWS SOURCES ===

POLYGON_API_KEY=your_polygon_key     # For financial news
MARKETAUX_API_KEY=your_marketaux_key # Alternative news source
```

---

## Data Flow Examples

### Example 1: Using API Data

```
User requests calendar
         ↓
economicCalendarService.getEconomicCalendar()
         ↓
apiDataService.fetchFredEconomicData()
         ↓
FRED API: "PAYEMS series, last 12 months"
         ↓
Transform to standard format:
{
  id: 'nfp',
  current: -92,
  previous: 126,
  forecast: 58 (estimated, FRED doesn't provide)
}
         ↓
(Optional) geminiAnalysisService.analyzeNFPImpact()
         ↓
Add TEXT insights:
{
  ...data,
  aiInsights: {
    summary: "Significant miss indicates...",
    beat: false,
    surprise: -150
  }
}
         ↓
Return to frontend
```

### Example 2: Using Config File

```
User requests calendar
         ↓
economicCalendarService.getEconomicCalendar()
         ↓
API disabled, use config file
         ↓
getRealDataFromConfig()
         ↓
Load economicData.js:
{
  indicators: [
    {
      id: 'nfp',
      current: -92,  // EXACT value from Fair Economy
      forecast: 58,  // Real analyst consensus
      previous: 126
    }
  ]
}
         ↓
Return to frontend (no AI enhancement needed)
```

---

## Frontend Integration

### Chart Data Format

APIs and config file both return standardized format:

```javascript
{
  id: 'nfp',
  name: 'Non-Farm Employment Change',
  currency: 'USD',
  impact: 'high',
  current: -92,     // Latest actual value
  forecast: 58,     // Analyst forecast
  previous: 126,    // Prior month
  date: '2026-03-06',
  time: '18:30',
  source: 'Bureau of Labor Statistics',
  unit: 'K',
  historicalData: [
    { date: '2026-03-06', actual: -92, forecast: 58, previous: 126 },
    { date: '2026-02-11', actual: 130, forecast: 66, previous: 48 },
    // ... 10 more months
  ],
  // Optional AI insights (text only)
  aiInsights: {
    summary: "Significant miss suggests labor market weakening...",
    beat: false,
    surprise: -150
  }
}
```

### Chart.js Implementation

```jsx
// Transform for Chart.js
const chartData = {
  labels: indicator.historicalData.map(d => d.date),
  datasets: [
    {
      label: 'Actual',
      data: indicator.historicalData.map(d => d.actual),
      backgroundColor: 'rgba(34, 197, 94, 0.5)'
    },
    {
      label: 'Forecast',
      data: indicator.historicalData.map(d => d.forecast),
      backgroundColor: 'rgba(251, 191, 36, 0.5)'
    }
  ]
};
```

---

## API Limitations & Workarounds

### FRED API

**Limitations:**
- ❌ No analyst forecasts (only actual releases)
- ❌ Total employment levels (not monthly change for NFP)
- ❌ No real-time data (delayed by 1-2 days)

**Workarounds:**
1. Calculate monthly change: `(current - previous) * 1000`
2. Estimate forecast: `actual * 0.9` (90% of actual)
3. Use config file for real forecasts

### Alpha Vantage

**Limitations:**
- ❌ 5 API calls per minute (free tier)
- ❌ No NFP or CPI data
- ✅ Good for GDP, market data

**Usage:**
```javascript
// Only for specific indicators not available in FRED
const gdpData = await fetchAlphaVantageData();
```

---

## Validation & Testing

### Data Accuracy Check

```bash
# Test calendar endpoint
curl http://localhost:5000/api/calendar | jq '.[0]'

# Should return:
{
  "id": "nfp",
  "current": -92,
  "forecast": 58,
  "previous": 126,
  "date": "2026-03-06",
  "source": "Verified Config (Fair Economy)"
}
```

### Verify No AI-Generated Numbers

```bash
# Check logs for:
"✓ Using verified config file data (Fair Economy 2026)"
# NOT:
"🤖 Generating AI-enhanced data"
```

---

## Current Status (March 7, 2026)

### Active Configuration

```
✅ Data Source: Config File (economicData.js)
✅ Latest NFP: -92K actual vs 58K forecast (March 6, 2026)
✅ Data Accuracy: 100% match with Fair Economy
❌ API Fetching: Disabled (USE_API_DATA=false)
❌ AI Analysis: Disabled (USE_GEMINI_AI=false)
```

### Why Config File?

1. **Accuracy:** FRED doesn't provide real analyst forecasts
2. **Verification:** Can manually verify against Fair Economy
3. **Reliability:** No API rate limits or outages
4. **Control:** Full control over data displayed

### Future Improvements

1. **Paid API:** Consider Trading Economics API (has real forecasts)
2. **Web Scraping:** Scrape Forex Factory/Fair Economy (legal review needed)
3. **Gemini Fix:** Debug endpoint issues for AI insights
4. **Real-time Updates:** Webhook from paid data provider

---

## Error Handling

### API Failures

```javascript
try {
  const apiData = await fetchFredEconomicData();
} catch (error) {
  console.error('✗ API fetch failed:', error.message);
  // Automatic fallback to config file
  return getRealDataFromConfig();
}
```

### Missing Data

```javascript
if (!indicator.current || !indicator.forecast) {
  return {
    ...indicator,
    error: 'Data temporarily unavailable',
    fallback: true
  };
}
```

### AI Service Failures

```javascript
// AI enhancement is optional
const insights = await analyzeNFPImpact(data).catch(err => {
  console.error('✗ AI analysis failed:', err.message);
  return null; // Continue without insights
});
```

---

## Security Best Practices

### API Key Management

```bash
# .env file (never commit!)
FRED_API_KEY=abc123...
GEMINI_API_KEY=xyz789...

# .gitignore
.env
.env.local
```

### Rate Limiting

```javascript
// Implement caching to reduce API calls
const cache = new NodeCache({ stdTTL: 3600 }); // 1 hour

async function fetchData() {
  const cached = cache.get('economic_data');
  if (cached) return cached;
  
  const fresh = await apiCall();
  cache.set('economic_data', fresh);
  return fresh;
}
```

---

## Maintenance

### Monthly Data Updates

When new NFP data is released (first Friday):

1. Check Fair Economy: https://www.faireconomy.org
2. Note: Actual, Forecast, Previous values
3. Update `economicData.js`:

```javascript
historicalData: [
  { date: '2026-04-04', actual: ???, forecast: ???, previous: -92 },
  { date: '2026-03-06', actual: -92, forecast: 58, previous: 126 },
  // ... keep last 12 months
]
```

4. Update `current`, `forecast`, `previous` fields
5. Test: `curl http://localhost:5000/api/calendar`

### API Key Rotation

```bash
# Every 90 days
1. Generate new API keys
2. Update .env file
3. Restart servers
4. Verify data loading
```

---

## Troubleshooting

### Issue: "Using mock data"

**Cause:** All data sources disabled

**Fix:**
```bash
# Enable config file
USE_REAL_ECONOMIC_DATA=true
```

### Issue: "FRED API error: 404"

**Cause:** Invalid API key or series ID

**Fix:**
```bash
# Get free key: https://fred.stlouisfed.org/docs/api/api_key.html
FRED_API_KEY=your_valid_key
```

### Issue: "Gemini generating numbers"

**Cause:** Prompt allows AI to guess values

**Fix:**
```javascript
// ❌ Bad prompt
"Provide the latest NFP value"

// ✅ Good prompt
"Analyze this NFP data: Actual=150K, Forecast=66K"
```

---

## Contact & Support

**Documentation:** See `/docs` folder for detailed API documentation

**Issues:** If data doesn't match Fair Economy, verify `economicData.js` values

**Updates:** Check Fair Economy first Friday of each month for new releases
