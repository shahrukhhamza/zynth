/**
 * PaymentRequests — admin panel for reviewing manual payment submissions.
 *
 * Fetches GET /api/payments (admin-only) and allows approve / reject.
 * Proof screenshots are shown as thumbnails that open full-size in a new tab.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw, CheckCircle, XCircle, Clock, Image, Loader2, ChevronDown, CreditCard,
} from 'lucide-react';
import { useTheme }  from '../contexts/ThemeContext';
import { useAuth }   from '../contexts/AuthContext';
import { useToast }  from '../contexts/ToastContext';
import { API_URL }   from '../config/api';
import ErrorBar from './ErrorBar';

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  pending:  { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: 'rgba(245,158,11,0.25)' },
  approved: { bg: 'rgba(16,185,129,0.12)', color: '#10B981', border: 'rgba(16,185,129,0.25)' },
  rejected: { bg: 'rgba(239,68,68,0.10)',  color: '#f87171', border: 'rgba(239,68,68,0.25)'  },
};
const STATUS_ICONS = {
  pending:  <Clock    size={11} />,
  approved: <CheckCircle size={11} />,
  rejected: <XCircle  size={11} />,
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      {STATUS_ICONS[status]}
      {(status ?? 'pending').toUpperCase()}
    </span>
  );
}

// ── Plan badge ────────────────────────────────────────────────────────────────
const PLAN_STYLES = {
  pro:   { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
  elite: { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
};
function PlanBadge({ plan }) {
  const s = PLAN_STYLES[plan] ?? PLAN_STYLES.pro;
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

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(s) {
  if (!s) return '—';
  try { return new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return s; }
}

// ── Skeleton row ──────────────────────────────────────────────────────────────
function SkeletonRow({ theme }) {
  return (
    <tr>
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div style={{ height: 14, borderRadius: 6, background: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', width: ['60%','80%','50%','40%','60%','30%','50%'][i] }} />
        </td>
      ))}
    </tr>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PaymentRequests() {
  const theme  = useTheme();
  const { token } = useAuth();
  const { toast } = useToast();

  const [requests,  setRequests]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [acting,    setActing]    = useState(null); // id being acted on
  const [collapsed, setCollapsed] = useState(false);
  const [filter,    setFilter]    = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${API_URL}/api/payments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed to load');
      setRequests(d.requests ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function act(id, action) {
    setActing(id);
    // Optimistic update — map verb to past-tense status
    const optimisticStatus = action === 'approve' ? 'approved' : 'rejected';
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: optimisticStatus } : r));
    try {
      const res = await fetch(`${API_URL}/api/payments/${id}/${action}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      if (!res.ok) {
        // Revert optimistic update on error
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'pending' } : r));
        throw new Error(d.error || 'Action failed');
      }
      // Sync with server-returned data
      setRequests(prev => prev.map(r => r.id === id ? { ...r, ...d.request } : r));
      toast.success(action === 'approve' ? '✅ Payment approved — plan upgraded!' : '❌ Payment rejected.');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setActing(null);
    }
  }

  const filtered  = filter === 'all' ? requests : requests.filter(r => r.status === filter);
  const pendingCt = requests.filter(r => r.status === 'pending').length;

  return (
    <div
      className="rounded-2xl border"
      style={{ background: theme.surface, borderColor: theme.border, marginTop: 24 }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer select-none"
        onClick={() => setCollapsed(c => !c)}
        style={{ borderBottom: collapsed ? 'none' : `1px solid ${theme.border}` }}
      >
        <div className="flex items-center gap-3">
          <div style={{ padding: '7px', borderRadius: 10, background: 'rgba(59,130,246,0.12)', color: '#3b82f6', display: 'flex' }}>
            <CreditCard size={16} />
          </div>
          <div>
            <div className="font-bold text-[15px]" style={{ color: theme.text }}>Payment Requests</div>
            <div className="text-[11px]" style={{ color: theme.muted }}>
              {loading ? 'Loading…' : `${requests.length} total`}
              {pendingCt > 0 && !loading && (
                <span style={{ marginLeft: 6, padding: '1px 6px', borderRadius: 99, background: 'rgba(245,158,11,0.15)', color: '#fbbf24', fontSize: 10, fontWeight: 700 }}>
                  {pendingCt} pending
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={e => { e.stopPropagation(); load(); }}
            title="Refresh"
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
            style={{ background: 'transparent', border: `1px solid ${theme.border}`, color: theme.muted }}
          >
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          <ChevronDown
            size={15}
            color={theme.muted}
            style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
          />
        </div>
      </div>

      {!collapsed && (
        <div>
          {/* ── Filter tabs ── */}
          <div className="flex items-center gap-1 px-5 py-3" style={{ borderBottom: `1px solid ${theme.border}` }}>
            {['all', 'pending', 'approved', 'rejected'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold capitalize transition-all"
                style={{
                  background:  filter === f ? 'rgba(59,130,246,0.12)' : 'transparent',
                  color:       filter === f ? '#60a5fa' : theme.muted,
                  border:      `1px solid ${filter === f ? 'rgba(59,130,246,0.3)' : 'transparent'}`,
                }}
              >
                {f === 'all' ? `All (${requests.length})` : (
                  f === 'pending' ?  `Pending (${requests.filter(r=>r.status==='pending').length})` :
                  f === 'approved' ? `Approved (${requests.filter(r=>r.status==='approved').length})` :
                  `Rejected (${requests.filter(r=>r.status==='rejected').length})`
                )}
              </button>
            ))}
          </div>

          {/* ── Error ── */}
          {error && <ErrorBar message={error} className="mx-5 my-4" />}

          {/* ── Table ── */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                  {['User', 'Plan', 'Method', 'Amount', 'Status', 'Date', 'Proof', 'Actions'].map(h => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: theme.muted }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} theme={theme} />)
                  : filtered.length === 0
                    ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-10 text-center text-[13px]" style={{ color: theme.muted }}>
                          No {filter !== 'all' ? filter : ''} payment requests yet.
                        </td>
                      </tr>
                    )
                    : filtered.map(req => {
                      const isActing = acting === req.id;
                      const resolved = req.status !== 'pending';
                      const proofHref = req.proof_url ? `${API_URL}${req.proof_url}` : null;

                      return (
                        <tr
                          key={req.id}
                          style={{ borderBottom: `1px solid ${theme.border}`, transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          {/* User */}
                          <td className="px-4 py-3">
                            <div className="text-[13px] font-semibold" style={{ color: theme.text }}>{req.user_name ?? '—'}</div>
                            <div className="text-[11px]" style={{ color: theme.muted }}>{req.user_email ?? ''}</div>
                          </td>

                          {/* Plan */}
                          <td className="px-4 py-3"><PlanBadge plan={req.plan} /></td>

                          {/* Method */}
                          <td className="px-4 py-3 text-[12px]" style={{ color: theme.text, maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {req.method ?? '—'}
                          </td>

                          {/* Amount */}
                          <td className="px-4 py-3 text-[13px] font-semibold" style={{ color: '#34d399' }}>
                            {req.amount ?? '—'}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3"><StatusBadge status={req.status} /></td>

                          {/* Date */}
                          <td className="px-4 py-3 text-[11px] whitespace-nowrap" style={{ color: theme.muted }}>
                            {fmtDate(req.created_at)}
                          </td>

                          {/* Proof */}
                          <td className="px-4 py-3">
                            {proofHref
                              ? (
                                <a
                                  href={proofHref}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="View screenshot"
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 8, background: 'rgba(59,130,246,0.10)', color: '#60a5fa', fontSize: 11, fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(59,130,246,0.2)' }}
                                >
                                  <Image size={12} />
                                  View
                                </a>
                              )
                              : <span style={{ color: theme.muted, fontSize: 12 }}>None</span>
                            }
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3">
                            {resolved
                              ? <span style={{ fontSize: 11, color: theme.muted }}>—</span>
                              : (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => act(req.id, 'approve')}
                                    disabled={isActing}
                                    title="Approve"
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all disabled:opacity-50"
                                    style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981', border: '1px solid rgba(16,185,129,0.25)' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.25)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.12)'; }}
                                  >
                                    {isActing
                                      ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
                                      : <CheckCircle size={11} />
                                    }
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => act(req.id, 'reject')}
                                    disabled={isActing}
                                    title="Reject"
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all disabled:opacity-50"
                                    style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                                  >
                                    <XCircle size={11} />
                                    Reject
                                  </button>
                                </div>
                              )
                            }
                          </td>
                        </tr>
                      );
                    })
                }
              </tbody>
            </table>
          </div>

          {/* Note about approval */}
          {!loading && pendingCt > 0 && (
            <div className="px-5 py-3 border-t text-[11px]" style={{ borderColor: theme.border, color: theme.muted }}>
              Approving a request automatically upgrades the user's plan for 1 year.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
