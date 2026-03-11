# API Key Rotation System

## Overview
This application includes a professional API key rotation and fallback system that automatically switches between multiple API keys when rate limits are hit, ensuring uninterrupted service.

## Features

✅ **Automatic Failover**: When one API key hits its rate limit, the system automatically switches to the next available key
✅ **Smart Recovery**: Keys are automatically re-enabled after a 5-minute cooldown period  
✅ **Request Tracking**: Monitors success rates, fail counts, and total requests for each key
✅ **Multiple Provider Support**: Add as many API keys as you want for maximum redundancy
✅ **Transparent Operation**: Logs all key rotations and status changes for monitoring

## Setup

### Adding Multiple API Keys

1. Open your `.env` file
2. Add additional API keys using the format below:

```env
# Primary key (required)
POLYGON_API_KEY=your_first_key_here

# Additional keys (optional, for failover)
POLYGON_API_KEY_2=your_second_key_here
POLYGON_API_KEY_3=your_third_key_here
# Add more as needed...
```

### Getting More API Keys

You can get free API keys from:
- **Polygon.io**: https://polygon.io (5 API calls/minute on free tier)
- Create multiple free accounts if needed
- Contact them for higher tier plans with more requests

## How It Works

1. **Initial Request**: System uses the first available API key
2. **Rate Limit Detected**: If a 429 (Too Many Requests) or 403 error occurs:
   - Current key is marked as unavailable
   - System automatically rotates to the next key
   - Request is retried with new key (up to 3 attempts)
3. **Cooldown**: After 5 minutes, unavailable keys are automatically re-enabled
4. **Continuous Operation**: System cycles through all keys, maximizing your API quota

## Monitoring

### View API Key Statistics

Check the status of all your API keys:

```bash
# From your browser or terminal
curl http://localhost:5000/api/key-stats
```

Response example:
```json
{
  "totalKeys": 2,
  "stats": [
    {
      "index": 1,
      "key": "paVf...GjRm",
      "available": true,
      "failCount": 0,
      "totalRequests": 142,
      "successfulRequests": 142,
      "successRate": "100.0%",
      "lastFail": "Never"
    },
    {
      "index": 2,
      "key": "xYz1...Ab2c",
      "available": true,
      "failCount": 1,
      "totalRequests": 85,
      "successfulRequests": 84,
      "successRate": "98.8%",
      "lastFail": "2026-03-07T16:45:23.000Z"
    }
  ]
}
```

### Console Logs

The system logs all key rotation events:

```
🔑 API Key Manager initialized with 3 keys
✅ Fetched 45 relevant articles
⚠️  Rate limit hit with key #1, rotating...
🔄 Rotating from Key #1 to Key #2
✅ API Key #1 cooldown expired, marking as available
```

## Error Detection

The system detects rate limits through:
- **HTTP Status Codes**: 429 (Too Many Requests), 403 (Forbidden)
- **Error Messages**: Keywords like "rate limit", "quota exceeded", "limit exceeded"

## Benefits

### For Free Tier Users
- Combine multiple free API keys for higher effective rate limit
- Example: 2 keys = 10 calls/min instead of 5 calls/min

### For Production
- Redundancy if one key fails or expires
- Load distribution across multiple keys
- Zero downtime during API issues

## Configuration

The rotation system is automatically active. No configuration needed beyond adding keys to `.env`.

### Advanced Settings

Edit `server/utils/apiKeyManager.js` to customize:
- **Cooldown Period**: Default 5 minutes (`COOLDOWN_MS`)
- **Max Retries**: Default 3 attempts per request (`maxRetries`)
- **Key Selection**: Currently uses round-robin, can be changed to random/least-used

## Troubleshooting

### "All API keys exhausted"
- All keys are rate limited simultaneously
- Wait 5 minutes for cooldown
- Add more API keys to `.env`

### Keys not rotating
- Check console logs for errors
- Verify `.env` file format (no spaces around `=`)
- Restart server after adding new keys

## Technical Details

**Files Involved:**
- `server/utils/apiKeyManager.js` - Core rotation logic
- `server/services/polygonService.js` - News API with failover
- `server/services/dataService.js` - Market data API with failover
- `server/server.js` - Stats endpoint

**Dependencies:**
- None! Uses only Node.js built-in features for tracking and rotation
