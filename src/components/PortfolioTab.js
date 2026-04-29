import React, { useState } from 'react';
import AIBriefing from './AIBriefing';

const formatPrice = (price) => {
  if (price === null || price === undefined) return '—';
  if (price < 0.001) return `$${price.toFixed(6)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(2)}`;
};

const formatNumber = (num) => {
  if (!num) return '—';
  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(2)}B`;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
};

const ThreatBadge = ({ level, color }) => (
  <div style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    borderRadius: '4px',
    background: `${color}15`,
    border: `1px solid ${color}40`,
    fontSize: '10px',
    fontWeight: '700',
    color,
    letterSpacing: '0.5px',
  }}>
    {level}
  </div>
);

const ScoreRing = ({ score, size = 56 }) => {
  let color;
  if (score >= 70) color = '#c8f559';
  else if (score >= 40) color = '#fbbf24';
  else color = '#ef4444';

  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${color})`, transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size > 48 ? '14px' : '11px',
        fontWeight: '800', color,
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
          : 'rgba(255,255,255,0.02)',
        border: `1px solid ${isSelected ? zoneColor + '40' : 'rgba(255,255,255,0.06)'}`,
        borderLeft: `3px solid ${zoneColor}`,
        borderRadius: '12px',
        padding: '16px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = isSelected ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Token logo */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {token.logoURI ? (
            <img
              src={token.logoURI}
              alt={token.symbol}
              style={{ width: '40px', height: '40px', borderRadius: '50%' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', fontWeight: '700', color: 'var(--text-secondary)',
            }}>
              {token.symbol?.charAt(0)}
            </div>
          )}
        </div>

        {/* Token info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
              {token.symbol}
            </span>
            {token.isVerified && (
              <span style={{
                fontSize: '9px', background: 'rgba(96, 165, 250, 0.15)',
                color: '#60a5fa', padding: '1px 5px', borderRadius: '3px', fontWeight: '700',
              }}>
                VERIFIED
              </span>
            )}
            <ThreatBadge level={threat?.level || 'LOW'} color={threat?.color || '#c8f559'} />
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
            {token.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
              {formatPrice(token.usdPrice)}
            </span>
            {token.priceChange24h !== null && token.priceChange24h !== undefined && (
              <span style={{
                fontSize: '12px', fontWeight: '600',
                color: token.priceChange24h >= 0 ? '#c8f559' : '#ef4444',
              }}>
                {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
              </span>
            )}
            {token.walletBalance !== null && (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {token.walletBalance.toFixed(4)} held
              </span>
            )}
          </div>
        </div>

        {/* Score ring */}
        <ScoreRing score={score} size={52} />
      </div>

      {/* Organic score velocity indicator */}
      {token.organicScoreVelocity !== 0 && (
        <div style={{
          marginTop: '10px',
          fontSize: '11px',
          color: token.organicScoreVelocity > 0 ? '#c8f559' : '#ef4444',
          display: 'flex', alignItems: 'center', gap: '4px',
        }}>
          <span>{token.organicScoreVelocity > 0 ? '▲' : '▼'}</span>
          <span>
            Organic score {token.organicScoreVelocity > 0 ? 'rising' : 'dropping'}{' '}
            {Math.abs(token.organicScoreVelocity).toFixed(1)} pts/hr
          </span>
        </div>
      )}

      {/* Recommendation */}
      <div style={{
        marginTop: '10px',
        padding: '6px 10px',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '6px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
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


const TokenDetailPanel = ({ token, onClose }) => {
  if (!token) return null;
  const { sentry, threat, audit, stats24h } = token;

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '12px',
      padding: '20px',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      animation: 'fadeIn 0.2s ease',
    }}>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {token.logoURI && (
            <img src={token.logoURI} alt={token.symbol}
              style={{ width: '36px', height: '36px', borderRadius: '50%' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}
          <div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
              {token.name}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              {token.mint?.slice(0, 8)}...{token.mint?.slice(-6)}
            </div>
          </div>
        </div>
        <button onClick={onClose} style={{
          background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '6px', padding: '4px 10px',
          color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px',
        }}>
          ×
        </button>
      </div>

      {/* Threat summary */}
      {threat && (
        <div style={{
          background: threat.bgColor,
          border: `1px solid ${threat.borderColor}`,
          borderRadius: '8px',
          padding: '12px 14px',
          marginBottom: '16px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: threat.color, letterSpacing: '0.5px' }}>
              THREAT: {threat.level}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{threat.label}</span>
          </div>
          {threat.warnings.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {threat.warnings.map((w, i) => (
                <div key={i} style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '6px' }}>
                  <span style={{ color: threat.color, flexShrink: 0 }}>!</span>
                  {w}
                </div>
              ))}
            </div>
          )}
          {threat.positives.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
              {threat.positives.map((p, i) => (
                <div key={i} style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '6px' }}>
                  <span style={{ color: '#c8f559', flexShrink: 0 }}>✓</span>
                  {p}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Score breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
        {[
          { label: 'Organic', value: token.organicScore?.toFixed(1) || '—', sub: '40% weight' },
          { label: 'Momentum', value: token.priceChange24h !== null ? `${token.priceChange24h >= 0 ? '+' : ''}${token.priceChange24h?.toFixed(2)}%` : '—', sub: '30% weight' },
          { label: 'Sentiment', value: `${Math.round(token.predictionSentiment * 100)}%`, sub: '30% weight' },
        ].map((item) => (
          <div key={item.label} style={{
            background: 'rgba(0,0,0,0.3)', borderRadius: '8px',
            padding: '10px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{item.label}</div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{item.value}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{item.sub}</div>
          </div>
        ))}
      </div>

      {/* Market stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
        {[
          { label: 'Market Cap', value: formatNumber(token.mcap) },
          { label: 'Liquidity', value: formatNumber(token.liquidity) },
          { label: 'Holders', value: token.holderCount?.toLocaleString() || '—' },
          { label: '24h Volume', value: formatNumber(stats24h?.buyVolume) },
        ].map((item) => (
          <div key={item.label} style={{
            background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '8px', padding: '10px 14px',
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
          background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '12px 14px',
        }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Contract Audit
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Mint Authority Disabled</span>
              <span style={{ color: audit.mintAuthorityDisabled ? '#c8f559' : '#ef4444', fontWeight: '600' }}>
                {audit.mintAuthorityDisabled ? 'YES' : 'NO'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Freeze Authority Disabled</span>
              <span style={{ color: audit.freezeAuthorityDisabled ? '#c8f559' : '#ef4444', fontWeight: '600' }}>
                {audit.freezeAuthorityDisabled ? 'YES' : 'NO'}
              </span>
            </div>
            {audit.topHoldersPercentage !== undefined && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Top Holders %</span>
                <span style={{ color: audit.topHoldersPercentage > 40 ? '#ef4444' : '#c8f559', fontWeight: '600' }}>
                  {audit.topHoldersPercentage.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const PortfolioTab = ({ tokens, loading, wallet, onAddToken, onRemoveToken, predictionMarkets }) => {
  const [selectedToken, setSelectedToken] = useState(null);
  const { connected } = wallet;

  const protectTokens = tokens.filter((t) => t.sentry?.action === 'protect');
  const earnTokens = tokens.filter((t) => t.sentry?.action === 'lend');
  const accumulateTokens = tokens.filter((t) => t.sentry?.action === 'accumulate');

  const predictionSentiment = tokens[0]?.predictionSentiment ?? 0.5;

  const SkeletonCard = () => (
    <div style={{
      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '12px', padding: '16px',
    }}>
      {[100, 80, 60].map((w, i) => (
        <div key={i} style={{
          height: '12px', width: `${w}%`,
          background: 'rgba(255,255,255,0.06)', borderRadius: '4px',
          marginBottom: '8px', animation: 'pulse 1.5s ease-in-out infinite',
        }} />
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );

  return (
    <div>
      {/* Intelligence Summary */}
      {!loading && tokens.length > 0 && (
        <AIBriefing
          tokens={tokens}
          predictionMarkets={predictionMarkets}
          predictionSentiment={predictionSentiment}
        />
      )}

      {/* Not connected banner */}
      {!connected && (
        <div style={{
          background: 'rgba(200, 245, 89, 0.05)',
          border: '1px solid rgba(200, 245, 89, 0.15)',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' }}>
              Connect your wallet to see your full portfolio
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Sentry will automatically read your Solana token balances and analyze every position
            </div>
          </div>
          <button
            onClick={wallet.connect}
            style={{
              background: '#c8f559', border: 'none', borderRadius: '8px',
              padding: '10px 20px', color: '#000', fontSize: '13px',
              fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            Connect Wallet
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
        <div>
          {/* Loading state */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* Three zones */}
          {!loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* PROTECT zone */}
              {protectTokens.length > 0 && (
                <div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    marginBottom: '12px',
                  }}>
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: '#ef4444',
                      boxShadow: '0 0 6px #ef4444',
                      animation: 'pulse 1.5s ease-in-out infinite',
                    }} />
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#ef4444', letterSpacing: '1px', textTransform: 'uppercase' }}>
                      Protect — Action Required
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {protectTokens.length} position{protectTokens.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {protectTokens.map((token) => (
                      <TokenCard
                        key={token.mint}
                        token={token}
                        onSelect={setSelectedToken}
                        isSelected={selectedToken?.mint === token.mint}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* EARN zone */}
              {earnTokens.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fbbf24' }} />
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#fbbf24', letterSpacing: '1px', textTransform: 'uppercase' }}>
                      Earn — Park Idle Capital
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {earnTokens.length} position{earnTokens.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {earnTokens.map((token) => (
                      <TokenCard
                        key={token.mint}
                        token={token}
                        onSelect={setSelectedToken}
                        isSelected={selectedToken?.mint === token.mint}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* ACCUMULATE zone */}
              {accumulateTokens.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#c8f559', boxShadow: '0 0 6px #c8f559' }} />
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#c8f559', letterSpacing: '1px', textTransform: 'uppercase' }}>
                      Accumulate — Strong Signal
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {accumulateTokens.length} position{accumulateTokens.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {accumulateTokens.map((token) => (
                      <TokenCard
                        key={token.mint}
                        token={token}
                        onSelect={setSelectedToken}
                        isSelected={selectedToken?.mint === token.mint}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {tokens.length === 0 && !loading && (
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '12px', padding: '48px 24px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    No tokens in your portfolio yet
                  </div>
                  <button
                    onClick={onAddToken}
                    style={{
                      background: '#c8f559', border: 'none', borderRadius: '8px',
                      padding: '10px 20px', color: '#000', fontSize: '13px',
                      fontWeight: '700', cursor: 'pointer',
                    }}
                  >
                    Add Token
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right panel — token detail */}
        <div>
          {selectedToken ? (
            <TokenDetailPanel
              token={selectedToken}
              onClose={() => setSelectedToken(null)}
            />
          ) : (
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px', padding: '32px 24px',
              textAlign: 'center', color: 'var(--text-muted)',
              fontSize: '13px',
            }}>
              Click any token to see its full health report
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PortfolioTab;