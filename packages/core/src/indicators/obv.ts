import { Candle, IndicatorSeries, ObvConfig } from "../types";

/**
 * Calculates On Balance Volume (OBV)
 * OBV adds volume on up days and subtracts volume on down days
 * It's a cumulative total of positive and negative volume flow
 */
export function calculateOBV(
  candles: Candle[],
  config: ObvConfig
): IndicatorSeries {
  if (candles.length === 0) {
    return { type: "obv", config, points: [] };
  }

  const points = [];
  let obv = 0;

  // First candle starts with its volume as OBV
  points.push({
    timestamp: candles[0].timestamp,
    value: candles[0].volume || 0,
  });
  obv = candles[0].volume || 0;

  // Calculate OBV for subsequent candles
  for (let i = 1; i < candles.length; i++) {
    const current = candles[i];
    const previous = candles[i - 1];
    const volume = current.volume || 0;

    if (current.close > previous.close) {
      // Price went up, add volume
      obv += volume;
    } else if (current.close < previous.close) {
      // Price went down, subtract volume
      obv -= volume;
    }
    // If close === previous close, OBV stays the same

    points.push({
      timestamp: current.timestamp,
      value: obv,
    });
  }

  return {
    type: "obv",
    config,
    points,
  };
}
