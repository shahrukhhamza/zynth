import { useState, useRef } from 'react';
import PreTradeChecklist from '../PreTradeChecklist';
import { Upload, X, TrendingUp, TrendingDown, Save, Target, Mic, MicOff, Zap } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { createTrade, updateTrade } from '../../services/journalApi';
import { resolveMediaUrl } from '../../utils/mediaUrl';

const PAIRS = ['EURUSD','GBPUSD','USDJPY','AUDUSD','USDCAD','USDCHF','XAUUSD','BTCUSDT','ETHUSDT','GBPJPY','EURJPY','SP500','NAS100','OIL','CUSTOM'];
const SESSIONS = ['asian','london','new_york','overlap'];
const EMOTIONS = ['calm','confident','fearful','greedy','frustrated','anxious','fomo','revenge','neutral'];
const STRATEGIES = ['Breakout','Trend Following','Scalping','ICT/SMC','Price Action','Support & Resistance','News Trading','EMA Crossover','Custom'];

// ── Smart defaults: persist last-used pair / lots / session ───────────────────
const LS = 'zynth_trade_';
function getLast(k, fallback = '') {
  try { return localStorage.getItem(LS + k) || fallback; } catch { return fallback; }
}
function saveLast(k, v) {
  try { if (v != null && v !== '') localStorage.setItem(LS + k, String(v)); } catch {}
}

const INPUT_STYLE = (theme) => ({
  backgroundColor: theme.isDark ? theme.surface : theme.surface,
  color: theme.text,
  borderRadius: '8px',
  border: `1px solid ${theme.border}`,
  padding: '10px 12px',
  width: '100%',
  fontSize: '14px',
  fontWeight: 500,
  outline: 'none',
  transition: 'border-color 0.15s',
});

