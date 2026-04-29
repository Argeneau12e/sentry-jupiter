import React from 'react';
import { useWallet } from '../hooks/useWalletAuth';

const Header = ({ lastUpdated, onAddToken, predictionSentiment, tickerTokens = [], activeTab, onTabChange, wallet }) => {
  const { connected, publicKey, connect, disconnect } = wallet || {};

  const formatTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const shortAddress = publicKey
    ? `${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}`
    : '';

  const sentimentLabel = predictionSentiment >= 0.55
    ? 'BULLISH'
    : predictionSentiment <= 0.45
    ? 'BEARISH'
    : 'NEUTRAL';

  const sentimentColor = predictionSentiment >= 0.55
    ? 'var(--accent-green)'
    : predictionSentiment <= 0.45
    ? 'var(--accent-red)'
    : 'var(--accent-yellow)';

  return (
    <div>
      {/* Ticker bar */}
      {tickerTokens.length > 0 && (
        <div style={{
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border)',
          padding: '6px 0',
          overflow: 'hidden',
        }}>
          <div className="ticker-content">
            {[...tickerTokens, ...tickerTokens].map((token, i) => (
              <div key={i} style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                marginRight: '32px',
                fontSize: '12px',
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: token.priceChange24h >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
                  display: 'inline-block',
                  flexShrink: 0,
                }} />
                <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>
                  {token.symbol}
                </span>
                <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                  ${token.usdPrice < 0.01 ? token.usdPrice?.toFixed(6) : token.usdPrice?.toFixed(2)}
                </span>
                <span style={{ color: token.priceChange24h >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                  {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h?.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main header */}
      <header style={{
        background: 'rgba(10, 11, 13, 0.95)',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}>

        {/* Left — Brand + Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              background: 'var(--accent-green)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: '900',
              color: '#000',
            }}>
              S
            </div>
            <span style={{
              fontSize: '15px',
              fontWeight: '700',
              color: 'var(--text-primary)',
              letterSpacing: '-0.3px',
            }}>
              Sentry
            </span>
          </div>

          <nav style={{ display: 'flex', gap: '4px' }}>
            {[
                { id: 'portfolio', label: 'Portfolio' },
                { id: 'swap', label: 'Swap' },
                { id: 'strategies', label: 'Strategies' },
                { id: 'markets', label: 'Markets' },
                { id: 'shield', label: 'Shield' },
              ].map((item) => (
                <div
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: activeTab === item.id ? '600' : '500',
                    color: activeTab === item.id
                      ? item.id === 'shield'
                        ? '#ef4444'
                        : 'var(--text-primary)'
                      : 'var(--text-muted)',
                    background: activeTab === item.id ? 'var(--bg-card)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    border: activeTab === item.id
                      ? item.id === 'shield'
                        ? '1px solid rgba(239, 68, 68, 0.3)'
                        : '1px solid var(--border)'
                      : '1px solid transparent',
                  }}
                >
                  {item.id === 'shield' ? 'Shield' : item.label}
                </div>
              ))}
          </nav>
        </div>

        {/* Center — Sentiment */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '6px 14px',
        }}>
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: sentimentColor,
            boxShadow: `0 0 6px ${sentimentColor}`,
          }} />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.3px' }}>
            MARKET
          </span>
          <span style={{ fontSize: '12px', fontWeight: '700', color: sentimentColor, letterSpacing: '0.5px' }}>
            {sentimentLabel} {Math.round(predictionSentiment * 100)}%
          </span>
          {lastUpdated && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '4px' }}>
              {formatTime(lastUpdated)}
            </span>
          )}
        </div>

        {/* Right — Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={onAddToken}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '7px 14px',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            + Add Token
          </button>

          {connected ? (
            <button
              onClick={disconnect}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '7px 14px',
                color: 'var(--accent-green)',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--accent-green)',
              }} />
              {shortAddress}
            </button>
          ) : (
            <button
              onClick={connect}
              style={{
                background: 'var(--accent-green)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 18px',
                color: '#000',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                letterSpacing: '0.1px',
              }}
            >
              Connect
            </button>
          )}
        </div>

      </header>
    </div>
  );
};

export default Header;