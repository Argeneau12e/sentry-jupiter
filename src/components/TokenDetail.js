import React, { useState, useEffect } from 'react';
import { getSwapQuote, MINTS } from '../services/jupiterApi';

const StatBox = ({ label, value, color }) => (
  <div style={{
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '12px 16px',
  }}>
    <div style={{
      fontSize: '11px',
      color: 'var(--text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginBottom: '6px',
    }}>
      {label}
    </div>
    <div style={{
      fontSize: '16px',
      fontWeight: '700',
      color: color || 'var(--text-primary)',
    }}>
      {value}
    </div>
  </div>
);

const SentryScoreBar = ({ score }) => {
  let color;
  if (score >= 70) color = 'var(--accent-green)';
  else if (score >= 40) color = 'var(--accent-yellow)';
  else color = 'var(--accent-red)';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Sentry Score
        </span>
        <span style={{ fontSize: '13px', fontWeight: '700', color }}>
          {score} / 100
        </span>
      </div>
      <div style={{
        height: '6px',
        background: 'var(--bg-card-hover)',
        borderRadius: '3px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${score}%`,
          background: color,
          borderRadius: '3px',
          transition: 'width 0.6s ease',
          boxShadow: `0 0 8px ${color}`,
        }} />
      </div>
    </div>
  );
};

