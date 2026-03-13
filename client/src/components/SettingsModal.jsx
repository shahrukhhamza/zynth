import { X, Settings, Moon, Sun, Globe, Bell, BellOff, RefreshCw } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useTimezone } from '../contexts/TimezoneContext';
import { useState } from 'react';

export default function SettingsModal({ onClose, autoRefresh, onToggleAutoRefresh }) {
  const theme = useTheme();
  const { selectedTimezone, changeTimezone, timezones } = useTimezone();
  const [notifications, setNotifications] = useState(true);

  const Section = ({ title, children }) => (
    <div className="mb-6">
      <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: theme.muted }}>
        {title}
      </p>
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: `1px solid ${theme.border}` }}
      >
        {children}
      </div>
    </div>
  );

  const Row = ({ icon: Icon, label, description, children, last }) => (
    <div
      className="flex items-center justify-between px-4 py-3"
      style={{
        borderBottom: last ? 'none' : `1px solid ${theme.border}`,
        background: 'transparent',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}
        >
          <Icon className="w-4 h-4" style={{ color: theme.muted }} />
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: theme.text }}>{label}</p>
          {description && (
            <p className="text-xs mt-0.5" style={{ color: theme.muted }}>{description}</p>
          )}
        </div>
      </div>
      <div className="flex-shrink-0 ml-4">{children}</div>
    </div>
  );

  const Toggle = ({ value, onChange }) => (
    <button
      onClick={onChange}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 flex-shrink-0"
      style={{ backgroundColor: value ? theme.accent : (theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.15)') }}
    >
      <span
        className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow"
        style={{ transform: value ? 'translateX(1.5rem)' : 'translateX(0.25rem)' }}
      />
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full rounded-2xl overflow-hidden"
        style={{
          backgroundColor: theme.surface,
          border: `1px solid ${theme.border}`,
          maxWidth: '480px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: theme.border, background: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: theme.accentGlow, border: `1px solid ${theme.accent}40` }}
            >
              <Settings className="w-5 h-5" style={{ color: theme.accent }} />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: theme.text }}>Settings</h2>
              <p className="text-xs" style={{ color: theme.muted }}>Preferences and display options</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: theme.muted }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {/* Appearance */}
          <Section title="Appearance">
            <Row
              icon={theme.isDark ? Moon : Sun}
              label="Dark Mode"
              description={theme.isDark ? 'Currently using dark theme' : 'Currently using light theme'}
              last
            >
              <Toggle value={theme.isDark} onChange={theme.toggleTheme} />
            </Row>
          </Section>

          {/* Data */}
          <Section title="Data & Refresh">
            <Row
              icon={RefreshCw}
              label="Auto-refresh"
              description="Automatically reload market data"
            >
              <Toggle value={autoRefresh} onChange={onToggleAutoRefresh} />
            </Row>
            <Row
              icon={Bell}
              label="Notifications"
              description="Show alerts for market events"
              last
            >
              <Toggle value={notifications} onChange={() => setNotifications(v => !v)} />
            </Row>
          </Section>

          {/* Timezone */}
          <Section title="Timezone">
            <Row icon={Globe} label="Market Timezone" description="Used across all charts and calendar" last>
              <select
                value={selectedTimezone}
                onChange={e => changeTimezone(e.target.value)}
                className="text-sm rounded-lg px-2 py-1.5 outline-none"
                style={{
                  backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  color: theme.text,
                  border: `1px solid ${theme.border}`,
                  maxWidth: '140px',
                }}
              >
                {timezones.map(tz => (
                  <option
                    key={tz.id}
                    value={tz.id}
                    style={{ backgroundColor: theme.surface, color: theme.text }}
                  >
                    {tz.name}
                  </option>
                ))}
              </select>
            </Row>
          </Section>

          <p className="text-center text-xs" style={{ color: theme.muted }}>
            More settings coming in future updates.
          </p>
        </div>
      </div>
    </div>
  );
}
