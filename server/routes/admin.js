import { Router } from 'express';
import * as Users from '../db/users.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

function toUtcDateKey(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

// All admin routes require authentication + admin role
router.use(requireAuth, requireAdmin);

// ── GET /api/admin/users ──────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const users = await Users.findAll();
    res.json({ users });
  } catch (err) {
    console.error('admin/users error:', err);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// ── POST /api/admin/users/:id/plan ────────────────────────────────────────
router.post('/users/:id/plan', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { plan, expiresAt = null } = req.body;
    const validPlans = ['free', 'pro', 'elite'];
    if (!validPlans.includes(plan))
      return res.status(400).json({ error: `Invalid plan. Must be one of: ${validPlans.join(', ')}` });

    await Users.updateUserPlan(id, plan, expiresAt);
    const row = await Users.findById(id);
    if (!row) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: row });
  } catch (err) {
    console.error('admin/set-plan error:', err);
    res.status(500).json({ error: 'Failed to update plan.' });
  }
});

// ── POST /api/admin/users/:id/admin ───────────────────────────────────────
router.post('/users/:id/admin', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { isAdmin } = req.body;
    if (typeof isAdmin !== 'boolean' && isAdmin !== 0 && isAdmin !== 1)
      return res.status(400).json({ error: 'isAdmin must be true/false or 1/0.' });

    await Users.setAdmin(id, isAdmin ? 1 : 0);
    const row = await Users.findById(id);
    if (!row) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: row });
  } catch (err) {
    console.error('admin/set-admin error:', err);
    res.status(500).json({ error: 'Failed to update admin status.' });
  }
});

// ── DELETE /api/admin/users/:id ───────────────────────────────────────────
router.delete('/users/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    // Prevent self-deletion
    if (id === req.user.id)
      return res.status(400).json({ error: 'Cannot delete your own account via admin API.' });

    const existing = await Users.findById(id);
    if (!existing) return res.status(404).json({ error: 'User not found.' });

    await Users.deleteUser(id);
    res.json({ success: true });
  } catch (err) {
    console.error('admin/delete-user error:', err);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

// ── POST /api/admin/users/:id/reset-tries ───────────────────────────────
router.post('/users/:id/reset-tries', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await Users.findById(id);
    if (!existing) return res.status(404).json({ error: 'User not found.' });
    await Users.resetTries(id);
    const row = await Users.findById(id);
    res.json({ user: row });
  } catch (err) {
    console.error('admin/reset-tries error:', err);
    res.status(500).json({ error: 'Failed to reset tries.' });
  }
});

// ── GET /api/admin/stats ──────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const users = await Users.findAll();

    // Timezone-agnostic day boundaries in UTC
    const now     = new Date();
    const todayStr = now.toISOString().slice(0, 10);                // "YYYY-MM-DD"
    const weekAgo  = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const todaySignups = users.filter(u => toUtcDateKey(u.created_at) === todayStr).length;
    const weekSignups  = users.filter(u => {
      if (!u.created_at) return false;
      const createdAt = u.created_at instanceof Date ? u.created_at : new Date(u.created_at);
      return !Number.isNaN(createdAt.getTime()) && createdAt >= weekAgo;
    }).length;

    // Signup chart: last 30 days, one entry per day
    const days = 30;
    const dayMap = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setUTCDate(d.getUTCDate() - i);
      dayMap[d.toISOString().slice(0, 10)] = 0;
    }
    users.forEach(u => {
      const day = toUtcDateKey(u.created_at);
      if (!day) return;
      if (day in dayMap) dayMap[day]++;
    });
    const signupsByDay = Object.entries(dayMap).map(([date, count]) => ({
      date,
      label: new Date(date + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
      count,
    }));

    res.json({
      totalUsers:   users.length,
      freeUsers:    users.filter(u => u.plan === 'free').length,
      proUsers:     users.filter(u => u.plan === 'pro').length,
      eliteUsers:   users.filter(u => u.plan === 'elite').length,
      adminUsers:   users.filter(u => u.is_admin === 1).length,
      todaySignups,
      weekSignups,
      signupsByDay,
    });
  } catch (err) {
    console.error('admin/stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

// ── GET /api/admin/export-emails ─────────────────────────────────────────
router.get('/export-emails', async (req, res) => {
  try {
    const users = await Users.findAll();

    // Build CSV — escape any commas / quotes in field values
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const header = 'email,name,plan,created_at,ai_tries,screenshot_tries';
    const rows = users.map(u =>
      [u.email, u.name, u.plan ?? 'free', u.created_at ?? '', u.ai_analysis_tries ?? 0, u.screenshot_tries ?? 0]
        .map(esc).join(',')
    );
    const csv = [header, ...rows].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="users-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error('admin/export-emails error:', err);
    res.status(500).json({ error: 'Failed to export users.' });
  }
});

export default router;
