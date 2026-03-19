import { useState, useEffect } from 'react';
import {
  Search, Filter, Calendar, X, Brain,
  Camera, ChevronLeft, ChevronRight, Crown, Settings, HelpCircle, Clock,
  LayoutDashboard, Star, Zap,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useTimezone } from '../contexts/TimezoneContext';
import { useAuth } from '../contexts/AuthContext';
import ProfileModal from './ProfileModal';
import SettingsModal from './SettingsModal';
import PlanBadge from './PlanBadge';
import { resolveMediaUrl } from '../utils/mediaUrl';

const AVATAR_COLOR_MAP = {
  emerald: '#10b981', blue: '#3b82f6', purple: '#a855f7', orange: '#f97316',
  rose: '#f43f5e', amber: '#f59e0b', cyan: '#06b6d4', indigo: '#6366f1',
};

const NAV_ITEMS = [
  { key: 'data',         icon: LayoutDashboard, label: 'Dashboard',           badge: null },
  { key: 'journal',      icon: Star,            label: 'Trade Journal',       badge: null, core: true },
  { key: 'screenshot',   icon: Camera,          label: 'Screenshot Analysis', badge: { text: 'AI', color: '#a855f7' } },
  { key: 'intelligence', icon: Brain,           label: 'AI Insights',         badge: { text: 'AI', color: '#a855f7' } },
  { key: 'calendar',     icon: Calendar,        label: 'Economic Calendar',   badge: null },
  { key: 'help',         icon: HelpCircle,      label: 'Help & Docs',         badge: null },
];

function NavButton({ icon: Icon, label, badge, active, collapsed, onClick, core }) {
  const [hov, setHov] = useState(false);
  const theme = useTheme();

  const getBg = () => {
    if (core) return active ? '#059669' : hov ? '#0d9e6e' : '#10b981cc';
    if (active) return 'rgba(16,185,129,0.12)';
    if (hov) return theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    return 'transparent';
  };

  const getColor = () => {
    if (core) return '#ffffff';
    if (active) return '#10b981';
    if (hov) return theme.text;
    return theme.muted;
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={collapsed ? label : undefined}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        textAlign: 'left',
        borderRadius: 8,
        height: core ? 48 : 40,
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: collapsed ? 0 : 10,
        padding: collapsed ? '0' : `0 10px 0 ${active && !core ? '9px' : '12px'}`,
        backgroundColor: getBg(),
        color: getColor(),
        border: 'none',
        borderLeft: !core && !collapsed ? `2px solid ${active ? '#10b981' : 'transparent'}` : 'none',
        boxShadow: core
          ? hov
            ? '0 4px 20px rgba(16,185,129,0.3)'
            : '0 2px 12px rgba(16,185,129,0.2)'
          : 'none',
        transition: 'all 0.18s ease',
        cursor: 'pointer',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {/* Active indicator dot for non-core items */}
      {!core && active && !collapsed && (
        <span style={{
          position: 'absolute',
          left: -1,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 3,
          height: 16,
          borderRadius: 99,
          background: '#10b981',
          boxShadow: '0 0 8px rgba(16,185,129,0.6)',
        }} />
      )}

      {/* Icon */}
      <Icon style={{
        width: core ? 18 : 16,
        height: core ? 18 : 16,
        flexShrink: 0,
        opacity: collapsed && !active && !hov ? 0.5 : 1,
        fill: core ? 'rgba(255,255,255,0.2)' : 'none',
      }} />

      {/* Label + badge */}
      {!collapsed && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 0 }}>
          <span style={{
            fontSize: core ? 13 : 13,
            fontWeight: core ? 600 : active ? 500 : 400,
            letterSpacing: core ? '0.01em' : 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {label}
            {core && (
              <span style={{ display: 'block', fontSize: 9, fontWeight: 500, opacity: 0.7, letterSpacing: '0.04em', marginTop: 1 }}>
                Your trading edge
              </span>
            )}
          </span>
          {badge && (
            <span style={{
              fontSize: 9, fontWeight: 700,
              padding: '2px 6px', borderRadius: 99,
              letterSpacing: '0.06em',
              color: badge.color,
              background: `${badge.color}18`,
              border: `1px solid ${badge.color}30`,
            }}>
              {badge.text}
            </span>
          )}
        </div>
      )}

      {/* Collapsed tooltip badge */}
      {collapsed && badge && (
        <span style={{
          position: 'absolute', top: 6, right: 6,
          width: 6, height: 6, borderRadius: '50%',
          background: badge.color,
          boxShadow: `0 0 6px ${badge.color}`,
        }} />
      )}
    </button>
  );
}

