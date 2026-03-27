/**
 * UsageProgressBar — animated bar showing % of a resource used.
 *
 * Hides itself entirely when the limit is Infinity (unlimited plan).
 *
 * Props:
 *   used          {number}  — how many have been consumed
 *   limit         {number}  — total allowed (pass Infinity for unlimited)
 *   isUnlimited   {boolean} — shortcut: if true, renders null
 *   colorScheme   {'blue'|'teal'|'amber'|'red'} — bar color (default: 'blue')
 *   height        {number}  — bar height in px (default: 4)
 *   showLabel     {boolean} — render "X / Y" text below (default: false)
 *   style         {object}  — extra styles for wrapper div
 *
 * Usage:
 *   <UsageProgressBar used={aiMonthlyUsed} limit={50} colorScheme="blue" />
 *   <UsageProgressBar used={journalCount}  limit={maxJournal} colorScheme="teal" />
 */
import { useLayoutEffect, useRef } from 'react';

const COLOR_SCHEMES = {
  blue:  { low: '#3B82F6', warn: '#F59E0B', crit: '#F43F5E', track: 'rgba(59,130,246,0.12)'  },
  teal:  { low: '#14B8A6', warn: '#F59E0B', crit: '#F43F5E', track: 'rgba(20,184,166,0.12)'  },
  amber: { low: '#F59E0B', warn: '#F59E0B', crit: '#F43F5E', track: 'rgba(245,158,11,0.12)'  },
  red:   { low: '#F43F5E', warn: '#F43F5E', crit: '#F43F5E', track: 'rgba(244,63,94,0.12)'   },
};

export default function UsageProgressBar({
  used        = 0,
  limit       = 100,
  isUnlimited = false,
  colorScheme = 'blue',
  height      = 4,
  showLabel   = false,
  style       = {},
}) {
  const barRef = useRef(null);

  const pct    = isUnlimited || limit === Infinity ? 0 : Math.min(100, (used / limit) * 100);
  const colors = COLOR_SCHEMES[colorScheme] ?? COLOR_SCHEMES.blue;

  // Pick color based on how full the bar is
  const barColor =
    pct >= 90 ? colors.crit :
    pct >= 70 ? colors.warn :
    colors.low;

  // Animate width from 0 on mount — uses a ref so no re-render
  useLayoutEffect(() => {
    if (!barRef.current) return;
    barRef.current.style.width = '0%';
    const raf = requestAnimationFrame(() => {
      // Small delay ensures the CSS transition fires
      setTimeout(() => {
        if (barRef.current) barRef.current.style.width = `${pct}%`;
      }, 40);
    });
    return () => cancelAnimationFrame(raf);
  }, [pct]);

  // Hide entirely for unlimited plans
  if (isUnlimited || limit === Infinity) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, ...style }}>
      {/* Track */}
      <div
        style={{
          width: '100%', height, borderRadius: height,
          background: colors.track,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Fill */}
        <div
          ref={barRef}
          style={{
            position: 'absolute', left: 0, top: 0,
            height: '100%', borderRadius: height,
            background: barColor,
            transition: 'width 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
            width: '0%', // animated via ref
          }}
        />
      </div>

      {showLabel && (
        <span
          style={{
            fontSize: 10, color: barColor,
            fontWeight: 600, letterSpacing: 0.2,
          }}
        >
          {used} / {limit}
        </span>
      )}
    </div>
  );
}
