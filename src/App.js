import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import PortfolioTab from './components/PortfolioTab';
import SwapTab from './components/SwapTab';
import StrategiesTab from './components/StrategiesTab';
import MarketsPanel from './components/MarketsPanel';
import ShieldTab from './components/ShieldTab';
import AddTokenModal from './components/AddTokenModal';
import { useWallet } from './hooks/useWalletAuth';
import { useWalletBalances } from './hooks/useWalletBalances';
import SentryChat from './components/SentryChat';
import {
  getTokenPrices,
  batchSearchTokens,
  getCryptoPredictionSentiment,
  calculateSentryScore,
  calculateThreatLevel,
  trackOrganicScoreVelocity,
  MINTS,
} from './services/jupiterApi';
import './App.css';

function App() {
  const wallet = useWallet();
  const { connected, publicKey } = wallet;

  // Wallet balances from chain
  const { balances, loading: balancesLoading } = useWalletBalances(publicKey);

  // App state
  const [activeTab, setActiveTab] = useState('portfolio');
  const DEFAULT_WATCHLIST = [MINTS.SOL, MINTS.JUP, MINTS.BONK, MINTS.WIF];
  const [watchlist, setWatchlist] = useState(DEFAULT_WATCHLIST);
  const [enrichedTokens, setEnrichedTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [predictionSentiment, setPredictionSentiment] = useState(0.5);
  const [predictionMarkets, setPredictionMarkets] = useState([]);

  // When wallet connects, merge wallet token mints into watchlist
  useEffect(() => {
  if (balances.length > 0) {
    const walletMints = balances.map((b) => b.mint);
    setWatchlist((prev) => {
      const merged = [
        ...new Set([...DEFAULT_WATCHLIST, ...walletMints, ...prev]),
      ];
      return merged.slice(0, 20);
    });
  }
}, [balances]);

  // Fetch prediction sentiment every 5 minutes
  useEffect(() => {
    const fetchSentiment = async () => {
      const result = await getCryptoPredictionSentiment();
      setPredictionSentiment(result.sentiment);
      setPredictionMarkets(result.markets);
    };
    fetchSentiment();
    const interval = setInterval(fetchSentiment, 300000);
    return () => clearInterval(interval);
  }, []);

  // Main enrichment loop
  const enrichTokens = useCallback(async () => {
    if (watchlist.length === 0) return;

    try {
      setError(null);

      // Single batched call for prices
      const priceData = await getTokenPrices(watchlist);

      // Single batched call for token metadata
      const allMeta = await batchSearchTokens(watchlist);

      const combined = watchlist.map((mint) => {
        const priceInfo = priceData[mint] || {};
        const meta = allMeta.find((t) => t.id === mint) || {};

        const organicScore = meta.organicScore ?? null;
        const priceChange24h =
          priceInfo.priceChange24h ?? meta.stats24h?.priceChange ?? null;

        // Track velocity of organic score change
        const organicScoreVelocity = organicScore !== null
          ? trackOrganicScoreVelocity(mint, organicScore)
          : 0;

        const sentryResult = calculateSentryScore({
          organicScore,
          priceChange24h,
          predictionBull: predictionSentiment,
        });

        const tokenData = {
          mint,
          name: meta.name || 'Unknown',
          symbol: meta.symbol || mint.slice(0, 4),
          logoURI: meta.icon || null,
          usdPrice: priceInfo.usdPrice ?? meta.usdPrice ?? null,
          priceChange24h,
          organicScore,
          organicScoreLabel: meta.organicScoreLabel || 'unknown',
          organicScoreVelocity,
          isVerified: meta.isVerified || false,
          holderCount: meta.holderCount || null,
          liquidity: meta.liquidity || null,
          mcap: meta.mcap || null,
          fdv: meta.fdv || null,
          audit: meta.audit || null,
          stats24h: meta.stats24h || null,
          stats1h: meta.stats1h || null,
          decimals: meta.decimals || 9,
          predictionSentiment,
          // Wallet balance if connected
          walletBalance: balances.find((b) => b.mint === mint)?.balance || null,
          sentry: sentryResult,
        };

        // Calculate threat level
        tokenData.threat = calculateThreatLevel(tokenData);

        return tokenData;
      });

      setEnrichedTokens(combined);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Enrichment error:', err);
      setError('Failed to fetch token data.');
    } finally {
      setLoading(false);
    }
  }, [watchlist, predictionSentiment, balances]);

  // Run enrichment on load and every 60 seconds
  useEffect(() => {
    if (watchlist.length > 0) {
      setLoading(true);
      enrichTokens();
      const interval = setInterval(enrichTokens, 60000);
      return () => clearInterval(interval);
    }
  }, [watchlist]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddToken = (mint) => {
    if (!watchlist.includes(mint)) {
      setWatchlist((prev) => [...prev, mint]);
    }
    setShowAddModal(false);
  };

  const handleRemoveToken = (mint) => {
    setWatchlist((prev) => prev.filter((m) => m !== mint));
    setEnrichedTokens((prev) => prev.filter((t) => t.mint !== mint));
  };

  return (
    <div className="app">
      <Header
        lastUpdated={lastUpdated}
        onAddToken={() => setShowAddModal(true)}
        predictionSentiment={predictionSentiment}
        tickerTokens={enrichedTokens}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        wallet={wallet}
      />

      <main style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '24px 16px',
      }}>
        {error && (
          <div style={{
            background: 'rgba(248, 113, 113, 0.08)',
            border: '1px solid rgba(248, 113, 113, 0.2)',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '24px',
            color: 'var(--accent-red)',
            fontSize: '14px',
          }}>
            {error}
          </div>
        )}

        {activeTab === 'portfolio' && (
          <PortfolioTab
            tokens={enrichedTokens}
            loading={loading}
            wallet={wallet}
            onAddToken={() => setShowAddModal(true)}
            onRemoveToken={handleRemoveToken}
            predictionMarkets={predictionMarkets}
          />
        )}

        {activeTab === 'swap' && (
          <SwapTab
            tokens={enrichedTokens}
            wallet={wallet}
          />
        )}

        {activeTab === 'strategies' && (
          <StrategiesTab
            enrichedTokens={enrichedTokens}
            wallet={wallet}
          />
        )}

        {activeTab === 'markets' && (
          <MarketsPanel
            predictionMarkets={predictionMarkets}
            predictionSentiment={predictionSentiment}
          />
        )}

        {activeTab === 'shield' && (
          <ShieldTab
            tokens={enrichedTokens}
            loading={loading}
            wallet={wallet}
          />
        )}
      </main>

      <SentryChat
        tokens={enrichedTokens}
        predictionSentiment={predictionSentiment}
        predictionMarkets={predictionMarkets}
      />

      {showAddModal && (
        <AddTokenModal
          onAdd={handleAddToken}
          onClose={() => setShowAddModal(false)}
          existingMints={watchlist}
        />
      )}
    </div>
  );
}

export default App;