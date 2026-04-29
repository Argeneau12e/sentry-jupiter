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

  // Generate on first load and when critical tokens change
  useEffect(() => {
    if (tokens.length > 0 && !briefing) {
      generateBriefing();
    }
  }, [tokens.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (tokens.length === 0) return null;

  return (
    <div style={{
      background: `linear-gradient(135deg, ${borderColor}06, rgba(255,255,255,0.01))`,
      border: `1px solid ${borderColor}25`,
      borderLeft: `3px solid ${borderColor}`,
      borderRadius: '12px',
      padding: '16px 20px',
      marginBottom: '24px',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{
          width: '34px',
          height: '34px',
          borderRadius: '50%',
          background: '#c8f559',
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
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '6px',
          }}>
            <div style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Sentry AI — Portfolio Briefing
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {lastGenerated && (
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {lastGenerated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              <button
                onClick={generateBriefing}
                disabled={loading}
                style={{
                  background: 'rgba(200,245,89,0.1)',
                  border: '1px solid rgba(200,245,89,0.2)',
                  borderRadius: '5px',
                  padding: '3px 8px',
                  color: '#c8f559',
                  fontSize: '10px',
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
            <div style={{
              fontSize: '13px',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                border: '2px solid rgba(255,255,255,0.1)',
                borderTopColor: '#c8f559',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                flexShrink: 0,
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              Sentry is analyzing your portfolio...
            </div>
          )}

          {briefing && (
            <div style={{
              fontSize: '14px',
              color: 'var(--text-primary)',
              lineHeight: '1.7',
              opacity: loading ? 0.5 : 1,
              transition: 'opacity 0.3s ease',
            }}>
              {briefing}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIBriefing;