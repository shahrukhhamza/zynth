import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { API_URL } from '../config/api';

const CURRENCIES = [
  { code: 'USD', flag: '🇺🇸' },
  { code: 'EUR', flag: '🇪🇺' },
  { code: 'GBP', flag: '🇬🇧' },
  { code: 'JPY', flag: '🇯🇵' },
  { code: 'CAD', flag: '🇨🇦' },
  { code: 'AUD', flag: '🇦🇺' },
  { code: 'CHF', flag: '🇨🇭' },
  { code: 'NZD', flag: '🇳🇿' },
];

const TIME_FILTERS = [
  { value: 'today',     label: 'Today'     },
  { value: 'tomorrow',  label: 'Tomorrow'  },
  { value: 'this_week', label: 'This Week' },
  { value: 'next_week', label: 'Next Week' },
];

// importance: 1=low, 2=medium, 3=high
const IMPACTS = [
  { value: '3', label: 'High',   color: '#ef4444' },
  { value: '2', label: 'Medium', color: '#f59e0b' },
  { value: '1', label: 'Low',    color: '#64748b' },
];

const IMPACT_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#64748b' };

function fmt(v) {
  if (v == null || v === '' || isNaN(Number(v))) return '—';
  return v;
}

function ImpactDots({ impact }) {
  const color = IMPACT_COLORS[impact?.toLowerCase()] ?? '#64748b';
  const count = impact === 'high' ? 3 : impact === 'medium' ? 2 : 1;
  return (
    <span style={{ display: 'inline-flex', gap: 2, alignItems: 'center' }}>
      {[1, 2, 3].map(i => (
        <span key={i} style={{
          width: 7, height: 7, borderRadius: '50%',
          background: i <= count ? color : 'transparent',
          border: `1.5px solid ${color}`,
          display: 'inline-block',
        }} />
      ))}
    </span>
  );
}

function groupByDate(events) {
  const groups = {};
  events.forEach(e => {
    const d = e.date ?? 'Unknown';
    if (!groups[d]) groups[d] = [];
    groups[d].push(e);
  });
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
}

