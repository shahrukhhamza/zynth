import { X, Settings, Moon, Sun, Globe, Bell, RefreshCw } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useTimezone } from '../contexts/TimezoneContext';
import { useState, useEffect } from 'react';

export default function SettingsModal({ onClose, autoRefresh, onToggleAutoRefresh }) {
  const theme = useTheme();
  const { selectedTimezone, changeTimezone, timezones } = useTimezone();
  const [notifications, setNotifications] = useState(true);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const Toggle = ({ value, onChange }) => (
    <button
      onClick={onChange}
      className="relative inline-flex items-center rounded-full transition-colors duration-200 flex-shrink-0"
      style={{
        width: 44, height: 24,
        backgroundColor: value ? theme.accent : (theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)'),
      }}
      aria-checked={value}
      role="switch"
    >
      <span
        className="inline-block rounded-full bg-white shadow transition-transform duration-200"
        style={{
          width: 18, height: 18,
          transform: value ? 'translateX(22px)' : 'translateX(3px)',
        }}
      />
    </button>
  );

  /* A section card with a label header */
  const Section = ({ title, children }) => (
    <div className="mb-5">
      <p
        className="text-[11px] font-semibold uppercase tracking-widest mb-2 px-1"
        style={{ color: theme.muted }}
      >
        {title}
      </p>
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: `1px solid ${theme.border}`, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}
      >
        {children}
      </div>
    </div>
  );

  /* Row: icon · label + description on left | control on right — never overlaps */
  const Row = ({ icon: Icon, iconColor, label, description, control, last }) => (
    <div
      className="flex items-center gap-3 px-4 py-3"
      style={{ borderBottom: last ? 'none' : `1px solid ${theme.border}` }}
    >
      {/* Icon bubble */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: iconColor ? `${iconColor}18` : (theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)') }}
      >
        <Icon className="w-4 h-4" style={{ color: iconColor || theme.muted }} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight" style={{ color: theme.text }}>{label}</p>
        {description && (
          <p className="text-xs mt-0.5 leading-snug" style={{ color: theme.muted }}>{description}</p>
        )}
      </div>

      {/* Control – never shrinks, never overlaps text */}
      <div className="flex-shrink-0 ml-2">{control}</div>
    </div>
  );

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[300] flex items-end sm:items-center justify-center sm:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', top: isMobile ? '64px' : 0 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full rounded-t-2xl sm:rounded-2xl overflow-hidden"
        style={{
          backgroundColor: theme.surface,
          border: `1px solid ${theme.border}`,
          maxWidth: 480,
          maxHeight: isMobile ? 'calc(100vh - 80px)' : 'calc(100vh - 80px)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'hidden',
          boxShadow: theme.isDark ? '0 -8px 40px rgba(0,0,0,0.7)' : '0 -8px 40px rgba(0,0,0,0.18)',
        }}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-9 h-1 rounded-full" style={{ backgroundColor: theme.border }} />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: theme.border }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${theme.accent}18`, border: `1px solid ${theme.accent}30` }}
            >
              <Settings className="w-4 h-4" style={{ color: theme.accent }} />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: theme.text }}>Settings</h2>
              <p className="text-xs" style={{ color: theme.muted }}>Preferences &amp; display options</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: theme.muted, backgroundColor: 'transparent' }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body — only this part scrolls */}
        <div className="p-5 overflow-y-auto flex-1">

          {/* Appearance */}
          <Section title="Appearance">
            <Row
              icon={theme.isDark ? Moon : Sun}
              iconColor={theme.accent}
              label="Dark Mode"
              description={theme.isDark ? 'Currently using dark theme' : 'Currently using light theme'}
              control={<Toggle value={theme.isDark} onChange={theme.toggleTheme} />}
              last
            />
          </Section>

          {/* Data & Refresh */}
          <Section title="Data & Refresh">
            <Row
              icon={RefreshCw}
              label="Auto-refresh"
              description="Automatically reload market data every 30s"
              control={<Toggle value={autoRefresh} onChange={onToggleAutoRefresh} />}
            />
            <Row
              icon={Bell}
              label="Notifications"
              description="Show alerts for high-impact market events"
              control={<Toggle value={notifications} onChange={() => setNotifications(v => !v)} />}
              last
            />
          </Section>

          {/* Timezone — select lives below the label row so it has full width */}
          <Section title="Timezone">
            <div className="px-4 py-3">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)' }}
                >
                  <Globe className="w-4 h-4" style={{ color: theme.muted }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium" style={{ color: theme.text }}>Market Timezone</p>
                  <p className="text-xs" style={{ color: theme.muted }}>Used across all charts and calendar</p>
                </div>
              </div>
              <select
                value={selectedTimezone}
                onChange={e => changeTimezone(e.target.value)}
                className="w-full text-sm rounded-lg px-3 py-2 outline-none"
                style={{
                  backgroundColor: theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                  color: theme.text,
                  border: `1px solid ${theme.border}`,
                }}
              >
                {timezones.map(tz => (
                  <option key={tz.id} value={tz.id} style={{ backgroundColor: theme.surface, color: theme.text }}>
                    {tz.name}
                  </option>
                ))}
              </select>
            </div>
          </Section>

          <p className="text-center text-xs pb-1" style={{ color: theme.muted }}>
            More settings coming in future updates.
          </p>
        </div>
      </div>
    </div>
  );
}

