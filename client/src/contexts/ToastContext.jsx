/**
 * ToastContext — global, animated toast notification system
 *
 * Usage:
 *   const { toast } = useToast();
 *   toast.success('Trade logged!');
 *   toast.error('Something went wrong');
 *   toast.info('Refreshing data…');
 *   toast.warning('Approaching AI limit');
 */
import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle,
  error:   XCircle,
  info:    Info,
  warning: AlertTriangle,
};

const COLORS = {
  success: { bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.30)', icon: '#10b981', bar: '#10b981' },
  error:   { bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.30)',  icon: '#ef4444', bar: '#ef4444' },
  info:    { bg: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.30)', icon: '#3b82f6', bar: '#3b82f6' },
  warning: { bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.30)', icon: '#f59e0b', bar: '#f59e0b' },
};

let _id = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    // Trigger exit animation
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      if (timers.current[id]) {
        clearTimeout(timers.current[id]);
        delete timers.current[id];
      }
    }, 320);
  }, []);

  const show = useCallback((type, message, duration = 4000) => {
    const id = ++_id;
    setToasts(prev => [...prev, { id, type, message, exiting: false }]);
    timers.current[id] = setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  const toast = {
    success: (msg, dur) => show('success', msg, dur),
    error:   (msg, dur) => show('error',   msg, dur),
    info:    (msg, dur) => show('info',    msg, dur),
    warning: (msg, dur) => show('warning', msg, dur),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast stack — top-right */}
      <div
        style={{
          position: 'fixed', top: 72, right: 20, zIndex: 99999,
          display: 'flex', flexDirection: 'column', gap: 10,
          pointerEvents: 'none',
        }}
        aria-live="polite"
      >
        {toasts.map(t => {
          const c = COLORS[t.type] || COLORS.info;
          const Icon = ICONS[t.type] || Info;
          return (
            <div
              key={t.id}
              role="alert"
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                minWidth: 280, maxWidth: 400,
                background: c.bg,
                border: `1px solid ${c.border}`,
                borderRadius: 12,
                padding: '12px 14px',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
                pointerEvents: 'all',
                position: 'relative', overflow: 'hidden',
                animation: t.exiting
                  ? 'toast-exit 0.3s ease forwards'
                  : 'toast-enter 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards',
              }}
            >
              {/* Progress bar */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, height: 2,
                background: c.bar, animation: 'toast-progress 4s linear forwards',
                borderRadius: '0 0 0 12px',
              }} />

              <Icon style={{ width: 17, height: 17, color: c.icon, flexShrink: 0, marginTop: 1 }} />

              <span style={{
                fontSize: 13, fontWeight: 500, lineHeight: 1.4,
                color: '#f1f5f9', flex: 1,
              }}>
                {t.message}
              </span>

              <button
                onClick={() => dismiss(t.id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: 2, flexShrink: 0, opacity: 0.5, color: '#f1f5f9',
                  lineHeight: 1,
                }}
                aria-label="Dismiss"
              >
                <X style={{ width: 13, height: 13 }} />
              </button>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes toast-enter {
          from { opacity: 0; transform: translateX(110%) scale(0.92); }
          to   { opacity: 1; transform: translateX(0)    scale(1); }
        }
        @keyframes toast-exit {
          from { opacity: 1; transform: translateX(0)    scale(1); max-height: 80px; margin-bottom: 0; }
          to   { opacity: 0; transform: translateX(110%) scale(0.9); max-height: 0; margin-bottom: -10px; }
        }
        @keyframes toast-progress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