function formatGroupDate(dateStr) {
  if (!dateStr || dateStr === 'Unknown') return 'Unknown Date';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function EconomicCalendar() {
  const theme = useTheme();

  const [timeFilter,         setTimeFilter]         = useState('today');
  const [selectedCurrencies, setSelectedCurrencies] = useState(['USD']);
  const [selectedImpacts,    setSelectedImpacts]    = useState(['3', '2']);
  const [events,             setEvents]             = useState([]);
  const [loading,            setLoading]            = useState(true);
  const [error,              setError]              = useState(null);

  const D = {
    pageBg:  theme.isDark ? '#000000' : '#f1f3f6',
    cardBg:  theme.isDark ? '#0d0d0d' : '#ffffff',
    cardBg2: theme.isDark ? '#111111' : '#f7f8fa',
    border:  theme.isDark ? '#1e1e1e' : '#e5e8ed',
    border2: theme.isDark ? '#2a2a2a' : '#d0d5de',
    text:    theme.isDark ? '#f0f0f0' : '#0d1117',
    textSub: theme.isDark ? '#5a6472' : '#5a6472',
    accent:  '#10b981',
  };

  // ── Fetch events from backend ────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    setLoading(true);
    setError(null);

    fetch(`${API_URL}/calendar?filter=${timeFilter}`, { headers })
      .then(r => r.ok ? r.json() : Promise.reject('Failed'))
      .then(data => {
        setEvents(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load calendar');
        setLoading(false);
      });
  }, [timeFilter]);

  // ── Client-side currency + impact filter ────────────────────────────────
  const filtered = events.filter(e => {
    const currency = (e.currency ?? '').toUpperCase();
    const impact   = (e.impact ?? '').toLowerCase();
    const currOk = selectedCurrencies.length === 0
      || selectedCurrencies.includes(currency);
    const impOk = selectedImpacts.length === 0
      || selectedImpacts.some(v =>
          v === '3' ? impact === 'high'
          : v === '2' ? impact === 'medium'
          : impact === 'low'
        );
    return currOk && impOk;
  });

  // ── Toggle helpers ───────────────────────────────────────────────────────
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

  const grouped = groupByDate(filtered);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: D.cardBg, overflow: 'hidden' }}>
      <style>{`
        .cal-scroll::-webkit-scrollbar { display: none; }
        .cal-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        .cal-row:hover { background: ${D.cardBg2} !important; }
        @keyframes calSpin { to { transform: rotate(360deg); } }
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
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: D.text, margin: 0, letterSpacing: '-0.02em' }}>
            Economic Calendar
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: D.accent, boxShadow: `0 0 5px ${D.accent}` }} />
            <span style={{ fontSize: 11, color: D.textSub }}>Live data · Powered by Gemini AI</span>
          </div>
        </div>

        {/* Time filter */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {TIME_FILTERS.map(f => (
            <button key={f.value} onClick={() => setTimeFilter(f.value)}
              style={pill(timeFilter === f.value, D.accent)}>
              {f.label}
            </button>
          ))}
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
          <span style={{ fontSize: 10, fontWeight: 700, color: D.textSub, letterSpacing: '0.1em', textTransform: 'uppercase', width: 56, flexShrink: 0 }}>
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

      {/* ── Content area ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 28, height: 28, border: `2px solid ${D.accent}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'calSpin 0.8s linear infinite', margin: '0 auto 10px' }} />
              <p style={{ fontSize: 13, color: D.textSub, margin: 0 }}>Loading calendar…</p>
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#ef4444', fontSize: 13, margin: '0 0 12px' }}>{error}</p>
              <button
                onClick={() => setTimeFilter(t => t)}
                style={{ padding: '8px 18px', background: D.accent, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
            <p style={{ fontSize: 13, color: D.textSub }}>No events match your filters.</p>
          </div>
        )}

        {/* Events grouped by date */}
        {!loading && !error && grouped.map(([date, rows]) => (
          <div key={date}>
            {/* Date heading */}
            <div style={{
              padding: '10px 20px',
              background: D.cardBg2,
              borderBottom: `1px solid ${D.border}`,
              borderTop: `1px solid ${D.border}`,
              fontSize: 11, fontWeight: 700, color: D.textSub,
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              {formatGroupDate(date)}
            </div>

            {/* Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: D.cardBg2, borderBottom: `1px solid ${D.border}` }}>
                  {['Time', 'Ccy', 'Impact', 'Event', 'Actual', 'Forecast', 'Previous'].map(h => (
                    <th key={h} style={{
                      padding: '8px 14px', textAlign: h === 'Event' ? 'left' : 'center',
                      fontSize: 10, fontWeight: 700, color: D.textSub,
                      letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((ev, i) => {
                  const impactColor = IMPACT_COLORS[(ev.impact ?? '').toLowerCase()] ?? D.textSub;
                  const ccy = CURRENCIES.find(c => c.code === (ev.currency ?? '').toUpperCase());
                  const actual   = ev.current  ?? ev.actual;
                  const forecast = ev.forecast;
                  const previous = ev.previous;
                  const beatMiss =
                    actual != null && forecast != null && !isNaN(Number(actual)) && !isNaN(Number(forecast))
                      ? Number(actual) > Number(forecast) ? 'beat' : Number(actual) < Number(forecast) ? 'miss' : 'in-line'
                      : null;
                  const actualColor =
                    beatMiss === 'beat' ? D.accent
                    : beatMiss === 'miss' ? '#ef4444'
                    : D.text;

                  return (
                    <tr key={i} className="cal-row" style={{
                      borderBottom: `1px solid ${D.border}`,
                      background: D.cardBg,
                      transition: 'background 0.12s',
                    }}>
                      {/* Time */}
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontSize: 12, color: D.textSub, whiteSpace: 'nowrap' }}>
                        {ev.time ?? '—'}
                      </td>
                      {/* Currency */}
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontSize: 13, whiteSpace: 'nowrap' }}>
                        <span title={ev.currency}>{ccy?.flag ?? ''}</span>{' '}
                        <span style={{ fontSize: 10, fontWeight: 700, color: D.textSub }}>{ev.currency ?? ''}</span>
                      </td>
                      {/* Impact dots */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <ImpactDots impact={ev.impact} />
                      </td>
                      {/* Event name */}
                      <td style={{ padding: '12px 14px', textAlign: 'left' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: D.text }}>{ev.name}</div>
                        {ev.reportingPeriod && (
                          <div style={{ fontSize: 10, color: D.textSub, marginTop: 2, fontStyle: 'italic' }}>{ev.reportingPeriod}</div>
                        )}
                      </td>
                      {/* Actual */}
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: actualColor, whiteSpace: 'nowrap' }}>
                        {fmt(actual)}{actual != null ? (ev.unit ?? '') : ''}
                      </td>
                      {/* Forecast */}
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontSize: 12, color: D.textSub, whiteSpace: 'nowrap' }}>
                        {fmt(forecast)}{forecast != null ? (ev.unit ?? '') : ''}
                      </td>
                      {/* Previous */}
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontSize: 12, color: D.textSub, whiteSpace: 'nowrap' }}>
                        {fmt(previous)}{previous != null ? (ev.unit ?? '') : ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}

