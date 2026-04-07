import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, BarChart3, Shield, Activity, Search, ChevronDown } from 'lucide-react';

const FOREX_PAIRS = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CHF',
  'NZD/USD', 'USD/CAD', 'EUR/JPY', 'GBP/JPY', 'EUR/GBP',
  'AUD/JPY', 'CHF/JPY', 'EUR/AUD', 'GBP/AUD', 'EUR/CAD',
];

const COMMODITIES = [
  { value: 'XAU/USD', label: 'XAU/USD (Gold)' },
  { value: 'XAG/USD', label: 'XAG/USD (Silver)' },
  { value: 'USOIL',   label: 'USOIL (WTI Crude)' },
  { value: 'UKOIL',   label: 'UKOIL (Brent Crude)' },
  { value: 'XNGUSD',  label: 'XNGUSD (Natural Gas)' },
  { value: 'XCUUSD',  label: 'XCUUSD (Copper)' },
];

const ALL_INSTRUMENTS = [
  ...FOREX_PAIRS.map((p) => ({ value: p, label: p, group: 'Forex' })),
  ...COMMODITIES.map((c) => ({ ...c, group: 'Commodities' })),
];

function getRiskBadge(riskPercent) {
  const abs = Math.abs(riskPercent);
  if (abs > 5) return { label: 'High Risk', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: '🔴' };
  if (abs > 2) return { label: 'Medium Risk', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: '🟡' };
  return { label: 'Low Risk', color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: '🟢' };
}

