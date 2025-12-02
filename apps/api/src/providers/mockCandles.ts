import { Candle, Timeframe } from "@nova/core";

// Generate realistic mock FX candle data for development/testing
// when Finnhub API doesn't have access to forex data

interface PriceConfig {
  basePrice: number;
  volatility: number; // percentage
}

// Typical FX pair base prices and volatility
const FX_CONFIGS: Record<string, PriceConfig> = {
  "OANDA:EUR_USD": { basePrice: 1.085, volatility: 0.1 },
  "OANDA:GBP_USD": { basePrice: 1.27, volatility: 0.12 },
  "OANDA:AUD_USD": { basePrice: 0.65, volatility: 0.15 },
  "OANDA:NZD_USD": { basePrice: 0.59, volatility: 0.15 },
  "OANDA:USD_CAD": { basePrice: 1.36, volatility: 0.1 },
  "OANDA:USD_JPY": { basePrice: 149.5, volatility: 0.12 },
  "OANDA:USD_CHF": { basePrice: 0.88, volatility: 0.1 },
  "OANDA:AUD_JPY": { basePrice: 97.5, volatility: 0.15 },
  "OANDA:NZD_JPY": { basePrice: 88.5, volatility: 0.15 },
  "OANDA:CAD_JPY": { basePrice: 110.0, volatility: 0.12 },
  "OANDA:EUR_JPY": { basePrice: 162.5, volatility: 0.12 },
  "OANDA:GBP_JPY": { basePrice: 190.0, volatility: 0.15 },
  "OANDA:AUD_CAD": { basePrice: 0.89, volatility: 0.12 },
  "OANDA:AUD_NZD": { basePrice: 1.08, volatility: 0.1 },
  "OANDA:EUR_AUD": { basePrice: 1.67, volatility: 0.12 },
  "OANDA:EUR_CAD": { basePrice: 1.48, volatility: 0.1 },
  "OANDA:EUR_GBP": { basePrice: 0.855, volatility: 0.08 },
  "OANDA:EUR_NZD": { basePrice: 1.83, volatility: 0.12 },
  "OANDA:GBP_AUD": { basePrice: 1.95, volatility: 0.15 },
  "OANDA:GBP_CAD": { basePrice: 1.73, volatility: 0.12 },
};

const DEFAULT_CONFIG: PriceConfig = { basePrice: 1.0, volatility: 0.1 };

function getTimeframeMs(tf: Timeframe): number {
  switch (tf) {
    case "1m":
      return 60 * 1000;
    case "5m":
      return 5 * 60 * 1000;
    case "15m":
      return 15 * 60 * 1000;
    case "1h":
      return 60 * 60 * 1000;
    case "4h":
      return 4 * 60 * 60 * 1000;
    case "1d":
      return 24 * 60 * 60 * 1000;
    default:
      return 60 * 60 * 1000;
  }
}

// Seeded random number generator for consistency
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

export function generateMockCandles(params: {
  symbol: string;
  timeframe: Timeframe;
  from: number;
  to: number;
}): Candle[] {
  const config = FX_CONFIGS[params.symbol] || DEFAULT_CONFIG;
  const intervalMs = getTimeframeMs(params.timeframe);

  // Use symbol + timeframe as seed for consistent data
  const seedStr = `${params.symbol}-${params.timeframe}`;
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed += seedStr.charCodeAt(i);
  }
  const random = seededRandom(seed);

  const candles: Candle[] = [];
  const volatilityFactor = config.volatility / 100;

  // Start from base price and random walk
  let currentPrice = config.basePrice;

  // Align timestamps to timeframe intervals
  const alignedFrom = Math.floor(params.from / intervalMs) * intervalMs;
  const alignedTo = Math.floor(params.to / intervalMs) * intervalMs;

  for (let timestamp = alignedFrom; timestamp <= alignedTo; timestamp += intervalMs) {
    // Random walk with mean reversion toward base price
    const meanReversion = (config.basePrice - currentPrice) * 0.01;
    const trend = (random() - 0.5) * volatilityFactor * currentPrice + meanReversion;

    const open = currentPrice;
    const change = trend + (random() - 0.5) * volatilityFactor * currentPrice * 0.5;
    const close = open + change;

    // High and low within the candle
    const highExtra = random() * volatilityFactor * currentPrice * 0.3;
    const lowExtra = random() * volatilityFactor * currentPrice * 0.3;

    const high = Math.max(open, close) + highExtra;
    const low = Math.min(open, close) - lowExtra;

    // Volume (arbitrary for FX)
    const volume = Math.floor(1000000 + random() * 5000000);

    candles.push({
      timestamp,
      open: Number(open.toFixed(5)),
      high: Number(high.toFixed(5)),
      low: Number(low.toFixed(5)),
      close: Number(close.toFixed(5)),
      volume,
    });

    currentPrice = close;
  }

  return candles;
}
