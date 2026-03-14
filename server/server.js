import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { request as httpRequest } from 'http';
import { request as httpsRequest } from 'https';
import { pipeline } from 'stream';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables FIRST before importing other modules
dotenv.config({ path: join(__dirname, '..', '.env') });

// Gemini call counter (incremented by every service that calls generateContent)
import { getGeminiCount } from './utils/geminiCounter.js';

// Now import modules that depend on environment variables
import newsRouter from './routes/news.js';
import dataRouter from './routes/data.js';
import calendarRouter from './routes/calendar.js';
import economicRouter from './routes/economic.js';
import authRouter from './routes/auth.js';
import finnhubRouter from './routes/finnhub.js';
import journalRouter from './routes/journal.js';
import checklistRouter from './routes/checklist.js';
import analysisRouter  from './routes/analysis.js';
import assistantRouter from './routes/assistant.js';
import { getDb } from './services/journalDb.js';
import { errorHandler } from './middleware/errorHandler.js';
import { getApiKeyManager } from './utils/apiKeyManager.js';
import { finnhubService, TRACKED_SYMBOLS } from './services/finnhubService.js';
import { startAutoReleaseScheduler, manualTrigger } from './services/autoReleaseService.js';
import adminRouter from './routes/admin.js';
import chartsRouter from './routes/charts.js';
import levelsRouter from './routes/levels.js';
import { requireAuth, checkScreenshotTries } from './middleware/authMiddleware.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const _ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://zynth.vercel.app',
];
const _VERCEL_ORIGIN = /^https:\/\/[^.]+\.vercel\.app$/;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || _ALLOWED_ORIGINS.includes(origin) || _VERCEL_ORIGIN.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Origin'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
}));
app.use(express.json({ limit: '5mb', strict: false }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running', geminiCallsToday: getGeminiCount() });
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

// ── Manual economic data release trigger (admin only) ────────────────────────
app.post('/api/economic/trigger-update', async (req, res) => {
  const secret = req.headers['x-admin-secret'];
  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { indicatorId } = req.body;
  if (!indicatorId || typeof indicatorId !== 'string') {
    return res.status(400).json({ error: 'indicatorId is required' });
  }

  try {
    const result = await manualTrigger(indicatorId, wss);
    if (!result.success) {
      return res.status(422).json(result);
    }
    return res.json(result);
  } catch (err) {
    console.error('trigger-update error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/finnhub', finnhubRouter);
app.use('/api/journal', journalRouter);
app.use('/api/checklist', checklistRouter);
app.use('/api/analysis',  analysisRouter);
app.use('/api/assistant', requireAuth, assistantRouter);
app.use('/api/charts', requireAuth, chartsRouter);
app.use('/api/levels', requireAuth, levelsRouter);

// ── /mt5 proxy → Python screenshot service ──────────────────────────────────
// In production set PYTHON_SERVICE_URL=https://ai-dashboard-python.onrender.com
// In dev it falls back to http://localhost:8000

// Auth guard — all MT5 endpoints require a valid JWT
app.use('/mt5', requireAuth);
// Screenshot OCR endpoint — also check per-plan try budget BEFORE proxying
app.post('/mt5/upload-trade-screenshot', checkScreenshotTries, (_req, _res, next) => next());

const _PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
const _pythonTarget = new URL(_PYTHON_SERVICE_URL);
const _pythonIsHttps = _pythonTarget.protocol === 'https:';

app.all('/mt5/*', (req, res) => {
  const targetPath = req.url.replace(/^\/mt5/, '') || '/';
  const options = {
    hostname: _pythonTarget.hostname,
    port: _pythonTarget.port || (_pythonIsHttps ? 443 : 80),
    path: targetPath,
    method: req.method,
    headers: { ...req.headers, host: _pythonTarget.host },
  };
  const requester = _pythonIsHttps ? httpsRequest : httpRequest;
  const proxy = requester(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    pipeline(proxyRes, res, () => {});
  });
  proxy.on('error', () => {
    if (!res.headersSent) {
      res.status(503).json({
        error: 'Screenshot analysis service unavailable',
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

// Ensure avatar upload directory exists on startup
mkdirSync(join(__dirname, 'uploads', 'avatars'), { recursive: true });

// Init journal DB on startup
try { getDb(); } catch (e) { console.error('Journal DB init error:', e.message); }

// Serve React frontend static build (production)
const clientBuildPath = join(__dirname, '..', 'client', 'dist');
import { existsSync, mkdirSync } from 'fs';
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

  // Helper — sends the full price snapshot to this browser client
  const sendSnapshot = () => {
    if (ws.readyState !== ws.OPEN) return;
    ws.send(JSON.stringify({
      type:    'snapshot',
      data:    finnhubService.getPriceSnapshot(),
      symbols: TRACKED_SYMBOLS,
      status:  finnhubService.getStatus(),
      ts:      Date.now(),
    }));
  };

  // 1. Decide when to send the initial snapshot to this browser client.
  //    Two deferred cases — checked in priority order:
  //
  //    a) Price cache is empty (seedFromRest not yet complete) →
  //       wait for the 'snapshot' event emitted at end of seedFromRest(),
  //       then send. This ensures the browser gets a fully-populated baseline.
  //
  //    b) Cache is seeded but no live WS tick has arrived yet →
  //       wait for the first 'price' event so the snapshot contains at least
  //       one real-time price before being delivered.
  //
  //    If neither condition applies (cache has data AND live ticks are flowing)
  //    send immediately.
  //
  //    In all deferred cases, a 'close' guard cleans up the one-time listener
  //    if the client disconnects before the trigger fires.

  const priceCache = finnhubService.getPriceSnapshot();
  const cacheEmpty = Object.keys(priceCache).length === 0;

  if (cacheEmpty) {
    // Case a: wait for REST seed to complete
    const onSeeded = () => {
      sendSnapshot();
    };
    finnhubService.once('snapshot', onSeeded);
    ws.once('close', () => finnhubService.off('snapshot', onSeeded));
  } else if (!finnhubService.hasLiveTick) {
    // Case b: cache seeded but no live tick yet — wait for first trade
    const onFirstTick = () => {
      sendSnapshot();
      finnhubService.off('price', onFirstTick);
    };
    finnhubService.once('price', onFirstTick);
    ws.once('close', () => finnhubService.off('price', onFirstTick));
  } else {
    // Normal path: cache populated + live ticks flowing — send immediately
    sendSnapshot();
  }

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
  console.log('Twelve Data key loaded:', !!process.env.TWELVE_DATA_API_KEY);

  if (process.env.FINNHUB_API_KEY) {
    // Seed REST prices and open WS AFTER server is ready — truly fire-and-forget
    // so the existing Yahoo/Polygon chart routes are never blocked by Finnhub init
    setTimeout(async () => {
      try {
        await finnhubService.seedFromRest();
        finnhubService.connect();
        finnhubService.startPolling();
        console.log('📈 Finnhub live market data service started');
        startAutoReleaseScheduler(wss);
      } catch (err) {
        console.warn('⚠️  Finnhub init error (non-fatal):', err.message);
      }
    }, 1000); // 1-second delay so server is fully ready before making outbound calls
  } else {
    console.warn('⚠️  FINNHUB_API_KEY not set — live market data disabled');
  }

  // ── Keep-alive: ping self + Python service every 4 min (Render free-tier) ──
  const SELF_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  if (process.env.RENDER_EXTERNAL_URL) {
    setInterval(async () => {
      try {
        const { default: axios } = await import('axios');
        await axios.get(`${SELF_URL}/api/health`, { timeout: 10000 });
        console.log('🏓 Keep-alive ping OK');
      } catch (_) { /* ignore */ }
      // Also keep the Python screenshot service alive
      if (process.env.PYTHON_SERVICE_URL) {
        try {
          const { default: axios } = await import('axios');
          await axios.get(`${process.env.PYTHON_SERVICE_URL}/health`, { timeout: 10000 });
          console.log('🏓 Python service ping OK');
        } catch (_) { /* ignore */ }
      }
    }, 4 * 60 * 1000); // every 4 minutes
  }

  // ── Daily macro snapshot ───────────────────────────────────────────────────────────
  setInterval(async () => {
    try {
      const { calculateMacroSurpriseScore } = await import('./services/economicIntelligenceService.js');
      const { insertMacroSnapshot }         = await import('./services/journalDb.js');
      const result = await calculateMacroSurpriseScore();
      if (result?.score !== undefined) {
        const date = new Date().toISOString().slice(0, 10);
        try { insertMacroSnapshot({ score: result.score, label: result.label ?? 'Unknown', date }); } catch {}
        console.log(`📊 Macro snapshot saved: ${date} score=${result.score}`);
      }
    } catch (err) { console.error('⚠️  Macro snapshot error:', err.message); }
  }, 24 * 60 * 60 * 1000);
});

