import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import * as Users from '../db/users.js';
import { signToken, requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

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
    const user = { id: result.lastInsertRowid, name: name.trim(), email: email.toLowerCase().trim(), avatar: null };
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
      // Same message whether user doesn't exist or has no password (Google-only account)
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const valid = await bcrypt.compare(password, row.password_hash);
    if (!valid)
      return res.status(401).json({ error: 'Invalid email or password.' });

    const user = { id: row.id, name: row.name, email: row.email, avatar: row.avatar };
    const token = signToken(user);
    res.json({ user, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// ── POST /api/auth/google ──────────────────────────────────────────────────
// Receives a Google id_token (credential) from the Google Identity Services SDK
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

    // Find or create user
    let row = Users.findByGoogleId(googleId);
    if (!row) {
      row = Users.findByEmail(email);
      if (row) {
        // Link Google ID to existing email account
        Users.linkGoogleId(row.id, googleId, picture);
      } else {
        // Brand new user via Google
        const result = Users.createUser({ name, email, google_id: googleId, avatar: picture });
        row = Users.findById(result.lastInsertRowid);
      }
    }

    const freshRow = Users.findById(row.id);
    const user = { id: freshRow.id, name: freshRow.name, email: freshRow.email, avatar: picture || freshRow.avatar };
    const token = signToken(user);
    res.json({ user, token });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(401).json({ error: 'Google authentication failed. Please try again.' });
  }
});

// ── GET /api/auth/me ───────────────────────────────────────────────────────
router.get('/me', requireAuth, (req, res) => {
  const user = Users.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ user });
});

export default router;
