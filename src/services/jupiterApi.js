import axios from 'axios';

const API_KEY = process.env.REACT_APP_JUPITER_API_KEY;
const BASE_URL = process.env.REACT_APP_API_BASE || 'http://localhost:3001';

export const MINTS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  WIF: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
};

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json',
  },
});

// ── PRICE API v3 ──────────────────────────────
export const getTokenPrices = async (mintAddresses) => {
  try {
    const ids = Array.isArray(mintAddresses)
      ? mintAddresses.join(',')
      : mintAddresses;
    const res = await client.get('/price/v3', { params: { ids } });
    return res.data || {};
  } catch (err) {
    console.error('Price API error:', err?.response?.status, err?.response?.data || err.message);
    return {};
  }
};

// ── TOKENS API v2 — Batch search ──────────────
export const batchSearchTokens = async (mintAddresses) => {
  try {
    const query = Array.isArray(mintAddresses)
      ? mintAddresses.join(',')
      : mintAddresses;
    const res = await client.get('/tokens/v2/search', { params: { query } });
    return res.data || [];
  } catch (err) {
    console.error('Token batch search error:', err?.response?.status);
    return [];
  }
};

// ── TOKENS API v2 — Single search ─────────────
export const searchTokens = async (query) => {
  try {
    const res = await client.get('/tokens/v2/search', { params: { query } });
    return res.data || [];
  } catch (err) {
    console.error('Token search error:', err?.response?.status);
    return [];
  }
};

// ── PREDICTION MARKETS API ────────────────────
export const getCryptoPredictionSentiment = async () => {
  try {
    const res = await client.get('/prediction/v1/events', {
      params: {
        category: 'crypto',
        filter: 'trending',
        includeMarkets: 'true',
      },
    });

    const raw = res.data;
    let events = [];
    if (Array.isArray(raw)) events = raw;
    else if (Array.isArray(raw?.events)) events = raw.events;
    else if (Array.isArray(raw?.data)) events = raw.data;

    const scores = events
      .filter((e) => e.markets && e.markets.length > 0)
      .map((e) => {
        const market = e.markets[0];
        const pricing = market?.pricing;
        if (!pricing) return null;
        const yes = pricing.buyYesPriceUsd || 0;
        const no = pricing.buyNoPriceUsd || 0;
        const total = yes + no;
        return {
          title: e.metadata?.title || e.title || 'Unknown',
          yesProbability: total > 0 ? yes / total : 0.5,
          volume: pricing.volume || 0,
          marketId: market.marketId,
        };
      })
      .filter(Boolean);

    if (scores.length === 0) return { sentiment: 0.5, markets: [] };

    const sentiment = scores.reduce((s, m) => s + m.yesProbability, 0) / scores.length;
    return { sentiment, markets: scores.slice(0, 8) };
  } catch (err) {
    console.error('Prediction API error:', err?.response?.status);
    return { sentiment: 0.5, markets: [] };
  }
};

// ── LEND RATES (via tokens APY field) ─────────
export const getLendingRates = async () => {
  try {
    const res = await client.get('/lend/rates');
    return res.data || [];
  } catch (err) {
    console.error('Lend rates error:', err?.response?.status);
    return [];
  }
};

// ── SWAP V2 QUOTE ─────────────────────────────
export const getSwapQuote = async (inputMint, outputMint, amount, decimals = 9) => {
  try {
    const rawAmount = Math.round(amount * Math.pow(10, decimals));
    const res = await client.get('/swap/v2/order', {
      params: {
        inputMint,
        outputMint,
        amount: rawAmount,
        slippageBps: 50,
      },
    });
    return res.data || null;
  } catch (err) {
    console.error('Swap quote error:', err?.response?.status, err?.response?.data);
    return null;
  }
};

// ── ORGANIC SCORE VELOCITY ────────────────────
// Stored in memory — tracks how fast organic score is changing
const scoreHistory = {};

export const trackOrganicScoreVelocity = (mint, currentScore) => {
  if (!scoreHistory[mint]) {
    scoreHistory[mint] = [];
  }

  scoreHistory[mint].push({
    score: currentScore,
    timestamp: Date.now(),
  });

  // Keep last 10 readings
  if (scoreHistory[mint].length > 10) {
    scoreHistory[mint].shift();
  }

  const history = scoreHistory[mint];
  if (history.length < 2) return 0;

  const oldest = history[0];
  const newest = history[history.length - 1];
  const timeDiffHours = (newest.timestamp - oldest.timestamp) / (1000 * 60 * 60);

  if (timeDiffHours === 0) return 0;

  // Points per hour — negative means dropping
  return (newest.score - oldest.score) / Math.max(timeDiffHours, 0.1);
};

