import { useState, useEffect, useCallback } from 'react';

const API_BASE = process.env.REACT_APP_API_BASE
  || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001');

const fetchRPC = async (method, params) => {
  const response = await fetch(`${API_BASE}/rpc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now().toString(),
      method,
      params,
    }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || 'RPC error');
  return data.result;
};

export const useWalletBalances = (walletAddress) => {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBalances = useCallback(async () => {
  if (!walletAddress) {
    setBalances([]);
    return;
  }

  setLoading(true);
  setError(null);

  try {
    // Get SOL balance
    const solResult = await fetchRPC('getBalance', [walletAddress]);
    const solBalance = solResult?.value ?? 0;

    // Get SPL token accounts — correct Helius format
    const tokenResult = await fetchRPC('getTokenAccountsByOwner', [
      walletAddress,
      {
        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
      },
      {
        encoding: 'jsonParsed',
      },
    ]);

    const tokens = [];

    // Add SOL
    if (solBalance > 0) {
      tokens.push({
        mint: 'So11111111111111111111111111111111111111112',
        balance: solBalance / 1e9,
        decimals: 9,
        symbol: 'SOL',
        source: 'wallet',
      });
    }

    // Add SPL tokens
    const accounts = tokenResult?.value || [];
    for (const account of accounts) {
      const info = account.account?.data?.parsed?.info;
      if (!info) continue;
      const amount = parseFloat(info.tokenAmount?.uiAmount || 0);
      if (amount > 0) {
        tokens.push({
          mint: info.mint,
          balance: amount,
          decimals: info.tokenAmount?.decimals || 0,
          source: 'wallet',
        });
      }
    }

    console.log(`Wallet loaded: ${tokens.length} tokens found for ${walletAddress.slice(0, 8)}...`);
    setBalances(tokens);
  } catch (err) {
    console.error('Balance fetch error:', err.message);
    setError('Could not read wallet balances.');
    setBalances([]);
  } finally {
    setLoading(false);
  }
}, [walletAddress]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  return { balances, loading, error, refetch: fetchBalances };
};