/**
 * UsageBadge — micro badge overlaid on action buttons when usage is critically low.
 *
 * Renders only when the count is ≤ threshold. Returns null otherwise so it is
 * completely zero-cost to render unconditionally next to any button.
 *
 * Props:
 *   count      {number}          — uses remaining (e.g. aiRemaining)
 *   threshold  {number}          — show badge when count ≤ this (default: 2)
 *   position   {'top-right'|'top-left'|'inline'} — placement style (default: 'top-right')
 *   variant    {'amber'|'red'|'blue'} — color (default: auto based on count)
 *   label      {string}          — override label (default: "{count} left")
 *
 * Wrapper must be position: relative for the overlay positions to work.
 *
 * Usage:
 *   // Overlay on a button wrapper:
 *   <div style={{ position: 'relative', display: 'inline-flex' }}>
 *     <button onClick={analyzeHandler}>Analyze Trade</button>
 *     <UsageBadge count={aiRemaining} />
 *   </div>
 *
 *   // Inline (next to label text):
 *   <button>
 *     Add Trade <UsageBadge count={journalRemaining} position="inline" />
 *   </button>
 */

const VARIANT = {
  amber: { bg: 'rgba(245,158,11,0.90)', text: '#000',  shadow: 'rgba(245,158,11,0.35)' },
  red:   { bg: 'rgba(244,63,94,0.90)',  text: '#fff',  shadow: 'rgba(244,63,94,0.35)'  },
  blue:  { bg: 'rgba(59,130,246,0.90)', text: '#fff',  shadow: 'rgba(59,130,246,0.35)' },
};

const POSITION_STYLES = {
  'top-right': {
    position: 'absolute',
    top: -7,
    right: -7,
    zIndex: 10,
  },
  'top-left': {
    position: 'absolute',
    top: -7,
    left: -7,
    zIndex: 10,
  },
  inline: {
    position: 'relative',
    display: 'inline-flex',
  },
};

export default function UsageBadge({
  count,
  threshold = 2,
  position  = 'top-right',
  variant,
  label,
}) {
  // Treat Infinity as unlimited — never show badge
  if (count === Infinity || count === null || count === undefined) return null;
  if (count > threshold) return null;

  // Auto-pick variant if not specified
  const resolvedVariant = variant ?? (count === 0 ? 'red' : count === 1 ? 'amber' : 'blue');
  const v = VARIANT[resolvedVariant] ?? VARIANT.amber;

  const resolvedLabel = label ?? (count === 0 ? 'Limit reached' : `${count} left`);

  return (
    <span
      style={{
        ...POSITION_STYLES[position],
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 18,
        height: 18,
        padding: '0 5px',
        borderRadius: 9,
        background: v.bg,
        color: v.text,
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: 0.2,
        whiteSpace: 'nowrap',
        boxShadow: `0 2px 8px ${v.shadow}`,
        lineHeight: 1,
        userSelect: 'none',
        pointerEvents: 'none',
      }}
    >
      {resolvedLabel}
    </span>
  );
}
