const RECURRING_BASE = 'http://localhost:3001/recurring/v1';
const API_KEY = process.env.REACT_APP_JUPITER_API_KEY;

const recurringHeaders = () => ({
  'Content-Type': 'application/json',
  'x-api-key': API_KEY,
});

// ─────────────────────────────────────────
// Create a DCA order
// Triggered when Sentry score crosses above 70
// (accumulate the token over time)
// ─────────────────────────────────────────
export const createDCAOrder = async ({
  userPublicKey,
  inputMint,
  outputMint,
  inAmount,
  inAmountPerCycle,
  cycleSecondsApart,
}) => {
  try {
    const res = await fetch(`${RECURRING_BASE}/createOrder`, {
      method: 'POST',
      headers: recurringHeaders(),
      body: JSON.stringify({
        userPublicKey,
        inputMint,
        outputMint,
        inAmount: inAmount.toString(),
        inAmountPerCycle: inAmountPerCycle.toString(),
        cycleSecondsApart,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'DCA order failed');
    }

    return await res.json();
  } catch (err) {
    console.error('DCA order error:', err.message);
    return null;
  }
};

// ─────────────────────────────────────────
// Get active DCA orders for a wallet
// ─────────────────────────────────────────
export const getActiveDCAOrders = async (walletAddress) => {
  try {
    const res = await fetch(
      `${RECURRING_BASE}/orders?userPublicKey=${walletAddress}&status=active`,
      { headers: recurringHeaders() }
    );

    if (!res.ok) return [];
    const data = await res.json();
    return data.orders || data || [];
  } catch (err) {
    console.error('Get DCA orders error:', err.message);
    return [];
  }
};

// ─────────────────────────────────────────
// Cancel a DCA order
// ─────────────────────────────────────────
export const cancelDCAOrder = async (orderAddress) => {
  try {
    const res = await fetch(`${RECURRING_BASE}/cancelOrder`, {
      method: 'POST',
      headers: recurringHeaders(),
      body: JSON.stringify({ orderAddress }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Cancel DCA failed');
    }

    return await res.json();
  } catch (err) {
    console.error('Cancel DCA error:', err.message);
    return null;
  }
};