import React, { useState, useRef, useEffect } from 'react';
import { askSentry } from '../services/sentryAI';

const SUGGESTED_QUESTIONS = [
  'What is the riskiest token in my portfolio right now?',
  'Should I be worried about anything?',
  'Which token has the best DCA entry signal?',
  'What does the prediction market sentiment mean for me?',
];

const SentryChat = ({ tokens, predictionSentiment, predictionMarkets }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `I'm Sentry, your AI DeFi guardian. I have live data on ${tokens.length} token${tokens.length !== 1 ? 's' : ''} in your portfolio. Ask me anything — what's risky, what to accumulate, what the markets are saying.`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [open, messages]);

  // Update greeting when token count changes
  useEffect(() => {
    if (tokens.length > 0) {
      setMessages([{
        role: 'assistant',
        content: `I'm Sentry, your AI DeFi guardian. I have live data on ${tokens.length} token${tokens.length !== 1 ? 's' : ''} in your portfolio. Ask me anything — what's risky, what to accumulate, what the markets are saying.`,
        timestamp: new Date(),
      }]);
    }
  }, [tokens.length]);

  const handleSend = async (question) => {
    const q = question || input.trim();
    if (!q || loading) return;

    setInput('');
    const userMessage = { role: 'user', content: q, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    const historyForAPI = messages
      .slice(1) // skip greeting
      .map((m) => ({ role: m.role, content: m.content }));

    const answer = await askSentry(q, tokens, predictionSentiment, predictionMarkets, historyForAPI);

    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: answer || 'I could not generate a response. Please try again.',
        timestamp: new Date(),
      },
    ]);
    setLoading(false);
  };

  const formatTime = (date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const criticalCount = tokens.filter((t) => t.threat?.level === 'CRITICAL').length;
  const highCount = tokens.filter((t) => t.threat?.level === 'HIGH').length;

  return (
    <>
      {/* Floating button */}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 200,
      }}>
        {/* Alert badge */}
        {(criticalCount > 0 || highCount > 0) && !open && (
          <div style={{
            position: 'absolute',
            top: '-6px',
            right: '-6px',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: criticalCount > 0 ? '#ef4444' : '#f97316',
            border: '2px solid #0a0b0d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: '800',
            color: '#fff',
            zIndex: 201,
            animation: 'pulse 1s ease-in-out infinite',
          }}>
            {criticalCount + highCount}
          </div>
        )}
        <button
          onClick={() => setOpen(!open)}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: open ? 'var(--bg-card)' : '#c8f559',
            border: open ? '1px solid rgba(255,255,255,0.1)' : 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            boxShadow: open ? 'none' : '0 4px 20px rgba(200,245,89,0.4)',
            transition: 'all 0.2s ease',
          }}
        >
          {open ? '×' : 'S'}
        </button>
      </div>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed',
          bottom: '92px',
          right: '24px',
          width: '380px',
          height: '520px',
          background: '#13151a',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          zIndex: 199,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          animation: 'slideUp 0.2s ease',
          overflow: 'hidden',
        }}>
          <style>{`
            @keyframes slideUp {
              from { opacity: 0; transform: translateY(12px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
          `}</style>

          {/* Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(200,245,89,0.04)',
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#c8f559',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: '900',
              color: '#000',
              flexShrink: 0,
            }}>
              S
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                Sentry AI
              </div>
              <div style={{ fontSize: '11px', color: '#c8f559' }}>
                Live data from Jupiter APIs
              </div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#c8f559',
                boxShadow: '0 0 6px #c8f559',
              }} />
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>online</span>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '85%',
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user'
                    ? '12px 12px 2px 12px'
                    : '12px 12px 12px 2px',
                  background: msg.role === 'user'
                    ? 'rgba(200,245,89,0.12)'
                    : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${msg.role === 'user' ? 'rgba(200,245,89,0.2)' : 'rgba(255,255,255,0.06)'}`,
                }}>
                  <div style={{
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    lineHeight: '1.6',
                  }}>
                    {msg.content}
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    marginTop: '4px',
                    textAlign: msg.role === 'user' ? 'right' : 'left',
                  }}>
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '10px 16px',
                  borderRadius: '12px 12px 12px 2px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#c8f559',
                      animation: `pulse 1s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested questions — show only on first message */}
          {messages.length === 1 && (
            <div style={{
              padding: '0 16px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}>
              {SUGGESTED_QUESTIONS.slice(0, 3).map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: 'var(--text-secondary)',
                    fontSize: '11px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(200,245,89,0.06)';
                    e.currentTarget.style.borderColor = 'rgba(200,245,89,0.2)';
                    e.currentTarget.style.color = '#c8f559';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            gap: '8px',
          }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSend(); }}
              placeholder="Ask Sentry anything..."
              disabled={loading}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                padding: '9px 12px',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none',
                transition: 'border-color 0.15s ease',
              }}
              onFocus={(e) => e.target.style.borderColor = 'rgba(200,245,89,0.4)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              style={{
                background: input.trim() && !loading ? '#c8f559' : 'rgba(255,255,255,0.06)',
                border: 'none',
                borderRadius: '8px',
                padding: '9px 14px',
                color: input.trim() && !loading ? '#000' : 'var(--text-muted)',
                fontSize: '13px',
                fontWeight: '700',
                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s ease',
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SentryChat;