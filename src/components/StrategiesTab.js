import React, { useState } from 'react';
import { useWallet, useTriggerAuth } from '../hooks/useWalletAuth';
import { craftDeposit, placeOCOOrder, placeSingleOrder, getOrCreateVault } from '../services/triggerApi';
import { createDCAOrder } from '../services/recurringApi';
import { VersionedTransaction } from '@solana/web3.js';
import { MINTS } from '../services/jupiterApi';

const CYCLE_OPTIONS = [
  { label: 'Every hour', seconds: 3600 },
  { label: 'Every 6 hours', seconds: 21600 },
  { label: 'Every day', seconds: 86400 },
  { label: 'Every week', seconds: 604800 },
];

const StrategyTimeline = ({ token, tpPrice, slPrice, dcaAmount, dcaCycles, cycleLabel }) => {
  if (!token?.usdPrice) return null;
  const current = token.usdPrice;
  const tp = parseFloat(tpPrice) || current * 1.2;
  const sl = parseFloat(slPrice) || current * 0.85;
  const range = tp - sl;
  const currentPct = range > 0 ? ((current - sl) / range) * 100 : 50;

  return (
    <div style={{
      background: 'rgba(0,0,0,0.3)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '10px',
      padding: '16px',
      marginTop: '16px',
    }}>
      <div style={{
        fontSize: '11px', color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px',
      }}>
        Strategy Visualization
      </div>

      {/* Price range bar */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <div style={{
          height: '6px', borderRadius: '3px',
          background: 'linear-gradient(90deg, #ef4444, #fbbf24, #c8f559)',
          position: 'relative',
        }}>
          {/* Current price marker */}
          <div style={{
            position: 'absolute',
            left: `${Math.max(2, Math.min(98, currentPct))}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '12px', height: '12px',
            borderRadius: '50%',
            background: '#fff',
            border: '2px solid #c8f559',
            boxShadow: '0 0 8px rgba(200,245,89,0.5)',
          }} />
        </div>

        {/* Labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: '700' }}>
              SL ${sl.toFixed(4)}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Stop Loss</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#c8f559', fontWeight: '700' }}>
              ${current.toFixed(4)}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Current</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#c8f559', fontWeight: '700' }}>
              TP ${tp.toFixed(4)}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Take Profit</div>
          </div>
        </div>
      </div>

      {/* R/R ratio */}
      {tpPrice && slPrice && (
        <div style={{
          display: 'flex', justifyContent: 'space-around',
          padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          {[
            {
              label: 'Potential Gain',
              value: `+${(((tp - current) / current) * 100).toFixed(1)}%`,
              color: '#c8f559',
            },
            {
              label: 'Max Loss',
              value: `-${(((current - sl) / current) * 100).toFixed(1)}%`,
              color: '#ef4444',
            },
            {
              label: 'R/R Ratio',
              value: `1:${((tp - current) / (current - sl)).toFixed(1)}`,
              color: '#fbbf24',
            },
          ].map((item) => (
            <div key={item.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: item.color }}>
                {item.value}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{item.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* DCA timeline */}
      {dcaAmount && dcaCycles > 0 && (
        <div style={{
          marginTop: '12px', paddingTop: '12px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            DCA Schedule — {dcaCycles} purchases of ${dcaAmount} {cycleLabel}
          </div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {Array.from({ length: Math.min(dcaCycles, 10) }).map((_, i) => (
              <div key={i} style={{
                width: '20px', height: '20px', borderRadius: '4px',
                background: 'rgba(200,245,89,0.2)',
                border: '1px solid rgba(200,245,89,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '8px', color: '#c8f559', fontWeight: '700',
              }}>
                {i + 1}
              </div>
            ))}
            {dcaCycles > 10 && (
              <div style={{
                padding: '0 6px', height: '20px', borderRadius: '4px',
                background: 'rgba(200,245,89,0.1)',
                display: 'flex', alignItems: 'center',
                fontSize: '10px', color: 'var(--text-muted)',
              }}>
                +{dcaCycles - 10} more
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const StrategiesTab = ({ enrichedTokens, wallet }) => {
  const { connected, connect } = wallet;
  const { jwt, authLoading, authError, getOrRefreshJwt } = useTriggerAuth(wallet);

  // Shared state
  const [activeStrategy, setActiveStrategy] = useState('oco');
  const [selectedMint, setSelectedMint] = useState('');

  // OCO state
  const [tpPrice, setTpPrice] = useState('');
  const [slPrice, setSlPrice] = useState('');
  const [ocoAmount, setOcoAmount] = useState('');

  // Single limit state
  const [limitPrice, setLimitPrice] = useState('');
  const [limitAmount, setLimitAmount] = useState('');
  const [limitCondition, setLimitCondition] = useState('above');

  // DCA state
  const [dcaTotal, setDcaTotal] = useState('');
  const [dcaPerCycle, setDcaPerCycle] = useState('');
  const [cycleSeconds, setCycleSeconds] = useState(86400);

  // Execution state
  const [placing, setPlacing] = useState(false);
  const [step, setStep] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const currentToken = enrichedTokens.find((t) => t.mint === selectedMint);
  const currentPrice = currentToken?.usdPrice;
  const dcaCycles = dcaTotal && dcaPerCycle
    ? Math.floor(parseFloat(dcaTotal) / parseFloat(dcaPerCycle))
    : 0;
  const cycleLabel = CYCLE_OPTIONS.find((o) => o.seconds === cycleSeconds)?.label?.toLowerCase() || '';

  const autofillOCO = () => {
    if (!currentPrice) return;
    setTpPrice((currentPrice * 1.20).toFixed(6));
    setSlPrice((currentPrice * 0.85).toFixed(6));
  };

  const autofillSentry = () => {
    if (!currentToken) return;
    const score = currentToken.sentry?.score || 50;
    const tpMultiplier = score >= 70 ? 1.25 : score >= 40 ? 1.15 : 1.10;
    const slMultiplier = score >= 70 ? 0.90 : score >= 40 ? 0.85 : 0.80;
    setTpPrice((currentPrice * tpMultiplier).toFixed(6));
    setSlPrice((currentPrice * slMultiplier).toFixed(6));
  };

  const handleExecute = async () => {
    if (!connected) { connect(); return; }
    if (!selectedMint) { setError('Please select a token'); return; }

    setPlacing(true);
    setError(null);
    setResult(null);

    try {
      if (activeStrategy === 'dca') {
        setStep('Creating DCA order...');
        if (!dcaTotal || !dcaPerCycle) throw new Error('Please fill in all DCA fields');

        const res = await createDCAOrder({
          userPublicKey: wallet.publicKey,
          inputMint: MINTS.USDC,
          outputMint: selectedMint,
          inAmount: Math.round(parseFloat(dcaTotal) * 1_000_000).toString(),
          inAmountPerCycle: Math.round(parseFloat(dcaPerCycle) * 1_000_000).toString(),
          cycleSecondsApart: cycleSeconds,
        });

        if (!res) throw new Error('DCA order creation failed. Check API docs for minimum amounts.');
        setResult({ type: 'dca', data: res });
        return;
      }

      // Trigger orders require authentication
      setStep('Authenticating with Jupiter...');
      const token = await getOrRefreshJwt();
      if (!token) throw new Error('Authentication failed. Please try again.');

      setStep('Setting up vault...');
      const vault = await getOrCreateVault(token);
      if (!vault) throw new Error('Vault setup failed.');

      setStep('Crafting deposit transaction...');
      const decimals = currentToken?.decimals || 9;
      const amount = activeStrategy === 'oco'
        ? parseFloat(ocoAmount)
        : parseFloat(limitAmount);

      if (!amount || amount <= 0) throw new Error('Please enter a valid amount');

      const rawAmount = Math.round(amount * Math.pow(10, decimals));

      const deposit = await craftDeposit(token, {
        inputMint: selectedMint,
        outputMint: MINTS.USDC,
        userAddress: wallet.publicKey,
        amount: rawAmount.toString(),
      });

      if (!deposit) throw new Error('Deposit transaction failed. Minimum order is $10 USD.');

      setStep('Waiting for wallet signature...');
      const tx = VersionedTransaction.deserialize(
        Buffer.from(deposit.transaction, 'base64')
      );
      const signedTx = await wallet.signTransaction(tx);
      const signedTxB64 = Buffer.from(signedTx.serialize()).toString('base64');

      setStep('Placing order on Jupiter...');
      let orderResult;

      if (activeStrategy === 'oco') {
        if (!tpPrice || !slPrice) throw new Error('Please enter Take Profit and Stop Loss prices');
        orderResult = await placeOCOOrder(token, {
          depositRequestId: deposit.requestId,
          depositSignedTx: signedTxB64,
          userPubkey: wallet.publicKey,
          inputMint: selectedMint,
          inputAmount: rawAmount.toString(),
          outputMint: MINTS.USDC,
          triggerMint: selectedMint,
          tpPriceUsd: parseFloat(tpPrice),
          slPriceUsd: parseFloat(slPrice),
        });
      } else if (activeStrategy === 'single') {
        if (!limitPrice) throw new Error('Please enter a trigger price');
        orderResult = await placeSingleOrder(token, {
          depositRequestId: deposit.requestId,
          depositSignedTx: signedTxB64,
          userPubkey: wallet.publicKey,
          inputMint: selectedMint,
          inputAmount: rawAmount.toString(),
          outputMint: MINTS.USDC,
          triggerMint: selectedMint,
          triggerCondition: limitCondition,
          triggerPriceUsd: parseFloat(limitPrice),
        });
      }

      if (!orderResult) throw new Error('Order placement failed. Check minimum order size ($10 USD).');
      setResult({ type: 'order', data: orderResult });
      setStep('');
    } catch (err) {
      setError(err.message);
      setStep('');
    } finally {
      setPlacing(false);
    }
  };

  const strategies = [
    { id: 'oco', label: 'OCO Order', desc: 'Take Profit + Stop Loss' },
    { id: 'single', label: 'Limit Order', desc: 'Single price trigger' },
    { id: 'dca', label: 'DCA Strategy', desc: 'Recurring accumulation' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '520px 1fr', gap: '24px', alignItems: 'start' }}>

      {/* Strategy builder */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '16px', padding: '24px',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
            Strategy Builder
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Combine Jupiter Trigger V2 and Recurring APIs into complete position strategies
          </div>
        </div>

        {/* Strategy type selector */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {strategies.map((s) => (
            <button
              key={s.id}
              onClick={() => { setActiveStrategy(s.id); setResult(null); setError(null); }}
              style={{
                flex: 1, padding: '10px 8px', borderRadius: '8px',
                border: `1px solid ${activeStrategy === s.id ? 'rgba(200,245,89,0.4)' : 'rgba(255,255,255,0.08)'}`,
                background: activeStrategy === s.id ? 'rgba(200,245,89,0.08)' : 'rgba(255,255,255,0.02)',
                color: activeStrategy === s.id ? '#c8f559' : 'var(--text-muted)',
                cursor: 'pointer', transition: 'all 0.15s ease', textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: '700' }}>{s.label}</div>
              <div style={{ fontSize: '10px', marginTop: '2px', opacity: 0.8 }}>{s.desc}</div>
            </button>
          ))}
        </div>

        {/* Token selector */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            fontSize: '11px', color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.5px',
            display: 'block', marginBottom: '8px',
          }}>
            {activeStrategy === 'dca' ? 'Token to Accumulate' : 'Token to Protect'}
          </label>
          <select
            value={selectedMint}
            onChange={(e) => {
              setSelectedMint(e.target.value);
              setTpPrice(''); setSlPrice('');
              setResult(null); setError(null);
            }}
            style={{
              width: '100%',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px', padding: '11px 14px',
              color: 'var(--text-primary)', fontSize: '14px',
              outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="">Select token...</option>
            {enrichedTokens.map((t) => (
              <option key={t.mint} value={t.mint}>
                {t.symbol} — ${t.usdPrice?.toFixed(4)} — Score {t.sentry?.score}
                {t.walletBalance ? ` — ${t.walletBalance.toFixed(4)} held` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Current price + sentry score banner */}
        {currentToken && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'rgba(0,0,0,0.3)',
            border: `1px solid ${currentToken.sentry?.color}30`,
            borderRadius: '8px', padding: '10px 14px', marginBottom: '16px',
          }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                Current Price
              </div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#c8f559' }}>
                ${currentPrice?.toFixed(6)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                Sentry Score
              </div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: currentToken.sentry?.color }}>
                {currentToken.sentry?.score}/100
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                Threat
              </div>
              <div style={{
                fontSize: '12px', fontWeight: '700',
                color: currentToken.threat?.color,
                background: currentToken.threat?.bgColor,
                border: `1px solid ${currentToken.threat?.borderColor}`,
                padding: '2px 8px', borderRadius: '4px',
              }}>
                {currentToken.threat?.level}
              </div>
            </div>
          </div>
        )}

        {/* OCO fields */}
        {activeStrategy === 'oco' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Amount ({currentToken?.symbol || 'tokens'})
              </label>
            </div>
            <input
              type="number"
              value={ocoAmount}
              onChange={(e) => setOcoAmount(e.target.value)}
              placeholder="Amount to protect"
              style={{
                width: '100%', background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px', padding: '10px 14px',
                color: 'var(--text-primary)', fontSize: '14px',
                outline: 'none', boxSizing: 'border-box', marginBottom: '12px',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Price Targets
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={autofillOCO}
                  style={{
                    background: 'rgba(200,245,89,0.08)',
                    border: '1px solid rgba(200,245,89,0.2)',
                    borderRadius: '5px', padding: '3px 8px',
                    color: '#c8f559', fontSize: '10px', fontWeight: '600', cursor: 'pointer',
                  }}
                >
                  +20% / -15%
                </button>
                <button
                  onClick={autofillSentry}
                  style={{
                    background: 'rgba(167,139,250,0.08)',
                    border: '1px solid rgba(167,139,250,0.2)',
                    borderRadius: '5px', padding: '3px 8px',
                    color: '#a78bfa', fontSize: '10px', fontWeight: '600', cursor: 'pointer',
                  }}
                >
                  Sentry AI
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#c8f559', display: 'block', marginBottom: '6px' }}>
                  Take Profit ($)
                </label>
                <input
                  type="number"
                  value={tpPrice}
                  onChange={(e) => setTpPrice(e.target.value)}
                  placeholder={currentPrice ? `e.g. ${(currentPrice * 1.2).toFixed(4)}` : '0.00'}
                  style={{
                    width: '100%', background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(200,245,89,0.25)',
                    borderRadius: '8px', padding: '10px 14px',
                    color: 'var(--text-primary)', fontSize: '14px',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#ef4444', display: 'block', marginBottom: '6px' }}>
                  Stop Loss ($)
                </label>
                <input
                  type="number"
                  value={slPrice}
                  onChange={(e) => setSlPrice(e.target.value)}
                  placeholder={currentPrice ? `e.g. ${(currentPrice * 0.85).toFixed(4)}` : '0.00'}
                  style={{
                    width: '100%', background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(239,68,68,0.25)',
                    borderRadius: '8px', padding: '10px 14px',
                    color: 'var(--text-primary)', fontSize: '14px',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <StrategyTimeline
              token={currentToken}
              tpPrice={tpPrice}
              slPrice={slPrice}
            />
          </div>
        )}

        {/* Single limit order */}
        {activeStrategy === 'single' && (
          <div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                Amount ({currentToken?.symbol || 'tokens'})
              </label>
              <input
                type="number"
                value={limitAmount}
                onChange={(e) => setLimitAmount(e.target.value)}
                placeholder="0.00"
                style={{
                  width: '100%', background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px', padding: '10px 14px',
                  color: 'var(--text-primary)', fontSize: '14px',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                Trigger Condition
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['above', 'below'].map((cond) => (
                  <button
                    key={cond}
                    onClick={() => setLimitCondition(cond)}
                    style={{
                      flex: 1, padding: '8px',
                      borderRadius: '8px',
                      border: `1px solid ${limitCondition === cond ? (cond === 'above' ? 'rgba(200,245,89,0.4)' : 'rgba(239,68,68,0.4)') : 'rgba(255,255,255,0.08)'}`,
                      background: limitCondition === cond ? (cond === 'above' ? 'rgba(200,245,89,0.08)' : 'rgba(239,68,68,0.08)') : 'transparent',
                      color: limitCondition === cond ? (cond === 'above' ? '#c8f559' : '#ef4444') : 'var(--text-muted)',
                      fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                      textTransform: 'uppercase',
                    }}
                  >
                    Price goes {cond}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                Trigger Price ($)
              </label>
              <input
                type="number"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                placeholder={currentPrice?.toFixed(4) || '0.00'}
                style={{
                  width: '100%', background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px', padding: '10px 14px',
                  color: 'var(--text-primary)', fontSize: '14px',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        )}

        {/* DCA fields */}
        {activeStrategy === 'dca' && (
          <div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                Total USDC to Spend
              </label>
              <input
                type="number"
                value={dcaTotal}
                onChange={(e) => setDcaTotal(e.target.value)}
                placeholder="100.00"
                style={{
                  width: '100%', background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px', padding: '10px 14px',
                  color: 'var(--text-primary)', fontSize: '14px',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                USDC Per Purchase
              </label>
              <input
                type="number"
                value={dcaPerCycle}
                onChange={(e) => setDcaPerCycle(e.target.value)}
                placeholder="10.00"
                style={{
                  width: '100%', background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px', padding: '10px 14px',
                  color: 'var(--text-primary)', fontSize: '14px',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                Purchase Frequency
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {CYCLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.seconds}
                    onClick={() => setCycleSeconds(opt.seconds)}
                    style={{
                      padding: '8px', borderRadius: '8px',
                      border: `1px solid ${cycleSeconds === opt.seconds ? 'rgba(200,245,89,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      background: cycleSeconds === opt.seconds ? 'rgba(200,245,89,0.08)' : 'transparent',
                      color: cycleSeconds === opt.seconds ? '#c8f559' : 'var(--text-muted)',
                      fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {dcaCycles > 0 && (
              <div style={{
                background: 'rgba(200,245,89,0.06)',
                border: '1px solid rgba(200,245,89,0.15)',
                borderRadius: '8px', padding: '12px 14px',
              }}>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                  Buy{' '}
                  <span style={{ color: '#c8f559', fontWeight: '700' }}>${dcaPerCycle} USDC</span>
                  {' '}of{' '}
                  <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>
                    {currentToken?.symbol || 'token'}
                  </span>
                  {' '}{cycleLabel}{' '}for{' '}
                  <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>
                    {dcaCycles} cycles
                  </span>
                  {' '}— total{' '}
                  <span style={{ color: '#c8f559', fontWeight: '700' }}>${dcaTotal} USDC</span>
                </div>
              </div>
            )}

            <StrategyTimeline
              token={currentToken}
              tpPrice={tpPrice}
              slPrice={slPrice}
              dcaAmount={dcaPerCycle}
              dcaCycles={dcaCycles}
              cycleLabel={cycleLabel}
            />
          </div>
        )}

        {/* Progress */}
        {placing && step && (
          <div style={{
            marginTop: '16px', background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '8px', padding: '12px 14px',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <div style={{
              width: '14px', height: '14px',
              border: '2px solid rgba(255,255,255,0.1)',
              borderTopColor: '#c8f559',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite', flexShrink: 0,
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{step}</span>
          </div>
        )}

        {/* Result */}
        {result && (
          <div style={{
            marginTop: '16px',
            background: 'rgba(200,245,89,0.06)',
            border: '1px solid rgba(200,245,89,0.2)',
            borderRadius: '8px', padding: '14px',
          }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#c8f559', marginBottom: '6px' }}>
              {result.type === 'dca' ? 'DCA Strategy Created' : 'Order Placed Successfully'}
            </div>
            {result.data?.id && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                ID: {result.data.id}
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            marginTop: '16px',
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '8px', padding: '14px',
            fontSize: '13px', color: '#ef4444',
          }}>
            {error}
          </div>
        )}

        {/* Execute button */}
        <button
          onClick={handleExecute}
          disabled={placing}
          style={{
            width: '100%', marginTop: '16px',
            background: placing ? 'rgba(255,255,255,0.06)' : '#c8f559',
            border: 'none', borderRadius: '10px', padding: '13px',
            color: placing ? 'var(--text-muted)' : '#000',
            fontSize: '14px', fontWeight: '700',
            cursor: placing ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          {!connected
            ? 'Connect Wallet'
            : placing
            ? 'Processing...'
            : activeStrategy === 'oco'
            ? 'Place OCO Order via Jupiter Trigger'
            : activeStrategy === 'single'
            ? 'Place Limit Order via Jupiter Trigger'
            : 'Start DCA via Jupiter Recurring'}
        </button>

        <div style={{ marginTop: '8px', textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
          {activeStrategy === 'dca'
            ? 'Powered by Jupiter Recurring API. 0.1% fee per executed order.'
            : 'Powered by Jupiter Trigger V2. Minimum order: $10 USD. Orders execute automatically.'}
        </div>
      </div>

      {/* Right panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Sentry-recommended tokens */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px', padding: '20px',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
            Sentry Recommendations
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Based on real-time signal analysis
          </div>

          {enrichedTokens.length === 0 ? (
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>
              Add tokens to your portfolio to see recommendations
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {enrichedTokens
                .sort((a, b) => {
                  if (activeStrategy === 'dca') return b.sentry?.score - a.sentry?.score;
                  return a.sentry?.score - b.sentry?.score;
                })
                .map((token) => {
                  const isRelevant = activeStrategy === 'dca'
                    ? token.sentry?.score >= 60
                    : token.sentry?.score < 60;

                  return (
                    <div
                      key={token.mint}
                      onClick={() => setSelectedMint(token.mint)}
                      style={{
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        background: selectedMint === token.mint
                          ? 'rgba(200,245,89,0.06)'
                          : 'rgba(0,0,0,0.2)',
                        border: `1px solid ${selectedMint === token.mint ? 'rgba(200,245,89,0.2)' : 'rgba(255,255,255,0.04)'}`,
                        borderRadius: '8px', cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        opacity: isRelevant ? 1 : 0.5,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {token.logoURI && (
                          <img
                            src={token.logoURI}
                            alt={token.symbol}
                            style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        )}
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                            {token.symbol}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            ${token.usdPrice?.toFixed(4)}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontSize: '11px', fontWeight: '700',
                          color: token.sentry?.color,
                          background: `${token.sentry?.color}15`,
                          padding: '2px 8px', borderRadius: '4px',
                          marginBottom: '4px',
                        }}>
                          {token.sentry?.recommendation}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Score {token.sentry?.score}/100
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* API info card */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px', padding: '20px',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>
            {activeStrategy === 'dca' ? 'Jupiter Recurring API' : 'Jupiter Trigger V2 API'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(activeStrategy === 'dca' ? [
              'Time-based recurring purchases — buy any token on a fixed schedule',
              'Powered by Jupiter\'s smart routing for best execution price each cycle',
              '0.1% fee per executed order — no upfront payment required',
              'Cancel anytime — unused USDC is returned to your wallet',
            ] : activeStrategy === 'oco' ? [
              'OCO = One Cancels the Other — set both TP and SL in a single transaction',
              'Orders live in a private vault — Jupiter executes them automatically',
              'No custody risk — funds return to your wallet on execution',
              'New in Jupiter Trigger V2 — OTOCO support for staged entries',
            ] : [
              'Single trigger order — executes when price crosses your target',
              'Choose direction: trigger when price goes above OR below target',
              'Set expiry date — orders automatically cancel if not triggered',
              'Private and non-custodial — powered by Jupiter Trigger V2',
            ]).map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                <span style={{ color: '#c8f559', flexShrink: 0 }}>•</span>
                <span style={{ color: 'var(--text-muted)', lineHeight: '1.5' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategiesTab;