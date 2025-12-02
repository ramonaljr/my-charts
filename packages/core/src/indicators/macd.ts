import { Candle, IndicatorSeries, MacdConfig } from "../types";
import {
  DEFAULT_PRICE_SOURCE,
  findPointAtOrBefore,
  pickPrice,
} from "../utils/indicators";

interface ValuePoint {
  timestamp: number;
  value: number;
}

function emaFromValuePoints(
  values: ValuePoint[],
  length: number,
): ValuePoint[] {
  if (length <= 0) throw new Error("EMA length must be greater than zero");
  const multiplier = 2 / (length + 1);
  const result: ValuePoint[] = [];
  let ema: number | undefined;

  for (let i = 0; i < values.length; i += 1) {
    const price = values[i].value;
    if (i === length - 1) {
      let sum = 0;
      for (let j = i - length + 1; j <= i; j += 1) {
        sum += values[j].value;
      }
      ema = sum / length;
    } else if (i >= length) {
      ema = (price - (ema as number)) * multiplier + (ema as number);
    }

    if (ema !== undefined) {
      result.push({ timestamp: values[i].timestamp, value: ema });
    }
  }

  return result;
}

export function calculateMACD(
  candles: Candle[],
  config: MacdConfig,
): IndicatorSeries {
  const source = config.source ?? DEFAULT_PRICE_SOURCE;
  const priceSeries: ValuePoint[] = candles.map((candle) => ({
    timestamp: candle.timestamp,
    value: pickPrice(candle, source),
  }));

  const fast = emaFromValuePoints(priceSeries, config.fastLength);
  const slow = emaFromValuePoints(priceSeries, config.slowLength);
  const slowMap = new Map<number, number>(
    slow.map((point) => [point.timestamp, point.value]),
  );

  const macdLine: ValuePoint[] = fast
    .map((point) => {
      const slowValue = slowMap.get(point.timestamp);
      if (slowValue === undefined) return undefined;
      return { timestamp: point.timestamp, value: point.value - slowValue };
    })
    .filter((p): p is ValuePoint => Boolean(p));

  const signalLine = emaFromValuePoints(macdLine, config.signalLength);

  const points = macdLine.map((point) => {
    const signal = findPointAtOrBefore(
      { type: "macd", config, points: signalLine },
      point.timestamp,
    )?.value;

    const histogram =
      signal === undefined ? undefined : point.value - signal;

    return {
      timestamp: point.timestamp,
      value: point.value,
      signal,
      histogram,
    };
  });

  return {
    type: "macd",
    config,
    points,
  };
}
