/**
 * Card — Zynth Design System
 *
 * Three variants, all driven by ThemeContext tokens so they work
 * identically on the landing page and inside the dashboard.
 *
 * Variants:
 *   default    — standard surface card with border and soft shadow
 *   elevated   — deeper shadow, slight lift on hover
 *   highlighted — accent-glow border for CTAs / featured items
 *
 * Usage:
 *   import { Card } from '../ui';
 *   <Card variant="elevated" className="p-6">...</Card>
 *   <Card variant="highlighted" style={{ padding: 24 }}>...</Card>
 */

import { useTheme } from '../../contexts/ThemeContext';

export function Card({
  children,
  variant = 'default',   // 'default' | 'elevated' | 'highlighted'
  className = '',
  style = {},
  onClick,
  as: Tag = 'div',
}) {
  const theme = useTheme();

  const base = {
    borderRadius: 16,
    border: `1px solid ${theme.border}`,
    background: theme.surface,
    transition: 'box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease',
    overflow: 'hidden',
  };

  const variants = {
    default: {
      boxShadow: theme.shadow,
    },
    elevated: {
      boxShadow: theme.shadowMd,
      cursor: onClick ? 'pointer' : undefined,
    },
    highlighted: {
      borderColor: 'rgba(59,130,246,0.35)',
      boxShadow: theme.isDark
        ? `${theme.shadowMd}, 0 0 0 1px rgba(59,130,246,0.2), 0 0 40px rgba(59,130,246,0.08)`
        : `${theme.shadow}, 0 0 0 1px rgba(37,99,235,0.12)`,
    },
  };

  function handleMouseEnter(e) {
    if (variant === 'elevated') {
      e.currentTarget.style.boxShadow = theme.shadowLg;
      e.currentTarget.style.transform = 'translateY(-2px)';
    }
    if (variant === 'highlighted') {
      e.currentTarget.style.borderColor = 'rgba(59,130,246,0.6)';
      e.currentTarget.style.boxShadow = theme.isDark
        ? `${theme.shadowLg}, 0 0 0 1px rgba(59,130,246,0.4), 0 0 60px rgba(59,130,246,0.12)`
        : `${theme.shadowMd}, 0 0 0 1px rgba(37,99,235,0.25)`;
    }
  }
  function handleMouseLeave(e) {
    e.currentTarget.style.boxShadow = variants[variant].boxShadow;
    e.currentTarget.style.transform = '';
    e.currentTarget.style.borderColor = variants[variant].borderColor ?? theme.border;
  }

  return (
    <Tag
      className={className}
      style={{ ...base, ...variants[variant], ...style }}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </Tag>
  );
}

/**
 * CardHeader — consistent title row inside a Card.
 * Renders a title + optional right-side slot.
 */
export function CardHeader({ title, subtitle, right, className = '' }) {
  const theme = useTheme();
  return (
    <div
      className={`flex items-center justify-between px-5 py-4 border-b ${className}`}
      style={{ borderColor: theme.border }}
    >
      <div>
        <p className="text-[14px] font-bold" style={{ color: theme.textPrimary }}>{title}</p>
        {subtitle && (
          <p className="text-[12px] mt-0.5" style={{ color: theme.textMuted }}>{subtitle}</p>
        )}
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  );
}

/**
 * CardBody — padded content area inside a Card.
 */
export function CardBody({ children, className = '', style = {} }) {
  return (
    <div className={`p-5 ${className}`} style={style}>
      {children}
    </div>
  );
}
