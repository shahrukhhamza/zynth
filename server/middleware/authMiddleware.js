import jwt from 'jsonwebtoken';

const JWT_EXPIRES = '7d';

function getSecret() {
  return process.env.JWT_SECRET || 'dev-secret-change-in-production';
}

export function signToken(payload) {
  return jwt.sign(payload, getSecret(), { expiresIn: JWT_EXPIRES });
}

export function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    req.user = jwt.verify(auth.slice(7), getSecret());
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/** Require pro or elite plan (or admin). */
export function requirePro(req, res, next) {
  const { plan, is_admin } = req.user || {};
  if (is_admin === 1 || plan === 'pro' || plan === 'elite') return next();
  return res.status(403).json({ error: 'Pro plan required.', upgrade: true });
}

/** Require elite plan or admin. */
export function requireElite(req, res, next) {
  const { plan, is_admin } = req.user || {};
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
  const { plan, is_admin, ai_analysis_tries = 0 } = req.user || {};
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
  const { plan, is_admin, screenshot_tries = 0 } = req.user || {};
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
