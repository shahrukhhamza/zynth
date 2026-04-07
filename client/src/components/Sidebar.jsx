import { useState, useEffect } from 'react';
import {
  Search, Filter, Calendar, X, Brain,
  Camera, ChevronLeft, ChevronRight, Crown, Settings, HelpCircle, Clock,
  LayoutDashboard, Star, Zap, Calculator, TrendingUp, ShieldCheck,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useTimezone } from '../contexts/TimezoneContext';
import { useAuth } from '../contexts/AuthContext';
import ProfileModal from './ProfileModal';
import SettingsModal from './SettingsModal';
import PlanBadge from './PlanBadge';
import { BrandMark } from './BrandLogo';
import { resolveMediaUrl } from '../utils/mediaUrl';

const AVATAR_COLOR_MAP = {
  emerald: '#10b981', blue: '#CA8A04', purple: '#8b5cf6', orange: '#f97316',
  rose: '#f43f5e', amber: '#f59e0b', cyan: '#06b6d4', indigo: '#CA8A04',
};

const NAV_ITEMS = [
  { key: 'data',         icon: LayoutDashboard, label: 'Dashboard',           badge: null },
  { key: 'journal',      icon: Star,            label: 'Trade Journal',       badge: null, core: true },
  { key: 'intelligence', icon: Brain,           label: 'AI Insights',         badge: { text: 'AI', color: '#CA8A04' } },
  { key: 'calendar',     icon: Calendar,        label: 'Economic Calendar',   badge: null },
  { key: 'help',         icon: HelpCircle,      label: 'Help & Docs',         badge: null },
];

const CALC_ITEMS = [
  { key: 'calculator/profit', icon: TrendingUp,   label: 'Profit Calculator' },
  { key: 'calculator/risk',   icon: ShieldCheck,  label: 'Risk Planner' },
];

