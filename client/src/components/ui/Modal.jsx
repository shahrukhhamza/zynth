/**
 * Modal — Zynth Design System
 *
 * Consistent modal shell used across landing page and dashboard.
 * Handles backdrop, entrance animation, scroll-lock, and close on
 * clicking outside.
 *
 * Props:
 *   open          — boolean
 *   onClose       — () => void
 *   title         — string | ReactNode   optional header title
 *   subtitle      — string               optional muted subtitle under title
 *   maxWidth      — number               default 520
 *   zIndex        — number               default 9990
 *   hideClose     — boolean              hide the × button
 *   topBand       — boolean              show a 3px gradient top accent band
 *   children
 *   footer        — ReactNode            optional sticky footer slot
 *
 * Usage:
 *   import { Modal } from '../ui';
 *   <Modal open={show} onClose={() => setShow(false)} title="Confirm Action">
 *     <p>Are you sure?</p>
 *   </Modal>
 */

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  maxWidth = 520,
  zIndex = 9990,
  hideClose = false,
  topBand = true,
  children,
  footer,
}) {
  const theme = useTheme();

  // Prevent body scroll while modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{
            zIndex,
            background: 'rgba(0,0,0,0.72)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
          onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}
        >
          <motion.div
            key="modal-panel"
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-[95%] sm:w-full overflow-hidden flex flex-col"
            style={{
              maxWidth: `min(${maxWidth}px, 95vw)`,
              maxHeight: '90vh',
              borderRadius: 20,
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              boxShadow: theme.isDark
                ? `${theme.shadowLg}, 0 0 0 1px rgba(255,255,255,0.04), 0 0 60px rgba(59,130,246,0.06)`
                : theme.shadowLg,
            }}
          >
            {/* Top accent band */}
            {topBand && (
              <div
                className="h-[3px] w-full shrink-0"
                style={{ background: 'linear-gradient(90deg,#1D4ED8,#3B82F6,#06B6D4)' }}
              />
            )}

            {/* Header */}
            {(title || !hideClose) && (
              <div
                className="flex items-center justify-between px-6 py-4 shrink-0"
                style={{ borderBottom: title ? `1px solid ${theme.border}` : undefined }}
              >
                {title ? (
                  <div>
                    <p
                      className="text-[16px] font-bold"
                      style={{ color: theme.textPrimary }}
                    >
                      {title}
                    </p>
                    {subtitle && (
                      <p
                        className="text-[12px] mt-0.5"
                        style={{ color: theme.textMuted }}
                      >
                        {subtitle}
                      </p>
                    )}
                  </div>
                ) : (
                  <div />
                )}

                {!hideClose && (
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors shrink-0"
                    style={{
                      background: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                      color: theme.textMuted,
                      border: `1px solid ${theme.border}`,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.color = theme.textPrimary;
                      e.currentTarget.style.background = theme.isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.08)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.color = theme.textMuted;
                      e.currentTarget.style.background = theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
                    }}
                    aria-label="Close"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )}

            {/* Body — scrollable */}
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div
                className="shrink-0 px-6 py-4"
                style={{ borderTop: `1px solid ${theme.border}` }}
              >
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