export default function TradeEntryForm({ onSaved, editTrade = null }) {
  const theme = useTheme();
  const fileRef = useRef();
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);
  const [preview, setPreview] = useState(editTrade?.screenshot_path ? resolveMediaUrl(editTrade.screenshot_path) : null);
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [customPair, setCustomPair] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);

  // Quick / Detailed mode toggle — persisted in localStorage
  const [quickMode, setQuickMode] = useState(() => {
    if (editTrade) return false; // always detailed when editing
    try { return localStorage.getItem('zynth_quick_mode') === 'true'; } catch { return false; }
  });
  const toggleQuick = () => setQuickMode(v => {
    try { localStorage.setItem('zynth_quick_mode', String(!v)); } catch {}
    return !v;
  });

  // Voice note — Web Speech API (free, built into modern browsers)
  const [isRecording, setIsRecording] = useState(false);
  const recRef = useRef(null);
  const voiceSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = 'en-US';
    r.onresult = e => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          const t = e.results[i][0].transcript.trim();
          if (t) setForm(f => ({ ...f, reasoning: f.reasoning ? `${f.reasoning} ${t}` : t }));
        }
      }
    };
    r.onend = () => setIsRecording(false);
    r.onerror = () => setIsRecording(false);
    recRef.current = r;
    r.start();
    setIsRecording(true);
  };
  const stopVoice = () => { recRef.current?.stop(); setIsRecording(false); };

  const init = editTrade ? {
    pair: editTrade.pair || '', direction: editTrade.direction || 'buy',
    position_size: editTrade.position_size || '', entry_price: editTrade.entry_price || '',
    exit_price: editTrade.exit_price || '', tp: editTrade.tp || '', sl: editTrade.sl || '',
    outcome: editTrade.outcome || '', profit_loss: editTrade.profit_loss || '',
    session: editTrade.session || '', strategy: editTrade.strategy || '',
    reasoning: editTrade.reasoning || '', emotional_state: editTrade.emotional_state || '',
    lessons_learned: editTrade.lessons_learned || '', notes: editTrade.notes || '',
  } : {
    pair:            getLast('pair',    'XAUUSD'),
    direction:       'buy',
    position_size:   getLast('lots',    ''),
    entry_price: '', exit_price: '', tp: '', sl: '',
    outcome: '',     profit_loss: '',
    session:         getLast('session', 'london'),
    strategy:        getLast('strategy',''),
    reasoning: '',   emotional_state: getLast('emotion', 'calm'),
    lessons_learned: '', notes: '',
  };
  const [form, setForm] = useState(init);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const onFile = (file) => {
    if (!file || !/^image\//.test(file.type)) return;
    setScreenshotFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    onFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== '' && v != null) fd.append(k, v); });
      if (screenshotFile) fd.append('screenshot', screenshotFile);

      if (editTrade) await updateTrade(editTrade.id, fd);
      else           await createTrade(fd);

      // Persist smart defaults for next log
      if (!editTrade) {
        saveLast('pair',     form.pair);
        saveLast('lots',     form.position_size);
        saveLast('session',  form.session);
        saveLast('strategy', form.strategy);
        saveLast('emotion',  form.emotional_state);
      }
      onSaved();
      if (!editTrade) {
        setForm(init);
        setPreview(null);
        setScreenshotFile(null);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  const card = {
    backgroundColor: theme.surface,
    border: `1px solid ${theme.border}`,
    borderRadius: '12px',
    padding: '20px 22px',
  };
  const cardTitle = {
    fontSize: '10px', fontWeight: 800, textTransform: 'uppercase',
    letterSpacing: '0.1em', color: theme.textMuted, marginBottom: '14px',
  };
  const label = {
    fontSize: '10px', fontWeight: 700,
    color: theme.textMuted,
    marginBottom: '6px', display: 'block',
    textTransform: 'uppercase', letterSpacing: '0.08em',
  };
  const input = INPUT_STYLE(theme);
  const resetBorder = e => { e.target.style.borderColor = theme.border; };
  const subtleText = theme.textMuted;
  const inactiveControlBg = theme.isDark ? theme.surface : '#f8fafc';
  const inactiveControlBorder = theme.isDark ? theme.border : '#cbd5e1';
  const warningText = theme.warning;

  // ── Shared JSX fragments ───────────────────────────────────────────────────
  const PairDirectionBlock = (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label style={label}>Instrument</label>
        {customPair ? (
          <div className="flex gap-2">
            <input value={form.pair} onChange={e => set('pair', e.target.value.toUpperCase())}
              placeholder="e.g. EURCAD" style={input} required
              onFocus={e => e.target.style.borderColor='#3b82f6'} onBlur={resetBorder} />
            <button type="button" onClick={() => setCustomPair(false)}
              className="px-2 rounded text-xs"
              style={{ backgroundColor: theme.surface2, color: subtleText }}>↩</button>
          </div>
        ) : (
          <select value={PAIRS.includes(form.pair) ? form.pair : 'CUSTOM'}
            onChange={e => { if (e.target.value === 'CUSTOM') { setCustomPair(true); set('pair', ''); } else set('pair', e.target.value); }}
            style={input} onFocus={e => e.target.style.borderColor='#3b82f6'} onBlur={resetBorder}>
            {PAIRS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        )}
      </div>
      <div>
        <label style={label}>Direction</label>
        <div className="flex gap-2 mt-0.5">
          {['buy','sell'].map(d => (
            <button key={d} type="button" onClick={() => set('direction', d)}
              className="flex-1 py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-1"
              style={{
                backgroundColor: form.direction === d ? (d==='buy' ? '#10b981' : '#ef4444') : inactiveControlBg,
                color: form.direction === d ? '#fff' : subtleText,
                border: `1.5px solid ${form.direction===d ? (d==='buy' ? '#10b981' : '#ef4444') : inactiveControlBorder}`,
              }}>
              {d==='buy'?<TrendingUp className="w-3 h-3"/>:<TrendingDown className="w-3 h-3"/>} {d.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const OutcomeBlock = (
    <>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {['win','loss','breakeven'].map(o => (
          <button key={o} type="button" onClick={() => set('outcome', o)}
            className="py-2 rounded-lg text-sm font-bold transition-colors"
            style={{
              backgroundColor: form.outcome===o
                ? (o==='win' ? (theme.isDark ? '#10b98122' : '#dcfce7') : o==='loss' ? (theme.isDark ? '#ef444422' : '#ffe4e6') : (theme.isDark ? '#f59e0b22' : '#ffedd5'))
                : inactiveControlBg,
              color: form.outcome===o ? (o==='win' ? '#10b981' : o==='loss' ? '#ef4444' : warningText) : subtleText,
              border: `1.5px solid ${form.outcome===o ? (o==='win' ? (theme.isDark ? '#10b98166' : '#86efac') : o==='loss' ? (theme.isDark ? '#ef444466' : '#fda4af') : (theme.isDark ? '#f59e0b66' : '#fdba74')) : inactiveControlBorder}`,
            }}>
            {o.charAt(0).toUpperCase()+o.slice(1)}
          </button>
        ))}
      </div>
      <div>
        <label style={label}>Profit / Loss Amount</label>
        <input type="number" step="any" value={form.profit_loss} onChange={e => set('profit_loss', e.target.value)}
          placeholder="e.g. +45.50 or -22.00"
          style={{
            ...input,
            color: Number.isFinite(Number.parseFloat(form.profit_loss))
              ? (Number.parseFloat(form.profit_loss) >= 0 ? '#10b981' : '#ef4444')
              : theme.text,
          }}
          onFocus={e => e.target.style.borderColor='#3b82f6'} onBlur={resetBorder} />
      </div>
    </>
  );

  const MicBtn = voiceSupported ? (
    <button type="button" onClick={isRecording ? stopVoice : startVoice}
      title={isRecording ? 'Stop recording' : 'Dictate reasoning via microphone'}
      className={isRecording ? 'animate-pulse' : ''}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '4px 10px', borderRadius: 8, cursor: 'pointer',
        border: `1.5px solid ${isRecording ? '#ef444488' : '#3b82f644'}`,
        backgroundColor: isRecording ? '#ef444415' : '#3b82f610',
        color: isRecording ? '#ef4444' : '#3b82f6',
        transition: 'all 0.15s',
      }}>
      {isRecording ? <MicOff style={{ width: 12, height: 12 }}/> : <Mic style={{ width: 12, height: 12 }}/>}
      <span style={{ fontSize: 10, fontWeight: 700 }}>{isRecording ? 'Stop' : 'Voice'}</span>
    </button>
  ) : null;

  const ReasoningField = (rows = 3) => (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <label style={{ ...label, margin: 0 }}>Why I Entered This Trade</label>
        {MicBtn}
      </div>
      <textarea value={form.reasoning} onChange={e => set('reasoning', e.target.value)}
        placeholder={isRecording ? '🎤 Listening… speak your trade reasoning' : 'Describe your trade setup and reasoning…'}
        rows={rows} style={{ ...input, resize: 'vertical' }}
        onFocus={e => e.target.style.borderColor='#3b82f6'} onBlur={resetBorder} />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* ── Quick / Detailed toggle (new trades only) ─────────────── */}
      {!editTrade && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', borderRadius: 10,
          backgroundColor: theme.surface,
          border: `1px solid ${theme.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Zap style={{ width: 13, height: 13, color: quickMode ? warningText : subtleText }}/>
            <span style={{ fontSize: 12, fontWeight: 700, color: quickMode ? warningText : subtleText }}>
              {quickMode ? 'Quick Log' : 'Detailed Log'}
            </span>
            {quickMode && null}
          </div>
          <button type="button" onClick={toggleQuick}
            style={{
              fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 7, cursor: 'pointer',
              border: `1.5px solid ${quickMode ? (theme.isDark ? '#f59e0b55' : '#fdba74') : inactiveControlBorder}`,
              backgroundColor: quickMode ? (theme.isDark ? '#f59e0b12' : '#ffedd5') : 'transparent',
              color: quickMode ? warningText : subtleText,
            }}>
            Switch to {quickMode ? 'Detailed' : 'Quick'}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: '#ef444422', color: '#ef4444', border: '1px solid #ef444444' }}>
          {error}
        </div>
      )}

       {/* ══════════════════════════════════════════════
          QUICK LOG MODE
        ══════════════════════════════════════════════ */}
      {quickMode && !editTrade ? (
        <div className="space-y-4">

          <div style={card}>
            <p style={cardTitle}>Trade Setup</p>
            {PairDirectionBlock}
          </div>

          <div style={card}>
            <p style={cardTitle}>Outcome</p>
            {OutcomeBlock}
          </div>

          <div style={card}>
            {ReasoningField(4)}
          </div>

          <button type="submit" disabled={saving || !form.pair || !form.direction}
            className="w-full py-3 font-bold text-sm transition-opacity flex items-center justify-center gap-2"
            style={{ backgroundColor: theme.accent, color: '#fff', opacity: saving ? 0.6 : 1, borderRadius: 12, border: 'none', fontWeight: 600 }}>
            <Save className="w-4 h-4"/>
            {saving ? 'Saving…' : 'Log Trade'}
          </button>
        </div>

      ) : (
      /* ══════════════════════════════════════════════
               DETAILED LOG MODE  — full form
          ══════════════════════════════════════════════ */
        <div className="space-y-4">

          {/* Trade Setup */}
          <div style={card}>
            <p style={cardTitle}>Trade Setup</p>
            {PairDirectionBlock}
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div><label style={label}>Entry Price</label><input type="number" step="any" value={form.entry_price} onChange={e => set('entry_price', e.target.value)} placeholder="0.00" style={input} onFocus={e => e.target.style.borderColor='#3b82f6'} onBlur={resetBorder}/></div>
              <div><label style={label}>Exit Price</label><input type="number" step="any" value={form.exit_price} onChange={e => set('exit_price', e.target.value)} placeholder="0.00" style={input} onFocus={e => e.target.style.borderColor='#3b82f6'} onBlur={resetBorder}/></div>
              <div><label style={label}>Take Profit (TP)</label><input type="number" step="any" value={form.tp} onChange={e => set('tp', e.target.value)} placeholder="0.00" style={input} onFocus={e => e.target.style.borderColor='#3b82f6'} onBlur={resetBorder}/></div>
              <div><label style={label}>Stop Loss (SL)</label><input type="number" step="any" value={form.sl} onChange={e => set('sl', e.target.value)} placeholder="0.00" style={input} onFocus={e => e.target.style.borderColor='#3b82f6'} onBlur={resetBorder}/></div>
              <div><label style={label}>Position Size (lots)</label><input type="number" step="0.01" value={form.position_size} onChange={e => set('position_size', e.target.value)} placeholder="0.01" style={input} onFocus={e => e.target.style.borderColor='#3b82f6'} onBlur={resetBorder}/></div>
              <div>
                <label style={label}>Session</label>
                <select value={form.session} onChange={e => set('session', e.target.value)} style={input} onFocus={e => e.target.style.borderColor='#3b82f6'} onBlur={resetBorder}>
                  <option value="">— Select —</option>
                  {SESSIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                </select>
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: `1px solid ${theme.border}`, margin: '2px 0' }}/>

          {/* Outcome */}
          <div style={card}>
            <p style={cardTitle}>Outcome</p>
            {OutcomeBlock}
          </div>

          {/* Screenshot */}
          <div style={card}>
            <p style={cardTitle}>Screenshot</p>
            {preview ? (
              <div className="relative">
                <img src={preview} alt="Trade" className="w-full rounded-lg max-h-48 object-contain" style={{ backgroundColor: theme.bg }}/>
                <button type="button" onClick={() => { setPreview(null); setScreenshotFile(null); }}
                  className="absolute top-2 right-2 p-1 rounded-full" style={{ backgroundColor: '#ef444488' }}>
                  <X className="w-4 h-4 text-white"/>
                </button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors"
                style={{ borderColor: dragging?'#3b82f6':theme.border, backgroundColor: dragging?'rgba(59,130,246,0.06)':'transparent' }}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}>
                <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: subtleText }}/>
                <p className="text-sm" style={{ color: subtleText }}>Drop screenshot here or click to upload</p>
                <p className="text-xs mt-1" style={{ color: subtleText }}>JPG, PNG, WebP — max 10MB</p>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => onFile(e.target.files[0])}/>
              </div>
            )}
          </div>

          {/* Journal Entry */}
          <div style={card}>
            <p style={cardTitle}>Journal Entry</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label style={label}>Strategy</label>
                <select value={STRATEGIES.includes(form.strategy)?form.strategy:'Custom'} onChange={e => set('strategy', e.target.value)} style={input} onFocus={e => e.target.style.borderColor='#3b82f6'} onBlur={resetBorder}>
                  <option value="">— Select —</option>
                  {STRATEGIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={label}>Emotional State</label>
                <select value={form.emotional_state} onChange={e => set('emotional_state', e.target.value)} style={input} onFocus={e => e.target.style.borderColor='#3b82f6'} onBlur={resetBorder}>
                  <option value="">— Select —</option>
                  {EMOTIONS.map(em => <option key={em} value={em}>{em.charAt(0).toUpperCase()+em.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-3">
              {ReasoningField(3)}
              <div>
                <label style={label}>Lessons Learned</label>
                <textarea value={form.lessons_learned} onChange={e => set('lessons_learned', e.target.value)}
                  placeholder="What did this trade teach you?"
                  rows={2} style={{ ...input, resize: 'vertical' }}
                  onFocus={e => e.target.style.borderColor='#3b82f6'} onBlur={resetBorder}/>
              </div>
              <div>
                <label style={label}>Additional Notes</label>
                <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                  placeholder="Any other observations..."
                  rows={2} style={{ ...input, resize: 'vertical' }}
                  onFocus={e => e.target.style.borderColor='#3b82f6'} onBlur={resetBorder}/>
              </div>
            </div>
          </div>

          {!editTrade && (
            <button type="button" onClick={() => setShowChecklist(true)}
              className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
              style={{ backgroundColor: 'transparent', color: theme.accent, border: `2px solid ${theme.accent}`, borderRadius: '12px' }}>
              <Target size={14}/> Run Pre-Trade Check
            </button>
          )}

          <button type="submit" disabled={saving || !form.pair || !form.direction}
            className="w-full py-3 font-bold text-sm transition-opacity flex items-center justify-center gap-2"
            style={{ backgroundColor: theme.accent, color: '#fff', opacity: saving ? 0.6 : 1, borderRadius: '12px', border: 'none', fontWeight: 600 }}>
            <Save className="w-4 h-4"/>
            {saving ? 'Saving…' : editTrade ? 'Update Trade' : 'Log Trade'}
          </button>
        </div>
      )}

      {showChecklist && (
        <PreTradeChecklist
          direction={form.direction}
          entry_price={form.entry_price}
          tp={form.tp}
          sl={form.sl}
          strategy={form.strategy}
          session={form.session}
          emotional_state={form.emotional_state}
          onClose={() => setShowChecklist(false)}
        />
      )}
    </form>
  );
}

