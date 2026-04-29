const axios = require('axios');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const response = await axios({
      method: req.method,
      url: `https://api.jup.ag/swap${req.url}`,
      params: req.query,
      headers: { 'x-api-key': process.env.REACT_APP_JUPITER_API_KEY },
      data: req.body,
    });
    res.json(response.data);
  } catch (error) {
    res.status(error?.response?.status || 500).json(error?.response?.data || { error: error.message });
  }
};