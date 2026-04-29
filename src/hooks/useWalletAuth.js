import { useState, useCallback, useEffect } from 'react';
import bs58 from 'bs58';
import { VersionedTransaction } from '@solana/web3.js';

export const useWallet = () => {
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState(null);
  const [connecting, setConnecting] = useState(false);

  // Check if already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (window.solana?.isPhantom) {
        try {
          const resp = await window.solana.connect({ onlyIfTrusted: true });
          setPublicKey(resp.publicKey.toString());
          setConnected(true);
        } catch {
          // Not previously connected, that is fine
        }
      }
    };
    checkConnection();

    // Listen for wallet events
    if (window.solana) {
      window.solana.on('connect', (publicKey) => {
        setPublicKey(publicKey.toString());
        setConnected(true);
      });
      window.solana.on('disconnect', () => {
        setPublicKey(null);
        setConnected(false);
      });
    }

    return () => {
      window.solana?.removeAllListeners?.('connect');
      window.solana?.removeAllListeners?.('disconnect');
    };
  }, []);

  const connect = useCallback(async () => {
    if (!window.solana?.isPhantom) {
      window.open('https://phantom.app/', '_blank');
      return;
    }
    setConnecting(true);
    try {
      const resp = await window.solana.connect();
      setPublicKey(resp.publicKey.toString());
      setConnected(true);
    } catch (err) {
      console.error('Wallet connect error:', err);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    await window.solana?.disconnect();
    setPublicKey(null);
    setConnected(false);
  }, []);

  const signMessage = useCallback(async (message) => {
    if (!window.solana) throw new Error('Wallet not connected');
    const encodedMessage = new TextEncoder().encode(message);
    const { signature } = await window.solana.signMessage(encodedMessage, 'utf8');
    return signature;
  }, []);

  const signTransaction = useCallback(async (transaction) => {
    if (!window.solana) throw new Error('Wallet not connected');
    try {
      const signed = await window.solana.signTransaction(transaction);
      return signed;
    } catch (err) {
      console.error('Sign transaction error:', err);
      throw err;
    }
  }, []);

  return {
    connected,
    publicKey,
    connecting,
    connect,
    disconnect,
    signMessage,
    signTransaction,
    walletAddress: publicKey,
  };
};

// Separate hook specifically for Trigger API JWT authentication
export const useTriggerAuth = (wallet) => {
  const [jwt, setJwt] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  const API_KEY = process.env.REACT_APP_JUPITER_API_KEY;
  const TRIGGER_BASE = 'http://localhost:3001/trigger/v2';

  const authenticate = useCallback(async () => {
    if (!wallet.connected || !wallet.publicKey) {
      setAuthError('Wallet not connected');
      return null;
    }

    setAuthLoading(true);
    setAuthError(null);

    try {
      // Step 1 — Request challenge
      const challengeRes = await fetch(`${TRIGGER_BASE}/auth/challenge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        body: JSON.stringify({
          walletPubkey: wallet.publicKey,
          type: 'message',
        }),
      });

      if (!challengeRes.ok) {
        const err = await challengeRes.json();
        throw new Error(err.message || 'Challenge request failed');
      }

      const challenge = await challengeRes.json();

      // Step 2 — Sign the challenge
      const signature = await wallet.signMessage(challenge.challenge);

      // Step 3 — Verify and get JWT
      const verifyRes = await fetch(`${TRIGGER_BASE}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        body: JSON.stringify({
          type: 'message',
          walletPubkey: wallet.publicKey,
          signature: bs58.encode(signature),
        }),
      });

      if (!verifyRes.ok) {
        const err = await verifyRes.json();
        throw new Error(err.message || 'Verification failed');
      }

      const { token } = await verifyRes.json();
      setJwt(token);
      return token;
    } catch (err) {
      setAuthError(err.message);
      return null;
    } finally {
      setAuthLoading(false);
    }
  }, [wallet, API_KEY, TRIGGER_BASE]);

  const getOrRefreshJwt = useCallback(async () => {
    if (jwt) return jwt;
    return authenticate();
  }, [jwt, authenticate]);

  return { jwt, authLoading, authError, authenticate, getOrRefreshJwt };
};