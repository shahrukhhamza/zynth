import { AlertCircle } from 'lucide-react';

/**
 * Shared professional error bar used across the app.
 * Accepts `message` (string), optional `className`, and optional `style` overrides.
 */
export default function ErrorBar({ message, className = '', style = {} }) {
  if (!message) return null;
  return (
    <div
      className={`flex items-start gap-2.5 px-3.5 py-3 rounded-xl ${className}`}
      style={{
        background: 'rgba(239,68,68,0.07)',
        border: '1px solid rgba(239,68,68,0.18)',
        borderLeft: '3px solid #f87171',
        ...style,
      }}
    >
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#f87171' }} />
      <span style={{ color: '#f87171', lineHeight: 1.55, fontSize: '13px' }}>{message}</span>
    </div>
  );
}
