import { Router } from 'express';
import * as Users from '../db/users.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

// All admin routes require authentication + admin role
router.use(requireAuth, requireAdmin);

// ── GET /api/admin/users ──────────────────────────────────────────────────
router.get('/users', (req, res) => {
  try {
    const users = Users.findAll();
    res.json({ users });
  } catch (err) {
    console.error('admin/users error:', err);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// ── POST /api/admin/users/:id/plan ────────────────────────────────────────
router.post('/users/:id/plan', (req, res) => {
  try {
    const id = Number(req.params.id);
    const { plan, expiresAt = null } = req.body;
    const validPlans = ['free', 'pro', 'elite'];
    if (!validPlans.includes(plan))
      return res.status(400).json({ error: `Invalid plan. Must be one of: ${validPlans.join(', ')}` });

    Users.updateUserPlan(id, plan, expiresAt);
    const row = Users.findById(id);
    if (!row) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: row });
  } catch (err) {
    console.error('admin/set-plan error:', err);
    res.status(500).json({ error: 'Failed to update plan.' });
  }
});

// ── POST /api/admin/users/:id/admin ───────────────────────────────────────
router.post('/users/:id/admin', (req, res) => {
  try {
    const id = Number(req.params.id);
    const { isAdmin } = req.body;
    if (typeof isAdmin !== 'boolean' && isAdmin !== 0 && isAdmin !== 1)
      return res.status(400).json({ error: 'isAdmin must be true/false or 1/0.' });

    Users.setAdmin(id, isAdmin ? 1 : 0);
    const row = Users.findById(id);
    if (!row) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: row });
  } catch (err) {
    console.error('admin/set-admin error:', err);
    res.status(500).json({ error: 'Failed to update admin status.' });
  }
});

// ── DELETE /api/admin/users/:id ───────────────────────────────────────────
router.delete('/users/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    // Prevent self-deletion
    if (id === req.user.id)
      return res.status(400).json({ error: 'Cannot delete your own account via admin API.' });

    const existing = Users.findById(id);
    if (!existing) return res.status(404).json({ error: 'User not found.' });

    Users.deleteUser(id);
    res.json({ success: true });
  } catch (err) {
    console.error('admin/delete-user error:', err);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

// ── POST /api/admin/users/:id/reset-tries ───────────────────────────────
router.post('/users/:id/reset-tries', (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = Users.findById(id);
    if (!existing) return res.status(404).json({ error: 'User not found.' });
    Users.resetTries(id);
    const row = Users.findById(id);
    res.json({ user: row });
  } catch (err) {
    console.error('admin/reset-tries error:', err);
    res.status(500).json({ error: 'Failed to reset tries.' });
  }
});

// ── GET /api/admin/stats ──────────────────────────────────────────────────
router.get('/stats', (req, res) => {
  try {
    const users = Users.findAll();
    const stats = {
      totalUsers:  users.length,
      freeUsers:   users.filter(u => u.plan === 'free').length,
      proUsers:    users.filter(u => u.plan === 'pro').length,
      eliteUsers:  users.filter(u => u.plan === 'elite').length,
      adminUsers:  users.filter(u => u.is_admin === 1).length,
    };
    res.json(stats);
  } catch (err) {
    console.error('admin/stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

export default router;
