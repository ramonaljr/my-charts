import { Candle, IndicatorSeries, IchimokuConfig, IndicatorPoint } from "../types";

/**
 * Calculates the Ichimoku Cloud (Ichimoku Kinko Hyo)
 *
 * Based on PineScript v6 implementation:
 * - Tenkan-sen (Conversion Line): donchian(9) = (highest(9) + lowest(9)) / 2
 * - Kijun-sen (Base Line): donchian(26) = (highest(26) + lowest(26)) / 2
 * - Senkou Span A (Leading Span A): (Tenkan + Kijun) / 2, plotted displacement periods ahead
 * - Senkou Span B (Leading Span B): donchian(52), plotted displacement periods ahead
 * - Chikou Span (Lagging Span): Close, plotted displacement periods behind
 */
export function calculateIchimoku(
  candles: Candle[],
  config: IchimokuConfig
): IndicatorSeries {
  const { conversionPeriod, basePeriod, spanPeriod, displacement } = config;

  if (conversionPeriod <= 0 || basePeriod <= 0 || spanPeriod <= 0 || displacement <= 0) {
    throw new Error("Ichimoku periods must be greater than zero");
  }

  if (candles.length < spanPeriod) {
    return { type: "ichimoku", config, points: [] };
  }

  // Donchian channel midline: (highest high + lowest low) / 2
  function donchian(endIndex: number, period: number): number {
    let high = -Infinity;
    let low = Infinity;
    const startIndex = Math.max(0, endIndex - period + 1);

    for (let i = startIndex; i <= endIndex; i++) {
      high = Math.max(high, candles[i].high);
      low = Math.min(low, candles[i].low);
    }

    return (high + low) / 2;
  }

  // Estimate timeframe interval from candle data
  const getTimeInterval = (): number => {
    if (candles.length < 2) return 3600000; // Default 1 hour in ms
    return candles[1].timestamp - candles[0].timestamp;
  };

  const timeInterval = getTimeInterval();
  const points: IndicatorPoint[] = [];

  // Calculate for each candle
  for (let i = 0; i < candles.length; i++) {
    const timestamp = candles[i].timestamp;
    const point: IndicatorPoint = {
      timestamp,
      value: 0,
    };

    // Tenkan-sen (Conversion Line) - need conversionPeriod candles
    if (i >= conversionPeriod - 1) {
      point.tenkan = donchian(i, conversionPeriod);
      point.value = point.tenkan;
    }

    // Kijun-sen (Base Line) - need basePeriod candles
    if (i >= basePeriod - 1) {
      point.kijun = donchian(i, basePeriod);
    }

    // Senkou Span A - average of Tenkan and Kijun
    // These values will be shifted forward by displacement in the UI
    if (point.tenkan !== undefined && point.kijun !== undefined) {
      point.senkouA = (point.tenkan + point.kijun) / 2;
    }

    // Senkou Span B - donchian of spanPeriod
    // These values will be shifted forward by displacement in the UI
    if (i >= spanPeriod - 1) {
      point.senkouB = donchian(i, spanPeriod);
    }

    // Chikou Span - current close price
    // This value will be shifted backward by displacement in the UI
    point.chikou = candles[i].close;

    // Store offset timestamps for proper time-shifting in the UI
    // Senkou spans are plotted (displacement - 1) periods AHEAD
    point.senkouTimestamp = timestamp + (displacement - 1) * timeInterval;
    // Chikou span is plotted (displacement - 1) periods BEHIND
    point.chikouTimestamp = timestamp - (displacement - 1) * timeInterval;

    points.push(point);
  }

  return {
    type: "ichimoku",
    config,
    points,
  };
}
