import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { request as httpRequest } from 'http';
import { pipeline } from 'stream';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables FIRST before importing other modules
dotenv.config({ path: join(__dirname, '..', '.env') });

// Now import modules that depend on environment variables
import newsRouter from './routes/news.js';
import dataRouter from './routes/data.js';
import calendarRouter from './routes/calendar.js';
import economicRouter from './routes/economic.js';
import authRouter from './routes/auth.js';
import finnhubRouter from './routes/finnhub.js';
import journalRouter from './routes/journal.js';
import { getDb } from './services/journalDb.js';
import { errorHandler } from './middleware/errorHandler.js';
import { getApiKeyManager } from './utils/apiKeyManager.js';
import { finnhubService, TRACKED_SYMBOLS } from './services/finnhubService.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// API Key Stats endpoint
app.get('/api/key-stats', (req, res) => {
  try {
    const keyManager = getApiKeyManager();
    const stats = keyManager.getStats();
    res.json({
      totalKeys: stats.length,
      stats: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch key stats' });
  }
});

app.use('/api/news', newsRouter);
app.use('/api/data', dataRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/economic', economicRouter);
app.use('/api/auth', authRouter);
app.use('/api/finnhub', finnhubRouter);
app.use('/api/journal', journalRouter);

// ── /mt5 proxy → Python screenshot service on port 8000 ─────────────────────
// Strips /mt5 prefix and forwards to http://localhost:8000
app.all('/mt5/*', (req, res) => {
  const targetPath = req.url.replace(/^\/mt5/, '') || '/';
  const options = {
    hostname: '127.0.0.1',
    port: 8000,
    path: targetPath,
    method: req.method,
    headers: { ...req.headers, host: '127.0.0.1:8000' },
  };
  const proxy = httpRequest(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    pipeline(proxyRes, res, () => {});
  });
  proxy.on('error', () => {
    if (!res.headersSent) {
      res.status(503).json({
        error: 'Screenshot analysis service unavailable',
        detail: 'The Python MT5 service is not running on port 8000. Please start it with: cd mt5_service && python main.py',
      });
    }
  });
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    pipeline(req, proxy, () => {});
  } else {
    proxy.end();
  }
});

// Serve screenshot uploads
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Init journal DB on startup
try { getDb(); } catch (e) { console.error('Journal DB init error:', e.message); }

// Serve React frontend static build (production)
const clientBuildPath = join(__dirname, '..', 'client', 'dist');
import { existsSync } from 'fs';
if (existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  // For React Router — send index.html for any non-API route
  app.get('*', (req, res) => {
    res.sendFile(join(clientBuildPath, 'index.html'));
  });
  console.log('✅ Serving built React frontend from client/dist');
} else {
  console.log('⚠️  No client/dist found. Run: cd client && npm run build');
}

// Error handling
app.use(errorHandler);

// ── HTTP server + WebSocket server ──────────────────────────────────────────
const httpServer = createServer(app);

// WebSocket server bound to /ws/market — broadcasts Finnhub price ticks
const wss = new WebSocketServer({ server: httpServer, path: '/ws/market' });

// !! Must handle errors on both httpServer AND wss or Node will throw uncaught
httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use.`);
    console.error(`   Run: Get-NetTCPConnection -LocalPort ${PORT} | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }`);
  } else {
    console.error('❌ HTTP server error:', err.message);
  }
  process.exit(1);
});

wss.on('error', (err) => {
  // ws forwards underlying server errors — log but don't double-exit
  console.error('❌ WebSocketServer error:', err.message);
});

wss.on('connection', (ws) => {
  console.log(`📡 Market WS client connected (total: ${wss.clients.size})`);

  // 1. Send full price snapshot immediately so the client has initial data
  ws.send(JSON.stringify({
    type:    'snapshot',
    data:    finnhubService.getPriceSnapshot(),
    symbols: TRACKED_SYMBOLS,
    status:  finnhubService.getStatus(),
    ts:      Date.now(),
  }));

  // 2. Forward every live price tick to this client
  const onPrice = (update) => {
    if (ws.readyState === ws.OPEN)
      ws.send(JSON.stringify({ type: 'price', data: update, ts: Date.now() }));
  };

  // 3. Forward connection-status changes (reconnecting, etc.)
  const onStatus = (status) => {
    if (ws.readyState === ws.OPEN)
      ws.send(JSON.stringify({ type: 'status', status, ts: Date.now() }));
  };

  finnhubService.on('price',  onPrice);
  finnhubService.on('status', onStatus);

  ws.on('close', () => {
    finnhubService.off('price',  onPrice);
    finnhubService.off('status', onStatus);
    console.log(`📡 Market WS client disconnected (total: ${wss.clients.size})`);
  });

  ws.on('error', (err) => console.error('WS client error:', err.message));
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Financial News Dashboard API`);
  console.log(`🔑 Polygon API Key: ${process.env.POLYGON_API_KEY ? 'Yes' : 'No'}`);

  if (process.env.FINNHUB_API_KEY) {
    // Seed REST prices and open WS AFTER server is ready — truly fire-and-forget
    // so the existing Yahoo/Polygon chart routes are never blocked by Finnhub init
    setTimeout(async () => {
      try {
        await finnhubService.seedFromRest();
        finnhubService.connect();
        console.log('📈 Finnhub live market data service started');
      } catch (err) {
        console.warn('⚠️  Finnhub init error (non-fatal):', err.message);
      }
    }, 1000); // 1-second delay so server is fully ready before making outbound calls
  } else {
    console.warn('⚠️  FINNHUB_API_KEY not set — live market data disabled');
  }
});

