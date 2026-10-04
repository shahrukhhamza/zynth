import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import * as Users from '../db/users.js';
import { signToken, requireAuth, requireAdmin } from '../middleware/authMiddleware.js';
import { sendPasswordResetEmail } from '../services/emailService.js';
import { saveAvatarFromBase64 } from '../services/fileStorageService.js';
import { trackEvent } from '../db/events.js';

const router = Router();

// bcrypt only uses the first 72 bytes and hashing huge inputs is a cheap CPU-exhaustion vector.
const MAX_PASSWORD_LENGTH = 128;

function normalizePlan(plan) {
  return String(plan || 'free').trim().toLowerCase();
}

/** Build a safe JWT/response user object from a DB row. */
function buildUser(row) {
  return {
    id:                  row.id,
    name:                row.name,
    email:               row.email,
    avatar:              row.avatar ?? null,
    avatar_url:          row.avatar_url ?? null,
    plan:                normalizePlan(row.plan),
    plan_expires_at:     row.plan_expires_at ?? null,
    ai_analysis_tries:   row.ai_analysis_tries ?? 0,
    ai_monthly_count:    row.ai_monthly_count  ?? 0,
    screenshot_tries:    row.screenshot_tries ?? 0,
    is_admin:            row.is_admin ?? 0,
    trading_experience:  row.trading_experience ?? null,
    markets_traded:      row.markets_traded ?? null,
    goals:               row.goals ?? null,
    avatar_color:        row.avatar_color ?? 'emerald',
    onboarding_done:     row.onboarding_done ?? 0,
    journal_count:       row.journal_count ?? 0,
    promo_elite:         !!row.promo_elite, // Elite granted by the launch promotion, not purchased
  };
}

// ── POST /api/auth/register ────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, terms_accepted } = req.body;
    const safeName = String(name || '').trim();
    const safeEmail = String(email || '').trim().toLowerCase();

    if (!safeName || !safeEmail || !password)
      return res.status(400).json({ error: 'Name, email and password are required.' });

    if (typeof password !== 'string')
      return res.status(400).json({ error: 'Password must be a string.' });

    if (password.length > MAX_PASSWORD_LENGTH)
      return res.status(400).json({ error: `Password must be at most ${MAX_PASSWORD_LENGTH} characters.` });

    if (!terms_accepted)
      return res.status(400).json({ error: 'You must accept the Terms of Service to create an account.' });

    if (password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });

    if (safeName.length > 80)
      return res.status(400).json({ error: 'Name is too long.' });

    if (safeEmail.length > 254)
      return res.status(400).json({ error: 'Email is too long.' });

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeEmail))
      return res.status(400).json({ error: 'Please enter a valid email address.' });

    const existing = await Users.findByEmail(safeEmail);
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
      name: safeName,
      email: safeEmail,
      password_hash,
      terms_accepted: 1,
      terms_accepted_at: new Date().toISOString(),
    });
    const row = await Users.findById(result.id);
    const user = buildUser(row);
    const token = signToken(user);

    trackEvent(result.id, 'user_signup', { name: safeName, email: safeEmail });

    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Register error:', err?.message || 'unknown');
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// ── POST /api/auth/login ───────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const safeEmail = String(email || '').trim().toLowerCase();

    if (!safeEmail || !password || typeof password !== 'string')
      return res.status(400).json({ error: 'Email and password are required.' });

    const row = await Users.findByEmail(safeEmail);
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

    if (Number(row.is_banned) === 1)
      return res.status(403).json({ error: 'Account suspended.' });

    const freshRow = await Users.findById(row.id);
    const user = buildUser(freshRow);
    const token = signToken(user);
    res.json({ user, token });
  } catch (err) {
    console.error('[Auth Login] error:', {
      message: err?.message || 'unknown',
      name: err?.name || 'unknown',
      code: err?.code || 'unknown',
      stack: err?.stack || null,
    });
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// ── POST /api/auth/google ──────────────────────────────────────────────────
router.post('/google', async (req, res) => {
  try {
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';

    if (!GOOGLE_CLIENT_ID) {
      console.error('[Google OAuth] GOOGLE_CLIENT_ID is not set');
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
      console.error('[Google OAuth] verifyIdToken failed');
      return res.status(401).json({ error: 'Google credential verification failed. Please try again.' });
    }

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ error: 'Google credential payload is invalid. Please try again.' });
    }

    const {
      sub: googleId,
      email,
      name,
      picture,
      email_verified: emailVerified,
    } = payload;

    if (!googleId) {
      return res.status(401).json({ error: 'Google account id is missing. Please try again.' });
    }

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Google account did not provide an email address.' });
    }

    if (emailVerified !== true && emailVerified !== 'true') {
      return res.status(403).json({ error: 'Google email is not verified. Please verify your Google account email first.' });
    }

    let row = await Users.findByGoogleId(googleId);
    if (!row) {
      row = await Users.findByEmail(email);
      if (row) {
        try {
          await Users.linkGoogleId(row.id, googleId, picture);
        } catch (dbErr) {
          if (dbErr?.code === '23505') {
            return res.status(409).json({ error: 'This Google account is already linked to another user.' });
          }
          throw dbErr;
        }
      } else {
        const safeName = String(name || email.split('@')[0] || 'Google User').trim().slice(0, 80);
        let result;
        try {
          result = await Users.createUser({
            name: safeName,
            email,
            google_id: googleId,
            avatar: picture || null,
          });
        } catch (dbErr) {
          if (dbErr?.code === '23505') {
            // Race condition: user might have been created in another request.
            row = await Users.findByEmail(email);
            if (!row) {
              row = await Users.findByGoogleId(googleId);
            }
            if (!row) {
              return res.status(409).json({ error: 'Account already exists. Please retry sign-in.' });
            }
          } else {
            throw dbErr;
          }
        }
        if (!row && result?.id) {
          row = await Users.findById(result.id);
        }
      }
    }

    if (!row?.id) {
      return res.status(500).json({ error: 'Unable to complete Google sign-in. Please try again.' });
    }

    if (Number(row.is_banned) === 1) {
      return res.status(403).json({ error: 'Account suspended.' });
    }

    const freshRow = await Users.findById(row.id);
    const user = buildUser({ ...freshRow, avatar: picture || freshRow.avatar });
    const token = signToken(user);
    res.json({ user, token });
  } catch (err) {
    console.error('[Google OAuth] unexpected error:', {
      message: err?.message || 'unknown',
      name: err?.name || 'unknown',
      code: err?.code || 'unknown',
      stack: err?.stack || null,
    });
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
// Admin-only: used by payment webhooks / admin panel to change a user's plan.
// Do NOT call this directly from client-side code — wire Paddle webhooks instead.
router.post('/upgrade-plan', requireAuth, requireAdmin, async (req, res) => {
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
  const genericReply = { message: 'If this email exists you will receive a reset link.' };
  try {
    const { email } = req.body;
    if (typeof email !== 'string' || !email.trim())
      return res.status(400).json({ error: 'Email is required.' });

    const row = await Users.findByEmail(email);
    if (row) {
      const token   = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 3_600_000).toISOString();
      await Users.setResetToken(email, token, expires);

      const base = (process.env.CLIENT_URL || process.env.RENDER_EXTERNAL_URL || '').replace(/\/+$/, '');
      const resetLink = `${base}/reset-password?token=${token}`;
      try {
        await sendPasswordResetEmail(email, resetLink, row.name);
      } catch (mailErr) {
        // Never surface mail failures: a 500 only for existing accounts would reveal which
        // emails are registered.
        console.error('forgot-password email failed:', JSON.stringify(mailErr.response?.data ?? mailErr.message));
      }
    }

    res.json(genericReply);
  } catch (err) {
    console.error('forgot-password error:', err.message);
    res.status(500).json({ error: 'Failed to process request. Please try again.' });
  }
});

// ── POST /api/auth/reset-password ─────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (typeof token !== 'string' || typeof newPassword !== 'string' || !token || !newPassword)
      return res.status(400).json({ error: 'Token and new password are required.' });

    if (newPassword.length > MAX_PASSWORD_LENGTH)
      return res.status(400).json({ error: `Password must be at most ${MAX_PASSWORD_LENGTH} characters.` });

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
    // Only touch what the client actually sent — a name-only update must not wipe the profile.
    const safeColor = allowedColors.includes(avatar_color) ? avatar_color : undefined;
    const joinList = (v) => (Array.isArray(v) ? v.join(',') : (typeof v === 'string' ? v : undefined));

    if (avatar_base64) {
      const avatarUrl = await saveAvatarFromBase64(req.user.id, avatar_base64);
      if (avatarUrl) {
        await Users.updateAvatarUrl(req.user.id, avatarUrl);
      }
    }

    await Users.updateProfile(req.user.id, {
      trading_experience: typeof trading_experience === 'string' ? trading_experience.slice(0, 100) : undefined,
      markets_traded: joinList(markets_traded)?.slice(0, 500),
      goals: joinList(goals)?.slice(0, 500),
      avatar_color: safeColor,
    });

    if (name?.trim()) {
      const safeName = String(name).trim().slice(0, 80);
      await Users.updateName(req.user.id, safeName);
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
