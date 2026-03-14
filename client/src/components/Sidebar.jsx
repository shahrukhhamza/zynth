import { useState, useEffect } from 'react';
import {
  Search, Filter, Calendar, X, BarChart3, Newspaper, Brain,
  Camera, ChevronLeft, ChevronRight, Crown, Settings, HelpCircle, Clock,
  LayoutDashboard, Star,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useTimezone } from '../contexts/TimezoneContext';
import { useAuth } from '../contexts/AuthContext';
import ProfileModal from './ProfileModal';
import SettingsModal from './SettingsModal';
import PlanBadge from './PlanBadge';
import { API_URL } from '../config/api';

const AVATAR_COLOR_MAP = {
  emerald: '#10b981', blue: '#3b82f6', purple: '#a855f7', orange: '#f97316',
  rose: '#f43f5e',    amber: '#f59e0b', cyan: '#06b6d4',  indigo: '#6366f1',
};

/* ── Market session logic ─────────────────────────────────────────────────── */
const SESSIONS = [
  { name: 'Tokyo',  open:  0, close:  9, color: '#f59e0b' },
  { name: 'London', open:  8, close: 17, color: '#60a5fa' },
  { name: 'NY',     open: 13, close: 22, color: '#34d399' },
];

function getUtcHour() {
  return new Date().getUTCHours() + new Date().getUTCMinutes() / 60;
}

function getOpenSessions(utcH) {
  return SESSIONS.filter(s => utcH >= s.open && utcH < s.close);
}

