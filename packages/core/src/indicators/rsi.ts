import { Candle, IndicatorSeries, RsiConfig } from "../types";
import { DEFAULT_PRICE_SOURCE, pickPrice } from "../utils/indicators";

export function calculateRSI(
  candles: Candle[],
  config: RsiConfig,
): IndicatorSeries {
  const length = config.length;
  const source = config.source ?? DEFAULT_PRICE_SOURCE;
  if (length <= 0) {
    throw new Error("RSI length must be greater than zero");
  }
  if (candles.length < length + 1) {
    return { type: "rsi", config, points: [] };
  }

  const points = [];
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i < candles.length; i += 1) {
    const current = pickPrice(candles[i], source);
    const previous = pickPrice(candles[i - 1], source);
    const change = current - previous;
    const gain = Math.max(change, 0);
    const loss = Math.max(-change, 0);

    if (i <= length) {
      avgGain += gain;
      avgLoss += loss;

      if (i === length) {
        avgGain /= length;
        avgLoss /= length;
        const rs = avgLoss === 0 ? 0 : avgGain / avgLoss;
        const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);
        points.push({ timestamp: candles[i].timestamp, value: rsi });
      }
    } else {
      avgGain = (avgGain * (length - 1) + gain) / length;
      avgLoss = (avgLoss * (length - 1) + loss) / length;
      const rs = avgLoss === 0 ? 0 : avgGain / avgLoss;
      const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);
      points.push({ timestamp: candles[i].timestamp, value: rsi });
    }
  }

  return {
    type: "rsi",
    config,
    points,
  };
}
