import { X, Settings, Moon, Sun, Globe, Bell, RefreshCw, ChevronDown } from 'lucide-react';
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

  const emerald = '#10b981';
  const sheetBg = theme.isDark ? '#111111' : theme.surface;

  // ── Shared sub-components ────────────────────────────────────────────────

  const Toggle = ({ value, onChange }) => (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={value}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: 9999,
        width: 48,
        height: 26,
        minWidth: 48,
        flexShrink: 0,
        backgroundColor: value ? emerald : (theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)'),
        border: 'none',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
      }}
    >
      <span style={{
        display: 'inline-block',
        borderRadius: '50%',
        backgroundColor: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        width: 20,
        height: 20,
        transform: value ? 'translateX(24px)' : 'translateX(3px)',
        transition: 'transform 0.2s',
      }} />
    </button>
  );

  const SectionLabel = ({ title }) => (
    <p style={{
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.1em',
      color: theme.isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)',
      padding: '16px 0 8px',
      margin: 0,
      textTransform: 'uppercase',
    }}>
      {title}
    </p>
  );

  const Row = ({ icon: Icon, label, description, control }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: 16,
      backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
      borderRadius: 12,
      marginBottom: 8,
      minHeight: 72,
    }}>
      <div style={{
        width: 40, height: 40, minWidth: 40,
        backgroundColor: `${emerald}1a`,
        border: `1px solid ${emerald}33`,
        borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon style={{ color: emerald, width: 18, height: 18 }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          color: theme.text, fontWeight: 600, fontSize: 15,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0,
        }}>{label}</p>
        {description && (
          <p style={{
            color: theme.isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)',
            fontSize: 13, marginTop: 2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 0,
          }}>{description}</p>
        )}
      </div>
      {control}
    </div>
  );

  const TimezoneBlock = ({ bg }) => (
    <div style={{
      backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
      borderRadius: 12, padding: 16, marginBottom: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 40, height: 40, minWidth: 40,
          backgroundColor: `${emerald}1a`, border: `1px solid ${emerald}33`,
          borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Globe style={{ color: emerald, width: 18, height: 18 }} />
        </div>
        <div>
          <p style={{ color: theme.text, fontWeight: 600, fontSize: 15, margin: 0 }}>Market Timezone</p>
          <p style={{ color: theme.isDark ? 'rgba(255,255,255,0.4)' : theme.muted, fontSize: 13, marginTop: 2, marginBottom: 0 }}>
            Used across all charts and calendar
          </p>
        </div>
      </div>
      <div style={{ position: 'relative' }}>
        <select
          value={selectedTimezone}
          onChange={e => changeTimezone(e.target.value)}
          style={{
            width: '100%',
            backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.1)' : theme.border}`,
            borderRadius: 10,
            padding: '13px 40px 13px 16px',
            color: theme.text,
            fontSize: 15,
            appearance: 'none',
            WebkitAppearance: 'none',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          {timezones.map(tz => (
            <option key={tz.id} value={tz.id} style={{ backgroundColor: bg || theme.surface, color: theme.text }}>
              {tz.name}
            </option>
          ))}
        </select>
        <ChevronDown style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          width: 16, height: 16,
          color: theme.isDark ? 'rgba(255,255,255,0.4)' : theme.muted,
          pointerEvents: 'none',
        }} />
      </div>
    </div>
  );

  // ── MOBILE — proper bottom sheet ─────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 999,
          }}
        />

        {/* Sheet */}
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          height: '85vh',
          borderRadius: '20px 20px 0 0',
          backgroundColor: sheetBg,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Drag handle */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4, flexShrink: 0 }}>
            <div style={{ width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2 }} />
          </div>

          {/* Sticky header */}
          <div style={{
            position: 'sticky', top: 0,
            backgroundColor: sheetBg,
            zIndex: 10,
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 36, height: 36,
                backgroundColor: `${emerald}18`, border: `1px solid ${emerald}30`,
                borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Settings style={{ color: emerald, width: 16, height: 16 }} />
              </div>
              <div>
                <h2 style={{ color: theme.text, fontWeight: 700, fontSize: 16, margin: 0 }}>Settings</h2>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>Preferences &amp; display options</p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32,
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.5)',
              }}
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>

          {/* Scrollable content */}
          <div style={{
            flex: 1, overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: '0 16px',
            paddingBottom: 40,
          }}>
            <SectionLabel title="Appearance" />
            <Row
              icon={theme.isDark ? Moon : Sun}
              label="Dark Mode"
              description={theme.isDark ? 'Currently using dark theme' : 'Currently using light theme'}
              control={<Toggle value={theme.isDark} onChange={theme.toggleTheme} />}
            />

            <SectionLabel title="Data & Refresh" />
            <Row
              icon={RefreshCw}
              label="Auto-refresh"
              description="Auto reload market data every 30s"
              control={<Toggle value={autoRefresh} onChange={onToggleAutoRefresh} />}
            />
            <Row
              icon={Bell}
              label="Notifications"
              description="Alerts for high-impact market events"
              control={<Toggle value={notifications} onChange={() => setNotifications(v => !v)} />}
            />

            <SectionLabel title="Timezone" />
            <TimezoneBlock bg={theme.isDark ? '#1a1a1a' : theme.surface} />

            <p style={{ textAlign: 'center', fontSize: 12, color: theme.muted, paddingTop: 8, paddingBottom: 8 }}>
              More settings coming in future updates.
            </p>
          </div>
        </div>
      </>
    );
  }

  // ── DESKTOP — centered modal (unchanged behaviour) ────────────────────────
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        backgroundColor: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        backgroundColor: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: 16,
        width: '100%', maxWidth: 480,
        maxHeight: 'calc(100vh - 80px)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: theme.isDark ? '0 8px 40px rgba(0,0,0,0.7)' : '0 8px 40px rgba(0,0,0,0.18)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: `1px solid ${theme.border}`,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36,
              backgroundColor: `${emerald}18`, border: `1px solid ${emerald}30`,
              borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Settings style={{ color: emerald, width: 16, height: 16 }} />
            </div>
            <div>
              <h2 style={{ color: theme.text, fontWeight: 700, fontSize: 16, margin: 0 }}>Settings</h2>
              <p style={{ color: theme.muted, fontSize: 12, margin: 0 }}>Preferences &amp; display options</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32,
              backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 'none', cursor: 'pointer', color: theme.muted,
            }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px', paddingBottom: 24 }}>
          <SectionLabel title="Appearance" />
          <Row
            icon={theme.isDark ? Moon : Sun}
            label="Dark Mode"
            description={theme.isDark ? 'Currently using dark theme' : 'Currently using light theme'}
            control={<Toggle value={theme.isDark} onChange={theme.toggleTheme} />}
          />

          <SectionLabel title="Data & Refresh" />
          <Row
            icon={RefreshCw}
            label="Auto-refresh"
            description="Auto reload market data every 30s"
            control={<Toggle value={autoRefresh} onChange={onToggleAutoRefresh} />}
          />
          <Row
            icon={Bell}
            label="Notifications"
            description="Alerts for high-impact market events"
            control={<Toggle value={notifications} onChange={() => setNotifications(v => !v)} />}
          />

          <SectionLabel title="Timezone" />
          <TimezoneBlock />

          <p style={{ textAlign: 'center', fontSize: 12, color: theme.muted, paddingTop: 8 }}>
            More settings coming in future updates.
          </p>
        </div>
      </div>
    </div>
  );
}

