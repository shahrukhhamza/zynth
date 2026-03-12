import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import * as Users from '../db/users.js';
import { signToken, requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

/** Build a safe JWT/response user object from a DB row. */
function buildUser(row) {
  return {
    id:                  row.id,
    name:                row.name,
    email:               row.email,
    avatar:              row.avatar ?? null,
    plan:                row.plan ?? 'free',
    plan_expires_at:     row.plan_expires_at ?? null,
    ai_analysis_tries:   row.ai_analysis_tries ?? 0,
    screenshot_tries:    row.screenshot_tries ?? 0,
    is_admin:            row.is_admin ?? 0,
  };
}

// ── POST /api/auth/register ────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password)
      return res.status(400).json({ error: 'Name, email and password are required.' });

    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ error: 'Please enter a valid email address.' });

    if (Users.findByEmail(email))
      return res.status(409).json({ error: 'An account with this email already exists.' });

    const password_hash = await bcrypt.hash(password, 12);
    const result = Users.createUser({ name: name.trim(), email, password_hash });
    const row = Users.findById(result.lastInsertRowid);
    const user = buildUser(row);
    const token = signToken(user);

    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// ── POST /api/auth/login ───────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password)
      return res.status(400).json({ error: 'Email and password are required.' });

    const row = Users.findByEmail(email);
    if (!row || !row.password_hash) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const valid = await bcrypt.compare(password, row.password_hash);
    if (!valid)
      return res.status(401).json({ error: 'Invalid email or password.' });

    const freshRow = Users.findById(row.id);
    const user = buildUser(freshRow);
    const token = signToken(user);
    res.json({ user, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// ── POST /api/auth/google ──────────────────────────────────────────────────
router.post('/google', async (req, res) => {
  try {
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
    if (!GOOGLE_CLIENT_ID)
      return res.status(503).json({ error: 'Google sign-in is not configured. Add GOOGLE_CLIENT_ID to .env.' });

    const { credential } = req.body;
    if (!credential)
      return res.status(400).json({ error: 'Google credential is required.' });

    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let row = Users.findByGoogleId(googleId);
    if (!row) {
      row = Users.findByEmail(email);
      if (row) {
        Users.linkGoogleId(row.id, googleId, picture);
      } else {
        const result = Users.createUser({ name, email, google_id: googleId, avatar: picture });
        row = Users.findById(result.lastInsertRowid);
      }
    }

    const freshRow = Users.findById(row.id);
    const user = buildUser({ ...freshRow, avatar: picture || freshRow.avatar });
    const token = signToken(user);
    res.json({ user, token });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(401).json({ error: 'Google authentication failed. Please try again.' });
  }
});

// ── GET /api/auth/me ───────────────────────────────────────────────────────
router.get('/me', requireAuth, (req, res) => {
  const row = Users.findById(req.user.id);
  if (!row) return res.status(404).json({ error: 'User not found.' });
  res.json({ user: buildUser(row) });
});

// ── POST /api/auth/upgrade-plan ───────────────────────────────────────────
router.post('/upgrade-plan', requireAuth, (req, res) => {
  try {
    const { plan, expiresAt = null } = req.body;
    const validPlans = ['free', 'pro', 'elite'];
    if (!validPlans.includes(plan))
      return res.status(400).json({ error: `Invalid plan. Must be one of: ${validPlans.join(', ')}` });

    Users.updateUserPlan(req.user.id, plan, expiresAt);
    const row = Users.findById(req.user.id);
    if (!row) return res.status(404).json({ error: 'User not found.' });
    const user = buildUser(row);
    const token = signToken(user);
    res.json({ user, token });
  } catch (err) {
    console.error('upgrade-plan error:', err);
    res.status(500).json({ error: 'Plan upgrade failed.' });
  }
});

export default router;
