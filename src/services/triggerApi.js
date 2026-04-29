import { VersionedTransaction } from '@solana/web3.js';

const API_BASE = process.env.REACT_APP_API_BASE
  || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001');
const API_KEY = process.env.REACT_APP_JUPITER_API_KEY;

const triggerHeaders = (jwt) => ({
  'Content-Type': 'application/json',
  'x-api-key': API_KEY,
  ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
});

// ─────────────────────────────────────────
// Get or register vault
// ─────────────────────────────────────────
export const getOrCreateVault = async (jwt) => {
  try {
    let res = await fetch(`${TRIGGER_BASE}/vault`, {
      headers: triggerHeaders(jwt),
    });

    if (res.status === 404) {
      res = await fetch(`${TRIGGER_BASE}/vault/register`, {
        method: 'POST',
        headers: triggerHeaders(jwt),
      });
    }

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Vault fetch failed');
    }

    return await res.json();
  } catch (err) {
    console.error('Vault error:', err.message);
    return null;
  }
};

// ─────────────────────────────────────────
// Craft deposit transaction
// ─────────────────────────────────────────
export const craftDeposit = async (jwt, {
  inputMint,
  outputMint,
  userAddress,
  amount,
}) => {
  try {
    const res = await fetch(`${TRIGGER_BASE}/deposit/craft`, {
      method: 'POST',
      headers: triggerHeaders(jwt),
      body: JSON.stringify({ inputMint, outputMint, userAddress, amount }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Deposit craft failed');
    }

    return await res.json();
  } catch (err) {
    console.error('Craft deposit error:', err.message);
    return null;
  }
};

// ─────────────────────────────────────────
// Place OCO order (Take Profit + Stop Loss)
// This is the core Sentry action
// ─────────────────────────────────────────
export const placeOCOOrder = async (jwt, {
  depositRequestId,
  depositSignedTx,
  userPubkey,
  inputMint,
  inputAmount,
  outputMint,
  triggerMint,
  tpPriceUsd,
  slPriceUsd,
  expiresAt,
}) => {
  try {
    const res = await fetch(`${TRIGGER_BASE}/orders/price`, {
      method: 'POST',
      headers: triggerHeaders(jwt),
      body: JSON.stringify({
        orderType: 'oco',
        depositRequestId,
        depositSignedTx,
        userPubkey,
        inputMint,
        inputAmount,
        outputMint,
        triggerMint,
        tpPriceUsd,
        slPriceUsd,
        tpSlippageBps: 100,
        slSlippageBps: 200,
        expiresAt: expiresAt || Date.now() + 7 * 24 * 60 * 60 * 1000,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'OCO order failed');
    }

    return await res.json();
  } catch (err) {
    console.error('OCO order error:', err.message);
    return null;
  }
};

// ─────────────────────────────────────────
// Place Single Limit Order
// ─────────────────────────────────────────
export const placeSingleOrder = async (jwt, {
  depositRequestId,
  depositSignedTx,
  userPubkey,
  inputMint,
  inputAmount,
  outputMint,
  triggerMint,
  triggerCondition,
  triggerPriceUsd,
}) => {
  try {
    const res = await fetch(`${TRIGGER_BASE}/orders/price`, {
      method: 'POST',
      headers: triggerHeaders(jwt),
      body: JSON.stringify({
        orderType: 'single',
        depositRequestId,
        depositSignedTx,
        userPubkey,
        inputMint,
        inputAmount,
        outputMint,
        triggerMint,
        triggerCondition,
        triggerPriceUsd,
        slippageBps: 100,
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Single order failed');
    }

    return await res.json();
  } catch (err) {
    console.error('Single order error:', err.message);
    return null;
  }
};

// ─────────────────────────────────────────
// Get active orders for wallet
// ─────────────────────────────────────────
export const getActiveOrders = async (jwt, walletAddress) => {
  try {
    const res = await fetch(
      `${TRIGGER_BASE}/orders?userPubkey=${walletAddress}&status=open`,
      { headers: triggerHeaders(jwt) }
    );

    if (!res.ok) return [];
    const data = await res.json();
    return data.orders || data || [];
  } catch (err) {
    console.error('Get orders error:', err.message);
    return [];
  }
};

// ─────────────────────────────────────────
// Cancel an order
// ─────────────────────────────────────────
export const cancelOrder = async (jwt, orderId) => {
  try {
    const res = await fetch(`${TRIGGER_BASE}/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: triggerHeaders(jwt),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Cancel failed');
    }

    return await res.json();
  } catch (err) {
    console.error('Cancel order error:', err.message);
    return null;
  }
};