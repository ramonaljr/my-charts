import { Candle, IndicatorSeries, BollingerBandsConfig } from "../types";
import { DEFAULT_PRICE_SOURCE, pickPrice } from "../utils/indicators";

export function calculateBollingerBands(
  candles: Candle[],
  config: BollingerBandsConfig,
): IndicatorSeries {
  const length = config.length;
  const source = config.source ?? DEFAULT_PRICE_SOURCE;
  const multiplier = config.stdDev;

  if (length <= 0) {
    throw new Error("Bollinger Bands length must be greater than zero");
  }

  const points = [];
  const window: number[] = [];
  let sum = 0;
  let sumSquares = 0;

  for (let i = 0; i < candles.length; i += 1) {
    const price = pickPrice(candles[i], source);
    window.push(price);
    sum += price;
    sumSquares += price * price;

    if (window.length > length) {
      const removed = window.shift() as number;
      sum -= removed;
      sumSquares -= removed * removed;
    }

    if (window.length === length) {
      const mean = sum / length;
      const variance = sumSquares / length - mean * mean;
      const std = Math.sqrt(Math.max(variance, 0));
      const upper = mean + multiplier * std;
      const lower = mean - multiplier * std;

      points.push({
        timestamp: candles[i].timestamp,
        value: mean,
        basis: mean,
        upper,
        lower,
      });
    }
  }

  return {
    type: "bbands",
    config,
    points,
  };
}