export default function ProfitCalculator() {
  const theme = useTheme();
  const [form, setForm] = useState({
    pair: 'EUR/USD', lotSize: '1', entryPrice: '', exitPrice: '', type: 'buy', balance: '',
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Searchable instrument dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (dropdownOpen && searchInputRef.current) searchInputRef.current.focus();
  }, [dropdownOpen]);

  const filteredInstruments = search.trim()
    ? ALL_INSTRUMENTS.filter((i) =>
        i.label.toLowerCase().includes(search.toLowerCase()) ||
        i.value.toLowerCase().includes(search.toLowerCase())
      )
    : ALL_INSTRUMENTS;

  const selectedLabel = ALL_INSTRUMENTS.find((i) => i.value === form.pair)?.label || form.pair;

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  // ── Client-side calculation (no server call needed — pure math) ──────────────
  const COMMODITY_CONFIG = {
    'XAUUSD':  { contractSize: 100,   pipSize: 0.01 },
    'XAGUSD':  { contractSize: 5000,  pipSize: 0.001 },
    'USOIL':   { contractSize: 1000,  pipSize: 0.01 },
    'UKOIL':   { contractSize: 1000,  pipSize: 0.01 },
    'XNGUSD':  { contractSize: 10000, pipSize: 0.001 },
    'XCUUSD':  { contractSize: 25000, pipSize: 0.0001 },
  };

  const normalizePair = (p) => p.toUpperCase().replace(/[/\s]/g, '');

  const calculate = () => {
    setError('');
    const entry = parseFloat(form.entryPrice);
    const exit  = parseFloat(form.exitPrice);
    const lots  = parseFloat(form.lotSize);
    const bal   = form.balance ? parseFloat(form.balance) : null;

    if (!form.entryPrice || !form.exitPrice) { setError('Entry and exit prices are required'); return; }
    if (isNaN(entry) || entry <= 0)  { setError('Entry price must be a positive number'); return; }
    if (isNaN(exit)  || exit  <= 0)  { setError('Exit price must be a positive number'); return; }
    if (isNaN(lots)  || lots  <= 0)  { setError('Lot size must be a positive number'); return; }

    const key = normalizePair(form.pair);
    const commodity = COMMODITY_CONFIG[key] || null;

    let pipSize, pipValue;
    if (commodity) {
      pipSize  = commodity.pipSize;
      pipValue = Math.round(commodity.pipSize * commodity.contractSize * lots * 100) / 100;
    } else {
      pipSize  = key.includes('JPY') ? 0.01 : 0.0001;
      pipValue = Math.round((pipSize / entry) * lots * 100000 * 100) / 100;
    }

    const rawMovement  = form.type === 'buy' ? (exit - entry) / pipSize : (entry - exit) / pipSize;
    const pipMovement  = Math.round(rawMovement * 10) / 10;
    const profitLossUSD = Math.round(pipMovement * pipValue * 100) / 100;
    const riskPercent  = bal && bal > 0
      ? Math.round((Math.abs(profitLossUSD) / bal) * 10000) / 100
      : null;

    setResult({ pair: form.pair, type: form.type, pipMovement, pipValue, profitLossUSD, riskPercent });
  };

  const isDark = theme.isDark;
  const bg = isDark ? '#0b0b0f' : '#fafaf9';
  const card = isDark ? 'rgba(255,255,255,0.035)' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
  const inputBg = isDark ? 'rgba(255,255,255,0.06)' : '#f8fafc';
  const shadow = isDark
    ? '0 1px 3px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.25)'
    : '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)';

  const plColor = result
    ? result.profitLossUSD >= 0 ? '#10b981' : '#ef4444'
    : theme.muted;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8" style={{ background: bg }}>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #CA8A04, #CA8A04)', boxShadow: '0 4px 14px rgba(202,138,4,0.35)' }}>
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: theme.text }}>Profit Calculator</h1>
            <p className="text-xs mt-0.5" style={{ color: theme.muted }}>Calculate P/L, pip movement & risk for any forex or commodity trade</p>
          </div>
        </div>

        {/* Main Grid — Left inputs · Right results */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ─── LEFT: Inputs (3-col) ─── */}
          <div className="lg:col-span-3 rounded-2xl border p-6"
            style={{ background: card, borderColor: cardBorder, boxShadow: shadow }}>

            <p className="text-[11px] font-bold uppercase tracking-widest mb-5"
              style={{ color: theme.muted }}>Trade Parameters</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">

              {/* Pair / Instrument */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5"
                  style={{ color: theme.muted }}>Instrument</label>
                <div ref={dropdownRef} className="relative">
                  {/* Trigger button */}
                  <button type="button"
                    onClick={() => { setDropdownOpen((o) => !o); setSearch(''); }}
                    className="w-full h-11 px-3 rounded-xl border text-sm outline-none transition-all flex items-center justify-between"
                    style={{ background: inputBg, borderColor: dropdownOpen ? '#CA8A04' : cardBorder, color: theme.text, boxShadow: dropdownOpen ? '0 0 0 3px rgba(202,138,4,0.15)' : 'none' }}>
                    <span className="truncate font-medium">{selectedLabel}</span>
                    <ChevronDown className="w-3.5 h-3.5 shrink-0 ml-2 transition-transform duration-200" style={{ color: theme.muted, transform: dropdownOpen ? 'rotate(180deg)' : 'none' }} />
                  </button>

                  {/* Dropdown panel */}
                  {dropdownOpen && (
                    <div className="absolute z-50 mt-1.5 w-full rounded-xl border overflow-hidden"
                      style={{
                        background: isDark ? '#131c2e' : '#ffffff',
                        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                        boxShadow: isDark
                          ? '0 4px 6px rgba(0,0,0,0.3), 0 12px 28px rgba(0,0,0,0.4)'
                          : '0 4px 6px rgba(0,0,0,0.04), 0 12px 28px rgba(0,0,0,0.08)',
                      }}>
                      {/* Search input */}
                      <div className="flex items-center gap-2.5 px-3 h-10 border-b"
                        style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}>
                        <Search className="w-3.5 h-3.5 shrink-0 opacity-40" style={{ color: theme.muted }} />
                        <input ref={searchInputRef}
                          type="text"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Search…"
                          className="w-full bg-transparent text-[13px] outline-none placeholder:opacity-40"
                          style={{ color: theme.text }}
                        />
                      </div>

                      {/* Options list */}
                      <div className="max-h-52 overflow-y-auto py-1" style={{ scrollbarWidth: 'thin', scrollbarColor: isDark ? '#334155 transparent' : '#cbd5e1 transparent' }}>
                        {filteredInstruments.length === 0 ? (
                          <div className="px-3 py-5 text-center text-xs" style={{ color: theme.muted }}>No instruments found</div>
                        ) : (
                          (() => {
                            let lastGroup = '';
                            return filteredInstruments.map((item) => {
                              const showHeader = item.group !== lastGroup;
                              lastGroup = item.group;
                              const isSelected = form.pair === item.value;
                              return (
                                <div key={item.value}>
                                  {showHeader && (
                                    <div className="px-3 pt-2.5 pb-1 text-[9px] font-bold uppercase tracking-[0.12em]"
                                      style={{ color: isDark ? 'rgba(148,163,184,0.6)' : 'rgba(100,116,139,0.7)' }}>{item.group}</div>
                                  )}
                                  <button type="button"
                                    onClick={() => {
                                      setForm((p) => ({ ...p, pair: item.value }));
                                      setDropdownOpen(false);
                                      setSearch('');
                                    }}
                                    className="w-full text-left px-3 py-[7px] text-[13px] transition-all duration-100 rounded-md mx-0"
                                    style={{
                                      color: isSelected ? '#CA8A04' : (isDark ? '#cbd5e1' : '#334155'),
                                      background: isSelected
                                        ? (isDark ? 'rgba(202,138,4,0.1)' : 'rgba(202,138,4,0.05)')
                                        : 'transparent',
                                      fontWeight: isSelected ? 500 : 400,
                                      letterSpacing: '0.01em',
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!isSelected) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)';
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                                    }}>
                                    {item.label}
                                  </button>
                                </div>
                              );
                            });
                          })()
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Lot Size */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5"
                  style={{ color: theme.muted }}>Lot Size</label>
                <input type="number" step="0.01" min="0.01" value={form.lotSize} onChange={set('lotSize')}
                  className="w-full h-11 px-3 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-yellow-500/30"
                  placeholder="1.00"
                  style={{ background: inputBg, borderColor: cardBorder, color: theme.text }} />
              </div>

              {/* Entry */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5"
                  style={{ color: theme.muted }}>Entry Price</label>
                <input type="number" step="any" value={form.entryPrice} onChange={set('entryPrice')}
                  className="w-full h-11 px-3 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-yellow-500/30"
                  placeholder="1.08500"
                  style={{ background: inputBg, borderColor: cardBorder, color: theme.text }} />
              </div>

              {/* Exit */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5"
                  style={{ color: theme.muted }}>Exit Price</label>
                <input type="number" step="any" value={form.exitPrice} onChange={set('exitPrice')}
                  className="w-full h-11 px-3 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-yellow-500/30"
                  placeholder="1.09000"
                  style={{ background: inputBg, borderColor: cardBorder, color: theme.text }} />
              </div>

              {/* Direction Toggle */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5"
                  style={{ color: theme.muted }}>Direction</label>
                <div className="flex gap-2">
                  {[
                    { key: 'buy', label: 'Buy / Long', Icon: ArrowUpRight, active: '#10b981' },
                    { key: 'sell', label: 'Sell / Short', Icon: ArrowDownRight, active: '#ef4444' },
                  ].map(({ key, label, Icon, active }) => (
                    <button key={key}
                      onClick={() => setForm((p) => ({ ...p, type: key }))}
                      className="flex-1 h-11 rounded-xl text-xs font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-1.5"
                      style={{
                        background: form.type === key ? active : inputBg,
                        color: form.type === key ? '#fff' : theme.muted,
                        border: `1.5px solid ${form.type === key ? active : cardBorder}`,
                        boxShadow: form.type === key ? `0 2px 10px ${active}44` : 'none',
                      }}>
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Balance */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5"
                  style={{ color: theme.muted }}>Account Balance <span className="opacity-40">(optional)</span></label>
                <input type="number" step="any" value={form.balance} onChange={set('balance')}
                  className="w-full h-11 px-3 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-yellow-500/30"
                  placeholder="10,000"
                  style={{ background: inputBg, borderColor: cardBorder, color: theme.text }} />
              </div>
            </div>

            {error && (
              <div className="mt-4 px-3 py-2 rounded-lg text-xs font-medium"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                {error}
              </div>
            )}

            <button onClick={calculate}
              className="w-full h-12 mt-6 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #CA8A04, #CA8A04)',
                boxShadow: '0 4px 14px rgba(202,138,4,0.3)',
              }}>
              <DollarSign className="w-4 h-4" /> Calculate Profit / Loss
            </button>
          </div>

          {/* ─── RIGHT: Results (2-col) ─── */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* P/L Hero Card */}
            <div className="rounded-2xl border p-6 text-center"
              style={{
                background: result
                  ? `linear-gradient(160deg, ${result.profitLossUSD >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)'}, ${card})`
                  : card,
                borderColor: cardBorder,
                boxShadow: shadow,
              }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2"
                style={{ color: theme.muted }}>Profit / Loss</p>
              <p className="text-4xl font-extrabold tracking-tight" style={{ color: plColor }}>
                {result
                  ? `${result.profitLossUSD >= 0 ? '+' : ''}$${result.profitLossUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : '$0.00'
                }
              </p>
              {result && (
                <div className="flex items-center justify-center gap-1 mt-2">
                  {result.profitLossUSD >= 0
                    ? <ArrowUpRight className="w-4 h-4" style={{ color: '#10b981' }} />
                    : <ArrowDownRight className="w-4 h-4" style={{ color: '#ef4444' }} />
                  }
                  <span className="text-xs font-medium" style={{ color: plColor }}>
                    {result.profitLossUSD >= 0 ? 'Winning trade' : 'Losing trade'}
                  </span>
                </div>
              )}
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              <MetricCard
                icon={<Activity className="w-4 h-4" />}
                label="Pip Movement"
                value={result ? `${result.pipMovement}` : '—'}
                sub="pips"
                theme={theme}
                card={card} border={cardBorder} shadow={shadow}
              />
              <MetricCard
                icon={<DollarSign className="w-4 h-4" />}
                label="Pip Value"
                value={result ? `$${result.pipValue}` : '—'}
                sub="per pip"
                theme={theme}
                card={card} border={cardBorder} shadow={shadow}
              />
            </div>

            {/* Risk Section */}
            <div className="rounded-2xl border p-5"
              style={{ background: card, borderColor: cardBorder, boxShadow: shadow }}>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4" style={{ color: theme.muted }} />
                <p className="text-[11px] font-bold uppercase tracking-widest"
                  style={{ color: theme.muted }}>Risk Analysis</p>
              </div>

              {result?.riskPercent != null ? (() => {
                const badge = getRiskBadge(result.riskPercent);
                const pct = Math.min(Math.abs(result.riskPercent), 10);
                return (
                  <>
                    {/* Risk % number + badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl font-extrabold" style={{ color: badge.color }}>
                        {Math.abs(result.riskPercent).toFixed(2)}%
                      </span>
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide"
                        style={{ background: badge.bg, color: badge.color }}>
                        {badge.icon} {badge.label}
                      </span>
                    </div>

                    {/* Bar */}
                    <div className="w-full h-2 rounded-full overflow-hidden"
                      style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0' }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${(pct / 10) * 100}%`,
                          background: `linear-gradient(90deg, ${badge.color}, ${badge.color}aa)`,
                        }} />
                    </div>
                    <p className="text-[10px] mt-2" style={{ color: theme.muted }}>
                      of account balance at risk on this trade
                    </p>
                  </>
                );
              })() : (
                <div className="text-center py-4">
                  <p className="text-xs" style={{ color: theme.muted }}>
                    Enter your account balance to see risk analysis
                  </p>
                </div>
              )}
            </div>

            {/* Summary Bar (bottom) */}
            {result && (
              <div className="rounded-2xl border px-5 py-3 flex items-center justify-between"
                style={{ background: card, borderColor: cardBorder, boxShadow: shadow }}>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-3.5 h-3.5" style={{ color: theme.muted }} />
                  <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: theme.muted }}>
                    {form.pair}
                  </span>
                </div>
                <span className="text-[11px] font-medium" style={{ color: theme.muted }}>
                  {form.lotSize} lot · {form.type === 'buy' ? 'Long' : 'Short'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Small metric card ── */
function MetricCard({ icon, label, value, sub, theme, card, border, shadow }) {
  return (
    <div className="rounded-2xl border p-4 text-center"
      style={{ background: card, borderColor: border, boxShadow: shadow }}>
      <div className="flex items-center justify-center mb-2" style={{ color: theme.muted }}>{icon}</div>
      <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: theme.muted }}>{label}</p>
      <p className="text-xl font-extrabold" style={{ color: theme.text }}>{value}</p>
      {sub && <p className="text-[10px] mt-0.5" style={{ color: theme.muted }}>{sub}</p>}
    </div>
  );
}
