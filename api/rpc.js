const axios = require('axios');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const heliusUrl = process.env.REACT_APP_HELIUS_RPC;
  if (!heliusUrl) {
    return res.status(500).json({ error: 'Helius RPC not configured' });
  }

  try {
    const response = await axios.post(heliusUrl, req.body, {
      headers: { 'Content-Type': 'application/json' },
    });
    res.json(response.data);
  } catch (error) {
    res.status(error?.response?.status || 500).json(error?.response?.data || { error: error.message });
  }
};