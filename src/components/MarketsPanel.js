import React from 'react';

const MarketsPanel = ({ predictionMarkets, predictionSentiment }) => {
  const bullish = predictionSentiment >= 0.55;
  const bearish = predictionSentiment <= 0.45;
  const sentimentColor = bullish ? '#c8f559' : bearish ? '#ef4444' : '#fbbf24';
  const sentimentLabel = bullish ? 'BULLISH' : bearish ? 'BEARISH' : 'NEUTRAL';

  const formatVolume = (v) => {
    if (!v) return '—';
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
    return `$${v.toFixed(0)}`;
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px', alignItems: 'start' }}>

      {/* Left — Overall sentiment */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Big sentiment display */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: `1px solid ${sentimentColor}25`,
          borderRadius: '16px', padding: '28px',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '11px', color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px',
          }}>
            Crypto Market Sentiment
          </div>

          {/* Big number */}
          <div style={{
            fontSize: '64px', fontWeight: '900',
            color: sentimentColor,
            letterSpacing: '-3px',
            lineHeight: 1,
            marginBottom: '8px',
            textShadow: `0 0 30px ${sentimentColor}50`,
          }}>
            {Math.round(predictionSentiment * 100)}%
          </div>

          <div style={{
            fontSize: '18px', fontWeight: '700',
            color: sentimentColor,
            letterSpacing: '3px',
            marginBottom: '16px',
          }}>
            {sentimentLabel}
          </div>

          {/* Gradient bar */}
          <div style={{ position: 'relative', marginBottom: '8px' }}>
            <div style={{
              height: '8px', borderRadius: '4px',
              background: 'linear-gradient(90deg, #ef4444 0%, #fbbf24 50%, #c8f559 100%)',
              position: 'relative', overflow: 'visible',
            }}>
              <div style={{
                position: 'absolute',
                left: `${predictionSentiment * 100}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: '16px', height: '16px',
                borderRadius: '50%',
                background: '#fff',
                border: `3px solid ${sentimentColor}`,
                boxShadow: `0 0 12px ${sentimentColor}`,
                transition: 'left 0.6s ease',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
              <span style={{ fontSize: '10px', color: '#ef4444' }}>BEARISH</span>
              <span style={{ fontSize: '10px', color: '#c8f559' }}>BULLISH</span>
            </div>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px', lineHeight: '1.6' }}>
            Based on {predictionMarkets.length} active crypto prediction markets on Jupiter
          </div>
        </div>

        {/* How it affects Sentry */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px', padding: '20px',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>
            How This Affects Your Portfolio
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              {
                label: 'Sentry Score Impact',
                desc: `Market sentiment contributes 30% to every token's Sentry Score. Current ${sentimentLabel.toLowerCase()} reading ${bullish ? 'boosts' : bearish ? 'reduces' : 'neutrally affects'} all scores by up to ${Math.abs(Math.round((predictionSentiment - 0.5) * 30))} points.`,
              },
              {
                label: 'Signal Source',
                desc: 'Jupiter Prediction Markets API — real money is being bet on these outcomes. This is crowd wisdom with real financial stakes, not sentiment surveys.',
              },
              {
                label: 'Update Frequency',
                desc: 'Refreshed every 5 minutes. Significant sentiment shifts will change Sentry Score recommendations across your entire watchlist.',
              },
            ].map((item) => (
              <div key={item.label} style={{
                padding: '10px 12px',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '8px',
              }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Individual markets */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '16px', padding: '24px',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '2px' }}>
              Active Prediction Markets
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Live markets from Jupiter Prediction API — real capital at stake
            </div>
          </div>
          <div style={{
            fontSize: '11px', color: '#c8f559',
            background: 'rgba(200,245,89,0.1)',
            padding: '4px 10px', borderRadius: '4px', fontWeight: '600',
          }}>
            LIVE
          </div>
        </div>

        {predictionMarkets.length === 0 ? (
          <div style={{
            padding: '48px', textAlign: 'center',
            color: 'var(--text-muted)', fontSize: '13px',
          }}>
            No active prediction markets returned from Jupiter API.
            <div style={{ marginTop: '8px', fontSize: '11px' }}>
              This will be documented in the DX report.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {predictionMarkets.map((market, i) => {
              const yesPercent = Math.round(market.yesProbability * 100);
              const noPercent = 100 - yesPercent;
              const mBullish = market.yesProbability >= 0.55;
              const mBearish = market.yesProbability <= 0.45;
              const mColor = mBullish ? '#c8f559' : mBearish ? '#ef4444' : '#fbbf24';
              const mLabel = mBullish ? 'BULLISH' : mBearish ? 'BEARISH' : 'NEUTRAL';

              return (
                <div key={i} style={{
                  background: 'rgba(0,0,0,0.25)',
                  border: `1px solid ${mColor}20`,
                  borderRadius: '12px', padding: '16px',
                  transition: 'all 0.15s ease',
                }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.25)'}
                >
                  {/* Market title + signal */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{
                      fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)',
                      flex: 1, marginRight: '12px', lineHeight: '1.4',
                    }}>
                      {market.title}
                    </div>
                    <div style={{
                      fontSize: '11px', fontWeight: '700', color: mColor,
                      background: `${mColor}15`,
                      border: `1px solid ${mColor}30`,
                      padding: '3px 8px', borderRadius: '4px',
                      whiteSpace: 'nowrap', flexShrink: 0,
                    }}>
                      {mLabel}
                    </div>
                  </div>

                  {/* YES/NO bar */}
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{
                      display: 'flex', height: '8px',
                      borderRadius: '4px', overflow: 'hidden', gap: '2px',
                    }}>
                      <div style={{
                        width: `${yesPercent}%`,
                        background: '#c8f559',
                        borderRadius: '4px 0 0 4px',
                        transition: 'width 0.6s ease',
                        boxShadow: yesPercent > 60 ? '0 0 8px rgba(200,245,89,0.4)' : 'none',
                      }} />
                      <div style={{
                        width: `${noPercent}%`,
                        background: '#ef4444',
                        borderRadius: '0 4px 4px 0',
                        transition: 'width 0.6s ease',
                        boxShadow: noPercent > 60 ? '0 0 8px rgba(239,68,68,0.4)' : 'none',
                      }} />
                    </div>
                  </div>

                  {/* YES/NO labels */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#c8f559' }} />
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#c8f559' }}>
                          YES {yesPercent}%
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#ef4444' }} />
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#ef4444' }}>
                          NO {noPercent}%
                        </span>
                      </div>
                    </div>
                    {market.volume > 0 && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Vol: {formatVolume(market.volume)}
                      </span>
                    )}
                  </div>

                  {/* Sentry impact note */}
                  <div style={{
                    marginTop: '10px', paddingTop: '10px',
                    borderTop: '1px solid rgba(255,255,255,0.04)',
                    fontSize: '11px', color: 'var(--text-muted)',
                  }}>
                    This market {mBullish ? 'positively' : mBearish ? 'negatively' : 'neutrally'} contributes to Sentry Score sentiment signal (30% weight)
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketsPanel;