import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Filter, Calendar, X, Brain, ChevronLeft, ChevronRight, Crown, Settings, HelpCircle,
  LayoutDashboard, BookOpen, Calculator, TrendingUp, ShieldCheck, Plus, Sparkles, ArrowUpRight,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { usePlan } from '../hooks/usePlan';
import ProfileModal from './ProfileModal';
import SettingsModal from './SettingsModal';
import PlanBadge from './PlanBadge';
import { BrandMark } from './BrandLogo';
import { resolveMediaUrl } from '../utils/mediaUrl';

const AVATAR_COLOR_MAP = {
  emerald: '#10b981', blue: '#CA8A04', purple: '#8b5cf6', orange: '#f97316',
  rose: '#f43f5e', amber: '#f59e0b', cyan: '#06b6d4', indigo: '#CA8A04',
};

const NAV_GROUPS = [
  {
    label: 'Workspace',
    items: [
      { key: 'data',         icon: LayoutDashboard, label: 'Dashboard' },
      { key: 'journal',      icon: BookOpen,        label: 'Trade Journal' },
      { key: 'intelligence', icon: Brain,           label: 'AI Insights', badge: 'AI' },
      { key: 'calendar',     icon: Calendar,        label: 'Economic Calendar' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { key: 'calculator/profit', icon: TrendingUp,  label: 'Profit Calculator' },
      { key: 'calculator/risk',   icon: ShieldCheck, label: 'Risk Planner' },
    ],
  },
];

function NavButton({ icon: Icon, label, badge, active, collapsed, onClick, layoutGroup, tourId }) {
  return (
    <button
      data-tour={tourId}
      onClick={onClick}
      title={collapsed ? label : undefined}
      aria-current={active ? 'page' : undefined}
      className={[
        'group relative flex h-10 w-full flex-shrink-0 cursor-pointer select-none items-center rounded-xl border-0 bg-transparent transition-colors duration-150',
        collapsed ? 'justify-center' : 'gap-3 px-3',
        active
          ? 'text-zinc-950 dark:text-white'
          : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100',
      ].join(' ')}
    >
      {active && (
        <motion.span
          layoutId={`nav-active-${layoutGroup}`}
          className="absolute inset-0 rounded-xl border border-[#CA8A04]/25 bg-[#CA8A04]/10"
          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
        >
          <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#CA8A04]" />
        </motion.span>
      )}
      {!active && (
        <span className="absolute inset-0 rounded-xl bg-zinc-900/[0.04] opacity-0 transition-opacity duration-150 group-hover:opacity-100 dark:bg-white/[0.05]" />
      )}
      <Icon
        className="relative transition-transform duration-200 group-hover:scale-110"
        style={{ width: 17, height: 17, flexShrink: 0, color: active ? '#CA8A04' : undefined }}
      />
      {!collapsed && (
        <span className="relative flex min-w-0 flex-1 items-center justify-between">
          <span className={`overflow-hidden text-ellipsis whitespace-nowrap text-[13.5px] ${active ? 'font-semibold' : 'font-medium'}`}>{label}</span>
          {badge && (
            <span className="ml-1 flex-shrink-0 rounded-full border border-[#CA8A04]/30 bg-[#CA8A04]/10 px-1.5 py-0.5 text-[9px] font-bold tracking-[0.06em] text-[#A16207] dark:text-[#FBBF24]">
              {badge}
            </span>
          )}
        </span>
      )}
      {collapsed && badge && (
        <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#CA8A04]" style={{ boxShadow: '0 0 6px #CA8A04' }} />
      )}
    </button>
  );
}

/* Plan / usage card shown above the profile row */
function PlanCard({ collapsed, onUpgrade }) {
  const { user } = useAuth();
  const { isFree, isAdmin, journalCount, maxJournal } = usePlan();
  if (collapsed) return null;

  if (user?.promo_elite) {
    return (
      <div className="relative mb-2 overflow-hidden rounded-2xl border border-[#CA8A04]/30 p-3.5" style={{ background: 'linear-gradient(135deg, rgba(202,138,4,0.16), rgba(234,179,8,0.05))' }}>
        <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full" style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.35), transparent 70%)' }} />
        <div className="relative flex items-center gap-2 text-[12.5px] font-bold text-[#8a5a05] dark:text-[#FBBF24]"><Crown size={14} /> Elite · early access</div>
        <p className="relative m-0 mt-1 text-[11.5px] leading-snug text-zinc-600 dark:text-zinc-400">Every feature is unlocked — free for our first 100 users.</p>
      </div>
    );
  }
  if (isFree && !isAdmin) {
    const pct = maxJournal && maxJournal !== Infinity ? Math.min(100, Math.round((journalCount / maxJournal) * 100)) : 0;
    return (
      <div className="mb-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-3.5 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">
          <span>Free plan</span><span className="text-zinc-500">{journalCount}/{maxJournal} entries</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-[#CA8A04] to-[#FBBF24] transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
        <button onClick={onUpgrade} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#CA8A04] py-2 text-[12px] font-bold text-[#1a1203] transition-all hover:brightness-110">
          <Sparkles size={13} /> Upgrade
        </button>
      </div>
    );
  }
  return null;
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

  const goPayment = () => navigate('payment');

  const Avatar = ({ size }) => (avatarSrc && !avatarError ? (
    <img src={avatarSrc} alt={user?.name} onError={() => setAvatarError(true)} style={{ width: size, height: size, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
  ) : (
    <div style={{
      width: size, height: size, borderRadius: 10,
      background: `linear-gradient(135deg, ${avatarBg}, ${avatarBg}bb)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4, fontWeight: 700, color: '#fff', flexShrink: 0, boxShadow: `0 4px 12px ${avatarBg}40`,
    }}>
      {user?.name?.charAt(0).toUpperCase()}
    </div>
  ));

  return (
    <div className="flex h-full flex-col overflow-hidden" style={{ backgroundColor: theme.surface }}>

      {/* ── Brand ─────────────────────────────────────────── */}
      <div
        className="flex h-[64px] flex-shrink-0 items-center gap-2"
        style={{ justifyContent: collapsed ? 'center' : 'space-between', padding: collapsed ? 0 : '0 14px 0 18px', borderBottom: `1px solid ${theme.border}` }}
      >
        {!collapsed ? (
          <div className="flex items-center gap-2.5">
            <BrandMark size={30} />
            <span className="font-display text-[19px] font-bold leading-none tracking-tight" style={{ color: theme.text }}>Zynth</span>
            <span className="rounded-md border border-[#CA8A04]/30 bg-[#CA8A04]/10 px-1.5 py-[2px] text-[8.5px] font-bold uppercase tracking-[0.14em] text-[#A16207] dark:text-[#FBBF24]">Beta</span>
          </div>
        ) : <BrandMark size={30} />}

        {!isMobile && (
          <button
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border text-zinc-500 transition-colors hover:border-[#CA8A04]/40 hover:text-[#CA8A04]"
            style={{ borderColor: theme.border, display: collapsed ? 'none' : 'flex' }}
          >
            <ChevronLeft size={14} />
          </button>
        )}
        {isMobile && (
          <button onClick={onMobileClose} className="flex h-8 w-8 items-center justify-center rounded-lg border text-zinc-500" style={{ borderColor: theme.border }}>
            <X size={15} />
          </button>
        )}
      </div>

      {/* ── Primary action ────────────────────────────────── */}
      <div className="flex-shrink-0" style={{ padding: collapsed ? '14px 10px 6px' : '14px 12px 6px' }}>
        <button
          data-tour="new-entry"
          onClick={() => navigate('journal')}
          title="New journal entry"
          className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl font-bold text-[#1a1203] transition-all duration-150 hover:translate-y-[1px] active:translate-y-[3px]"
          style={{
            height: 42,
            background: 'linear-gradient(180deg, #E0A010 0%, #C98A06 100%)',
            boxShadow: '0 3px 0 #8a5a05, 0 12px 22px -10px rgba(202,138,4,0.7)',
            fontSize: 13,
          }}
        >
          <span className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-white/40 opacity-0 transition-all duration-700 group-hover:left-[120%] group-hover:opacity-100" />
          <Plus size={16} strokeWidth={2.6} />
          {!collapsed && <span className="relative">New entry</span>}
        </button>
      </div>

      {/* ── Navigation ────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ padding: collapsed ? '8px 8px' : '8px 12px' }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-3">
            {!collapsed && (
              <p className="m-0 px-3 pb-1.5 pt-2 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: theme.textMuted }}>{group.label}</p>
            )}
            {collapsed && <div className="mx-2 my-2 h-px" style={{ background: theme.border }} />}
            <nav className="flex flex-col gap-1">
              {group.items.map((item) => (
                <NavButton
                  key={item.key}
                  tourId={`nav-${item.key}`}
                  icon={item.icon}
                  label={item.label}
                  badge={item.badge}
                  active={currentView === item.key}
                  collapsed={collapsed}
                  layoutGroup={isMobile ? 'm' : 'd'}
                  onClick={() => navigate(item.key)}
                />
              ))}
            </nav>
          </div>
        ))}

        <div className="mb-3">
          {!collapsed && <p className="m-0 px-3 pb-1.5 pt-2 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: theme.textMuted }}>Account</p>}
          {collapsed && <div className="mx-2 my-2 h-px" style={{ background: theme.border }} />}
          <nav className="flex flex-col gap-1">
            <NavButton tourId="nav-help" icon={HelpCircle} label="Help & Docs" active={currentView === 'help'} collapsed={collapsed} layoutGroup={isMobile ? 'm' : 'd'} onClick={() => navigate('help')} />
            <NavButton tourId="nav-settings" icon={Settings} label="Settings" active={false} collapsed={collapsed} layoutGroup={isMobile ? 'm' : 'd'} onClick={() => setShowSettingsModal(true)} />
            {user?.is_admin === 1 && (
              <NavButton icon={Crown} label="Admin" active={currentView === 'admin'} collapsed={collapsed} layoutGroup={isMobile ? 'm' : 'd'} onClick={() => navigate('admin')} />
            )}
          </nav>
        </div>

        {/* News filters (only on the news view) */}
        {!collapsed && currentView === 'news' && (
          <div style={{ marginTop: 12, borderTop: `1px solid ${theme.border}`, paddingTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: theme.textMuted, letterSpacing: '0.12em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Filter style={{ width: 10, height: 10 }} /> Filters
              </span>
              <button onClick={onResetFilters} style={{ fontSize: 10, color: '#CA8A04', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                <X style={{ width: 10, height: 10 }} /> Clear
              </button>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 10, color: theme.textMuted, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                <Search style={{ width: 10, height: 10 }} /> Keyword
              </label>
              <input
                type="text" value={filters.keyword} onChange={(e) => onFilterChange({ keyword: e.target.value })} placeholder="Search news..."
                style={{ width: '100%', padding: '8px 10px', background: theme.surface2, border: `1px solid ${theme.border}`, borderRadius: 9, fontSize: 12, color: theme.text, outline: 'none' }}
              />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 10, color: theme.textMuted, marginBottom: 6, display: 'block' }}>Impact Level</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                {['All', 'High', 'Medium', 'Low'].map((level) => (
                  <button
                    key={level} onClick={() => onFilterChange({ impactLevel: level })}
                    style={{
                      padding: '6px 8px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                      background: filters.impactLevel === level ? '#CA8A04' : theme.surface2,
                      color: filters.impactLevel === level ? '#1a1203' : theme.textMuted,
                      border: `1px solid ${filters.impactLevel === level ? '#CA8A04' : theme.border}`, cursor: 'pointer',
                    }}
                  >{level}</button>
                ))}
              </div>
            </div>
            <button onClick={onApplyFilters} style={{ width: '100%', padding: 9, borderRadius: 9, background: '#CA8A04', color: '#1a1203', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer' }}>Apply Filters</button>
          </div>
        )}
      </div>

      {/* ── Plan + profile ────────────────────────────────── */}
      <div className="flex-shrink-0" style={{ padding: collapsed ? '10px 8px' : '10px 12px 12px', borderTop: `1px solid ${theme.border}` }}>
        <PlanCard collapsed={collapsed} onUpgrade={goPayment} />
        {collapsed ? (
          <button onClick={() => setShowProfileModal(true)} title={user?.name} className="flex w-full justify-center border-0 bg-transparent p-0"><Avatar size={34} /></button>
        ) : (
          <button
            onClick={() => setShowProfileModal(true)}
            className="group flex w-full items-center gap-3 rounded-xl border bg-transparent p-2 text-left transition-colors hover:bg-zinc-900/[0.04] dark:hover:bg-white/[0.05]"
            style={{ borderColor: theme.border }}
          >
            <Avatar size={36} />
            <div className="min-w-0 flex-1">
              <p className="m-0 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-semibold leading-tight" style={{ color: theme.text }}>{user?.name?.split(' ').slice(0, 2).join(' ')}</p>
              <div className="mt-1"><PlanBadge /></div>
            </div>
            <ArrowUpRight size={14} className="flex-shrink-0 text-zinc-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        )}
        {collapsed && (
          <button onClick={onToggleCollapse} title="Expand sidebar" className="mx-auto mt-3 flex h-7 w-7 items-center justify-center rounded-lg border text-zinc-500 transition-colors hover:text-[#CA8A04]" style={{ borderColor: theme.border }}>
            <ChevronRight size={14} />
          </button>
        )}
      </div>

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
      {mobileOpen && (
        <div
          className="md:hidden"
          onClick={onClose}
          aria-hidden="true"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 998 }}
        />
      )}

      <aside
        className="md:hidden"
        style={{
          position: 'fixed', top: 0, left: 0, height: '100%', width: 280, zIndex: 999,
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.22,1,0.36,1)',
          borderRight: `1px solid ${theme.border}`,
          boxShadow: '8px 0 40px rgba(0,0,0,0.45)',
        }}
      >
        <SidebarInner
          collapsed={false} isMobile onMobileClose={onClose}
          currentView={currentView} onViewChange={onViewChange}
          filters={filters} onFilterChange={onFilterChange}
          onApplyFilters={onApplyFilters} onResetFilters={onResetFilters}
        />
      </aside>

      <aside
        className="hidden flex-col md:flex"
        style={{
          position: 'fixed', top: 0, left: 0, height: '100vh',
          width: collapsed ? 64 : 244,
          transition: 'width 0.28s cubic-bezier(0.22,1,0.36,1)',
          borderRight: `1px solid ${theme.border}`,
          zIndex: 200, willChange: 'width', overflow: 'hidden',
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
