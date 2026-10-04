import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { HelmetProvider } from 'react-helmet-async'
import ReactGA from 'react-ga4'
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

import LiveMarketTicker from './components/LiveMarketTicker'
import ZynthAssistant from './components/ZynthAssistant'
import LoginPage from './components/LoginPage'
import SignupPage from './components/SignupPage'
const LandingPage = lazy(() => import('./components/LandingPage'))
import ForgotPasswordPage from './components/ForgotPasswordPage'
import ResetPasswordPage from './components/ResetPasswordPage'
import OnboardingFlow from './components/OnboardingFlow'
import PreSignupOnboarding from './components/PreSignupOnboarding'
import WelcomeScreen from './components/WelcomeScreen'
import { fetchNews } from './services/api'
import { UpgradeProvider, useUpgrade } from './contexts/UpgradeContext'
import { useUpgradeIntelligence } from './hooks/useUpgradeIntelligence'
import UpgradeNudgeBanner from './components/UpgradeNudgeBanner'
import PromoBanner from './components/PromoBanner'
import { Loader2, Sparkles } from 'lucide-react'

// Heavy views are split into their own chunks and downloaded on first visit.
const EconomicIntelligence = lazy(() => import('./components/EconomicIntelligence'))
const TradeJournal = lazy(() => import('./components/TradeJournal'))
const ChartsPage = lazy(() => import('./components/ChartsPage'))
const TradingDesk = lazy(() => import('./components/TradingDesk'))
const HelpCenter = lazy(() => import('./components/HelpCenter'))
const ProfitCalculator = lazy(() => import('./components/ProfitCalculator'))
const RiskPlanner = lazy(() => import('./components/RiskPlanner'))
const PaymentPage = lazy(() => import('./components/PaymentPage'))
const TermsOfService = lazy(() => import('./components/TermsOfService'))
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'))
const RefundPolicy = lazy(() => import('./components/RefundPolicy'))
const PricingPage = lazy(() => import('./components/PricingPage'))
const RefundPage = lazy(() => import('./components/RefundPage'))
const ServicePolicy = lazy(() => import('./components/ServicePolicy'))
const ServicesPage = lazy(() => import('./components/ServicesPage'))

// Lazily loaded — chunk is only downloaded when an admin user navigates to the admin view.
// Non-admin users will never trigger this import.
const AdminDashboard = lazy(() => import('./components/AdminDashboard'))

const VALID_VIEWS = [
  'data', 'journal', 'intelligence', 'markets', 'calendar',
  'news', 'tools', 'help', 'charts', 'backtesting', 'admin', 'payment',
  'calculator/profit', 'calculator/risk',
];

