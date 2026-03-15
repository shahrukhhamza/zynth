import { Activity, BarChart3, Sun, Moon, Globe, LogOut, ChevronDown, User, Settings, Shield, Menu, X, ChevronRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useTimezone, TIMEZONES } from '../contexts/TimezoneContext';
import { useAuth } from '../contexts/AuthContext';
import { useState, useRef, useEffect } from 'react';
import ProfileModal from './ProfileModal';
import SettingsModal from './SettingsModal';
import PlanBadge from './PlanBadge';
import { API_URL } from '../config/api';

const AVATAR_COLOR_MAP = {
  emerald: '#10b981', blue: '#3b82f6', purple: '#a855f7',
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
  screenshot:   'Screenshot Analysis',
  backtest:     'Backtesting',
  lounge:       'Traders Lounge',
  tools:        'Tools',
  admin:        'Admin',
};

function Header({ autoRefresh, onToggleAutoRefresh, onToggleSidebar, mobileSidebarOpen, sidebarCollapsed = false, onExpandSidebar, currentView, isMobile = false }) {
  const theme = useTheme();
  const { selectedTimezone, changeTimezone, getTimezoneInfo, timezones } = useTimezone();
  const { user, logout } = useAuth();
  const [showTimezoneDropdown, setShowTimezoneDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const avatarBg = AVATAR_COLOR_MAP[user?.avatar_color] ?? '#10b981';
  const avatarSrc = user?.avatar_url ? `${API_URL}${user.avatar_url}` : (user?.avatar ?? null);
  const dropdownRef = useRef(null);
  const userMenuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowTimezoneDropdown(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentTz = getTimezoneInfo();

  return (
  <>
    <header
      className="border-b flex items-center justify-between"
      style={{ 
        position: 'fixed',
        top: 0,
        left: isMobile ? 0 : (sidebarCollapsed ? 64 : 240),
        width: isMobile ? '100vw' : (sidebarCollapsed ? 'calc(100vw - 64px)' : 'calc(100vw - 240px)'),
        height: isMobile ? 56 : 64,
        padding: isMobile ? '0 16px' : '0 24px',
        transition: 'left 0.3s ease, width 0.3s ease',
        zIndex: 100,
        backgroundColor: theme.surface, 
        borderColor: theme.border,
      }}
    >
      <div className="flex items-center gap-3">
        {/* Mobile: hamburger + logo + wordmark */}
        {isMobile ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            <button
              onClick={onToggleSidebar}
              style={{
                width: 36, height: 36,
                background: 'rgba(255,255,255,0.06)',
                borderRadius: 8,
                border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                marginRight: 10,
                color: theme.muted,
                flexShrink: 0,
              }}
              aria-label="Toggle navigation"
            >
              {mobileSidebarOpen
                ? <X style={{ width: 18, height: 18 }} />
                : <Menu style={{ width: 18, height: 18 }} />}
            </button>
            {/* Logo */}
            <div style={{
              width: 28, height: 28,
              backgroundColor: '#10b981',
              borderRadius: 7,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              overflow: 'hidden',
            }}>
              <img src="/logo.png" alt="Zynth" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            {/* Wordmark */}
            <span style={{
              color: theme.text,
              fontWeight: 700,
              fontSize: 18,
              letterSpacing: '-0.01em',
              marginLeft: 8,
            }}>Zynth</span>
          </div>
        ) : (
          <>
            {/* Desktop: hamburger expand button + page title */}
        {/* Expand sidebar button — desktop only, visible when sidebar is collapsed */}
        {sidebarCollapsed && (
          <button
            onClick={onExpandSidebar}
            className="hidden md:flex items-center justify-center rounded-lg transition-all"
            style={{
              width: 32, height: 32,
              color: theme.textMuted,
              backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              border: `1px solid ${theme.border}`,
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = theme.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.09)'; e.currentTarget.style.color = theme.accent; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'; e.currentTarget.style.color = theme.textMuted; }}
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
            {/* Current page title */}
            <span className="text-[17px] font-semibold tracking-tight" style={{ color: theme.text }}>
              {VIEW_LABELS[currentView] ?? 'Dashboard'}
            </span>
          </>
        )}
      </div>
      
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Theme Toggle — segmented pill */}
        <button
          onClick={theme.toggleTheme}
          title={theme.isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={theme.isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
            padding: 3,
            borderRadius: 10,
            border: `1px solid ${theme.border}`,
            backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
            cursor: 'pointer',
            outline: 'none',
            transition: 'border-color 0.2s ease, background-color 0.2s ease',
          }}
        >
          {/* Sun — active in light mode */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 26, height: 26, borderRadius: 7,
            backgroundColor: !theme.isDark ? theme.accent : 'transparent',
            color: !theme.isDark ? '#fff' : theme.muted,
            transition: 'background-color 0.25s ease, color 0.25s ease',
          }}>
            <Sun size={13} />
          </span>
          {/* Moon — active in dark mode */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 26, height: 26, borderRadius: 7,
            backgroundColor: theme.isDark ? theme.accent : 'transparent',
            color: theme.isDark ? '#fff' : theme.muted,
            transition: 'background-color 0.25s ease, color 0.25s ease',
          }}>
            <Moon size={13} />
          </span>
        </button>

        {/* Timezone Selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowTimezoneDropdown(!showTimezoneDropdown)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
            style={{ 
              backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
              color: theme.text,
              border: `1px solid ${theme.border}`
            }}
            title="Select Timezone"
          >
            <Globe className="w-4 h-4" style={{ color: theme.accent }} />
            <span className="hidden sm:inline text-sm font-medium">{currentTz.id.toUpperCase()}</span>
          </button>

          {showTimezoneDropdown && (
            <div 
              className="absolute top-full right-0 mt-2 rounded-lg border shadow-lg overflow-hidden z-50"
              style={{ 
                backgroundColor: theme.surface,
                borderColor: theme.border,
                minWidth: '250px',
                maxHeight: '400px',
                overflowY: 'auto'
              }}
            >
              <div className="p-2">
                <div className="text-xs font-semibold uppercase mb-2 px-2" style={{ color: theme.muted }}>
                  Select Timezone
                </div>
                {timezones.map((tz) => (
                  <button
                    key={tz.id}
                    onClick={() => {
                      changeTimezone(tz.id);
                      setShowTimezoneDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded transition-colors text-sm"
                    style={{
                      backgroundColor: selectedTimezone === tz.id ? `${theme.accent}20` : 'transparent',
                      color: selectedTimezone === tz.id ? theme.accent : theme.text,
                      fontWeight: selectedTimezone === tz.id ? '600' : '400'
                    }}
                    onMouseOver={(e) => {
                      if (selectedTimezone !== tz.id) {
                        e.currentTarget.style.backgroundColor = theme.bg;
                      }
                    }}
                    onMouseOut={(e) => {
                      if (selectedTimezone !== tz.id) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <div className="font-medium">{tz.name}</div>
                    <div className="text-xs" style={{ color: theme.muted }}>
                      UTC{tz.offset >= 0 ? '+' : ''}{tz.offset}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        {user && (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(v => !v)}
              className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-xl transition-all duration-200"
              style={{
                backgroundColor: showUserMenu
                ? (theme.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)')
                : (theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
              border: `1px solid ${showUserMenu ? theme.accent + '60' : theme.border}`,
            }}
            onMouseOver={e => { if (!showUserMenu) e.currentTarget.style.backgroundColor = theme.isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.07)'; }}
            onMouseOut={e => { if (!showUserMenu) e.currentTarget.style.backgroundColor = theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'; }}
            >
              {/* Avatar */}
              {avatarSrc && !avatarError ? (
                <img
                  src={avatarSrc}
                  alt={user.name}
                  className="w-8 h-8 rounded-lg object-cover"
                  style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold select-none"
                  style={{
                    backgroundColor: avatarBg,
                    boxShadow: `0 1px 4px ${avatarBg}66`,
                    fontFamily: 'system-ui, sans-serif',
                    letterSpacing: '0.02em',
                  }}
                >
                  {user.name?.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Name + role chip */}
              <div className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-sm font-semibold" style={{ color: theme.text, lineHeight: 1.2 }}>
                  {user.name?.split(' ').slice(0, 2).join(' ')}
                </span>
                <PlanBadge className="mt-0.5" />
              </div>

              <ChevronDown
                className="w-3.5 h-3.5 transition-transform duration-200"
                style={{
                  color: theme.muted,
                  transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </button>

            {/* Dropdown */}
            {showUserMenu && (
              <div
                className="absolute top-full right-0 mt-2 rounded-xl border shadow-2xl z-50 overflow-hidden"
                style={{
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  minWidth: '240px',
                  boxShadow: theme.isDark
                    ? '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)'
                    : '0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.06)',
                }}
              >
                {/* Profile header — clickable, opens Profile modal */}
                <button
                  onClick={() => { setShowUserMenu(false); setShowProfileModal(true); }}
                  className="w-full text-left px-4 pt-4 pb-3 transition-colors"
                  style={{ background: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}
                  onMouseEnter={e => e.currentTarget.style.background = theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'}
                >
                  <div className="flex items-center gap-3">
                    {avatarSrc && !avatarError ? (
                      <img
                        src={avatarSrc}
                        alt={user.name}
                        className="w-11 h-11 rounded-xl object-cover"
                        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
                      />
                    ) : (
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-lg font-bold select-none"
                        style={{
                          backgroundColor: avatarBg,
                          boxShadow: `0 2px 8px ${avatarBg}66`,
                        }}
                      >
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: theme.text }}>
                        {user.name}
                      </p>
                      <p className="text-xs truncate mt-0.5" style={{ color: theme.muted }}>
                        {user.email}
                      </p>
                      <div
                        className="inline-flex items-center gap-1 mt-1.5"
                      >
                        <PlanBadge />
                      </div>
                    </div>
                  </div>
                </button>

                {/* Divider */}
                <div style={{ height: '1px', backgroundColor: theme.border, margin: '0' }} />

                {/* Menu items */}
                <div className="p-1.5">
                  <button
                    onClick={() => { setShowUserMenu(false); setShowProfileModal(true); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-150 text-left"
                    style={{ color: theme.text }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }}>
                      <User className="w-3.5 h-3.5" style={{ color: theme.muted }} />
                    </div>
                    <span>My Profile</span>
                  </button>

                  <button
                    onClick={() => { setShowUserMenu(false); setShowSettingsModal(true); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-150 text-left"
                    style={{ color: theme.text }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }}>
                      <Settings className="w-3.5 h-3.5" style={{ color: theme.muted }} />
                    </div>
                    <span>Settings</span>
                  </button>
                </div>

                {/* Divider */}
                <div style={{ height: '1px', backgroundColor: theme.border }} />

                {/* Sign out */}
                <div className="p-1.5">
                  <button
                    onClick={() => { setShowUserMenu(false); logout(); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-150 text-left"
                    style={{ color: '#f87171' }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
                      <LogOut className="w-3.5 h-3.5" />
                    </div>
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>

    {showProfileModal && (
      <ProfileModal onClose={() => setShowProfileModal(false)} />
    )}
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
