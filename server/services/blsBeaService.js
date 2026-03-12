/**
 * BLS & BEA Service
 *
 * Provides live economic data from two official US government APIs:
 *
 *  • Bureau of Labor Statistics (BLS) — labor and price data
 *    https://api.bls.gov/publicAPI/v2/timeseries/data/
 *    Series used:
 *      CES0000000001   Total Nonfarm Payrolls (NFP), thousands
 *      CUUR0000SA0     CPI All Urban Consumers (not seasonally adjusted)
 *      CUUR0000SA0L1E  Core CPI (ex food & energy)
 *      LNS14000000     Unemployment Rate (%)
 *
 *  • Bureau of Economic Analysis (BEA) — GDP and PCE data
 *    https://apps.bea.gov/api/data
 *    Tables used:
 *      T10101 Line 1   Real GDP % change (quarterly, SAAR)
 *      T20804 Line 12  Core PCE Price Index % change
 *
 * Each public fetch function returns { actual: number, date: 'YYYY-MM-DD' }
 * or null on failure, and logs the source + value fetched.
 */

import axios from 'axios';

const BLS_BASE_URL = 'https://api.bls.gov/publicAPI/v2/timeseries/data/';
const BEA_BASE_URL = 'https://apps.bea.gov/api/data';

// ─── BLS ──────────────────────────────────────────────────────────────────────

/**
 * Fetch observations for a BLS time series.
 * Posts to the BLS API v2 endpoint requesting the current and prior calendar year.
 *
 * @param {string} seriesId  - BLS series identifier
 * @returns {Array<{ date: string, value: number }>} sorted newest-first, or null
 */