// ── THREAT LEVEL CALCULATOR ───────────────────
// This is Sentry's core innovation — combining ALL signals
// into a security-first threat assessment
export const calculateThreatLevel = (tokenData) => {
  const {
    organicScore,
    organicScoreVelocity,
    priceChange24h,
    holderCount,
    audit,
    predictionSentiment,
    liquidity,
    stats24h,
  } = tokenData;

  let threatPoints = 0;
  const warnings = [];
  const positives = [];

  // ── Organic Score ─────────────────────────────
  if (organicScore !== null && organicScore !== undefined) {
    if (organicScore < 20) {
      threatPoints += 40;
      warnings.push('Critically low organic score — likely bot-driven activity');
    } else if (organicScore < 50) {
      threatPoints += 20;
      warnings.push('Low organic score — suspicious trading patterns detected');
    } else if (organicScore > 80) {
      positives.push(`High organic score (${organicScore.toFixed(0)}) — genuine trading activity`);
    }
  }

  // ── Organic Score Velocity ────────────────────
  if (organicScoreVelocity < -10) {
    threatPoints += 30;
    warnings.push(`Organic score dropping fast (${organicScoreVelocity.toFixed(1)} pts/hr) — unusual activity spike`);
  } else if (organicScoreVelocity < -5) {
    threatPoints += 15;
    warnings.push(`Organic score declining (${organicScoreVelocity.toFixed(1)} pts/hr)`);
  } else if (organicScoreVelocity > 5) {
    positives.push(`Organic score improving (+${organicScoreVelocity.toFixed(1)} pts/hr)`);
  }

  // ── Audit Flags ───────────────────────────────
  if (audit) {
    if (!audit.mintAuthorityDisabled) {
      threatPoints += 25;
      warnings.push('Mint authority NOT disabled — unlimited token supply possible');
    } else {
      positives.push('Mint authority disabled — fixed supply confirmed');
    }

    if (!audit.freezeAuthorityDisabled) {
      threatPoints += 20;
      warnings.push('Freeze authority NOT disabled — funds could be locked');
    } else {
      positives.push('Freeze authority disabled — funds cannot be locked');
    }

    if (audit.topHoldersPercentage > 50) {
      threatPoints += 20;
      warnings.push(`Top holders control ${audit.topHoldersPercentage.toFixed(0)}% of supply — rug pull risk`);
    } else if (audit.topHoldersPercentage > 30) {
      threatPoints += 10;
      warnings.push(`Concentrated holdings (${audit.topHoldersPercentage.toFixed(0)}%) — moderate centralization risk`);
    }
  }

  // ── Price Momentum ────────────────────────────
  if (priceChange24h !== null && priceChange24h !== undefined) {
    if (priceChange24h < -20) {
      threatPoints += 20;
      warnings.push(`Severe price drop (${priceChange24h.toFixed(1)}% in 24h)`);
    } else if (priceChange24h < -10) {
      threatPoints += 10;
      warnings.push(`Significant price drop (${priceChange24h.toFixed(1)}% in 24h)`);
    } else if (priceChange24h > 50) {
      threatPoints += 15;
      warnings.push(`Suspicious pump (+${priceChange24h.toFixed(1)}% in 24h) — dump risk`);
    }
  }

  // ── Prediction Market Sentiment ───────────────
  if (predictionSentiment !== null && predictionSentiment !== undefined) {
    if (predictionSentiment < 0.35) {
      threatPoints += 15;
      warnings.push(`Markets heavily bearish (${Math.round(predictionSentiment * 100)}% YES probability)`);
    } else if (predictionSentiment < 0.45) {
      threatPoints += 5;
      warnings.push(`Markets leaning bearish (${Math.round(predictionSentiment * 100)}% YES probability)`);
    } else if (predictionSentiment > 0.60) {
      positives.push(`Markets bullish (${Math.round(predictionSentiment * 100)}% YES probability)`);
    }
  }

  // ── Liquidity ─────────────────────────────────
  if (liquidity !== null && liquidity !== undefined) {
    if (liquidity < 10000) {
      threatPoints += 20;
      warnings.push(`Very low liquidity ($${(liquidity / 1000).toFixed(1)}K) — high slippage and exit risk`);
    } else if (liquidity < 100000) {
      threatPoints += 10;
      warnings.push(`Low liquidity ($${(liquidity / 1000).toFixed(0)}K) — difficult to exit large positions`);
    } else if (liquidity > 1000000) {
      positives.push(`Deep liquidity ($${(liquidity / 1000000).toFixed(1)}M) — easy entry and exit`);
    }
  }

  // ── Determine Threat Level ────────────────────
  let level, color, bgColor, borderColor, label;

  if (threatPoints >= 60) {
    level = 'CRITICAL';
    color = '#ef4444';
    bgColor = 'rgba(239, 68, 68, 0.08)';
    borderColor = 'rgba(239, 68, 68, 0.3)';
    label = 'Exit recommended immediately';
  } else if (threatPoints >= 35) {
    level = 'HIGH';
    color = '#f97316';
    bgColor = 'rgba(249, 115, 22, 0.08)';
    borderColor = 'rgba(249, 115, 22, 0.3)';
    label = 'Set stop loss protection';
  } else if (threatPoints >= 15) {
    level = 'ELEVATED';
    color = '#fbbf24';
    bgColor = 'rgba(251, 191, 36, 0.08)';
    borderColor = 'rgba(251, 191, 36, 0.3)';
    label = 'Monitor closely';
  } else {
    level = 'LOW';
    color = '#c8f559';
    bgColor = 'rgba(200, 245, 89, 0.08)';
    borderColor = 'rgba(200, 245, 89, 0.3)';
    label = 'No significant threats detected';
  }

  return {
    level,
    points: threatPoints,
    color,
    bgColor,
    borderColor,
    label,
    warnings,
    positives,
  };
};

