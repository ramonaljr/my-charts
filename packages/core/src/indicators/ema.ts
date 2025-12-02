import { Candle, IndicatorSeries, MovingAverageConfig } from "../types";
import { DEFAULT_PRICE_SOURCE, pickPrice } from "../utils/indicators";

export function calculateEMA(
  candles: Candle[],
  config: MovingAverageConfig,
): IndicatorSeries {
  const length = config.length;
  const source = config.source ?? DEFAULT_PRICE_SOURCE;
  if (length <= 0) {
    throw new Error("EMA length must be greater than zero");
  }

  const multiplier = 2 / (length + 1);
  const points = [];
  let ema: number | undefined;

  for (let i = 0; i < candles.length; i += 1) {
    const price = pickPrice(candles[i], source);
    if (i === length - 1) {
      let sum = 0;
      for (let j = i - length + 1; j <= i; j += 1) {
        sum += pickPrice(candles[j], source);
      }
      ema = sum / length;
    } else if (i >= length) {
      ema = (price - (ema as number)) * multiplier + (ema as number);
    }

    if (ema !== undefined) {
      points.push({
        timestamp: candles[i].timestamp,
        value: ema,
      });
    }
  }

  return {
    type: "ema",
    config,
    points,
  };
}
