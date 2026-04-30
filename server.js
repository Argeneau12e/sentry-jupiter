require('dotenv').config();

const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 3001;
const JUPITER_BASE = 'https://api.jup.ag';
const API_KEY = process.env.REACT_APP_JUPITER_API_KEY;
const HELIUS_RPC = process.env.REACT_APP_HELIUS_RPC;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
app.use('/api/price', jupiterProxy('/price'));
app.use('/api/tokens', jupiterProxy('/tokens'));
app.use('/api/swap', jupiterProxy('/swap'));
app.use('/api/trigger', jupiterProxy('/trigger'));
app.use('/api/recurring', jupiterProxy('/recurring'));
app.use('/api/prediction', jupiterProxy('/prediction'));
app.post('/api/rpc', async (req, res) => {
  if (!HELIUS_RPC) return res.status(500).json({ error: 'Helius RPC not configured' });
  try {
    const response = await axios.post(HELIUS_RPC, req.body, {
      headers: { 'Content-Type': 'application/json' },
    });
    res.json(response.data);
  } catch (error) {
    res.status(error?.response?.status || 500).json(error?.response?.data || { error: error.message });
  }
});
app.get('/api/lend', async (req, res) => {
  try {
    const response = await axios.get(`${JUPITER_BASE}/tokens/v2/search`, {
      params: { query: 'USDC,SOL,USDT' },
      headers: { 'x-api-key': API_KEY },
    });
    const tokens = response.data || [];
    res.json(tokens.filter((t) => t.apy && Object.keys(t.apy).length > 0));
  } catch (error) {
    res.status(500).json([]);
  }
});

console.log('API Key loaded:', API_KEY ? `${API_KEY.slice(0, 8)}...` : 'MISSING');
console.log('Helius RPC loaded:', HELIUS_RPC ? 'YES' : 'MISSING');

// ── Generic Jupiter proxy ─────────────────────
const jupiterProxy = (prefix) => async (req, res) => {
  const subPath = req.path === '/' ? '' : req.path;
  const targetUrl = `${JUPITER_BASE}${prefix}${subPath}`;
  const params = req.query;
  console.log(`Proxying: ${req.method} ${targetUrl}`);
  try {
    const response = await axios({
      method: req.method,
      url: targetUrl,
      params,
      headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' },
      data: req.body,
    });
    res.json(response.data);
  } catch (error) {
    const status = error?.response?.status || 500;
    const data = error?.response?.data || { error: error.message };
    console.error(`[${status}] ${targetUrl}:`, JSON.stringify(data).slice(0, 200));
    res.status(status).json(data);
  }
};

// ── Solana RPC proxy ──────────────────────────
app.post('/rpc', async (req, res) => {
  if (!HELIUS_RPC) {
    return res.status(500).json({ error: 'Helius RPC not configured in .env' });
  }
  try {
    const response = await axios.post(HELIUS_RPC, req.body, {
      headers: { 'Content-Type': 'application/json' },
    });
    res.json(response.data);
  } catch (error) {
    const status = error?.response?.status || 500;
    const data = error?.response?.data || { error: error.message };
    console.error(`RPC error [${status}]:`, JSON.stringify(data).slice(0, 200));
    res.status(status).json(data);
  }
});

// ── Lend rates ────────────────────────────────
app.get('/lend/rates', async (req, res) => {
  try {
    const response = await axios.get(`${JUPITER_BASE}/tokens/v2/search`, {
      params: { query: 'USDC,SOL,USDT' },
      headers: { 'x-api-key': API_KEY },
    });
    const tokens = response.data || [];
    const withApy = tokens.filter((t) => t.apy && Object.keys(t.apy).length > 0);
    res.json(withApy);
  } catch (error) {
    console.error('Lend rates error:', error?.response?.data || error.message);
    res.status(500).json([]);
  }
});

// ── Jupiter API routes ────────────────────────
app.use('/price', jupiterProxy('/price'));
app.use('/tokens', jupiterProxy('/tokens'));
app.use('/swap', jupiterProxy('/swap'));
app.use('/trigger', jupiterProxy('/trigger'));
app.use('/recurring', jupiterProxy('/recurring'));
app.use('/prediction', jupiterProxy('/prediction'));

// ── Start server ──────────────────────────────
app.listen(PORT, () => {
  console.log(`Sentry proxy running on http://localhost:${PORT}`);
});