/* ── SidebarInner ─────────────────────────────────────────────────────────── */
function SidebarInner({
  collapsed, onToggleCollapse, isMobile, onMobileClose,
  currentView, onViewChange,
  filters, onFilterChange, onApplyFilters, onResetFilters,
}) {
  const theme = useTheme();
  const { user } = useAuth();
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const avatarBg = AVATAR_COLOR_MAP[user?.avatar_color] ?? '#10b981';
  const avatarSrc = user?.avatar_url ? resolveMediaUrl(user.avatar_url) : (user?.avatar ?? null);

  const navigate = (key) => {
    onViewChange(key);
    if (isMobile && onMobileClose) onMobileClose();
  };

  const SB_BG     = theme.isDark ? '#0d0d0d' : theme.bg;
  const SB_BORDER = theme.isDark ? '#1e1e1e' : theme.border;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      backgroundColor: SB_BG,
      overflow: 'hidden',
    }}>

      {/* ── HEADER ─────────────────────────────────────────── */}
      <div style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: collapsed ? '0' : '0 14px 0 16px',
        borderBottom: `1px solid ${SB_BORDER}`,
        flexShrink: 0,
        gap: 8,
      }}>
        {/* Logo + wordmark */}
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <svg width="30" height="30" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 9 L32 9 L32 13 L8 13 Z" fill="#10b981"/>
              <path d="M8 27 L32 27 L32 31 L8 31 Z" fill="#10b981"/>
              <path d="M32 13 L8 27 L8 31 L10 31 L34 15 L34 13 Z" fill="#0d7a5a"/>
              <polyline points="10,28 16,22 20,25 26,16 30,12" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <path d="M28,10 L32,12 L29,15" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <rect x="19" y="21" width="2.5" height="5" rx="0.5" fill="#f59e0b"/>
              <line x1="20.25" y1="19.5" x2="20.25" y2="21" stroke="#f59e0b" strokeWidth="1" strokeLinecap="round"/>
              <line x1="20.25" y1="26" x2="20.25" y2="27.5" stroke="#f59e0b" strokeWidth="1" strokeLinecap="round"/>
            </svg>
            <div>
              <span style={{
                fontSize: 16, fontWeight: 700, color: theme.text,
                letterSpacing: '-0.02em', display: 'block', lineHeight: 1,
              }}>
                Zynth
              </span>
              <span style={{
                fontSize: 9, color: '#10b981', fontWeight: 600,
                letterSpacing: '0.1em', textTransform: 'uppercase',
              }}>
                BETA
              </span>
            </div>
          </div>
        )}

        {/* Collapsed: just logo */}
        {collapsed && (
          <svg width="30" height="30" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 9 L32 9 L32 13 L8 13 Z" fill="#10b981"/>
            <path d="M8 27 L32 27 L32 31 L8 31 Z" fill="#10b981"/>
            <path d="M32 13 L8 27 L8 31 L10 31 L34 15 L34 13 Z" fill="#0d7a5a"/>
            <polyline points="10,28 16,22 20,25 26,16 30,12" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M28,10 L32,12 L29,15" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <rect x="19" y="21" width="2.5" height="5" rx="0.5" fill="#f59e0b"/>
            <line x1="20.25" y1="19.5" x2="20.25" y2="21" stroke="#f59e0b" strokeWidth="1" strokeLinecap="round"/>
            <line x1="20.25" y1="26" x2="20.25" y2="27.5" stroke="#f59e0b" strokeWidth="1" strokeLinecap="round"/>
          </svg>
        )}

        {/* Collapse toggle — desktop only */}
        {!isMobile && (
          <button
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              width: 24, height: 24,
              borderRadius: 6,
              border: `1px solid ${SB_BORDER}`,
              background: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              color: theme.muted,
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = theme.isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.08)'; e.currentTarget.style.color = '#10b981'; }}
            onMouseLeave={e => { e.currentTarget.style.background = theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'; e.currentTarget.style.color = theme.muted; }}
          >
            {collapsed
              ? <ChevronRight style={{ width: 13, height: 13 }} />
              : <ChevronLeft style={{ width: 13, height: 13 }} />}
          </button>
        )}

        {/* Mobile close */}
        {isMobile && (
          <button
            onClick={onMobileClose}
            style={{
              width: 28, height: 28, borderRadius: 7,
              border: `1px solid ${SB_BORDER}`,
              background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: theme.muted,
            }}
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        )}
      </div>

      {/* ── USER PROFILE CARD ─────────────────────────────── */}
      {!collapsed && (
        <button
          onClick={() => setShowProfileModal(true)}
          style={{
            margin: '10px 10px 2px',
            padding: '10px 12px',
            borderRadius: 10,
            border: `1px solid ${SB_BORDER}`,
            background: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            display: 'flex', alignItems: 'center', gap: 10,
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.15s ease',
            flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor = SB_BORDER; }}
          onMouseLeave={e => { e.currentTarget.style.background = theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'; e.currentTarget.style.borderColor = SB_BORDER; }}
        >
          {/* Avatar */}
          {avatarSrc && !avatarError ? (
            <img
              src={avatarSrc}
              alt={user?.name}
              onError={() => setAvatarError(true)}
              style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: `linear-gradient(135deg, ${avatarBg}, ${avatarBg}bb)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: '#fff',
              flexShrink: 0,
              boxShadow: `0 2px 8px ${avatarBg}40`,
            }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: 13, fontWeight: 600, color: theme.text,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              lineHeight: 1.2,
            }}>
              {user?.name?.split(' ').slice(0, 2).join(' ')}
            </p>
            <div style={{ marginTop: 3 }}>
              <PlanBadge />
            </div>
          </div>

          <ChevronRight style={{ width: 13, height: 13, color: theme.muted, flexShrink: 0 }} />
        </button>
      )}

      {/* Collapsed: avatar only */}
      {collapsed && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px', flexShrink: 0 }}>
          {avatarSrc && !avatarError ? (
            <img
              src={avatarSrc}
              alt={user?.name}
              onError={() => setAvatarError(true)}
              style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: `linear-gradient(135deg, ${avatarBg}, ${avatarBg}bb)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: '#fff',
            }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      )}

      {/* ── NAV ───────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: collapsed ? '8px 8px' : '8px 10px' }}>

        {/* Section label */}
        {!collapsed && (
          <p style={{
            fontSize: 9, fontWeight: 700, color: theme.muted,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '6px 4px 4px', marginBottom: 2,
          }}>
            Menu
          </p>
        )}

        {/* Nav items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map(item => (
            <NavButton
              key={item.key}
              icon={item.icon}
              label={item.label}
              badge={item.badge}
              core={!!item.core}
              active={currentView === item.key}
              collapsed={collapsed}
              onClick={() => navigate(item.key)}
            />
          ))}
        </nav>

        {/* Divider */}
        <div style={{ height: 1, background: SB_BORDER, margin: '8px 0' }} />

        {/* Settings + Admin */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <NavButton
            icon={Settings}
            label="Settings"
            badge={null}
            active={false}
            collapsed={collapsed}
            onClick={() => setShowSettingsModal(true)}
          />
          {user?.is_admin === 1 && (
            <NavButton
              icon={Crown}
              label="Admin"
              badge={null}
              active={currentView === 'admin'}
              collapsed={collapsed}
              onClick={() => navigate('admin')}
            />
          )}
        </nav>

        {/* News filters */}
        {!collapsed && currentView === 'news' && (
          <div style={{ marginTop: 12, borderTop: `1px solid ${SB_BORDER}`, paddingTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: theme.muted, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Filter style={{ width: 10, height: 10 }} /> Filters
              </span>
              <button onClick={onResetFilters} style={{ fontSize: 10, color: '#10b981', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                <X style={{ width: 10, height: 10 }} /> Clear
              </button>
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 10, color: theme.muted, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                <Search style={{ width: 10, height: 10 }} /> Keyword
              </label>
              <input
                type="text"
                value={filters.keyword}
                onChange={e => onFilterChange({ keyword: e.target.value })}
                placeholder="Search news..."
                style={{
                  width: '100%', padding: '7px 10px',
                  background: theme.isDark ? '#1a1a1a' : theme.surface, border: `1px solid ${SB_BORDER}`,
                  borderRadius: 7, fontSize: 12, color: theme.text,
                  outline: 'none',
                }}
                onFocus={e => e.target.style.borderColor = '#10b981'}
                onBlur={e => e.target.style.borderColor = SB_BORDER}
              />
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 10, color: theme.muted, marginBottom: 6, display: 'block' }}>Impact Level</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                {['All', 'High', 'Medium', 'Low'].map(level => (
                  <button
                    key={level}
                    onClick={() => onFilterChange({ impactLevel: level })}
                    style={{
                      padding: '6px 8px', borderRadius: 6, fontSize: 11, fontWeight: 500,
                      background: filters.impactLevel === level ? '#10b981' : theme.isDark ? '#1a1a1a' : theme.surface2,
                      color: filters.impactLevel === level ? '#fff' : theme.muted,
                      border: `1px solid ${filters.impactLevel === level ? '#10b981' : SB_BORDER}`,
                      cursor: 'pointer', transition: 'all 0.15s ease',
                    }}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={onApplyFilters}
              style={{
                width: '100%', padding: '8px', borderRadius: 7,
                background: '#10b981', color: '#fff',
                fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
              }}
            >
              Apply Filters
            </button>

            <div style={{ marginTop: 10 }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: theme.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Quick Tags</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {['Gold', 'Inflation', 'Fed', 'USD', 'Geopolitics'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => { onFilterChange({ keyword: tag }); onApplyFilters(); }}
                    style={{
                      padding: '3px 8px', borderRadius: 99, fontSize: 10,
                      background: 'transparent', color: theme.muted,
                      border: `1px solid ${SB_BORDER}`, cursor: 'pointer', transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.color = '#10b981'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = SB_BORDER; e.currentTarget.style.color = theme.muted; }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── VERSION ──────────────────────────────────────── */}
      {!collapsed && (
        <div style={{
          padding: '8px 14px',
          borderTop: `1px solid ${SB_BORDER}`,
        }}>
          <p style={{ fontSize: 9, color: theme.muted, textAlign: 'center', letterSpacing: '0.06em' }}>
            ZYNTH · v1.0
          </p>
        </div>
      )}

      {showProfileModal && <ProfileModal onClose={() => setShowProfileModal(false)} />}
      {showSettingsModal && (
        <SettingsModal onClose={() => setShowSettingsModal(false)} autoRefresh={false} onToggleAutoRefresh={() => {}} />
      )}
    </div>
  );
}

/* ── Main export ──────────────────────────────────────────────────────────── */
export default function Sidebar({
  filters, onFilterChange, onApplyFilters, onResetFilters,
  currentView, onViewChange, mobileOpen, onClose, collapsed, onToggleCollapse,
}) {
  const theme = useTheme();
  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden"
          onClick={onClose}
          aria-hidden="true"
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 998,
          }}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className="md:hidden"
        style={{
          position: 'fixed', top: 0, left: 0, height: '100%',
          width: 272,
          zIndex: 999,
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
          borderRight: `1px solid ${theme.isDark ? '#1e1e1e' : theme.border}`,
          boxShadow: '8px 0 32px rgba(0,0,0,0.6)',
        }}
      >
        <SidebarInner
          collapsed={false} isMobile onMobileClose={onClose}
          currentView={currentView} onViewChange={onViewChange}
          filters={filters} onFilterChange={onFilterChange}
          onApplyFilters={onApplyFilters} onResetFilters={onResetFilters}
        />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col"
        style={{
          position: 'fixed', top: 0, left: 0, height: '100vh',
          width: collapsed ? 60 : 236,
          transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
          borderRight: `1px solid ${theme.isDark ? '#1e1e1e' : theme.border}`,
          zIndex: 200,
          willChange: 'width',
          overflow: 'hidden',
        }}
      >
        <SidebarInner
          collapsed={collapsed} onToggleCollapse={onToggleCollapse} isMobile={false}
          currentView={currentView} onViewChange={onViewChange}
          filters={filters} onFilterChange={onFilterChange}
          onApplyFilters={onApplyFilters} onResetFilters={onResetFilters}
        />
      </aside>
    </>
  );
}

