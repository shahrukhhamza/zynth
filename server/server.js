import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { request as httpRequest } from 'http';
import { request as httpsRequest } from 'https';
import { pipeline } from 'stream';
import { createHash } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables FIRST before importing other modules
dotenv.config({ path: join(__dirname, '..', '.env') });

// Gemini call counter
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
import { initJournalDb, insertMacroSnapshot } from './services/journalDb.js';
import { errorHandler } from './middleware/errorHandler.js';
import { getApiKeyManager } from './utils/apiKeyManager.js';
import { finnhubService, TRACKED_SYMBOLS } from './services/finnhubService.js';
import { startAutoReleaseScheduler, manualTrigger } from './services/autoReleaseService.js';
import adminRouter from './routes/admin.js';
import chartsRouter from './routes/charts.js';
import levelsRouter from './routes/levels.js';
import { requireAuth, checkScreenshotTries } from './middleware/authMiddleware.js';
import * as Users from './db/users.js';
import { incrementScreenshotTries, initDb } from './db/users.js';
import accountsRouter from './routes/accounts.js';
import webhookMetaApiRouter from './routes/webhookMetaApi.js';
import syncRouter from './routes/sync.js';
import { UPLOADS_DIR, ensureUploadDirs } from './config/storagePaths.js';

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const isPreflightRequest = (req) => req.method === 'OPTIONS';

const getForwardedIp = (req) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim();
  }

  return req.ip || req.socket?.remoteAddress || 'unknown';
};

const getRateLimitKey = (req) => {
  const auth = req.headers.authorization;
  if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
    const token = auth.slice(7);
    const tokenHash = createHash('sha256').update(token).digest('hex').slice(0, 24);
    return `token:${tokenHash}`;
  }

  const origin = typeof req.headers.origin === 'string' && req.headers.origin.trim()
    ? req.headers.origin.trim()
    : 'no-origin';
  return `ip:${getForwardedIp(req)}|origin:${origin}`;
};

const skipGlobalRateLimit = (req) => {
  if (isPreflightRequest(req)) return true;
  return req.path === '/health' || req.path === '/public-stats' || req.path === '/auth/me';
};

const skipAuthAttemptRateLimit = (req) => {
  if (isPreflightRequest(req)) return true;
  return req.path === '/me';
};

// Railway sits behind a reverse proxy/CDN. Trust the forwarded client IP headers
// so express-rate-limit and other middleware can identify the real client.
app.set('trust proxy', 1);

// ── Rate limiters ─────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  keyGenerator: getRateLimitKey,
  skip: skipGlobalRateLimit,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again later.' },
  keyGenerator: getRateLimitKey,
  skip: skipAuthAttemptRateLimit,
});

const authSessionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 180,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many session validation requests, please try again later.' },
  keyGenerator: getRateLimitKey,
  skip: isPreflightRequest,
});

const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI request limit reached, please try again in an hour.' },
  keyGenerator: getRateLimitKey,
});

// ── CORS ──────────────────────────────────────────────────────────────────────
const _normalizeOrigin = (value) => {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const _allowedOriginsFromEnv = [
  process.env.CLIENT_URL,
  process.env.CLIENT_ORIGIN,
  process.env.FRONTEND_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
].map(_normalizeOrigin).filter(Boolean);

const _ALLOWED_ORIGINS = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://zynth.vercel.app',
  ..._allowedOriginsFromEnv,
]);

