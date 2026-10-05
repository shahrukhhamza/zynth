import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import * as Users from '../db/users.js';
import { signToken, requireAuth, requireAdmin } from '../middleware/authMiddleware.js';
import * as Codes from '../db/emailCodes.js';
import { isAdminEmail } from '../services/admins.js';
import {
  sendVerificationCodeEmail, sendPasswordResetCodeEmail, verificationEnabled, canDeliver, usesConsoleFallback,
} from '../services/emailService.js';
import {
  generateCode, hashCode, hashToken, newToken, safeEqual, isValidCodeFormat, maskEmail,
  CODE_TTL_MINUTES, MAX_ATTEMPTS, RESEND_COOLDOWN_SECONDS, MAX_SENDS_PER_HOUR,
} from '../services/otp.js';
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

const normalizeEmail = (v) => String(v || '').trim().toLowerCase();

/** Owner emails (ADMIN_EMAILS) get the admin role once they have proven the address by signing in. */
async function ensureAdminRole(row) {
  if (row?.id && isAdminEmail(row.email) && Number(row.is_admin) !== 1) {
    await Users.setAdmin(row.id, 1);
  }
}

/**
 * Issue (or re-issue) a 6-digit code for (email, purpose) and email it.
 * Enforces a resend cooldown and an hourly cap. Returns { sent, code?, retryAfter?, limited? }.
 */
async function sendCode({ email, purpose, name, payload }) {
  const existing = await Codes.getCode(email, purpose);
  if (existing) {
    const elapsed = (Date.now() - new Date(existing.last_sent_at).getTime()) / 1000;
    if (elapsed < RESEND_COOLDOWN_SECONDS) {
      // The earlier code is still valid; just keep the latest form details.
      if (payload) await Codes.updatePayload(existing.id, payload);
      return { sent: false, retryAfter: Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed) };
    }
    const sameHour = Date.now() - new Date(existing.first_sent_at).getTime() < 3_600_000;
    if (sameHour && existing.sends >= MAX_SENDS_PER_HOUR) return { sent: false, limited: true };
  }

  const code = generateCode();
  await Codes.upsertCode({ email, purpose, codeHash: hashCode(email, purpose, code), payload, ttlMinutes: CODE_TTL_MINUTES });
  if (Math.random() < 0.02) Codes.purgeExpired().catch(() => {});

  const mail = purpose === 'signup' ? sendVerificationCodeEmail : sendPasswordResetCodeEmail;
  await mail(email, name, code, CODE_TTL_MINUTES);
  return { sent: true, code };
}

/** Check a submitted code against a stored row. Returns { ok } or { status, body } describing the failure. */
async function checkCode(row, email, purpose, code) {
  if (!row || new Date(row.expires_at) < new Date())
    return { status: 400, body: { error: 'This code has expired. Request a new one.', code: 'CODE_EXPIRED' } };
  if (row.attempts >= MAX_ATTEMPTS)
    return { status: 429, body: { error: 'Too many incorrect attempts. Request a new code.', code: 'TOO_MANY_ATTEMPTS' } };
  if (!safeEqual(hashCode(email, purpose, code), row.code_hash)) {
    const used = await Codes.bumpAttempts(row.id);
    const left = Math.max(0, MAX_ATTEMPTS - used);
    return {
      status: 400,
      body: {
        error: left > 0 ? `Incorrect code. ${left} attempt${left === 1 ? '' : 's'} left.` : 'Too many incorrect attempts. Request a new code.',
        code: left > 0 ? 'BAD_CODE' : 'TOO_MANY_ATTEMPTS',
        attemptsLeft: left,
      },
    };
  }
  return { ok: true };
}

async function finishSignup({ name, email, password_hash, emailVerified = false }) {
  const result = await Users.createUser({
    name,
    email,
    password_hash,
    terms_accepted: 1,
    terms_accepted_at: new Date().toISOString(),
  });
  if (emailVerified) await ensureAdminRole({ id: result.id, email });
  const row = await Users.findById(result.id);
  const user = buildUser(row);
  const token = signToken(user);
  trackEvent(result.id, 'user_signup', { name, email });
  return { user, token };
}

// ── POST /api/auth/register ────────────────────────────────────────────────
// With email verification on, this only validates the form and emails a 6-digit code; the account is
// created by POST /register/verify once the address is proven. With it off, the account is created at once.
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, terms_accepted } = req.body;
    const safeName = String(name || '').trim();
    const safeEmail = normalizeEmail(email);

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

    if (!verificationEnabled()) {
      const { user, token } = await finishSignup({ name: safeName, email: safeEmail, password_hash });
      return res.status(201).json({ user, token });
    }

    if (!canDeliver())
      return res.status(503).json({ error: 'Email verification is temporarily unavailable. Please try again shortly.' });

    let result;
    try {
      result = await sendCode({ email: safeEmail, purpose: 'signup', name: safeName, payload: { name: safeName, password_hash } });
    } catch (mailErr) {
      console.error('[signup] verification email failed:', JSON.stringify(mailErr.response?.data ?? mailErr.message));
      return res.status(502).json({ error: 'We could not send the verification email. Please check the address and try again.' });
    }
    if (result.limited)
      return res.status(429).json({ error: 'Too many codes requested for this email. Please try again in an hour.' });

    res.json({
      verification_required: true,
      email: safeEmail,
      maskedEmail: maskEmail(safeEmail),
      expiresInMinutes: CODE_TTL_MINUTES,
      resendAfter: result.retryAfter ?? RESEND_COOLDOWN_SECONDS,
      ...(result.sent && usesConsoleFallback() ? { devCode: result.code } : {}),
    });
  } catch (err) {
    console.error('Register error:', err?.message || 'unknown');
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// ── POST /api/auth/register/verify ─────────────────────────────────────────
router.post('/register/verify', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const code = String(req.body?.code ?? '').trim();
    if (!email || !isValidCodeFormat(code))
      return res.status(400).json({ error: 'Enter the 6-digit code from your email.', code: 'BAD_FORMAT' });

    const row = await Codes.getCode(email, 'signup');
    const check = await checkCode(row, email, 'signup', code);
    if (!check.ok) return res.status(check.status).json(check.body);

    // The address could have been registered (e.g. via Google) while the code was pending.
    if (await Users.findByEmail(email)) {
      await Codes.deleteCode(row.id);
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const { name, password_hash } = row.payload || {};
    if (!name || !password_hash)
      return res.status(400).json({ error: 'Your sign-up session expired. Please start again.', code: 'NO_PENDING' });

    const { user, token } = await finishSignup({ name, email, password_hash, emailVerified: true });
    await Codes.deleteCode(row.id);
    res.status(201).json({ user, token });
  } catch (err) {
    console.error('register/verify error:', err?.message || 'unknown');
    res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
});

// ── POST /api/auth/register/resend ─────────────────────────────────────────
router.post('/register/resend', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const row = email ? await Codes.getCode(email, 'signup') : null;
    if (!row?.payload?.name)
      return res.status(400).json({ error: 'Your sign-up session expired. Please start again.', code: 'NO_PENDING' });

    let result;
    try {
      result = await sendCode({ email, purpose: 'signup', name: row.payload.name });
    } catch (mailErr) {
      console.error('[signup] resend email failed:', JSON.stringify(mailErr.response?.data ?? mailErr.message));
      return res.status(502).json({ error: 'We could not send the email. Please try again.' });
    }
    if (result.limited)
      return res.status(429).json({ error: 'Too many codes requested for this email. Please try again in an hour.' });
    if (!result.sent)
      return res.status(429).json({ error: `Please wait ${result.retryAfter}s before requesting another code.`, retryAfter: result.retryAfter });

    res.json({
      sent: true,
      expiresInMinutes: CODE_TTL_MINUTES,
      resendAfter: RESEND_COOLDOWN_SECONDS,
      ...(usesConsoleFallback() ? { devCode: result.code } : {}),
    });
  } catch (err) {
    console.error('register/resend error:', err?.message || 'unknown');
    res.status(500).json({ error: 'Could not resend the code. Please try again.' });
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

    await ensureAdminRole(row);
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

    if (emailVerified) await ensureAdminRole(row);
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
// Emails a 6-digit code. The reply is the same whether or not the account exists.
router.post('/forgot-password', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!email || typeof req.body?.email !== 'string')
      return res.status(400).json({ error: 'Email is required.' });

    if (!canDeliver())
      return res.status(503).json({ error: 'Password reset by email is not available right now. Please contact support@zynth.com.' });

    const reply = {
      message: 'If an account exists for this email, a 6-digit code is on its way.',
      expiresInMinutes: CODE_TTL_MINUTES,
      resendAfter: RESEND_COOLDOWN_SECONDS,
    };

    const row = await Users.findByEmail(email);
    if (row) {
      try {
        const result = await sendCode({ email, purpose: 'reset', name: row.name });
        if (result.sent && usesConsoleFallback()) reply.devCode = result.code;
      } catch (mailErr) {
        // Never surface mail failures: an error only for existing accounts would reveal which emails are registered.
        console.error('forgot-password email failed:', JSON.stringify(mailErr.response?.data ?? mailErr.message));
      }
    }
    res.json(reply);
  } catch (err) {
    console.error('forgot-password error:', err.message);
    res.status(500).json({ error: 'Failed to process request. Please try again.' });
  }
});

// ── POST /api/auth/reset-password/verify ──────────────────────────────────
// Step 2: prove the code, receive a short-lived token for the final "set password" step.
router.post('/reset-password/verify', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const code = String(req.body?.code ?? '').trim();
    if (!email || !isValidCodeFormat(code))
      return res.status(400).json({ error: 'Enter the 6-digit code from your email.', code: 'BAD_FORMAT' });

    const row = await Codes.getCode(email, 'reset');
    const check = await checkCode(row, email, 'reset', code);
    if (!check.ok) return res.status(check.status).json(check.body);

    const resetToken = newToken();
    await Codes.markVerified(row.id, hashToken(resetToken), 15);
    res.json({ resetToken, expiresInMinutes: 15 });
  } catch (err) {
    console.error('reset-password/verify error:', err?.message || 'unknown');
    res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
});

// ── POST /api/auth/reset-password ─────────────────────────────────────────
// Step 3: set the new password using the token from step 2.
router.post('/reset-password', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const { resetToken, newPassword } = req.body || {};

    if (!email || typeof resetToken !== 'string' || typeof newPassword !== 'string' || !resetToken || !newPassword)
      return res.status(400).json({ error: 'Email, reset token and new password are required.' });

    if (newPassword.length > MAX_PASSWORD_LENGTH)
      return res.status(400).json({ error: `Password must be at most ${MAX_PASSWORD_LENGTH} characters.` });

    if (newPassword.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });

    const row = await Codes.getCode(email, 'reset');
    const expired = !row || !row.verified_token_hash || new Date(row.expires_at) < new Date();
    if (expired || !safeEqual(hashToken(resetToken), row.verified_token_hash))
      return res.status(400).json({ error: 'Your reset session expired. Please start again.', code: 'NO_PENDING' });

    const user = await Users.findByEmail(email);
    if (!user) return res.status(400).json({ error: 'Your reset session expired. Please start again.', code: 'NO_PENDING' });

    const password_hash = await bcrypt.hash(newPassword, 12);
    await Users.setPassword(user.id, password_hash);
    await Codes.deleteCode(row.id);

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('reset-password error:', err?.message || 'unknown');
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
