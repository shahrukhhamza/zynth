export function BrandMark({ size = 30, style, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
      className={className}
      aria-hidden="true"
    >
      <path d="M8 9 L32 9 L32 13 L8 13 Z" fill="#FF4D00" />
      <path d="M8 27 L32 27 L32 31 L8 31 Z" fill="#FF4D00" />
      <path d="M32 13 L8 27 L8 31 L10 31 L34 15 L34 13 Z" fill="#FF6B00" />
      <polyline points="10,28 16,22 20,25 26,16 30,12" stroke="#FF7A00" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M28,10 L32,12 L29,15" stroke="#FF7A00" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="19" y="21" width="2.5" height="5" rx="0.5" fill="#FF7A00" />
      <line x1="20.25" y1="19.5" x2="20.25" y2="21" stroke="#FF7A00" strokeWidth="1" strokeLinecap="round" />
      <line x1="20.25" y1="26" x2="20.25" y2="27.5" stroke="#FF7A00" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}
