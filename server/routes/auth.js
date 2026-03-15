import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { OAuth2Client } from 'google-auth-library';
import * as Users from '../db/users.js';
import { signToken, requireAuth } from '../middleware/authMiddleware.js';
import { sendPasswordResetEmail } from '../services/emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const AVATARS_DIR = join(__dirname, '..', 'uploads', 'avatars');

const router = Router();

/** Build a safe JWT/response user object from a DB row. */
function buildUser(row) {
  return {
    id:                  row.id,
    name:                row.name,
    email:               row.email,
    avatar:              row.avatar ?? null,
    avatar_url:          row.avatar_url ?? null,
    plan:                row.plan ?? 'free',
    plan_expires_at:     row.plan_expires_at ?? null,
    ai_analysis_tries:   row.ai_analysis_tries ?? 0,
    screenshot_tries:    row.screenshot_tries ?? 0,
    is_admin:            row.is_admin ?? 0,
    trading_experience:  row.trading_experience ?? null,
    markets_traded:      row.markets_traded ?? null,
    goals:               row.goals ?? null,
    avatar_color:        row.avatar_color ?? 'emerald',
    onboarding_done:     row.onboarding_done ?? 0,
  };
}

// ── POST /api/auth/register ────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, terms_accepted } = req.body;

    if (!name?.trim() || !email?.trim() || !password)
      return res.status(400).json({ error: 'Name, email and password are required.' });

    if (!terms_accepted)
      return res.status(400).json({ error: 'You must accept the Terms of Service to create an account.' });

    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ error: 'Please enter a valid email address.' });

    if (Users.findByEmail(email)) {
      const existing = Users.findByEmail(email);
      if (!existing.password_hash) {
        return res.status(409).json({
          error: "This email is registered via Google Sign-In. Please use 'Continue with Google' to login, or click 'Forgot Password' to set a password.",
          code: 'GOOGLE_ONLY_ACCOUNT',
        });
      }
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const result = Users.createUser({
      name: name.trim(),
      email,
      password_hash,
      terms_accepted: 1,
      terms_accepted_at: new Date().toISOString(),
    });
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
    if (!row) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    if (!row.password_hash) {
      return res.status(401).json({
        error: "This account was created with Google. Please use 'Continue with Google' button to login.",
        code: 'GOOGLE_ONLY_ACCOUNT',
      });
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
// Startup diagnostic — logged once when server boots so you can verify env vars in Render
console.log('[Google OAuth] config check:', {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? `set (${process.env.GOOGLE_CLIENT_ID.slice(0, 12)}...)` : 'MISSING',
  CLIENT_URL: process.env.CLIENT_URL || 'MISSING',
});

router.post('/google', async (req, res) => {
  try {
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';

    // Detailed server-side diagnostics (visible in Render logs)
    console.log('[Google OAuth] POST /api/auth/google received');
    console.log('[Google OAuth] GOOGLE_CLIENT_ID set:', !!GOOGLE_CLIENT_ID);
    console.log('[Google OAuth] credential present:', !!req.body?.credential);
    console.log('[Google OAuth] credential length:', req.body?.credential?.length ?? 0);

    if (!GOOGLE_CLIENT_ID) {
      console.error('[Google OAuth] FATAL: GOOGLE_CLIENT_ID is not set in environment variables');
      return res.status(503).json({ error: 'Google sign-in is not configured on the server. Contact support.' });
    }

    const { credential } = req.body;
    if (!credential)
      return res.status(400).json({ error: 'Google credential is required.' });

    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    let ticket;
    try {
      ticket = await client.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    } catch (verifyErr) {
      console.error('[Google OAuth] verifyIdToken failed:', verifyErr.message);
      // Common causes: token expired, wrong GOOGLE_CLIENT_ID, clock skew
      return res.status(401).json({
        error: 'Google credential verification failed. Please try again.',
        detail: verifyErr.message, // visible to client for debugging
      });
    }

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;
    console.log('[Google OAuth] verified OK — email:', email);

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
    console.log('[Google OAuth] login success — userId:', user.id);
    res.json({ user, token });
  } catch (err) {
    console.error('[Google OAuth] unexpected error:', err);
    res.status(500).json({ error: 'Google sign-in failed due to a server error. Please try again.' });
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

// ── POST /api/auth/forgot-password ────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email?.trim())
      return res.status(400).json({ error: 'Email is required.' });

    const row = Users.findByEmail(email);
    if (row) {
      const token   = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 3_600_000).toISOString(); // 1 hour
      Users.setResetToken(email, token, expires);

      const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
      await sendPasswordResetEmail(email, resetLink, row.name);
    }

    // Always respond the same way — never reveal whether the email exists
    res.json({ message: 'If this email exists you will receive a reset link.' });
  } catch (err) {
    const detail = err.response?.data ?? err.message;
    console.error('forgot-password error:', JSON.stringify(detail));
    res.status(500).json({ error: 'Failed to process request. Please try again.' });
  }
});

// ── POST /api/auth/reset-password ─────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword)
      return res.status(400).json({ error: 'Token and new password are required.' });

    if (newPassword.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });

    const row = Users.findByResetToken(token);
    if (!row)
      return res.status(400).json({ error: 'Invalid or expired reset link.' });

    if (new Date(row.reset_token_expires) < new Date())
      return res.status(400).json({ error: 'Reset link has expired. Please request a new one.' });

    const password_hash = await bcrypt.hash(newPassword, 12);
    Users.setPassword(row.id, password_hash);
    Users.clearResetToken(row.id);

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('reset-password error:', err);
    res.status(500).json({ error: 'Failed to reset password. Please try again.' });
  }
});

