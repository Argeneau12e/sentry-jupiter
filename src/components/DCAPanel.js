import React, { useState } from 'react';
import { useWallet } from '../hooks/useWalletAuth';

const CYCLE_OPTIONS = [
  { label: 'Every hour', seconds: 3600 },
  { label: 'Every 6 hours', seconds: 21600 },
  { label: 'Every day', seconds: 86400 },
  { label: 'Every week', seconds: 604800 },
];

const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

const DCAPanel = ({ enrichedTokens }) => {
  const { connected, connect } = useWallet();
  const [selectedToken, setSelectedToken] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [perCycle, setPerCycle] = useState('');
  const [cycleSeconds, setCycleSeconds] = useState(86400);
  const [placing, setPlacing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const currentToken = enrichedTokens.find((t) => t.mint === selectedToken);
  const cycles = totalAmount && perCycle
    ? Math.floor(parseFloat(totalAmount) / parseFloat(perCycle))
    : 0;
  const cycleLabel = CYCLE_OPTIONS.find((o) => o.seconds === cycleSeconds)?.label || '';

  const handlePlaceDCA = async () => {
    if (!connected) { setVisible(true); return; }
    if (!selectedToken || !totalAmount || !perCycle) {
      setError('Please fill in all fields');
      return;
    }
    if (parseFloat(perCycle) > parseFloat(totalAmount)) {
      setError('Per-cycle amount cannot exceed total amount');
      return;
    }

    setPlacing(true);
    setError(null);

    try {
      const { createDCAOrder } = await import('../services/recurringApi');
      const { publicKey } = await import('@solana/wallet-adapter-react');

      const res = await createDCAOrder({
        userPublicKey: window.solana?.publicKey?.toString(),
        inputMint: USDC_MINT,
        outputMint: selectedToken,
        inAmount: Math.round(parseFloat(totalAmount) * 1_000_000).toString(),
        inAmountPerCycle: Math.round(parseFloat(perCycle) * 1_000_000).toString(),
        cycleSecondsApart: cycleSeconds,
      });

      if (res) {
        setResult(res);
      } else {
        setError('DCA order creation failed. Check console for details.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

      {/* DCA Form */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '24px',
      }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
            Set Up DCA Strategy
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Automatically accumulate tokens over time using Jupiter Recurring API. USDC is split into equal purchases.
          </div>
        </div>

        {/* Token selector */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
            Token to Accumulate
          </label>
          <select
            value={selectedToken}
            onChange={(e) => setSelectedToken(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '10px 14px',
              color: 'var(--text-primary)',
              fontSize: '14px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="">Select token...</option>
            {enrichedTokens.map((t) => (
              <option key={t.mint} value={t.mint}>
                {t.symbol} — Score: {t.sentry?.score} — ${t.usdPrice?.toFixed(4)}
              </option>
            ))}
          </select>
        </div>

        {/* Sentry score banner */}
        {currentToken && (
          <div style={{
            background: 'var(--bg-secondary)',
            border: `1px solid ${currentToken.sentry?.score >= 70 ? 'rgba(200, 245, 89, 0.2)' : 'var(--border)'}`,
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sentry Score</span>
            <span style={{ fontSize: '14px', fontWeight: '700', color: currentToken.sentry?.color }}>
              {currentToken.sentry?.score}/100 — {currentToken.sentry?.recommendation}
            </span>
          </div>
        )}

        {/* Total USDC */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
            Total USDC to Spend
          </label>
          <input
            type="number"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            placeholder="100.00"
            style={{
              width: '100%',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '10px 14px',
              color: 'var(--text-primary)',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Per cycle */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
            USDC Per Purchase
          </label>
          <input
            type="number"
            value={perCycle}
            onChange={(e) => setPerCycle(e.target.value)}
            placeholder="10.00"
            style={{
              width: '100%',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '10px 14px',
              color: 'var(--text-primary)',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Frequency */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
            Purchase Frequency
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {CYCLE_OPTIONS.map((opt) => (
              <button
                key={opt.seconds}
                onClick={() => setCycleSeconds(opt.seconds)}
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  border: `1px solid ${cycleSeconds === opt.seconds ? 'var(--accent-green)' : 'var(--border)'}`,
                  background: cycleSeconds === opt.seconds ? 'var(--accent-green-dim)' : 'var(--bg-secondary)',
                  color: cycleSeconds === opt.seconds ? 'var(--accent-green)' : 'var(--text-muted)',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        {cycles > 0 && (
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '12px 14px',
            marginBottom: '16px',
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Strategy Summary
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
              Buy <span style={{ color: 'var(--accent-green)', fontWeight: '600' }}>${perCycle} USDC</span> of{' '}
              <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{currentToken?.symbol || 'token'}</span>{' '}
              <span style={{ color: 'var(--accent-green)', fontWeight: '600' }}>{cycleLabel.toLowerCase()}</span>{' '}
              for <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{cycles} cycles</span>{' '}
              — total <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>${totalAmount} USDC</span>
            </div>
          </div>
        )}

        {error && (
          <div style={{
            background: 'var(--accent-red-dim)',
            border: '1px solid rgba(248, 113, 113, 0.2)',
            borderRadius: '8px',
            padding: '12px 14px',
            marginBottom: '16px',
            fontSize: '13px',
            color: 'var(--accent-red)',
          }}>
            {error}
          </div>
        )}

        {result && (
          <div style={{
            background: 'var(--accent-green-dim)',
            border: '1px solid rgba(200, 245, 89, 0.3)',
            borderRadius: '8px',
            padding: '12px 14px',
            marginBottom: '16px',
            fontSize: '13px',
            color: 'var(--accent-green)',
          }}>
            DCA order created. Transaction ready to sign.
          </div>
        )}

        <button
          onClick={handlePlaceDCA}
          disabled={placing}
          style={{
            width: '100%',
            background: placing ? 'var(--bg-secondary)' : 'var(--accent-green)',
            border: 'none',
            borderRadius: '8px',
            padding: '12px',
            color: placing ? 'var(--text-muted)' : '#000',
            fontSize: '14px',
            fontWeight: '700',
            cursor: placing ? 'not-allowed' : 'pointer',
          }}
        >
          {!connected ? 'Connect Wallet' : placing ? 'Creating DCA Order...' : 'Start DCA Strategy'}
        </button>

        <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
          Powered by Jupiter Recurring API. 0.1% fee per executed order.
        </div>
      </div>

      {/* DCA explainer */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '24px',
        }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
            Why DCA with Sentry?
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.8' }}>
            Sentry combines token organic scores, price momentum, and prediction market sentiment to identify accumulation opportunities.
            When a token's Sentry Score is high (70+), it indicates genuine trading activity, positive momentum, and bullish market sentiment — the ideal conditions to start a DCA strategy.
          </div>

          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {enrichedTokens.filter((t) => t.sentry?.score >= 60).map((token) => (
              <div key={token.mint} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                background: 'var(--bg-secondary)',
                border: '1px solid rgba(200, 245, 89, 0.15)',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
                onClick={() => setSelectedToken(token.mint)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {token.logoURI && (
                    <img src={token.logoURI} alt={token.symbol} style={{ width: '24px', height: '24px', borderRadius: '50%' }} onError={(e) => { e.target.style.display = 'none'; }} />
                  )}
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{token.symbol}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Score {token.sentry?.score}/100</div>
                  </div>
                </div>
                <div style={{
                  fontSize: '11px',
                  color: 'var(--accent-green)',
                  background: 'var(--accent-green-dim)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontWeight: '600',
                }}>
                  GOOD DCA CANDIDATE
                </div>
              </div>
            ))}
            {enrichedTokens.filter((t) => t.sentry?.score >= 60).length === 0 && (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>
                No tokens currently qualify as strong DCA candidates. Sentry Score must be 60+.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DCAPanel;