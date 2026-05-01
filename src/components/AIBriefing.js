import React, { useState, useEffect } from 'react';
import { generatePortfolioBriefing } from '../services/sentryAI';

const AIBriefing = ({ tokens, predictionSentiment, predictionMarkets }) => {
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastGenerated, setLastGenerated] = useState(null);

  const criticalCount = tokens.filter((t) => t.threat?.level === 'CRITICAL').length;
  const highCount = tokens.filter((t) => t.threat?.level === 'HIGH').length;

  const borderColor = criticalCount > 0
    ? '#ef4444'
    : highCount > 0
    ? '#f97316'
    : '#c8f559';

  const generateBriefing = async () => {
    if (tokens.length === 0) return;
    setLoading(true);
    const result = await generatePortfolioBriefing(tokens, predictionSentiment, predictionMarkets);
    if (result) {
      setBriefing(result);
      setLastGenerated(new Date());
    }
    setLoading(false);
  };

  useEffect(() => {
    if (tokens.length > 0 && !briefing) {
      generateBriefing();
    }
  }, [tokens.length]);

  if (tokens.length === 0) return null;

  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${borderColor}06, rgba(255,255,255,0.01))`,
        border: `1px solid ${borderColor}25`,
        borderLeft: `3px solid ${borderColor}`,
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-4) var(--space-5)',
        marginBottom: 'var(--space-6)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
        <div style={{
          width: '34px',
          height: '34px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--success)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '15px',
          fontWeight: '900',
          color: '#000',
          flexShrink: 0,
          marginTop: '2px',
        }}>
          S
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 'var(--space-2)',
            }}
          >
            <div
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Sentry AI — Portfolio Briefing
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              {lastGenerated && (
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  {lastGenerated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              <button
                onClick={generateBriefing}
                disabled={loading}
                style={{
                  background: 'rgba(200,245,89,0.1)',
                  border: '1px solid rgba(200,245,89,0.2)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '3px 8px',
                  color: '#c8f559',
                  fontSize: 'var(--text-xs)',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1,
                }}
              >
                {loading ? 'Analyzing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {loading && !briefing && (
            <div
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
            >
              <div style={{
                width: '12px',
                height: '12px',
                border: '2px solid rgba(255,255,255,0.1)',
                borderTopColor: 'var(--success)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                flexShrink: 0,
              }} />
              Sentry is analyzing your portfolio...
            </div>
          )}

          {briefing && (
            <div
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-primary)',
                lineHeight: '1.7',
                opacity: loading ? 0.5 : 1,
                transition: 'opacity 0.3s ease',
              }}
            >
              {briefing}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIBriefing;