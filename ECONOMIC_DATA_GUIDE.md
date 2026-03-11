# How to Update Economic Calendar Data

This guide explains how to update economic calendar data to match values from Forex Factory or other sources.

## Quick Start

1. **Enable Real Data Mode**
   - Open `.env` file in the root directory
   - Set `USE_REAL_ECONOMIC_DATA=true`

2. **Update Economic Values**
   - Open `server/config/economicData.js`
   - Update the values for each indicator

3. **Restart the Server**
   - The server will now use your configured values instead of mock data

## Updating Values from Forex Factory

### Step 1: Get Data from Forex Factory
1. Go to https://www.forexfactory.com/calendar
2. Find the economic indicator you want to update (e.g., Non-Farm Payrolls)
3. Note down:
   - **Actual** value (what actually happened)
   - **Forecast** value (what was predicted)
   - **Previous** value (previous month's actual)
   - **Date** of release

### Step 2: Update economicData.js

Open `server/config/economicData.js` and update the values:

```javascript
{
  id: 'nfp',
  name: 'Non-Farm Employment Change',
  current: 259,    // ← Update this to Forex Factory's "Actual"
  forecast: 143,   // ← Update this to Forex Factory's "Forecast"
  previous: 210,   // ← Update this to Forex Factory's "Previous"
  date: '2026-02-07', // ← Update to release date
  // ... other fields
  historicalData: [
    // Add historical months from Forex Factory
    { date: '2026-02-07', actual: 259, forecast: 143, previous: 210 },
    { date: '2026-01-10', actual: 210, forecast: 180, previous: 227 },
    // ... add more
  ]
}
```

### Step 3: Save and Restart

1. Save the `economicData.js` file
2. Restart your backend server
3. Refresh your browser - the new values will appear

## Example: Updating NFP Data

If Forex Factory shows:
- **Date:** February 7, 2026
- **Actual:** 259K
- **Forecast:** 143K  
- **Previous:** 210K

Update your config:
```javascript
{
  id: 'nfp',
  name: 'Non-Farm Employment Change',
  current: 259,
  forecast: 143,
  previous: 210,
  date: '2026-02-07',
  // ... rest of config
}
```

## Available Indicators

The following indicators are configured by default:
1. **Non-Farm Employment Change (NFP)** - Jobs report
2. **Consumer Price Index (CPI)** - Inflation measure
3. **Retail Sales** - Consumer spending
4. **GDP Growth Rate** - Economic growth
5. **Unemployment Rate** - Job market health
6. **Interest Rate** - Federal funds rate
7. **Producer Price Index (PPI)** - Wholesale inflation
8. **Average Hourly Earnings** - Wage growth

## Timezone Settings

- The date you enter should be in **YYYY-MM-DD** format
- Times are in **Eastern Time (ET)** by default
- Users can switch timezone display in the app using the Globe icon in the header

## Troubleshooting

**Values not updating?**
- Make sure `USE_REAL_ECONOMIC_DATA=true` in `.env`
- Restart the backend server
- Clear browser cache or do a hard refresh (Ctrl+Shift+R)

**Date showing wrong timezone?**
- News and calendar dates respect the user's selected timezone
- Click the Globe icon in header and select your timezone (e.g., Pakistan Time)

**Want to add more indicators?**
- Copy an existing indicator structure in `economicData.js`
- Add your custom indicator with appropriate values
- Follow the same format for consistency

## Need Help?

The data structure in `economicData.js` is self-explanatory. Each indicator needs:
- Basic info (id, name, currency, impact)
- Current values (current, forecast, previous)
- Metadata (source, description, frequency)
- Historical data array for charts

Compare with Forex Factory's calendar values and update accordingly!
