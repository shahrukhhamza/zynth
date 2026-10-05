import './loadEnv.js'; // must stay first: populates process.env before any other module loads
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync } from 'fs';
import { createServer } from 'http';
import { createHash } from 'crypto';
import { WebSocketServer } from 'ws';
import { request as httpRequest } from 'http';
import { request as httpsRequest } from 'https';
import { pipeline } from 'stream';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Environment variables are loaded by ./loadEnv.js (first import above).

const REQUIRED_SECURITY_ENV = ['JWT_SECRET'];
const missingSecurityEnv = REQUIRED_SECURITY_ENV.filter((key) => !process.env[key]);
if (missingSecurityEnv.length > 0) {
  throw new Error(`Missing required security environment variables: ${missingSecurityEnv.join(', ')}`);
}

// Gemini call counter
import { getGeminiCount } from './utils/geminiCounter.js';

// Now import modules that depend on environment variables
import newsRouter from './routes/news.js';
import dataRouter from './routes/data.js';
import calendarRouter from './routes/calendar.js';
import economicRouter from './routes/economic.js';
import authRouter from './routes/auth.js';

import journalRouter from './routes/journal.js';
import checklistRouter from './routes/checklist.js';
import analysisRouter  from './routes/analysis.js';
import assistantRouter from './routes/assistant.js';
import { initJournalDb, insertMacroSnapshot } from './services/journalDb.js';
import { errorHandler } from './middleware/errorHandler.js';
import { getApiKeyManager } from './utils/apiKeyManager.js';

import { startAutoReleaseScheduler, manualTrigger } from './services/autoReleaseService.js';
import adminRouter from './routes/admin.js';
import chartsRouter from './routes/charts.js';
import levelsRouter from './routes/levels.js';
import eventsRouter from './routes/events.js';
import paymentsRouter from './routes/payments.js';
import paymentRouter  from './routes/payment.js';
import tradingRouter from './routes/trading.js';
import { requireAuth, requireAdmin } from './middleware/authMiddleware.js';
import jwt from 'jsonwebtoken';
import * as Users from './db/users.js';
import { initDb, promoteAdminEmails } from './db/users.js';
import { adminEmails } from './services/admins.js';
import { initEventsDb } from './db/events.js';
import { initPaymentsDb } from './db/payments.js';
import { UPLOADS_DIR, ensureUploadDirs } from './config/storagePaths.js';
import { secureSchema, pingDb } from './db/pool.js';
import { ensureSupabaseBuckets, fetchPaymentProofFromSupabase, isValidProofName, storageBackend } from './services/fileStorageService.js';

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const isPreflightRequest = (req) => req.method === 'OPTIONS';

if (!process.env.GOOGLE_CLIENT_ID) {
  console.error('⚠️ GOOGLE_CLIENT_ID is not set. Google sign-in will fail until it is configured.');
}

app.disable('x-powered-by');

// With `trust proxy` set below, Express resolves req.ip from X-Forwarded-For using the
// configured number of trusted hops. Never read the raw header ourselves: any client can
// send a fake one, which would let it dodge every rate limit.
const getForwardedIp = (req) => req.ip || req.socket?.remoteAddress || 'unknown';

// Only a token that verifies gets its own bucket. Unverified "Bearer xyz" values fall back
// to the client IP so random tokens cannot be used to mint fresh rate-limit buckets.
const getRateLimitKey = (req) => {
  const auth = req.headers.authorization;
  if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(auth.slice(7), process.env.JWT_SECRET, { algorithms: ['HS256'] });
      if (decoded?.id) return `user:${decoded.id}`;
    } catch { /* fall through to IP bucket */ }
  }
  return `ip:${ipKeyGenerator(getForwardedIp(req))}`;
};

const getIpRateLimitKey = (req) => `ip:${ipKeyGenerator(getForwardedIp(req))}`;

const skipGlobalRateLimit = (req) => {
  if (isPreflightRequest(req)) return true;
  return req.path === '/health' || req.path === '/public-stats' || req.path === '/auth/me';
};

// Only credential-guessing endpoints are throttled. Session endpoints (/me, /update-profile,
// /upgrade-plan) are covered by the global limiter instead.
const AUTH_ATTEMPT_PATHS = new Set(['/login', '/register', '/register/verify', '/register/resend', '/google', '/forgot-password', '/reset-password', '/reset-password/verify']);
const skipAuthAttemptRateLimit = (req) => {
  if (isPreflightRequest(req)) return true;
  return !AUTH_ATTEMPT_PATHS.has(req.path);
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
  handler: (req, res) => {
    console.warn('[security] global rate limit hit', { path: req.path, method: req.method, ip: getForwardedIp(req) });
    res.status(429).json({ error: 'Too many requests, please try again later.' });
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // successful logins/sign-ups must not lock out shared networks
  message: { error: 'Too many authentication attempts, please try again later.' },
  keyGenerator: getIpRateLimitKey,
  skip: skipAuthAttemptRateLimit,
  handler: (req, res) => {
    console.warn('[security] auth rate limit hit', { path: req.path, method: req.method, ip: getForwardedIp(req) });
    res.status(429).json({ error: 'Too many authentication attempts, please try again later.' });
  },
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
  process.env.CLIENT_URL1,
  process.env.CLIENT_ORIGIN,
  process.env.FRONTEND_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
].map(_normalizeOrigin).filter(Boolean);

const _ALLOWED_ORIGINS = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://zynth.vercel.app',
  'https://zynth.codes',
  'https://www.zynth.codes',
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

const _isAllowedZynthDomain = (origin) => {
  try {
    const { protocol, hostname } = new URL(origin);
    if (protocol !== 'https:') return false;
    return hostname === 'zynth.codes' || hostname.endsWith('.zynth.codes');
  } catch {
    return false;
  }
};

const _isAllowedRenderDomain = (origin) => {
  try {
    const { protocol, hostname } = new URL(origin);
    return protocol === 'https:' && hostname.endsWith('.onrender.com');
  } catch {
    return false;
  }
};

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser clients and server-to-server requests.
    if (!origin) return callback(null, true);

    const normalized = _normalizeOrigin(origin);
    if (normalized && (
      _ALLOWED_ORIGINS.has(normalized)
      || _isAllowedVercelPreview(normalized)
      || _isAllowedZynthDomain(normalized)
      || _isAllowedRenderDomain(normalized)
    )) {
      return callback(null, true);
    }

    console.warn(`CORS blocked origin: ${origin}`);
    const corsError = new Error('Not allowed by CORS');
    corsError.statusCode = 403;
    return callback(corsError);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

// The built index.html carries inline scripts (theme bootstrap, GA4 init). Allow exactly those
// by hash instead of opening script-src to 'unsafe-inline'.
const clientBuildPath = join(__dirname, '..', 'client', 'dist');
const inlineScriptHashes = (() => {
  try {
    const html = readFileSync(join(clientBuildPath, 'index.html'), 'utf8');
    return [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)]
      .filter(([, attrs, body]) => !/\ssrc\s*=/.test(attrs) && body.trim())
      // Browsers normalise CRLF/CR to LF before hashing inline script text.
      .map(([, , body]) => `'sha256-${createHash('sha256').update(body.replace(/\r\n?/g, '\n')).digest('base64')}'`);
  } catch {
    return [];
  }
})();

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        ...inlineScriptHashes,
        'https://www.googletagmanager.com',
        'https://accounts.google.com/gsi/client',
        'https://s3.tradingview.com', // Charts page injects tv.js
      ],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://accounts.google.com/gsi/style'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      connectSrc: ["'self'", 'https:', 'wss:'],
      fontSrc: ["'self'", 'https:', 'data:'],
      frameSrc: ["'self'", 'https://accounts.google.com/gsi/', 'https://*.tradingview.com', 'https://*.tradingview-widget.com'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }, // Google Sign-In popup
  referrerPolicy: { policy: 'no-referrer' },
}));

// Browsers attach an Origin header to module scripts and fetches even when the page is served by
// this same server, so a request whose Origin matches our own Host is always same-origin and must
// never be blocked — otherwise the site would break on any domain missing from the allowlist.
const corsDelegate = (req, callback) => {
  const origin = req.header('Origin');
  const host = req.header('X-Forwarded-Host') || req.header('Host');
  let sameOrigin = false;
  try { sameOrigin = !!origin && !!host && new URL(origin).host === host; } catch { /* malformed Origin */ }
  callback(null, sameOrigin ? { ...corsOptions, origin: true } : corsOptions);
};

app.use(cors(corsDelegate));
app.options('*', cors(corsDelegate));

app.use('/api', globalLimiter);
app.use('/api/auth/me', authSessionLimiter);

app.use(express.json({ limit: '10mb', strict: true }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitize());

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running', geminiCallsToday: getGeminiCount(), storage: storageBackend() });
});

// Liveness + database probe. Point an uptime monitor at this every ~5 minutes: it keeps a free
// web host awake and counts as activity so a free Supabase project is never auto-paused.
app.get('/api/health/db', async (req, res) => {
  try {
    res.json({ status: 'ok', dbLatencyMs: await pingDb() });
  } catch (err) {
    console.error('[health] db probe failed:', err.message);
    res.status(503).json({ status: 'error', error: 'Database unreachable' });
  }
});

// Public on purpose: the signup/login pages show it to logged-out visitors. Counts only.
app.get('/api/public-stats', async (req, res) => {
  try {
    const [totalUsers, promoSpotsLeft] = await Promise.all([Users.countUsers(), Users.getPromoSpotsLeft()]);
    res.json({ totalUsers, promoSpotsLeft, promoLimit: Users.getPromoLimit(), promoActive: Users.isElitePromoActive() });
  } catch (_) {
    res.json({ totalUsers: 0, promoSpotsLeft: null, promoLimit: null });
  }
});

app.get('/api/key-stats', requireAuth, requireAdmin, (req, res) => {
  try {
    const keyManager = getApiKeyManager();
    const stats = keyManager.getStats();
    res.json({ totalKeys: stats.length, stats, timestamp: new Date().toISOString() });
  } catch {
    res.status(500).json({ error: 'Failed to fetch key stats' });
  }
});

app.use('/api/news', newsRouter);
app.use('/api/data', requireAuth, dataRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/economic', economicRouter);

app.post('/api/economic/trigger-update', requireAuth, requireAdmin, async (req, res) => {
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
    return res.status(500).json({ error: 'Failed to trigger update.' });
  }
});

app.use('/api/auth', authLimiter, authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/events', eventsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/payment',  paymentRouter);

app.use('/api/journal', journalRouter);
app.use('/api/checklist', checklistRouter);
app.use('/api/analysis',  analysisRouter);
app.use('/api/assistant', requireAuth, aiLimiter, assistantRouter);
app.use('/api/charts', requireAuth, chartsRouter);
app.use('/api/levels', requireAuth, levelsRouter);
app.use('/api/calc', tradingRouter);  // Pure math — no DB/auth needed


// Serve uploaded files from configured persistent path
ensureUploadDirs();
// Avatars and journal screenshots are loaded through plain <img src> tags, which cannot send an
// Authorization header, so they are public (same as the Spaces/Cloudinary copies). Payment
// proofs contain financial details and stay admin-only.
// Payment proofs live in a private Supabase bucket when it is configured: stream them to admins.
app.get('/uploads/payments/:file', requireAuth, requireAdmin, async (req, res, next) => {
  if (storageBackend() !== 'supabase') return next(); // local disk → handled by the static chain below
  if (!isValidProofName(req.params.file)) return res.status(400).json({ error: 'Invalid file name' });
  try {
    const upstream = await fetchPaymentProofFromSupabase(req.params.file);
    if (!upstream) return res.status(404).json({ error: 'Not found' });
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/octet-stream');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, max-age=300');
    return res.send(Buffer.from(await upstream.arrayBuffer()));
  } catch (err) {
    console.error('[uploads] proof fetch failed:', err.message);
    return res.status(502).json({ error: 'Could not load file' });
  }
});

const requirePaymentProofAccess = (req, res, next) => {
  if (!req.path.startsWith('/payments/')) return next();
  return requireAuth(req, res, () => requireAdmin(req, res, next));
};

app.use('/uploads', requirePaymentProofAccess, (req, res, next) => {
  // Prevent browser from rendering uploaded HTML/SVG — force download for non-image types
  const ext = req.path.split('.').pop()?.toLowerCase();
  const safeImageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  if (!safeImageExts.includes(ext)) {
    res.setHeader('Content-Disposition', 'attachment');
  }
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
}, express.static(UPLOADS_DIR));

// Serve React frontend static build (production)
if (existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res, next) => {
    // Unknown API/upload paths must 404 as JSON, not fall through to the SPA shell with a 200.
    if (req.path.startsWith('/api/') || req.path === '/api' || req.path.startsWith('/uploads/')) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(join(clientBuildPath, 'index.html'));
  });
  console.log('✅ Serving built React frontend from client/dist');
} else {
  console.log('⚠️  No client/dist found. Run: cd client && npm run build');
}

app.use(errorHandler);

// ── HTTP + WebSocket server ───────────────────────────────────────────────────
const httpServer = createServer(app);
httpServer.setTimeout(30000); // 30s request timeout
const wss = new WebSocketServer({ server: httpServer, path: '/ws/market' });

// WebSocket authentication — verify JWT on upgrade
wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get('token');
  if (!token) {
    ws.close(4001, 'Authentication required');
    return;
  }
  try {
    jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    ws.close(4001, 'Invalid token');
    return;
  }
});

httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use.`);
  } else {
    console.error('❌ HTTP server error:', err.message);
  }
  process.exit(1);
});

wss.on('error', (err) => console.error('❌ WebSocketServer error:', err.message));

// ── Start server ──────────────────────────────────────────────────────────────
// Initialize PostgreSQL schemas BEFORE listening — but don't crash if DB is down
function startListening() {
  httpServer.listen(PORT, HOST, () => {
    console.log(`🚀 Server running on ${HOST}:${PORT}`);
    console.log(`📊 Financial News Dashboard API`);
    console.log(`🔑 Polygon API Key: ${process.env.POLYGON_API_KEY ? 'configured' : 'missing'}`);
    console.log('Twelve Data key loaded:', !!process.env.TWELVE_DATA_API_KEY);

    startAutoReleaseScheduler(wss);

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
}

Promise.all([initDb(), initJournalDb(), initEventsDb(), initPaymentsDb()])
  .then(() => secureSchema())
  .then(async () => {
    const owners = adminEmails();
    if (owners.length) {
      const n = await promoteAdminEmails(owners);
      console.log(`[admin] ADMIN_EMAILS: ${owners.length} owner email(s) configured${n ? `, ${n} account(s) promoted` : ''}`);
    }
  })
  .then(() => ensureSupabaseBuckets())
  .then(() => startListening())
  .catch(err => {
    console.error('⚠️  Database initialisation failed:', err.message);
    console.error('⚠️  Starting server anyway — DB-dependent features will be unavailable');
    startListening();
  });
