# 🚀 Quick Start Guide

Get your Financial News Dashboard running in 5 minutes!

## Step 1: Get Your API Key

1. Visit https://polygon.io/
2. Click "Sign Up" (Free tier available)
3. Verify your email
4. Go to Dashboard → API Keys
5. Copy your API key

## Step 2: Configure API Key

Open the `.env` file in the root directory and replace `YOUR_API_KEY_HERE` with your actual API key:

```env
POLYGON_API_KEY=your_actual_polygon_api_key_here
PORT=5000
CLIENT_URL=http://localhost:5173
```

## Step 3: Install Dependencies

Open PowerShell in the project directory and run:

```powershell
npm run install-all
```

This will install all dependencies for both frontend and backend.

⏱️ This may take 2-3 minutes.

## Step 4: Start the Dashboard

Run both frontend and backend together:

```powershell
npm run dev
```

You should see:
```
🚀 Server running on port 5000
📊 Financial News Dashboard API
🔑 API Key configured: Yes

VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

## Step 5: Open Dashboard

Open your browser and go to:
```
http://localhost:5173
```

🎉 You should now see the Financial News Dashboard!

## Verify It's Working

You should see:
- ✅ Real-time news articles loading
- ✅ Sentiment indicators (Bullish/Bearish/Neutral)
- ✅ High impact alerts on the right panel
- ✅ Filters working in the left sidebar

## Common Issues

### "Failed to fetch news" Error
❌ **Problem**: Invalid or missing API key  
✅ **Solution**: Double-check your API key in `.env` file

### Port 5000 Already in Use
❌ **Problem**: Another service is using port 5000  
✅ **Solution**: Change `PORT=5001` in `.env` file

### Dependencies Won't Install
❌ **Problem**: Network issues or permissions  
✅ **Solution**: Try running PowerShell as Administrator

## Next Steps

### Try These Features:

1. **Search**: Type "gold" in the keyword filter and click "Apply Filters"
2. **Auto-refresh**: Watch the news update automatically every 30 seconds
3. **Quick Filters**: Click on quick filter tags like "Inflation" or "Fed"
4. **Date Range**: Filter news by specific dates
5. **Impact Level**: Filter by High, Medium, or Low impact

### Customize:

- Edit keywords in `server/services/polygonService.js`
- Change theme colors in `client/tailwind.config.js`
- Adjust auto-refresh interval in `client/src/App.jsx`

## Development Mode

Want to develop/customize?

**Backend Only:**
```powershell
npm run server
```

**Frontend Only:**
```powershell
npm run client
```

## Production Build

Ready to deploy?

```powershell
npm run build
```

This creates optimized production files in `client/dist/`

## Need Help?

1. Check the full **README.md** for detailed documentation
2. Verify your Polygon.io API quota (free tier = 5 calls/min)
3. Check browser console (F12) for error messages
4. Review server logs in the terminal

---

**Enjoy your professional trading terminal! 📊✨**
