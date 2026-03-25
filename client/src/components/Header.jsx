import { Sun, Moon, Globe, LogOut, ChevronDown, User, Settings, Shield, Menu, X, ChevronRight, Bell } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useTimezone } from '../contexts/TimezoneContext';
import { useAuth } from '../contexts/AuthContext';
import { useState, useRef, useEffect } from 'react';
import ProfileModal from './ProfileModal';
import SettingsModal from './SettingsModal';
import PlanBadge from './PlanBadge';
import { BrandMark } from './BrandLogo';
import { resolveMediaUrl } from '../utils/mediaUrl';

const AVATAR_COLOR_MAP = {
  emerald: '#10b981', blue: '#3b82f6', purple: '#0ea5e9',
  orange: '#f97316', rose: '#f43f5e', amber: '#f59e0b',
  cyan: '#06b6d4', indigo: '#6366f1',
};

const VIEW_LABELS = {
  data:         'Dashboard',
  journal:      'Trade Journal',
  intelligence: 'AI Insights',
  markets:      'Economic Data',
  calendar:     'Economic Calendar',
  news:         'Market News',
  help:         'Help & Support',
  backtest:     'Backtesting',
  lounge:       'Traders Lounge',
  tools:        'Tools',
  admin:        'Admin',
};

const VIEW_SUBTITLES = {
  data:         'Market overview & intelligence',
  journal:      'Track, analyse, improve',
  intelligence: 'Macroeconomic AI signals',
  markets:      'Live prices & correlations',
  calendar:     'Economic events & surprises',
  news:         'Real-time financial news',
  help:         'Guides, support, and product help',
  admin:        'Platform administration',
};

