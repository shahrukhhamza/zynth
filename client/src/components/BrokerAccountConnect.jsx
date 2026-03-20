import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { API_URL } from '../config/api';
import { Monitor, Plus, Trash2, RefreshCw, AlertCircle, CheckCircle, Clock, Shield, Eye, EyeOff } from 'lucide-react';

const PLATFORM_OPTIONS = ['MT5'];

const STATE_META = {
  DEPLOYED:  { label: 'Connected',  color: '#10b981', Icon: CheckCircle },
  DEPLOYING: { label: 'Connecting…', color: '#f59e0b', Icon: Clock       },
  UNDEPLOYED:{ label: 'Inactive',   color: '#6b7280', Icon: Clock        },
  ERROR:     { label: 'Error',      color: '#ef4444', Icon: AlertCircle  },
};

function StatePill({ state }) {
  const { label, color, Icon } = STATE_META[state] ?? STATE_META.DEPLOYING;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
      padding: '3px 10px', borderRadius: 99,
      color, background: `${color}18`, border: `1px solid ${color}35`,
    }}>
      <Icon style={{ width: 11, height: 11 }} />
      {label}
    </span>
  );
}

export default function BrokerAccountConnect() {
  const theme = useTheme();
  const T = theme;

  const [accounts, setAccounts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [deleting, setDeleting]   = useState(null);  // account id being deleted
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    login:    '',
    password: '',
    server:   '',
    platform: 'MT5',
    label:    '',
  });

  const token = localStorage.getItem('auth_token');
  const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // ── Load accounts ──────────────────────────────────────────────────────────
  const loadAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/accounts`, { headers: authHeaders });
      const data = await res.json();
      if (data.success) setAccounts(data.accounts ?? []);
    } catch (err) {
      console.error('Failed to load accounts:', err);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  // ── Submit form ────────────────────────────────────────────────────────────
  async function handleAdd(e) {
    e.preventDefault();
    setFormError('');

    if (!form.login.trim() || !form.password || !form.server.trim()) {
      return setFormError('Login, password, and server are required.');
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/accounts/add`, {
        method:  'POST',
        headers: authHeaders,
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return setFormError(data.error ?? 'Failed to connect account. Check your credentials.');
      }
      setAccounts(prev => [data.account, ...prev]);
      setForm({ login: '', password: '', server: '', platform: 'MT5', label: '' });
      setShowForm(false);
    } catch (err) {
      setFormError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Delete account ─────────────────────────────────────────────────────────
  async function handleDelete(accountId) {
    if (!window.confirm('Remove this broker account? All future sync will stop.')) return;
    setDeleting(accountId);
    try {
      const res = await fetch(`${API_URL}/api/accounts/${accountId}`, {
        method:  'DELETE',
        headers: authHeaders,
      });
      const data = await res.json();
      if (data.success) {
        setAccounts(prev => prev.filter(a => a.id !== accountId));
      }
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleting(null);
    }
  }

  // ── Shared styles ──────────────────────────────────────────────────────────
  const card = {
    background:   T.surface,
    border:       `1px solid ${T.border}`,
    borderRadius: 12,
    padding:      '20px 22px',
  };

  const input = {
    width:        '100%',
    padding:      '10px 12px',
    background:   T.surface2,
    border:       `1px solid ${T.border}`,
    borderRadius: 8,
    color:        T.text,
    fontSize:     14,
    outline:      'none',
    boxSizing:    'border-box',
  };

  const label = { fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 5, display: 'block', letterSpacing: '0.04em' };

  const btn = (bg, fg = '#fff') => ({
    padding:      '10px 18px',
    background:   bg,
    color:        fg,
    border:       'none',
    borderRadius: 8,
    fontSize:     13,
    fontWeight:   700,
    cursor:       'pointer',
    display:      'inline-flex',
    alignItems:   'center',
    gap:          6,
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: T.text, margin: 0 }}>
            Broker Accounts
          </h2>
          <p style={{ fontSize: 13, color: T.muted, margin: '4px 0 0' }}>
            Connect your MT5 account — trades sync automatically.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={btn(T.surface2, T.muted)} onClick={loadAccounts} disabled={loading}>
            <RefreshCw style={{ width: 14, height: 14 }} />
          </button>
          <button style={btn('#10b981')} onClick={() => { setShowForm(f => !f); setFormError(''); }}>
            <Plus style={{ width: 14, height: 14 }} />
            Add Account
          </button>
        </div>
      </div>

      {/* ── Security notice ── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: '12px 14px', borderRadius: 10,
        background: `${'#10b981'}10`, border: `1px solid ${'#10b981'}30`,
      }}>
        <Shield style={{ width: 15, height: 15, color: '#10b981', flexShrink: 0, marginTop: 1 }} />
        <p style={{ margin: 0, fontSize: 12, color: T.muted, lineHeight: 1.6 }}>
          <strong style={{ color: T.text }}>Read-only connection. </strong>
          Use your <strong style={{ color: T.text }}>Investor password</strong>, not your master password.
          Your credentials are sent to MetaApi over TLS and are never stored on our servers.
        </p>
      </div>

      {/* ── Add account form ── */}
      {showForm && (
        <form onSubmit={handleAdd} style={{ ...card, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: T.text }}>
            Connect a Broker Account
          </h3>

          {/* Platform selector */}
          <div>
            <span style={label}>Platform</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {PLATFORM_OPTIONS.map(p => (
                <button
                  key={p} type="button"
                  onClick={() => setForm(f => ({ ...f, platform: p }))}
                  style={{
                    ...btn(form.platform === p ? '#10b981' : T.surface2, form.platform === p ? '#fff' : T.muted),
                    flex: 1, justifyContent: 'center',
                    border: `1px solid ${form.platform === p ? '#10b981' : T.border}`,
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Login */}
          <div>
            <span style={label}>MT Account Number</span>
            <input
              style={input} type="text" inputMode="numeric" autoComplete="off"
              placeholder="e.g. 123456"
              value={form.login}
              onChange={e => setForm(f => ({ ...f, login: e.target.value }))}
              required
            />
          </div>

          {/* Investor password */}
          <div>
            <span style={label}>Investor Password <span style={{ color: '#f59e0b', fontWeight: 400 }}>(read-only)</span></span>
            <div style={{ position: 'relative' }}>
              <input
                style={{ ...input, paddingRight: 40 }}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Investor password only"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.muted, padding: 0 }}
              >
                {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
              </button>
            </div>
          </div>

          {/* Server */}
          <div>
            <span style={label}>Broker Server</span>
            <input
              style={input} type="text" autoComplete="off"
              placeholder="e.g. ICMarkets-Demo or Pepperstone-Live"
              value={form.server}
              onChange={e => setForm(f => ({ ...f, server: e.target.value }))}
              required
            />
          </div>

          {/* Optional label */}
          <div>
            <span style={label}>Label <span style={{ fontWeight: 400, color: T.muted }}>(optional)</span></span>
            <input
              style={input} type="text" maxLength={64}
              placeholder="e.g. My Prop Firm Account"
              value={form.label}
              onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
            />
          </div>

          {/* Error */}
          {formError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, background: '#ef444415', border: '1px solid #ef444435' }}>
              <AlertCircle style={{ width: 14, height: 14, color: '#ef4444', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#ef4444' }}>{formError}</span>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" style={btn(T.surface2, T.muted)} onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <button type="submit" style={btn('#10b981')} disabled={submitting}>
              {submitting ? (
                <>
                  <div style={{ width: 12, height: 12, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  Connecting…
                </>
              ) : (
                <><Plus style={{ width: 14, height: 14 }} />Connect</>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ── Account list ── */}
      {loading ? (
        <div style={{ ...card, display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
          <div style={{ width: 22, height: 22, border: `2px solid ${T.accent ?? '#10b981'}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        </div>
      ) : accounts.length === 0 && !showForm ? (
        <div style={{ ...card, textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: '#10b98110', border: '1px solid #10b98120', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Monitor style={{ width: 24, height: 24, color: '#10b981' }} />
          </div>
          <p style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: '0 0 6px' }}>No accounts connected</p>
          <p style={{ fontSize: 13, color: T.muted, margin: '0 0 18px' }}>Connect your broker account to start syncing trades automatically.</p>
          <button style={btn('#10b981')} onClick={() => setShowForm(true)}>
            <Plus style={{ width: 14, height: 14 }} />Add Account
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {accounts.map(acc => (
            <div key={acc.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* Icon */}
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#10b98112', border: '1px solid #10b98122', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Monitor style={{ width: 18, height: 18, color: '#10b981' }} />
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>
                    {acc.label ?? `${acc.platform} — ${acc.login}`}
                  </span>
                  <StatePill state={acc.state ?? 'DEPLOYING'} />
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: '#0ea5e915', color: '#0ea5e9', border: '1px solid #0ea5e930' }}>
                    {acc.platform}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>
                  Login: {acc.login} &nbsp;·&nbsp; {acc.server}
                </div>
              </div>

              {/* Delete */}
              <button
                style={{ ...btn('#ef444418', '#ef4444'), border: '1px solid #ef444430', padding: '8px 12px' }}
                onClick={() => handleDelete(acc.id)}
                disabled={deleting === acc.id}
                title="Remove account"
              >
                {deleting === acc.id
                  ? <div style={{ width: 12, height: 12, border: '2px solid #ef4444', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  : <Trash2 style={{ width: 14, height: 14 }} />
                }
              </button>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
