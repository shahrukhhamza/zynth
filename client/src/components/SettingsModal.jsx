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

  const emerald = '#CA8A04';
  const sheetBg = theme.surface;

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
        width: 56,
        height: 32,
        minWidth: 56,
        flexShrink: 0,
        backgroundColor: value ? emerald : (theme.isDark ? 'rgba(255,255,255,0.16)' : 'rgba(15,23,42,0.18)'),
        border: `1px solid ${value ? `${emerald}77` : theme.border}`,
        cursor: 'pointer',
        boxShadow: value ? `0 0 0 3px ${emerald}22` : 'none',
        transition: 'all 0.2s',
      }}
    >
      <span style={{
        display: 'inline-block',
        borderRadius: '50%',
        backgroundColor: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.28)',
        width: 24,
        height: 24,
        transform: value ? 'translateX(28px)' : 'translateX(3px)',
        transition: 'transform 0.2s',
      }} />
    </button>
  );

  const SectionCard = ({ icon: Icon, title, subtitle, children }) => (
    <div
      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-5 shadow-sm"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{
          width: 36,
          height: 36,
          minWidth: 36,
          backgroundColor: `${emerald}1a`,
          border: `1px solid ${emerald}33`,
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Icon style={{ color: emerald, width: 16, height: 16 }} />
        </div>
        <div>
          <p className="text-[14px] font-bold text-zinc-900 dark:text-zinc-100 m-0">{title}</p>
          {subtitle && (
            <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mt-0.5 mb-0">{subtitle}</p>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>
    </div>
  );

  const Row = ({ icon: Icon, label, description, control }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: 14,
      backgroundColor: theme.isDark ? 'rgba(15,23,42,0.55)' : '#f8fafc',
      border: theme.isDark ? '1px solid rgba(148,163,184,0.20)' : '1px solid rgba(203,213,225,0.9)',
      borderRadius: 12,
      minHeight: 70,
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
          color: theme.isDark ? '#fafaf9' : '#0b0b0f', fontWeight: 600, fontSize: 15,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0,
        }}>{label}</p>
        {description && (
          <p style={{
            color: theme.isDark ? '#94a3b8' : '#64748b',
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
      backgroundColor: theme.isDark ? 'rgba(15,23,42,0.55)' : '#f8fafc',
      border: theme.isDark ? '1px solid rgba(148,163,184,0.20)' : '1px solid rgba(203,213,225,0.9)',
      borderRadius: 12, padding: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div style={{
          width: 40, height: 40, minWidth: 40,
          backgroundColor: `${emerald}1a`, border: `1px solid ${emerald}33`,
          borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Globe style={{ color: emerald, width: 18, height: 18 }} />
        </div>
        <div>
          <p className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100 m-0">Market Timezone</p>
          <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mt-0.5 mb-0">
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
            backgroundColor: theme.isDark ? 'rgba(15,23,42,0.9)' : '#ffffff',
            border: theme.isDark ? '1px solid rgba(148,163,184,0.25)' : '1px solid rgba(203,213,225,0.9)',
            borderRadius: 10,
            padding: '12px 40px 12px 14px',
            color: theme.isDark ? '#fafaf9' : '#0b0b0f',
            fontSize: 14,
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
          color: theme.muted,
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
          height: '100dvh',
          borderRadius: '20px 20px 0 0',
          backgroundColor: theme.isDark ? '#0b0b0f' : '#ffffff',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Drag handle */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 6, paddingBottom: 2, flexShrink: 0 }}>
            <div style={{ width: 40, height: 4, backgroundColor: theme.border, borderRadius: 2 }} />
          </div>

          {/* Sticky header */}
          <div style={{
            position: 'sticky', top: 0,
            backgroundColor: theme.isDark ? '#0b0b0f' : '#ffffff',
            zIndex: 10,
            padding: '8px 20px 10px',
            borderBottom: theme.isDark ? '1px solid rgba(148,163,184,0.20)' : '1px solid rgba(203,213,225,0.8)',
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
                <h2 className="text-[16px] font-bold text-zinc-900 dark:text-zinc-100 m-0">Settings</h2>
                <p className="text-[12px] text-zinc-500 dark:text-zinc-400 m-0">Preferences &amp; display options</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-95"
              style={{
                width: 32, height: 32,
                backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', cursor: 'pointer',
                color: theme.muted,
              }}
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>

          {/* Scrollable content */}
          <div style={{
            flex: 1, overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: '14px 16px 0',
            paddingBottom: 40,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <SectionCard
                icon={theme.isDark ? Moon : Sun}
                title="Appearance"
                subtitle="Theme and display preferences"
              >
                <Row
                  icon={theme.isDark ? Moon : Sun}
                  label="Dark Mode"
                  description={theme.isDark ? 'Currently using dark theme' : 'Currently using light theme'}
                  control={<Toggle value={theme.isDark} onChange={theme.toggleTheme} />}
                />
              </SectionCard>

              <SectionCard
                icon={RefreshCw}
                title="Data & Refresh"
                subtitle="Live updates and event alerts"
              >
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
              </SectionCard>

              <SectionCard
                icon={Globe}
                title="Timezone"
                subtitle="Used across charts and calendar"
              >
                <TimezoneBlock bg={theme.surface2} />
              </SectionCard>
            </div>

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
        backgroundColor: theme.isDark ? '#0b0b0f' : '#ffffff',
        border: theme.isDark ? '1px solid rgba(148,163,184,0.20)' : '1px solid rgba(203,213,225,0.8)',
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
          borderBottom: theme.isDark ? '1px solid rgba(148,163,184,0.20)' : '1px solid rgba(203,213,225,0.8)',
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
              <h2 className="text-[16px] font-bold text-zinc-900 dark:text-zinc-100 m-0">Settings</h2>
              <p className="text-[12px] text-zinc-500 dark:text-zinc-400 m-0">Preferences &amp; display options</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-95"
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
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <SectionCard
              icon={theme.isDark ? Moon : Sun}
              title="Appearance"
              subtitle="Theme and display preferences"
            >
              <Row
                icon={theme.isDark ? Moon : Sun}
                label="Dark Mode"
                description={theme.isDark ? 'Currently using dark theme' : 'Currently using light theme'}
                control={<Toggle value={theme.isDark} onChange={theme.toggleTheme} />}
              />
            </SectionCard>

            <SectionCard
              icon={RefreshCw}
              title="Data & Refresh"
              subtitle="Live updates and event alerts"
            >
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
            </SectionCard>

            <SectionCard
              icon={Globe}
              title="Timezone"
              subtitle="Used across charts and calendar"
            >
              <TimezoneBlock />
            </SectionCard>
          </div>

          <p style={{ textAlign: 'center', fontSize: 12, color: theme.muted, paddingTop: 8 }}>
            More settings coming in future updates.
          </p>
        </div>
      </div>
    </div>
  );
}