function MarketSessionBar({ collapsed }) {
  const theme = useTheme();
  const { convertToTimezone, getTimezoneInfo } = useTimezone();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const utcH = now.getUTCHours() + now.getUTCMinutes() / 60;
  const open = getOpenSessions(utcH);
  const tzInfo = getTimezoneInfo();
  const converted = convertToTimezone(now);
  const timeStr = [
    String(converted.getUTCHours()).padStart(2, '0'),
    String(converted.getUTCMinutes()).padStart(2, '0'),
    String(converted.getUTCSeconds()).padStart(2, '0'),
  ].join(':');
  const tzMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const dateStr = `${tzMonths[converted.getUTCMonth()]} ${converted.getUTCDate()}`;
  const tzLabel = tzInfo.id.toUpperCase();

  return (
    <div
      style={{
        flex: 1,
        overflow: 'hidden',
        opacity: collapsed ? 0 : 1,
        maxWidth: collapsed ? 0 : 999,
        transition: 'opacity 0.18s ease, max-width 0.28s ease',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 3,
        minWidth: 0,
      }}
    >
      {/* Time + date row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <Clock className="w-3 h-3 flex-shrink-0" style={{ color: theme.textMuted }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: theme.text, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em' }}>
          {timeStr}
        </span>
        <span style={{ fontSize: 11, color: theme.textMuted, fontWeight: 500 }}>{tzLabel} · {dateStr}</span>
      </div>

      {/* Session pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {SESSIONS.map(s => {
          const isOpen = utcH >= s.open && utcH < s.close;
          return (
            <span
              key={s.name}
              title={`${s.name}: ${String(s.open).padStart(2,'0')}:00 – ${String(s.close).padStart(2,'0')}:00 UTC`}
              style={{
                fontSize: 9,
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: 99,
                letterSpacing: '0.06em',
                cursor: 'default',
                userSelect: 'none',
                color: isOpen ? s.color : theme.textMuted,
                background: isOpen ? `${s.color}1a` : 'transparent',
                border: `1px solid ${isOpen ? `${s.color}55` : theme.border}`,
                transition: 'all 0.3s ease',
              }}
            >
              {s.name}
            </span>
          );
        })}
        {open.length === 0 && (
          <span style={{ fontSize: 9, color: theme.textMuted, fontWeight: 600, letterSpacing: '0.05em', cursor: 'default', userSelect: 'none' }}>
            ALL CLOSED
          </span>
        )}
      </div>
    </div>
  );
}

const NAV_ITEMS = [
  { key: 'data',         icon: LayoutDashboard, label: 'Dashboard',          badge: null },
  { key: 'journal',      icon: Star,            label: 'Trade Journal',      badge: null, core: true },
  { key: 'intelligence', icon: Brain,           label: 'AI Insights',        badge: { text: 'AI', color: '#a855f7', bg: 'rgba(168,85,247,0.15)' } },
  { key: 'markets',      icon: BarChart3,       label: 'Economic Data',      badge: null },
  { key: 'calendar',     icon: Calendar,        label: 'Economic Calendar',  badge: null },
  { key: 'news',         icon: Newspaper,       label: 'Market News',        badge: null },
  { key: 'screenshot',   icon: Camera,          label: 'Screenshot Analysis',badge: { text: 'AI', color: '#a855f7', bg: 'rgba(168,85,247,0.15)' } },
];

function NavButton({ icon: Icon, label, badge, active, collapsed, accentColor, onClick, core }) {
  const theme = useTheme();
  const [hov, setHov] = useState(false);
  const accent = accentColor ?? theme.accent;

  // "core" = Trade Journal special styling
  const coreBg      = active ? '#059669' : hov ? '#10b981' : '#10b981cc';
  const coreColor   = '#ffffff';
  const normalActiveBg = accentColor ? 'rgba(167,139,250,0.12)' : theme.accentGlow;

  return (
    <div className="sidebar-nav-item-wrapper relative">
      <button
        onClick={onClick}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', textAlign: 'left',
          borderRadius: 10,
          height: core ? 54 : 44,
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: collapsed ? 0 : 12,
          paddingLeft:  collapsed ? 0 : (core ? 14 : active ? 9 : 12),
          paddingRight: collapsed ? 0 : 12,
          backgroundColor: core
            ? coreBg
            : active ? normalActiveBg : hov ? (theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)') : 'transparent',
          color: core ? coreColor : active ? accent : hov ? theme.text : theme.textMuted,
          borderLeft: core ? 'none' : `3px solid ${!collapsed && active ? accent : 'transparent'}`,
          boxShadow: core ? (hov ? '0 4px 16px rgba(16,185,129,0.35)' : '0 2px 10px rgba(16,185,129,0.22)') : 'none',
          transition: 'background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
          marginBottom: core ? 4 : 0,
        }}
      >
        <Icon className={core ? 'w-[20px] h-[20px] flex-shrink-0' : 'w-[18px] h-[18px] flex-shrink-0'}
          style={core ? { fill: 'rgba(255,255,255,0.25)', color: '#fff' } : {}} />
        {/* Label+badge always in DOM — hidden via CSS only, no DOM mutation during transition */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: core ? 'column' : 'row',
          alignItems: core ? 'flex-start' : 'center',
          gap: core ? 1 : 8, minWidth: 0,
          overflow: 'hidden',
          opacity: collapsed ? 0 : 1,
          maxWidth: collapsed ? 0 : 180,
          transition: 'opacity 0.18s ease, max-width 0.28s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
            <span style={{
              fontSize: core ? 15 : 14,
              fontWeight: core ? 700 : 500,
              flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
              letterSpacing: core ? '-0.01em' : 'normal',
            }}>{label}</span>
            {badge && !core && (
              <span
                className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none flex-shrink-0"
                style={{ backgroundColor: badge.bg, color: badge.color }}
              >
                {badge.pulse && (
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: badge.color, animation: 'pulse-dot 1.5s ease-in-out infinite' }} />
                )}
                {badge.text}
              </span>
            )}
          </div>
          {core && (
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 400, letterSpacing: '0.01em' }}>
              Your trading edge
            </span>
          )}
        </div>
      </button>
      {collapsed && (
        <div className="sidebar-tooltip">
          <span>{label}</span>
          {badge && (
            <span className="ml-1.5 text-[10px] px-1 py-0.5 rounded-full font-bold"
              style={{ backgroundColor: badge.bg, color: badge.color }}>
              {badge.text}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function SidebarInner({
  collapsed, onToggleCollapse, isMobile, onMobileClose,
  currentView, onViewChange, filters, onFilterChange, onApplyFilters, onResetFilters,
}) {
  const theme = useTheme();
  const { user } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [cardHov, setCardHov] = useState(false);

  const avatarColor = AVATAR_COLOR_MAP[user?.avatar_color] ?? AVATAR_COLOR_MAP.emerald;
  const avatarSrc = user?.avatar_url ? `${API_URL}${user.avatar_url}` : null;
  const initials = user?.name ? user.name.slice(0, 2).toUpperCase() : 'U';

  const navigate = (key) => {
    onViewChange(key);
    if (isMobile && onMobileClose) onMobileClose();
  };

  return (
    <div className="flex flex-col h-full">
      {showProfileModal && <ProfileModal onClose={() => setShowProfileModal(false)} />}
      {showSettingsModal && <SettingsModal onClose={() => setShowSettingsModal(false)} />}

      {/* TOP SECTION — 64px to align with header height */}
      <div className="flex-shrink-0 border-b flex items-center overflow-hidden"
        style={{ height: 64, borderColor: theme.border, gap: 10, padding: '0 14px' }}>

        {/* Live market session widget — expands when sidebar is open */}
        <MarketSessionBar collapsed={collapsed} />

        {/* Collapse / close button */}
        <button
          onClick={isMobile ? onMobileClose : onToggleCollapse}
          className="flex-shrink-0 flex items-center justify-center rounded-lg"
          style={{
            width: 32, height: 32, color: theme.textMuted,
            opacity: collapsed ? 0 : 1,
            pointerEvents: collapsed ? 'none' : 'auto',
            transition: 'opacity 0.18s ease, background-color 0.15s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          aria-label={isMobile ? 'Close menu' : 'Collapse sidebar'}
        >
          {isMobile ? <X className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Expand button — desktop only; height collapses to 0 when sidebar is open to eliminate dead space */}
      {!isMobile && (
        <div className="flex-shrink-0 flex items-center justify-center border-b overflow-hidden"
          style={{
            height: collapsed ? 30 : 0,
            borderColor: theme.border,
            opacity: collapsed ? 1 : 0,
            pointerEvents: collapsed ? 'auto' : 'none',
            transition: 'height 0.22s ease, opacity 0.18s ease',
          }}>
          <button
            onClick={onToggleCollapse}
            className="flex items-center justify-center rounded-md"
            style={{ width: 28, height: 22, color: theme.textMuted, transition: 'background-color 0.15s ease' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            title="Expand sidebar" aria-label="Expand sidebar"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Scrollable middle */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">

        {/* USER CARD */}
        {user && (
          <div style={{ padding: collapsed ? '10px 10px 4px' : '12px 12px 4px' }}>
            <button
              onClick={() => setShowProfileModal(true)}
              onMouseEnter={() => setCardHov(true)}
              onMouseLeave={() => setCardHov(false)}
              className="w-full text-left rounded-xl transition-all duration-150"
              style={{
                padding: collapsed ? '10px 0' : '12px',
                display: 'flex',
                alignItems: 'center',
                gap: collapsed ? 0 : 12,
                justifyContent: collapsed ? 'center' : 'flex-start',
                backgroundColor: cardHov ? (theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)') : theme.surface2,
                border: `1px solid ${theme.border}`,
              }}
              title={collapsed ? user.name : undefined}
              aria-label="Open profile"
            >
              <div className="flex-shrink-0 flex items-center justify-center rounded-full font-bold text-white overflow-hidden"
                style={{ width: 40, height: 40, fontSize: 14, backgroundColor: avatarSrc ? 'transparent' : avatarColor, boxShadow: `0 0 0 2px ${theme.border}` }}>
                {avatarSrc ? <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" /> : initials}
              </div>
              {/* Text always in DOM — hides via CSS only */}
              <div style={{
                flex: 1, minWidth: 0, overflow: 'hidden',
                opacity: collapsed ? 0 : 1,
                maxWidth: collapsed ? 0 : 200,
                transition: 'opacity 0.18s ease, max-width 0.28s ease',
              }}>
                <p className="text-sm font-semibold truncate leading-tight" style={{ color: theme.text }}>{user.name}</p>
                <p className="text-xs truncate leading-tight mt-0.5" style={{ color: theme.textMuted }}>{user.email}</p>
                <div className="mt-1.5"><PlanBadge /></div>
              </div>
              <ChevronRight className="w-4 h-4 flex-shrink-0"
                style={{
                  color: theme.textMuted,
                  opacity: collapsed ? 0 : 0.4,
                  maxWidth: collapsed ? 0 : 16,
                  overflow: 'hidden',
                  transition: 'opacity 0.18s ease, max-width 0.28s ease',
                }} />
            </button>
          </div>
        )}

        {/* MENU LABEL — always in DOM, fades via CSS */}
        <div style={{ padding: collapsed ? '10px 20px 4px' : '16px 20px 6px', overflow: 'hidden', transition: 'padding 0.28s ease' }}>
          <span style={{
            display: 'block', color: theme.textMuted, fontSize: 10, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap',
            opacity: collapsed ? 0 : 1,
            maxHeight: collapsed ? 0 : 20,
            overflow: 'hidden',
            transition: 'opacity 0.18s ease, max-height 0.28s ease',
          }}>Menu</span>
        </div>

        {/* NAV ITEMS */}
        <nav style={{ padding: collapsed ? '0 8px' : '0 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map(item => (
            <NavButton key={item.key} icon={item.icon} label={item.label} badge={item.badge}
              core={!!item.core}
              active={currentView === item.key} collapsed={collapsed} onClick={() => navigate(item.key)} />
          ))}
          {/* Settings inline in nav */}
          <div style={{ marginTop: 6, borderTop: `1px solid ${theme.border}`, paddingTop: 6 }}>
            <NavButton icon={Settings} label="Settings" badge={null} active={false}
              collapsed={collapsed} onClick={() => setShowSettingsModal(true)} />
          </div>
          {user?.is_admin === 1 && (
            <NavButton icon={Crown} label="Admin" badge={null} active={currentView === 'admin'}
              collapsed={collapsed} accentColor="#a78bfa" onClick={() => navigate('admin')} />
          )}
        </nav>

        {/* News filters -- expanded + news view only */}
        {!collapsed && currentView === 'news' && (
          <div style={{ padding: '8px 10px 16px' }}>
            <div className="border-t pt-4" style={{ borderColor: theme.border }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold uppercase tracking-widest flex items-center gap-1.5" style={{ color: theme.textMuted }}>
                  <Filter className="w-3 h-3" /> Filters
                </span>
                <button onClick={onResetFilters} className="text-xs flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity" style={{ color: theme.accent }}>
                  <X className="w-3 h-3" /> Clear
                </button>
              </div>
              <div className="mb-3">
                <label className="text-xs mb-1.5 flex items-center gap-1" style={{ color: theme.textMuted }}>
                  <Search className="w-3 h-3" /> Keyword
                </label>
                <input type="text" value={filters.keyword} onChange={e => onFilterChange({ keyword: e.target.value })}
                  placeholder="Search news..." className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none"
                  style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                  onFocus={e => (e.target.style.borderColor = theme.accent)}
                  onBlur={e => (e.target.style.borderColor = theme.border)} />
              </div>
              <div className="mb-3">
                <label className="text-xs mb-1.5 flex items-center gap-1" style={{ color: theme.textMuted }}>
                  <Calendar className="w-3 h-3" /> Date Range
                </label>
                <div className="space-y-2">
                  {['startDate', 'endDate'].map(f => (
                    <input key={f} type="date" value={filters[f]} onChange={e => onFilterChange({ [f]: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none"
                      style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                      onFocus={e => (e.target.style.borderColor = theme.accent)}
                      onBlur={e => (e.target.style.borderColor = theme.border)} />
                  ))}
                </div>
              </div>
              <div className="mb-3">
                <label className="text-xs mb-1.5 block" style={{ color: theme.textMuted }}>Impact Level</label>
                <div className="grid grid-cols-2 gap-1">
                  {['All', 'High', 'Medium', 'Low'].map(level => (
                    <button key={level} onClick={() => onFilterChange({ impactLevel: level })}
                      className="px-2 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{ backgroundColor: filters.impactLevel === level ? theme.accent : theme.bg, color: filters.impactLevel === level ? '#fff' : theme.textMuted, border: `1px solid ${filters.impactLevel === level ? theme.accent : theme.border}` }}>
                      {level}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={onApplyFilters} className="w-full px-4 py-2 text-white rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: theme.accent }}>Apply Filters</button>
              <div className="mt-3">
                <p className="text-[10px] uppercase font-semibold tracking-wider mb-2" style={{ color: theme.textMuted }}>Quick Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {['Gold', 'Inflation', 'Fed', 'USD', 'Geopolitics'].map(tag => (
                    <button key={tag} onClick={() => { onFilterChange({ keyword: tag }); onApplyFilters(); }}
                      className="px-2 py-1 border rounded-full text-xs transition-all hover:scale-105"
                      style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.textMuted }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.color = theme.accent; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.textMuted; }}>
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM SECTION — just session bar / version note when collapsed */}
      <div className="flex-shrink-0 border-t" style={{ borderColor: theme.border, padding: collapsed ? '8px' : '6px 10px' }}>
        <div style={{
          overflow: 'hidden', opacity: collapsed ? 0 : 1, maxHeight: collapsed ? 0 : 40,
          transition: 'opacity 0.18s ease, max-height 0.28s ease',
        }}>
          <p style={{ fontSize: 10, color: theme.textMuted, textAlign: 'center', padding: '4px 0' }}>
            Zynth · v1.0
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({
  filters, onFilterChange, onApplyFilters, onResetFilters,
  currentView, onViewChange, mobileOpen, onClose, collapsed, onToggleCollapse,
}) {
  const theme = useTheme();
  return (
    <>
      {/* Mobile sidebar */}
      <aside
        className={['md:hidden fixed top-0 left-0 h-full z-40 flex flex-col overflow-hidden', 'transition-transform duration-300 ease-in-out', mobileOpen ? 'translate-x-0' : '-translate-x-full'].join(' ')}
        style={{
          width: 260,
          backgroundColor: theme.surface,
          borderRight: theme.isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(0,0,0,0.10)',
          boxShadow: theme.isDark ? '4px 0 20px rgba(0,0,0,0.45)' : '4px 0 12px rgba(0,0,0,0.08)',
        }}
      >
        <SidebarInner collapsed={false} isMobile onMobileClose={onClose}
          currentView={currentView} onViewChange={onViewChange}
          filters={filters} onFilterChange={onFilterChange} onApplyFilters={onApplyFilters} onResetFilters={onResetFilters} />
      </aside>
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      )}
      {/* Desktop sidebar */}
      <aside
        className={['hidden md:flex flex-col overflow-hidden flex-shrink-0', 'transition-[width] duration-[220ms] ease-out', collapsed ? 'w-[64px]' : 'w-[240px]'].join(' ')}
        style={{
          backgroundColor: theme.surface,
          borderRight: theme.isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(0,0,0,0.10)',
          boxShadow: theme.isDark ? '4px 0 20px rgba(0,0,0,0.45)' : '4px 0 12px rgba(0,0,0,0.08)',
          willChange: 'width',
        }}
      >
        <SidebarInner collapsed={collapsed} onToggleCollapse={onToggleCollapse} isMobile={false}
          currentView={currentView} onViewChange={onViewChange}
          filters={filters} onFilterChange={onFilterChange} onApplyFilters={onApplyFilters} onResetFilters={onResetFilters} />
      </aside>
    </>
  );
}
