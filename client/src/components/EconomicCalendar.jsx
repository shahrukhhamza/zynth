import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const CURRENCIES = [
  { code: 'USD', flag: '🇺🇸', tv: 'us' },
  { code: 'EUR', flag: '🇪🇺', tv: 'eu' },
  { code: 'GBP', flag: '🇬🇧', tv: 'gb' },
  { code: 'JPY', flag: '🇯🇵', tv: 'jp' },
  { code: 'CAD', flag: '🇨🇦', tv: 'ca' },
  { code: 'AUD', flag: '🇦🇺', tv: 'au' },
  { code: 'CHF', flag: '🇨🇭', tv: 'ch' },
  { code: 'NZD', flag: '🇳🇿', tv: 'nz' },
];

// TradingView importance values: -1=low, 0=medium, 1=high
const IMPACTS = [
  { value: '1',  label: 'High',   color: '#ef4444' },
  { value: '0',  label: 'Medium', color: '#f59e0b' },
  { value: '-1', label: 'Low',    color: '#64748b' },
];

/**
 * Renders the TradingView Economic Calendar embed widget.
 * Re-mounts whenever colorTheme, countryFilter, or importanceFilter changes.
 */
function TradingViewCalendar({ colorTheme, countryFilter, importanceFilter }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any previous widget instance
    containerRef.current.innerHTML = '';

    const inner = document.createElement('div');
    inner.className = 'tradingview-widget-container__widget';
    inner.style.cssText = 'width:100%;height:100%;';
    containerRef.current.appendChild(inner);

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme,
      isTransparent: true,
      width: '100%',
      height: '100%',
      locale: 'en',
      importanceFilter,
      countryFilter,
    });
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [colorTheme, countryFilter, importanceFilter]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container"
      style={{ width: '100%', height: '100%' }}
    />
  );
}

export default function EconomicCalendar() {
  const theme = useTheme();

  const [selectedCurrencies, setSelectedCurrencies] = useState(['USD']);
  const [selectedImpacts,    setSelectedImpacts]    = useState(['1', '0']);

  const D = {
    pageBg:  theme.isDark ? '#000000' : '#f1f3f6',
    cardBg:  theme.isDark ? '#0d0d0d' : '#ffffff',
    cardBg2: theme.isDark ? '#111111' : '#f7f8fa',
    border:  theme.isDark ? '#1e1e1e' : '#e5e8ed',
    text:    theme.isDark ? '#f0f0f0' : '#0d1117',
    textSub: theme.isDark ? '#5a6472' : '#5a6472',
    accent:  '#10b981',
  };

  const countryFilter    = selectedCurrencies
    .map(c => CURRENCIES.find(x => x.code === c)?.tv)
    .filter(Boolean)
    .join(',');

  const importanceFilter = selectedImpacts.join(',');
  const colorTheme       = theme.isDark ? 'dark' : 'light';

  const toggleCurrency = (code) =>
    setSelectedCurrencies(prev =>
      prev.includes(code)
        ? prev.length > 1 ? prev.filter(c => c !== code) : prev
        : [...prev, code]
    );

  const toggleImpact = (val) =>
    setSelectedImpacts(prev =>
      prev.includes(val)
        ? prev.length > 1 ? prev.filter(v => v !== val) : prev
        : [...prev, val]
    );

  const pill = (active, color) => ({
    padding: '5px 13px', borderRadius: 99, fontSize: 12, fontWeight: 700,
    cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
    border: `1px solid ${active ? color : D.border}`,
    background: active ? `${color}18` : D.cardBg,
    color: active ? color : D.textSub,
    transition: 'all 0.15s',
    display: 'flex', alignItems: 'center', gap: 4,
  });

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: D.pageBg, overflow: 'hidden' }}>
      <style>{`
        .cal-scroll::-webkit-scrollbar { display: none; }
        .cal-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ── Filter bar ───────────────────────────────────────────────────── */}
      <div style={{
        background: D.cardBg,
        borderBottom: `1px solid ${D.border}`,
        padding: '16px 20px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: D.text, margin: 0, letterSpacing: '-0.02em' }}>
            Economic Calendar
          </h1>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: D.accent, boxShadow: `0 0 6px ${D.accent}`,
            flexShrink: 0,
          }} />
          <span style={{ fontSize: 11, color: D.textSub }}>Powered by TradingView · Real-time data</span>
        </div>

        {/* Currency filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap' }}>
          <span style={{
            fontSize: 10, fontWeight: 700, color: D.textSub,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            width: 56, flexShrink: 0,
          }}>
            Currency
          </span>
          <div className="cal-scroll" style={{ display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 2 }}>
            {CURRENCIES.map(c => (
              <button key={c.code} onClick={() => toggleCurrency(c.code)}
                style={pill(selectedCurrencies.includes(c.code), D.accent)}>
                <span>{c.flag}</span><span>{c.code}</span>
              </button>
            ))}
            <button onClick={() => setSelectedCurrencies(['USD'])}
              style={{ fontSize: 11, color: D.accent, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, padding: '4px 8px', whiteSpace: 'nowrap', flexShrink: 0 }}>
              USD only
            </button>
            <button onClick={() => setSelectedCurrencies(CURRENCIES.map(c => c.code))}
              style={{ fontSize: 11, color: D.textSub, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', whiteSpace: 'nowrap', flexShrink: 0 }}>
              All
            </button>
          </div>
        </div>

        {/* Impact filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, color: D.textSub,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            width: 56, flexShrink: 0,
          }}>
            Impact
          </span>
          <div style={{ display: 'flex', gap: 5 }}>
            {IMPACTS.map(imp => (
              <button key={imp.value} onClick={() => toggleImpact(imp.value)}
                style={pill(selectedImpacts.includes(imp.value), imp.color)}>
                {imp.label}
              </button>
            ))}
            <button onClick={() => setSelectedImpacts(IMPACTS.map(i => i.value))}
              style={{ fontSize: 11, color: D.textSub, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', marginLeft: 4, whiteSpace: 'nowrap' }}>
              All impacts
            </button>
          </div>
        </div>
      </div>

      {/* ── TradingView Economic Calendar widget ─────────────────────────── */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <TradingViewCalendar
          colorTheme={colorTheme}
          countryFilter={countryFilter}
          importanceFilter={importanceFilter}
        />
      </div>
    </div>
  );
}
