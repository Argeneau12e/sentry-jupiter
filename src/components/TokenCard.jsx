import React from 'react';

const ScoreRing = ({ score, size = 52 }) => {
  let color;
  if (score >= 70) color = 'var(--success)';
  else if (score >= 40) color = 'var(--warning)';
  else color = 'var(--danger)';

  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="4"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeLinecap="round"
          style={{
            filter: `drop-shadow(0 0 4px ${color})`,
            transition: 'stroke-dasharray 0.6s ease',
          }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '13px', fontWeight: '800', color,
      }}>
        {score}
      </div>
    </div>
  );
};

const TokenCard = ({ token, onSelect, isSelected }) => {
  const { sentry, threat } = token;
  const score = sentry?.score ?? 0;

  const zoneColor = score >= 70
    ? 'var(--success)'
    : score >= 40
    ? 'var(--warning)'
    : 'var(--danger)';

  const zoneBorder = score >= 70
    ? '#c8f559'
    : score >= 40
    ? '#fbbf24'
    : '#ef4444';

  return (
    <div
      onClick={() => onSelect(token)}
      style={{
        background: isSelected
          ? 'rgba(255,255,255,0.05)'
          : 'var(--bg-card)',
        border: `1px solid ${isSelected ? zoneBorder + '40' : 'var(--border)'}`,
        borderLeft: `3px solid ${zoneBorder}`,
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-4)',
        cursor: 'pointer',
        transition: 'all var(--transition-fast)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = 'var(--bg-card-hover)';
          e.currentTarget.style.borderColor = 'var(--border-hover)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = 'var(--bg-card)';
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        {/* Token logo */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {token.logoURI ? (
            <img
              src={token.logoURI}
              alt={token.symbol}
              style={{
                width: '40px', height: '40px',
                borderRadius: 'var(--radius-full)',
              }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div style={{
              width: '40px', height: '40px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', fontWeight: '700',
              color: 'var(--text-secondary)',
            }}>
              {token.symbol?.charAt(0) || '?'}
            </div>
          )}
        </div>

        {/* Token info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            gap: 'var(--space-2)', marginBottom: '2px',
          }}>
            <span style={{
              fontSize: '14px', fontWeight: '700',
              color: 'var(--text-primary)',
            }}>
              {token.symbol}
            </span>
            {token.isVerified && (
              <span style={{
                fontSize: '9px',
                background: 'var(--info-dim)',
                color: 'var(--info)',
                padding: '1px 5px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: '700',
              }}>
                VERIFIED
              </span>
            )}
            {threat?.level && threat.level !== 'LOW' && (
              <span style={{
                fontSize: '9px',
                background: `${threat.color}15`,
                color: threat.color,
                padding: '1px 6px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: '700',
                border: `1px solid ${threat.color}30`,
              }}>
                {threat.level}
              </span>
            )}
          </div>

          <div style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            marginBottom: 'var(--space-2)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {token.name}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span style={{
              fontSize: '15px', fontWeight: '700',
              color: 'var(--text-primary)',
            }}>
              {token.usdPrice !== null && token.usdPrice !== undefined
                ? token.usdPrice < 0.001
                  ? `$${token.usdPrice.toFixed(6)}`
                  : token.usdPrice < 1
                  ? `$${token.usdPrice.toFixed(4)}`
                  : `$${token.usdPrice.toFixed(2)}`
                : '—'}
            </span>
            {token.priceChange24h !== null && token.priceChange24h !== undefined && (
              <span style={{
                fontSize: '12px', fontWeight: '600',
                color: token.priceChange24h >= 0 ? 'var(--success)' : 'var(--danger)',
              }}>
                {token.priceChange24h >= 0 ? '+' : ''}
                {token.priceChange24h.toFixed(2)}%
              </span>
            )}
            {token.walletBalance !== null && token.walletBalance !== undefined && (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {token.walletBalance.toFixed(4)} held
              </span>
            )}
          </div>
        </div>

        {/* Score ring */}
        <ScoreRing score={score} size={52} />
      </div>

      {/* Organic score velocity */}
      {token.organicScoreVelocity !== 0 && token.organicScoreVelocity !== undefined && (
        <div style={{
          marginTop: 'var(--space-3)',
          fontSize: '11px',
          color: token.organicScoreVelocity > 0 ? 'var(--success)' : 'var(--danger)',
          display: 'flex', alignItems: 'center', gap: 'var(--space-1)',
        }}>
          <span>{token.organicScoreVelocity > 0 ? '▲' : '▼'}</span>
          <span>
            Organic score {token.organicScoreVelocity > 0 ? 'rising' : 'dropping'}{' '}
            {Math.abs(token.organicScoreVelocity).toFixed(1)} pts/hr
          </span>
        </div>
      )}

      {/* Recommendation footer */}
      <div style={{
        marginTop: 'var(--space-3)',
        padding: 'var(--space-2) var(--space-3)',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: 'var(--radius-md)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Sentry says
        </span>
        <span style={{
          fontSize: '11px', fontWeight: '700',
          color: sentry?.color || 'var(--text-secondary)',
          letterSpacing: '0.5px',
        }}>
          {sentry?.recommendation || '—'}
        </span>
      </div>
    </div>
  );
};

export default TokenCard;