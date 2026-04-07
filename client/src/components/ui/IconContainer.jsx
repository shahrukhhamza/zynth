/**
 * IconContainer — Universal icon wrapper for Zynth design system.
 *
 * Provides consistent sizing, border, gradient background, and color per
 * semantic variant. Supports static, interactive (hover glow + scale), and
 * selected states.
 *
 * Usage:
 *   <IconContainer icon={Brain} variant="purple" size="lg" />
 *   <IconContainer icon={Globe} variant="blue" size="sm" selected={market === 'forex'} />
 *   <IconContainer icon={Zap}   variant="amber" size="md" interactive />
 *
 * Variants:  blue | purple | green | red | amber | muted
 * Sizes:     sm (36px) | md (44px, default) | lg (52px)
 */

import { useState } from 'react';

// ── Colour tokens ─────────────────────────────────────────────────────────────

const VARIANTS = {
  blue: {
    bg:           'rgba(202,138,4,0.10)',
    border:       'rgba(202,138,4,0.20)',
    iconColor:    '#CA8A04',
    hoverBg:      'rgba(202,138,4,0.16)',
    hoverBorder:  'rgba(202,138,4,0.45)',
    hoverGlow:    '0 0 0 1px rgba(202,138,4,0.35), 0 0 20px rgba(202,138,4,0.18)',
    selBg:        'linear-gradient(135deg,rgba(202,138,4,0.22),rgba(6,182,212,0.12))',
    selBorder:    'rgba(202,138,4,0.60)',
    selGlow:      '0 0 0 1px rgba(202,138,4,0.50), 0 0 22px rgba(202,138,4,0.25)',
    selIconColor: '#CA8A04',
  },
  purple: {
    bg:           'rgba(139,92,246,0.10)',
    border:       'rgba(139,92,246,0.20)',
    iconColor:    '#a78bfa',
    hoverBg:      'rgba(139,92,246,0.16)',
    hoverBorder:  'rgba(139,92,246,0.45)',
    hoverGlow:    '0 0 0 1px rgba(139,92,246,0.35), 0 0 20px rgba(139,92,246,0.18)',
    selBg:        'linear-gradient(135deg,rgba(139,92,246,0.22),rgba(99,102,241,0.12))',
    selBorder:    'rgba(139,92,246,0.60)',
    selGlow:      '0 0 0 1px rgba(139,92,246,0.50), 0 0 22px rgba(139,92,246,0.25)',
    selIconColor: '#c4b5fd',
  },
  green: {
    bg:           'rgba(16,185,129,0.10)',
    border:       'rgba(16,185,129,0.20)',
    iconColor:    '#10b981',
    hoverBg:      'rgba(16,185,129,0.16)',
    hoverBorder:  'rgba(16,185,129,0.45)',
    hoverGlow:    '0 0 0 1px rgba(16,185,129,0.35), 0 0 20px rgba(16,185,129,0.18)',
    selBg:        'linear-gradient(135deg,rgba(16,185,129,0.22),rgba(6,182,212,0.10))',
    selBorder:    'rgba(16,185,129,0.60)',
    selGlow:      '0 0 0 1px rgba(16,185,129,0.50), 0 0 22px rgba(16,185,129,0.25)',
    selIconColor: '#6ee7b7',
  },
  red: {
    bg:           'rgba(239,68,68,0.10)',
    border:       'rgba(239,68,68,0.20)',
    iconColor:    '#ef4444',
    hoverBg:      'rgba(239,68,68,0.16)',
    hoverBorder:  'rgba(239,68,68,0.45)',
    hoverGlow:    '0 0 0 1px rgba(239,68,68,0.35), 0 0 20px rgba(239,68,68,0.18)',
    selBg:        'linear-gradient(135deg,rgba(239,68,68,0.22),rgba(248,113,113,0.10))',
    selBorder:    'rgba(239,68,68,0.60)',
    selGlow:      '0 0 0 1px rgba(239,68,68,0.50), 0 0 22px rgba(239,68,68,0.25)',
    selIconColor: '#fca5a5',
  },
  amber: {
    bg:           'rgba(245,158,11,0.10)',
    border:       'rgba(245,158,11,0.20)',
    iconColor:    '#f59e0b',
    hoverBg:      'rgba(245,158,11,0.16)',
    hoverBorder:  'rgba(245,158,11,0.45)',
    hoverGlow:    '0 0 0 1px rgba(245,158,11,0.35), 0 0 20px rgba(245,158,11,0.18)',
    selBg:        'linear-gradient(135deg,rgba(245,158,11,0.22),rgba(251,191,36,0.10))',
    selBorder:    'rgba(245,158,11,0.60)',
    selGlow:      '0 0 0 1px rgba(245,158,11,0.50), 0 0 22px rgba(245,158,11,0.25)',
    selIconColor: '#fde68a',
  },
  muted: {
    bg:           'rgba(148,163,184,0.08)',
    border:       'rgba(148,163,184,0.15)',
    iconColor:    '#94a3b8',
    hoverBg:      'rgba(148,163,184,0.13)',
    hoverBorder:  'rgba(148,163,184,0.35)',
    hoverGlow:    '0 0 0 1px rgba(148,163,184,0.25), 0 0 16px rgba(148,163,184,0.15)',
    selBg:        'linear-gradient(135deg,rgba(148,163,184,0.16),rgba(148,163,184,0.08))',
    selBorder:    'rgba(148,163,184,0.40)',
    selGlow:      '0 0 0 1px rgba(148,163,184,0.30), 0 0 14px rgba(148,163,184,0.18)',
    selIconColor: '#cbd5e1',
  },
};

// ── Size tokens ───────────────────────────────────────────────────────────────

const SIZES = {
  sm: { outer: 36, icon: 16, radius: 10 },
  md: { outer: 44, icon: 20, radius: 12 },
  lg: { outer: 52, icon: 24, radius: 14 },
};

// ── Component ─────────────────────────────────────────────────────────────────

export function IconContainer({
  icon: Icon,
  variant = 'blue',
  size = 'md',
  selected = false,
  interactive = false,
  className = '',
  style = {},
}) {
  const [hovered, setHovered] = useState(false);

  const v = VARIANTS[variant] ?? VARIANTS.blue;
  const s = SIZES[size]    ?? SIZES.md;

  const isHot = interactive && hovered && !selected;

  const bg         = selected   ? v.selBg        : isHot ? v.hoverBg     : v.bg;
  const border     = selected   ? v.selBorder     : isHot ? v.hoverBorder : v.border;
  const boxShadow  = selected   ? v.selGlow       : isHot ? v.hoverGlow   : 'none';
  const iconColor  = selected   ? v.selIconColor  : v.iconColor;
  const scale      = (interactive && hovered) ? 'scale(1.03)' : 'scale(1)';

  return (
    <div
      className={`shrink-0 flex items-center justify-center ${className}`}
      style={{
        width: s.outer,
        height: s.outer,
        borderRadius: s.radius,
        background: bg,
        border: `1px solid ${border}`,
        boxShadow,
        transform: scale,
        transition: 'background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.18s ease',
        ...style,
      }}
      onMouseEnter={interactive ? () => setHovered(true)  : undefined}
      onMouseLeave={interactive ? () => setHovered(false) : undefined}
    >
      <Icon size={s.icon} style={{ color: iconColor, strokeWidth: 2 }} />
    </div>
  );
}
