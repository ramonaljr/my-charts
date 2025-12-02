export interface Candle {
  time: number; // Unix timestamp
  open: number;
  high: number;
  low: number;
  close: number;
}

export function generateCandles(count: number = 100): Candle[] {
  const candles: Candle[] = [];
  let time = Math.floor(Date.now() / 1000) - count * 3600; // Start 'count' hours ago
  let price = 100;

  for (let i = 0; i < count; i++) {
    const volatility = 2;
    const change = (Math.random() - 0.5) * volatility;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;

    candles.push({
      time: time as number,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
    });

    price = close;
    time += 3600; // 1 hour steps
  }

  return candles;
}
