import React, { useState, useEffect, useRef } from 'react';
import { searchTokens } from '../services/jupiterApi';

const AddTokenModal = ({ onAdd, onClose, existingMints }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearchError(null);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      setSearchError(null);
      try {
        const data = await searchTokens(query.trim());
        setResults(data.slice(0, 8));
      } catch (err) {
        setSearchError('Search failed. Check your API key.');
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleAdd = (mint) => {
    if (existingMints.includes(mint)) return;
    onAdd(mint);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          zIndex: 200,
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 201,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        width: '480px',
        maxWidth: '90vw',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* Modal header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
              Add Token to Watchlist
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Search by name, symbol, or paste a mint address
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '4px 10px',
              color: 'var(--text-muted)',
              fontSize: '16px',
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            x
          </button>
        </div>

        {/* Search input */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ position: 'relative' }}>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tokens... e.g. SOL, BONK, or mint address"
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
                transition: 'border-color 0.15s ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--accent-purple)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border)';
              }}
            />
            {searching && (
              <div style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '14px',
                height: '14px',
                border: '2px solid var(--border)',
                borderTopColor: 'var(--accent-purple)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
            )}
          </div>
          <style>{`
            @keyframes spin {
              to { transform: translateY(-50%) rotate(360deg); }
            }
          `}</style>
        </div>

        {/* Results */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {searchError && (
            <div style={{
              padding: '16px 24px',
              color: 'var(--accent-red)',
              fontSize: '13px',
            }}>
              {searchError}
            </div>
          )}

          {!searching && !searchError && results.length === 0 && query.trim() && (
            <div style={{
              padding: '32px 24px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '14px',
            }}>
              No tokens found for "{query}"
            </div>
          )}

          {!query.trim() && (
            <div style={{
              padding: '32px 24px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '14px',
            }}>
              Start typing to search any Solana token
            </div>
          )}

          {results.map((token) => {
            const alreadyAdded = existingMints.includes(token.id);

            return (
              <div
                key={token.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 24px',
                  borderBottom: '1px solid var(--border)',
                  cursor: alreadyAdded ? 'default' : 'pointer',
                  opacity: alreadyAdded ? 0.5 : 1,
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!alreadyAdded) e.currentTarget.style.background = 'var(--bg-card-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {/* Token info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {token.icon ? (
                    <img
                      src={token.icon}
                      alt={token.symbol}
                      style={{ width: '36px', height: '36px', borderRadius: '50%' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'var(--bg-card-hover)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: '700',
                      color: 'var(--text-secondary)',
                    }}>
                      {token.symbol?.charAt(0) || '?'}
                    </div>
                  )}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {token.symbol}
                      </span>
                      {token.isVerified && (
                        <span style={{
                          fontSize: '10px',
                          background: 'rgba(59, 130, 246, 0.15)',
                          color: 'var(--accent-blue)',
                          padding: '1px 5px',
                          borderRadius: '3px',
                          fontWeight: '600',
                        }}>
                          VERIFIED
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '1px' }}>
                      {token.name}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px', fontFamily: 'monospace' }}>
                      {token.id?.slice(0, 12)}...
                    </div>
                  </div>
                </div>

                {/* Organic score + add button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {token.organicScore !== undefined && token.organicScore !== null && (
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      textAlign: 'right',
                    }}>
                      <div style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>
                        {token.organicScore.toFixed(0)}
                      </div>
                      <div>organic</div>
                    </div>
                  )}
                  <button
                    onClick={() => handleAdd(token.id)}
                    disabled={alreadyAdded}
                    style={{
                      background: alreadyAdded
                        ? 'var(--bg-card-hover)'
                        : 'linear-gradient(135deg, var(--accent-purple), var(--accent-blue))',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '7px 14px',
                      color: alreadyAdded ? 'var(--text-muted)' : '#fff',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: alreadyAdded ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {alreadyAdded ? 'Added' : 'Add'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </>
  );
};

export default AddTokenModal;