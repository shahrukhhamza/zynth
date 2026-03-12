import { Activity, Sun, Moon, Globe, LogOut, ChevronDown, User, Settings, Shield, Menu, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useTimezone, TIMEZONES } from '../contexts/TimezoneContext';
import { useAuth } from '../contexts/AuthContext';
import { useState, useRef, useEffect } from 'react';
import ProfileModal from './ProfileModal';
import SettingsModal from './SettingsModal';
import PlanBadge from './PlanBadge';

function Header({ autoRefresh, onToggleAutoRefresh, onToggleSidebar, mobileSidebarOpen }) {
  const theme = useTheme();
  const { selectedTimezone, changeTimezone, getTimezoneInfo, timezones } = useTimezone();
  const { user, logout } = useAuth();
  const [showTimezoneDropdown, setShowTimezoneDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
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
    <header className="border-b h-16 flex items-center justify-between px-4 md:px-6" style={{ 
      backgroundColor: theme.surface, 
      borderColor: theme.border 
    }}>
      <div className="flex items-center gap-2">
        {/* Hamburger — mobile only */}
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-lg transition-colors"
          style={{ color: theme.muted }}
          aria-label="Toggle navigation"
        >
          {mobileSidebarOpen
            ? <X className="w-5 h-5" />
            : <Menu className="w-5 h-5" />}
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <Activity className="w-6 h-6" style={{ color: theme.accent }} />
          <div>
            <h1 className="text-base md:text-lg font-bold leading-tight tracking-tight" style={{ color: theme.text }}>Zynth</h1>
            <p className="text-[10px] leading-tight" style={{ color: theme.muted }}>Real-time Market Intelligence</p>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button
          onClick={theme.toggleTheme}
          className="p-2 rounded-lg transition-all hover:bg-opacity-80"
          style={{ 
            backgroundColor: theme.isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.1)',
            color: theme.accent 
          }}
          title={theme.isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme.isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Timezone Selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowTimezoneDropdown(!showTimezoneDropdown)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
            style={{ 
              backgroundColor: theme.isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.1)',
              color: theme.text,
              border: `1px solid ${theme.border}`
            }}
            title="Select Timezone"
          >
            <Globe className="w-4 h-4" style={{ color: theme.accent }} />
            <span className="text-sm font-medium">{currentTz.id.toUpperCase()}</span>
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

        <div className="flex items-center gap-2" title="Auto-refresh">
          <button
            onClick={onToggleAutoRefresh}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
            style={{ backgroundColor: autoRefresh ? theme.accent : theme.border }}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                autoRefresh ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* User Profile */}
        {user && (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(v => !v)}
              className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-xl transition-all duration-200"
              style={{
                backgroundColor: showUserMenu
                  ? (theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)')
                  : 'transparent',
                border: `1px solid ${showUserMenu ? theme.accent + '60' : theme.border}`,
              }}
              onMouseOver={e => { if (!showUserMenu) e.currentTarget.style.backgroundColor = theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'; }}
              onMouseOut={e => { if (!showUserMenu) e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              {/* Avatar */}
              {user.avatar && !avatarError ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-lg object-cover"
                  style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold select-none"
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                    boxShadow: '0 1px 4px rgba(99,102,241,0.4)',
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
                {/* Profile header */}
                <div
                  className="px-4 pt-4 pb-3"
                  style={{ background: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
                >
                  <div className="flex items-center gap-3">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-11 h-11 rounded-xl object-cover"
                        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
                      />
                    ) : (
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-lg font-bold select-none"
                        style={{
                          background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                          boxShadow: '0 2px 8px rgba(99,102,241,0.4)',
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
                </div>

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