async function fetchBLSSeries(seriesId) {
  const apiKey = process.env.BLS_API_KEY;
  if (!apiKey) {
    console.warn('⚠️  BLS: BLS_API_KEY not configured');
    return null;
  }

  const currentYear = new Date().getFullYear();
  const startYear   = String(currentYear - 1);
  const endYear     = String(currentYear);

  try {
    const response = await axios.post(
      BLS_BASE_URL,
      {
        seriesid:  [seriesId],
        startyear: startYear,
        endyear:   endYear,
        registrationkey: apiKey,
      },
      {
        headers:  { 'Content-Type': 'application/json' },
        timeout:  15000,
      }
    );

    const series = response.data?.Results?.series?.[0];
    if (!series?.data?.length) {
      console.warn(`⚠️  BLS: no data returned for ${seriesId}`);
      return null;
    }

    // Convert BLS period labels (M01…M12) to YYYY-MM-DD, sort newest first
    const observations = series.data
      .filter(item => item.period !== 'M13') // M13 = annual average, skip it
      .map(item => {
        const month = item.period.replace('M', '').padStart(2, '0');
        return {
          date:  `${item.year}-${month}-01`,
          value: parseFloat(item.value),
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));

    console.log(`✓ BLS: fetched ${observations.length} observations for ${seriesId}`);
    return observations;

  } catch (err) {
    console.error(`❌ BLS: error fetching ${seriesId}: ${err.message}`);
    return null;
  }
}

// ─── BEA ──────────────────────────────────────────────────────────────────────

/**
 * Fetch the latest value from a BEA NIPA table.
 *
 * @param {string} tableName  - e.g. 'T10101'
 * @param {number} lineNumber - line within the table (1-based)
 * @returns {{ value: number, date: string }|null}
 */
async function fetchBEAData(tableName, lineNumber) {
  const apiKey = process.env.BEA_API_KEY;
  if (!apiKey) {
    console.warn('⚠️  BEA: BEA_API_KEY not configured');
    return null;
  }

  try {
    const response = await axios.get(BEA_BASE_URL, {
      params: {
        UserID:     apiKey,
        method:     'GetData',
        datasetname: 'NIPA',
        TableName:  tableName,
        Frequency:  'Q',
        Year:       'X', // X = all available years (BEA returns latest automatically)
        ResultFormat: 'JSON',
      },
      timeout: 15000,
    });

    const data = response.data?.BEAAPI?.Results?.Data;
    if (!Array.isArray(data) || data.length === 0) {
      console.warn(`⚠️  BEA: no data for table ${tableName}`);
      return null;
    }

    // Filter to the requested line and find the most recent non-empty period
    const lineData = data
      .filter(row => parseInt(row.LineNumber, 10) === lineNumber && row.DataValue !== '')
      .sort((a, b) => {
        // TimePeriod format: 2025Q4 — sort descending
        const toNum = s => {
          const [year, q] = s.split('Q');
          return parseInt(year, 10) * 10 + parseInt(q, 10);
        };
        return toNum(b.TimePeriod) - toNum(a.TimePeriod);
      });

    if (lineData.length === 0) {
      console.warn(`⚠️  BEA: no data for table ${tableName} line ${lineNumber}`);
      return null;
    }

    const latest = lineData[0];
    // Convert '2025Q4' → '2025-10-01' (first month of quarter)
    const [year, quarter] = latest.TimePeriod.split('Q');
    const month = String((parseInt(quarter, 10) - 1) * 3 + 1).padStart(2, '0');
    const date  = `${year}-${month}-01`;

    const value = parseFloat(latest.DataValue.replace(/,/g, ''));
    console.log(`✓ BEA: ${tableName} line ${lineNumber} → ${value} (${latest.TimePeriod})`);
    return { value, date };

  } catch (err) {
    console.error(`❌ BEA: error fetching ${tableName}: ${err.message}`);
    return null;
  }
}

// ─── Public fetch functions ───────────────────────────────────────────────────

/**
 * Non-Farm Payrolls (monthly change in thousands).
 * BLS series CES0000000001 reports the level; we return the most recent value.
 *
 * @returns {{ actual: number, date: string }|null}
 */
export async function fetchLatestNFP() {
  const data = await fetchBLSSeries('CES0000000001');
  if (!data) return null;

  const latest = data[0];
  const actual = latest.value;
  console.log(`📊 BLS NFP: ${actual}K (${latest.date})`);
  return { actual, date: latest.date };
}

/**
 * CPI All Urban Consumers (m/m % change).
 * Calculated as ((current - previous) / previous) * 100, rounded to 1 decimal.
 *
 * @returns {{ actual: number, date: string }|null}
 */
export async function fetchLatestCPI() {
  const data = await fetchBLSSeries('CUUR0000SA0');
  if (!data || data.length < 2) return null;

  const [current, previous] = data; // newest first
  const actual = parseFloat(((current.value - previous.value) / previous.value * 100).toFixed(1));
  console.log(`📊 BLS CPI m/m: ${actual}% (${current.date})`);
  return { actual, date: current.date };
}

/**
 * Core CPI (ex food & energy, m/m % change).
 * Same m/m calculation as CPI using series CUUR0000SA0L1E.
 *
 * @returns {{ actual: number, date: string }|null}
 */
export async function fetchLatestCoreCPI() {
  const data = await fetchBLSSeries('CUUR0000SA0L1E');
  if (!data || data.length < 2) return null;

  const [current, previous] = data;
  const actual = parseFloat(((current.value - previous.value) / previous.value * 100).toFixed(1));
  console.log(`📊 BLS Core CPI m/m: ${actual}% (${current.date})`);
  return { actual, date: current.date };
}

/**
 * Unemployment Rate (%).
 * BLS series LNS14000000 — returns the most recent value directly.
 *
 * @returns {{ actual: number, date: string }|null}
 */
export async function fetchLatestUnemployment() {
  const data = await fetchBLSSeries('LNS14000000');
  if (!data) return null;

  const latest = data[0];
  const actual = latest.value;
  console.log(`📊 BLS Unemployment: ${actual}% (${latest.date})`);
  return { actual, date: latest.date };
}

/**
 * Real GDP Growth Rate (q/q % change, SAAR).
 * BEA NIPA table T10101, line 1 — "Percent change from preceding period".
 *
 * @returns {{ actual: number, date: string }|null}
 */
export async function fetchLatestGDP() {
  const result = await fetchBEAData('T10101', 1);
  if (!result) return null;

  const actual = result.value;
  console.log(`📊 BEA GDP: ${actual}% (${result.date})`);
  return { actual, date: result.date };
}

/**
 * Core PCE Price Index (q/q % change).
 * BEA NIPA table T20804, line 12.
 *
 * @returns {{ actual: number, date: string }|null}
 */
export async function fetchLatestCorePCE() {
  const result = await fetchBEAData('T20804', 12);
  if (!result) return null;

  const actual = result.value;
  console.log(`📊 BEA Core PCE: ${actual}% (${result.date})`);
  return { actual, date: result.date };
}
