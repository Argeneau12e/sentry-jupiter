const axios = require('axios');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const response = await axios.get('https://api.jup.ag/tokens/v2/search', {
      params: { query: 'USDC,SOL,USDT' },
      headers: { 'x-api-key': process.env.REACT_APP_JUPITER_API_KEY },
    });
    const tokens = response.data || [];
    const withApy = tokens.filter((t) => t.apy && Object.keys(t.apy).length > 0);
    res.json(withApy);
  } catch (error) {
    res.status(500).json([]);
  }
};