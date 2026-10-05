import { useId } from 'react';

/** The Zynth mark: a bold "Z" on a gold tile. Identical to public/favicon.svg so the tab icon and the in-app logo match. */
export function BrandMark({ size = 30, style, className }) {
  const gid = `bm${useId().replace(/:/g, '')}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F4B424" />
          <stop offset="1" stopColor="#C98A06" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill={`url(#${gid})`} />
      <path d="M16 16H48V24L28 40H48V48H16V40L36 24H16Z" fill="#1a1203" />
    </svg>
  );
}
