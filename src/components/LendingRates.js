import React, { useState, useEffect } from 'react';
import { getLendingRates } from '../services/jupiterApi';

const LendingRates = () => {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        setError(null);
        const data = await getLendingRates();
        setRates(data);
      } catch (err) {
        setError('Could not load lending rates.');
      } finally {
        setLoading(false);
      }
    };
    fetchRates();
    const interval = setInterval(fetchRates, 60000);
    return () => clearInterval(interval);
  }, []);

  const LinkToLend = () => {
    return React.createElement(
      'a',
      {
        href: 'https://jup.ag/lend',
        target: '_blank',
        rel: 'noopener noreferrer',
        style: {
          fontSize: '12px',
          color: 'var(--accent-blue)',
          textDecoration: 'none',
          fontWeight: '500',
        },
      },
      'Open Jupiter Lend to deposit'
    );
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      overflow: 'hidden',
    }}>

      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
            Jupiter Lend
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Current deposit yield rates
          </div>
        </div>
        <div style={{
          fontSize: '11px',
          color: 'var(--accent-green)',
          background: 'rgba(16, 185, 129, 0.1)',
          padding: '3px 8px',
          borderRadius: '4px',
          fontWeight: '600',
        }}>
          LIVE
        </div>
      </div>

      <div style={{
        margin: '16px',
        padding: '12px 14px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        fontSize: '12px',
        color: 'var(--text-muted)',
        lineHeight: '1.6',
      }}>
        When Sentry recommends{' '}
        <span style={{ color: 'var(--accent-yellow)', fontWeight: '600' }}>
          PARK IN LEND
        </span>
        , your idle funds can earn yield here instead of sitting unused while
        waiting for better market conditions.
      </div>

      {loading && (
        <div style={{ padding: '32px 20px', textAlign: 'center' }}>
          <div style={{
            width: '20px',
            height: '20px',
            border: '2px solid var(--border)',
            borderTopColor: 'var(--accent-green)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
            Fetching rates...
          </div>
        </div>
      )}

      {!loading && error && (
        <div style={{
          margin: '16px',
          padding: '12px 14px',
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '8px',
          fontSize: '13px',
          color: 'var(--accent-red)',
        }}>
          {error}
          <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
            The Lend API endpoint may still be in beta. This will be documented
            in the DX report.
          </div>
        </div>
      )}

      {!loading && !error && rates.length > 0 && (
        <div style={{ padding: '0 16px 16px' }}>
          {rates.slice(0, 8).map((market, index) => (
            <div
              key={market.id || index}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '8px',
                marginBottom: '6px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {market.tokenIcon ? (
                  <img
                    src={market.tokenIcon}
                    alt={market.tokenSymbol}
                    style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'var(--bg-card-hover)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: '700',
                    color: 'var(--text-muted)',
                  }}>
                    {market.tokenSymbol?.charAt(0) || '?'}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {market.tokenSymbol || market.symbol || 'Unknown'}
                  </div>
                  {market.totalDeposits && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      ${(market.totalDeposits / 1_000_000).toFixed(1)}M deposited
                    </div>
                  )}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--accent-green)' }}>
                  {market.supplyApy !== undefined
                    ? `${(market.supplyApy * 100).toFixed(2)}%`
                    : market.apy !== undefined
                    ? `${(market.apy * 100).toFixed(2)}%`
                    : market.supplyRate !== undefined
                    ? `${(market.supplyRate * 100).toFixed(2)}%`
                    : '—'}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>APY</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && rates.length === 0 && (
        <div style={{
          margin: '16px',
          padding: '20px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '13px',
        }}>
          <div style={{ marginBottom: '8px' }}>—</div>
          No lending markets returned from API.
          <div style={{ marginTop: '6px', fontSize: '11px' }}>
            This endpoint behavior will be documented in the DX report.
          </div>
        </div>
      )}

      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border)',
        textAlign: 'center',
      }}>
        <LinkToLend />
      </div>

    </div>
  );
};

export default LendingRates;