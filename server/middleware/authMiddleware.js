import jwt from 'jsonwebtoken';
import * as Users from '../db/users.js';

const JWT_EXPIRES = '7d';

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET env variable is required — set it before starting the server');
  return secret;
}

function normalizePlan(plan) {
  return String(plan || 'free').trim().toLowerCase();
}

export function signToken(payload) {
  return jwt.sign(payload, getSecret(), { expiresIn: JWT_EXPIRES });
}

export async function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const decoded = jwt.verify(auth.slice(7), getSecret());
    const currentUser = decoded?.id ? await Users.findById(decoded.id) : null;

    req.user = {
      ...decoded,
      ...(currentUser ?? {}),
      plan: normalizePlan(currentUser?.plan ?? decoded?.plan),
      is_admin: Number(currentUser?.is_admin ?? decoded?.is_admin ?? 0),
      ai_analysis_tries: currentUser?.ai_analysis_tries ?? decoded?.ai_analysis_tries ?? 0,
      ai_monthly_count:  currentUser?.ai_monthly_count  ?? 0,
      ai_month_reset:    currentUser?.ai_month_reset     ?? null,
      screenshot_tries:  currentUser?.screenshot_tries  ?? decoded?.screenshot_tries ?? 0,
    };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/** Require pro or elite plan (or admin). */
export function requirePro(req, res, next) {
  const { is_admin } = req.user || {};
  const plan = normalizePlan(req.user?.plan);
  if (is_admin === 1 || plan === 'pro' || plan === 'elite') return next();
  return res.status(403).json({ error: 'Pro plan required.', upgrade: true, requiredPlan: 'pro' });
}

/** Require elite plan or admin. */
export function requireElite(req, res, next) {
  const { is_admin } = req.user || {};
  const plan = normalizePlan(req.user?.plan);
  if (is_admin === 1 || plan === 'elite') return next();
  return res.status(403).json({ error: 'Elite plan required.', upgrade: true, requiredPlan: 'elite' });
}

/** Require admin role. */
export function requireAdmin(req, res, next) {
  if (req.user?.is_admin === 1) return next();
  return res.status(403).json({ error: 'Admin access required.' });
}

/**
 * Gate AI analysis:
 *   free  — 2 lifetime analyses
 *   pro   — 50 per calendar month (resets automatically)
 *   elite / admin — unlimited
 *
 * Also increments the correct counter so limits are actually enforced.
 */
export async function checkAiTries(req, res, next) {
  const { is_admin } = req.user || {};
  const plan = normalizePlan(req.user?.plan);
  const userId = req.user?.id;

  if (is_admin === 1 || plan === 'elite') return next();

  if (plan === 'pro') {
    // Use the live monthly count (auto-resets if month rolled over)
    const monthlyCount = await Users.getMonthlyAiCount(userId);
    if (monthlyCount >= 50) {
      return res.status(403).json({ error: 'limit_reached', limit: 50, plan: 'pro', upgrade: true, requiredPlan: 'elite' });
    }
    // Attach fresh count so the route can pass it through to the client
    req.user.ai_monthly_count = monthlyCount;
    return next();
  }

  // Free: 2 lifetime analyses
  const lifetimeUsed = req.user?.ai_analysis_tries ?? 0;
  if (lifetimeUsed >= 2) {
    return res.status(403).json({ error: 'limit_reached', limit: 2, plan: 'free', upgrade: true, requiredPlan: 'pro' });
  }
  next();
}