// ── SENTRY SCORE CALCULATOR ───────────────────
export const calculateSentryScore = ({
  organicScore = null,
  priceChange24h = null,
  predictionBull = null,
}) => {
  const organicNormalized = organicScore !== null ? organicScore : 50;

  let momentumScore = 50;
  if (priceChange24h !== null && priceChange24h !== undefined) {
    momentumScore = Math.min(100, Math.max(0, 50 + priceChange24h * 2.5));
  }

  const sentimentScore = predictionBull !== null ? predictionBull * 100 : 50;

  const score = Math.round(
    organicNormalized * 0.4 +
    momentumScore * 0.3 +
    sentimentScore * 0.3
  );

  let recommendation, color, action;

  if (score >= 70) {
    recommendation = 'ACCUMULATE';
    color = 'var(--accent-green)';
    action = 'accumulate';
  } else if (score >= 40) {
    recommendation = 'HOLD / EARN';
    color = 'var(--accent-yellow)';
    action = 'lend';
  } else {
    recommendation = 'PROTECT';
    color = 'var(--accent-red)';
    action = 'protect';
  }

  return { score, recommendation, color, action };
};

// ── GENERATE HEALTH PASSPORT ──────────────────
export const generateHealthPassport = (tokenData) => {
  const {
    name, symbol, organicScore, organicScoreLabel,
    isVerified, audit, priceChange24h, liquidity,
    holderCount, mcap, stats24h, usdPrice,
    predictionSentiment, organicScoreVelocity,
  } = tokenData;

  const threat = calculateThreatLevel(tokenData);
  const sentryScore = calculateSentryScore({
    organicScore,
    priceChange24h,
    predictionBull: predictionSentiment,
  });

  // Overall verdict
  let verdict, verdictColor, verdictDescription;

  if (threat.level === 'CRITICAL') {
    verdict = 'AVOID';
    verdictColor = '#ef4444';
    verdictDescription = 'Multiple critical risk factors detected. Do not enter or exit immediately.';
  } else if (threat.level === 'HIGH') {
    verdict = 'CAUTION';
    verdictColor = '#f97316';
    verdictDescription = 'Significant risk factors present. Only experienced traders should consider this.';
  } else if (sentryScore.score >= 70) {
    verdict = 'ACCUMULATE';
    verdictColor = '#c8f559';
    verdictDescription = 'Strong fundamentals with genuine trading activity and positive momentum.';
  } else if (sentryScore.score >= 40) {
    verdict = 'HOLD';
    verdictColor = '#fbbf24';
    verdictDescription = 'Mixed signals. Suitable for holding but not aggressive accumulation.';
  } else {
    verdict = 'REVIEW';
    verdictColor = '#f97316';
    verdictDescription = 'Weak signals across multiple metrics. Consider reducing exposure.';
  }

  return {
    name, symbol, usdPrice, isVerified,
    organicScore, organicScoreLabel, organicScoreVelocity,
    audit, priceChange24h, liquidity, holderCount,
    mcap, stats24h, predictionSentiment,
    threat, sentryScore, verdict, verdictColor, verdictDescription,
  };
};