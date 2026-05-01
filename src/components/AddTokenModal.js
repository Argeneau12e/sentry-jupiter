import React, { useState, useEffect } from 'react';
import { searchTokens } from '../services/jupiterApi';

const AddTokenModal = ({ onAdd, onClose, existingMints }) => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

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

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 300,
        backdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-6)',
          width: '500px',
          maxWidth: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          backdropFilter: 'var(--glass-blur)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
          <h2 style={{ fontSize: 'var(--text-h3)', fontWeight: '700', color: 'var(--text-primary)' }}>
            Add Token
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '6px 12px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 'var(--text-lg)',
            }}
          >
            ×
          </button>
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, symbol, or mint address..."
          style={{
            width: '100%',
            background: 'var(--bg-input)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3) var(--space-4)',
            color: 'var(--text-primary)',
            fontSize: 'var(--text-base)',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />

        {searching && (
          <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-muted)' }}>
            Searching...
          </div>
        )}

        <div style={{ marginTop: 'var(--space-4)' }}>
          {searchResults.map((token) => {
            const isExisting = existingMints.includes(token.id);
            return (
              <div
                key={token.id}
                onClick={() => !isExisting && onAdd(token.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  cursor: isExisting ? 'not-allowed' : 'pointer',
                  transition: 'all var(--transition-fast)',
                  opacity: isExisting ? 0.5 : 1,
                  background: 'rgba(0,0,0,0.2)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                {token.icon || token.logoURI ? (
                  <img
                    src={token.icon || token.logoURI}
                    alt={token.symbol}
                    style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-full)' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--bg-card-hover)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: '700',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {token.symbol?.charAt(0)}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {token.symbol}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    {token.name}
                  </div>
                </div>
                {isExisting ? (
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Already added</span>
                ) : (
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--success)' }}>Add</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AddTokenModal;