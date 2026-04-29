import React from 'react';

const ScoreBadge = ({ score }) => {
  let background, color;

  if (score >= 70) {
    background = 'rgba(16, 185, 129, 0.15)';
    color = 'var(--accent-green)';
  } else if (score >= 40) {
    background = 'rgba(245, 158, 11, 0.15)';
    color = 'var(--accent-yellow)';
  } else {
    background = 'rgba(239, 68, 68, 0.15)';
    color = 'var(--accent-red)';
  }

  return (
    <div style={{
      background,
      color,
      borderRadius: '6px',
      padding: '4px 10px',
      fontSize: '13px',
      fontWeight: '700',
      minWidth: '42px',
      textAlign: 'center',
    }}>
      {score}
    </div>
  );
};

const PriceChange = ({ value }) => {
  if (value === null || value === undefined) {
    return <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>—</span>;
  }

  const isPositive = value >= 0;
  const color = isPositive ? 'var(--accent-green)' : 'var(--accent-red)';
  const prefix = isPositive ? '+' : '';

  return (
    <span style={{ color, fontSize: '13px', fontWeight: '500' }}>
      {prefix}{value.toFixed(2)}%
    </span>
  );
};

const SkeletonRow = () => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 80px',
    alignItems: 'center',
    padding: '14px 20px',
    borderBottom: '1px solid var(--border)',
    gap: '12px',
  }}>
    {[180, 100, 90, 90, 120, 60].map((width, i) => (
      <div key={i} style={{
        height: '14px',
        width: `${width}px`,
        background: 'var(--bg-card-hover)',
        borderRadius: '4px',
        animation: 'pulse 1.5s ease-in-out infinite',
      }} />
    ))}
  </div>
);

const Watchlist = ({ tokens, loading, selectedMint, onSelect, onRemove }) => {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      overflow: 'hidden',
    }}>

      {/* Table header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 80px',
        padding: '12px 20px',
        borderBottom: '1px solid var(--border)',
        gap: '12px',
      }}>
        {['Token', 'Price', '24h Change', 'Organic Score', 'Sentry Score', 'Action'].map((col) => (
          <div key={col} style={{
            fontSize: '11px',
            fontWeight: '600',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            {col}
          </div>
        ))}
      </div>

      {/* Loading skeletons */}
      {loading && (
        <>
          <style>{`
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.4; }
            }
          `}</style>
          {[1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)}
        </>
      )}

      {/* Token rows */}
      {!loading && tokens.map((token) => {
        const isSelected = selectedMint === token.mint;

        return (
          <div
            key={token.mint}
            onClick={() => onSelect(token)}
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 80px',
              alignItems: 'center',
              padding: '14px 20px',
              borderBottom: '1px solid var(--border)',
              gap: '12px',
              cursor: 'pointer',
              background: isSelected ? 'var(--bg-card-hover)' : 'transparent',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
            }}
            onMouseLeave={(e) => {
              if (!isSelected) e.currentTarget.style.background = 'transparent';
            }}
          >
            {/* Token name + symbol */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {token.logoURI ? (
                <img
                  src={token.logoURI}
                  alt={token.symbol}
                  style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--bg-card-hover)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: 'var(--text-secondary)',
                }}>
                  {token.symbol?.charAt(0) || '?'}
                </div>
              )}
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {token.symbol}
                  {token.isVerified && (
                    <span style={{
                      marginLeft: '6px',
                      fontSize: '10px',
                      background: 'rgba(59, 130, 246, 0.15)',
                      color: 'var(--accent-blue)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: '600',
                    }}>
                      VERIFIED
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '1px' }}>
                  {token.name}
                </div>
              </div>
            </div>

            {/* Price */}
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
              {token.usdPrice !== null && token.usdPrice !== undefined
                ? `$${token.usdPrice < 0.01
                    ? token.usdPrice.toFixed(6)
                    : token.usdPrice.toFixed(2)}`
                : '—'}
            </div>

            {/* 24h change */}
            <PriceChange value={token.priceChange24h} />

            {/* Organic score */}
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {token.organicScore !== null
                ? `${token.organicScore.toFixed(1)} (${token.organicScoreLabel})`
                : '—'}
            </div>

            {/* Sentry score */}
            <ScoreBadge score={token.sentry?.score ?? 0} />

            {/* Remove button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(token.mint);
              }}
              style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '5px 10px',
                color: 'var(--text-muted)',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-red)';
                e.currentTarget.style.color = 'var(--accent-red)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              Remove
            </button>

          </div>
        );
      })}

      {/* Empty state */}
      {!loading && tokens.length === 0 && (
        <div style={{
          padding: '48px 24px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '14px',
        }}>
          No tokens in your watchlist. Click "Add Token" to get started.
        </div>
      )}

    </div>
  );
};

export default Watchlist;