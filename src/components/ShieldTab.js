import React, { useState } from 'react';
import { generateHealthPassport } from '../services/jupiterApi';
import { searchTokens } from '../services/jupiterApi';

const THREAT_COLORS = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  ELEVATED: '#fbbf24',
  LOW: '#c8f559',
};

const ThreatMeter = ({ level, points }) => {
  const color = THREAT_COLORS[level] || '#c8f559';
  const pct = Math.min(100, points);

  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Threat Level</span>
        <span style={{ fontSize: '13px', fontWeight: '700', color }}>{level}</span>
      </div>
      <div style={{
        height: '8px', background: 'rgba(255,255,255,0.06)',
        borderRadius: '4px', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: `linear-gradient(90deg, #c8f559, ${color})`,
          borderRadius: '4px',
          boxShadow: `0 0 8px ${color}`,
          transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  );
};

const HealthPassportCard = ({ passport, onClose }) => {
  if (!passport) return null;
  const {
    name, symbol, usdPrice, isVerified,
    organicScore, organicScoreLabel, organicScoreVelocity,
    audit, priceChange24h, liquidity, holderCount,
    mcap, predictionSentiment, threat, sentryScore,
    verdict, verdictColor, verdictDescription,
  } = passport;

  const formatNum = (n) => {
    if (!n) return '—';
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
    if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
    return `$${n.toFixed(2)}`;
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '16px',
      overflow: 'hidden',
      animation: 'fadeIn 0.25s ease',
    }}>
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>

      {/* Passport header */}
      <div style={{
        background: `linear-gradient(135deg, ${verdictColor}12, transparent)`,
        borderBottom: `1px solid ${verdictColor}20`,
        padding: '20px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>
              {symbol}
            </span>
            {isVerified && (
              <span style={{
                fontSize: '10px', background: 'rgba(96,165,250,0.15)',
                color: '#60a5fa', padding: '2px 6px', borderRadius: '3px', fontWeight: '700',
              }}>
                VERIFIED
              </span>
            )}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            {name}
          </div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)' }}>
            {usdPrice ? `$${usdPrice < 0.001 ? usdPrice.toFixed(6) : usdPrice.toFixed(4)}` : '—'}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: '13px', fontWeight: '800',
            color: verdictColor,
            background: `${verdictColor}15`,
            border: `1px solid ${verdictColor}30`,
            padding: '6px 14px', borderRadius: '8px',
            marginBottom: '8px', letterSpacing: '1px',
          }}>
            {verdict}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px', padding: '4px 10px',
              color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px',
            }}
          >
            ×
          </button>
        </div>
      </div>

      <div style={{ padding: '20px 24px' }}>
        {/* Verdict description */}
        <div style={{
          background: `${verdictColor}08`,
          border: `1px solid ${verdictColor}20`,
          borderRadius: '8px', padding: '12px 14px', marginBottom: '20px',
          fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6',
        }}>
          {verdictDescription}
        </div>

        {/* Threat meter */}
        <ThreatMeter level={threat.level} points={threat.points} />

        {/* Score breakdown */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: '8px', margin: '16px 0',
        }}>
          {[
            {
              label: 'Organic Score',
              value: organicScore !== null ? organicScore.toFixed(1) : '—',
              sub: organicScoreLabel,
              color: organicScore > 70 ? '#c8f559' : organicScore > 40 ? '#fbbf24' : '#ef4444',
            },
            {
              label: 'Price 24h',
              value: priceChange24h !== null
                ? `${priceChange24h >= 0 ? '+' : ''}${priceChange24h.toFixed(2)}%`
                : '—',
              sub: 'momentum',
              color: priceChange24h >= 0 ? '#c8f559' : '#ef4444',
            },
            {
              label: 'Market Sentiment',
              value: `${Math.round(predictionSentiment * 100)}%`,
              sub: predictionSentiment >= 0.55 ? 'bullish' : predictionSentiment <= 0.45 ? 'bearish' : 'neutral',
              color: predictionSentiment >= 0.55 ? '#c8f559' : predictionSentiment <= 0.45 ? '#ef4444' : '#fbbf24',
            },
          ].map((item) => (
            <div key={item.label} style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '8px', padding: '10px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                {item.label}
              </div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: item.color }}>
                {item.value}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {item.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Organic velocity */}
        {organicScoreVelocity !== 0 && (
          <div style={{
            background: organicScoreVelocity > 0 ? 'rgba(200,245,89,0.06)' : 'rgba(239,68,68,0.06)',
            border: `1px solid ${organicScoreVelocity > 0 ? 'rgba(200,245,89,0.2)' : 'rgba(239,68,68,0.2)'}`,
            borderRadius: '8px', padding: '10px 14px', marginBottom: '16px',
            fontSize: '12px',
            color: organicScoreVelocity > 0 ? '#c8f559' : '#ef4444',
          }}>
            Organic score is {organicScoreVelocity > 0 ? 'rising' : 'dropping'} at{' '}
            <strong>{Math.abs(organicScoreVelocity).toFixed(1)} points/hour</strong>
            {organicScoreVelocity < -5 && ' — this is a warning sign of unusual activity'}
            {organicScoreVelocity > 5 && ' — genuine trading activity is increasing'}
          </div>
        )}

        {/* Warnings and positives */}
        {threat.warnings.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Risk Factors
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {threat.warnings.map((w, i) => (
                <div key={i} style={{
                  display: 'flex', gap: '8px', fontSize: '12px',
                  color: 'var(--text-secondary)',
                  background: 'rgba(239,68,68,0.06)',
                  border: '1px solid rgba(239,68,68,0.12)',
                  borderRadius: '6px', padding: '8px 10px',
                }}>
                  <span style={{ color: threat.color, flexShrink: 0, fontWeight: '700' }}>!</span>
                  {w}
                </div>
              ))}
            </div>
          </div>
        )}

        {threat.positives.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Positive Signals
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {threat.positives.map((p, i) => (
                <div key={i} style={{
                  display: 'flex', gap: '8px', fontSize: '12px',
                  color: 'var(--text-secondary)',
                  background: 'rgba(200,245,89,0.06)',
                  border: '1px solid rgba(200,245,89,0.12)',
                  borderRadius: '6px', padding: '8px 10px',
                }}>
                  <span style={{ color: '#c8f559', flexShrink: 0, fontWeight: '700' }}>✓</span>
                  {p}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audit section */}
        {audit && (
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '8px', padding: '14px', marginBottom: '12px',
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
              Contract Audit
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: 'Mint Authority Disabled', value: audit.mintAuthorityDisabled, critical: true },
                { label: 'Freeze Authority Disabled', value: audit.freezeAuthorityDisabled, critical: true },
              ].map((row) => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{row.label}</span>
                  <span style={{
                    fontSize: '11px', fontWeight: '700',
                    color: row.value ? '#c8f559' : (row.critical ? '#ef4444' : '#fbbf24'),
                    background: row.value ? 'rgba(200,245,89,0.1)' : 'rgba(239,68,68,0.1)',
                    padding: '2px 8px', borderRadius: '4px',
                  }}>
                    {row.value ? 'SAFE' : 'RISK'}
                  </span>
                </div>
              ))}
              {audit.topHoldersPercentage !== undefined && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Top Holders Concentration</span>
                  <span style={{
                    fontSize: '11px', fontWeight: '700',
                    color: audit.topHoldersPercentage > 40 ? '#ef4444' : '#c8f559',
                  }}>
                    {audit.topHoldersPercentage.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Market data */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {[
            { label: 'Market Cap', value: formatNum(mcap) },
            { label: 'Liquidity', value: formatNum(liquidity) },
            { label: 'Sentry Score', value: `${sentryScore.score}/100` },
            { label: 'Holders', value: holderCount?.toLocaleString() || '—' },
          ].map((item) => (
            <div key={item.label} style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '8px', padding: '10px 12px',
            }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '4px' }}>
                {item.label}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ShieldTab = ({ tokens, loading, wallet }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedPassport, setSelectedPassport] = useState(null);
  const [loadingPassport, setLoadingPassport] = useState(false);

  const criticalTokens = tokens.filter((t) => t.threat?.level === 'CRITICAL');
  const highTokens = tokens.filter((t) => t.threat?.level === 'HIGH');
  const elevatedTokens = tokens.filter((t) => t.threat?.level === 'ELEVATED');
  const lowTokens = tokens.filter((t) => t.threat?.level === 'LOW');

  const overallThreat = criticalTokens.length > 0
    ? 'CRITICAL'
    : highTokens.length > 0
    ? 'HIGH'
    : elevatedTokens.length > 0
    ? 'ELEVATED'
    : 'LOW';

  const overallColor = THREAT_COLORS[overallThreat];

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) { setSearchResults([]); return; }
    setSearching(true);
    const results = await searchTokens(query);
    setSearchResults(results.slice(0, 6));
    setSearching(false);
  };

  const handleViewPassport = async (tokenData) => {
    setLoadingPassport(true);
    setSelectedPassport(null);

    // If it is already an enriched token use it directly
    if (tokenData.sentry && tokenData.threat) {
      const passport = generateHealthPassport(tokenData);
      setSelectedPassport(passport);
      setLoadingPassport(false);
      return;
    }

    // Otherwise it came from search — build a partial passport
    const partial = {
      name: tokenData.name,
      symbol: tokenData.symbol,
      usdPrice: tokenData.usdPrice || null,
      isVerified: tokenData.isVerified || false,
      organicScore: tokenData.organicScore ?? null,
      organicScoreLabel: tokenData.organicScoreLabel || 'unknown',
      organicScoreVelocity: 0,
      audit: tokenData.audit || null,
      priceChange24h: tokenData.stats24h?.priceChange ?? null,
      liquidity: tokenData.liquidity || null,
      holderCount: tokenData.holderCount || null,
      mcap: tokenData.mcap || null,
      stats24h: tokenData.stats24h || null,
      predictionSentiment: 0.5,
    };

    const passport = generateHealthPassport(partial);
    setSelectedPassport(passport);
    setLoadingPassport(false);
    setSearchResults([]);
    setSearchQuery('');
  };

  const ThreatGroup = ({ level, groupTokens }) => {
    if (groupTokens.length === 0) return null;
    const color = THREAT_COLORS[level];

    return (
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: color,
            boxShadow: level === 'CRITICAL' ? `0 0 8px ${color}` : 'none',
            animation: level === 'CRITICAL' ? 'pulse 1s ease-in-out infinite' : 'none',
          }} />
          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
          <span style={{
            fontSize: '11px', fontWeight: '700', color,
            textTransform: 'uppercase', letterSpacing: '1px',
          }}>
            {level} — {groupTokens.length} token{groupTokens.length > 1 ? 's' : ''}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {groupTokens.map((token) => (
            <div
              key={token.mint}
              onClick={() => handleViewPassport(token)}
              style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${color}20`,
                borderLeft: `3px solid ${color}`,
                borderRadius: '8px', cursor: 'pointer',
                transition: 'all 0.15s ease',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {token.logoURI && (
                  <img
                    src={token.logoURI} alt={token.symbol}
                    style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                )}
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '2px' }}>
                    {token.symbol}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {token.threat?.label}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  ${token.usdPrice < 0.001 ? token.usdPrice?.toFixed(6) : token.usdPrice?.toFixed(4)}
                </div>
                <div style={{ fontSize: '11px', color }}>
                  {token.threat?.warnings?.length || 0} risk factor{token.threat?.warnings?.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 480px', gap: '24px', alignItems: 'start' }}>

      {/* Left — Threat overview */}
      <div>

        {/* Overall status banner */}
        <div style={{
          background: `linear-gradient(135deg, ${overallColor}10, transparent)`,
          border: `1px solid ${overallColor}25`,
          borderRadius: '16px', padding: '20px 24px',
          marginBottom: '24px',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Portfolio Shield Status
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: overallColor, letterSpacing: '-0.5px' }}>
                {overallThreat}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {criticalTokens.length > 0
                  ? `${criticalTokens.length} critical position${criticalTokens.length > 1 ? 's' : ''} require immediate attention`
                  : highTokens.length > 0
                  ? `${highTokens.length} position${highTokens.length > 1 ? 's' : ''} with elevated risk`
                  : elevatedTokens.length > 0
                  ? `${elevatedTokens.length} position${elevatedTokens.length > 1 ? 's' : ''} to monitor closely`
                  : 'All positions within acceptable risk parameters'}
              </div>
            </div>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: `${overallColor}15`,
              border: `2px solid ${overallColor}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '24px',
            }}>
              {overallThreat === 'CRITICAL' ? '⚠' : overallThreat === 'HIGH' ? '⚡' : overallThreat === 'ELEVATED' ? '◎' : '✓'}
            </div>
          </div>
        </div>

        {/* Token search for health passport */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px', padding: '20px',
          marginBottom: '24px',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
            Token Health Passport
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Search any Solana token to generate a full security report using Jupiter's APIs
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name, symbol, or paste mint address..."
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px', padding: '10px 14px',
                color: 'var(--text-primary)', fontSize: '13px',
                outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.15s ease',
              }}
              onFocus={(e) => e.target.style.borderColor = 'rgba(200,245,89,0.4)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
            {searching && (
              <div style={{
                position: 'absolute', right: '12px', top: '50%',
                transform: 'translateY(-50%)',
                width: '14px', height: '14px',
                border: '2px solid rgba(255,255,255,0.1)',
                borderTopColor: '#c8f559',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
            )}
            <style>{`@keyframes spin { to { transform: translateY(-50%) rotate(360deg); } }`}</style>
          </div>

          {/* Search results */}
          {searchResults.length > 0 && (
            <div style={{
              marginTop: '8px',
              background: '#1a1d24',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px', overflow: 'hidden',
            }}>
              {searchResults.map((token) => (
                <div
                  key={token.id}
                  onClick={() => handleViewPassport(token)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 14px', cursor: 'pointer',
                    transition: 'background 0.1s ease',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {token.icon ? (
                    <img src={token.icon} alt={token.symbol}
                      style={{ width: '28px', height: '28px', borderRadius: '50%' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: 'rgba(255,255,255,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)',
                    }}>
                      {token.symbol?.charAt(0)}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {token.symbol}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{token.name}</div>
                  </div>
                  {token.organicScore !== undefined && token.organicScore !== null && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right' }}>
                      <div style={{
                        color: token.organicScore > 70 ? '#c8f559' : token.organicScore > 40 ? '#fbbf24' : '#ef4444',
                        fontWeight: '700',
                      }}>
                        {token.organicScore.toFixed(0)}
                      </div>
                      <div>organic</div>
                    </div>
                  )}
                  <div style={{
                    fontSize: '11px', color: '#c8f559',
                    background: 'rgba(200,245,89,0.1)',
                    padding: '3px 8px', borderRadius: '4px', fontWeight: '600',
                    whiteSpace: 'nowrap',
                  }}>
                    View Report
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Threat groups */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '13px' }}>
            Analyzing portfolio threats...
          </div>
        ) : tokens.length === 0 ? (
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '12px', padding: '32px',
            textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px',
          }}>
            Add tokens to your portfolio to see their threat analysis
          </div>
        ) : (
          <>
            <ThreatGroup level="CRITICAL" groupTokens={criticalTokens} />
            <ThreatGroup level="HIGH" groupTokens={highTokens} />
            <ThreatGroup level="ELEVATED" groupTokens={elevatedTokens} />
            <ThreatGroup level="LOW" groupTokens={lowTokens} />
          </>
        )}
      </div>

      {/* Right — Health passport display */}
      <div>
        {loadingPassport && (
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px', padding: '48px',
            textAlign: 'center',
          }}>
            <div style={{
              width: '24px', height: '24px',
              border: '2px solid rgba(255,255,255,0.1)',
              borderTopColor: '#c8f559',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 12px',
            }} />
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Generating health passport...
            </div>
          </div>
        )}

        {!loadingPassport && selectedPassport && (
          <HealthPassportCard
            passport={selectedPassport}
            onClose={() => setSelectedPassport(null)}
          />
        )}

        {!loadingPassport && !selectedPassport && (
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px', padding: '48px 32px',
            textAlign: 'center',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              background: 'rgba(200,245,89,0.1)',
              border: '1px solid rgba(200,245,89,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '20px',
            }}>
              ✓
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Token Health Passport
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Click any token in the threat list or search for any Solana token to generate a complete security report combining organic score, audit data, price momentum, and prediction market sentiment
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShieldTab;