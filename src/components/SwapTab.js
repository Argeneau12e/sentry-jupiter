import React, { useState, useEffect, useCallback } from 'react';
import { getSwapQuote, searchTokens, MINTS } from '../services/jupiterApi';

const formatPrice = (price) => {
  if (price === null || price === undefined) return '—';
  if (price < 0.001) return `$${price.toFixed(6)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(2)}`;
};

const POPULAR_TOKENS = [
  { mint: MINTS.SOL, symbol: 'SOL', name: 'Solana' },
  { mint: MINTS.USDC, symbol: 'USDC', name: 'USD Coin' },
  { mint: MINTS.JUP, symbol: 'JUP', name: 'Jupiter' },
  { mint: MINTS.BONK, symbol: 'BONK', name: 'Bonk' },
  { mint: MINTS.WIF, symbol: 'WIF', name: 'dogwifhat' },
];

const TokenSelector = ({ value, onChange, label, tokens, walletTokens = [] }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const selectedToken = [...POPULAR_TOKENS, ...tokens].find((t) => t.mint === value);

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      const results = await searchTokens(query);
      setSearchResults(results.slice(0, 6));
      setSearching(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const allOptions = query.trim()
    ? searchResults
    : [...walletTokens, ...POPULAR_TOKENS.filter((p) =>
        !walletTokens.find((w) => w.mint === p.mint)
      )];

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        fontSize: '11px', color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.5px',
        marginBottom: '8px',
      }}>
        {label}
      </div>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(200,245,89,0.3)'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
      >
        {selectedToken?.icon || selectedToken?.logoURI ? (
          <img
            src={selectedToken.icon || selectedToken.logoURI}
            alt={selectedToken.symbol}
            style={{ width: '28px', height: '28px', borderRadius: '50%' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)',
          }}>
            {selectedToken?.symbol?.charAt(0) || '?'}
          </div>
        )}
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
            {selectedToken?.symbol || 'Select token'}
          </div>
          {selectedToken?.name && (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {selectedToken.name}
            </div>
          )}
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>▼</span>
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 10 }}
          />
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0, right: 0,
            background: '#1a1d24',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            zIndex: 11,
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}>
            <div style={{ padding: '12px' }}>
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, symbol, or mint address..."
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {searching && (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                Searching...
              </div>
            )}

            <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
              {!query && walletTokens.length > 0 && (
                <div style={{ padding: '6px 12px 4px', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Your Wallet
                </div>
              )}
              {allOptions.map((token) => (
                <div
                  key={token.mint || token.id}
                  onClick={() => {
                    onChange(token.mint || token.id);
                    setOpen(false);
                    setQuery('');
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 16px', cursor: 'pointer',
                    transition: 'background 0.1s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {(token.icon || token.logoURI) ? (
                    <img
                      src={token.icon || token.logoURI}
                      alt={token.symbol}
                      style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: 'rgba(255,255,255,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)',
                    }}>
                      {token.symbol?.charAt(0) || '?'}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {token.symbol}
                      </span>
                      {token.isVerified && (
                        <span style={{
                          fontSize: '9px', background: 'rgba(96,165,250,0.15)',
                          color: '#60a5fa', padding: '1px 4px', borderRadius: '3px', fontWeight: '700',
                        }}>
                          VERIFIED
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {token.name}
                    </div>
                  </div>
                  {token.walletBalance && (
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'right' }}>
                      {token.walletBalance.toFixed(4)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const SwapTab = ({ tokens, wallet }) => {
  const { connected, connect } = wallet;

  const [inputMint, setInputMint] = useState(MINTS.SOL);
  const [outputMint, setOutputMint] = useState(MINTS.USDC);
  const [inputAmount, setInputAmount] = useState('');
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(null);
  const [swapping, setSwapping] = useState(false);
  const [swapResult, setSwapResult] = useState(null);

  const inputToken = tokens.find((t) => t.mint === inputMint)
    || POPULAR_TOKENS.find((t) => t.mint === inputMint);
  const outputToken = tokens.find((t) => t.mint === outputMint)
    || POPULAR_TOKENS.find((t) => t.mint === outputMint);

  const walletTokens = tokens.map((t) => ({
    ...t,
    id: t.mint,
    walletBalance: t.walletBalance,
  }));

  // Auto-fetch quote when inputs change
  const fetchQuote = useCallback(async () => {
    if (!inputMint || !outputMint || !inputAmount || parseFloat(inputAmount) <= 0) {
      setQuote(null);
      return;
    }

    setQuoteLoading(true);
    setQuoteError(null);

    try {
      const decimals = inputToken?.decimals || 9;
      const q = await getSwapQuote(inputMint, outputMint, parseFloat(inputAmount), decimals);
      setQuote(q);
    } catch (err) {
      setQuoteError('Could not fetch quote. Try again.');
    } finally {
      setQuoteLoading(false);
    }
  }, [inputMint, outputMint, inputAmount, inputToken]);

  useEffect(() => {
    const timer = setTimeout(fetchQuote, 600);
    return () => clearTimeout(timer);
  }, [fetchQuote]);

  const handleFlip = () => {
    setInputMint(outputMint);
    setOutputMint(inputMint);
    setInputAmount('');
    setQuote(null);
  };

  const handleSwap = async () => {
  if (!connected) { connect(); return; }
  if (!quote) return;

  setSwapping(true);
  setSwapResult(null);

  try {
    // Build the swap transaction using Swap V2
    const API_KEY = process.env.REACT_APP_JUPITER_API_KEY;

    const buildRes = await fetch('http://localhost:3001/swap/v2/build', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify({
        quoteResponse: quote,
        userPublicKey: wallet.publicKey,
        wrapAndUnwrapSol: true,
      }),
    });

    if (!buildRes.ok) {
      const err = await buildRes.json();
      throw new Error(err.message || err.error || 'Failed to build swap transaction');
    }

    const { swapTransaction } = await buildRes.json();

    if (!swapTransaction) {
      throw new Error('No transaction returned from Jupiter');
    }

    // Deserialize and sign with Phantom
    const { VersionedTransaction } = await import('@solana/web3.js');
    const txBuffer = Buffer.from(swapTransaction, 'base64');
    const transaction = VersionedTransaction.deserialize(txBuffer);

    const signedTx = await wallet.signTransaction(transaction);
    const signedTxBase64 = Buffer.from(signedTx.serialize()).toString('base64');

    // Execute the swap
    const execRes = await fetch('http://localhost:3001/swap/v2/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify({
        signedTransaction: signedTxBase64,
      }),
    });

    const execData = await execRes.json();

    if (execData.error || !execData.txid) {
      throw new Error(execData.error || execData.message || 'Swap execution failed');
    }

    setSwapResult({
      success: true,
      message: `Swap executed successfully.`,
      txId: execData.txid,
    });

    setInputAmount('');
    setQuote(null);
  } catch (err) {
    console.error('Swap error:', err);
    setSwapResult({
      success: false,
      message: err.message || 'Swap failed. Please try again.',
    });
  } finally {
    setSwapping(false);
  }
};

  const outputAmount = quote
    ? quote.outAmount
      ? (parseInt(quote.outAmount) / Math.pow(10, outputToken?.decimals || 6)).toFixed(6)
      : quote.outputAmount
      ? (parseInt(quote.outputAmount) / Math.pow(10, outputToken?.decimals || 6)).toFixed(6)
      : null
    : null;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '480px 1fr',
      gap: '24px',
      alignItems: 'start',
    }}>

      {/* Swap form */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '16px',
        padding: '24px',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
            Swap
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Best price across all Solana DEXs via Jupiter Swap V2
          </div>
        </div>

        {/* Input token */}
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '4px',
        }}>
          <TokenSelector
            value={inputMint}
            onChange={setInputMint}
            label="You Pay"
            tokens={walletTokens}
            walletTokens={walletTokens}
          />
          <div style={{ marginTop: '12px' }}>
            <input
              type="number"
              value={inputAmount}
              onChange={(e) => setInputAmount(e.target.value)}
              placeholder="0.00"
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                fontSize: '28px',
                fontWeight: '700',
                color: 'var(--text-primary)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {inputToken?.walletBalance && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Balance: {inputToken.walletBalance.toFixed(4)} {inputToken.symbol}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[0.25, 0.5, 1].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setInputAmount((inputToken.walletBalance * pct).toFixed(6))}
                      style={{
                        background: 'rgba(200,245,89,0.1)',
                        border: '1px solid rgba(200,245,89,0.2)',
                        borderRadius: '4px',
                        padding: '2px 6px',
                        color: '#c8f559',
                        fontSize: '10px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      {pct === 1 ? 'MAX' : `${pct * 100}%`}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Flip button */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
          <button
            onClick={handleFlip}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              width: '36px', height: '36px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: '16px', color: 'var(--text-secondary)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(200,245,89,0.1)';
              e.currentTarget.style.color = '#c8f559';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            ⇅
          </button>
        </div>

        {/* Output token */}
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px',
        }}>
          <TokenSelector
            value={outputMint}
            onChange={setOutputMint}
            label="You Receive"
            tokens={walletTokens}
            walletTokens={walletTokens}
          />
          <div style={{ marginTop: '12px' }}>
            {quoteLoading ? (
              <div style={{
                fontSize: '28px', fontWeight: '700',
                color: 'var(--text-muted)',
                animation: 'pulse 1s ease-in-out infinite',
              }}>
                ...
              </div>
            ) : (
              <div style={{
                fontSize: '28px', fontWeight: '700',
                color: outputAmount ? 'var(--text-primary)' : 'var(--text-muted)',
              }}>
                {outputAmount || '0.00'}
              </div>
            )}
          </div>
        </div>

        {/* Quote details */}
        {quote && !quoteLoading && (
          <div style={{
            background: 'rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '8px',
            padding: '12px 14px',
            marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                {
                  label: 'Price Impact',
                  value: quote.priceImpact !== undefined
                    ? `${(quote.priceImpact * 100).toFixed(4)}%`
                    : quote.priceImpactPct
                    ? `${parseFloat(quote.priceImpactPct).toFixed(4)}%`
                    : '< 0.01%',
                  warn: (parseFloat(quote.priceImpactPct || quote.priceImpact || 0) * 100) > 1,
                },
                {
                  label: 'Route',
                  value: quote.routePlan?.[0]?.swapInfo?.label || 'Jupiter V2',
                  warn: false,
                },
                {
                  label: 'Slippage',
                  value: '0.5%',
                  warn: false,
                },
              ].map((row) => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between', fontSize: '12px',
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                  <span style={{ color: row.warn ? '#ef4444' : 'var(--text-secondary)', fontWeight: '600' }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {quoteError && (
          <div style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '8px', padding: '10px 14px',
            marginBottom: '16px', fontSize: '13px', color: '#ef4444',
          }}>
            {quoteError}
          </div>
        )}

        {swapResult && (
          <div style={{
            background: swapResult.success
              ? 'rgba(200,245,89,0.08)'
              : 'rgba(239,68,68,0.08)',
            border: `1px solid ${swapResult.success
              ? 'rgba(200,245,89,0.2)'
              : 'rgba(239,68,68,0.2)'}`,
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '16px',
            fontSize: '13px',
            color: swapResult.success ? '#c8f559' : '#ef4444',
          }}>
            {swapResult.message}
            {swapResult.txId && (
              <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                TX: {swapResult.txId}
              </div>
            )}
          </div>
        )}

        {/* Swap button */}
        <button
          onClick={handleSwap}
          disabled={swapping || quoteLoading || (!quote && !!inputAmount)}
          style={{
            width: '100%',
            background: !connected
              ? '#c8f559'
              : !inputAmount || !quote
              ? 'rgba(255,255,255,0.06)'
              : swapping
              ? 'rgba(200,245,89,0.5)'
              : '#c8f559',
            border: 'none',
            borderRadius: '12px',
            padding: '14px',
            color: !connected || (inputAmount && quote && !swapping) ? '#000' : 'var(--text-muted)',
            fontSize: '15px',
            fontWeight: '700',
            cursor: swapping ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          {!connected
            ? 'Connect Wallet'
            : swapping
            ? 'Preparing swap...'
            : !inputAmount
            ? 'Enter an amount'
            : quoteLoading
            ? 'Fetching best price...'
            : !quote
            ? 'No route found'
            : `Swap ${inputToken?.symbol || ''} for ${outputToken?.symbol || ''}`}
        </button>

        <div style={{ marginTop: '10px', textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
          Powered by Jupiter Swap V2 — best price across all Solana DEXs
        </div>
      </div>

      {/* Right panel — Sentry swap intelligence */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Token health for selected input */}
        {inputToken && tokens.find((t) => t.mint === inputMint) && (() => {
          const t = tokens.find((tok) => tok.mint === inputMint);
          return (
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px', padding: '20px',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}>
              <div style={{
                fontSize: '11px', color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px',
              }}>
                Sentry Analysis — {t.symbol}
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px',
              }}>
                <div style={{
                  padding: '4px 10px', borderRadius: '6px',
                  background: `${t.threat?.color || '#c8f559'}15`,
                  border: `1px solid ${t.threat?.color || '#c8f559'}30`,
                  fontSize: '12px', fontWeight: '700',
                  color: t.threat?.color || '#c8f559',
                }}>
                  {t.threat?.level || 'LOW'} THREAT
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Score {t.sentry?.score}/100
                </div>
              </div>
              {t.threat?.warnings?.slice(0, 3).map((w, i) => (
                <div key={i} style={{
                  fontSize: '12px', color: 'var(--text-muted)',
                  display: 'flex', gap: '6px', marginBottom: '4px',
                }}>
                  <span style={{ color: t.threat.color, flexShrink: 0 }}>!</span>
                  {w}
                </div>
              ))}
              {t.threat?.positives?.slice(0, 2).map((p, i) => (
                <div key={i} style={{
                  fontSize: '12px', color: 'var(--text-muted)',
                  display: 'flex', gap: '6px', marginBottom: '4px',
                }}>
                  <span style={{ color: '#c8f559', flexShrink: 0 }}>✓</span>
                  {p}
                </div>
              ))}
            </div>
          );
        })()}

        {/* Why swap section */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px', padding: '20px',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>
            Jupiter Swap V2
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { title: 'Best price routing', desc: 'Scans all Solana DEXs simultaneously to find the optimal swap route' },
              { title: 'Gasless swaps built in', desc: 'Swap V2 supports gasless execution — no SOL needed for certain routes' },
              { title: 'MEV protection', desc: 'Jupiter Ultra protects against front-running and sandwich attacks' },
              { title: 'Positive slippage returned', desc: 'Any positive slippage from better-than-quoted execution goes back to you' },
            ].map((item) => (
              <div key={item.title} style={{ display: 'flex', gap: '10px' }}>
                <div style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: '#c8f559', marginTop: '6px', flexShrink: 0,
                }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                    {item.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwapTab;