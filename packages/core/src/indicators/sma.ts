import { Candle, IndicatorSeries, MovingAverageConfig } from "../types";
import { pickPrice, DEFAULT_PRICE_SOURCE } from "../utils/indicators";

export function calculateSMA(
  candles: Candle[],
  config: MovingAverageConfig,
): IndicatorSeries {
  const length = config.length;
  const source = config.source ?? DEFAULT_PRICE_SOURCE;
  if (length <= 0) {
    throw new Error("SMA length must be greater than zero");
  }

  const points = [];
  let windowSum = 0;

  for (let i = 0; i < candles.length; i += 1) {
    const price = pickPrice(candles[i], source);
    windowSum += price;

    if (i >= length) {
      windowSum -= pickPrice(candles[i - length], source);
    }

    if (i >= length - 1) {
      points.push({
        timestamp: candles[i].timestamp,
        value: windowSum / length,
      });
    }
  }

  return {
    type: "sma",
    config,
    points,
  };
}
