/**
 * Button — Zynth Design System
 *
 * Variants:
 *   primary   — gradient blue, strong hover lift + glow
 *   secondary — translucent border button
 *   ghost     — text-only, no background
 *   danger    — red gradient for destructive actions
 *
 * Sizes: sm | md (default) | lg
 *
 * Usage:
 *   import { Button } from '../ui';
 *   <Button variant="primary" size="lg" onClick={fn}>Analyze My Trades</Button>
 *   <Button variant="secondary" disabled>Loading…</Button>
 */

import { useTheme } from '../../contexts/ThemeContext';

const SIZE = {
  sm: { padding: '8px 16px', fontSize: 12, borderRadius: 10, iconSize: 14 },
  md: { padding: '11px 22px', fontSize: 14, borderRadius: 12, iconSize: 16 },
  lg: { padding: '15px 30px', fontSize: 15, borderRadius: 14, iconSize: 18 },
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  style = {},
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
}) {
  const theme = useTheme();
  const sz = SIZE[size] ?? SIZE.md;

  // Base styles shared by all variants
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    fontWeight: 700,
    border: '1px solid transparent',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.55 : 1,
    transition: 'transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease, background 0.18s ease',
    whiteSpace: 'nowrap',
    ...sz,
  };

  const VARIANTS = {
    primary: {
      background: `linear-gradient(135deg, ${theme.primary} 0%, #0284C7 100%)`,
      color: '#fff',
      boxShadow: theme.isDark
        ? `0 4px 16px rgba(202,138,4,0.35)`
        : `0 4px 14px rgba(161,98,7,0.28)`,
      borderColor: 'transparent',
    },
    secondary: {
      background: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
      color: theme.textPrimary,
      borderColor: theme.border,
      boxShadow: 'none',
    },
    ghost: {
      background: 'transparent',
      color: theme.textMuted,
      borderColor: 'transparent',
      boxShadow: 'none',
    },
    danger: {
      background: `linear-gradient(135deg, ${theme.danger} 0%, #9F1239 100%)`,
      color: '#fff',
      boxShadow: '0 4px 16px rgba(244,63,94,0.30)',
      borderColor: 'transparent',
    },
  };

  const variantStyle = VARIANTS[variant] ?? VARIANTS.primary;

  function handleMouseEnter(e) {
    if (disabled || loading) return;
    if (variant === 'primary') {
      e.currentTarget.style.boxShadow = theme.isDark
        ? '0 8px 28px rgba(202,138,4,0.55)'
        : '0 8px 24px rgba(161,98,7,0.40)';
      e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
    }
    if (variant === 'secondary') {
      e.currentTarget.style.borderColor = theme.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.14)';
      e.currentTarget.style.background = theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
    }
    if (variant === 'ghost') {
      e.currentTarget.style.color = theme.textPrimary;
      e.currentTarget.style.background = theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
    }
    if (variant === 'danger') {
      e.currentTarget.style.boxShadow = '0 8px 28px rgba(244,63,94,0.45)';
      e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
    }
  }

  function handleMouseLeave(e) {
    e.currentTarget.style.boxShadow = variantStyle.boxShadow;
    e.currentTarget.style.transform = '';
    e.currentTarget.style.background = variantStyle.background;
    e.currentTarget.style.borderColor = variantStyle.borderColor;
    e.currentTarget.style.color = variantStyle.color;
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={className}
      style={{ ...base, ...variantStyle, ...style }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {loading ? (
        <span
          style={{
            width: sz.iconSize,
            height: sz.iconSize,
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
      ) : LeftIcon ? (
        <LeftIcon size={sz.iconSize} style={{ flexShrink: 0 }} />
      ) : null}
      {children}
      {!loading && RightIcon && <RightIcon size={sz.iconSize} style={{ flexShrink: 0 }} />}
    </button>
  );
}
