import { Candle, IndicatorSeries, CciConfig } from "../types";

/**
 * Calculates the Commodity Channel Index (CCI)
 * CCI = (Typical Price - SMA of TP) / (0.015 * Mean Deviation)
 * Typical Price = (High + Low + Close) / 3
 */
export function calculateCCI(
  candles: Candle[],
  config: CciConfig
): IndicatorSeries {
  const length = config.length;

  if (length <= 0) {
    throw new Error("CCI length must be greater than zero");
  }

  if (candles.length < length) {
    return { type: "cci", config, points: [] };
  }

  const points = [];
  const typicalPrices: number[] = [];

  // Calculate typical prices
  for (const candle of candles) {
    const tp = (candle.high + candle.low + candle.close) / 3;
    typicalPrices.push(tp);
  }

  // Calculate CCI for each valid point
  for (let i = length - 1; i < candles.length; i++) {
    // Calculate SMA of typical prices
    let smaSum = 0;
    for (let j = i - length + 1; j <= i; j++) {
      smaSum += typicalPrices[j];
    }
    const sma = smaSum / length;

    // Calculate Mean Deviation
    let meanDevSum = 0;
    for (let j = i - length + 1; j <= i; j++) {
      meanDevSum += Math.abs(typicalPrices[j] - sma);
    }
    const meanDev = meanDevSum / length;

    // Calculate CCI
    // Using Lambert's constant of 0.015
    const cci = meanDev > 0 ? (typicalPrices[i] - sma) / (0.015 * meanDev) : 0;

    points.push({
      timestamp: candles[i].timestamp,
      value: cci,
    });
  }

  return {
    type: "cci",
    config,
    points,
  };
}
