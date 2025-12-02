import { Candle, IndicatorSeries, AtrConfig } from "../types";

/**
 * Calculates the Average True Range (ATR) indicator
 * ATR measures market volatility by decomposing the entire range of an asset price for that period
 */
export function calculateATR(
  candles: Candle[],
  config: AtrConfig
): IndicatorSeries {
  const length = config.length;

  if (length <= 0) {
    throw new Error("ATR length must be greater than zero");
  }

  if (candles.length < length + 1) {
    return { type: "atr", config, points: [] };
  }

  const points: Array<{ timestamp: number; value: number }> = [];
  const trueRanges: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const current = candles[i];
    const previous = candles[i - 1];

    // True Range = max(high - low, abs(high - prev close), abs(low - prev close))
    const tr = Math.max(
      current.high - current.low,
      Math.abs(current.high - previous.close),
      Math.abs(current.low - previous.close)
    );

    trueRanges.push(tr);

    if (trueRanges.length >= length) {
      if (trueRanges.length === length) {
        // First ATR is simple average
        const sum = trueRanges.reduce((a, b) => a + b, 0);
        const atr = sum / length;
        points.push({ timestamp: current.timestamp, value: atr });
      } else {
        // Subsequent ATR uses smoothing: ATR = ((prevATR * (length - 1)) + TR) / length
        const prevAtr = points[points.length - 1].value;
        const atr = (prevAtr * (length - 1) + tr) / length;
        points.push({ timestamp: current.timestamp, value: atr });
      }
    }
  }

  return {
    type: "atr",
    config,
    points,
  };
}
