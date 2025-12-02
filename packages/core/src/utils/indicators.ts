import {
  Candle,
  IndicatorConfig,
  IndicatorPoint,
  IndicatorSeries,
  PriceSource,
} from "../types";

export const DEFAULT_PRICE_SOURCE: PriceSource = "close";

export function pickPrice(
  candle: Candle,
  source: PriceSource = DEFAULT_PRICE_SOURCE,
): number {
  switch (source) {
    case "open":
      return candle.open;
    case "high":
      return candle.high;
    case "low":
      return candle.low;
    case "close":
    default:
      return candle.close;
  }
}

export function indicatorKey(config: IndicatorConfig): string {
  if (config.id) return config.id;

  switch (config.type) {
    case "sma":
    case "ema":
      return `${config.type}-${config.length}-${config.source ?? DEFAULT_PRICE_SOURCE}`;
    case "rsi":
      return `rsi-${config.length}-${config.source ?? DEFAULT_PRICE_SOURCE}`;
    case "macd":
      return `macd-${config.fastLength}-${config.slowLength}-${config.signalLength}-${config.source ?? DEFAULT_PRICE_SOURCE}`;
    case "bbands":
      return `bbands-${config.length}-${config.stdDev}-${config.source ?? DEFAULT_PRICE_SOURCE}`;
    default:
      return JSON.stringify(config);
  }
}

export function latestPoint(series?: IndicatorSeries): IndicatorPoint | undefined {
  if (!series || series.points.length === 0) return undefined;
  return series.points[series.points.length - 1];
}

export function findPointAtOrBefore(
  series: IndicatorSeries | undefined,
  timestamp: number,
): IndicatorPoint | undefined {
  if (!series) return undefined;
  for (let i = series.points.length - 1; i >= 0; i -= 1) {
    const point = series.points[i];
    if (point.timestamp <= timestamp) return point;
  }
  return undefined;
}
