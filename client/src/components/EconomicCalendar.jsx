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

const TIME_FILTERS = [
  { value: 'today',     label: 'Today'     },
  { value: 'tomorrow',  label: 'Tomorrow'  },
  { value: 'this_week', label: 'This Week' },
  { value: 'next_week', label: 'Next Week' },
];

function getDateRange(filter) {
  const fmt = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const today = new Date();
  today.setHours(0,0,0,0);

  if (filter === 'today') {
    return fmt(today);
  }
  if (filter === 'tomorrow') {
    const t = new Date(today); t.setDate(t.getDate() + 1);
    return fmt(t);
  }
  // Monday of current week
  const mon = new Date(today);
  mon.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  if (filter === 'this_week') {
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    return `${fmt(mon)} – ${fmt(sun)}`;
  }
  // next_week
  const nxtMon = new Date(mon); nxtMon.setDate(mon.getDate() + 7);
  const nxtSun = new Date(nxtMon); nxtSun.setDate(nxtMon.getDate() + 6);
  return `${fmt(nxtMon)} – ${fmt(nxtSun)}`;
}

/**
 * Renders the TradingView Economic Calendar embed widget.
 * Re-mounts whenever colorTheme, countryFilter, or importanceFilter changes.
 */
function TradingViewCalendar({ colorTheme, countryFilter, importanceFilter, widgetKey }) {
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
  }, [colorTheme, countryFilter, importanceFilter, widgetKey]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container"
      style={{ width: '100%', height: '100%' }}
    />
  );
}

// Impact bar indicator (3 bars, filled by level)
function ImpactIcon({ level }) {
  const colors = { '1': '#ef4444', '0': '#f59e0b', '-1': '#64748b' };
  const filled = level === '1' ? 3 : level === '0' ? 2 : 1;
  const color  = colors[level] ?? '#64748b';
  return (
    <span style={{ display: 'inline-flex', gap: 1.5, alignItems: 'flex-end', marginRight: 4 }}>
      {[1,2,3].map(i => (
        <span key={i} style={{
          width: 3, height: 4 + i * 3, borderRadius: 1,
          background: i <= filled ? color : 'rgba(100,116,139,0.25)',
          display: 'inline-block',
        }} />
      ))}
    </span>
  );
}

