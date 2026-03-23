import { useState, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';

// ── Investing.com country codes ───────────────────────────────────────────────
// These are Investing.com's internal country IDs
const CURRENCY_MAP = {
  USD: '5',
  EUR: '72',
  GBP: '4',
  JPY: '35',
  CAD: '6',
  AUD: '25',
  CHF: '12',
  NZD: '43',
};

const CURRENCIES = [
  { code: 'USD', flag: '🇺🇸', id: '5'  },
  { code: 'EUR', flag: '🇪🇺', id: '72' },
  { code: 'GBP', flag: '🇬🇧', id: '4'  },
  { code: 'JPY', flag: '🇯🇵', id: '35' },
  { code: 'CAD', flag: '🇨🇦', id: '6'  },
  { code: 'AUD', flag: '🇦🇺', id: '25' },
  { code: 'CHF', flag: '🇨🇭', id: '12' },
  { code: 'NZD', flag: '🇳🇿', id: '43' },
];

// Importance filter IDs (Investing.com internal)
// importance: 1=low, 2=medium, 3=high
const IMPACTS = [
  { value: '3', label: 'High',   color: '#ef4444' },
  { value: '2', label: 'Medium', color: '#f59e0b' },
  { value: '1', label: 'Low',    color: '#64748b' },
];

export default function EconomicCalendar() {
  const theme = useTheme();

  // Defaults: USD only, High + Medium impact
  const [selectedCurrencies, setSelectedCurrencies] = useState(['USD']);
  const [selectedImpacts,    setSelectedImpacts]    = useState(['3', '2']);

  const D = {
    pageBg:  theme.isDark ? '#000000' : '#f1f3f6',
    cardBg:  theme.isDark ? '#0d0d0d' : '#ffffff',
    cardBg2: theme.isDark ? '#111111' : '#f7f8fa',
    border:  theme.isDark ? '#1e1e1e' : '#e5e8ed',
    text:    theme.isDark ? '#f0f0f0' : '#0d1117',
    textSub: theme.isDark ? '#5a6472' : '#5a6472',
    accent:  '#10b981',
  };

  // ── Build iframe URL ──────────────────────────────────────────────────────
  const iframeSrc = useMemo(() => {
    // Get country IDs for selected currencies
    const countryIds = selectedCurrencies
      .map(c => CURRENCIES.find(x => x.code === c)?.id)
      .filter(Boolean)
      .join(',');

    // Get importance IDs
    const importanceIds = selectedImpacts.join(',');

    const params = new URLSearchParams({
      columns:    'exc_flags,exc_currency,exc_importance,exc_actual,exc_forecast,exc_previous',
      features:   'datepicker,timezone',
      countries:  countryIds,
      importance: importanceIds,
      calType:    'day',
      timeZone:   '88', // UTC
      lang:       '1',  // English
    });

    return `https://sslecal2.investing.com?${params.toString()}`;
  }, [selectedCurrencies, selectedImpacts]);

  // ── Toggle helpers ───────────────────────────────────────────────────────
  const toggleCurrency = (code) => {
    setSelectedCurrencies(prev =>
      prev.includes(code)
        ? prev.length > 1 ? prev.filter(c => c !== code) : prev
        : [...prev, code]
    );
  };

  const toggleImpact = (val) => {
    setSelectedImpacts(prev =>
      prev.includes(val)
        ? prev.length > 1 ? prev.filter(v => v !== val) : prev
        : [...prev, val]
    );
  };

  // ── Pill style ───────────────────────────────────────────────────────────
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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: D.cardBg, overflow: 'hidden' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: D.text, margin: 0, letterSpacing: '-0.02em' }}>
              Economic Calendar
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: D.accent, boxShadow: `0 0 5px ${D.accent}` }} />
              <span style={{ fontSize: 11, color: D.textSub }}>Real-time data · Use the date picker below to navigate weeks</span>
            </div>
          </div>
        </div>

        {/* Currency filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: D.textSub, letterSpacing: '0.1em', textTransform: 'uppercase', width: 56, flexShrink: 0 }}>
            Currency
          </span>
          <div className="cal-scroll" style={{ display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 2 }}>
            {CURRENCIES.map(c => (
              <button key={c.code} onClick={() => toggleCurrency(c.code)} style={pill(selectedCurrencies.includes(c.code), D.accent)}>
                <span>{c.flag}</span><span>{c.code}</span>
              </button>
            ))}
            <button
              onClick={() => setSelectedCurrencies(['USD'])}
              style={{ fontSize: 11, color: D.accent, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, padding: '4px 8px', whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              USD only
            </button>
            <button
              onClick={() => setSelectedCurrencies(CURRENCIES.map(c => c.code))}
              style={{ fontSize: 11, color: D.textSub, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              All
            </button>
          </div>
        </div>

        {/* Impact filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: D.textSub, letterSpacing: '0.1em', textTransform: 'uppercase', width: 56, flexShrink: 0 }}>
            Impact
          </span>
          <div style={{ display: 'flex', gap: 5 }}>
            {IMPACTS.map(imp => (
              <button key={imp.value} onClick={() => toggleImpact(imp.value)} style={pill(selectedImpacts.includes(imp.value), imp.color)}>
                {imp.label}
              </button>
            ))}
            <button
              onClick={() => setSelectedImpacts(IMPACTS.map(i => i.value))}
              style={{ fontSize: 11, color: D.textSub, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', marginLeft: 4, whiteSpace: 'nowrap' }}
            >
              All impacts
            </button>
          </div>
        </div>

        {/* Active summary chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: D.textSub }}>Showing:</span>
          {selectedCurrencies.map(code => {
            const c = CURRENCIES.find(x => x.code === code);
            return c ? (
              <span key={code} style={{ fontSize: 11, fontWeight: 600, color: D.accent, background: `${D.accent}10`, border: `1px solid ${D.accent}20`, padding: '2px 8px', borderRadius: 99 }}>
                {c.flag} {c.code}
              </span>
            ) : null;
          })}
          <span style={{ fontSize: 11, color: D.textSub }}>·</span>
          {selectedImpacts.map(v => {
            const imp = IMPACTS.find(i => i.value === v);
            return imp ? (
              <span key={v} style={{ fontSize: 11, fontWeight: 600, color: imp.color, background: `${imp.color}10`, border: `1px solid ${imp.color}20`, padding: '2px 8px', borderRadius: 99 }}>
                {imp.label} impact
              </span>
            ) : null;
          })}
        </div>
      </div>

      {/* ── Investing.com iframe ──────────────────────────────────────────── */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
        <iframe
          key={iframeSrc}
          src={iframeSrc}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block',
            minWidth: '100%',
          }}
          frameBorder="0"
          allowTransparency="true"
          marginWidth="0"
          marginHeight="0"
          title="Economic Calendar"
        />
      </div>
    </div>
  );
}

