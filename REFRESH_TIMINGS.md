# Auto-Refresh Configuration

## Current Auto-Refresh Timings (Optimized for Real-Time Updates)

### Frontend Refresh Intervals

| Component | Refresh Rate | Status | Notes |
|-----------|--------------|--------|-------|
| **News Feed** | 30 seconds | ✅ Enabled | Only when viewing news tab |
| **Economic Dashboard** | 2 minutes | ✅ Enabled | Continuously when viewing data/calendar |
| **Economic Calendar** | 2 minutes | ✅ Auto | Updates with dashboard |

### Backend Cache TTL (Time-To-Live)

| Service | Cache Duration | Purpose |
|---------|----------------|---------|
| **News** | 30 seconds | Reduces API calls, allows fresh news every 30s |
| **Economic Calendar** | 2 minutes | Balance between freshness and API limits |
| **API Data Service** | 5 minutes | FRED/Alpha Vantage have daily data, no need for frequent calls |
| **Gemini Analysis** | 1 hour | AI insights don't change frequently |

---

## How It Works

### News Updates Flow

```
New Article Published on Source
         ↓
Polygon.io API picks it up (within seconds)
         ↓
Your dashboard fetches every 30 seconds
         ↓
Server cache expires after 30 seconds
         ↓
Fresh API call fetches latest news
         ↓
User sees new article within 30-60 seconds
```

**Maximum Delay:** 60 seconds (30s cache + 30s refresh interval)

### Economic Data Updates Flow

```
BLS Releases NFP Data (e.g., March 6, 2026 at 8:30 AM)
         ↓
(Currently) Manual update in economicData.js required
         ↓
OR (if APIs enabled): FRED updates within hours
         ↓
Dashboard fetches every 2 minutes
         ↓
Server cache expires after 2 minutes
         ↓
User sees updated data within 2-4 minutes
```

**Maximum Delay:** 4 minutes (2min cache + 2min refresh interval)

---

## User Controls

### Auto-Refresh Toggle

Location: **Header** (top-right, next to refresh button)

- Toggle ON (green): News refreshes automatically every 30 seconds
- Toggle OFF (gray): No automatic refresh, manual refresh only

### Manual Refresh Button

Location: **Header** (refresh icon)

- Bypasses cache
- Forces immediate data fetch
- Useful when expecting urgent updates

---

## Adjusting Refresh Rates

### To Make Updates Faster

```javascript
// In EconomicDashboard.jsx
const interval = setInterval(() => {
  loadAllData();
}, 60000); // Change to 1 minute (60000ms)
```

```javascript
// In economicCalendarService.js
const cache = new NodeCache({ stdTTL: 60 }); // Change to 1 minute
```

**Trade-off:** Faster updates = more API calls = higher cost/rate limits

### To Make Updates Slower (Reduce API Usage)

```javascript
// In App.jsx
const interval = setInterval(() => {
  loadNews(false);
}, 60000); // Change to 1 minute (from 30s)
```

```javascript
// In polygonService.js
const cache = new NodeCache({ stdTTL: 120 }); // Change to 2 minutes
```

**Trade-off:** Slower updates = less fresh data, but reduced API costs

---

## Recommended Settings by Use Case

### Day Trading (Maximum Freshness)

```javascript
News: 15 seconds refresh, 15s cache
Economic Data: 1 minute refresh, 1min cache
API Data: 2 minutes refresh, 2min cache
```

**Cost:** High API usage, may hit rate limits

### Swing Trading / Analysis (Balanced)

```javascript
News: 30 seconds refresh, 30s cache (CURRENT)
Economic Data: 2 minutes refresh, 2min cache (CURRENT)
API Data: 5 minutes refresh, 5min cache (CURRENT)
```

**Cost:** Moderate API usage, good balance ✅

### Research / Long-term (Conservative)

```javascript
News: 2 minutes refresh, 5min cache
Economic Data: 10 minutes refresh, 10min cache
API Data: 1 hour refresh, 1hr cache
```

**Cost:** Minimal API usage, older data

---

## API Rate Limits

### Polygon.io (News)

- **Free Tier:** 5 requests/minute
- **Cache:** 30 seconds = Max 2 requests/minute
- **Status:** ✅ Within limits

### FRED API (Economic Data)

- **Free Tier:** Unlimited requests
- **No authentication required for public data**
- **Status:** ✅ No concerns

### Alpha Vantage

- **Free Tier:** 5 requests/minute, 500/day
- **Cache:** 5 minutes = Max ~12 requests/hour
- **Status:** ✅ Within limits

### Gemini AI (Analysis)

- **Free Tier:** 60 requests/minute
- **Cache:** 1 hour for insights (rarely called)
- **Status:** ✅ Within limits

---

## Monitoring Dashboard Health

### Check if Auto-Refresh is Working

1. Open **Browser Console** (F12)
2. Watch for API calls every 30s/2min
3. Look for logs: `"✓ Data refreshed at [timestamp]"`

### Signs Auto-Refresh is NOT Working

- No new news appearing after several minutes
- Timestamp not updating
- Console shows errors: `ERR_CONNECTION_REFUSED`

### Troubleshooting

```bash
# Check if backend is running
curl http://localhost:5000/api/news

# Check cache status (in server logs)
"✓ Returning cached calendar data" = using cache
"📊 Fetching REAL data from APIs" = fresh API call
```

---

## Future Enhancements

### WebSocket Implementation (Real-Time)

Instead of polling every 30 seconds, use WebSockets:

```javascript
// Server pushes updates instantly
io.on('connection', (socket) => {
  socket.on('subscribe:news', () => {
    // Send news as soon as available
  });
});
```

**Benefits:**
- Instant updates (0 delay)
- Reduced server load
- More efficient

**Complexity:** Higher implementation complexity

### Server-Sent Events (SSE)

Simpler than WebSockets, one-way server→client:

```javascript
// Client
const eventSource = new EventSource('/api/news/stream');
eventSource.onmessage = (event) => {
  const news = JSON.parse(event.data);
  updateDashboard(news);
};
```

**Benefits:**
- Simpler than WebSockets
- Automatic reconnection
- HTTP-based

---

## Current Configuration Summary

✅ **News:** Auto-refreshes every 30 seconds (when viewing news)  
✅ **Economic Data:** Auto-refreshes every 2 minutes  
✅ **Manual Refresh:** Available via button in header  
✅ **Cache Optimization:** Balanced for freshness + API limits  
✅ **Toggle Control:** User can disable auto-refresh

**Result:** Your dashboard will show new news within 30-60 seconds and economic data updates within 2-4 minutes! 🎯
