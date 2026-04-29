const GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

const SENTRY_SYSTEM_PROMPT = `You are Sentry, an elite AI-powered DeFi portfolio guardian built on Jupiter's APIs on Solana. You have a confident, direct, analyst personality — like a seasoned trader who has seen everything. You are data-driven, never speculative, and always back your statements with the actual numbers from the data provided.

Your personality traits:
- Confident but not arrogant — you say what the data shows, not what people want to hear
- Concise — maximum 3-4 sentences per response unless a full analysis is requested  
- Specific — you always reference actual numbers, not vague statements
- Protective — your #1 priority is protecting users from losing money
- Plain English — you translate DeFi complexity into language anyone can understand

Your data sources (all real-time from Jupiter APIs):
- Organic Score: how much of a token's trading is from real humans vs bots (0-100)
- Organic Score Velocity: how fast the organic score is changing per hour
- Sentry Score: your composite signal combining organic score (40%), price momentum (30%), and prediction market sentiment (30%)
- Threat Level: LOW / ELEVATED / HIGH / CRITICAL based on audit flags, liquidity, holder concentration, and velocity
- Prediction Markets: what real money is betting on crypto direction (Jupiter Prediction API)
- Audit Data: whether mint/freeze authorities are disabled, top holder concentration
- Price & Momentum: current USD price and 24h change

Rules:
- Never make up data — only use what is provided
- Never give financial advice — give data-driven analysis
- Always mention the specific numbers that support your conclusion
- If data is missing or null, acknowledge it honestly
- Keep responses under 150 words unless a full portfolio briefing is requested
- Never use bullet points in conversational responses — write in flowing sentences
- Always distinguish between tokens the user HOLDS in their wallet vs tokens they are just TRACKING — when answering risk questions, prioritize held tokens
- If the user asks about their riskiest token and they hold no risky tokens, say so clearly`;

const buildPortfolioContext = (tokens, predictionSentiment, predictionMarkets) => {
  if (!tokens || tokens.length === 0) return 'No tokens in portfolio.';

  const heldTokens = tokens.filter((t) => t.walletBalance && t.walletBalance > 0);
  const trackedTokens = tokens.filter((t) => !t.walletBalance || t.walletBalance === 0);

  const formatToken = (t) => {
    return `${t.symbol}: price $${t.usdPrice?.toFixed(6) || 'unknown'}, 24h change ${t.priceChange24h?.toFixed(2) || 'unknown'}%, organic score ${t.organicScore?.toFixed(1) || 'unknown'} (${t.organicScoreLabel || 'unknown'}), organic velocity ${t.organicScoreVelocity?.toFixed(1) || '0'} pts/hr, sentry score ${t.sentry?.score || 'unknown'}/100, threat level ${t.threat?.level || 'unknown'}, audit: mint disabled=${t.audit?.mintAuthorityDisabled}, freeze disabled=${t.audit?.freezeAuthorityDisabled}, top holders=${t.audit?.topHoldersPercentage?.toFixed(1) || 'unknown'}%, liquidity=$${t.liquidity ? (t.liquidity / 1000000).toFixed(2) + 'M' : 'unknown'}, holders=${t.holderCount?.toLocaleString() || 'unknown'}${t.walletBalance ? `, WALLET BALANCE: ${t.walletBalance.toFixed(6)} ${t.symbol} (user actually holds this)` : ''}`;
  };

  let context = '';

  if (heldTokens.length > 0) {
    context += `TOKENS USER ACTUALLY HOLDS IN WALLET:\n`;
    context += heldTokens.map(formatToken).join('\n');
    context += '\n\n';
  } else {
    context += `USER WALLET: No tokens with balance found (wallet may not be connected or is empty).\n\n`;
  }

  if (trackedTokens.length > 0) {
    context += `TOKENS USER IS TRACKING (not held in wallet):\n`;
    context += trackedTokens.map(formatToken).join('\n');
    context += '\n\n';
  }

  const marketContext = `Overall crypto prediction market sentiment: ${Math.round(predictionSentiment * 100)}% bullish based on ${predictionMarkets.length} active markets on Jupiter.`;
  context += `MARKET CONTEXT:\n${marketContext}`;

  return context;
};

// Generate AI portfolio briefing
export const generatePortfolioBriefing = async (tokens, predictionSentiment, predictionMarkets) => {
  try {
    const context = buildPortfolioContext(tokens, predictionSentiment, predictionMarkets);

    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 200,
        temperature: 0.7,
        messages: [
          { role: 'system', content: SENTRY_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Generate a concise portfolio briefing based on this real-time data. Identify the most important thing the user should know right now. Be direct and specific.\n\n${context}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Groq API error');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || null;
  } catch (err) {
    console.error('AI briefing error:', err.message);
    return null;
  }
};

// Generate threat narrative for a specific token
export const generateThreatNarrative = async (token) => {
  try {
    const context = `Token: ${token.symbol} (${token.name})
Price: $${token.usdPrice?.toFixed(6)}
24h Change: ${token.priceChange24h?.toFixed(2)}%
Organic Score: ${token.organicScore?.toFixed(1)} (${token.organicScoreLabel}) — velocity: ${token.organicScoreVelocity?.toFixed(1)} pts/hr
Sentry Score: ${token.sentry?.score}/100
Threat Level: ${token.threat?.level}
Warnings: ${token.threat?.warnings?.join('; ') || 'none'}
Positives: ${token.threat?.positives?.join('; ') || 'none'}
Audit: mint disabled=${token.audit?.mintAuthorityDisabled}, freeze disabled=${token.audit?.freezeAuthorityDisabled}, top holders=${token.audit?.topHoldersPercentage?.toFixed(1)}%
Liquidity: $${token.liquidity ? (token.liquidity / 1000000).toFixed(2) + 'M' : 'unknown'}
Prediction sentiment: ${Math.round((token.predictionSentiment || 0.5) * 100)}% bullish`;

    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 150,
        temperature: 0.6,
        messages: [
          { role: 'system', content: SENTRY_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Write a 2-3 sentence threat analysis for this token. Be specific about the numbers. Tell the user exactly what the data means for their position.\n\n${context}`,
          },
        ],
      }),
    });

    if (!response.ok) throw new Error('Groq API error');
    const data = await response.json();
    return data.choices[0]?.message?.content || null;
  } catch (err) {
    console.error('Threat narrative error:', err.message);
    return null;
  }
};

// Answer a user question about their portfolio
export const askSentry = async (question, tokens, predictionSentiment, predictionMarkets, chatHistory = []) => {
  try {
    const context = buildPortfolioContext(tokens, predictionSentiment, predictionMarkets);

    const messages = [
      { role: 'system', content: SENTRY_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Here is the current real-time portfolio data:\n\n${context}\n\nRemember this data for the conversation.`,
      },
      { role: 'assistant', content: 'Got it. I have the current portfolio data loaded. What do you want to know?' },
      ...chatHistory,
      { role: 'user', content: question },
    ];

    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 250,
        temperature: 0.75,
        messages,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Groq API error');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || null;
  } catch (err) {
    console.error('Ask Sentry error:', err.message);
    return 'I encountered an error accessing my analysis engine. Please try again.';
  }
};