function getInitialView() {
  const path = window.location.pathname.replace(/^\//, '');
  return VALID_VIEWS.includes(path) ? path : 'data';
}

// The main dashboard shell (only shown when authenticated)
function AppShell() {
  const theme = useTheme();
  const { user } = useAuth();
  const { openUpgradeModal } = useUpgrade();
  const intel = useUpgradeIntelligence();
  // Resolve the view from the URL up-front so a deep link (/journal, /charts…) does not briefly
  // mount the dashboard first and fire its (plan-gated) API calls.
  const [currentView, setCurrentView] = useState(getInitialView);

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

  // ── Behavioral upgrade triggers ────────────────────────────────────────────
  // Return-user trigger: user previously hit a limit, came back to a new session
  useEffect(() => {
    if (!intel.shouldAutoOpen) return;
    openUpgradeModal({
      reason:       intel.autoOpenReason,
      requiredPlan: intel.suggestedPlan,
      headline:     intel.personalizedHeadline,
      message:      intel.personalizedMessage,
    });
    intel.clearAutoOpen();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intel.shouldAutoOpen]);

  // AI-2 trigger: user runs 2 AI analyses in a single session (soft prompt)
  useEffect(() => {
    if (!intel.shouldAiSessionTrigger) return;
    openUpgradeModal({
      reason:       'You\'ve used 2 AI analyses this session.',
      requiredPlan: intel.suggestedPlan,
      headline:     'Making the most of AI?',
      message:      'You\'re actively using AI insights. Upgrade to unlock unlimited analyses and never hit a wall.',
    });
    intel.clearAiSessionTrigger();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intel.shouldAiSessionTrigger]);

  // Trade-3 trigger: user logs 3 trades in a single session (soft prompt)
  useEffect(() => {
    if (!intel.shouldTradeSessionTrigger) return;
    openUpgradeModal({
      reason:       'You\'ve logged 3 trades this session.',
      requiredPlan: 'pro',
      headline:     'Building a strong record?',
      message:      'You\'re building a strong trading record. Upgrade to go unlimited and never lose a trade to a paywall.',
    });
    intel.clearTradeSessionTrigger();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intel.shouldTradeSessionTrigger]);

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
    if (path && VALID_VIEWS.includes(path)) {
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

  // Listen for navigation events dispatched from modals (e.g. UpgradeModal → PaymentPage)
  useEffect(() => {
    const handler = (e) => { if (e.detail?.view) navigate(e.detail.view); };
    window.addEventListener('zynth:navigate', handler);
    return () => window.removeEventListener('zynth:navigate', handler);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Track GA4 page view on every view change
  useEffect(() => {
    ReactGA.send({ hitType: 'pageview', page: '/' + currentView, title: currentView });
  }, [currentView]);

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
        <PromoBanner />
        <div key={currentView} className="flex flex-1 overflow-hidden relative page-enter">
          <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" style={{ color: theme.accent }} /></div>}>
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
          ) : currentView === 'markets' ? (
            <LiveMarketTicker key="markets" />
          ) : currentView === 'charts' ? (
            <ChartsPage key="charts" onNavigate={navigate} />
          ) : currentView === 'backtesting' ? (
            <ChartsPage key="backtesting" initialTab="backtesting" onNavigate={navigate} />
          ) : currentView === 'payment' ? (
            <PaymentPage key="payment" onBack={() => navigate('data')} />
          ) : currentView === 'tools' ? (
            <TradingDesk key="tools" />
          ) : currentView === 'help' ? (
            <div key="help" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}><HelpCenter /></div>
          ) : currentView === 'calculator/profit' ? (
            <ProfitCalculator key="calc-profit" />
          ) : currentView === 'calculator/risk' ? (
            <RiskPlanner key="calc-risk" />
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
          </Suspense>
        </div>
      </div>
      <ZynthAssistant />
      <UpgradeNudgeBanner urgencyLevel={intel.urgencyLevel} />
    </div>
  )
}

export default function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <UpgradeProvider>
          <Suspense fallback={null}>
            <AuthGate />
          </Suspense>
        </UpgradeProvider>
      </AuthProvider>
    </HelmetProvider>
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
        backgroundColor: theme.isDark ? 'rgba(202,138,4,0.12)' : 'rgba(29,78,216,0.06)',
        borderBottom: `1px solid ${theme.isDark ? 'rgba(202,138,4,0.28)' : 'rgba(29,78,216,0.15)'}`,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <Sparkles size={14} style={{ color: '#CA8A04', flexShrink: 0 }} />
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
  const theme = useTheme();
  const [view, setView] = useState(() => {
    const path = window.location.pathname;
    if (path === '/reset-password') return 'resetPassword';
    if (path === '/forgot-password') return 'forgotPassword';
    if (path === '/terms') return 'terms';
    if (path === '/privacy') return 'privacy';
    if (path === '/refund-policy') return 'refundPolicy';
    if (path === '/refund') return 'refundSimple';
    if (path === '/pricing') return 'pricing';
    if (path === '/service-policy') return 'servicePolicy';
    if (path === '/services') return 'services';
    return 'landing';
  })
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showSkipBanner, setShowSkipBanner] = useState(false)
  const [showPreSignupOnboarding, setShowPreSignupOnboarding] = useState(false)
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(false)

  // Post-onboarding state (existing)
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

  // Detect new signup → show WelcomeScreen once
  useEffect(() => {
    if (!user) return;
    const isNew = sessionStorage.getItem('zynth_new_user') === 'true';
    if (isNew) {
      sessionStorage.removeItem('zynth_new_user');
      setShowWelcomeScreen(true);
    }
  }, [user?.id]) // eslint-disable-line

  // Track GA4 page view for pre-auth pages (landing, login, signup, etc.)
  useEffect(() => {
    ReactGA.send({ hitType: 'pageview', page: '/' + view, title: view });
  }, [view]);

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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bg }}>
        <div style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}`, padding: 24, borderRadius: 12, boxShadow: theme.isDark ? '0 6px 20px rgba(0,0,0,0.6)' : '0 6px 20px rgba(16,24,40,0.04)', display: 'flex', alignItems: 'center', gap: 14, minWidth: 260, justifyContent: 'center' }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: theme.accent }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: theme.text }}>Zynth</div>
            <div style={{ fontSize: 12, color: theme.muted }}>Loading…</div>
          </div>
        </div>
      </div>
    )
  }

  if (user) {
    return (
      <>
        {showWelcomeScreen ? (
          <WelcomeScreen
            userName={user.name}
            onAddFirstTrade={() => setShowWelcomeScreen(false)}
            onSkip={() => setShowWelcomeScreen(false)}
          />
        ) : (
          <AppShell />
        )}
        {showOnboarding && !showWelcomeScreen && (
          <OnboardingFlow onComplete={handleOnboardingComplete} onSkip={handleOnboardingSkip} />
        )}
        {showSkipBanner && !showOnboarding && !showWelcomeScreen && (
          <SetupReminderBanner
            onSetup={() => { setShowSkipBanner(false); setShowOnboarding(true); }}
            onDismiss={() => setShowSkipBanner(false)}
          />
        )}
      </>
    );
  }

  if (view === 'signup')
    return <SignupPage
      onSwitchToLogin={() => setView('login')}
      onBack={() => setView('landing')}
      onSignupSuccess={() => sessionStorage.setItem('zynth_new_user', 'true')}
    />

  if (view === 'terms')
    return <TermsOfService onBack={() => setView('landing')} />

  if (view === 'privacy')
    return <PrivacyPolicy onBack={() => setView('landing')} />

  if (view === 'refundPolicy')
    return <RefundPolicy onBack={() => setView('landing')} />

  if (view === 'refundSimple')
    return <RefundPage onBack={() => setView('landing')} />

  if (view === 'pricing')
    return <PricingPage onBack={() => setView('landing')} />

  if (view === 'servicePolicy')
    return <ServicePolicy onBack={() => setView('landing')} />

  if (view === 'services')
    return <ServicesPage onBack={() => setView('landing')} />

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
    <>
      <LandingPage
        onSignIn={() => setView('login')}
        onGetStarted={(pricingSelection) => {
          if (pricingSelection) {
            sessionStorage.setItem('zynthPricingSelection', JSON.stringify(pricingSelection));
          }
          setShowPreSignupOnboarding(true);
        }}
      />
      {showPreSignupOnboarding && (
        <PreSignupOnboarding
          onContinueToSignup={() => { setShowPreSignupOnboarding(false); setView('signup'); }}
          onClose={() => setShowPreSignupOnboarding(false)}
        />
      )}
    </>
  )
}
