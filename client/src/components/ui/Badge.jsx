/**
 * Badge — Zynth Design System
 *
 * Semantic color variants driven by ThemeContext so badges look
 * identical on landing and dashboard in both modes.
 *
 * Variants: default | primary | success | warning | danger | muted
 * Sizes:    sm | md (default)
 *
 * Usage:
 *   import { Badge } from '../ui';
 *   <Badge variant="success">Live</Badge>
 *   <Badge variant="warning" size="sm">74% OFF</Badge>
 *   <Badge variant="danger" dot>High Risk</Badge>
 */

import { useTheme } from '../../contexts/ThemeContext';

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,        // show a pulsing dot before the label
  className = '',
  style = {},
}) {
  const theme = useTheme();

  const SIZE = {
    sm: { fontSize: 10, padding: '2px 8px', borderRadius: 6 },
    md: { fontSize: 11, padding: '4px 10px', borderRadius: 8 },
  };

  const sz = SIZE[size] ?? SIZE.md;

  // Color mappings per variant
  const VARIANTS = {
    default: {
      background: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
      color:      theme.textMuted,
      borderColor: theme.border,
    },
    primary: {
      background: theme.accentGlow,
      color:      theme.primary,
      borderColor: `rgba(202,138,4,0.25)`,
    },
    success: {
      background: 'rgba(16,185,129,0.1)',
      color:      '#10B981',
      borderColor: 'rgba(16,185,129,0.25)',
    },
    warning: {
      background: theme.isDark ? 'rgba(245,158,11,0.12)' : 'rgba(217,119,6,0.08)',
      color:      theme.warning,
      borderColor: theme.isDark ? 'rgba(245,158,11,0.25)' : 'rgba(217,119,6,0.2)',
    },
    danger: {
      background: 'rgba(244,63,94,0.1)',
      color:      theme.danger,
      borderColor: 'rgba(244,63,94,0.25)',
    },
    muted: {
      background: 'transparent',
      color:      theme.textMuted,
      borderColor: theme.border,
    },
  };

  const v = VARIANTS[variant] ?? VARIANTS.default;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold tracking-[0.08em] uppercase border ${className}`}
      style={{
        ...sz,
        background: v.background,
        color: v.color,
        borderColor: v.borderColor,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {dot && (
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            backgroundColor: v.color,
            flexShrink: 0,
            animation: 'pulse 2s ease-in-out infinite',
          }}
        />
      )}
      {children}
    </span>
  );
}
