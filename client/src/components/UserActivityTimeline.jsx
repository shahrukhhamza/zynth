/**
 * UserActivityTimeline — per-user event history panel for the admin dashboard.
 *
 * Usage (inside AdminDashboard, opened by clicking a user row):
 *
 *   <UserActivityTimeline userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
 */
import { useState, useEffect, useCallback } from 'react';
import {
  UserPlus, BookOpen, Zap, AlertTriangle, ShoppingCart,
  Eye, MousePointerClick, X, RefreshCw, Activity,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config/api';

// ── Event display config ──────────────────────────────────────────────────────

const EVENT_CONFIG = {
  user_signup:          { label: 'Account created',         Icon: UserPlus,        color: '#10B981' },
  trade_added:          { label: 'Trade logged',            Icon: BookOpen,        color: '#3B82F6' },
  ai_used:              { label: 'AI analysis used',        Icon: Zap,             color: '#8B5CF6' },
  ai_limit_hit:         { label: 'Hit AI limit',            Icon: AlertTriangle,   color: '#F59E0B' },
  journal_limit_hit:    { label: 'Hit journal limit',       Icon: AlertTriangle,   color: '#F59E0B' },
  upgrade_modal_opened: { label: 'Viewed upgrade modal',    Icon: Eye,             color: '#0EA5E9' },
  upgrade_clicked:      { label: 'Clicked upgrade CTA',     Icon: MousePointerClick, color: '#6366F1' },
  subscription_started: { label: 'Subscription started',   Icon: ShoppingCart,    color: '#F59E0B' },
};

const DEFAULT_EVENT = { label: 'Unknown event', Icon: Activity, color: '#94A3B8' };

function fmtTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

function MetaChip({ label, value }) {
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 3,
        padding: '1px 6px', borderRadius: 4,
        background: 'rgba(255,255,255,0.06)',
        fontSize: 10, color: '#94A3B8', fontFamily: 'monospace',
      }}
    >
      <span style={{ color: '#64748B' }}>{label}:</span>
      {String(value)}
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function UserActivityTimeline({ userId, onClose }) {
  const theme = useTheme();
  const { token } = useAuth();

  const [user,    setUser]    = useState(null);
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const headers = useCallback(
    () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }),
    [token],
  );

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${API_URL}/api/admin/user/${userId}/events?limit=200`, { headers: headers() });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed to load events');
      setUser(d.user ?? null);
      setEvents(Array.isArray(d.events) ? d.events : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [userId, headers]);

  useEffect(() => { load(); }, [load]);

  if (!userId) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: '100%', maxWidth: 520,
          maxHeight: '85vh',
          borderRadius: 16,
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          boxShadow: theme.shadowLg,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: `1px solid ${theme.border}`,
          }}
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: theme.text }}>
              Activity Timeline
            </div>
            {user && (
              <div style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>
                {user.name} · {user.email} ·{' '}
                <span style={{ color: '#3B82F6', textTransform: 'uppercase', fontSize: 10, fontWeight: 700 }}>
                  {user.plan}
                </span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={load}
              style={{
                padding: 6, borderRadius: 8, border: `1px solid ${theme.border}`,
                background: 'transparent', cursor: 'pointer', color: theme.muted,
              }}
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={onClose}
              style={{
                padding: 6, borderRadius: 8, border: `1px solid ${theme.border}`,
                background: 'transparent', cursor: 'pointer', color: theme.muted,
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: 52, borderRadius: 10,
                    background: theme.border,
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}
                />
              ))}
            </div>
          )}

          {error && (
            <div style={{ color: '#F43F5E', fontSize: 13, textAlign: 'center', padding: 24 }}>
              {error}
            </div>
          )}

          {!loading && !error && events.length === 0 && (
            <div style={{ color: theme.muted, fontSize: 13, textAlign: 'center', padding: 32 }}>
              No events recorded yet.
            </div>
          )}

          {!loading && !error && events.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
              {/* Vertical line */}
              <div
                style={{
                  position: 'absolute', left: 15, top: 8, bottom: 8,
                  width: 1, background: theme.border,
                }}
              />

              {events.map((ev, idx) => {
                const cfg = EVENT_CONFIG[ev.event] ?? DEFAULT_EVENT;
                const { Icon } = cfg;
                const metaEntries = Object.entries(ev.metadata ?? {}).slice(0, 4);

                return (
                  <div
                    key={ev.id ?? idx}
                    style={{
                      display: 'flex', gap: 12, alignItems: 'flex-start',
                      padding: '8px 0',
                      paddingLeft: 4,
                    }}
                  >
                    {/* Dot + icon */}
                    <div
                      style={{
                        flexShrink: 0,
                        width: 22, height: 22, borderRadius: '50%',
                        background: `${cfg.color}18`,
                        border: `1.5px solid ${cfg.color}50`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        position: 'relative', zIndex: 1,
                        marginTop: 2,
                      }}
                    >
                      <Icon size={11} color={cfg.color} />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', gap: 8, flexWrap: 'wrap',
                      }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>
                          {cfg.label}
                        </span>
                        <span style={{ fontSize: 11, color: theme.muted, flexShrink: 0 }}>
                          {fmtTime(ev.created_at)}
                        </span>
                      </div>

                      {metaEntries.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                          {metaEntries.map(([k, v]) => (
                            <MetaChip key={k} label={k} value={v} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && events.length > 0 && (
          <div
            style={{
              padding: '10px 20px',
              borderTop: `1px solid ${theme.border}`,
              fontSize: 11, color: theme.muted, textAlign: 'right',
            }}
          >
            {events.length} event{events.length !== 1 ? 's' : ''} total
          </div>
        )}
      </div>
    </div>
  );
}
