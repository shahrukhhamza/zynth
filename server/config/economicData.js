// Real economic data configuration
// Updated with EXACT 2026 data from Fair Economy screenshot (March 7, 2026)

export const REAL_ECONOMIC_DATA = {
  // Last update date
  lastUpdate: '2026-03-07',
  
  // Economic indicators with EXACT 2026 values from Fair Economy
  indicators: [
    {
      id: 'nfp',
      name: 'Non-Farm Employment Change',
      currency: 'USD',
      impact: 'high',
      current: -92,   // March 06, 2026 (Feb data) - EXACT from screenshot
      forecast: 58,   // Analyst forecast
      previous: 126,  // January revised
      date: '2026-03-06', // Release date
      time: '18:30',
      source: 'Bureau of Labor Statistics',
      description: 'Change in the number of employed people during the previous month, excluding the farming industry',
      usualEffect: 'Actual greater than Forecast is good for currency',
      frequency: 'Monthly, first Friday after month ends',
      unit: 'K',
      // EXACT Historical data from Fair Economy screenshot
      historicalData: [
        { date: '2026-03-06', actual: -92, forecast: 58, previous: 126 },     // Feb 2026
        { date: '2026-02-11', actual: 130, forecast: 66, previous: 48 },     // Jan 2026
        { date: '2026-01-09', actual: 50, forecast: 66, previous: 56 },      // Dec 2025
        { date: '2025-12-16', actual: 64, forecast: 51, previous: -105 },    // Nov 2025
        { date: '2025-12-16', actual: -105, forecast: 0, previous: 108 },    // Oct 2025
        { date: '2025-11-20', actual: 119, forecast: 53, previous: -4 },     // Sep 2025
        { date: '2025-09-05', actual: 22, forecast: 75, previous: 79 },      // Aug 2025
        { date: '2025-08-01', actual: 73, forecast: 106, previous: -13 },    // Jul 2025
        { date: '2025-07-03', actual: 147, forecast: 111, previous: 19 },    // Jun 2025
        { date: '2025-06-06', actual: 139, forecast: 126, previous: 158 },   // May 2025
      ]
    },
    {
      id: 'cpi',
      name: 'Consumer Price Index m/m',
      currency: 'USD',
      impact: 'high',
      current: 0.6,
      forecast: null,
      previous: null,
      date: '2026-05-01',
      time: '08:30',
      source: 'Bureau of Labor Statistics',
      description: 'Change in the price of goods and services purchased by consumers',
      usualEffect: 'Actual greater than Forecast is good for currency',
      frequency: 'Monthly',
      unit: '%',
      historicalData: [
        { date: '2026-05-01', actual: 0.6, forecast: null, previous: null },
        { date: '2026-04-01', actual: 0.9, forecast: null, previous: null },
        { date: '2026-03-11', actual: 0.3, forecast: 0.3, previous: 0.2 },
        { date: '2026-02-13', actual: 0.2, forecast: 0.3, previous: 0.3 },
        { date: '2026-02-13', actual: 0.2, forecast: 0.3, previous: 0.3 },
        { date: '2026-01-15', actual: 0.0, forecast: 0.2, previous: 0.3 },
        { date: '2025-12-11', actual: 0.3, forecast: 0.0, previous: 0.2 },
        { date: '2025-11-13', actual: 0.2, forecast: 0.2, previous: 0.2 },
        { date: '2025-10-10', actual: 0.2, forecast: 0.1, previous: 0.0 },
      ]
    },
    {
      id: 'unemployment',
      name: 'Unemployment Rate',
      currency: 'USD',
      impact: 'high',
      current: 4.1,
      forecast: 4.0,
      previous: 4.0,
      date: '2026-03-06',
      time: '18:30',
      source: 'Bureau of Labor Statistics',
      description: 'Percentage of the total work force that is unemployed and actively seeking employment',
      usualEffect: 'Actual less than Forecast is good for currency',
      frequency: 'Monthly, first Friday',
      unit: '%',
      historicalData: [
        { date: '2026-03-06', actual: 4.1, forecast: 4.0, previous: 4.0 },
        { date: '2026-02-11', actual: 4.0, forecast: 4.2, previous: 4.2 },
        { date: '2026-01-09', actual: 4.2, forecast: 4.2, previous: 4.1 },
        { date: '2025-12-16', actual: 4.1, forecast: 4.1, previous: 4.1 },
        { date: '2025-11-20', actual: 4.1, forecast: 4.2, previous: 3.8 },
        { date: '2025-09-05', actual: 4.2, forecast: 4.2, previous: 3.7 },
      ]
    },
    {
      id: 'fed_rate',
      name: 'Fed Interest Rate Decision',
      currency: 'USD',
      impact: 'high',
      current: 4.25,
      forecast: 4.25,
      previous: 4.25,
      date: '2026-03-18',
      time: '14:00',
      source: 'Federal Reserve',
      description: 'The Federal Reserve sets the target range for the federal funds rate. Rate cuts are bearish for USD and bullish for gold; rate hikes are bullish for USD and bearish for gold.',
      usualEffect: 'Actual less than Forecast → rate cut → Bullish for Gold',
      frequency: '8 times per year (FOMC meetings)',
      unit: '%',
      historicalData: [
        { date: '2026-01-29', actual: 4.25, forecast: 4.25, previous: 4.25 },
        { date: '2025-12-18', actual: 4.25, forecast: 4.25, previous: 4.50 },
        { date: '2025-11-07', actual: 4.50, forecast: 4.50, previous: 4.75 },
        { date: '2025-09-18', actual: 4.75, forecast: 4.75, previous: 5.00 },
        { date: '2025-07-30', actual: 5.00, forecast: 5.00, previous: 5.25 },
        { date: '2025-05-07', actual: 5.25, forecast: 5.25, previous: 5.25 },
      ]
    },
    {
      id: 'gdp',
      name: 'GDP q/q',
      currency: 'USD',
      impact: 'high',
      current: 2.1,
      forecast: null,
      previous: null,
      date: '2026-01-01',
      time: '08:30',
      source: 'Bureau of Economic Analysis',
      description: 'Annualized rate of change in the inflation-adjusted value of all goods and services produced by the economy. Advance estimate — first reading of the quarter.',
      usualEffect: 'Actual greater than Forecast is good for currency',
      frequency: 'Quarterly (Advance, Preliminary, Final)',
      unit: '%',
      historicalData: [
        { date: '2026-01-01', actual: 2.1, forecast: null, previous: null },
        { date: '2025-10-01', actual: 0.5, forecast: null, previous: null },
        { date: '2025-10-01', actual: 0.7, forecast: null, previous: null },
        { date: '2026-01-29', actual: 1.2, forecast: 1.8, previous: 2.3 },   // Q4 2025 advance
        { date: '2025-10-30', actual: 2.3, forecast: 2.5, previous: 2.8 },   // Q3 2025 advance
        { date: '2025-07-30', actual: 2.8, forecast: 2.4, previous: 1.4 },   // Q2 2025 advance
        { date: '2025-04-30', actual: 1.4, forecast: 1.8, previous: 2.4 },   // Q1 2025 advance
        { date: '2025-01-29', actual: 2.4, forecast: 2.6, previous: 3.1 },   // Q4 2024 advance
        { date: '2024-10-30', actual: 3.1, forecast: 3.0, previous: 2.2 },   // Q3 2024 advance
      ]
    },
    {
      id: 'core_pce',
      name: 'Core PCE Price Index m/m',
      currency: 'USD',
      impact: 'high',
      current: 0.4,
      forecast: 0.3,
      previous: 0.2,
      date: '2026-02-28',
      time: '08:30',
      source: 'Bureau of Economic Analysis',
      description: "The Fed's preferred inflation measure — excludes food and energy. Month-over-month change in the prices of goods and services purchased by consumers, excluding volatile food and energy components.",
      usualEffect: 'Actual greater than Forecast → more inflation → Bullish for Gold',
      frequency: 'Monthly',
      unit: '%',
      historicalData: [
        { date: '2026-02-28', actual: 0.4, forecast: 0.3, previous: 0.2 },
        { date: '2026-01-31', actual: 0.3, forecast: 0.3, previous: 0.1 },
        { date: '2025-12-20', actual: 0.1, forecast: 0.2, previous: 0.3 },
        { date: '2025-11-26', actual: 0.3, forecast: 0.2, previous: 0.2 },
        { date: '2025-10-31', actual: 0.2, forecast: 0.2, previous: 0.1 },
        { date: '2025-09-27', actual: 0.1, forecast: 0.2, previous: 0.2 },
      ]
    },
    {
      id: 'core_cpi',
      name: 'Core CPI m/m',
      currency: 'USD',
      impact: 'high',
      current: 0.3,
      forecast: null,
      previous: null,
      date: '2026-05-01',
      time: '08:30',
      source: 'Bureau of Labor Statistics',
      description: 'Change in the price of goods and services purchased by consumers, excluding food and energy. Closely watched by the Federal Reserve as a signal on underlying inflation.',
      usualEffect: 'Actual greater than Forecast → higher inflation → Bullish for Gold',
      frequency: 'Monthly',
      unit: '%',
      historicalData: [
        { date: '2026-05-01', actual: 0.3, forecast: null, previous: null },
        { date: '2026-04-01', actual: 0.4, forecast: null, previous: null },
        { date: '2026-03-11', actual: 0.2, forecast: 0.2, previous: 0.3 },
        { date: '2026-02-13', actual: 0.3, forecast: 0.3, previous: 0.2 },
        { date: '2026-01-15', actual: 0.2, forecast: 0.2, previous: 0.3 },
        { date: '2025-12-11', actual: 0.3, forecast: 0.2, previous: 0.3 },
        { date: '2025-11-13', actual: 0.3, forecast: 0.3, previous: 0.2 },
        { date: '2025-10-10', actual: 0.2, forecast: 0.2, previous: 0.3 },
      ]
    },
    {
      id: 'ppi',
      name: 'PPI m/m',
      currency: 'USD',
      impact: 'high',
      current: 0.4,
      forecast: 0.3,
      previous: 0.1,
      date: '2026-02-13',
      time: '08:30',
      source: 'Bureau of Labor Statistics',
      description: 'Change in the selling prices received by domestic producers. PPI is a leading indicator for CPI — producers pass higher costs to consumers.',
      usualEffect: 'Actual greater than Forecast → higher producer prices → Bullish for Gold',
      frequency: 'Monthly',
      unit: '%',
      historicalData: [
        { date: '2026-02-13', actual: 0.4, forecast: 0.3, previous: 0.1 },
        { date: '2026-01-16', actual: 0.2, forecast: 0.2, previous: -0.1 },
        { date: '2025-12-12', actual: 0.3, forecast: 0.2, previous: 0.2 },
        { date: '2025-11-14', actual: 0.2, forecast: 0.2, previous: 0.0 },
        { date: '2025-10-11', actual: 0.0, forecast: 0.1, previous: 0.2 },
        { date: '2025-09-11', actual: 0.2, forecast: 0.1, previous: 0.1 },
      ]
    },
    {
      id: 'retail_sales',
      name: 'Retail Sales m/m',
      currency: 'USD',
      impact: 'high',
      current: -0.4,
      forecast: -0.1,
      previous: 0.7,
      date: '2026-02-17',
      time: '08:30',
      source: 'U.S. Census Bureau',
      description: 'Change in the total value of sales at the retail level. It is the primary gauge of consumer spending. Weak retail sales suggest consumers are cutting back — often bullish for gold as a safe haven.',
      usualEffect: 'Actual less than Forecast → weak spending → Bullish for Gold',
      frequency: 'Monthly',
      unit: '%',
      historicalData: [
        { date: '2026-02-17', actual: -0.4, forecast: -0.1, previous: 0.7 },
        { date: '2026-01-16', actual: 0.4, forecast: 0.5, previous: -0.9 },
        { date: '2025-12-17', actual: -0.9, forecast: -0.5, previous: 0.4 },
        { date: '2025-11-15', actual: 0.4, forecast: 0.3, previous: -0.3 },
        { date: '2025-10-17', actual: -0.3, forecast: 0.1, previous: 0.1 },
        { date: '2025-09-12', actual: 0.1, forecast: 0.2, previous: 0.1 },
      ]
    },
    {
      id: 'ism_manufacturing',
      name: 'ISM Manufacturing PMI',
      currency: 'USD',
      impact: 'high',
      current: 47.3,
      forecast: 49.0,
      previous: 50.9,
      date: '2026-03-02',
      time: '15:00',
      source: 'Institute for Supply Management',
      description: 'Survey of purchasing managers in the manufacturing sector. Above 50 = expansion; below 50 = contraction. A persistent sub-50 reading signals recession risk — typically bullish for gold.',
      usualEffect: 'Actual less than Forecast → weaker manufacturing → Bullish for Gold',
      frequency: 'Monthly (first business day)',
      unit: '',
      historicalData: [
        { date: '2026-03-02', actual: 47.3, forecast: 49.0, previous: 50.9 },
        { date: '2026-02-03', actual: 50.9, forecast: 49.5, previous: 49.3 },
        { date: '2026-01-02', actual: 49.3, forecast: 49.0, previous: 48.4 },
        { date: '2025-12-02', actual: 48.4, forecast: 47.7, previous: 46.5 },
        { date: '2025-11-01', actual: 46.5, forecast: 47.0, previous: 47.2 },
        { date: '2025-10-01', actual: 47.2, forecast: 47.9, previous: 48.5 },
      ]
    },
    {
      id: 'ism_services',
      name: 'ISM Services PMI',
      currency: 'USD',
      impact: 'high',
      current: 52.1,
      forecast: 53.5,
      previous: 54.1,
      date: '2026-03-04',
      time: '15:00',
      source: 'Institute for Supply Management',
      description: 'Survey of purchasing managers in the services sector. Services represent ~80% of the US economy. A miss in services PMI signals broad economic slowdown — typically bullish for gold.',
      usualEffect: 'Actual less than Forecast → weaker services → Bullish for Gold',
      frequency: 'Monthly (third business day)',
      unit: '',
      historicalData: [
        { date: '2026-03-04', actual: 52.1, forecast: 53.5, previous: 54.1 },
        { date: '2026-02-05', actual: 54.1, forecast: 53.8, previous: 53.5 },
        { date: '2026-01-07', actual: 53.5, forecast: 53.0, previous: 52.1 },
        { date: '2025-12-04', actual: 52.1, forecast: 53.1, previous: 56.0 },
        { date: '2025-11-05', actual: 56.0, forecast: 53.4, previous: 54.9 },
        { date: '2025-10-03', actual: 54.9, forecast: 53.8, previous: 51.5 },
      ]
    },
    {
      id: 'jobless_claims',
      name: 'Initial Jobless Claims',
      currency: 'USD',
      impact: 'high',
      current: 242,
      forecast: 225,
      previous: 221,
      date: '2026-03-06',
      time: '08:30',
      source: 'Department of Labor',
      description: 'Number of individuals who filed for unemployment benefits for the first time during the past week. A leading labor market indicator — rising claims signal weakening employment.',
      usualEffect: 'Actual greater than Forecast → more jobless claims → Bullish for Gold',
      frequency: 'Weekly (every Thursday)',
      unit: 'K',
      historicalData: [
        { date: '2026-03-06', actual: 242, forecast: 225, previous: 221 },
        { date: '2026-02-27', actual: 221, forecast: 223, previous: 219 },
        { date: '2026-02-20', actual: 219, forecast: 221, previous: 217 },
        { date: '2026-02-13', actual: 220, forecast: 218, previous: 213 },
        { date: '2026-02-06', actual: 214, forecast: 215, previous: 207 },
        { date: '2026-01-30', actual: 207, forecast: 210, previous: 217 },
      ]
    },
    {
      id: 'consumer_confidence',
      name: 'CB Consumer Confidence',
      currency: 'USD',
      impact: 'high',
      current: 90.5,
      forecast: 98.0,
      previous: 105.3,
      date: '2026-02-25',
      time: '15:00',
      source: 'Conference Board',
      description: "Level of confidence that consumers have in the strength of the economy. Based on a survey of ~3,000 households. Low confidence reflects economic uncertainty — typically bullish for gold.",
      usualEffect: 'Actual less than Forecast → weaker confidence → Bullish for Gold',
      frequency: 'Monthly (last Tuesday)',
      unit: '',
      historicalData: [
        { date: '2026-02-25', actual: 90.5,  forecast: 98.0,  previous: 105.3 },
        { date: '2026-01-28', actual: 104.1, forecast: 106.0, previous: 109.5 },
        { date: '2025-12-30', actual: 109.5, forecast: 113.0, previous: 111.7 },
        { date: '2025-11-25', actual: 111.7, forecast: 113.5, previous: 99.2  },
        { date: '2025-10-28', actual: 99.2,  forecast: 100.0, previous: 103.3 },
        { date: '2025-09-30', actual: 103.3, forecast: 104.0, previous: 107.0 },
      ]
    },
    {
      id: 'durable_goods',
      name: 'Durable Goods Orders m/m',
      currency: 'USD',
      impact: 'high',
      current: -1.1,
      forecast: 0.3,
      previous: -0.2,
      date: '2026-02-26',
      time: '08:30',
      source: 'U.S. Census Bureau',
      description: 'Change in the total value of new purchase orders placed with manufacturers for durable goods. A leading indicator of factory output and business investment.',
      usualEffect: 'Actual less than Forecast → weak investment → Bullish for Gold',
      frequency: 'Monthly',
      unit: '%',
      historicalData: [
        { date: '2026-02-26', actual: -1.1, forecast: 0.3,  previous: -0.2 },
        { date: '2026-01-28', actual: -0.2, forecast: 0.1,  previous:  3.4 },
        { date: '2025-12-24', actual:  3.4, forecast: 0.8,  previous: -0.7 },
        { date: '2025-11-26', actual: -0.7, forecast: -0.4, previous:  0.1 },
        { date: '2025-10-24', actual:  0.1, forecast: -0.6, previous: -0.2 },
        { date: '2025-09-25', actual: -0.2, forecast: -0.3, previous:  9.9 },
      ]
    },
    {
      id: 'trade_balance',
      name: 'Trade Balance',
      currency: 'USD',
      impact: 'high',
      current: -129.6,
      forecast: -122.0,
      previous: -98.4,
      date: '2026-03-05',
      time: '08:30',
      source: 'U.S. Census Bureau',
      description: 'Difference in value between imported and exported goods and services during the reported period. A widening deficit puts downward pressure on the USD, which typically supports gold prices.',
      usualEffect: 'Actual worse than Forecast → wider deficit → tends Bullish for Gold',
      frequency: 'Monthly',
      unit: 'B',
      historicalData: [
        { date: '2026-03-05', actual: -129.6, forecast: -122.0, previous: -98.4  },
        { date: '2026-02-05', actual: -98.4,  forecast: -96.0,  previous: -78.9  },
        { date: '2026-01-07', actual: -78.9,  forecast: -80.0,  previous: -83.8  },
        { date: '2025-12-03', actual: -83.8,  forecast: -80.0,  previous: -73.8  },
        { date: '2025-11-05', actual: -73.8,  forecast: -74.0,  previous: -70.4  },
        { date: '2025-10-07', actual: -70.4,  forecast: -71.0,  previous: -79.6  },
      ]
    },
    {
      id: 'fomc_minutes',
      name: 'FOMC Meeting Minutes',
      currency: 'USD',
      impact: 'high',
      current: null,
      forecast: null,
      previous: null,
      date: '2026-02-19',
      time: '19:00',
      source: 'Federal Reserve',
      description: 'Detailed record of the FOMC\'s most recent policy meeting, released ~3 weeks after. Markets parse the minutes for clues about future rate policy — hawkish tone is bearish for gold, dovish tone is bullish.',
      usualEffect: 'Hawkish tone → Bearish for Gold | Dovish tone → Bullish for Gold',
      frequency: '8 times per year (~3 weeks after meeting)',
      unit: '',
      historicalData: [
        { date: '2026-02-19', actual: null, forecast: null, previous: null },
        { date: '2026-01-08', actual: null, forecast: null, previous: null },
        { date: '2025-11-26', actual: null, forecast: null, previous: null },
        { date: '2025-10-08', actual: null, forecast: null, previous: null },
        { date: '2025-08-20', actual: null, forecast: null, previous: null },
        { date: '2025-07-02', actual: null, forecast: null, previous: null },
      ]
    },
    {
      id: 'building_permits',
      name: 'Building Permits',
      currency: 'USD',
      impact: 'high',
      current: 1.38,
      forecast: 1.45,
      previous: 1.47,
      date: '2026-02-19',
      time: '08:30',
      source: 'U.S. Census Bureau',
      description: 'Annualized number of new residential building permits issued during the reported month. A leading indicator of future housing construction and economic activity.',
      usualEffect: 'Actual less than Forecast → slowing housing → mild Bullish for Gold',
      frequency: 'Monthly',
      unit: 'M',
      historicalData: [
        { date: '2026-02-19', actual: 1.38, forecast: 1.45, previous: 1.47 },
        { date: '2026-01-17', actual: 1.47, forecast: 1.45, previous: 1.43 },
        { date: '2025-12-18', actual: 1.43, forecast: 1.42, previous: 1.44 },
        { date: '2025-11-19', actual: 1.44, forecast: 1.43, previous: 1.38 },
        { date: '2025-10-17', actual: 1.38, forecast: 1.40, previous: 1.47 },
        { date: '2025-09-18', actual: 1.47, forecast: 1.44, previous: 1.40 },
      ]
    },
  ]
};

// Helper function to get real data
export function getRealEconomicData() {
  return REAL_ECONOMIC_DATA.indicators.map(indicator => ({
    ...indicator,
    lastUpdate: new Date().toISOString(),
    releases: indicator.historicalData.slice(0, 6).map(h => ({
      date: h.date,
      time: indicator.time,
      actual: h.actual,
      forecast: h.forecast,
      previous: h.previous
    }))
  }));
}