export default function EconomicCalendar() {
  const theme = useTheme();

  const [selectedCurrencies, setSelectedCurrencies] = useState(['USD']);
  const [selectedImpacts,    setSelectedImpacts]    = useState(['1', '0']);
  const [timeFilter,         setTimeFilter]         = useState('today');

  const D = {
    pageBg:  theme.isDark ? theme.bg       : '#f1f3f6',
    cardBg:  theme.isDark ? theme.surface   : '#ffffff',
    cardBg2: theme.isDark ? theme.surface2  : '#f7f8fa',
    border:  theme.isDark ? theme.border    : '#e5e8ed',
    border2: theme.isDark ? 'rgba(255,255,255,0.10)' : '#d0d5de',
    text:    theme.isDark ? theme.text      : '#0d1117',
    textSub: theme.isDark ? '#8892a4'       : '#5a6472',
    accent:  '#3b82f6',
    accentDim: theme.isDark ? '#3b82f615' : '#3b82f612',
  };

  const now = new Date();
  const dateStr  = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const timeStr  = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
  const rangeStr = getDateRange(timeFilter);
  const activeTimeLabel = TIME_FILTERS.find(f => f.value === timeFilter)?.label ?? '';

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
    padding: '5px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600,
    cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
    border: `1px solid ${active ? color : D.border}`,
    background: active ? `${color}20` : 'transparent',
    color: active ? color : D.textSub,
    transition: 'all 0.15s',
    display: 'flex', alignItems: 'center', gap: 5,
    letterSpacing: '0.01em',
  });

  const ghostBtn = (color = D.textSub) => ({
    fontSize: 11, fontWeight: 600, color,
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '4px 10px', whiteSpace: 'nowrap', borderRadius: 6,
    transition: 'color 0.15s',
    letterSpacing: '0.02em',
  });

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: D.pageBg, overflow: 'hidden' }}>
      <style>{`
        .cal-scroll::-webkit-scrollbar { display: none; }
        .cal-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        .cal-pill-btn:hover { opacity: 0.85; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      {/* ══ Header card ═══════════════════════════════════════════════════ */}
      <div style={{
        background: D.cardBg,
        borderBottom: `1px solid ${D.border}`,
        flexShrink: 0,
      }}>
        {/* Top accent line */}
        <div style={{ height: 2, background: `linear-gradient(90deg, ${D.accent}, transparent)` }} />

        {/* Title row */}
        <div style={{
          padding: '14px 24px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: `1px solid ${D.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{ fontSize: 17, fontWeight: 700, color: D.text, margin: 0, letterSpacing: '-0.02em' }}>
                  Economic Calendar
                </h1>
                {/* Live pulse dot */}
                <div style={{ position: 'relative', width: 8, height: 8 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: D.accent, boxShadow: `0 0 0 0 ${D.accent}`,
                    animation: 'pulse 2s infinite',
                    position: 'absolute',
                  }} />
                </div>
              </div>
              <div style={{ fontSize: 11, color: D.textSub, marginTop: 2 }}>{dateStr}</div>
            </div>
          </div>

          {/* Right: TradingView badge + time */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 11, color: D.textSub }}>{timeStr}</span>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: D.accentDim, border: `1px solid ${D.accent}30`,
              padding: '4px 10px', borderRadius: 8,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: D.accent }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: D.accent, letterSpacing: '0.02em' }}>
                Live · TradingView
              </span>
            </div>
          </div>
        </div>

        {/* Time filter tab row */}
        <div style={{
          padding: '0 24px',
          borderBottom: `1px solid ${D.border}`,
          display: 'flex', alignItems: 'stretch', gap: 0,
        }}>
          {TIME_FILTERS.map(f => {
            const active = timeFilter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setTimeFilter(f.value)}
                style={{
                  padding: '11px 18px',
                  fontSize: 12, fontWeight: active ? 700 : 500,
                  color: active ? D.accent : D.textSub,
                  background: 'none', border: 'none', cursor: 'pointer',
                  borderBottom: `2px solid ${active ? D.accent : 'transparent'}`,
                  marginBottom: -1,
                  transition: 'all 0.15s',
                  letterSpacing: '0.01em',
                  whiteSpace: 'nowrap',
                }}
              >
                {f.label}
              </button>
            );
          })}
          {/* Date range label */}
          <div style={{
            marginLeft: 'auto',
            display: 'flex', alignItems: 'center',
            fontSize: 11, color: D.textSub, paddingRight: 4,
            gap: 6,
          }}>
            <span style={{
              color: D.accent, fontWeight: 600,
              background: D.accentDim, border: `1px solid ${D.accent}25`,
              padding: '2px 8px', borderRadius: 6, fontSize: 10,
            }}>{activeTimeLabel}</span>
            <span>{rangeStr}</span>
          </div>
        </div>

        {/* Filters row */}
        <div style={{
          padding: '10px 24px',
          display: 'flex', alignItems: 'center', gap: 0,
          flexWrap: 'nowrap', overflowX: 'auto',
        }} className="cal-scroll">

          {/* Currency section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 16, flexShrink: 0 }}>
            <span style={{
              fontSize: 9, fontWeight: 700, color: D.textSub,
              letterSpacing: '0.12em', textTransform: 'uppercase', flexShrink: 0,
            }}>CCY</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {CURRENCIES.map(c => (
                <button key={c.code} onClick={() => toggleCurrency(c.code)}
                  className="cal-pill-btn"
                  style={pill(selectedCurrencies.includes(c.code), D.accent)}>
                  <span style={{ fontSize: 13 }}>{c.flag}</span>
                  <span style={{ fontSize: 11 }}>{c.code}</span>
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 0, marginLeft: 4 }}>
              <button onClick={() => setSelectedCurrencies(['USD'])} style={ghostBtn(D.accent)}>USD only</button>
              <button onClick={() => setSelectedCurrencies(CURRENCIES.map(c => c.code))} style={ghostBtn(D.textSub)}>All</button>
            </div>
          </div>

          {/* Vertical divider */}
          <div style={{ width: 1, height: 28, background: D.border, flexShrink: 0, marginRight: 16 }} />

          {/* Impact section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{
              fontSize: 9, fontWeight: 700, color: D.textSub,
              letterSpacing: '0.12em', textTransform: 'uppercase', flexShrink: 0,
            }}>IMPACT</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {IMPACTS.map(imp => (
                <button key={imp.value} onClick={() => toggleImpact(imp.value)}
                  className="cal-pill-btn"
                  style={pill(selectedImpacts.includes(imp.value), imp.color)}>
                  <ImpactIcon level={imp.value} />
                  {imp.label}
                </button>
              ))}
              <button onClick={() => setSelectedImpacts(IMPACTS.map(i => i.value))} style={ghostBtn(D.textSub)}>All</button>
            </div>
          </div>

          {/* Vertical divider */}
          <div style={{ width: 1, height: 28, background: D.border, flexShrink: 0, margin: '0 16px' }} />

          {/* Active summary chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            {selectedCurrencies.map(code => {
              const c = CURRENCIES.find(x => x.code === code);
              return c ? (
                <span key={code} style={{
                  fontSize: 11, fontWeight: 600, color: D.accent,
                  background: D.accentDim, border: `1px solid ${D.accent}25`,
                  padding: '3px 9px', borderRadius: 99, whiteSpace: 'nowrap',
                }}>
                  {c.flag} {c.code}
                </span>
              ) : null;
            })}
            {selectedImpacts.map(v => {
              const imp = IMPACTS.find(i => i.value === v);
              return imp ? (
                <span key={v} style={{
                  fontSize: 11, fontWeight: 600, color: imp.color,
                  background: `${imp.color}12`, border: `1px solid ${imp.color}25`,
                  padding: '3px 9px', borderRadius: 99, whiteSpace: 'nowrap',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <ImpactIcon level={v} />{imp.label}
                </span>
              ) : null;
            })}
          </div>
        </div>
      </div>

      {/* ══ TradingView widget ════════════════════════════════════════════ */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <TradingViewCalendar
          colorTheme={colorTheme}
          countryFilter={countryFilter}
          importanceFilter={importanceFilter}
          widgetKey={timeFilter}
        />
      </div>
    </div>
  );
}
