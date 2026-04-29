import React, { useState } from 'react';
import { useTriggerAuth, useWallet } from '../hooks/useWalletAuth';
import { craftDeposit, placeOCOOrder, getOrCreateVault } from '../services/triggerApi';
import { VersionedTransaction } from '@solana/web3.js';

const MINTS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
};

const OrdersPanel = ({ enrichedTokens }) => {
  const wallet = useWallet();
  const { connected, signTransaction, walletAddress } = wallet;
  const { jwt, authLoading, authError, getOrRefreshJwt } = useTriggerAuth(wallet);
  const [selectedToken, setSelectedToken] = useState(null);
  const [orderType, setOrderType] = useState('oco');
  const [tpPrice, setTpPrice] = useState('');
  const [slPrice, setSlPrice] = useState('');
  const [triggerPrice, setTriggerPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [placing, setPlacing] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [orderError, setOrderError] = useState(null);
  const [step, setStep] = useState('form');

  const currentToken = enrichedTokens.find((t) => t.mint === selectedToken);
  const currentPrice = currentToken?.usdPrice;

  const handlePlaceOrder = async () => {
    if (!connected) { 
      window.solana?.connect().catch(console.error);
      return; 
    }
    if (!selectedToken || !amount) {
      setOrderError('Please select a token and enter an amount');
      return;
    }

    setPlacing(true);
    setOrderError(null);
    setOrderResult(null);

    try {
      setStep('authenticating');
      const token = await getOrRefreshJwt();
      if (!token) throw new Error('Authentication failed. Please try again.');

      setStep('vault');
      const vault = await getOrCreateVault(token);
      if (!vault) throw new Error('Could not access vault');

      setStep('deposit');
      const decimals = currentToken?.decimals || 9;
      const rawAmount = Math.round(parseFloat(amount) * Math.pow(10, decimals));

      const deposit = await craftDeposit(token, {
        inputMint: selectedToken,
        outputMint: MINTS.USDC,
        userAddress: walletAddress,
        amount: rawAmount.toString(),
      });
      if (!deposit) throw new Error('Could not craft deposit transaction');

      setStep('signing');
      const tx = VersionedTransaction.deserialize(
        Buffer.from(deposit.transaction, 'base64')
      );
      const signedTx = await signTransaction(tx);
      const signedTxBase64 = Buffer.from(signedTx.serialize()).toString('base64');

      setStep('placing');
      let result;
      if (orderType === 'oco') {
        result = await placeOCOOrder(token, {
          depositRequestId: deposit.requestId,
          depositSignedTx: signedTxBase64,
          userPubkey: walletAddress,
          inputMint: selectedToken,
          inputAmount: rawAmount.toString(),
          outputMint: MINTS.USDC,
          triggerMint: selectedToken,
          tpPriceUsd: parseFloat(tpPrice),
          slPriceUsd: parseFloat(slPrice),
        });
      }

      if (!result) throw new Error('Order placement failed');
      setOrderResult(result);
      setStep('done');
    } catch (err) {
      setOrderError(err.message);
      setStep('form');
    } finally {
      setPlacing(false);
    }
  };

  const stepLabels = {
    authenticating: 'Authenticating with Jupiter...',
    vault: 'Setting up vault...',
    deposit: 'Crafting deposit transaction...',
    signing: 'Waiting for wallet signature...',
    placing: 'Placing order on Jupiter...',
    done: 'Order placed successfully',
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

      {/* Order Form */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '24px',
      }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
            Place Trigger Order
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Powered by Jupiter Trigger V2 API — OCO orders execute automatically when price conditions are met
          </div>
        </div>

        {/* Order type selector */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {['oco', 'single'].map((type) => (
            <button
              key={type}
              onClick={() => setOrderType(type)}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                border: `1px solid ${orderType === type ? 'var(--accent-green)' : 'var(--border)'}`,
                background: orderType === type ? 'var(--accent-green-dim)' : 'var(--bg-secondary)',
                color: orderType === type ? 'var(--accent-green)' : 'var(--text-muted)',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              {type === 'oco' ? 'OCO (TP/SL)' : 'Single Limit'}
            </button>
          ))}
        </div>

        {/* Token selector */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
            Token to Protect
          </label>
          <select
            value={selectedToken || ''}
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
                {t.symbol} — ${t.usdPrice?.toFixed(4)} (Score: {t.sentry?.score})
              </option>
            ))}
          </select>
        </div>

        {/* Current price display */}
        {currentPrice && (
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Current Price</span>
            <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--accent-green)' }}>
              ${currentPrice.toFixed(4)}
            </span>
          </div>
        )}

        {/* Amount */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
            Amount ({currentToken?.symbol || 'tokens'})
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
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

        {/* OCO fields */}
        {orderType === 'oco' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                Take Profit ($)
              </label>
              <input
                type="number"
                value={tpPrice}
                onChange={(e) => setTpPrice(e.target.value)}
                placeholder={currentPrice ? `e.g. ${(currentPrice * 1.2).toFixed(4)}` : '0.00'}
                style={{
                  width: '100%',
                  background: 'var(--bg-secondary)',
                  border: '1px solid rgba(200, 245, 89, 0.3)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--accent-red)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                Stop Loss ($)
              </label>
              <input
                type="number"
                value={slPrice}
                onChange={(e) => setSlPrice(e.target.value)}
                placeholder={currentPrice ? `e.g. ${(currentPrice * 0.8).toFixed(4)}` : '0.00'}
                style={{
                  width: '100%',
                  background: 'var(--bg-secondary)',
                  border: '1px solid rgba(248, 113, 113, 0.3)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        )}

        {/* Single order field */}
        {orderType === 'single' && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
              Trigger Price ($)
            </label>
            <input
              type="number"
              value={triggerPrice}
              onChange={(e) => setTriggerPrice(e.target.value)}
              placeholder="0.00"
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
        )}

        {/* Sentry suggestion box */}
        {currentToken && (
          <div style={{
            background: 'var(--bg-secondary)',
            border: `1px solid ${currentToken.sentry?.score >= 70 ? 'rgba(200, 245, 89, 0.2)' : currentToken.sentry?.score >= 40 ? 'rgba(251, 191, 36, 0.2)' : 'rgba(248, 113, 113, 0.2)'}`,
            borderRadius: '8px',
            padding: '12px 14px',
            marginBottom: '16px',
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
              SENTRY RECOMMENDATION
            </div>
            <div style={{ fontSize: '13px', color: currentToken.sentry?.color, fontWeight: '600' }}>
              {currentToken.sentry?.recommendation} — Score {currentToken.sentry?.score}/100
            </div>
            {orderType === 'oco' && currentPrice && !tpPrice && !slPrice && (
              <button
                onClick={() => {
                  setTpPrice((currentPrice * 1.15).toFixed(4));
                  setSlPrice((currentPrice * 0.85).toFixed(4));
                }}
                style={{
                  marginTop: '8px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  padding: '5px 10px',
                  color: 'var(--text-secondary)',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                Auto-fill TP +15% / SL -15%
              </button>
            )}
          </div>
        )}

        {/* Progress indicator */}
        {placing && step !== 'form' && (
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '12px 14px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <div style={{
              width: '14px',
              height: '14px',
              border: '2px solid var(--border)',
              borderTopColor: 'var(--accent-green)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              flexShrink: 0,
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {stepLabels[step] || 'Processing...'}
            </span>
          </div>
        )}

        {/* Success */}
        {orderResult && (
          <div style={{
            background: 'var(--accent-green-dim)',
            border: '1px solid rgba(200, 245, 89, 0.3)',
            borderRadius: '8px',
            padding: '12px 14px',
            marginBottom: '16px',
          }}>
            <div style={{ fontSize: '13px', color: 'var(--accent-green)', fontWeight: '600', marginBottom: '4px' }}>
              Order placed successfully
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
              Order ID: {orderResult.id}
            </div>
            {orderResult.txSignature && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '4px', wordBreak: 'break-all' }}>
                TX: {orderResult.txSignature?.slice(0, 20)}...
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {(orderError || authError) && (
          <div style={{
            background: 'var(--accent-red-dim)',
            border: '1px solid rgba(248, 113, 113, 0.2)',
            borderRadius: '8px',
            padding: '12px 14px',
            marginBottom: '16px',
            fontSize: '13px',
            color: 'var(--accent-red)',
          }}>
            {orderError || authError}
          </div>
        )}

        {/* Submit button */}
        <button
          onClick={handlePlaceOrder}
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
            transition: 'all 0.15s ease',
          }}
        >
          {!connected
            ? 'Connect Wallet to Place Order'
            : placing
            ? 'Processing...'
            : `Place ${orderType === 'oco' ? 'OCO' : 'Limit'} Order`}
        </button>

        <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
          Orders are stored off-chain and private. Minimum order: $10 USD.
          Powered by Jupiter Trigger V2.
        </div>
      </div>

      {/* How it works panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '24px',
        }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
            How Sentry Trigger Works
          </div>
          {[
            { step: '1', title: 'Sentry monitors your tokens', desc: 'Price, organic score, and prediction market sentiment are combined into a real-time Sentry Score.' },
            { step: '2', title: 'Score drops below threshold', desc: 'When the Sentry Score indicates risk, you can place an OCO order to protect your position automatically.' },
            { step: '3', title: 'Jupiter Trigger executes', desc: 'Your take profit and stop loss orders live in a private vault. Jupiter executes them automatically when prices hit your targets.' },
            { step: '4', title: 'Funds return to you', desc: 'When an order fills, the output tokens are returned to your wallet. No custody, no counterparty risk.' },
          ].map((item) => (
            <div key={item.step} style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'var(--accent-green-dim)',
                border: '1px solid rgba(200, 245, 89, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: '700',
                color: 'var(--accent-green)',
                flexShrink: 0,
              }}>
                {item.step}
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  {item.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Token risk overview */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '24px',
        }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
            Watchlist Risk Overview
          </div>
          {enrichedTokens.map((token) => {
            const score = token.sentry?.score ?? 0;
            const color = score >= 70 ? 'var(--accent-green)' : score >= 40 ? 'var(--accent-yellow)' : 'var(--accent-red)';
            return (
              <div key={token.mint} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '1px solid var(--border-subtle)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {token.logoURI && (
                    <img src={token.logoURI} alt={token.symbol} style={{ width: '20px', height: '20px', borderRadius: '50%' }} onError={(e) => { e.target.style.display = 'none'; }} />
                  )}
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {token.symbol}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '80px', height: '4px', background: 'var(--bg-card-hover)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: '2px' }} />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '700', color, minWidth: '24px', textAlign: 'right' }}>
                    {score}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OrdersPanel;