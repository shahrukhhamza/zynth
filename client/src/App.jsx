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
import ChartsPage from './components/ChartsPage'
import TradingDesk from './components/TradingDesk'
import HelpCenter from './components/HelpCenter'
import ZynthAssistant from './components/ZynthAssistant'
import LoginPage from './components/LoginPage'
import SignupPage from './components/SignupPage'
import LandingPage from './components/LandingPage'
import ForgotPasswordPage from './components/ForgotPasswordPage'
import ResetPasswordPage from './components/ResetPasswordPage'
import OnboardingFlow from './components/OnboardingFlow'
import TermsOfService from './components/TermsOfService'
import { fetchNews } from './services/api'
import { Loader2, Sparkles } from 'lucide-react'

// Lazily loaded — chunk is only downloaded when an admin user navigates to the admin view.
// Non-admin users will never trigger this import.
const AdminDashboard = lazy(() => import('./components/AdminDashboard'))

// The main dashboard shell (only shown when authenticated)
function AppShell() {
  const theme = useTheme();
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState('data'); // Start with data view

  // Wrap setCurrentView so all navigation automatically syncs the browser URL
  const navigate = (view) => {
    setCurrentView(view);
    window.history.pushState({ view }, '', '/' + view);
  };
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
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  const handleToggleCollapse = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('sidebarCollapsed', String(next)); } catch {}
      return next;
    });
  };

  useAutoCloseSidebarOnDesktop(setMobileSidebarOpen);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // On initial load: read view from URL so bookmarks / direct links work
  useEffect(() => {
    const path = window.location.pathname.replace(/^\//, '');
    const validViews = [
      'data', 'journal', 'intelligence', 'markets', 'calendar',
      'news', 'screenshot', 'tools', 'help', 'charts', 'backtesting', 'admin',
    ];
    if (path && validViews.includes(path)) {
      setCurrentView(path);
      window.history.replaceState({ view: path }, '', '/' + path);
    } else {
      window.history.replaceState({ view: 'data' }, '', '/data');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle browser back / forward (touchpad swipe, alt+left, etc.)
  useEffect(() => {
    const handlePopState = (e) => {
      setCurrentView(e.state?.view ?? 'data');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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
    navigate('news');
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
    <div style={{ backgroundColor: theme.bg, color: theme.text, transition: 'background-color 0.25s ease, color 0.15s ease' }}>
      {/* Fixed Sidebar */}
      <Sidebar 
        filters={filters}
        onFilterChange={handleFilterChange}
        onApplyFilters={applyFilters}
        onResetFilters={resetFilters}
        currentView={currentView}
        onViewChange={(view) => {
          if (view === 'admin' && user?.is_admin !== 1) return;
          navigate(view); setMobileSidebarOpen(false);
        }}
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Fixed Header */}
      <Header 
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={() => setAutoRefresh(!autoRefresh)}
        onRefresh={() => currentView === 'news' ? loadNews() : window.location.reload()}
        onToggleSidebar={() => setMobileSidebarOpen(o => !o)}
        mobileSidebarOpen={mobileSidebarOpen}
        sidebarCollapsed={sidebarCollapsed}
        onExpandSidebar={handleToggleCollapse}
        currentView={currentView}
        isMobile={isMobile}
      />

      {/* Content: offset for fixed sidebar + 64px header */}
      <div
        style={{
          marginLeft: isMobile ? 0 : (sidebarCollapsed ? 60 : 236),
          paddingTop: 64,
          transition: 'margin-left 0.3s ease',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div key={currentView} className="flex flex-1 overflow-hidden relative page-enter">
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
            <EconomicDashboard key="data" onViewChange={navigate} />
          ) : currentView === 'calendar' ? (
            <div key="calendar" className="flex-1 overflow-hidden flex flex-col page-enter">
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
          ) : currentView === 'charts' ? (
            <ChartsPage key="charts" onNavigate={navigate} />
          ) : currentView === 'backtesting' ? (
            <ChartsPage key="backtesting" initialTab="backtesting" onNavigate={navigate} />
          ) : currentView === 'tools' ? (
            <TradingDesk key="tools" />
          ) : currentView === 'help' ? (
            <div key="help" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}><HelpCenter /></div>
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
      <ZynthAssistant />
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

function SetupReminderBanner({ onSetup, onDismiss }) {
  const theme = useTheme();
  const [visible, setVisible] = useState(
    () => sessionStorage.getItem('zynth_onboarding_banner_dismissed') !== 'true'
  );
  if (!visible) return null;
  function dismiss() {
    sessionStorage.setItem('zynth_onboarding_banner_dismissed', 'true');
    setVisible(false);
    onDismiss?.();
  }
  return (
    <div
      className="fixed top-0 left-0 right-0 z-[200] flex items-center gap-3 px-4 py-2 text-sm"
      style={{
        backgroundColor: theme.isDark ? 'rgba(16,185,129,0.12)' : 'rgba(5,150,105,0.09)',
        borderBottom: `1px solid ${theme.isDark ? 'rgba(16,185,129,0.28)' : 'rgba(5,150,105,0.22)'}`,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <Sparkles size={14} style={{ color: '#10b981', flexShrink: 0 }} />
      <p className="flex-1 text-xs" style={{ color: theme.text }}>
        Complete your profile setup to personalize your Zynth experience.
      </p>
      <button
        onClick={onSetup}
        className="text-xs font-semibold px-3 py-1 rounded-lg text-white transition-all hover:opacity-90"
        style={{ backgroundColor: theme.accent }}
      >
        Complete Setup →
      </button>
      <button
        onClick={dismiss}
        className="text-xs transition-colors"
        style={{ color: theme.muted }}
        onMouseEnter={e => (e.currentTarget.style.color = theme.text)}
        onMouseLeave={e => (e.currentTarget.style.color = theme.muted)}
      >
        Dismiss
      </button>
    </div>
  );
}

function AuthGate() {
  const { user, loading } = useAuth()
  const [view, setView] = useState(() => {
    const path = window.location.pathname;
    if (path === '/reset-password') return 'resetPassword';
    if (path === '/forgot-password') return 'forgotPassword';
    if (path === '/terms') return 'terms';
    return 'landing';
  })
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showSkipBanner, setShowSkipBanner] = useState(false)

  useEffect(() => {
    if (!user) return;
    const done = localStorage.getItem('zynth_onboarding_done') === 'true' || !!user.onboarding_done;
    if (done) return;
    const skipped = localStorage.getItem('zynth_onboarding_skipped') === 'true';
    const bannerDismissed = sessionStorage.getItem('zynth_onboarding_banner_dismissed') === 'true';
    if (skipped) {
      if (!bannerDismissed) setShowSkipBanner(true);
    } else {
      setShowOnboarding(true);
    }
  }, [user?.id]) // eslint-disable-line

  function handleOnboardingComplete() {
    setShowOnboarding(false);
    setShowSkipBanner(false);
  }

  function handleOnboardingSkip() {
    setShowOnboarding(false);
    const bannerDismissed = sessionStorage.getItem('zynth_onboarding_banner_dismissed') === 'true';
    if (!bannerDismissed) setShowSkipBanner(true);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    )
  }

  if (user) {
    return (
      <>
        <AppShell />
        {showOnboarding && (
          <OnboardingFlow onComplete={handleOnboardingComplete} onSkip={handleOnboardingSkip} />
        )}
        {showSkipBanner && !showOnboarding && (
          <SetupReminderBanner
            onSetup={() => { setShowSkipBanner(false); setShowOnboarding(true); }}
            onDismiss={() => setShowSkipBanner(false)}
          />
        )}
      </>
    );
  }

  if (view === 'signup')
    return <SignupPage onSwitchToLogin={() => setView('login')} onBack={() => setView('landing')} />

  if (view === 'terms')
    return <TermsOfService onBack={() => setView('landing')} />

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
