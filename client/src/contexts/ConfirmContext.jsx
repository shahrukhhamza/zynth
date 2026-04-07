/**
 * ConfirmModal — drop-in replacement for window.confirm()
 *
 * Usage (imperative, via context):
 *   const { confirm } = useConfirm();
 *   const ok = await confirm({
 *     title:   'Delete trade?',
 *     message: 'This action cannot be undone.',
 *     confirm: 'Delete',
 *     variant: 'danger',   // 'danger' | 'warning' | 'default'
 *   });
 *   if (ok) doDelete();
 */
import { createContext, useContext, useState, useCallback } from 'react';
import { AlertTriangle, Trash2, Info } from 'lucide-react';
import { useTheme } from './ThemeContext';

const ConfirmContext = createContext(null);

const VARIANT = {
  danger:  { icon: Trash2,         iconColor: '#ef4444', confirmBg: '#ef4444', confirmHover: '#dc2626' },
  warning: { icon: AlertTriangle,  iconColor: '#f59e0b', confirmBg: '#f59e0b', confirmHover: '#d97706' },
  default: { icon: Info,           iconColor: '#CA8A04', confirmBg: '#CA8A04', confirmHover: '#A16207' },
};

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null); // { title, message, confirm, cancel, variant, resolve }

  const confirm = useCallback((opts) => {
    return new Promise(resolve => {
      setState({
        title:   opts.title   || 'Are you sure?',
        message: opts.message || '',
        confirm: opts.confirm || 'Confirm',
        cancel:  opts.cancel  || 'Cancel',
        variant: opts.variant || 'default',
        resolve,
      });
    });
  }, []);

  const handleResult = (ok) => {
    if (state?.resolve) state.resolve(ok);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state && <ConfirmDialog state={state} onResult={handleResult} />}
    </ConfirmContext.Provider>
  );
}

function ConfirmDialog({ state, onResult }) {
  const theme = useTheme();
  const v = VARIANT[state.variant] || VARIANT.default;
  const Icon = v.icon;

  // Close on backdrop click
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onResult(false);
  };

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0, zIndex: 99998,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        animation: 'confirm-backdrop 0.2s ease forwards',
      }}
    >
      <div
        style={{
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: 16,
          padding: '28px 28px 24px',
          maxWidth: 400, width: '100%',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          animation: 'confirm-enter 0.25s cubic-bezier(0.34,1.56,0.64,1) forwards',
        }}
      >
        {/* Icon */}
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: `${v.iconColor}18`,
          border: `1px solid ${v.iconColor}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 18,
        }}>
          <Icon style={{ width: 22, height: 22, color: v.iconColor }} />
        </div>

        {/* Title */}
        <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 700, color: theme.text }}>
          {state.title}
        </h3>

        {/* Message */}
        {state.message && (
          <p style={{ margin: '0 0 24px', fontSize: 13.5, lineHeight: 1.6, color: theme.muted }}>
            {state.message}
          </p>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={() => onResult(false)}
            style={{
              padding: '9px 20px', borderRadius: 9, border: `1px solid ${theme.border}`,
              background: 'transparent', color: theme.text,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {state.cancel}
          </button>
          <button
            onClick={() => onResult(true)}
            style={{
              padding: '9px 20px', borderRadius: 9, border: 'none',
              background: v.confirmBg, color: '#fff',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              transition: 'background 0.15s, transform 0.1s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = v.confirmHover; e.currentTarget.style.transform = 'scale(1.03)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = v.confirmBg;    e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {state.confirm}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes confirm-backdrop {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes confirm-enter {
          from { opacity: 0; transform: scale(0.88) translateY(12px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </div>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used inside <ConfirmProvider>');
  return ctx;
}
