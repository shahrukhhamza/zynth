import { Search, Filter, Calendar, TrendingUp, X, BarChart3, Newspaper, Brain, BookOpen, Wifi, Camera } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

function Sidebar({ filters, onFilterChange, onApplyFilters, onResetFilters, currentView, onViewChange, mobileOpen, onClose }) {
  const theme = useTheme();

  const handleKeywordChange = (e) => {
    onFilterChange({ keyword: e.target.value });
  };

  const handleStartDateChange = (e) => {
    onFilterChange({ startDate: e.target.value });
  };

  const handleEndDateChange = (e) => {
    onFilterChange({ endDate: e.target.value });
  };

  const handleImpactChange = (level) => {
    onFilterChange({ impactLevel: level });
  };

  return (
    <aside
      className={[
        // Desktop: always visible, static in flow
        'hidden md:flex md:flex-col md:w-64 md:border-r md:overflow-y-auto md:relative md:z-auto',
        // Mobile: fixed overlay, slide in from left
        'fixed top-0 left-0 h-full w-72 z-40 overflow-y-auto flex flex-col',
        'transition-transform duration-300 ease-in-out',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
        // On md+ always show (override mobile transform)
        'md:translate-x-0',
      ].join(' ')}
      style={{ backgroundColor: theme.surface, borderColor: theme.border }}
    >
      {/* Mobile header row inside sidebar */}
      <div className="flex items-center justify-between px-4 pt-5 pb-2 md:hidden">
        <span className="text-sm font-bold" style={{ color: theme.text }}>Navigation</span>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg"
          style={{ color: theme.muted }}
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-4 flex-1 overflow-y-auto">
        {/* Navigation */}
        <nav className="mb-6">
          <h2 className="hidden md:block text-xs font-semibold uppercase mb-3" style={{ color: theme.muted }}>
            Navigation
          </h2>
          <ul className="space-y-1">
            <li 
              onClick={() => onViewChange('data')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors"
              style={{
                backgroundColor: currentView === 'data' ? `${theme.accent}20` : 'transparent',
                color: currentView === 'data' ? theme.text : theme.muted
              }}
              onMouseOver={(e) => {
                if (currentView !== 'data') e.currentTarget.style.backgroundColor = theme.bg;
              }}
              onMouseOut={(e) => {
                if (currentView !== 'data') e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm">Economic Data</span>
            </li>
            <li 
              onClick={() => onViewChange('calendar')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors"
              style={{
                backgroundColor: currentView === 'calendar' ? `${theme.accent}20` : 'transparent',
                color: currentView === 'calendar' ? theme.text : theme.muted
              }}
              onMouseOver={(e) => {
                if (currentView !== 'calendar') e.currentTarget.style.backgroundColor = theme.bg;
              }}
              onMouseOut={(e) => {
                if (currentView !== 'calendar') e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Economic Calendar</span>
            </li>
            <li 
              onClick={() => onViewChange('intelligence')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors"
              style={{
                backgroundColor: currentView === 'intelligence' ? `${theme.accent}20` : 'transparent',
                color: currentView === 'intelligence' ? theme.text : theme.muted
              }}
              onMouseOver={(e) => {
                if (currentView !== 'intelligence') e.currentTarget.style.backgroundColor = theme.bg;
              }}
              onMouseOut={(e) => {
                if (currentView !== 'intelligence') e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Brain className="w-4 h-4" />
              <span className="text-sm">Intelligence</span>
            </li>
            <li 
              onClick={() => onViewChange('news')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors"
              style={{
                backgroundColor: currentView === 'news' ? `${theme.accent}20` : 'transparent',
                color: currentView === 'news' ? theme.text : theme.muted
              }}
              onMouseOver={(e) => {
                if (currentView !== 'news') e.currentTarget.style.backgroundColor = theme.bg;
              }}
              onMouseOut={(e) => {
                if (currentView !== 'news') e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Newspaper className="w-4 h-4" />
              <span className="text-sm">Market News</span>
            </li>
            <li 
              onClick={() => onViewChange('markets')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors"
              style={{
                backgroundColor: currentView === 'markets' ? `${theme.accent}20` : 'transparent',
                color: currentView === 'markets' ? theme.text : theme.muted
              }}
              onMouseOver={(e) => {
                if (currentView !== 'markets') e.currentTarget.style.backgroundColor = theme.bg;
              }}
              onMouseOut={(e) => {
                if (currentView !== 'markets') e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Wifi className="w-4 h-4" />
              <span className="text-sm">Live Markets</span>
              <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: 'rgba(34,197,94,0.2)', color: '#22c55e' }}>LIVE</span>
            </li>
            <li 
              onClick={() => onViewChange('journal')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors"
              style={{
                backgroundColor: currentView === 'journal' ? `${theme.accent}20` : 'transparent',
                color: currentView === 'journal' ? theme.text : theme.muted
              }}
              onMouseOver={(e) => {
                if (currentView !== 'journal') e.currentTarget.style.backgroundColor = theme.bg;
              }}
              onMouseOut={(e) => {
                if (currentView !== 'journal') e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <BookOpen className="w-4 h-4" />
              <span className="text-sm">Trade Journal</span>
            </li>
            <li 
              onClick={() => onViewChange('screenshot')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors"
              style={{
                backgroundColor: currentView === 'screenshot' ? `${theme.accent}20` : 'transparent',
                color: currentView === 'screenshot' ? theme.text : theme.muted
              }}
              onMouseOver={(e) => {
                if (currentView !== 'screenshot') e.currentTarget.style.backgroundColor = theme.bg;
              }}
              onMouseOut={(e) => {
                if (currentView !== 'screenshot') e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Camera className="w-4 h-4" />
              <span className="text-sm">Screenshot Analysis</span>
              <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: 'rgba(168,85,247,0.2)', color: '#a855f7' }}>AI</span>
            </li>
          </ul>
        </nav>

        {/* Filters Section - Only show for News view */}
        {currentView === 'news' && (
          <>
            <div className="border-t pt-4" style={{ borderColor: theme.border }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase flex items-center gap-2" style={{ color: theme.muted }}>
              <Filter className="w-4 h-4" />
              Filters
            </h2>
            <button
              onClick={onResetFilters}
              className="text-xs flex items-center gap-1 transition-opacity"
              style={{ color: theme.accent }}
              onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          </div>

          {/* Keyword Search */}
          <div className="mb-4">
            <label className="text-xs mb-2 block" style={{ color: theme.muted }}>
              <Search className="w-3 h-3 inline mr-1" />
              Keyword
            </label>
            <input
              type="text"
              value={filters.keyword}
              onChange={handleKeywordChange}
              placeholder="Search news..."
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none"
              style={{ 
                backgroundColor: theme.bg, 
                borderColor: theme.border,
                color: theme.text 
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = theme.accent}
              onBlur={(e) => e.currentTarget.style.borderColor = theme.border}
            />
          </div>

          {/* Date Range */}
          <div className="mb-4">
            <label className="text-xs mb-2 block" style={{ color: theme.muted }}>
              <Calendar className="w-3 h-3 inline mr-1" />
              Date Range
            </label>
            <div className="space-y-2">
              <input
                type="date"
                value={filters.startDate}
                onChange={handleStartDateChange}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none"
                style={{ 
                  backgroundColor: theme.bg, 
                  borderColor: theme.border,
                  color: theme.text 
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = theme.accent}
                onBlur={(e) => e.currentTarget.style.borderColor = theme.border}
              />
              <input
                type="date"
                value={filters.endDate}
                onChange={handleEndDateChange}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none"
                style={{ 
                  backgroundColor: theme.bg, 
                  borderColor: theme.border,
                  color: theme.text 
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = theme.accent}
                onBlur={(e) => e.currentTarget.style.borderColor = theme.border}
              />
            </div>
          </div>

          {/* Impact Level */}
          <div className="mb-4">
            <label className="text-xs mb-2 block" style={{ color: theme.muted }}>
              Impact Level
            </label>
            <div className="space-y-1">
              {['All', 'High', 'Medium', 'Low'].map((level) => (
                <button
                  key={level}
                  onClick={() => handleImpactChange(level)}
                  className="w-full px-3 py-2 rounded-lg text-sm text-left transition-colors"
                  style={{
                    backgroundColor: filters.impactLevel === level ? theme.accent : theme.bg,
                    color: filters.impactLevel === level ? '#fff' : theme.text
                  }}
                  onMouseOver={(e) => {
                    if (filters.impactLevel !== level) {
                      e.currentTarget.style.backgroundColor = theme.border;
                    }
                  }}
                  onMouseOut={(e) => {
                    if (filters.impactLevel !== level) {
                      e.currentTarget.style.backgroundColor = theme.bg;
                    }
                  }}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Apply Button */}
          <button
            onClick={onApplyFilters}
            className="w-full px-4 py-2 text-white rounded-lg text-sm font-medium transition-opacity"
            style={{ backgroundColor: theme.success }}
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
          >
            Apply Filters
          </button>
        </div>

        {/* Quick Filters */}
        <div className="border-t pt-4 mt-4" style={{ borderColor: theme.border }}>
          <h2 className="text-xs font-semibold uppercase mb-3" style={{ color: theme.muted }}>
            Quick Filters
          </h2>
          <div className="flex flex-wrap gap-2">
            {['Gold', 'Inflation', 'Fed', 'USD', 'Geopolitics'].map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  onFilterChange({ keyword: tag });
                  onApplyFilters();
                }}
                className="px-3 py-1 border rounded-full text-xs transition-colors"
                style={{ 
                  backgroundColor: theme.bg, 
                  borderColor: theme.border,
                  color: theme.text 
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = theme.accent}
                onMouseOut={(e) => e.currentTarget.style.borderColor = theme.border}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
        </>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
