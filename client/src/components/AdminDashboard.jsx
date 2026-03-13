import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  Users, Crown, Trash2, Search, RefreshCw,
  DollarSign, Zap, Shield, X, TrendingUp, Download, CalendarDays, CalendarCheck,
} from 'lucide-react';

/* ── helpers ─────────────────────────────────────────────────────── */
const PLAN_BADGE = {
  free:  { bg: 'rgba(107,114,128,0.15)', color: '#9ca3af', border: 'rgba(107,114,128,0.25)' },
  pro:   { bg: 'rgba(16,185,129,0.15)',  color: '#34d399', border: 'rgba(16,185,129,0.35)'  },
  elite: { bg: 'rgba(245,158,11,0.15)',  color: '#fbbf24', border: 'rgba(245,158,11,0.35)'  },
};

function fmtDate(str) {
  if (!str) return '—';
  try {
    return new Date(str).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch { return str; }
}

function InlinePlanBadge({ plan }) {
  const s = PLAN_BADGE[plan] || PLAN_BADGE.free;
  return (
    <span
      className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {(plan || 'free').toUpperCase()}
    </span>
  );
}

/* ── inner component — all hooks here, auth guard is in wrapper ─── */
function AdminDashboardInner() {
  const theme = useTheme();
  const { token } = useAuth();

  const [stats, setStats]               = useState(null);
  const [users, setUsers]               = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [search, setSearch]             = useState('');
  const [mutating, setMutating]         = useState(null);   // userId being mutated
  const [deleteTarget, setDeleteTarget] = useState(null);   // userId awaiting confirm
  const [toast, setToast]               = useState(null);   // { type:'ok'|'err', text }
  const [qa, setQa]                     = useState({ pro: '', elite: '', reset: '' });
  const [qaLoading, setQaLoading]       = useState('');

  const authH = useCallback(
    () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }),
    [token],
  );

  function showToast(type, text) {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  }

  /* ── data fetching ─────────────────────────────────────────────── */
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/admin/stats`, { headers: authH() });
      if (!r.ok) throw new Error('Failed to load stats');
      setStats(await r.json());
    } catch (e) { showToast('err', e.message); }
    finally { setStatsLoading(false); }
  }, [authH]);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/admin/users`, { headers: authH() });
      if (!r.ok) throw new Error('Failed to load users');
      const d = await r.json();
      setUsers(d.users || []);
    } catch (e) { showToast('err', e.message); }
    finally { setUsersLoading(false); }
  }, [authH]);

  useEffect(() => { loadStats(); loadUsers(); }, [loadStats, loadUsers]);

  /* ── mutations ─────────────────────────────────────────────────── */
  async function changePlan(userId, plan) {
    setMutating(userId);
    try {
      const r = await fetch(`${API_URL}/api/admin/users/${userId}/plan`, {
        method: 'POST', headers: authH(), body: JSON.stringify({ plan }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setUsers(us => us.map(u => u.id === userId ? d.user : u));
      showToast('ok', `Plan updated → ${plan}`);
      loadStats();
    } catch (e) { showToast('err', e.message); }
    finally { setMutating(null); }
  }

  async function toggleAdmin(userId, currentIsAdmin) {
    setMutating(userId);
    try {
      const r = await fetch(`${API_URL}/api/admin/users/${userId}/admin`, {
        method: 'POST', headers: authH(),
        body: JSON.stringify({ isAdmin: currentIsAdmin !== 1 }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setUsers(us => us.map(u => u.id === userId ? d.user : u));
      showToast('ok', currentIsAdmin === 1 ? 'Admin revoked' : 'Admin granted');
    } catch (e) { showToast('err', e.message); }
    finally { setMutating(null); }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setMutating(deleteTarget);
    try {
      const r = await fetch(`${API_URL}/api/admin/users/${deleteTarget}`, {
        method: 'DELETE', headers: authH(),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setUsers(us => us.filter(u => u.id !== deleteTarget));
      setDeleteTarget(null);
      showToast('ok', 'User deleted');
      loadStats();
    } catch (e) { showToast('err', e.message); setDeleteTarget(null); }
    finally { setMutating(null); }
  }

  async function quickAction(type) {
    const email = qa[type].trim().toLowerCase();
    if (!email) { showToast('err', 'Enter an email address'); return; }
    const target = users.find(u => u.email?.toLowerCase() === email);
    if (!target) { showToast('err', `No user found: ${email}`); return; }
    setQaLoading(type);
    try {
      const isReset = type === 'reset';
      const url = isReset
        ? `${API_URL}/api/admin/users/${target.id}/reset-tries`
        : `${API_URL}/api/admin/users/${target.id}/plan`;
      const body = isReset ? {} : { plan: type };
      const r = await fetch(url, { method: 'POST', headers: authH(), body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setUsers(us => us.map(u => u.id === target.id ? d.user : u));
      setQa(q => ({ ...q, [type]: '' }));
      showToast('ok', isReset ? 'Tries reset to 0' : `${email} is now ${type}`);
      if (!isReset) loadStats();
    } catch (e) { showToast('err', e.message); }
    finally { setQaLoading(''); }
  }

  /* ── derived ───────────────────────────────────────────────────── */
  const filtered = users.filter(u => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  const estRevenue = stats ? stats.proUsers * 9 + stats.eliteUsers * 25 : 0;

  async function exportCSV() {
    try {
      const r = await fetch(`${API_URL}/api/admin/export-emails`, { headers: authH() });
      if (!r.ok) throw new Error('Export failed');
      const blob = await r.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { showToast('err', e.message); }
  }

  const STAT_CARDS = [
    { label: 'Total Signups', value: stats?.totalUsers  ?? '—', color: '#60a5fa', Icon: Users         },
    { label: 'Today',        value: stats?.todaySignups ?? '—', color: '#34d399', Icon: CalendarCheck  },
    { label: 'This Week',    value: stats?.weekSignups  ?? '—', color: '#a78bfa', Icon: CalendarDays   },
    { label: 'Pro Users',    value: stats?.proUsers     ?? '—', color: '#10b981', Icon: Zap            },
    { label: 'Elite Users',  value: stats?.eliteUsers   ?? '—', color: '#fbbf24', Icon: Crown          },
    { label: 'Free Users',   value: stats?.freeUsers    ?? '—', color: '#9ca3af', Icon: Shield         },
    { label: 'Est. Revenue', value: stats ? `$${estRevenue}/mo` : '—', color: '#f59e0b', Icon: DollarSign },
  ];

  const QA_ACTIONS = [
    { key: 'pro',   label: 'Grant Pro',   btnBg: 'linear-gradient(135deg,#059669,#0d9488)' },
    { key: 'elite', label: 'Grant Elite', btnBg: 'linear-gradient(135deg,#d97706,#b45309)' },
    { key: 'reset', label: 'Reset Tries', btnBg: 'linear-gradient(135deg,#3b82f6,#6366f1)' },
  ];

  /* ── render ────────────────────────────────────────────────────── */
  return (
    <div className="flex-1 overflow-y-auto" style={{ background: theme.bg, color: theme.text }}>

      {/* Toast notification */}
      {toast && (
        <div
          className="fixed top-20 right-6 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl text-[13px] font-semibold border"
          style={{
            background:  toast.type === 'ok' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
            borderColor: toast.type === 'ok' ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)',
            color:       toast.type === 'ok' ? '#34d399' : '#f87171',
          }}
        >
          {toast.type === 'ok' ? <TrendingUp className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {toast.text}
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6 space-y-6">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Crown className="w-5 h-5" style={{ color: '#a78bfa' }} />
              <h1 className="text-[22px] font-extrabold" style={{ color: theme.text }}>
                Admin Dashboard
              </h1>
            </div>
            <p className="text-[13px]" style={{ color: theme.muted }}>
              Manage users, plans and platform settings
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold border transition-all hover:brightness-110"
              style={{ background: 'rgba(16,185,129,0.10)', color: '#34d399', borderColor: 'rgba(16,185,129,0.3)' }}
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={() => { loadStats(); loadUsers(); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold border transition-all hover:brightness-110"
              style={{ background: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: theme.text, borderColor: theme.border }}
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-3">
          {STAT_CARDS.map(({ label, value, color, Icon }) => (
            <div key={label} className="rounded-2xl p-4 border" style={{ background: theme.surface, borderColor: theme.border }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider truncate pr-1" style={{ color: theme.muted }}>{label}</span>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                </div>
              </div>
              {statsLoading
                ? <div className="h-8 w-14 rounded-lg animate-pulse" style={{ background: theme.border }} />
                : <p className="text-[24px] font-extrabold" style={{ color }}>{value}</p>
              }
            </div>
          ))}
        </div>

        {/* Signup chart — last 30 days */}
        <div className="rounded-2xl border p-5" style={{ background: theme.surface, borderColor: theme.border }}>
          <h2 className="text-[14px] font-bold mb-4" style={{ color: theme.text }}>New Signups — Last 30 Days</h2>
          {statsLoading ? (
            <div className="h-40 rounded-xl animate-pulse" style={{ background: theme.border }} />
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={stats?.signupsByDay ?? []} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fill: theme.muted, fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval={4}
                />
                <YAxis
                  tick={{ fill: theme.muted, fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
                  contentStyle={{
                    background: theme.surface2 ?? theme.surface,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 10,
                    fontSize: 12,
                    color: theme.text,
                  }}
                  formatter={(v) => [v, 'Signups']}
                  labelFormatter={(l) => l}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={28}>
                  {(stats?.signupsByDay ?? []).map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.count > 0 ? '#10b981' : (theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)')}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Main layout: table + quick actions */}
        <div className="flex flex-col xl:flex-row gap-6 items-start">

          {/* ── Users table ─────────────────────────────────────── */}
          <div className="flex-1 min-w-0 rounded-2xl border overflow-hidden" style={{ background: theme.surface, borderColor: theme.border }}>

            {/* Table toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b" style={{ borderColor: theme.border }}>
              <h2 className="text-[15px] font-bold" style={{ color: theme.text }}>Users</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: theme.muted }} />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search name or email…"
                  className="pl-9 pr-4 py-2 rounded-xl text-[13px] border focus:outline-none"
                  style={{ background: theme.bg, borderColor: theme.border, color: theme.text, width: '220px' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#10b981')}
                  onBlur={e => (e.currentTarget.style.borderColor = theme.border)}
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                    {['User', 'Plan', 'AI Tries', 'SS Tries', 'Joined', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: theme.muted }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {usersLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${theme.border}` }}>
                        {[160, 70, 50, 50, 90, 130].map((w, j) => (
                          <td key={j} className="px-4 py-3.5">
                            <div className="h-4 rounded-lg animate-pulse" style={{ background: theme.border, width: w }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-[13px]" style={{ color: theme.muted }}>
                        {search ? 'No users match your search.' : 'No users found.'}
                      </td>
                    </tr>
                  ) : filtered.map(u => {
                    const isAdminUser  = u.is_admin === 1;
                    const isMutating   = mutating === u.id;
                    const isDeleteConf = deleteTarget === u.id;
                    const rowBaseBg    = isAdminUser
                      ? (theme.isDark ? 'rgba(139,92,246,0.06)' : 'rgba(139,92,246,0.04)')
                      : 'transparent';

                    return (
                      <tr
                        key={u.id}
                        style={{ background: rowBaseBg, borderBottom: `1px solid ${theme.border}`, opacity: isMutating ? 0.5 : 1, transition: 'background 0.15s, opacity 0.15s' }}
                        onMouseEnter={e => { if (!isAdminUser) e.currentTarget.style.background = theme.isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.025)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = rowBaseBg; }}
                      >
                        {/* User */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                              style={{ background: isAdminUser ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : 'linear-gradient(135deg,#3b82f6,#6366f1)' }}
                            >
                              {u.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-[13px] flex items-center gap-1" style={{ color: theme.text }}>
                                <span className="truncate" style={{ maxWidth: 110 }}>{u.name}</span>
                                {isAdminUser && <Crown className="w-3 h-3 flex-shrink-0" style={{ color: '#a78bfa' }} />}
                              </div>
                              <div className="text-[11px] truncate" style={{ color: theme.muted, maxWidth: 160 }}>{u.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Plan */}
                        <td className="px-4 py-3"><InlinePlanBadge plan={u.plan} /></td>

                        {/* AI Tries */}
                        <td className="px-4 py-3 text-[12px]">
                          <span style={{ color: (u.ai_analysis_tries ?? 0) >= 3 ? '#f87171' : theme.muted }}>
                            {u.ai_analysis_tries ?? 0}/3
                          </span>
                        </td>

                        {/* Screenshot Tries */}
                        <td className="px-4 py-3 text-[12px]">
                          <span style={{ color: (u.screenshot_tries ?? 0) >= 2 ? '#f87171' : theme.muted }}>
                            {u.screenshot_tries ?? 0}/2
                          </span>
                        </td>

                        {/* Joined */}
                        <td className="px-4 py-3 whitespace-nowrap text-[12px]" style={{ color: theme.muted }}>
                          {fmtDate(u.created_at)}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          {isDeleteConf ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-semibold" style={{ color: '#f87171' }}>Delete?</span>
                              <button
                                onClick={confirmDelete}
                                disabled={isMutating}
                                className="px-2 py-1 rounded-lg text-[11px] font-bold text-white"
                                style={{ background: '#dc2626' }}
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setDeleteTarget(null)}
                                className="px-2 py-1 rounded-lg text-[11px] font-semibold"
                                style={{ background: theme.border, color: theme.text }}
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              {/* Plan select */}
                              <select
                                value={u.plan || 'free'}
                                onChange={e => changePlan(u.id, e.target.value)}
                                disabled={isMutating}
                                className="text-[11px] rounded-lg px-2 py-1.5 border cursor-pointer focus:outline-none"
                                style={{ background: theme.bg, color: theme.text, borderColor: theme.border }}
                              >
                                <option value="free">Free</option>
                                <option value="pro">Pro</option>
                                <option value="elite">Elite</option>
                              </select>

                              {/* Crown — toggle admin */}
                              <button
                                onClick={() => toggleAdmin(u.id, u.is_admin)}
                                disabled={isMutating}
                                title={isAdminUser ? 'Revoke admin' : 'Grant admin'}
                                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                                style={{
                                  background: isAdminUser ? 'rgba(139,92,246,0.22)' : (theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
                                  color: isAdminUser ? '#a78bfa' : theme.muted,
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.3)'; e.currentTarget.style.color = '#c4b5fd'; }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.background = isAdminUser ? 'rgba(139,92,246,0.22)' : (theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)');
                                  e.currentTarget.style.color = isAdminUser ? '#a78bfa' : theme.muted;
                                }}
                              >
                                <Crown className="w-3.5 h-3.5" />
                              </button>

                              {/* Trash — delete */}
                              <button
                                onClick={() => setDeleteTarget(u.id)}
                                disabled={isMutating}
                                title="Delete user"
                                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                                style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer count */}
            {!usersLoading && (
              <div className="px-5 py-3 border-t text-[11px]" style={{ borderColor: theme.border, color: theme.muted }}>
                {search ? `${filtered.length} of ${users.length} users` : `${users.length} users total`}
              </div>
            )}
          </div>

          {/* ── Quick Actions panel ──────────────────────────────── */}
          <div
            className="xl:w-72 w-full rounded-2xl border p-5 space-y-5"
            style={{ background: theme.surface, borderColor: theme.border }}
          >
            <h2 className="text-[15px] font-bold" style={{ color: theme.text }}>Quick Actions</h2>
            {QA_ACTIONS.map(({ key, label, btnBg }) => (
              <div key={key}>
                <label className="text-[11px] font-semibold uppercase tracking-wider mb-2 block" style={{ color: theme.muted }}>
                  {label}
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={qa[key]}
                    onChange={e => setQa(q => ({ ...q, [key]: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') quickAction(key); }}
                    placeholder="user@email.com"
                    className="flex-1 min-w-0 px-3 py-2 rounded-xl text-[12px] border focus:outline-none"
                    style={{ background: theme.bg, borderColor: theme.border, color: theme.text }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#10b981')}
                    onBlur={e => (e.currentTarget.style.borderColor = theme.border)}
                  />
                  <button
                    onClick={() => quickAction(key)}
                    disabled={qaLoading === key}
                    className="px-3 py-2 rounded-xl text-[12px] font-bold text-white transition-all hover:brightness-110 disabled:opacity-50 whitespace-nowrap"
                    style={{ background: btnBg }}
                  >
                    {qaLoading === key ? '…' : label}
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}

/**
 * Auth guard wrapper.
 * AdminDashboard is lazily imported — it will NOT appear in the JS bundle
 * unless the parent (App.jsx) evaluates the lazy import, which only happens
 * when user.is_admin === 1 (enforced in AppShell before Suspense renders).
 * This component adds a second, redundant check so the inner component
 * never renders even if somehow reached with a non-admin token.
 */
export default function AdminDashboard() {
  const { user } = useAuth();
  if (!user || user.is_admin !== 1) return null;
  return <AdminDashboardInner />;
}
