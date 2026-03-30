import { useMemo, useRef, useState } from 'react';
import JournalUpgradePrompt from './JournalUpgradePrompt';
import ErrorBar from '../ErrorBar';
import {
  Upload,
  X,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ChevronDown,
  Check,
  ArrowRight,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { createTrade, updateTrade } from '../../services/journalApi';
import { resolveMediaUrl } from '../../utils/mediaUrl';

const PAIRS = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF', 'XAUUSD', 'BTCUSDT', 'ETHUSDT', 'GBPJPY', 'EURJPY', 'SP500', 'NAS100', 'OIL'];
const INSTRUMENT_ALIASES = {
  XAU: ['XAUUSD'],
  GOLD: ['XAUUSD'],
  BTC: ['BTCUSDT'],
  BITCOIN: ['BTCUSDT'],
  ETH: ['ETHUSDT'],
  ETHEREUM: ['ETHUSDT'],
  NAS: ['NAS100'],
  NASDAQ: ['NAS100'],
  SPX: ['SP500'],
  SP: ['SP500'],
  OIL: ['OIL'],
};
const SESSIONS = [
  { value: 'asian', label: 'Asia' },
  { value: 'london', label: 'London' },
  { value: 'new_york', label: 'New York' },
  { value: 'overlap', label: 'London / NY Overlap' },
];
const EMOTIONS = ['Calm', 'Confident', 'Neutral', 'Anxious', 'Fearful', 'Frustrated', 'Greedy', 'FOMO', 'Revenge'];
const STRATEGIES = ['Breakout', 'Trend Following', 'Scalping', 'ICT/SMC', 'Price Action', 'Support & Resistance', 'News Trading', 'EMA Crossover', 'Custom'];

const LS = 'zynth_trade_';
function getLast(k, fallback = '') {
  try { return localStorage.getItem(LS + k) || fallback; } catch { return fallback; }
}
function saveLast(k, v) {
  try { if (v != null && v !== '') localStorage.setItem(LS + k, String(v)); } catch {}
}

function getInstrumentSuggestions(rawValue) {
  const value = (rawValue || '').trim().toUpperCase();
  if (!value) return PAIRS.slice(0, 6);

  const aliasMatches = INSTRUMENT_ALIASES[value] || [];
  const prefixMatches = PAIRS.filter((pair) => pair.startsWith(value));
  const includesMatches = PAIRS.filter((pair) => !pair.startsWith(value) && pair.includes(value));
  return [...new Set([...aliasMatches, ...prefixMatches, ...includesMatches])].slice(0, 6);
}

function buildAiInsight(form) {
  let quality = 52;
  let psychology = 58;

  if (form.entry_price) quality += 8;
  if (form.profit_loss !== '') quality += 8;
  if (form.sl && form.tp) quality += 10;
  if (form.position_size) quality += 8;
  if (form.strategy && form.session) quality += 8;
  if ((form.notes || '').trim().length >= 20) quality += 6;

  if (['Calm', 'Confident', 'Neutral'].includes(form.emotional_state)) psychology += 14;
  if (['Anxious', 'Fearful', 'Frustrated', 'Greedy', 'FOMO', 'Revenge'].includes(form.emotional_state)) psychology -= 10;
  if ((form.postLearned || '').trim().length >= 20) psychology += 8;

  quality = Math.max(0, Math.min(100, quality));
  psychology = Math.max(0, Math.min(100, psychology));

  let feedback = 'Fast capture complete. Add a little more context over time to improve pattern quality.';
  if (quality >= 75 && psychology >= 70) feedback = 'This is a high-quality journal entry. Clear structure and stable execution behavior.';
  if (quality < 60) feedback = 'You logged the essentials, but risk context is still thin. Add stop loss, take profit, and position sizing next time.';
  if (psychology < 50) feedback = 'Execution may have been emotionally noisy. Reduce urgency and define your invalidation before entry.';

  return { quality, psychology, feedback };
}

function cardShadow(isDark) {
  return isDark
    ? '0 10px 30px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.22)'
    : '0 1px 4px rgba(0,0,0,0.06), 0 10px 30px rgba(15,23,42,0.08)';
}

function inputStyle(isDark, text) {
  return {
    width: '100%',
    border: 'none',
    borderRadius: 14,
    padding: '12px 14px',
    fontSize: 14,
    fontWeight: 500,
    color: text,
    background: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
    outline: 'none',
    boxShadow: isDark
      ? 'inset 0 0 0 1px rgba(255,255,255,0.04)'
      : 'inset 0 0 0 1px rgba(15,23,42,0.05)',
    transition: 'box-shadow 200ms ease, transform 200ms ease',
  };
}

function labelStyle(color) {
  return {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color,
    marginBottom: 8,
    display: 'block',
  };
}

export default function TradeEntryForm({ onSaved, editTrade = null }) {
  const theme = useTheme();
  const isDark = !!theme.isDark;
  const palette = {
    page: isDark ? '#0b1220' : '#f8fafc',
    card: isDark ? '#111827' : '#ffffff',
    soft: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
    text: isDark ? '#f9fafb' : '#111827',
    sub: isDark ? '#9ca3af' : '#6b7280',
    muted: isDark ? '#6b7280' : '#94a3b8',
    green: isDark ? '#10b981' : '#059669',
    red: isDark ? '#ef4444' : '#dc2626',
    blue: isDark ? '#60a5fa' : '#2563eb',
  };

  const fileRef = useRef(null);

  const initialForm = editTrade ? {
    pair: editTrade.pair || '',
    direction: editTrade.direction || 'buy',
    entry_price: editTrade.entry_price || '',
    profit_loss: editTrade.profit_loss || '',
    sl: editTrade.sl || '',
    tp: editTrade.tp || '',
    position_size: editTrade.position_size || '',
    session: editTrade.session || '',
    strategy: editTrade.strategy || '',
    emotional_state: editTrade.emotional_state ? editTrade.emotional_state.charAt(0).toUpperCase() + editTrade.emotional_state.slice(1) : '',
    notes: editTrade.notes || '',
    exit_price: editTrade.exit_price || '',
    outcome: editTrade.outcome || '',
    postRight: '',
    postWrong: '',
    postLearned: editTrade.lessons_learned || '',
  } : {
    pair: getLast('pair', 'XAUUSD'),
    direction: 'buy',
    entry_price: '',
    profit_loss: '',
    sl: '',
    tp: '',
    position_size: getLast('lots', ''),
    session: getLast('session', ''),
    strategy: getLast('strategy', ''),
    emotional_state: getLast('emotion', 'Calm'),
    notes: '',
    exit_price: '',
    outcome: '',
    postRight: '',
    postWrong: '',
    postLearned: '',
  };

  const [form, setForm] = useState(initialForm);
  const [expanded, setExpanded] = useState(!!editTrade);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [limitReached, setLimitReached] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [preview, setPreview] = useState(editTrade?.screenshot_path ? resolveMediaUrl(editTrade.screenshot_path) : null);
  const [successTrade, setSuccessTrade] = useState(null);
  const [savingReflection, setSavingReflection] = useState(false);
  const [reflectionSaved, setReflectionSaved] = useState(false);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const suggestions = useMemo(() => getInstrumentSuggestions(form.pair), [form.pair]);
  const aiInsight = useMemo(() => buildAiInsight(form), [form]);

  const canSubmit = !!(form.pair && form.direction && form.entry_price !== '' && form.profit_loss !== '');

  const handleFile = (file) => {
    if (!file || !/^image\//.test(file.type)) return;
    setScreenshotFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const resetForNext = () => {
    setForm({
      pair: getLast('pair', 'XAUUSD'),
      direction: 'buy',
      entry_price: '',
      profit_loss: '',
      sl: '',
      tp: '',
      position_size: getLast('lots', ''),
      session: getLast('session', ''),
      strategy: getLast('strategy', ''),
      emotional_state: getLast('emotion', 'Calm'),
      notes: '',
      exit_price: '',
      outcome: '',
      postRight: '',
      postWrong: '',
      postLearned: '',
    });
    setExpanded(false);
    setScreenshotFile(null);
    setPreview(null);
    setSuccessTrade(null);
    setReflectionSaved(false);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setError(null);
    setLimitReached(false);
    setReflectionSaved(false);

    try {
      const fd = new FormData();
      const outcome = form.outcome || (Number.parseFloat(form.profit_loss) > 0 ? 'win' : Number.parseFloat(form.profit_loss) < 0 ? 'loss' : 'breakeven');
      const payload = {
        pair: (form.pair || '').trim().toUpperCase(),
        direction: form.direction,
        entry_price: form.entry_price,
        profit_loss: form.profit_loss,
        sl: form.sl,
        tp: form.tp,
        position_size: form.position_size,
        session: form.session,
        strategy: form.strategy,
        emotional_state: (form.emotional_state || '').toLowerCase(),
        notes: form.notes,
        exit_price: form.exit_price,
        outcome,
      };

      Object.entries(payload).forEach(([k, v]) => {
        if (v !== '' && v != null) fd.append(k, v);
      });
      if (screenshotFile) fd.append('screenshot', screenshotFile);

      const saved = editTrade ? await updateTrade(editTrade.id, fd) : await createTrade(fd);

      saveLast('pair', payload.pair);
      saveLast('lots', form.position_size);
      saveLast('session', form.session);
      saveLast('strategy', form.strategy);
      saveLast('emotion', form.emotional_state);

      setSuccessTrade(saved);
      onSaved?.(saved);
    } catch (err) {
      const errCode = err.response?.data?.error;
      if (errCode === 'journal_limit_reached') setLimitReached(true);
      else setError(errCode || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveReflection = async () => {
    if (!successTrade?.id) return;
    setSavingReflection(true);
    setError(null);

    try {
      const fd = new FormData();
      const notesParts = [];
      if ((form.notes || '').trim()) notesParts.push(form.notes.trim());
      if ((form.postRight || '').trim()) notesParts.push(`What went right: ${form.postRight.trim()}`);
      if ((form.postWrong || '').trim()) notesParts.push(`What went wrong: ${form.postWrong.trim()}`);
      fd.append('notes', notesParts.join('\n'));
      if ((form.postLearned || '').trim()) fd.append('lessons_learned', form.postLearned.trim());
      await updateTrade(successTrade.id, fd);
      setReflectionSaved(true);
      onSaved?.(successTrade);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSavingReflection(false);
    }
  };

  if (limitReached) return <JournalUpgradePrompt />;

  return (
    <div style={{ background: palette.page, borderRadius: 24, padding: '8px 0 18px' }}>
      {error && <ErrorBar message={error} />}

      <div className="max-w-3xl mx-auto">
        {successTrade ? (
          <div
            className="rounded-[28px] transition-all duration-200 hover:-translate-y-[2px]"
            style={{ background: palette.card, boxShadow: cardShadow(isDark), padding: 20 }}
          >
            <div className="flex items-start gap-3 mb-5">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: isDark ? 'rgba(37,99,235,0.18)' : 'rgba(37,99,235,0.12)' }}
              >
                <Check size={20} style={{ color: palette.blue }} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest m-0" style={{ color: palette.sub }}>Trade Logged</p>
                <h3 className="text-2xl font-semibold tracking-tight m-0 mt-1" style={{ color: palette.text }}>Captured in seconds.</h3>
                <p className="text-sm m-0 mt-1" style={{ color: palette.sub }}>
                  {successTrade.pair || form.pair} recorded successfully. Review the instant AI read, then add reflection if you want.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div className="rounded-2xl p-4" style={{ background: isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.10)' }}>
                <p className="text-[11px] font-semibold uppercase tracking-widest m-0" style={{ color: palette.sub }}>Trade Quality</p>
                <p className="text-4xl font-bold tracking-tight m-0 mt-2" style={{ color: palette.blue }}>{aiInsight.quality}</p>
              </div>
              <div className="rounded-2xl p-4" style={{ background: isDark ? 'rgba(37,99,235,0.16)' : 'rgba(37,99,235,0.10)' }}>
                <p className="text-[11px] font-semibold uppercase tracking-widest m-0" style={{ color: palette.sub }}>Psychology</p>
                <p className="text-4xl font-bold tracking-tight m-0 mt-2" style={{ color: palette.blue }}>{aiInsight.psychology}</p>
              </div>
            </div>

            <div className="rounded-2xl p-4 mb-4" style={{ background: palette.soft }}>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} style={{ color: palette.blue }} />
                <p className="text-[11px] font-semibold uppercase tracking-widest m-0" style={{ color: palette.sub }}>AI Insight</p>
              </div>
              <p className="text-sm leading-relaxed m-0" style={{ color: palette.text }}>{aiInsight.feedback}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div>
                <label style={labelStyle(palette.sub)}>What went right?</label>
                <textarea value={form.postRight} onChange={(e) => set('postRight', e.target.value)} rows={2} style={{ ...inputStyle(isDark, palette.text), resize: 'vertical' }} placeholder="Execution, patience, timing, discipline." />
              </div>
              <div>
                <label style={labelStyle(palette.sub)}>What went wrong?</label>
                <textarea value={form.postWrong} onChange={(e) => set('postWrong', e.target.value)} rows={2} style={{ ...inputStyle(isDark, palette.text), resize: 'vertical' }} placeholder="Bias, timing errors, risk mistakes, hesitation." />
              </div>
            </div>
            <div className="mb-4">
              <div>
                <label style={labelStyle(palette.sub)}>What did you learn?</label>
                <textarea value={form.postLearned} onChange={(e) => set('postLearned', e.target.value)} rows={2} style={{ ...inputStyle(isDark, palette.text), resize: 'vertical' }} placeholder="One rule to carry into the next trade." />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleSaveReflection}
                disabled={savingReflection}
                className="w-full rounded-2xl py-3 text-sm font-semibold transition-all duration-200"
                style={{
                  border: 'none',
                  color: '#ffffff',
                  background: '#2563eb',
                  boxShadow: '0 10px 24px rgba(37,99,235,0.30)',
                  opacity: savingReflection ? 0.6 : 1,
                }}
              >
                {savingReflection ? 'Saving reflection...' : 'Save Reflection'}
              </button>
              <button
                type="button"
                onClick={resetForNext}
                className="w-full rounded-2xl py-3 text-sm font-semibold transition-all duration-200"
                style={{
                  border: 'none',
                  color: palette.text,
                  background: palette.soft,
                }}
              >
                Log Another Trade
              </button>
              {reflectionSaved && (
                <p className="text-xs text-center m-0" style={{ color: palette.green }}>
                  Reflection saved.
                </p>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div
              className="rounded-[28px] transition-all duration-200 hover:-translate-y-[2px]"
              style={{ background: palette.card, boxShadow: cardShadow(isDark), padding: 20 }}
            >
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-widest m-0" style={{ color: palette.sub }}>Quick Mode</p>
                <h3 className="text-2xl font-semibold tracking-tight m-0 mt-2" style={{ color: palette.text }}>Log a trade in under 10 seconds.</h3>
                <p className="text-sm m-0 mt-2" style={{ color: palette.sub }}>Capture only the essentials first. Add more detail only if it helps.</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label style={labelStyle(palette.sub)}>Pair</label>
                  <input
                    value={form.pair}
                    onChange={(e) => set('pair', e.target.value.toUpperCase())}
                    placeholder="e.g. XAU"
                    style={inputStyle(isDark, palette.text)}
                    onFocus={(e) => { e.currentTarget.style.boxShadow = 'inset 0 0 0 2px #2563eb'; }}
                    onBlur={(e) => { e.currentTarget.style.boxShadow = isDark ? 'inset 0 0 0 1px rgba(255,255,255,0.04)' : 'inset 0 0 0 1px rgba(15,23,42,0.05)'; }}
                  />
                  {suggestions.length > 0 && !suggestions.includes((form.pair || '').trim().toUpperCase()) && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => set('pair', suggestion)}
                          className="px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
                          style={{
                            border: 'none',
                            color: palette.blue,
                            background: isDark ? 'rgba(96,165,250,0.16)' : 'rgba(37,99,235,0.10)',
                          }}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label style={labelStyle(palette.sub)}>Direction</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['buy', 'sell'].map((direction) => {
                      const active = form.direction === direction;
                      return (
                        <button
                          key={direction}
                          type="button"
                          onClick={() => set('direction', direction)}
                          className="py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200"
                          style={{
                            border: 'none',
                            color: active ? '#ffffff' : palette.sub,
                            background: active ? '#2563eb' : palette.soft,
                            boxShadow: active ? '0 10px 20px rgba(37,99,235,0.28)' : 'none',
                          }}
                        >
                          {direction === 'buy' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {direction.toUpperCase()}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label style={labelStyle(palette.sub)}>Entry Price</label>
                    <input type="number" step="any" value={form.entry_price} onChange={(e) => set('entry_price', e.target.value)} placeholder="0.00" style={inputStyle(isDark, palette.text)} onFocus={(e) => { e.currentTarget.style.boxShadow = 'inset 0 0 0 2px #2563eb'; }} onBlur={(e) => { e.currentTarget.style.boxShadow = isDark ? 'inset 0 0 0 1px rgba(255,255,255,0.04)' : 'inset 0 0 0 1px rgba(15,23,42,0.05)'; }} />
                  </div>
                  <div>
                    <label style={labelStyle(palette.sub)}>Profit / Loss</label>
                    <input
                      type="number"
                      step="any"
                      value={form.profit_loss}
                      onChange={(e) => set('profit_loss', e.target.value)}
                      placeholder="0.00"
                      style={{
                        ...inputStyle(isDark, palette.text),
                        color: Number.parseFloat(form.profit_loss) > 0 ? palette.green : Number.parseFloat(form.profit_loss) < 0 ? palette.red : palette.text,
                      }}
                      onFocus={(e) => { e.currentTarget.style.boxShadow = 'inset 0 0 0 2px #2563eb'; }}
                      onBlur={(e) => { e.currentTarget.style.boxShadow = isDark ? 'inset 0 0 0 1px rgba(255,255,255,0.04)' : 'inset 0 0 0 1px rgba(15,23,42,0.05)'; }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="text-sm font-semibold inline-flex items-center gap-2 transition-all duration-200"
                  style={{ border: 'none', background: 'transparent', color: palette.blue, padding: 0 }}
                >
                  <ChevronDown size={14} style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms ease' }} />
                  {expanded ? 'Hide Details' : '+ Add Details'}
                </button>
              </div>

              <div
                style={{
                  maxHeight: expanded ? 900 : 0,
                  opacity: expanded ? 1 : 0,
                  overflow: 'hidden',
                  transition: 'max-height 220ms ease, opacity 200ms ease, margin-top 200ms ease',
                  marginTop: expanded ? 12 : 0,
                }}
              >
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label style={labelStyle(palette.sub)}>Stop Loss</label>
                      <input type="number" step="any" value={form.sl} onChange={(e) => set('sl', e.target.value)} placeholder="0.00" style={inputStyle(isDark, palette.text)} onFocus={(e) => { e.currentTarget.style.boxShadow = 'inset 0 0 0 2px #2563eb'; }} onBlur={(e) => { e.currentTarget.style.boxShadow = isDark ? 'inset 0 0 0 1px rgba(255,255,255,0.04)' : 'inset 0 0 0 1px rgba(15,23,42,0.05)'; }} />
                    </div>
                    <div>
                      <label style={labelStyle(palette.sub)}>Take Profit</label>
                      <input type="number" step="any" value={form.tp} onChange={(e) => set('tp', e.target.value)} placeholder="0.00" style={inputStyle(isDark, palette.text)} onFocus={(e) => { e.currentTarget.style.boxShadow = 'inset 0 0 0 2px #2563eb'; }} onBlur={(e) => { e.currentTarget.style.boxShadow = isDark ? 'inset 0 0 0 1px rgba(255,255,255,0.04)' : 'inset 0 0 0 1px rgba(15,23,42,0.05)'; }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label style={labelStyle(palette.sub)}>Position Size</label>
                      <input type="number" step="0.01" value={form.position_size} onChange={(e) => set('position_size', e.target.value)} placeholder="0.01" style={inputStyle(isDark, palette.text)} onFocus={(e) => { e.currentTarget.style.boxShadow = 'inset 0 0 0 2px #2563eb'; }} onBlur={(e) => { e.currentTarget.style.boxShadow = isDark ? 'inset 0 0 0 1px rgba(255,255,255,0.04)' : 'inset 0 0 0 1px rgba(15,23,42,0.05)'; }} />
                    </div>
                    <div>
                      <label style={labelStyle(palette.sub)}>Session</label>
                      <select value={form.session} onChange={(e) => set('session', e.target.value)} style={inputStyle(isDark, palette.text)} onFocus={(e) => { e.currentTarget.style.boxShadow = 'inset 0 0 0 2px #2563eb'; }} onBlur={(e) => { e.currentTarget.style.boxShadow = isDark ? 'inset 0 0 0 1px rgba(255,255,255,0.04)' : 'inset 0 0 0 1px rgba(15,23,42,0.05)'; }}>
                        <option value="">Select session</option>
                        {SESSIONS.map((session) => <option key={session.value} value={session.value}>{session.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label style={labelStyle(palette.sub)}>Strategy</label>
                      <select value={form.strategy} onChange={(e) => set('strategy', e.target.value)} style={inputStyle(isDark, palette.text)} onFocus={(e) => { e.currentTarget.style.boxShadow = 'inset 0 0 0 2px #2563eb'; }} onBlur={(e) => { e.currentTarget.style.boxShadow = isDark ? 'inset 0 0 0 1px rgba(255,255,255,0.04)' : 'inset 0 0 0 1px rgba(15,23,42,0.05)'; }}>
                        <option value="">Select strategy</option>
                        {STRATEGIES.map((strategy) => <option key={strategy} value={strategy}>{strategy}</option>)}
                      </select>
                    </div>

                    <div>
                      <label style={labelStyle(palette.sub)}>Emotional State</label>
                      <select value={form.emotional_state} onChange={(e) => set('emotional_state', e.target.value)} style={inputStyle(isDark, palette.text)} onFocus={(e) => { e.currentTarget.style.boxShadow = 'inset 0 0 0 2px #2563eb'; }} onBlur={(e) => { e.currentTarget.style.boxShadow = isDark ? 'inset 0 0 0 1px rgba(255,255,255,0.04)' : 'inset 0 0 0 1px rgba(15,23,42,0.05)'; }}>
                        <option value="">Select emotion</option>
                        {EMOTIONS.map((emotion) => <option key={emotion} value={emotion}>{emotion}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle(palette.sub)}>Notes</label>
                    <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={3} placeholder="Optional context, setup notes, or execution remarks." style={{ ...inputStyle(isDark, palette.text), resize: 'vertical' }} />
                  </div>

                  <div>
                    <label style={labelStyle(palette.sub)}>Screenshot</label>
                    {preview ? (
                      <div className="relative rounded-2xl overflow-hidden" style={{ background: palette.soft }}>
                        <img src={preview} alt="Trade screenshot" className="w-full object-contain max-h-52" />
                        <button
                          type="button"
                          onClick={() => { setPreview(null); setScreenshotFile(null); }}
                          className="absolute top-2 right-2 p-2 rounded-full"
                          style={{ border: 'none', background: 'rgba(239,68,68,0.85)', color: '#fff' }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragging(false);
                          handleFile(e.dataTransfer.files[0]);
                        }}
                        className="w-full rounded-2xl p-4 text-center transition-all duration-200"
                        style={{
                          border: 'none',
                          background: dragging ? (isDark ? 'rgba(96,165,250,0.18)' : 'rgba(37,99,235,0.10)') : palette.soft,
                          color: palette.sub,
                        }}
                      >
                        <Upload size={18} className="mx-auto mb-2" />
                        <p className="text-sm m-0">Drop screenshot or click to upload</p>
                      </button>
                    )}
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={!canSubmit || saving}
                className="w-full rounded-2xl py-3.5 text-sm font-semibold mt-6 transition-all duration-200 flex items-center justify-center gap-2"
                style={{
                  border: 'none',
                  color: '#ffffff',
                  opacity: !canSubmit || saving ? 0.55 : 1,
                  background: '#2563eb',
                  boxShadow: !canSubmit || saving ? 'none' : '0 12px 28px rgba(37,99,235,0.30)',
                  cursor: !canSubmit || saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Logging Trade...' : 'Log Trade'}
                {!saving && <ArrowRight size={15} />}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
