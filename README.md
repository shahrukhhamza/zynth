# 📊 Financial News Dashboard

A professional-grade financial news dashboard built to resemble institutional trading terminals like Bloomberg. Features real-time news from Polygon.io (Massive.com) with focus on gold, commodities, and macroeconomic indicators.

![Dashboard Preview](https://img.shields.io/badge/Status-Production%20Ready-success)
![Tech Stack](https://img.shields.io/badge/Stack-React%20%2B%20Node.js-blue)

## ✨ Features

### 🔴 Real-Time News Feed
- Fetches latest financial news from Polygon.io API
- Auto-refresh every 30 seconds
- Filtered for gold, inflation, interest rates, and macro-economic topics
- Professional card-based layout with images

### 📊 Market Sentiment Analysis
- Automatic sentiment classification (Bullish/Bearish/Neutral)
- Real-time sentiment statistics
- Visual indicators for market mood

### 🚨 High Impact Alerts
- Highlights critical news events
- Impact level classification (High/Medium/Low)
- Dedicated alerts panel

### 🔍 Advanced Filtering
- Keyword search
- Date range filtering
- Impact level filtering
- Quick filter tags for common topics

### 🎨 Professional UI
- Dark theme inspired by Bloomberg Terminal
- Clean, modern design with TailwindCSS
- Responsive layout
- Loading skeletons for smooth UX

## 🏗️ Tech Stack

### Frontend
- **React.js** - UI framework
- **TailwindCSS** - Styling
- **Vite** - Build tool
- **Axios** - HTTP client
- **date-fns** - Date formatting
- **lucide-react** - Icons

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **Polygon.io API** - Financial news data
- **node-cache** - Response caching
- **CORS** - Cross-origin support

## 📁 Project Structure

```
financial-news-dashboard/
├── client/                   # React frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── NewsFeed.jsx
│   │   │   ├── RightPanel.jsx
│   │   │   ├── NewsCard.jsx
│   │   │   └── LoadingSkeleton.jsx
│   │   ├── services/
│   │   │   └── api.js        # API integration
│   │   ├── App.jsx           # Main app component
│   │   ├── main.jsx          # Entry point
│   │   └── index.css         # Global styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── server/                   # Node.js backend
│   ├── routes/
│   │   └── news.js           # News API routes
│   ├── services/
│   │   └── polygonService.js # Polygon.io integration
│   ├── middleware/
│   │   └── errorHandler.js   # Error handling
│   ├── server.js             # Express server
│   └── package.json
├── .env.example              # Environment variables template
├── .gitignore
├── package.json              # Root package
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Polygon.io API Key** (Get one at https://polygon.io/)

### Installation

1. **Clone or navigate to the project directory**
   ```powershell
   cd "d:\US DATA"
   ```

2. **Install all dependencies (root, server, and client)**
   ```powershell
   npm run install-all
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```powershell
   Copy-Item .env.example .env
   ```

   Edit the `.env` file and add your Polygon.io API key:
   ```env
   POLYGON_API_KEY=your_actual_api_key_here
   PORT=5000
   CLIENT_URL=http://localhost:5173
   ```

### Running the Application

#### Option 1: Run Both (Recommended)
```powershell
npm run dev
```
This starts both the backend server (port 5000) and frontend dev server (port 5173).

#### Option 2: Run Separately

**Terminal 1 - Backend:**
```powershell
npm run server
```

**Terminal 2 - Frontend:**
```powershell
npm run client
```

### Access the Dashboard

Open your browser and navigate to:
```
http://localhost:5173
```

The API will be running on:
```
http://localhost:5000
```

## 📡 API Endpoints

### Health Check
```
GET /api/health
```
Returns server status.

### Get News
```
GET /api/news
```

**Query Parameters:**
- `keyword` (optional) - Filter by keyword
- `startDate` (optional) - Start date (ISO format)
- `endDate` (optional) - End date (ISO format)
- `limit` (optional) - Number of articles (default: 50)

**Example:**
```
GET /api/news?keyword=gold&limit=20
```

### Get News by ID
```
GET /api/news/:id
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `POLYGON_API_KEY` | Your Polygon.io API key | Required |
| `PORT` | Backend server port | 5000 |
| `CLIENT_URL` | Frontend URL for CORS | http://localhost:5173 |

### Filtering Keywords

The dashboard automatically filters news for these topics:
- Gold, XAUUSD, precious metals
- Inflation, interest rates, Federal Reserve
- USD, dollar, treasury, bonds
- Geopolitics, war, conflict, sanctions
- Central bank, monetary policy, recession
- Economic data (CPI, PPI, GDP)

Edit `server/services/polygonService.js` to customize keywords.

## 🎯 Features Breakdown

### Sentiment Analysis
The system analyzes news headlines and descriptions using keyword matching:
- **Bullish**: surge, rally, soar, gain, inflation surge, rate hike, weak dollar
- **Bearish**: fall, drop, decline, weak, strong dollar, rate cut
- **Neutral**: No strong indicators

### Impact Classification
- **High**: Federal Reserve, interest rates, inflation, CPI, GDP, war, crisis
- **Medium**: Single high-impact term
- **Low**: General news

## 🛠️ Development

### Backend Development
```powershell
cd server
npm run dev
```
Uses nodemon for auto-restart on file changes.

### Frontend Development
```powershell
cd client
npm run dev
```
Vite provides hot module replacement (HMR).

### Building for Production
```powershell
npm run build
```
Builds the frontend to `client/dist/`.

## 📦 Deployment

### Backend
1. Set environment variables on your hosting platform
2. Install dependencies: `npm install --production`
3. Start server: `npm start`

### Frontend
1. Build: `npm run build`
2. Serve `client/dist/` with any static hosting service

## 🔐 Security

- ✅ API keys stored in `.env` (never committed)
- ✅ CORS configured for specific origins
- ✅ No sensitive data exposed to frontend
- ✅ Environment variables isolated from client

## 🐛 Troubleshooting

### Issue: "Failed to fetch news"
**Solution**: Check your Polygon.io API key in `.env` file.

### Issue: CORS errors
**Solution**: Ensure `CLIENT_URL` in `.env` matches your frontend URL.

### Issue: Port already in use
**Solution**: Change `PORT` in `.env` or kill the process using the port.

### Issue: No news showing
**Solution**: 
1. Verify API key is valid
2. Check server logs for errors
3. Ensure you have internet connectivity

## 📝 API Key Setup

1. Go to https://polygon.io/
2. Sign up for a free account
3. Navigate to Dashboard → API Keys
4. Copy your API key
5. Paste it in `.env` file

**Free tier limitations**: 5 API calls per minute. The app caches responses for 30 seconds to stay within limits.

## 🎨 Customization

### Change Theme Colors
Edit `client/tailwind.config.js`:
```javascript
colors: {
  terminal: {
    bg: '#0a0e27',      // Main background
    surface: '#131829',  // Card background
    accent: '#3b82f6',   // Accent color
    // ... more colors
  }
}
```

### Adjust Auto-Refresh Interval
Edit `client/src/App.jsx`:
```javascript
// Change 30000 (30 seconds) to desired milliseconds
const interval = setInterval(() => {
  loadNews(false);
}, 30000);
```

### Modify News Filters
Edit `server/services/polygonService.js` to add/remove keywords.

## 📊 Sample Data Structure

### News Article Object
```javascript
{
  id: "article_123",
  title: "Gold Prices Surge on Inflation Fears",
  author: "John Doe",
  source: "Reuters",
  publishedAt: "2026-03-07T10:30:00Z",
  url: "https://...",
  imageUrl: "https://...",
  description: "Article description...",
  keywords: ["gold", "inflation"],
  sentiment: "Bullish",
  impactLevel: "High",
  ticker: ["GC=F", "XAUUSD"]
}
```

## 🤝 Contributing

This is a production-ready application. To extend:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use for personal or commercial projects.

## 🙏 Credits

- **Polygon.io** - Financial data API
- **Lucide** - Icon library
- **TailwindCSS** - Styling framework

## 📞 Support

For issues or questions:
1. Check the Troubleshooting section
2. Review Polygon.io API documentation
3. Check browser console for errors

---

**Built with ☕ for traders and financial analysts**

**Last Updated**: March 7, 2026
