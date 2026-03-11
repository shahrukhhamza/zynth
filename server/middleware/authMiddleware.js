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
