import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { MotionConfig } from 'framer-motion';
import Nav from './landing/Nav';
import Hero from './landing/Hero';
import { ChapterContext, ChapterPattern } from './landing/Story';
import Day from './landing/Day';
import Stats from './landing/Stats';
import ScrollTop from './landing/ScrollTop';
import { ScrollTrigger, startSmoothScroll, whenFontsReady } from './landing/engine';
import Pricing from './landing/Pricing';
import { Faq, FinalCta, Footer } from './landing/FaqAndFooter';
import { getPublicStats } from '../utils/publicStats';

const SEO_TITLE = 'Zynth: AI Trade Journal & Macro Intelligence for Traders';
const SEO_DESCRIPTION = 'Log your trades, understand your behaviour and see the macro backdrop behind every decision. Zynth is an AI-powered trade journal with live economic intelligence. First 100 users get Elite free.';
const SEO_URL = 'https://zynth.codes';
const SEO_IMAGE = 'https://zynth.codes/og-image.png';

/** Launch-offer state from the public stats endpoint (stays inactive until the server confirms it). */
function usePromo() {
  const [promo, setPromo] = useState({ active: false, spotsLeft: null, limit: null });
  useEffect(() => {
    let cancelled = false;
    getPublicStats()
      .then((d) => {
        if (cancelled || !d) return;
        setPromo({
          active: d.promoActive === true && (d.promoSpotsLeft == null || d.promoSpotsLeft > 0),
          spotsLeft: typeof d.promoSpotsLeft === 'number' ? d.promoSpotsLeft : null,
          limit: typeof d.promoLimit === 'number' ? d.promoLimit : null,
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);
  return promo;
}

export default function LandingPage({ onSignIn, onGetStarted }) {
  const promo = usePromo();

  // Inertial smooth scrolling (disabled automatically for reduced-motion users)
  useEffect(() => startSmoothScroll(), []);

  // Pinned/scrubbed sections measure the page, so re-measure once fonts and images settle.
  useEffect(() => {
    whenFontsReady(() => ScrollTrigger.refresh());
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener('load', onLoad);
    const t = setTimeout(() => ScrollTrigger.refresh(), 1200);
    return () => { window.removeEventListener('load', onLoad); clearTimeout(t); };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <Helmet>
        <title>{SEO_TITLE}</title>
        <meta name="description" content={SEO_DESCRIPTION} />
        <link rel="canonical" href={SEO_URL} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SEO_URL} />
        <meta property="og:title" content={SEO_TITLE} />
        <meta property="og:description" content={SEO_DESCRIPTION} />
        <meta property="og:image" content={SEO_IMAGE} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={SEO_URL} />
        <meta name="twitter:title" content={SEO_TITLE} />
        <meta name="twitter:description" content={SEO_DESCRIPTION} />
        <meta name="twitter:image" content={SEO_IMAGE} />
        <meta name="google-site-verification" content="ar5DP4kEm7pNSlXYxO2CBLT0yc1Arr-whW3ymDjeflY" />
      </Helmet>

      <div className="landing-root relative min-h-screen overflow-x-clip bg-[#fafaf9] text-zinc-900 antialiased selection:bg-[#CA8A04]/30 dark:bg-[#0b0b0f] dark:text-zinc-100">
        <Nav onSignIn={onSignIn} onGetStarted={onGetStarted} />
        <main>
          <Hero onGetStarted={onGetStarted} promo={promo} />
          <ChapterPattern />
          <ChapterContext />
          <Day />
          <Stats />
          <Pricing onGetStarted={onGetStarted} promo={promo} />
          <Faq promo={promo} />
          <FinalCta onGetStarted={onGetStarted} promo={promo} />
        </main>
        <Footer />
        <ScrollTop />
      </div>
    </MotionConfig>
  );
}
