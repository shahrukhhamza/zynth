import { useState, useEffect, useRef } from 'react'
import { useTheme } from './contexts/ThemeContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Header from './components/Header'
import Sidebar from './components/Sidebar'

// Close sidebar when window resizes to desktop width
function useAutoCloseSidebarOnDesktop(setSidebarOpen) {
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = (e) => { if (e.matches) setSidebarOpen(false); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [setSidebarOpen]);
}
import NewsFeed from './components/NewsFeed'
import RightPanel from './components/RightPanel'
import EconomicDashboard from './components/EconomicDashboard'
import EconomicCalendar from './components/EconomicCalendar'
import EconomicIntelligence from './components/EconomicIntelligence'
import ScreenshotImportDashboard from './components/ScreenshotImportDashboard'
import LiveMarketTicker from './components/LiveMarketTicker'
import TradeJournal from './components/TradeJournal'
import LoginPage from './components/LoginPage'
import SignupPage from './components/SignupPage'
import { fetchNews } from './services/api'
import { Loader2 } from 'lucide-react'

// The main dashboard shell (only shown when authenticated)
function AppShell() {
  const theme = useTheme();
  const [currentView, setCurrentView] = useState('data'); // Start with data view
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    keyword: '',
    startDate: '',
    endDate: '',
    impactLevel: 'All'
  });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useAutoCloseSidebarOnDesktop(setMobileSidebarOpen);

  // Keep a ref in sync so loadNews always reads current filters (avoids stale closure)
  const filtersRef = useRef(filters);

  // Fetch news
  const loadNews = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      
      const data = await fetchNews(filtersRef.current);
      setNews(data);
    } catch (err) {
      setError(err.message);
      console.error('Error loading news:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load - only load news if on news view
  useEffect(() => {
    if (currentView === 'news') {
      loadNews();
    }
  }, [currentView]);
  
  // Auto-refresh every 30 seconds - only for news view
  useEffect(() => {
    if (!autoRefresh || currentView !== 'news') return;

    const interval = setInterval(() => {
      loadNews(false); // Don't show loading spinner on auto-refresh
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, filters, currentView]);

  // Handle filter changes — update ref synchronously so loadNews always has latest value
  const handleFilterChange = (newFilters) => {
    setFilters(prev => {
      const updated = { ...prev, ...newFilters };
      filtersRef.current = updated;
      return updated;
    });
  };

  // Apply filters, switch to news view, and reload
  const applyFilters = () => {
    setCurrentView('news');
    loadNews();
  };

  // Reset filters
  const resetFilters = () => {
    const cleared = { keyword: '', startDate: '', endDate: '', impactLevel: 'All' };
    filtersRef.current = cleared;
    setFilters(cleared);
    loadNews();
  };

  // Calculate sentiment stats
  const getSentimentStats = () => {
    const bullish = news.filter(n => n.sentiment === 'Bullish').length;
    const bearish = news.filter(n => n.sentiment === 'Bearish').length;
    const neutral = news.filter(n => n.sentiment === 'Neutral').length;
    return { bullish, bearish, neutral };
  };

  // Get high impact news
  const getHighImpactNews = () => {
    return news.filter(n => n.impactLevel === 'High').slice(0, 10);
  };

  // Filter news by impact level
  const getFilteredNews = () => {
    if (filters.impactLevel === 'All') return news;
    return news.filter(n => n.impactLevel === filters.impactLevel);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.bg, color: theme.text }}>
      <Header 
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={() => setAutoRefresh(!autoRefresh)}
        onRefresh={() => currentView === 'news' ? loadNews() : window.location.reload()}
        onToggleSidebar={() => setMobileSidebarOpen(o => !o)}
        mobileSidebarOpen={mobileSidebarOpen}
      />
      
      <div className="flex h-[calc(100vh-64px)] relative">
        {/* Mobile backdrop */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 z-30 md:hidden"
            style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Left Sidebar */}
        <Sidebar 
          filters={filters}
          onFilterChange={handleFilterChange}
          onApplyFilters={applyFilters}
          onResetFilters={resetFilters}
          currentView={currentView}
          onViewChange={(view) => { setCurrentView(view); setMobileSidebarOpen(false); }}
          mobileOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />
        
        {/* Main Content Area */}
        {currentView === 'data' ? (
          <EconomicDashboard />
        ) : currentView === 'calendar' ? (
          <div className="flex-1 overflow-y-auto p-6">
            <EconomicCalendar />
          </div>
        ) : currentView === 'intelligence' ? (
          <div className="flex-1 overflow-y-auto p-6">
            <EconomicIntelligence />
          </div>
        ) : currentView === 'journal' ? (
          <div className="flex-1 overflow-y-auto"><TradeJournal /></div>
        ) : currentView === 'screenshot' ? (
          <div className="flex-1 overflow-y-auto"><ScreenshotImportDashboard /></div>
        ) : currentView === 'markets' ? (
          <LiveMarketTicker />
        ) : (
          <>
            {/* News Feed */}
            <NewsFeed 
              news={getFilteredNews()}
              loading={loading}
              error={error}
            />
            
            {/* Right Panel */}
            <RightPanel 
              sentimentStats={getSentimentStats()}
              highImpactNews={getHighImpactNews()}
              totalNews={news.length}
            />
          </>
        )}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  )
}

function AuthGate() {
  const { user, loading, logout } = useAuth()
  const [authView, setAuthView] = useState('login') // 'login' | 'signup'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return authView === 'signup'
      ? <SignupPage onSwitchToLogin={() => setAuthView('login')} />
      : <LoginPage  onSwitchToSignup={() => setAuthView('signup')} />
  }

  return <AppShell />
}