function NavButton({ icon: Icon, label, badge, active, collapsed, onClick, core }) {
  const theme = useTheme();

  /* ── Trade Journal: distinctive gradient pill ─────────────────────────── */
  if (core) {
    return (
      <button
        onClick={onClick}
        title={collapsed ? label : undefined}
        className={[
          'relative w-full flex items-center border-0 rounded-xl cursor-pointer select-none',
          'text-white transition-all duration-200 flex-shrink-0 h-12',
          'shadow-[0_2px_12px_rgba(202,138,4,0.28)] hover:shadow-[0_4px_22px_rgba(202,138,4,0.42)]',
          'hover:brightness-110 active:scale-[0.98]',
          collapsed ? 'justify-center px-0' : 'gap-3 px-4',
        ].join(' ')}
        style={{ background: 'linear-gradient(135deg, #A16207, #CA8A04)' }}
      >
        <Icon style={{ width: 18, height: 18, flexShrink: 0, fill: 'rgba(255,255,255,0.18)' }} />

        {!collapsed && (
          <div className="flex-1 flex items-center justify-between min-w-0">
            <span className="text-[13px] font-semibold leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
              {label}
              <span className="block text-[9px] font-medium opacity-70 tracking-[0.04em] mt-0.5">
                Your trading edge
              </span>
            </span>
            {badge && (
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full tracking-[0.06em] ml-1 flex-shrink-0"
                style={{ color: badge.color, background: `${badge.color}20`, border: `1px solid ${badge.color}40` }}
              >
                {badge.text}
              </span>
            )}
          </div>
        )}

        {collapsed && badge && (
          <span
            className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
            style={{ background: badge.color, boxShadow: `0 0 6px ${badge.color}` }}
          />
        )}
      </button>
    );
  }

  /* ── Standard nav item ────────────────────────────────────────────────── */
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={[
        'relative w-full flex items-center h-10 border-0 rounded-lg',
        'cursor-pointer select-none transition-all duration-150 flex-shrink-0',
        collapsed ? 'justify-center' : 'gap-3',
        active
          ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-500 font-semibold'
          : [
              'text-zinc-500 dark:text-zinc-400 font-medium',
              'hover:bg-zinc-100 dark:hover:bg-zinc-800',
              'hover:text-zinc-800 dark:hover:text-zinc-200',
            ].join(' '),
      ].join(' ')}
      style={{
        borderLeft: !collapsed ? `3px solid ${active ? '#CA8A04' : 'transparent'}` : 'none',
        paddingLeft:  collapsed ? 0 : active ? 13 : 16,
        paddingRight: collapsed ? 0 : 12,
      }}
    >
      {/* Icon */}
      <Icon
        style={{
          width: 16, height: 16, flexShrink: 0,
          opacity: collapsed && !active ? 0.55 : 1,
          transition: 'opacity 0.15s',
        }}
      />

      {/* Label + badge */}
      {!collapsed && (
        <div className="flex-1 flex items-center justify-between min-w-0">
          <span className="text-[13px] whitespace-nowrap overflow-hidden text-ellipsis">
            {label}
          </span>
          {badge && (
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full tracking-[0.06em] ml-1 flex-shrink-0"
              style={{ color: badge.color, background: `${badge.color}18`, border: `1px solid ${badge.color}30` }}
            >
              {badge.text}
            </span>
          )}
        </div>
      )}

      {/* Collapsed: dot badge */}
      {collapsed && badge && (
        <span
          className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
          style={{ background: badge.color, boxShadow: `0 0 6px ${badge.color}` }}
        />
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

  const SB_BG     = theme.isDark ? theme.bg : '#ffffff';
  const SB_BORDER = theme.border;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      backgroundColor: SB_BG,
      boxShadow: theme.isDark ? 'none' : '1px 0 0 rgba(15,23,42,0.10), 2px 0 16px rgba(15,23,42,0.06)',
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
            <BrandMark size={30} />
            <div>
              <span style={{
                fontSize: 16, fontWeight: 700, color: theme.text,
                letterSpacing: '-0.02em', display: 'block', lineHeight: 1,
              }}>
                Zynth
              </span>
              <span style={{ fontSize: 9, color: '#CA8A04', fontWeight: 600,
                letterSpacing: '0.1em', textTransform: 'uppercase',
              }}>
                BETA
              </span>
            </div>
          </div>
        )}

        {/* Collapsed: just logo */}
        {collapsed && (
          <BrandMark size={30} />
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
            onMouseEnter={e => { e.currentTarget.style.background = theme.isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.08)'; e.currentTarget.style.color = '#CA8A04'; }}
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
            background: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(15,23,42,0.03)',
            display: 'flex', alignItems: 'center', gap: 10,
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.15s ease',
            flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)'; e.currentTarget.style.borderColor = SB_BORDER; }}
          onMouseLeave={e => { e.currentTarget.style.background = theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(15,23,42,0.03)'; e.currentTarget.style.borderColor = SB_BORDER; }}
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
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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

        {/* Calculators section label */}
        {!collapsed && (
          <p style={{
            fontSize: 9, fontWeight: 700, color: theme.muted,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '10px 4px 4px', marginBottom: 2,
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <Calculator style={{ width: 10, height: 10 }} /> Calculators
          </p>
        )}

        {/* Calculator items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {CALC_ITEMS.map(item => (
            <NavButton
              key={item.key}
              icon={item.icon}
              label={item.label}
              badge={null}
              active={currentView === item.key}
              collapsed={collapsed}
              onClick={() => navigate(item.key)}
            />
          ))}
        </nav>

        {/* Divider */}
        <div style={{ height: 1, background: SB_BORDER, margin: '8px 0' }} />

        {/* Settings + Admin */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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
              <button onClick={onResetFilters} style={{ fontSize: 10, color: '#CA8A04', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
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
                  background: theme.surface2, border: `1px solid ${SB_BORDER}`,
                  borderRadius: 7, fontSize: 12, color: theme.text,
                  outline: 'none',
                }}
                onFocus={e => e.target.style.borderColor = '#CA8A04'}
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
                      background: filters.impactLevel === level ? '#CA8A04' : theme.surface2,
                      color: filters.impactLevel === level ? '#fff' : theme.muted,
                      border: `1px solid ${filters.impactLevel === level ? '#CA8A04' : SB_BORDER}`,
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
                background: '#CA8A04', color: '#fff',
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
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#CA8A04'; e.currentTarget.style.color = '#CA8A04'; }}
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
          borderRight: `1px solid ${theme.border}`,
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
          borderRight: `1px solid ${theme.border}`,
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