const _isAllowedVercelPreview = (origin) => {
  try {
    const { protocol, hostname } = new URL(origin);
    return protocol === 'https:' && hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
};

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser clients and server-to-server requests.
    if (!origin) return callback(null, true);

    const normalized = _normalizeOrigin(origin);
    if (normalized && (_ALLOWED_ORIGINS.has(normalized) || _isAllowedVercelPreview(normalized))) {
      return callback(null, true);
    }

    console.warn(`CORS blocked origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use('/api', globalLimiter);
app.use('/api/auth/me', authSessionLimiter);

app.use(express.json({ limit: '10mb', strict: false }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitize());

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running', geminiCallsToday: getGeminiCount() });
});

app.get('/api/public-stats', async (req, res) => {
  try {
    const all = await Users.findAll();
    res.json({ totalUsers: all.length });
  } catch (_) {
    res.json({ totalUsers: 0 });
  }
});

app.get('/api/key-stats', (req, res) => {
  try {
    const keyManager = getApiKeyManager();
    const stats = keyManager.getStats();
    res.json({ totalKeys: stats.length, stats, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch key stats' });
  }
});

app.use('/api/news', newsRouter);
app.use('/api/data', dataRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/economic', economicRouter);

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
    if (!result.success) return res.status(422).json(result);
    return res.json(result);
  } catch (err) {
    console.error('trigger-update error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.use('/api/auth', authLimiter, authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/finnhub', finnhubRouter);
app.use('/api/journal', journalRouter);
app.use('/api/checklist', checklistRouter);
app.use('/api/analysis',  analysisRouter);
app.use('/api/assistant', requireAuth, aiLimiter, assistantRouter);
app.use('/api/charts', requireAuth, chartsRouter);
app.use('/api/levels', requireAuth, levelsRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/webhook/metaapi', webhookMetaApiRouter);
app.use('/api/sync', syncRouter);

// ── /mt5 proxy → Python screenshot service ────────────────────────────────────
app.use('/mt5', requireAuth);
app.post('/mt5/upload-trade-screenshot', checkScreenshotTries, (_req, _res, next) => next());

const _PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
const _pythonTarget = new URL(_PYTHON_SERVICE_URL);
const _pythonIsHttps = _pythonTarget.protocol === 'https:';

app.all('/mt5/*', (req, res) => {
  const targetPath = req.url.replace(/^\/mt5/, '') || '/';
  const isOcrUpload = req.method === 'POST' && targetPath === '/upload-trade-screenshot';
  const options = {
    hostname: _pythonTarget.hostname,
    port: _pythonTarget.port || (_pythonIsHttps ? 443 : 80),
    path: targetPath,
    method: req.method,
    headers: { ...req.headers, host: _pythonTarget.host, 'x-user-id': String(req.user?.id ?? '') },
  };
  const requester = _pythonIsHttps ? httpsRequest : httpRequest;
  const proxy = requester(options, (proxyRes) => {
    if (isOcrUpload && proxyRes.statusCode >= 200 && proxyRes.statusCode < 300 && req.user?.id) {
      try { incrementScreenshotTries(req.user.id); } catch (_) { /* non-fatal */ }
    }
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    pipeline(proxyRes, res, () => {});
  });
  proxy.on('error', () => {
    if (!res.headersSent) res.status(503).json({ error: 'Screenshot analysis service unavailable' });
  });
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    pipeline(req, proxy, () => {});
  } else {
    proxy.end();
  }
});

// Serve uploaded files from configured persistent path
ensureUploadDirs();
app.use('/uploads', express.static(UPLOADS_DIR));

// Serve React frontend static build (production)
const clientBuildPath = join(__dirname, '..', 'client', 'dist');
if (existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res) => {
    res.sendFile(join(clientBuildPath, 'index.html'));
  });
  console.log('✅ Serving built React frontend from client/dist');
} else {
  console.log('⚠️  No client/dist found. Run: cd client && npm run build');
}

app.use(errorHandler);

// ── HTTP + WebSocket server ───────────────────────────────────────────────────
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer, path: '/ws/market' });

httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use.`);
  } else {
    console.error('❌ HTTP server error:', err.message);
  }
  process.exit(1);
});

wss.on('error', (err) => console.error('❌ WebSocketServer error:', err.message));

wss.on('connection', (ws) => {
  console.log(`📡 Market WS client connected (total: ${wss.clients.size})`);

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

  const priceCache = finnhubService.getPriceSnapshot();
  const cacheEmpty = Object.keys(priceCache).length === 0;

  if (cacheEmpty) {
    const onSeeded = () => sendSnapshot();
    finnhubService.once('snapshot', onSeeded);
    ws.once('close', () => finnhubService.off('snapshot', onSeeded));
  } else if (!finnhubService.hasLiveTick) {
    const onFirstTick = () => {
      sendSnapshot();
      finnhubService.off('price', onFirstTick);
    };
    finnhubService.once('price', onFirstTick);
    ws.once('close', () => finnhubService.off('price', onFirstTick));
  } else {
    sendSnapshot();
  }

  const onPrice = (update) => {
    if (ws.readyState === ws.OPEN)
      ws.send(JSON.stringify({ type: 'price', data: update, ts: Date.now() }));
  };
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

// ── Start server ──────────────────────────────────────────────────────────────
// Initialize PostgreSQL schemas BEFORE listening
Promise.all([initDb(), initJournalDb()])
  .then(() => {
    httpServer.listen(PORT, HOST, () => {
      console.log(`🚀 Server running on ${HOST}:${PORT}`);
      console.log(`📊 Financial News Dashboard API`);
      console.log(`🔑 Polygon API Key: ${process.env.POLYGON_API_KEY ? 'Yes' : 'No'}`);
      console.log('Twelve Data key loaded:', !!process.env.TWELVE_DATA_API_KEY);

      if (process.env.FINNHUB_API_KEY) {
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
        }, 1000);
      } else {
        console.warn('⚠️  FINNHUB_API_KEY not set — live market data disabled');
      }

      // ── Daily macro snapshot ─────────────────────────────────────────────
      setInterval(async () => {
        try {
          const { calculateMacroSurpriseScore } = await import('./services/economicIntelligenceService.js');
          const result = await calculateMacroSurpriseScore();
          if (result?.score !== undefined) {
            const date = new Date().toISOString().slice(0, 10);
            try { await insertMacroSnapshot({ score: result.score, label: result.label ?? 'Unknown', date }); } catch {}
            console.log(`📊 Macro snapshot saved: ${date} score=${result.score}`);
          }
        } catch (err) { console.error('⚠️  Macro snapshot error:', err.message); }
      }, 24 * 60 * 60 * 1000);
    });
  })
  .catch(err => {
    console.error('❌ Failed to initialise database:', err.message);
    process.exit(1);
  });