function Header({
  autoRefresh, onToggleAutoRefresh, onToggleSidebar,
  mobileSidebarOpen, sidebarCollapsed = false, onExpandSidebar,
  currentView, isMobile = false,
}) {
  const theme = useTheme();
  const { selectedTimezone, changeTimezone, getTimezoneInfo, timezones } = useTimezone();
  const { user, logout } = useAuth();
  const [showTimezoneDropdown, setShowTimezoneDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const avatarBg  = AVATAR_COLOR_MAP[user?.avatar_color] ?? '#10b981';
  const avatarSrc = user?.avatar_url ? resolveMediaUrl(user.avatar_url) : (user?.avatar ?? null);
  const dropdownRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowTimezoneDropdown(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentTz = getTimezoneInfo();

  // Header always dark — premium feel
  const H_BG     = theme.isDark ? theme.bg : theme.surface;
  const H_BORDER = theme.border;
  const H_TEXT   = theme.text;
  const H_MUTED  = theme.muted;

  const sidebarW = isMobile ? 0 : (sidebarCollapsed ? 60 : 236);

  return (
    <>
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: isMobile ? 0 : (sidebarCollapsed ? 60 : 236),
          width: isMobile ? '100vw' : (sidebarCollapsed ? 'calc(100vw - 60px)' : 'calc(100vw - 236px)'),
          height: isMobile ? 56 : 60,
          padding: isMobile ? '0 14px' : '0 24px',
          transition: 'left 0.22s cubic-bezier(0.4,0,0.2,1), width 0.22s cubic-bezier(0.4,0,0.2,1)',
          zIndex: 100,
          backgroundColor: H_BG,
          borderBottom: `1px solid ${H_BORDER}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        {/* ── LEFT ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>

          {/* Mobile: hamburger + logo */}
          {isMobile ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={onToggleSidebar}
                style={{
                  width: 34, height: 34,
                  background: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  borderRadius: 8,
                  border: `1px solid ${H_BORDER}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: H_MUTED,
                }}
              >
                {mobileSidebarOpen
                  ? <X style={{ width: 16, height: 16 }} />
                  : <Menu style={{ width: 16, height: 16 }} />}
              </button>
              <BrandMark size={26} />
              <span style={{ fontSize: 16, fontWeight: 700, color: H_TEXT, letterSpacing: '-0.02em' }}>
                Zynth
              </span>
            </div>
          ) : (
            <>
              {/* Desktop: expand button when collapsed */}
              {sidebarCollapsed && (
                <button
                  onClick={onExpandSidebar}
                  title="Expand sidebar"
                  style={{
                    width: 28, height: 28, borderRadius: 7,
                    background: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                    border: `1px solid ${H_BORDER}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: H_MUTED,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#3b82f6'; e.currentTarget.style.borderColor = '#3b82f640'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = H_MUTED; e.currentTarget.style.borderColor = H_BORDER; }}
                >
                  <ChevronRight style={{ width: 14, height: 14 }} />
                </button>
              )}

              {/* Page title + subtitle */}
              <div>
                <h1 style={{
                  fontSize: 15, fontWeight: 600, color: H_TEXT,
                  letterSpacing: '-0.01em', lineHeight: 1.2, margin: 0,
                }}>
                  {VIEW_LABELS[currentView] ?? 'Dashboard'}
                </h1>
                {VIEW_SUBTITLES[currentView] && (
                  <p style={{ fontSize: 11, color: H_MUTED, margin: 0, lineHeight: 1 }}>
                    {VIEW_SUBTITLES[currentView]}
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── RIGHT ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>

          {/* Theme toggle */}
          <button
            onClick={theme.toggleTheme}
            title={theme.isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{
              width: 34, height: 34,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 8,
              background: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
              border: `1px solid ${H_BORDER}`,
              cursor: 'pointer',
              color: H_MUTED,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f59e0b'; e.currentTarget.style.borderColor = '#f59e0b40'; }}
            onMouseLeave={e => { e.currentTarget.style.color = H_MUTED; e.currentTarget.style.borderColor = H_BORDER; }}
          >
            {theme.isDark
              ? <Sun style={{ width: 15, height: 15 }} />
              : <Moon style={{ width: 15, height: 15 }} />}
          </button>

          {/* Timezone selector */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowTimezoneDropdown(p => !p)}
              style={{
                height: 34, padding: '0 10px',
                display: 'flex', alignItems: 'center', gap: 6,
                borderRadius: 8,
                background: showTimezoneDropdown ? (theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)') : (theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'),
                border: `1px solid ${H_BORDER}`,
                cursor: 'pointer', color: H_MUTED,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { if (!showTimezoneDropdown) e.currentTarget.style.background = theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'; }}
              onMouseLeave={e => { if (!showTimezoneDropdown) e.currentTarget.style.background = theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'; }}
            >
              <Globe style={{ width: 13, height: 13, color: '#3b82f6' }} />
              {!isMobile && (
                <span style={{ fontSize: 12, fontWeight: 500, color: H_TEXT }}>
                  {currentTz?.id?.toUpperCase() ?? 'UTC'}
                </span>
              )}
              <ChevronDown style={{
                width: 11, height: 11,
                transform: showTimezoneDropdown ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 0.15s ease',
              }} />
            </button>

            {showTimezoneDropdown && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                width: 220,
                background: theme.surface,
                border: `1px solid ${H_BORDER}`,
                borderRadius: 10,
                boxShadow: theme.isDark ? '0 16px 48px rgba(0,0,0,0.7)' : '0 8px 32px rgba(0,0,0,0.12)',
                zIndex: 200,
                overflow: 'hidden',
              }}>
                <div style={{ padding: '8px 12px 6px', borderBottom: `1px solid ${H_BORDER}` }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: H_MUTED, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Market Timezone
                  </p>
                </div>
                <div style={{ maxHeight: 240, overflowY: 'auto', padding: '4px' }}>
                  {timezones?.map(tz => (
                    <button
                      key={tz.id}
                      onClick={() => { changeTimezone(tz.id); setShowTimezoneDropdown(false); }}
                      style={{
                        width: '100%', padding: '7px 10px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        borderRadius: 7, border: 'none',
                        background: selectedTimezone === tz.id ? 'rgba(16,185,129,0.1)' : 'transparent',
                        cursor: 'pointer', transition: 'background 0.12s ease',
                        textAlign: 'left',
                      }}
                      onMouseEnter={e => { if (selectedTimezone !== tz.id) e.currentTarget.style.background = theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'; }}
                      onMouseLeave={e => { if (selectedTimezone !== tz.id) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span style={{ fontSize: 12, color: selectedTimezone === tz.id ? '#3b82f6' : H_MUTED }}>
                        {tz.name || tz.label || tz.id?.toUpperCase()}
                      </span>
                      {selectedTimezone === tz.id && (
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', display: 'block' }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          {user && (
            <div ref={userMenuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowUserMenu(p => !p)}
                style={{
                  height: 34, padding: '0 10px 0 6px',
                  display: 'flex', alignItems: 'center', gap: 8,
                  borderRadius: 8,
                  background: showUserMenu ? (theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)') : (theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'),
                  border: `1px solid ${H_BORDER}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { if (!showUserMenu) e.currentTarget.style.background = theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'; }}
                onMouseLeave={e => { if (!showUserMenu) e.currentTarget.style.background = theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'; }}
              >
                {/* Avatar */}
                {avatarSrc && !avatarError ? (
                  <img
                    src={avatarSrc}
                    alt={user.name}
                    onError={() => setAvatarError(true)}
                    style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    width: 24, height: 24, borderRadius: 6,
                    background: `linear-gradient(135deg, ${avatarBg}, ${avatarBg}bb)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: '#fff',
                  }}>
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Name + plan */}
                <div className="hidden sm:flex flex-col items-start" style={{ lineHeight: 1.2 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: H_TEXT }}>
                    {user.name?.split(' ')[0]}
                  </span>
                  <PlanBadge className="mt-0.5" />
                </div>

                <ChevronDown style={{
                  width: 12, height: 12, color: H_MUTED,
                  transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0)',
                  transition: 'transform 0.15s ease',
                }} />
              </button>

              {/* Dropdown */}
              {showUserMenu && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                  width: 240,
                  background: theme.surface,
                  border: `1px solid ${H_BORDER}`,
                  borderRadius: 12,
                  boxShadow: theme.isDark ? '0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)' : '0 8px 32px rgba(0,0,0,0.12)',
                  zIndex: 200,
                  overflow: 'hidden',
                }}>
                  {/* Profile header */}
                  <button
                    onClick={() => { setShowUserMenu(false); setShowProfileModal(true); }}
                    style={{
                      width: '100%', padding: '14px 16px',
                      display: 'flex', alignItems: 'center', gap: 12,
                      background: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                      border: 'none', cursor: 'pointer', textAlign: 'left',
                      transition: 'background 0.15s ease',
                      borderBottom: `1px solid ${H_BORDER}`,
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'}
                  >
                    {avatarSrc && !avatarError ? (
                      <img
                        src={avatarSrc}
                        alt={user.name}
                        style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
                      />
                    ) : (
                      <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: `linear-gradient(135deg, ${avatarBg}, ${avatarBg}bb)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0,
                        boxShadow: `0 4px 12px ${avatarBg}40`,
                      }}>
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: theme.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user.name}
                      </p>
                      <p style={{ fontSize: 11, color: H_MUTED, margin: '2px 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user.email}
                      </p>
                      <PlanBadge />
                    </div>
                  </button>

                  {/* Menu items */}
                  <div style={{ padding: '6px' }}>
                    {[
                      { icon: User, label: 'My Profile', onClick: () => { setShowUserMenu(false); setShowProfileModal(true); } },
                      { icon: Settings, label: 'Settings', onClick: () => { setShowUserMenu(false); setShowSettingsModal(true); } },
                    ].map(item => (
                      <button
                        key={item.label}
                        onClick={item.onClick}
                        style={{
                          width: '100%', padding: '8px 10px',
                          display: 'flex', alignItems: 'center', gap: 10,
                          borderRadius: 7, border: 'none',
                          background: 'transparent', cursor: 'pointer',
                          color: H_MUTED, fontSize: 13, textAlign: 'left',
                          transition: 'all 0.12s ease',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'; e.currentTarget.style.color = theme.text; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = H_MUTED; }}
                      >
                        <div style={{
                          width: 28, height: 28, borderRadius: 7,
                          background: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <item.icon style={{ width: 13, height: 13 }} />
                        </div>
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {/* Sign out */}
                  <div style={{ borderTop: `1px solid ${H_BORDER}`, padding: '6px' }}>
                    <button
                      onClick={() => { setShowUserMenu(false); logout(); }}
                      style={{
                        width: '100%', padding: '8px 10px',
                        display: 'flex', alignItems: 'center', gap: 10,
                        borderRadius: 7, border: 'none',
                        background: 'transparent', cursor: 'pointer',
                        color: '#ef4444', fontSize: 13, textAlign: 'left',
                        transition: 'background 0.12s ease',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{
                        width: 28, height: 28, borderRadius: 7,
                        background: 'rgba(239,68,68,0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <LogOut style={{ width: 13, height: 13 }} />
                      </div>
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {showProfileModal && <ProfileModal onClose={() => setShowProfileModal(false)} />}
      {showSettingsModal && (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
          autoRefresh={autoRefresh}
          onToggleAutoRefresh={onToggleAutoRefresh}
        />
      )}
    </>
  );
}

export default Header;

