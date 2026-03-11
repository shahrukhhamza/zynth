import { Search, Filter, Calendar, X, BarChart3, Newspaper, Brain, BookOpen, Wifi, Camera, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const NAV_ITEMS = [
  { key: 'data',         icon: BarChart3,  label: 'Economic Data',       badge: null },
  { key: 'calendar',     icon: Calendar,   label: 'Economic Calendar',   badge: null },
  { key: 'intelligence', icon: Brain,      label: 'Intelligence',         badge: null },
  { key: 'news',         icon: Newspaper,  label: 'Market News',          badge: null },
  { key: 'markets',      icon: Wifi,       label: 'Live Markets',         badge: { text: 'LIVE', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' } },
  { key: 'journal',      icon: BookOpen,   label: 'Trade Journal',        badge: null },
  { key: 'screenshot',   icon: Camera,     label: 'Screenshot Analysis',  badge: { text: 'AI',   color: '#a855f7', bg: 'rgba(168,85,247,0.15)' } },
];

/* ─── Shared sidebar body ─────────────────────────────────────────── */
function SidebarBody({
  theme,
  collapsed = false,
  currentView,
  onViewChange,
  filters,
  onFilterChange,
  onApplyFilters,
  onResetFilters,
  onToggleCollapse,
  showBrand = false,
}) {
  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col">

      {/* Brand tile — desktop only, controlled by showBrand */}
      {showBrand && (
        <div
          className={['flex items-center border-b px-3 py-3', collapsed ? 'justify-center' : 'gap-3'].join(' ')}
          style={{ borderColor: theme.border }}
        >
          <div
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
              boxShadow: '0 0 12px rgba(59,130,246,0.4)',
            }}
          >
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold leading-tight truncate tracking-tight" style={{ color: theme.text }}>Zynth</p>
                <p className="text-[10px] leading-tight truncate" style={{ color: theme.muted }}>Market Intelligence</p>
              </div>
              <button
                onClick={onToggleCollapse}
                className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg transition-all"
                style={{ color: theme.muted, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          )}
          {collapsed && (
            <button
              onClick={onToggleCollapse}
              className="flex items-center justify-center w-7 h-7 rounded-lg transition-all mt-1"
              style={{ color: theme.muted, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Nav label */}
      {!collapsed && (
        <div className="px-4 pt-4 pb-1">
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: theme.muted }}>
            Navigation
          </span>
        </div>
      )}

      {/* Navigation items */}
      <nav className={collapsed ? 'px-1.5 py-3 space-y-1' : 'px-3 py-2 space-y-0.5'}>
        {NAV_ITEMS.map(({ key, icon: Icon, label, badge }) => {
          const active = currentView === key;
          return (
            <div key={key} className="sidebar-nav-item-wrapper relative group">
              <button
                onClick={() => onViewChange(key)}
                className={[
                  'w-full flex items-center rounded-xl transition-all duration-150 text-left',
                  collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5',
                ].join(' ')}
                style={{
                  backgroundColor: active
                    ? theme.isDark ? 'rgba(59,130,246,0.18)' : 'rgba(59,130,246,0.1)'
                    : 'transparent',
                  color: active ? theme.accent : theme.muted,
                  borderLeft: active && !collapsed ? `3px solid ${theme.accent}` : 'none',
                  paddingLeft: active && !collapsed ? 'calc(0.75rem - 3px)' : undefined,
                }}
                onMouseEnter={e => {
                  if (!active) e.currentTarget.style.backgroundColor = theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
                  if (!active) e.currentTarget.style.color = theme.text;
                }}
                onMouseLeave={e => {
                  if (!active) e.currentTarget.style.backgroundColor = 'transparent';
                  if (!active) e.currentTarget.style.color = theme.muted;
                }}
              >
                <Icon className={collapsed ? 'w-5 h-5 flex-shrink-0' : 'w-4 h-4 flex-shrink-0'} />
                {!collapsed && (
                  <>
                    <span className="text-sm font-medium flex-1 truncate">{label}</span>
                    {badge && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none"
                        style={{ backgroundColor: badge.bg, color: badge.color }}
                      >
                        {badge.text}
                      </span>
                    )}
                  </>
                )}
              </button>
              {/* Tooltip — visible only in collapsed desktop mode */}
              {collapsed && (
                <div className="sidebar-tooltip">
                  <span>{label}</span>
                  {badge && (
                    <span
                      className="ml-1.5 text-[10px] px-1 py-0.5 rounded-full font-bold"
                      style={{ backgroundColor: badge.bg, color: badge.color }}
                    >
                      {badge.text}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* News filters — expanded + news view only */}
      {!collapsed && currentView === 'news' && (
        <div className="px-3 pb-4">
          <div className="border-t pt-4" style={{ borderColor: theme.border }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[10px] font-semibold uppercase tracking-widest flex items-center gap-1.5" style={{ color: theme.muted }}>
                <Filter className="w-3 h-3" />
                Filters
              </h2>
              <button
                onClick={onResetFilters}
                className="text-xs flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity"
                style={{ color: theme.accent }}
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            </div>

            <div className="mb-3">
              <label className="text-xs mb-1.5 flex items-center gap-1" style={{ color: theme.muted }}>
                <Search className="w-3 h-3" />
                Keyword
              </label>
              <input
                type="text"
                value={filters.keyword}
                onChange={e => onFilterChange({ keyword: e.target.value })}
                placeholder="Search news..."
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none transition-colors"
                style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                onFocus={e => (e.currentTarget.style.borderColor = theme.accent)}
                onBlur={e => (e.currentTarget.style.borderColor = theme.border)}
              />
            </div>

            <div className="mb-3">
              <label className="text-xs mb-1.5 flex items-center gap-1" style={{ color: theme.muted }}>
                <Calendar className="w-3 h-3" />
                Date Range
              </label>
              <div className="space-y-2">
                {['startDate', 'endDate'].map(field => (
                  <input
                    key={field}
                    type="date"
                    value={filters[field]}
                    onChange={e => onFilterChange({ [field]: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none transition-colors"
                    style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
                    onFocus={e => (e.currentTarget.style.borderColor = theme.accent)}
                    onBlur={e => (e.currentTarget.style.borderColor = theme.border)}
                  />
                ))}
              </div>
            </div>

            <div className="mb-3">
              <label className="text-xs mb-1.5 block" style={{ color: theme.muted }}>Impact Level</label>
              <div className="grid grid-cols-2 gap-1">
                {['All', 'High', 'Medium', 'Low'].map(level => (
                  <button
                    key={level}
                    onClick={() => onFilterChange({ impactLevel: level })}
                    className="px-2 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      backgroundColor: filters.impactLevel === level ? theme.accent : theme.bg,
                      color: filters.impactLevel === level ? '#fff' : theme.muted,
                      border: `1px solid ${filters.impactLevel === level ? theme.accent : theme.border}`,
                    }}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={onApplyFilters}
              className="w-full px-4 py-2 text-white rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
            >
              Apply Filters
            </button>

            <div className="mt-3">
              <p className="text-[10px] uppercase font-semibold tracking-wider mb-2" style={{ color: theme.muted }}>Quick Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {['Gold', 'Inflation', 'Fed', 'USD', 'Geopolitics'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => { onFilterChange({ keyword: tag }); onApplyFilters(); }}
                    className="px-2 py-1 border rounded-full text-xs transition-all hover:scale-105"
                    style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.muted }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.color = theme.accent; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.muted; }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Sidebar component ──────────────────────────────────────── */
function Sidebar({
  filters,
  onFilterChange,
  onApplyFilters,
  onResetFilters,
  currentView,
  onViewChange,
  mobileOpen,
  onClose,
  collapsed,
  onToggleCollapse,
}) {
  const theme = useTheme();

  return (
    <>
      {/* ── Mobile sidebar (md:hidden) ── */}
      <aside
        className={[
          'md:hidden fixed top-0 left-0 h-full w-72 z-40 flex flex-col border-r overflow-hidden',
          'transition-transform duration-300 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        style={{ backgroundColor: theme.surface, borderColor: theme.border }}
      >
        {/* Mobile header row with close button */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: theme.border }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)' }}
            >
              <BarChart3 className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold" style={{ color: theme.text }}>Zynth</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg"
            style={{ color: theme.muted }}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <SidebarBody
          theme={theme}
          collapsed={false}
          currentView={currentView}
          onViewChange={(v) => { onViewChange(v); onClose(); }}
          filters={filters}
          onFilterChange={onFilterChange}
          onApplyFilters={onApplyFilters}
          onResetFilters={onResetFilters}
          onToggleCollapse={onClose}
          showBrand={false}
        />
      </aside>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* ── Desktop sidebar (hidden md:flex) ── */}
      <aside
        className={[
          'hidden md:flex flex-col border-r overflow-hidden flex-shrink-0',
          'transition-[width] duration-300 ease-in-out',
          collapsed ? 'w-14' : 'w-64',
        ].join(' ')}
        style={{ backgroundColor: theme.surface, borderColor: theme.border }}
      >
        <SidebarBody
          theme={theme}
          collapsed={collapsed}
          currentView={currentView}
          onViewChange={onViewChange}
          filters={filters}
          onFilterChange={onFilterChange}
          onApplyFilters={onApplyFilters}
          onResetFilters={onResetFilters}
          onToggleCollapse={onToggleCollapse}
          showBrand
        />
      </aside>
    </>
  );
}

export default Sidebar;
