import { useState, useEffect } from 'react';
import { Target, Check, AlertTriangle, XCircle, Lock, Trophy, CheckCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config/api';

// ── Constants ────────────────────────────────────────────────────────────────
const EMOTIONS = ['calm','confident','fearful','greedy','frustrated','anxious','fomo','revenge','neutral'];
const STRATEGIES = ['Breakout','Trend Following','Scalping','ICT/SMC','Price Action','Support & Resistance','News Trading','EMA Crossover','Custom'];
const GOOD_EMOTIONS = new Set(['calm','confident','neutral','excited']);
const BAD_EMOTIONS  = new Set(['revenge','frustrated','anxious','fearful','fomo','greedy']);
const SESSIONS_DEF  = [
  { key: 'asian',    label: 'Asian'    },
  { key: 'london',   label: 'London'   },
  { key: 'new_york', label: 'New York' },
  { key: 'overlap',  label: 'Overlap'  },
];

function calcRR(direction, entry, tp, sl) {
  const e = parseFloat(entry), t = parseFloat(tp), s = parseFloat(sl);
  if (!e || !t || !s || isNaN(e) || isNaN(t) || isNaN(s)) return null;
  if (direction === 'buy') {
    const reward = t - e, risk = e - s;
    if (risk <= 0 || reward <= 0) return null;
    return reward / risk;
  } else {
    const reward = e - t, risk = s - e;
    if (risk <= 0 || reward <= 0) return null;
    return reward / risk;
  }
}

function fmtSession(s) {
  if (!s) return 'Not set';
  return s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ');
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skel({ theme, h = 32, w = '100%' }) {
  return <div style={{ height: h, width: w, borderRadius: 7, backgroundColor: theme.border, animation: 'pulse 1.5s ease-in-out infinite' }} />;
}

// ── Answer Buttons ────────────────────────────────────────────────────────────
function AnswerBtns({ value, onChange, theme }) {
  const btns = [
    { k: 'yes',  label: 'YES',  col: '#22c55e', bg: 'rgba(34,197,94,0.12)'  },
    { k: 'no',   label: 'NO',   col: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
    { k: 'skip', label: 'SKIP', col: theme.muted, bg: theme.border },
  ];
  return (
    <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
      {btns.map(b => (
        <button key={b.k} type="button" onClick={() => onChange(b.k)}
          style={{
            flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            border: `1.5px solid ${value === b.k ? b.col : theme.border}`,
            backgroundColor: value === b.k ? b.bg : 'transparent',
            color: value === b.k ? b.col : theme.muted,
            transition: 'all 0.15s',
          }}>
          {b.label}
        </button>
      ))}
    </div>
  );
}

// ── Question Card ─────────────────────────────────────────────────────────────
function QCard({ num, question, explanation, children, theme }) {
  return (
    <div style={{ borderRadius: 10, border: `1px solid ${theme.border}`, backgroundColor: theme.surface2 || theme.surface, padding: 16, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <div style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: theme.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: theme.muted, flexShrink: 0, marginTop: 2 }}>
          {num}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, lineHeight: 1.45 }}>{question}</div>
          {explanation && <div style={{ fontSize: 11, color: theme.muted, marginTop: 3, lineHeight: 1.5 }}>{explanation}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

// ── Hint pill ─────────────────────────────────────────────────────────────────
function Hint({ color, children }) {
  const bg  = color === 'green' ? 'rgba(34,197,94,0.1)'   : color === 'red' ? 'rgba(239,68,68,0.1)'   : 'rgba(245,158,11,0.1)';
  const brd = color === 'green' ? 'rgba(34,197,94,0.25)'  : color === 'red' ? 'rgba(239,68,68,0.25)'  : 'rgba(245,158,11,0.25)';
  const col = color === 'green' ? '#22c55e'                : color === 'red' ? '#ef4444'                : '#f59e0b';
  return (
    <div style={{ padding: '7px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, backgroundColor: bg, color: col, border: `1px solid ${brd}`, marginTop: 6, lineHeight: 1.45 }}>
      {children}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function PreTradeChecklist({ direction, entry_price, tp, sl, strategy, session, emotional_state, onClose }) {
  const theme       = useTheme();
  const { token }   = useAuth();
  const hdrs        = token ? { Authorization: `Bearer ${token}` } : {};
  const warningColor = theme.isDark ? '#f59e0b' : '#b45309';
  const warningBg = theme.isDark ? 'rgba(245,158,11,0.08)' : '#fff7ed';
  const warningBorder = theme.isDark ? 'rgba(245,158,11,0.3)' : '#fdba74';

  const [screen,           setScreen]           = useState('questions'); // 'questions' | 'result'
  const [answers,          setAnswers]          = useState({ q1: null, q2: null, q3: null, q4: null, q5: null, q6: null });
  const [selEmotion,       setSelEmotion]       = useState(emotional_state || 'calm');
  const [selStrategy,      setSelStrategy]      = useState(strategy || '');
  const [macroData,        setMacroData]        = useState(null);
  const [trades,           setTrades]           = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [saving,           setSaving]           = useState(false);

  const setAns = (q, v) => setAnswers(p => ({ ...p, [q]: v }));

  // ── Fetch data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    Promise.allSettled([
      fetch(`${API_URL}/api/economic/macro-score`, { headers: hdrs }).then(r => r.json()),
      fetch(`${API_URL}/api/journal/trades?limit=300`, { headers: hdrs }).then(r => r.json()),
    ]).then(([macro, journal]) => {
      if (macro.status === 'fulfilled' && macro.value?.score !== undefined) setMacroData(macro.value);
      if (journal.status === 'fulfilled' && Array.isArray(journal.value?.data))  setTrades(journal.value.data);
      setLoading(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-seed Q2 from initial emotional_state
  useEffect(() => {
    if (emotional_state) {
      setSelEmotion(emotional_state);
      setAns('q2', GOOD_EMOTIONS.has(emotional_state) ? 'yes' : BAD_EMOTIONS.has(emotional_state) ? 'no' : null);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-answer Q6 once trades are loaded
  useEffect(() => {
    if (!loading) {
      const todayStr    = new Date().toISOString().slice(0, 10);
      const todayLosses = trades.filter(t => t.created_at?.startsWith(todayStr) && t.outcome === 'loss').length;
      setAns('q6', todayLosses >= 2 ? 'no' : 'yes');
    }
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Transition to result when all answered
  useEffect(() => {
    const allDone = Object.values(answers).every(v => v !== null);
    if (allDone && screen === 'questions') {
      const t = setTimeout(() => setScreen('result'), 350);
      return () => clearTimeout(t);
    }
  }, [answers, screen]);

  // ── Derived data ─────────────────────────────────────────────────────────────
  const rr = calcRR(direction, entry_price, tp, sl);

  const todayStr    = new Date().toISOString().slice(0, 10);
  const todayLosses = trades.filter(t => t.created_at?.startsWith(todayStr) && t.outcome === 'loss').length;

  const sessionStats = {};
  SESSIONS_DEF.forEach(s => {
    const st     = trades.filter(t => t.session === s.key);
    const wins   = st.filter(t => t.outcome === 'win').length;
    const closed = st.filter(t => t.outcome === 'win' || t.outcome === 'loss').length;
    sessionStats[s.key] = { wins, closed, rate: closed >= 3 ? Math.round((wins / closed) * 100) : null };
  });
  const bestSession = Object.entries(sessionStats)
    .filter(([, v]) => v.rate !== null)
    .sort(([, a], [, b]) => b.rate - a.rate)[0]?.[0] ?? null;

  const stratStats = {};
  STRATEGIES.forEach(s => {
    const st     = trades.filter(t => t.strategy === s);
    const wins   = st.filter(t => t.outcome === 'win').length;
    const closed = st.filter(t => t.outcome === 'win' || t.outcome === 'loss').length;
    stratStats[s] = { wins, closed, rate: closed >= 3 ? Math.round((wins / closed) * 100) : null };
  });
  const selStratRate = selStrategy ? (stratStats[selStrategy]?.rate ?? null) : null;

  const macroScore    = macroData?.score ?? null;
  const macroLabel    = macroScore !== null
    ? (macroScore > 2 ? 'Bullish' : macroScore < -2 ? 'Bearish' : 'Neutral')
    : null;
  const macroSupports = macroScore !== null
    ? (direction === 'buy' ? macroScore > 0 : macroScore < 0)
    : null;

  // ── Score ────────────────────────────────────────────────────────────────────
  const score =
    (answers.q1 === 'yes' ? 20 : 0) +
    (answers.q2 === 'yes' ? 20 : 0) +
    (answers.q3 === 'yes' ? 20 : 0) +
    (answers.q4 === 'yes' ? 15 : 0) +
    (answers.q5 === 'yes' ? 15 : 0) +
    (answers.q6 === 'yes' ? 10 : 0);

  const failedFactors = [
    answers.q1 === 'no' && 'Macro environment opposes this trade direction',
    answers.q2 === 'no' && 'Emotional state is not ideal for trading',
    answers.q3 === 'no' && 'Risk:Reward is below 1:1.5',
    answers.q4 === 'no' && 'Strategy may not have edge for this setup',
    answers.q5 === 'no' && 'Not your best session for trading',
    answers.q6 === 'no' && 'You\'ve hit your daily loss limit',
  ].filter(Boolean);

  const recommendation = score >= 80 ? 'green_light' : score >= 50 ? 'caution' : 'skip';

  const RESULT = {
    green_light: { Icon: CheckCircle, title: 'Green Light',           msg: 'Everything checks out. Trade with confidence but stick to your plan.', col: '#22c55e', bg: 'rgba(34,197,94,0.08)',  brd: 'rgba(34,197,94,0.3)'  },
    caution:     { Icon: AlertTriangle, title: 'Proceed with Caution',  msg: 'Some factors are against you. Reduce position size by 50%.',            col: warningColor, bg: warningBg, brd: warningBorder },
    skip:        { Icon: XCircle,      title: 'Consider Skipping',     msg: 'Multiple factors suggest this is not an ideal setup. Wait for better conditions.', col: '#ef4444', bg: 'rgba(239,68,68,0.08)', brd: 'rgba(239,68,68,0.3)' },
  };

  // ── Save + close ──────────────────────────────────────────────────────────────
  const saveAndClose = async (proceeded) => {
    setSaving(true);
    try {
      await fetch(`${API_URL}/api/checklist`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...hdrs },
        body:    JSON.stringify({ score, answers: JSON.stringify(answers), recommendation, proceeded: proceeded ? 1 : 0 }),
      });
    } catch { /* non-critical */ }
    setSaving(false);
    onClose();
  };

  const answeredCount = Object.values(answers).filter(v => v !== null).length;
  const allAnswered   = answeredCount === 6;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }`}</style>

      {/* Overlay */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        {/* Modal card */}
        <div style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 14, width: '100%', maxWidth: 500, maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.55)', overflow: 'hidden' }}>

          {/* ── Sticky header ── */}
          <div style={{ padding: '18px 20px 14px', borderBottom: `1px solid ${theme.border}`, flexShrink: 0, backgroundColor: theme.surface }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: theme.text }}><Target size={15} style={{display:'inline-block',verticalAlign:'middle',marginRight:'5px'}} />Pre-Trade Checklist</div>
                <div style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>Answer honestly before you trade</div>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.muted, fontSize: 22, lineHeight: 1, padding: '0 2px', marginTop: -2 }}>×</button>
            </div>

            {/* Progress bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: theme.muted }}>{answeredCount} / 6 answered</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: answeredCount === 6 ? '#CA8A04' : theme.muted }}>{Math.round((answeredCount / 6) * 100)}%</span>
              </div>
              <div style={{ height: 5, borderRadius: 5, backgroundColor: theme.border, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 5, width: `${(answeredCount / 6) * 100}%`, backgroundColor: '#CA8A04', transition: 'width 0.35s ease' }} />
              </div>
            </div>
          </div>

          {/* ── Scrollable body ── */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 20px' }}>

            {screen === 'questions' ? (
              <>
                {/* ── Q1 — Macro Alignment ── */}
                <QCard num={1} question="Does the macro environment support your trade direction?" explanation="Trading with macro gives statistically better outcomes." theme={theme}>
                  {loading ? <Skel theme={theme} h={48} /> : macroData ? (
                    <div style={{ padding: '9px 12px', borderRadius: 8, backgroundColor: theme.bg, border: `1px solid ${theme.border}`, fontSize: 12, marginBottom: 2 }}>
                      <div style={{ fontWeight: 700, color: theme.text, marginBottom: 4 }}>
                        Macro score: <span style={{ color: macroScore > 0 ? '#22c55e' : macroScore < 0 ? '#ef4444' : '#f59e0b' }}>
                          {macroScore > 0 ? '+' : ''}{macroScore?.toFixed(1)}
                        </span>{' '}({macroLabel})
                      </div>
                      <div style={{ fontWeight: 600, color: macroSupports ? '#22c55e' : '#f59e0b' }}>
                        {macroSupports ? <><Check size={11} color="#22c55e" style={{display:'inline-block',verticalAlign:'middle',marginRight:2}}/> Macro supports {direction?.toUpperCase()}</> : <><AlertTriangle size={11} color="#f59e0b" style={{display:'inline-block',verticalAlign:'middle',marginRight:2}}/> Macro opposes {direction?.toUpperCase()}</>}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: theme.muted, marginBottom: 2 }}><Lock size={11} style={{display:'inline-block',verticalAlign:'middle',marginRight:3}}/> Macro score requires Pro/Elite plan</div>
                  )}
                  <AnswerBtns value={answers.q1} onChange={v => setAns('q1', v)} theme={theme} />
                </QCard>

                {/* ── Q2 — Emotional State ── */}
                <QCard num={2} question="Are you in a calm, focused state right now?" explanation="Emotional trades are your biggest source of losses." theme={theme}>
                  <div style={{ fontSize: 11, color: theme.muted, marginBottom: 6 }}>Your emotional state right now:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 4 }}>
                    {EMOTIONS.map(em => {
                      const isBad  = BAD_EMOTIONS.has(em);
                      const active = selEmotion === em;
                      return (
                        <button key={em} type="button"
                          onClick={() => {
                            setSelEmotion(em);
                            setAns('q2', GOOD_EMOTIONS.has(em) ? 'yes' : BAD_EMOTIONS.has(em) ? 'no' : null);
                          }}
                          style={{
                            padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                            border: `1.5px solid ${active ? (isBad ? '#ef4444' : '#22c55e') : theme.border}`,
                            backgroundColor: active ? (isBad ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)') : 'transparent',
                            color: active ? (isBad ? '#ef4444' : '#22c55e') : theme.muted,
                            transition: 'all 0.15s',
                          }}>
                          {em.charAt(0).toUpperCase() + em.slice(1)}
                        </button>
                      );
                    })}
                  </div>
                  {selEmotion && BAD_EMOTIONS.has(selEmotion) && (
                    <Hint color="red"><AlertTriangle size={11} style={{display:'inline-block',verticalAlign:'middle',marginRight:3}}/> Your win rate drops significantly when you're {selEmotion}</Hint>
                  )}
                  <AnswerBtns value={answers.q2} onChange={v => setAns('q2', v)} theme={theme} />
                </QCard>

                {/* ── Q3 — Risk:Reward ── */}
                <QCard num={3} question="Is your Risk:Reward at least 1:1.5?" explanation="Trades below 1:1.5 RR hurt your long-term profit factor." theme={theme}>
                  {rr !== null ? (
                    <div style={{ padding: '9px 12px', borderRadius: 8, backgroundColor: theme.bg, border: `1px solid ${theme.border}`, fontSize: 12, marginBottom: 2 }}>
                      <span style={{ color: theme.muted }}>Calculated R:R — </span>
                      <span style={{ fontWeight: 700, color: rr >= 1.5 ? '#22c55e' : rr >= 1 ? '#f59e0b' : '#ef4444' }}>1:{rr.toFixed(2)}</span>
                      <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, color: rr >= 1.5 ? '#22c55e' : rr >= 1 ? '#f59e0b' : '#ef4444' }}>
                        {rr >= 1.5 ? <><Check size={11} color="#22c55e" style={{display:'inline-block',verticalAlign:'middle',marginRight:2}}/> Good RR</> : rr >= 1 ? <><AlertTriangle size={11} color="#f59e0b" style={{display:'inline-block',verticalAlign:'middle',marginRight:2}}/> Acceptable but not ideal</> : <><XCircle size={11} color="#ef4444" style={{display:'inline-block',verticalAlign:'middle',marginRight:2}}/> Poor RR — consider skipping</>}
                      </span>
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: theme.muted, padding: '4px 0 2px' }}>
                      Enter Entry, TP and SL in the form to see your R:R automatically
                    </div>
                  )}
                  <AnswerBtns value={answers.q3} onChange={v => setAns('q3', v)} theme={theme} />
                </QCard>

                {/* ── Q4 — Strategy ── */}
                <QCard num={4} question="Does this trade match your trading plan?" explanation="Stick to strategies where you have a proven edge." theme={theme}>
                  <div style={{ fontSize: 11, color: theme.muted, marginBottom: 5 }}>Strategy:</div>
                  <select value={selStrategy} onChange={e => setSelStrategy(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.text, fontSize: 12, outline: 'none', cursor: 'pointer' }}>
                    <option value="">— Select strategy —</option>
                    {STRATEGIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {selStrategy && (
                    <div style={{ marginTop: 6, fontSize: 11 }}>
                      {selStratRate !== null
                        ? <span style={{ fontWeight: 700, color: selStratRate >= 50 ? '#22c55e' : '#ef4444' }}>
                            Your {selStrategy} win rate: {selStratRate}% {selStratRate >= 50 ? <Check size={11} color="#22c55e" style={{display:'inline-block',verticalAlign:'middle',marginLeft:2}}/> : <><AlertTriangle size={11} color="#ef4444" style={{display:'inline-block',verticalAlign:'middle',marginRight:2}}/> Below 50%</>}
                          </span>
                        : <span style={{ color: theme.muted }}>Not enough data for {selStrategy} yet (need 3+ closed trades)</span>
                      }
                    </div>
                  )}
                  <AnswerBtns value={answers.q4} onChange={v => setAns('q4', v)} theme={theme} />
                </QCard>

                {/* ── Q5 — Session ── */}
                <QCard num={5} question="Are you trading in your best session?" explanation="Trading in your strongest session improves win rate." theme={theme}>
                  {loading ? <Skel theme={theme} h={48} /> : (
                    <>
                      <div style={{ fontSize: 11, color: theme.muted, marginBottom: 5 }}>
                        Selected session: <span style={{ fontWeight: 700, color: theme.text }}>{fmtSession(session)}</span>
                      </div>
                      {bestSession ? (
                        <div style={{ padding: '8px 11px', borderRadius: 8, backgroundColor: theme.bg, border: `1px solid ${theme.border}`, fontSize: 11 }}>
                          <div style={{ marginBottom: 4 }}>
                            <Trophy size={11} style={{display:'inline-block',verticalAlign:'middle',marginRight:4,color:'#22c55e'}}/> Best session: <span style={{ fontWeight: 700, color: '#22c55e' }}>{fmtSession(bestSession)} ({sessionStats[bestSession]?.rate}% win rate)</span>
                          </div>
                          {session === bestSession
                            ? <div style={{ fontWeight: 600, color: '#22c55e' }}><Check size={11} color="#22c55e" style={{display:'inline-block',verticalAlign:'middle',marginRight:3}}/> This is your strongest session</div>
                            : <div style={{ fontWeight: 600, color: '#f59e0b' }}>
                                <AlertTriangle size={11} color="#f59e0b" style={{display:'inline-block',verticalAlign:'middle',marginRight:3}}/> Your win rate in {fmtSession(session)} is {sessionStats[session]?.rate !== null ? `${sessionStats[session]?.rate}%` : 'unknown (not enough data)'}
                              </div>
                          }
                        </div>
                      ) : (
                        <div style={{ fontSize: 11, color: theme.muted }}>Not enough data yet — log more trades with session tags</div>
                      )}
                    </>
                  )}
                  <AnswerBtns value={answers.q5} onChange={v => setAns('q5', v)} theme={theme} />
                </QCard>

                {/* ── Q6 — Daily Losses (auto) ── */}
                <QCard num={6} question="Are you within your daily loss limit?" explanation="Loss streaks tend to worsen after 2 consecutive losses." theme={theme}>
                  {loading ? <Skel theme={theme} h={40} /> : todayLosses >= 2 ? (
                    <Hint color="red"><AlertTriangle size={11} style={{display:'inline-block',verticalAlign:'middle',marginRight:3}}/> You've had {todayLosses} loss{todayLosses > 1 ? 'es' : ''} today. Consider stopping — your data shows loss streaks get worse after 2 losses.</Hint>
                  ) : (
                    <Hint color="green"><Check size={11} color="#22c55e" style={{display:'inline-block',verticalAlign:'middle',marginRight:3}}/> You're within safe limits today ({todayLosses} {todayLosses === 1 ? 'loss' : 'losses'} so far)</Hint>
                  )}
                  <AnswerBtns value={answers.q6} onChange={v => setAns('q6', v)} theme={theme} />
                  <div style={{ fontSize: 10, color: theme.muted, marginTop: 4 }}>Auto-answered from your journal · tap to override</div>
                </QCard>

                {allAnswered
                  ? <button type="button" onClick={() => setScreen('result')}
                      style={{ width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, backgroundColor: '#059669', color: '#fff', marginTop: 4 }}>
                      See My Score →
                    </button>
                  : <div style={{ textAlign: 'center', fontSize: 12, color: theme.muted, padding: '6px 0 2px' }}>Answer all questions to see your score</div>
                }
              </>
            ) : (
              /* ── Result screen ── */
              (() => {
                const cfg = RESULT[recommendation];
                return (
                  <div>
                    {/* Score card */}
                    <div style={{ borderRadius: 12, padding: 22, border: `1px solid ${cfg.brd}`, backgroundColor: cfg.bg, textAlign: 'center', marginBottom: 16 }}>
                      <div style={{ fontSize: 52, fontWeight: 800, color: cfg.col, lineHeight: 1, marginBottom: 4 }}>{score}</div>
                      <div style={{ fontSize: 12, color: theme.muted, marginBottom: 12 }}>out of 100</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: cfg.col }}><cfg.Icon size={18} color={cfg.col} style={{display:'inline-block',verticalAlign:'middle',marginRight:6}}/> {cfg.title}</div>
                      <div style={{ fontSize: 13, color: theme.text, marginTop: 8, lineHeight: 1.6 }}>{cfg.msg}</div>
                    </div>

                    {/* Score breakdown */}
                    <div style={{ borderRadius: 10, border: `1px solid ${theme.border}`, padding: '12px 14px', marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: theme.muted, marginBottom: 8 }}>Score breakdown</div>
                      {[
                        { label: 'Macro aligned',     pts: 20, ans: answers.q1 },
                        { label: 'Emotional state',   pts: 20, ans: answers.q2 },
                        { label: 'R:R ≥ 1:1.5',       pts: 20, ans: answers.q3 },
                        { label: 'Strategy match',    pts: 15, ans: answers.q4 },
                        { label: 'Best session',      pts: 15, ans: answers.q5 },
                        { label: 'Within loss limit', pts: 10, ans: answers.q6 },
                      ].map(row => (
                        <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: 12, color: row.ans === 'yes' ? theme.text : theme.muted }}>
                            {row.ans === 'yes' ? <Check size={11} color="#22c55e" style={{display:'inline-block',verticalAlign:'middle'}}/> : row.ans === 'skip' ? <span style={{fontWeight:700,color:'#9ca3af'}}>–</span> : <span style={{fontWeight:700,color:'#ef4444'}}>✕</span>} {row.label}
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: row.ans === 'yes' ? '#22c55e' : theme.muted }}>
                            {row.ans === 'yes' ? `+${row.pts}` : '+0'} / {row.pts}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Failed factors */}
                    {failedFactors.length > 0 && (
                      <div style={{ borderRadius: 10, border: '1px solid rgba(239,68,68,0.25)', padding: '11px 14px', backgroundColor: 'rgba(239,68,68,0.05)', marginBottom: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#ef4444', marginBottom: 7 }}>Flags to review</div>
                        {failedFactors.map((f, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: i < failedFactors.length - 1 ? 5 : 0 }}>
                            <span style={{ color: '#ef4444', fontSize: 12, flexShrink: 0, marginTop: 1 }}>✗</span>
                            <span style={{ fontSize: 12, color: theme.text, lineHeight: 1.45 }}>{f}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                      <button type="button" onClick={() => saveAndClose(false)} disabled={saving}
                        style={{ flex: 1, padding: '11px 0', borderRadius: 10, cursor: saving ? 'wait' : 'pointer', fontWeight: 700, fontSize: 13, border: `1px solid ${theme.border}`, backgroundColor: 'transparent', color: theme.muted, opacity: saving ? 0.6 : 1 }}>
                        Wait for Better Setup
                      </button>
                      <button type="button" onClick={() => saveAndClose(true)} disabled={saving}
                        style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: 'none', cursor: saving ? 'wait' : 'pointer', fontWeight: 700, fontSize: 13, backgroundColor: cfg.col, color: '#fff', opacity: saving ? 0.7 : 1 }}>
                        {saving ? 'Saving…' : 'Proceed Anyway'}
                      </button>
                    </div>

                    <button type="button" onClick={() => setScreen('questions')}
                      style={{ width: '100%', padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, color: theme.muted, backgroundColor: 'transparent', textDecoration: 'underline' }}>
                      ← Review answers
                    </button>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      </div>
    </>
  );
}

