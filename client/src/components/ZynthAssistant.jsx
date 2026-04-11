import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle, X, Send, ArrowUp } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config/api';

const PULSE_KEY = 'zynth_assistant_pulse_start';
const OPENED_KEY = 'zynth_assistant_ever_opened';
const PULSE_DAYS = 3;

const QUICK_CHIPS = [
  'How do I log a trade?',
  'How do I change my timezone?',
  'What is the Macro Score?',
  'How do I upgrade my plan?',
  'What is profit factor?',
];

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '10px 14px' }}>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          style={{
            width: 7, height: 7, borderRadius: '50%',
            backgroundColor: '#059669',
            display: 'inline-block',
            animation: `assistantBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

export default function ZynthAssistant() {
  const theme = useTheme();
  const { user, token } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  const [welcomeSent, setWelcomeSent] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // ── Pulse logic: show ring for first 3 days ──────────────────────────────
  useEffect(() => {
    const alreadyOpened = localStorage.getItem(OPENED_KEY);
    if (alreadyOpened) { setShowPulse(false); return; }

    let startTs = localStorage.getItem(PULSE_KEY);
    if (!startTs) {
      startTs = Date.now().toString();
      localStorage.setItem(PULSE_KEY, startTs);
    }
    const daysElapsed = (Date.now() - parseInt(startTs, 10)) / (1000 * 60 * 60 * 24);
    setShowPulse(daysElapsed < PULSE_DAYS);
  }, []);

  // ── Welcome message on first open ────────────────────────────────────────
  useEffect(() => {
    if (!open || welcomeSent) return;
    setWelcomeSent(true);
    localStorage.setItem(OPENED_KEY, '1');
    setShowPulse(false);

    const firstName = user?.name?.split(' ')[0] || user?.username || 'there';
    const welcome = {
      id: 'welcome',
      role: 'assistant',
      content: `Hello ${firstName}. I'm here to help you navigate Zynth.

    I can help with trade journaling, settings, analytics, plans, and platform tools.

    Ask a question below or use one of the suggested prompts.`,
      timestamp: new Date().toISOString(),
    };
    setMessages([welcome]);
  }, [open, welcomeSent, user]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
    }
  }, [messages, open, loading]);

  // ── Focus input when panel opens ─────────────────────────────────────────
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  // ── Get conversation history for API (role:model format for Gemini) ──────
  const getHistory = useCallback(() => {
    return messages
      .filter(m => m.id !== 'welcome')
      .slice(-10)
      .map(m => ({ role: m.role === 'user' ? 'user' : 'model', content: m.content }));
  }, [messages]);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;
    setInput('');

    const userMsg = { id: Date.now(), role: 'user', content: trimmed, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const resp = await fetch(`${API_URL}/api/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: trimmed, history: getHistory() }),
      });
      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.error || `HTTP ${resp.status}`);
      }

      const assistantMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.reply,
        timestamp: data.timestamp || new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const errMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `I am still learning and could not find a good answer for that.\n\nFor reliable help:\n- Use the Help Center from the sidebar\n- Or contact support at support@zynth.com\n\nI will get better over time!`,
        timestamp: new Date().toISOString(),
        isError: true,
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, getHistory]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Styles ────────────────────────────────────────────────────────────────
  const surface2 = theme.surface2;
  const borderColor = theme.border || (theme.isDark ? '#2e2e2e' : '#e5e7eb');
  const headerTitleColor = theme.isDark ? '#f8fbff' : '#0b0b0f';
  const headerSubtitleColor = theme.isDark ? 'rgba(239,246,255,0.82)' : '#475569';
  const headerCloseColor = theme.isDark ? 'rgba(239,246,255,0.78)' : '#64748b';
  const assistantBubbleBg = theme.isDark ? 'rgba(15,23,42,0.72)' : '#fafaf9';
  const assistantBubbleBorder = theme.isDark ? '1px solid rgba(148,163,184,0.14)' : `1px solid rgba(0,0,0,0.06)`;

  // ── Render ────────────────────────────────────────────────────────────────
  return createPortal(
    <>
      {/* Keyframe injection */}
      <style>{`
        @keyframes assistantPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(5,150,105,0.55); }
          50%       { box-shadow: 0 0 0 12px rgba(5,150,105,0); }
        }
        @keyframes assistantBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
          40%           { transform: scale(1);   opacity: 1;   }
        }
        .zynth-chip:hover {
          background: rgba(5,150,105,0.12) !important;
          border-color: #059669 !important;
          color: #059669 !important;
        }
        .zynth-send:hover { background: #047857 !important; }
        .zynth-close:hover { background: rgba(255,255,255,0.1) !important; }
        .zynth-fab:hover { transform: scale(1.08); }
        .zynth-fab { transition: transform 0.15s ease; }
        .zynth-msg { white-space: pre-wrap; word-break: break-word; }
        .zynth-msg-row { display: flex; flex-direction: column; gap: 4px; }
        .zynth-msg-row.user { align-items: flex-end; }
        .zynth-msg-row.bot { align-items: flex-start; }
        .zynth-bubble {
          max-width: 20rem;
          padding: 8px 16px;
          border-radius: 12px;
          font-size: 13px;
          line-height: 1.55;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .zynth-bubble.user {
          background: linear-gradient(135deg, #059669, #10b981);
          color: #ffffff;
          border-top-right-radius: 6px;
        }
        .zynth-bubble.bot {
          background: #f3f4f6;
          color: inherit;
          border: 1px solid rgba(0,0,0,0.06);
          border-top-left-radius: 6px;
        }
        .dark .zynth-bubble.bot {
          background: #161618;
          border: 1px solid rgba(148,163,184,0.22);
        }
      `}</style>

      {/* Backdrop — closes chat on click-outside */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
        />
      )}

      {/* Chat Panel */}
      {open && (
        <div
          className="chat-panel"
          style={{
            position: 'fixed',
            bottom: 90,
            right: 24,
            width: 360,
            height: 480,
            backgroundColor: theme.surface,
            border: `1px solid ${borderColor}`,
            borderRadius: 16,
            boxShadow: theme.isDark
              ? '0 32px 80px rgba(0,0,0,0.7), 0 4px 16px rgba(0,0,0,0.4)'
              : '0 32px 80px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '14px 16px',
            borderBottom: `1px solid ${borderColor}`,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: theme.isDark
              ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
              : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            flexShrink: 0,
          }}>
            {/* Logo icon */}
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <MessageCircle size={16} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>
                Zynth Assistant
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2, fontWeight: 500, letterSpacing: '0.01em' }}>
                Product Support and Guidance
              </div>
            </div>
            <button
              className="zynth-close"
              onClick={() => setOpen(false)}
              style={{
                width: 28, height: 28, borderRadius: 8, border: 'none',
                background: 'rgba(255,255,255,0.12)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.85)', flexShrink: 0,
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '14px 14px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}>
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div key={msg.id} className={`zynth-msg-row ${isUser ? 'user' : 'bot'}`}>
                  <div
                    className={`zynth-msg zynth-bubble ${isUser ? 'user' : 'bot'}`}
                    style={{
                      color: isUser ? '#fff' : theme.text,
                      opacity: msg.isError ? 0.75 : 1,
                    }}
                  >
                    {msg.content}
                  </div>
                  <span style={{ fontSize: 10, color: theme.muted, paddingLeft: 4, paddingRight: 4 }}>
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              );
            })}

            {/* Quick chips — only after welcome, no other messages yet */}
            {messages.length === 1 && messages[0]?.id === 'welcome' && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {QUICK_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    className="zynth-chip"
                    onClick={() => sendMessage(chip)}
                    style={{
                      padding: '5px 11px',
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 500,
                      cursor: 'pointer',
                      border: `1px solid ${borderColor}`,
                      background: 'transparent',
                      color: theme.muted,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {/* Typing indicator */}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div style={{
                  background: theme.isDark ? '#161618' : '#f3f4f6',
                  border: theme.isDark ? '1px solid rgba(148,163,184,0.22)' : '1px solid rgba(0,0,0,0.06)',
                  borderRadius: '12px 12px 12px 6px',
                  minWidth: 60,
                }}>
                  <TypingDots />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div style={{
            padding: '12px 14px',
            borderTop: `1px solid ${borderColor}`,
            display: 'flex',
            gap: 10,
            alignItems: 'flex-end',
            flexShrink: 0,
            background: theme.surface,
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about Zynth..."
              rows={1}
              disabled={loading}
              style={{
                flex: 1,
                resize: 'none',
                background: theme.isDark ? '#0b0b0f' : '#ffffff',
                border: `1px solid ${borderColor}`,
                borderRadius: 12,
                padding: '10px 13px',
                fontSize: 13,
                color: theme.text,
                outline: 'none',
                lineHeight: 1.5,
                maxHeight: 96,
                overflowY: 'auto',
                fontFamily: 'inherit',
                opacity: loading ? 0.6 : 1,
                boxShadow: theme.isDark ? 'inset 0 1px 2px rgba(0,0,0,0.25)' : 'inset 0 1px 2px rgba(15,23,42,0.05)',
              }}
              onFocus={e => { e.target.style.borderColor = '#059669'; e.target.style.boxShadow = '0 0 0 3px rgba(5,150,105,0.16)'; }}
              onBlur={e => { e.target.style.borderColor = borderColor; e.target.style.boxShadow = theme.isDark ? 'inset 0 1px 2px rgba(0,0,0,0.25)' : 'inset 0 1px 2px rgba(15,23,42,0.05)'; }}
              onInput={e => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
              }}
            />
            <button
              className="zynth-send"
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              style={{
                width: 38, height: 38, borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg, #059669, #10b981)',
                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                opacity: input.trim() && !loading ? 1 : 0.45,
                transition: 'background 0.15s ease, opacity 0.15s ease',
              }}
            >
              <ArrowUp size={16} color="#fff" />
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      <div style={{ position: 'fixed', bottom: isMobile ? 80 : 24, right: isMobile ? 16 : 24, zIndex: 9999 }}>
        {/* Tooltip */}
        {!open && (
          <div
            style={{
              position: 'absolute',
              bottom: '110%',
              right: 0,
              background: theme.surface2,
              color: '#fff',
              fontSize: 12,
              fontWeight: 500,
              padding: '5px 10px',
              borderRadius: 7,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              opacity: 0,
              transition: 'opacity 0.15s ease',
              marginBottom: 4,
            }}
            className="zynth-tooltip"
          >
            Ask Zynth Assistant
          </div>
        )}
        <style>{`
          .zynth-fab-wrap:hover .zynth-tooltip { opacity: 1 !important; }
        `}</style>
        <div className="zynth-fab-wrap">
          <button
            className="zynth-fab"
            onClick={() => setOpen(o => !o)}
            title="Ask Zynth Assistant"
            aria-label="Open Zynth Assistant"
            style={{
              width: 52, height: 52,
              borderRadius: '50%',
              border: 'none',
              background: open
                ? (theme.isDark ? 'linear-gradient(135deg, #374151, #1f2937)' : 'linear-gradient(135deg, #1e293b, #334155)')
                : 'linear-gradient(135deg, #059669, #10b981)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: open
                ? '0 4px 20px rgba(0,0,0,0.3)'
                : showPulse
                  ? '0 4px 20px rgba(5,150,105,0.5)'
                  : '0 4px 20px rgba(5,150,105,0.35)',
              animation: showPulse && !open ? 'assistantPulse 2s ease-in-out infinite' : 'none',
              position: 'relative',
            }}
          >
            {open
              ? <X size={22} color="#fff" />
              : <MessageCircle size={22} color="#fff" />
            }
            {/* BETA badge */}
            {!open && (
              <span style={{
                position: 'absolute', top: -4, left: -2,
                background: '#ffffff',
                color: '#059669',
                fontSize: 9, fontWeight: 800,
                padding: '1px 5px',
                borderRadius: 10,
                letterSpacing: '0.04em',
                lineHeight: 1.6,
                pointerEvents: 'none',
                userSelect: 'none',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              }}>BETA</span>
            )}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
