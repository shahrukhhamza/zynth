import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import * as Users from '../db/users.js';
import { signToken, requireAuth } from '../middleware/authMiddleware.js';
import { sendPasswordResetEmail } from '../services/emailService.js';
import { saveAvatarFromBase64 } from '../services/fileStorageService.js';

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

    const existing = await Users.findByEmail(email);
    if (existing) {
      if (!existing.password_hash) {
        return res.status(409).json({
          error: "This email is registered via Google Sign-In. Please use 'Continue with Google' to login, or click 'Forgot Password' to set a password.",
          code: 'GOOGLE_ONLY_ACCOUNT',
        });
      }
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const result = await Users.createUser({
      name: name.trim(),
      email,
      password_hash,
      terms_accepted: 1,
      terms_accepted_at: new Date().toISOString(),
    });
    const row = await Users.findById(result.id);
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

    const row = await Users.findByEmail(email);
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

    const freshRow = await Users.findById(row.id);
    const user = buildUser(freshRow);
    const token = signToken(user);
    res.json({ user, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// ── POST /api/auth/google ──────────────────────────────────────────────────
console.log('[Google OAuth] config check:', {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? `set (${process.env.GOOGLE_CLIENT_ID.slice(0, 12)}...)` : 'MISSING',
  CLIENT_URL: process.env.CLIENT_URL || 'MISSING',
});

router.post('/google', async (req, res) => {
  try {
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';

    console.log('[Google OAuth] POST /api/auth/google received');
    console.log('[Google OAuth] GOOGLE_CLIENT_ID set:', !!GOOGLE_CLIENT_ID);
    console.log('[Google OAuth] credential present:', !!req.body?.credential);

    if (!GOOGLE_CLIENT_ID) {
      console.error('[Google OAuth] FATAL: GOOGLE_CLIENT_ID is not set');
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
      return res.status(401).json({
        error: 'Google credential verification failed. Please try again.',
        detail: verifyErr.message,
      });
    }

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;
    console.log('[Google OAuth] verified OK — email:', email);

    let row = await Users.findByGoogleId(googleId);
    if (!row) {
      row = await Users.findByEmail(email);
      if (row) {
        await Users.linkGoogleId(row.id, googleId, picture);
      } else {
        const result = await Users.createUser({ name, email, google_id: googleId, avatar: picture });
        row = await Users.findById(result.id);
      }
    }

    const freshRow = await Users.findById(row.id);
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
router.get('/me', requireAuth, async (req, res) => {
  try {
    const row = await Users.findById(req.user.id);
    if (!row) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: buildUser(row) });
  } catch (err) {
    console.error('/me error:', err);
    res.status(500).json({ error: 'Failed to fetch user.' });
  }
});

// ── POST /api/auth/upgrade-plan ───────────────────────────────────────────
router.post('/upgrade-plan', requireAuth, async (req, res) => {
  try {
    const { plan, expiresAt = null } = req.body;
    const validPlans = ['free', 'pro', 'elite'];
    if (!validPlans.includes(plan))
      return res.status(400).json({ error: `Invalid plan. Must be one of: ${validPlans.join(', ')}` });

    await Users.updateUserPlan(req.user.id, plan, expiresAt);
    const row = await Users.findById(req.user.id);
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

    const row = await Users.findByEmail(email);
    if (row) {
      const token   = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 3_600_000).toISOString();
      await Users.setResetToken(email, token, expires);

      const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
      await sendPasswordResetEmail(email, resetLink, row.name);
    }

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

    const row = await Users.findByResetToken(token);
    if (!row)
      return res.status(400).json({ error: 'Invalid or expired reset link.' });

    if (new Date(row.reset_token_expires) < new Date())
      return res.status(400).json({ error: 'Reset link has expired. Please request a new one.' });

    const password_hash = await bcrypt.hash(newPassword, 12);
    await Users.setPassword(row.id, password_hash);
    await Users.clearResetToken(row.id);

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('reset-password error:', err);
    res.status(500).json({ error: 'Failed to reset password. Please try again.' });
  }
});

// ── PUT /api/auth/update-profile ──────────────────────────────────────────
router.put('/update-profile', requireAuth, async (req, res) => {
  try {
    const { trading_experience, markets_traded, goals, avatar_color, name, avatar_base64 } = req.body;

    const allowedColors = ['emerald', 'blue', 'purple', 'orange', 'rose', 'amber', 'cyan', 'indigo'];
    const safeColor = allowedColors.includes(avatar_color) ? avatar_color : 'emerald';

    if (avatar_base64) {
      console.log('[avatar] received — length:', avatar_base64?.length);
      const avatarUrl = await saveAvatarFromBase64(req.user.id, avatar_base64);
      if (avatarUrl) {
        await Users.updateAvatarUrl(req.user.id, avatarUrl);
        console.log('[avatar] saved OK — url:', avatarUrl);
      } else {
        console.warn('[avatar] WARNING: base64 regex did not match');
      }
    }

    await Users.updateProfile(req.user.id, {
      trading_experience: trading_experience ?? null,
      markets_traded: Array.isArray(markets_traded) ? markets_traded.join(',') : (markets_traded ?? null),
      goals: Array.isArray(goals) ? goals.join(',') : (goals ?? null),
      avatar_color: safeColor,
    });

    if (name?.trim()) {
      await Users.updateName(req.user.id, name.trim());
    }

    await Users.setOnboardingDone(req.user.id);

    const row = await Users.findById(req.user.id);
    if (!row) return res.status(404).json({ error: 'User not found.' });
    const user = buildUser(row);
    const token = signToken(user);
    res.json({ user, token });
  } catch (err) {
    console.error('update-profile error:', err);
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    res.status(500).json({ error: 'Profile update failed.' });
  }
});

export default router;
