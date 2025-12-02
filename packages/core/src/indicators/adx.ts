import { Candle, IndicatorSeries, AdxConfig } from "../types";

/**
 * Calculates the Average Directional Index (ADX)
 * ADX measures trend strength regardless of direction
 * Also provides +DI and -DI for directional movement
 */
export function calculateADX(
  candles: Candle[],
  config: AdxConfig
): IndicatorSeries {
  const length = config.length;

  if (length <= 0) {
    throw new Error("ADX length must be greater than zero");
  }

  if (candles.length < length * 2) {
    return { type: "adx", config, points: [] };
  }

  const points = [];
  const trueRanges: number[] = [];
  const plusDMs: number[] = [];
  const minusDMs: number[] = [];

  // Calculate TR, +DM, -DM for each candle
  for (let i = 1; i < candles.length; i++) {
    const current = candles[i];
    const previous = candles[i - 1];

    // True Range
    const tr = Math.max(
      current.high - current.low,
      Math.abs(current.high - previous.close),
      Math.abs(current.low - previous.close)
    );
    trueRanges.push(tr);

    // Directional Movement
    const upMove = current.high - previous.high;
    const downMove = previous.low - current.low;

    let plusDM = 0;
    let minusDM = 0;

    if (upMove > downMove && upMove > 0) {
      plusDM = upMove;
    }
    if (downMove > upMove && downMove > 0) {
      minusDM = downMove;
    }

    plusDMs.push(plusDM);
    minusDMs.push(minusDM);
  }

  // Smooth TR, +DM, -DM using Wilder's smoothing
  const smoothedTR: number[] = [];
  const smoothedPlusDM: number[] = [];
  const smoothedMinusDM: number[] = [];

  // First smoothed value is sum of first 'length' values
  let sumTR = 0;
  let sumPlusDM = 0;
  let sumMinusDM = 0;

  for (let i = 0; i < length && i < trueRanges.length; i++) {
    sumTR += trueRanges[i];
    sumPlusDM += plusDMs[i];
    sumMinusDM += minusDMs[i];
  }

  smoothedTR.push(sumTR);
  smoothedPlusDM.push(sumPlusDM);
  smoothedMinusDM.push(sumMinusDM);

  // Subsequent smoothed values use Wilder's method
  for (let i = length; i < trueRanges.length; i++) {
    const prevTR = smoothedTR[smoothedTR.length - 1];
    const prevPlusDM = smoothedPlusDM[smoothedPlusDM.length - 1];
    const prevMinusDM = smoothedMinusDM[smoothedMinusDM.length - 1];

    smoothedTR.push(prevTR - prevTR / length + trueRanges[i]);
    smoothedPlusDM.push(prevPlusDM - prevPlusDM / length + plusDMs[i]);
    smoothedMinusDM.push(prevMinusDM - prevMinusDM / length + minusDMs[i]);
  }

  // Calculate +DI, -DI, and DX
  const dxValues: number[] = [];

  for (let i = 0; i < smoothedTR.length; i++) {
    const tr = smoothedTR[i];
    const plusDI = tr > 0 ? (smoothedPlusDM[i] / tr) * 100 : 0;
    const minusDI = tr > 0 ? (smoothedMinusDM[i] / tr) * 100 : 0;

    const diSum = plusDI + minusDI;
    const dx = diSum > 0 ? (Math.abs(plusDI - minusDI) / diSum) * 100 : 0;

    dxValues.push(dx);
  }

  // Calculate ADX (smoothed DX)
  let adxSum = 0;
  for (let i = 0; i < length && i < dxValues.length; i++) {
    adxSum += dxValues[i];
  }

  let prevADX = adxSum / length;

  for (let i = length - 1; i < dxValues.length; i++) {
    const candleIndex = i + length; // Offset for the first candle we skipped

    if (candleIndex < candles.length) {
      const tr = smoothedTR[i];
      const plusDI = tr > 0 ? (smoothedPlusDM[i] / tr) * 100 : 0;
      const minusDI = tr > 0 ? (smoothedMinusDM[i] / tr) * 100 : 0;

      let adx: number;
      if (i === length - 1) {
        adx = prevADX;
      } else {
        adx = (prevADX * (length - 1) + dxValues[i]) / length;
        prevADX = adx;
      }

      points.push({
        timestamp: candles[candleIndex].timestamp,
        value: adx,
        plusDI,
        minusDI,
      });
    }
  }

  return {
    type: "adx",
    config,
    points,
  };
}