const formatNumber = (num) => {
  if (!num) return '—';
  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(2)}B`;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
};

const AuditRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{label}</span>
    <span style={{
      fontSize: '12px',
      fontWeight: '600',
      color: value ? 'var(--accent-green)' : 'var(--accent-red)',
      background: value ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
      padding: '2px 8px',
      borderRadius: '4px',
    }}>
      {value ? 'YES' : 'NO'}
    </span>
  </div>
);

const TokenDetail = ({ token, predictionMarkets = [] }) => {
  const [swapQuote, setSwapQuote] = useState(null);
  const [swapLoading, setSwapLoading] = useState(false);

  // Fetch swap quote when token changes and action is swap
  useEffect(() => {
    if (!token) return;
    if (token.sentry?.action !== 'swap') {
      setSwapQuote(null);
      return;
    }

    const fetchQuote = async () => {
      setSwapLoading(true);
      const quote = await getSwapQuote(token.mint, MINTS.USDC, 1, token.decimals);
      setSwapQuote(quote);
      setSwapLoading(false);
    };

    fetchQuote();
  }, [token?.mint, token?.sentry?.action]);

  if (!token) return null;

  const { sentry, stats24h, audit } = token;

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '24px',
    }}>

      {/* Token header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '24px',
      }}>
        {token.logoURI ? (
          <img
            src={token.logoURI}
            alt={token.symbol}
            style={{ width: '44px', height: '44px', borderRadius: '50%' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'var(--bg-card-hover)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: '700',
            color: 'var(--text-secondary)',
          }}>
            {token.symbol?.charAt(0)}
          </div>
        )}
        <div>
          <div style={{
            fontSize: '18px',
            fontWeight: '700',
            color: 'var(--text-primary)',
          }}>
            {token.name}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {token.mint?.slice(0, 8)}...{token.mint?.slice(-6)}
          </div>
        </div>
      </div>

      {/* Sentry Score bar */}
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '16px',
        marginBottom: '16px',
      }}>
        <SentryScoreBar score={sentry?.score ?? 0} />

        {/* Recommendation */}
        <div style={{
          marginTop: '16px',
          padding: '10px 14px',
          background: 'var(--bg-card)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Sentry Recommendation
          </span>
          <span style={{
            fontSize: '13px',
            fontWeight: '700',
            color: sentry?.color || 'var(--text-primary)',
            letterSpacing: '0.3px',
          }}>
            {sentry?.recommendation || '—'}
          </span>
        </div>

        {/* Score breakdown */}
        <div style={{
          marginTop: '12px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '8px',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              marginBottom: '4px',
            }}>
              Organic Score
            </div>
            <div style={{
              fontSize: '13px',
              fontWeight: '600',
              color: 'var(--text-secondary)',
            }}>
              {token.organicScore !== null
                ? token.organicScore.toFixed(1)
                : '—'}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              40% weight
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              marginBottom: '4px',
            }}>
              Price Momentum
            </div>
            <div style={{
              fontSize: '13px',
              fontWeight: '600',
              color: 'var(--text-secondary)',
            }}>
              {token.priceChange24h !== null
                ? `${token.priceChange24h >= 0 ? '+' : ''}${token.priceChange24h?.toFixed(2)}%`
                : '—'}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              30% weight
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              marginBottom: '4px',
            }}>
              Market Sentiment
            </div>
            <div style={{
              fontSize: '13px',
              fontWeight: '600',
              color: 'var(--text-secondary)',
            }}>
              {predictionMarkets.length > 0
                ? `${Math.round(
                    (predictionMarkets.reduce(
                      (s, m) => s + m.yesProbability, 0
                    ) / predictionMarkets.length) * 100
                  )}% bull`
                : 'Neutral'}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              30% weight
            </div>
          </div>
        </div>
      </div>

      {/* Swap quote — only shown when recommendation is SWAP TO USDC */}
      {sentry?.action === 'swap' && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.06)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '10px',
          padding: '16px',
          marginBottom: '16px',
        }}>
          <div style={{
            fontSize: '12px',
            color: 'var(--accent-red)',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '10px',
          }}>
            Protective Exit Quote — Swap V2
          </div>

          {swapLoading && (
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Fetching best swap route...
            </div>
          )}

          {!swapLoading && swapQuote && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '13px',
              }}>
                <span style={{ color: 'var(--text-muted)' }}>
                  1 {token.symbol} converts to
                </span>
                <span style={{
                  color: 'var(--text-primary)',
                  fontWeight: '600',
                }}>
                  {swapQuote.outAmount
                    ? `${(parseInt(swapQuote.outAmount) / 1_000_000).toFixed(4)} USDC`
                    : swapQuote.outUsdValue
                    ? `$${swapQuote.outUsdValue.toFixed(4)} USDC`
                    : '—'}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '13px',
              }}>
                <span style={{ color: 'var(--text-muted)' }}>Price impact</span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {swapQuote.priceImpact !== undefined
                    ? `${(swapQuote.priceImpact * 100).toFixed(4)}%`
                    : swapQuote.priceImpactPct
                    ? `${parseFloat(swapQuote.priceImpactPct).toFixed(4)}%`
                    : '—'}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '13px',
              }}>
                <span style={{ color: 'var(--text-muted)' }}>Route</span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {swapQuote.routePlan?.[0]?.swapInfo?.label || 'Jupiter V2'}
                </span>
              </div>
              
                {React.createElement(
                'a',
                {
                  href: `https://jup.ag/swap/${token.symbol}-USDC`,
                  target: '_blank',
                  rel: 'noopener noreferrer',
                  style: {
                    marginTop: '4px',
                    display: 'block',
                    textAlign: 'center',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '6px',
                    padding: '8px',
                    fontSize: '12px',
                    color: 'var(--accent-red)',
                    textDecoration: 'none',
                    fontWeight: '600',
                  },
                },
                'Execute on Jupiter'
              )}
            </div>
          )}

          {!swapLoading && !swapQuote && (
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Swap quote unavailable for this token.
            </div>
          )}
        </div>
      )}

      {/* Prediction markets panel */}
      {predictionMarkets.length > 0 && (
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '16px',
          marginBottom: '16px',
        }}>
          <div style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Active Prediction Markets
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {predictionMarkets.map((market, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 10px',
                  background: 'var(--bg-card)',
                  borderRadius: '6px',
                  gap: '12px',
                }}
              >
                <span style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {market.title}
                </span>
                <span style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: market.yesProbability >= 0.55
                    ? 'var(--accent-green)'
                    : market.yesProbability <= 0.45
                    ? 'var(--accent-red)'
                    : 'var(--accent-yellow)',
                  whiteSpace: 'nowrap',
                }}>
                  {Math.round(market.yesProbability * 100)}% YES
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Market stats grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
        marginBottom: '16px',
      }}>
        <StatBox label="Market Cap" value={formatNumber(token.mcap)} />
        <StatBox label="Liquidity" value={formatNumber(token.liquidity)} />
        <StatBox
          label="Holders"
          value={token.holderCount
            ? token.holderCount.toLocaleString()
            : '—'}
        />
        <StatBox
          label="24h Buy Volume"
          value={formatNumber(stats24h?.buyVolume)}
        />
      </div>

      {/* 24h trading activity */}
      {stats24h && (
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '16px',
          marginBottom: '16px',
        }}>
          <div style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            24h Trading Activity
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '12px',
          }}>
            <div>
              <div style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                marginBottom: '4px',
              }}>
                Buys
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--accent-green)',
              }}>
                {stats24h.numBuys?.toLocaleString() || '—'}
              </div>
            </div>
            <div>
              <div style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                marginBottom: '4px',
              }}>
                Sells
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--accent-red)',
              }}>
                {stats24h.numSells?.toLocaleString() || '—'}
              </div>
            </div>
            <div>
              <div style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                marginBottom: '4px',
              }}>
                Traders
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
              }}>
                {stats24h.numTraders?.toLocaleString() || '—'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit info */}
      {audit && (
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '16px',
        }}>
          <div style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Contract Audit
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <AuditRow
              label="Mint Authority Disabled"
              value={audit.mintAuthorityDisabled}
            />
            <AuditRow
              label="Freeze Authority Disabled"
              value={audit.freezeAuthorityDisabled}
            />
            {audit.topHoldersPercentage !== undefined && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                }}>
                  Top Holders %
                </span>
                <span style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                }}>
                  {audit.topHoldersPercentage.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default TokenDetail;