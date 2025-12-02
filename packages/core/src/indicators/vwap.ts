import { Candle, IndicatorSeries, VwapConfig } from "../types";

/**
 * Calculates the Volume Weighted Average Price (VWAP)
 * VWAP = Cumulative(Typical Price * Volume) / Cumulative(Volume)
 * Typical Price = (High + Low + Close) / 3
 */
export function calculateVWAP(
  candles: Candle[],
  config: VwapConfig
): IndicatorSeries {
  if (candles.length === 0) {
    return { type: "vwap", config, points: [] };
  }

  const points = [];
  let cumulativeTPV = 0; // Cumulative (Typical Price * Volume)
  let cumulativeVolume = 0;

  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];
    const typicalPrice = (candle.high + candle.low + candle.close) / 3;
    const volume = candle.volume || 0;

    cumulativeTPV += typicalPrice * volume;
    cumulativeVolume += volume;

    const vwap = cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : typicalPrice;

    points.push({
      timestamp: candle.timestamp,
      value: vwap,
    });
  }

  return {
    type: "vwap",
    config,
    points,
  };
}
