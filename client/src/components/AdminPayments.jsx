/**
 * AdminPayments — full-page admin panel for reviewing payment submissions.
 *
 * Routes used:
 *   GET  /api/payments              — list all requests (admin only)
 *   PUT  /api/payments/:id/approve  — approve + upgrade user plan
 *   PUT  /api/payments/:id/reject   — reject request
 *
 * The `note` field stores the TXID for crypto payments.
 * The `proof_url` field stores the screenshot path for JazzCash payments.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  CheckCircle, XCircle, Clock, RefreshCw, Loader2,
  CreditCard, Image, X, Search, AlertTriangle,
  TrendingUp, CheckCheck, Hash, User,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth }  from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { API_URL }  from '../config/api';

// ─────────────────────────────────────────────────────────────────────────────
// Badges
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_CFG = {
  pending:  { bg: 'rgba(245,158,11,0.12)',  color: '#fbbf24', border: 'rgba(245,158,11,0.3)',  icon: <Clock size={10} /> },
  verified: { bg: 'rgba(16,185,129,0.12)',  color: '#10B981', border: 'rgba(16,185,129,0.3)',  icon: <CheckCircle size={10} /> },
  rejected: { bg: 'rgba(239,68,68,0.10)',   color: '#f87171', border: 'rgba(239,68,68,0.25)',  icon: <XCircle size={10} /> },
};
function StatusBadge({ status }) {
  const s = STATUS_CFG[status] ?? STATUS_CFG.pending;
  const label = (status ?? 'PENDING').toUpperCase();
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 9px', borderRadius: 99, fontSize: 10, fontWeight: 800,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      letterSpacing: '0.05em',
    }}>
      {s.icon}{label}
    </span>
  );
}

const PLAN_CFG = {
  pro:   { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
  elite: { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
};
function PlanBadge({ plan }) {
  const s = PLAN_CFG[plan?.toLowerCase()] ?? PLAN_CFG.pro;
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 800,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      textTransform: 'uppercase', letterSpacing: '0.04em',
    }}>
      {plan ?? '—'}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Screenshot lightbox
// ─────────────────────────────────────────────────────────────────────────────
function Lightbox({ src, onClose }) {
  const overlay = useRef(null);
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      ref={overlay}
      onClick={e => { if (e.target === overlay.current) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
        <img
          src={src}
          alt="Payment proof"
          style={{ maxWidth: '90vw', maxHeight: '88vh', borderRadius: 12, objectFit: 'contain', boxShadow: '0 25px 80px rgba(0,0,0,0.7)' }}
        />
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: -14, right: -14,
            width: 30, height: 30, borderRadius: '50%',
            background: 'rgba(30,30,40,0.95)', color: '#e5e7eb',
            border: '1px solid rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function fmtDate(s) {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return s; }
}
function fmtTime(s) {
  if (!s) return '';
  try {
    return new Date(s).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}
const isCrypto = method => /usdt|trc20|crypto|btc|eth/i.test(method ?? '');

// ─────────────────────────────────────────────────────────────────────────────
// Stat card
// ─────────────────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon, theme }) {
  return (
    <div
      className="rounded-xl border flex items-center gap-3 px-5 py-4"
      style={{ background: theme.surface, borderColor: theme.border, minWidth: 130 }}
    >
      <div style={{ padding: 8, borderRadius: 10, background: `${color}1a`, color, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: theme.text, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 11, color: theme.muted, marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton row
// ─────────────────────────────────────────────────────────────────────────────
function SkeletonRow({ theme }) {
  return (
    <tr>
      {[80, 60, 90, 70, 140, 80, 60, 90].map((w, i) => (
        <td key={i} className="px-4 py-3.5">
          <div style={{ height: 12, width: `${w}%`, borderRadius: 6, background: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />
        </td>
      ))}
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminPayments() {
  const theme      = useTheme();
  const { token }  = useAuth();
  const { toast }  = useToast();

  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [acting,   setActing]   = useState(null);   // id being acted on
  const [filter,   setFilter]   = useState('pending');
  const [search,   setSearch]   = useState('');
  const [lightbox, setLightbox] = useState(null);   // full URL of screenshot to preview

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${API_URL}/api/payments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed to load payment requests.');
      // Newest first
      const sorted = (d.requests ?? []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setRequests(sorted);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  // ── Action (approve / reject) ──────────────────────────────────────────────
  async function act(id, action) {
    setActing(id);
    const optimistic = action === 'approve' ? 'verified' : 'rejected';
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: optimistic } : r));

    try {
      const res = await fetch(`${API_URL}/api/payments/${id}/${action}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      if (!res.ok) {
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'pending' } : r));
        throw new Error(d.error || 'Action failed.');
      }
      setRequests(prev => prev.map(r => r.id === id ? { ...r, ...d.request } : r));
      toast.success(action === 'approve'
        ? 'Payment verified — user plan upgraded!'
        : 'Payment rejected.');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setActing(null);
    }
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const pendingCt  = requests.filter(r => r.status === 'pending').length;
  const approvedCt = requests.filter(r => r.status === 'verified').length;
  const rejectedCt = requests.filter(r => r.status === 'rejected').length;

  const searchLower = search.trim().toLowerCase();
  const displayed = requests.filter(r => {
    const matchFilter = filter === 'all' || r.status === filter;
    const matchSearch = !searchLower
      || [r.user_name, r.user_email, r.plan, r.method, r.note, String(r.user_id)]
          .some(v => v?.toLowerCase().includes(searchLower));
    return matchFilter && matchSearch;
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  const TABS = [
    { key: 'pending',  label: `Pending`,  count: pendingCt  },
    { key: 'verified',  label: `Verified`, count: approvedCt },
    { key: 'rejected', label: `Rejected`, count: rejectedCt },
    { key: 'all',      label: `All`,      count: requests.length },
  ];

  return (
    <div className="flex flex-col gap-5 w-full" style={{ color: theme.text }}>

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div style={{ padding: 10, borderRadius: 12, background: 'rgba(59,130,246,0.12)', color: '#3b82f6', display: 'flex' }}>
            <CreditCard size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: theme.text, margin: 0 }}>
              Payment Reviews
            </h1>
            <p style={{ fontSize: 12, color: theme.muted, margin: 0 }}>
              Approve or reject user payment submissions
            </p>
          </div>
        </div>

        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all disabled:opacity-50"
          style={{ background: theme.surface, border: `1px solid ${theme.border}`, color: theme.muted }}
        >
          <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* ── Stats row ───────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        <StatCard label="Pending"  value={loading ? '—' : pendingCt}        color="#fbbf24" icon={<Clock size={16} />}       theme={theme} />
        <StatCard label="Verified" value={loading ? '—' : approvedCt}       color="#10B981" icon={<CheckCheck size={16} />}  theme={theme} />
        <StatCard label="Rejected" value={loading ? '—' : rejectedCt}       color="#f87171" icon={<XCircle size={16} />}     theme={theme} />
        <StatCard label="Total"    value={loading ? '—' : requests.length}  color="#3b82f6" icon={<TrendingUp size={16} />}  theme={theme} />
      </div>

      {/* ── Main card ───────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ background: theme.surface, borderColor: theme.border }}
      >
        {/* Filter tabs + search bar */}
        <div
          className="flex items-center justify-between flex-wrap gap-3 px-5 py-3"
          style={{ borderBottom: `1px solid ${theme.border}` }}
        >
          {/* Tabs */}
          <div className="flex items-center gap-1">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold capitalize transition-all"
                style={{
                  background: filter === t.key ? 'rgba(59,130,246,0.12)' : 'transparent',
                  color:      filter === t.key ? '#60a5fa' : theme.muted,
                  border:     `1px solid ${filter === t.key ? 'rgba(59,130,246,0.3)' : 'transparent'}`,
                }}
              >
                {t.label}
                {t.count > 0 && (
                  <span style={{
                    minWidth: 16, height: 16, padding: '0 4px', borderRadius: 99,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 900,
                    background: filter === t.key ? 'rgba(59,130,246,0.2)' : (theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'),
                    color: filter === t.key ? '#93c5fd' : theme.muted,
                  }}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: theme.muted }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search user, plan, method…"
              className="pl-8 pr-3 py-1.5 rounded-lg text-[12px] outline-none transition-all"
              style={{
                background: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                border: `1px solid ${theme.border}`,
                color: theme.text,
                width: 220,
              }}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 mx-5 my-4 px-4 py-3 rounded-xl text-[12px]"
            style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: 800 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                {['ID', 'User', 'Plan', 'Method', 'Amount', 'TXID / Proof', 'Status', 'Date', 'Actions'].map(h => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: theme.muted, whiteSpace: 'nowrap' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} theme={theme} />)
                : displayed.length === 0
                  ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center" style={{ color: theme.muted, fontSize: 13 }}>
                        {error ? 'Could not load payments.' : `No ${filter !== 'all' ? filter : ''} payment requests.`}
                      </td>
                    </tr>
                  )
                  : displayed.map(req => {
                    const isActing  = acting === req.id;
                    const resolved  = req.status !== 'pending';
                    const crypto    = isCrypto(req.method);
                    const txid      = req.note ?? null;
                    const proofHref = req.proof_url ? `${API_URL}${req.proof_url}` : null;

                    return (
                      <tr
                        key={req.id}
                        style={{ borderBottom: `1px solid ${theme.border}` }}
                        onMouseEnter={e => (e.currentTarget.style.background = theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        {/* ID */}
                        <td className="px-4 py-3.5">
                          <span style={{ fontSize: 11, fontFamily: 'monospace', color: theme.muted }}># {req.id}</span>
                        </td>

                        {/* User */}
                        <td className="px-4 py-3.5" style={{ minWidth: 160 }}>
                          <div className="flex items-center gap-2">
                            <div style={{
                              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                              background: 'rgba(59,130,246,0.15)', color: '#60a5fa',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <User size={13} />
                            </div>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: theme.text, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {req.user_name ?? `User #${req.user_id}`}
                              </div>
                              <div style={{ fontSize: 10, color: theme.muted }}>
                                ID: {req.user_id}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Plan */}
                        <td className="px-4 py-3.5">
                          <PlanBadge plan={req.plan} />
                          {req.billing_cycle && (
                            <div style={{ fontSize: 10, color: theme.muted, marginTop: 3 }}>
                              {req.billing_cycle}
                            </div>
                          )}
                        </td>

                        {/* Method */}
                        <td className="px-4 py-3.5" style={{ minWidth: 120 }}>
                          <div style={{ fontSize: 12, color: theme.text, fontWeight: 500 }}>
                            {req.method ?? '—'}
                          </div>
                          <div style={{ fontSize: 10, color: crypto ? '#fbbf24' : '#a78bfa', marginTop: 2 }}>
                            {crypto ? 'Crypto' : 'Mobile Pay'}
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="px-4 py-3.5">
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#34d399' }}>
                            {req.amount ?? '—'}
                          </span>
                        </td>

                        {/* TXID / Proof screenshot */}
                        <td className="px-4 py-3.5" style={{ minWidth: 180, maxWidth: 240 }}>
                          {crypto && txid ? (
                            <div className="flex items-start gap-1.5">
                              <Hash size={11} style={{ color: '#fbbf24', marginTop: 2, flexShrink: 0 }} />
                              <div>
                                <div style={{ fontSize: 9, color: theme.muted, marginBottom: 2, letterSpacing: '0.05em', fontWeight: 700, textTransform: 'uppercase' }}>
                                  TXID
                                </div>
                                <code style={{
                                  fontSize: 10, color: '#fbbf24',
                                  background: 'rgba(245,158,11,0.08)',
                                  padding: '2px 5px', borderRadius: 4,
                                  display: 'block', wordBreak: 'break-all', lineHeight: 1.4,
                                  border: '1px solid rgba(245,158,11,0.15)',
                                  maxWidth: 200,
                                }}>
                                  {txid}
                                </code>
                              </div>
                            </div>
                          ) : proofHref ? (
                            <button
                              onClick={() => setLightbox(proofHref)}
                              title="View screenshot"
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                padding: '5px 10px', borderRadius: 8, cursor: 'pointer',
                                background: 'rgba(59,130,246,0.10)', color: '#60a5fa',
                                fontSize: 11, fontWeight: 600,
                                border: '1px solid rgba(59,130,246,0.2)',
                              }}
                            >
                              <Image size={12} />
                              View Screenshot
                            </button>
                          ) : (
                            <span style={{ fontSize: 12, color: theme.muted }}>—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5"><StatusBadge status={req.status} /></td>

                        {/* Date */}
                        <td className="px-4 py-3.5" style={{ minWidth: 100 }}>
                          <div style={{ fontSize: 11, color: theme.text }}>{fmtDate(req.created_at)}</div>
                          <div style={{ fontSize: 10, color: theme.muted }}>{fmtTime(req.created_at)}</div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5">
                          {resolved ? (
                            <span style={{ fontSize: 11, color: theme.muted }}>—</span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              {/* Approve */}
                              <button
                                onClick={() => act(req.id, 'approve')}
                                disabled={isActing}
                                title="Approve & upgrade plan"
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all disabled:opacity-40"
                                style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981', border: '1px solid rgba(16,185,129,0.25)' }}
                                onMouseEnter={e => { if (!isActing) e.currentTarget.style.background = 'rgba(16,185,129,0.24)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.12)'; }}
                              >
                                {isActing
                                  ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
                                  : <CheckCircle size={11} />}
                                Approve
                              </button>

                              {/* Reject */}
                              <button
                                onClick={() => act(req.id, 'reject')}
                                disabled={isActing}
                                title="Reject payment"
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all disabled:opacity-40"
                                style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
                                onMouseEnter={e => { if (!isActing) e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                              >
                                <XCircle size={11} />
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
              }
            </tbody>
          </table>
        </div>

        {/* Footer note */}
        {!loading && pendingCt > 0 && (
          <div
            className="flex items-center gap-2 px-5 py-3 text-[11px]"
            style={{ borderTop: `1px solid ${theme.border}`, color: theme.muted }}
          >
            <AlertTriangle size={12} style={{ color: '#fbbf24' }} />
            Approving a request automatically upgrades the user's plan and sets an expiry date (1 month or 1 year based on billing cycle).
          </div>
        )}
      </div>

      {/* Screenshot lightbox */}
      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}
