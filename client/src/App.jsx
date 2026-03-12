import { useState, useEffect, useRef, lazy, Suspense } from 'react'
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
import LandingPage from './components/LandingPage'
import ForgotPasswordPage from './components/ForgotPasswordPage'
import ResetPasswordPage from './components/ResetPasswordPage'
import { fetchNews } from './services/api'
import { Loader2 } from 'lucide-react'

// Lazily loaded — chunk is only downloaded when an admin user navigates to the admin view.
// Non-admin users will never trigger this import.
const AdminDashboard = lazy(() => import('./components/AdminDashboard'))

// The main dashboard shell (only shown when authenticated)
function AppShell() {
  const theme = useTheme();
  const { user } = useAuth();
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem('sidebarCollapsed') === 'true'; } catch { return false; }
  });

  const handleToggleCollapse = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('sidebarCollapsed', String(next)); } catch {}
      return next;
    });
  };

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
        {/* Left Sidebar */}
        <Sidebar 
          filters={filters}
          onFilterChange={handleFilterChange}
          onApplyFilters={applyFilters}
          onResetFilters={resetFilters}
          currentView={currentView}
          onViewChange={(view) => {
            // Hard guard: silently reject any attempt to navigate to admin
            // from a non-admin account (belt + backend requireAdmin middleware)
            if (view === 'admin' && user?.is_admin !== 1) return;
            setCurrentView(view); setMobileSidebarOpen(false);
          }}
          mobileOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />
        
        {/* Main Content Area */}
        {currentView === 'admin' && user?.is_admin === 1 ? (
          // Suspense boundary — AdminDashboard chunk loads on-demand only for admins
          <Suspense fallback={
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: theme.accent }} />
            </div>
          }>
            <AdminDashboard />
          </Suspense>
        ) : currentView === 'data' ? (
          <EconomicDashboard key="data" />
        ) : currentView === 'calendar' ? (
          <div key="calendar" className="flex-1 overflow-y-auto p-6 page-enter">
            <EconomicCalendar />
          </div>
        ) : currentView === 'intelligence' ? (
          <div key="intelligence" className="flex-1 overflow-y-auto p-6 page-enter">
            <EconomicIntelligence />
          </div>
        ) : currentView === 'journal' ? (
          <div key="journal" className="flex-1 overflow-y-auto page-enter"><TradeJournal /></div>
        ) : currentView === 'screenshot' ? (
          <div key="screenshot" className="flex-1 overflow-y-auto page-enter"><ScreenshotImportDashboard /></div>
        ) : currentView === 'markets' ? (
          <LiveMarketTicker key="markets" />
        ) : (
          <>
            {/* News Feed */}
            <NewsFeed
              key="news"
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
  const { user, loading } = useAuth()
  const [view, setView] = useState(() => {
    const path = window.location.pathname;
    if (path === '/reset-password') return 'resetPassword';
    if (path === '/forgot-password') return 'forgotPassword';
    return 'landing';
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    )
  }

  if (user) return <AppShell />

  if (view === 'signup')
    return <SignupPage onSwitchToLogin={() => setView('login')} onBack={() => setView('landing')} />

  if (view === 'login')
    return <LoginPage
      onSwitchToSignup={() => setView('signup')}
      onBack={() => setView('landing')}
      onForgotPassword={() => setView('forgotPassword')}
    />

  if (view === 'forgotPassword')
    return <ForgotPasswordPage onBack={() => setView('login')} />

  if (view === 'resetPassword')
    return <ResetPasswordPage onBack={() => setView('login')} />

  return (
    <LandingPage
      onSignIn={() => setView('login')}
      onGetStarted={() => setView('signup')}
    />
  )
}