// ── PUT /api/auth/update-profile ─────────────────────────────────────────
router.put('/update-profile', requireAuth, (req, res) => {
  try {
    const { trading_experience, markets_traded, goals, avatar_color, name, avatar_base64 } = req.body;

    // Validate avatar_color against allowed values
    const allowedColors = ['emerald', 'blue', 'purple', 'orange', 'rose', 'amber', 'cyan', 'indigo'];
    const safeColor = allowedColors.includes(avatar_color) ? avatar_color : 'emerald';

    // Handle avatar image upload
    if (avatar_base64) {
      console.log('[avatar] received — length:', avatar_base64?.length, 'type check:', avatar_base64?.substring(0, 30));
      const matches = avatar_base64.match(/^data:image\/(\w+);base64,(.+)$/);
      console.log('[avatar] regex match:', !!matches, 'format:', matches?.[1]);
      if (matches) {
        const buffer = Buffer.from(matches[2], 'base64');
        console.log('[avatar] buffer size:', buffer.length, 'bytes (limit 2097152)');
        if (buffer.length > 2 * 1024 * 1024)
          return res.status(400).json({ error: 'Image too large. Max size is 2MB.' });
        if (!existsSync(AVATARS_DIR)) mkdirSync(AVATARS_DIR, { recursive: true });
        const ext = matches[1] === 'png' ? 'png' : 'jpg';
        const filename = `${req.user.id}.${ext}`;
        const filePath = join(AVATARS_DIR, filename);
        console.log('[avatar] writing to:', filePath);
        writeFileSync(filePath, buffer);
        Users.updateAvatarUrl(req.user.id, `/uploads/avatars/${filename}`);
        console.log('[avatar] saved OK — url: /uploads/avatars/' + filename);
      } else {
        console.warn('[avatar] WARNING: base64 regex did not match — data URL prefix may be missing or corrupted');
      }
    }

    Users.updateProfile(req.user.id, {
      trading_experience: trading_experience ?? null,
      markets_traded: Array.isArray(markets_traded) ? markets_traded.join(',') : (markets_traded ?? null),
      goals: Array.isArray(goals) ? goals.join(',') : (goals ?? null),
      avatar_color: safeColor,
    });

    if (name?.trim()) {
      Users.updateName(req.user.id, name.trim());
    }

    Users.setOnboardingDone(req.user.id);

    const row = Users.findById(req.user.id);
    if (!row) return res.status(404).json({ error: 'User not found.' });
    const user = buildUser(row);
    const token = signToken(user);
    res.json({ user, token });
  } catch (err) {
    console.error('update-profile error:', err);
    res.status(500).json({ error: 'Profile update failed.' });
  }
});

export default router;
