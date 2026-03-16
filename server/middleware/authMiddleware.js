import jwt from 'jsonwebtoken';
import * as Users from '../db/users.js';

const JWT_EXPIRES = '7d';

function getSecret() {
  return process.env.JWT_SECRET || 'dev-secret-change-in-production';
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
      screenshot_tries: currentUser?.screenshot_tries ?? decoded?.screenshot_tries ?? 0,
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
  return res.status(403).json({ error: 'Pro plan required.', upgrade: true });
}

/** Require elite plan or admin. */
export function requireElite(req, res, next) {
  const { is_admin } = req.user || {};
  const plan = normalizePlan(req.user?.plan);
  if (is_admin === 1 || plan === 'elite') return next();
  return res.status(403).json({ error: 'Elite plan required.', upgrade: true });
}

/** Require admin role. */
export function requireAdmin(req, res, next) {
  if (req.user?.is_admin === 1) return next();
  return res.status(403).json({ error: 'Admin access required.' });
}

/** Gate AI analysis tries — free: 3, pro: 50, elite/admin: unlimited. */
export function checkAiTries(req, res, next) {
  const { is_admin, ai_analysis_tries = 0 } = req.user || {};
  const plan = normalizePlan(req.user?.plan);
  if (is_admin === 1 || plan === 'elite') return next();
  if (plan === 'pro') {
    if (ai_analysis_tries >= 50)
      return res.status(403).json({ error: 'limit_reached', limit: 50, upgrade: true });
    return next();
  }
  // free
  if (ai_analysis_tries >= 3)
    return res.status(403).json({ error: 'limit_reached', limit: 3, upgrade: true });
  next();
}

/** Gate screenshot OCR tries — free: 2, pro: 35, elite/admin: unlimited. */
export function checkScreenshotTries(req, res, next) {
  const { is_admin, screenshot_tries = 0 } = req.user || {};
  const plan = normalizePlan(req.user?.plan);
  if (is_admin === 1 || plan === 'elite') return next();
  if (plan === 'pro') {
    if (screenshot_tries >= 35)
      return res.status(403).json({ error: 'limit_reached', limit: 35, upgrade: true });
    return next();
  }
  // free
  if (screenshot_tries >= 2)
    return res.status(403).json({ error: 'limit_reached', limit: 2, upgrade: true });
  next();
}
