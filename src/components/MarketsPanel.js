import React from 'react';

const MarketsPanel = ({ predictionMarkets, predictionSentiment }) => {
  const sentimentLabel = predictionSentiment >= 0.55
    ? 'BULLISH'
    : predictionSentiment <= 0.45
    ? 'BEARISH'
    : 'NEUTRAL';

  const sentimentColor = predictionSentiment >= 0.55
    ? '#c8f559'
    : predictionSentiment <= 0.45
    ? '#ef4444'
    : '#fbbf24';

  return (
    <div className="fade-in">
      {/* Market sentiment overview */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-6)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: sentimentColor,
              boxShadow: `0 0 12px ${sentimentColor}`,
              animation: 'pulse 2s ease-in-out infinite',
            }}
          />
          <div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Market Sentiment
            </div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: '700', color: sentimentColor }}>
              {sentimentLabel}
            </div>
          </div>
        </div>
      </div>

      {/* Prediction markets list */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
        {predictionMarkets.map((market, i) => (
          <div
            key={i}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-4)',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-hover)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: '600', color: 'var(--text-primary)' }}>
                {market.title}
              </h3>
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: '700',
                  color: market.yesProbability >= 0.55 ? 'var(--success)' : 'var(--danger)',
                  background: market.yesProbability >= 0.55 ? 'var(--success-dim)' : 'var(--danger-dim)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                {Math.round(market.yesProbability * 100)}% YES
              </span>
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
              {market.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketsPanel;