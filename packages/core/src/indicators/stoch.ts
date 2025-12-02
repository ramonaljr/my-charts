import { Candle, IndicatorSeries, StochConfig } from "../types";

/**
 * Calculates the Stochastic Oscillator
 * %K = (Current Close - Lowest Low) / (Highest High - Lowest Low) * 100
 * %D = SMA of %K
 */
export function calculateStochastic(
  candles: Candle[],
  config: StochConfig
): IndicatorSeries {
  const { kPeriod, dPeriod, smooth } = config;

  if (kPeriod <= 0 || dPeriod <= 0 || smooth <= 0) {
    throw new Error("Stochastic periods must be greater than zero");
  }

  if (candles.length < kPeriod) {
    return { type: "stoch", config, points: [] };
  }

  const points = [];
  const rawK: number[] = [];
  const smoothedK: number[] = [];

  // Calculate raw %K values
  for (let i = kPeriod - 1; i < candles.length; i++) {
    let lowestLow = Infinity;
    let highestHigh = -Infinity;

    for (let j = i - kPeriod + 1; j <= i; j++) {
      lowestLow = Math.min(lowestLow, candles[j].low);
      highestHigh = Math.max(highestHigh, candles[j].high);
    }

    const range = highestHigh - lowestLow;
    const k = range > 0 ? ((candles[i].close - lowestLow) / range) * 100 : 50;
    rawK.push(k);
  }

  // Smooth %K if smooth > 1
  if (smooth > 1) {
    for (let i = smooth - 1; i < rawK.length; i++) {
      let sum = 0;
      for (let j = i - smooth + 1; j <= i; j++) {
        sum += rawK[j];
      }
      smoothedK.push(sum / smooth);
    }
  } else {
    smoothedK.push(...rawK);
  }

  // Calculate %D (SMA of smoothed %K)
  const dValues: number[] = [];
  for (let i = dPeriod - 1; i < smoothedK.length; i++) {
    let sum = 0;
    for (let j = i - dPeriod + 1; j <= i; j++) {
      sum += smoothedK[j];
    }
    dValues.push(sum / dPeriod);
  }

  // Build result points
  const startOffset = kPeriod - 1 + (smooth > 1 ? smooth - 1 : 0) + dPeriod - 1;

  for (let i = 0; i < dValues.length; i++) {
    const candleIndex = startOffset + i;
    if (candleIndex < candles.length) {
      const kIndex = i + dPeriod - 1;
      points.push({
        timestamp: candles[candleIndex].timestamp,
        value: smoothedK[kIndex], // Main value is %K
        k: smoothedK[kIndex],
        d: dValues[i],
      });
    }
  }

  return {
    type: "stoch",
    config,
    points,
  };
}
