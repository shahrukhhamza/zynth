import { useState, useRef } from 'react';
import { Upload, X, TrendingUp, TrendingDown, Save, ChevronDown } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { createTrade, updateTrade } from '../../services/journalApi';

const PAIRS = ['EURUSD','GBPUSD','USDJPY','AUDUSD','USDCAD','USDCHF','XAUUSD','BTCUSDT','ETHUSDT','GBPJPY','EURJPY','SP500','NAS100','OIL','CUSTOM'];
const SESSIONS = ['asian','london','new_york','overlap'];
const EMOTIONS = ['calm','confident','fearful','greedy','frustrated','anxious','fomo','revenge','neutral'];
const STRATEGIES = ['Breakout','Trend Following','Scalping','ICT/SMC','Price Action','Support & Resistance','News Trading','EMA Crossover','Custom'];

const INPUT_STYLE = (theme) => ({
  backgroundColor: theme.bg,
  borderColor: theme.border,
  color: theme.text,
  borderRadius: '0.5rem',
  border: `1px solid`,
  padding: '0.5rem 0.75rem',
  width: '100%',
  fontSize: '0.875rem',
  outline: 'none',
});

export default function TradeEntryForm({ onSaved, editTrade = null }) {
  const theme = useTheme();
  const fileRef = useRef();
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);
  const [preview, setPreview] = useState(editTrade?.screenshot_path ? editTrade.screenshot_path : null);
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [customPair, setCustomPair] = useState(false);

  const init = editTrade ? {
    pair: editTrade.pair || '', direction: editTrade.direction || 'buy',
    position_size: editTrade.position_size || '', entry_price: editTrade.entry_price || '',
    exit_price: editTrade.exit_price || '', tp: editTrade.tp || '', sl: editTrade.sl || '',
    outcome: editTrade.outcome || '', profit_loss: editTrade.profit_loss || '',
    session: editTrade.session || '', strategy: editTrade.strategy || '',
    reasoning: editTrade.reasoning || '', emotional_state: editTrade.emotional_state || '',
    lessons_learned: editTrade.lessons_learned || '', notes: editTrade.notes || '',
  } : {
    pair: 'XAUUSD', direction: 'buy', position_size: '', entry_price: '',
    exit_price: '', tp: '', sl: '', outcome: '', profit_loss: '',
    session: 'london', strategy: '', reasoning: '', emotional_state: 'calm',
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

  const card = { backgroundColor: theme.surface, borderColor: theme.border, border: `1px solid ${theme.border}`, borderRadius: '0.75rem', padding: '1.25rem' };
  const label = { fontSize: '0.75rem', fontWeight: 600, color: theme.muted, marginBottom: '0.35rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' };
  const input = INPUT_STYLE(theme);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: '#ef444422', color: '#ef4444', border: '1px solid #ef444444' }}>
          {error}
        </div>
      )}

      {/* Row 1: Pair + Direction */}
      <div style={card}>
        <p className="text-sm font-semibold mb-3" style={{ color: theme.text }}>Trade Setup</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label style={label}>Instrument</label>
            {customPair ? (
              <div className="flex gap-2">
                <input value={form.pair} onChange={e => set('pair', e.target.value.toUpperCase())}
                  placeholder="e.g. EURCAD" style={input} required />
                <button type="button" onClick={() => setCustomPair(false)}
                  className="px-2 rounded text-xs" style={{ backgroundColor: theme.border, color: theme.muted }}>↩</button>
              </div>
            ) : (
              <select value={PAIRS.includes(form.pair) ? form.pair : 'CUSTOM'}
                onChange={e => { if (e.target.value === 'CUSTOM') { setCustomPair(true); set('pair', ''); } else set('pair', e.target.value); }}
                style={input}>
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
                    backgroundColor: form.direction === d ? (d === 'buy' ? '#22c55e22' : '#ef444422') : theme.bg,
                    color: form.direction === d ? (d === 'buy' ? '#22c55e' : '#ef4444') : theme.muted,
                    border: `1.5px solid ${form.direction === d ? (d === 'buy' ? '#22c55e88' : '#ef444488') : theme.border}`,
                  }}>
                  {d === 'buy' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {d.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <div><label style={label}>Entry Price</label><input type="number" step="any" value={form.entry_price} onChange={e => set('entry_price', e.target.value)} placeholder="0.00" style={input} /></div>
          <div><label style={label}>Exit Price</label><input type="number" step="any" value={form.exit_price} onChange={e => set('exit_price', e.target.value)} placeholder="0.00" style={input} /></div>
          <div><label style={label}>Take Profit (TP)</label><input type="number" step="any" value={form.tp} onChange={e => set('tp', e.target.value)} placeholder="0.00" style={input} /></div>
          <div><label style={label}>Stop Loss (SL)</label><input type="number" step="any" value={form.sl} onChange={e => set('sl', e.target.value)} placeholder="0.00" style={input} /></div>
          <div><label style={label}>Position Size (lots)</label><input type="number" step="0.01" value={form.position_size} onChange={e => set('position_size', e.target.value)} placeholder="0.01" style={input} /></div>
          <div>
            <label style={label}>Session</label>
            <select value={form.session} onChange={e => set('session', e.target.value)} style={input}>
              <option value="">— Select —</option>
              {SESSIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Row 2: Outcome + P&L */}
      <div style={card}>
        <p className="text-sm font-semibold mb-3" style={{ color: theme.text }}>Outcome</p>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {['win','loss','breakeven'].map(o => (
            <button key={o} type="button" onClick={() => set('outcome', o)}
              className="py-2 rounded-lg text-sm font-bold transition-colors"
              style={{
                backgroundColor: form.outcome === o
                  ? (o === 'win' ? '#22c55e22' : o === 'loss' ? '#ef444422' : '#f59e0b22')
                  : theme.bg,
                color: form.outcome === o
                  ? (o === 'win' ? '#22c55e' : o === 'loss' ? '#ef4444' : '#f59e0b')
                  : theme.muted,
                border: `1.5px solid ${form.outcome === o
                  ? (o === 'win' ? '#22c55e66' : o === 'loss' ? '#ef444466' : '#f59e0b66')
                  : theme.border}`,
              }}>
              {o.charAt(0).toUpperCase() + o.slice(1)}
            </button>
          ))}
        </div>
        <div>
          <label style={label}>Profit / Loss Amount</label>
          <input type="number" step="any" value={form.profit_loss} onChange={e => set('profit_loss', e.target.value)}
            placeholder="e.g. +45.50 or -22.00" style={{ ...input, color: parseFloat(form.profit_loss) >= 0 ? '#22c55e' : '#ef4444' }} />
        </div>
      </div>

      {/* Row 3: Screenshot */}
      <div style={card}>
        <p className="text-sm font-semibold mb-3" style={{ color: theme.text }}>Screenshot</p>
        {preview ? (
          <div className="relative">
            <img src={preview.startsWith('blob:') ? preview : preview} alt="Trade" className="w-full rounded-lg max-h-48 object-contain" style={{ backgroundColor: theme.bg }} />
            <button type="button" onClick={() => { setPreview(null); setScreenshotFile(null); }}
              className="absolute top-2 right-2 p-1 rounded-full" style={{ backgroundColor: '#ef444488' }}>
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        ) : (
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors"
            style={{ borderColor: dragging ? theme.accent : theme.border, backgroundColor: dragging ? `${theme.accent}11` : 'transparent' }}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}>
            <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: theme.muted }} />
            <p className="text-sm" style={{ color: theme.muted }}>Drop screenshot here or click to upload</p>
            <p className="text-xs mt-1" style={{ color: theme.muted }}>JPG, PNG, WebP — max 10MB</p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => onFile(e.target.files[0])} />
          </div>
        )}
      </div>

      {/* Row 4: Journal */}
      <div style={card}>
        <p className="text-sm font-semibold mb-3" style={{ color: theme.text }}>Journal Entry</p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label style={label}>Strategy</label>
            <select value={STRATEGIES.includes(form.strategy) ? form.strategy : 'Custom'} onChange={e => set('strategy', e.target.value)} style={input}>
              <option value="">— Select —</option>
              {STRATEGIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Emotional State</label>
            <select value={form.emotional_state} onChange={e => set('emotional_state', e.target.value)} style={input}>
              <option value="">— Select —</option>
              {EMOTIONS.map(em => <option key={em} value={em}>{em.charAt(0).toUpperCase() + em.slice(1)}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label style={{ ...label }}>Why I Entered This Trade</label>
            <textarea value={form.reasoning} onChange={e => set('reasoning', e.target.value)}
              placeholder="Describe your trade reasoning, setup, and market conditions..."
              rows={3} style={{ ...input, resize: 'vertical' }} />
          </div>
          <div>
            <label style={label}>Lessons Learned</label>
            <textarea value={form.lessons_learned} onChange={e => set('lessons_learned', e.target.value)}
              placeholder="What did this trade teach you?"
              rows={2} style={{ ...input, resize: 'vertical' }} />
          </div>
          <div>
            <label style={label}>Additional Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Any other observations..."
              rows={2} style={{ ...input, resize: 'vertical' }} />
          </div>
        </div>
      </div>

      <button type="submit" disabled={saving || !form.pair || !form.direction}
        className="w-full py-3 rounded-xl font-bold text-sm transition-opacity flex items-center justify-center gap-2"
        style={{ backgroundColor: theme.accent, color: '#fff', opacity: saving ? 0.6 : 1 }}>
        <Save className="w-4 h-4" />
        {saving ? 'Saving…' : editTrade ? 'Update Trade' : 'Log Trade'}
      </button>
    </form>
  );
}
