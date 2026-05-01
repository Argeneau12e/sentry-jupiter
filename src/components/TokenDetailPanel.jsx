import React from 'react';

const formatNumber = (num) => {
  if (!num) return '—';
  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(2)}B`;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K`;
  return `$${num.toFixed(2)}`;
};

const TokenDetailPanel = ({ token, onClose }) => {
  if (!token) return null;
  const { sentry, threat, audit, stats24h } = token;

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-xl)',
      overflow: 'hidden',
      backdropFilter: 'var(--glass-blur)',
      WebkitBackdropFilter: 'var(--glass-blur)',
      animation: 'slideUp 0.25s ease',
    }}>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div style={{
        background: threat?.level === 'CRITICAL'
          ? 'rgba(239,68,68,0.06)'
          : threat?.level === 'HIGH'
          ? 'rgba(249,115,22,0.06)'
          : 'rgba(200,245,89,0.04)',
        borderBottom: '1px solid var(--border)',
        padding: 'var(--space-4)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          {token.logoURI ? (
            <img
              src={token.logoURI}
              alt={token.symbol}
              style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-full)' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div style={{
              width: '40px', height: '40px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px', fontWeight: '700', color: 'var(--text-secondary)',
            }}>
              {token.symbol?.charAt(0)}
            </div>
          )}
          <div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
              {token.name}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              {token.mint?.slice(0, 8)}...{token.mint?.slice(-6)}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '4px 10px',
            color: 'var(--text-muted)',
            cursor: 'pointer', fontSize: '16px',
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

        {/* Sentry Score bar */}
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sentry Score</span>
            <span style={{ fontSize: '13px', fontWeight: '700', color: sentry?.color }}>
              {sentry?.score ?? 0} / 100
            </span>
          </div>
          <div style={{
            height: '6px', background: 'rgba(255,255,255,0.06)',
            borderRadius: 'var(--radius-sm)', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${sentry?.score ?? 0}%`,
              background: sentry?.color || 'var(--success)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: `0 0 8px ${sentry?.color || 'var(--success)'}`,
              transition: 'width 0.6s ease',
            }} />
          </div>

          {/* Recommendation */}
          <div style={{
            marginTop: 'var(--space-3)',
            padding: 'var(--space-2) var(--space-3)',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 'var(--radius-md)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Recommendation
            </span>
            <span style={{
              fontSize: '12px', fontWeight: '700',
              color: sentry?.color, letterSpacing: '0.3px',
            }}>
              {sentry?.recommendation || '—'}
            </span>
          </div>

          {/* Score breakdown */}
          <div style={{
            marginTop: 'var(--space-3)',
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-2)',
          }}>
            {[
              {
                label: 'Organic',
                value: token.organicScore !== null ? token.organicScore?.toFixed(1) : '—',
                sub: '40% weight',
              },
              {
                label: 'Momentum',
                value: token.priceChange24h !== null
                  ? `${token.priceChange24h >= 0 ? '+' : ''}${token.priceChange24h?.toFixed(2)}%`
                  : '—',
                sub: '30% weight',
              },
              {
                label: 'Sentiment',
                value: `${Math.round((token.predictionSentiment || 0.5) * 100)}%`,
                sub: '30% weight',
              },
            ].map((item) => (
              <div key={item.label} style={{
                textAlign: 'center',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-2)',
              }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '3px' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {item.value}
                </div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{item.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Threat analysis */}
        {threat && (
          <div style={{
            background: threat.bgColor,
            border: `1px solid ${threat.borderColor}`,
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4)',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 'var(--space-3)',
            }}>
              <span style={{
                fontSize: '12px', fontWeight: '700',
                color: threat.color, letterSpacing: '0.5px',
              }}>
                THREAT: {threat.level}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {threat.label}
              </span>
            </div>

            {threat.warnings?.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {threat.warnings.map((w, i) => (
                  <div key={i} style={{
                    fontSize: '12px', color: 'var(--text-secondary)',
                    display: 'flex', gap: 'var(--space-2)',
                    background: 'rgba(0,0,0,0.2)',
                    padding: 'var(--space-2) var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                  }}>
                    <span style={{ color: threat.color, flexShrink: 0 }}>!</span>
                    {w}
                  </div>
                ))}
              </div>
            )}

            {threat.positives?.length > 0 && (
              <div style={{
                display: 'flex', flexDirection: 'column',
                gap: 'var(--space-2)', marginTop: 'var(--space-2)',
              }}>
                {threat.positives.map((p, i) => (
                  <div key={i} style={{
                    fontSize: '12px', color: 'var(--text-secondary)',
                    display: 'flex', gap: 'var(--space-2)',
                    background: 'rgba(0,0,0,0.2)',
                    padding: 'var(--space-2) var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                  }}>
                    <span style={{ color: 'var(--success)', flexShrink: 0 }}>✓</span>
                    {p}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Market stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)',
        }}>
          {[
            { label: 'Market Cap', value: formatNumber(token.mcap) },
            { label: 'Liquidity', value: formatNumber(token.liquidity) },
            { label: 'Holders', value: token.holderCount?.toLocaleString() || '—' },
            { label: '24h Volume', value: formatNumber(stats24h?.buyVolume) },
          ].map((item) => (
            <div key={item.label} style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3)',
            }}>
              <div style={{
                fontSize: '10px', color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.3px',
                marginBottom: 'var(--space-1)',
              }}>
                {item.label}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {/* Audit */}
        {audit && (
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4)',
          }}>
            <div style={{
              fontSize: '11px', color: 'var(--text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.5px',
              marginBottom: 'var(--space-3)',
            }}>
              Contract Audit
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {[
                { label: 'Mint Authority Disabled', value: audit.mintAuthorityDisabled },
                { label: 'Freeze Authority Disabled', value: audit.freezeAuthorityDisabled },
              ].map((row) => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {row.label}
                  </span>
                  <span style={{
                    fontSize: '11px', fontWeight: '700',
                    color: row.value ? 'var(--success)' : 'var(--danger)',
                    background: row.value ? 'var(--success-dim)' : 'var(--danger-dim)',
                    padding: '2px 8px', borderRadius: 'var(--radius-sm)',
                  }}>
                    {row.value ? 'SAFE' : 'RISK'}
                  </span>
                </div>
              ))}
              {audit.topHoldersPercentage !== undefined && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Top Holders Concentration
                  </span>
                  <span style={{
                    fontSize: '11px', fontWeight: '700',
                    color: audit.topHoldersPercentage > 40 ? 'var(--danger)' : 'var(--success)',
                  }}>
                    {audit.topHoldersPercentage.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 24h trading */}
        {stats24h && (
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4)',
          }}>
            <div style={{
              fontSize: '11px', color: 'var(--text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.5px',
              marginBottom: 'var(--space-3)',
            }}>
              24h Trading Activity
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
              {[
                { label: 'Buys', value: stats24h.numBuys?.toLocaleString() || '—', color: 'var(--success)' },
                { label: 'Sells', value: stats24h.numSells?.toLocaleString() || '—', color: 'var(--danger)' },
                { label: 'Traders', value: stats24h.numTraders?.toLocaleString() || '—', color: 'var(--text-secondary)' },
              ].map((item) => (
                <div key={item.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: item.color }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenDetailPanel;