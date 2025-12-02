import { Candle as CoreCandle, Timeframe } from "@nova/core";
import { prisma } from "../lib/prisma";
import { fetchFinnhubCandles } from "../providers/finnhub";
import { fetchAlphaVantageForexCandles } from "../providers/alphaVantage";
import { fetchTwelveDataForexCandles } from "../providers/twelveData";
import { generateMockCandles } from "../providers/mockCandles";
import { timeframeToDb, timeframeToMs } from "./timeframe";

function mapDbToCore(candle: {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}): CoreCandle {
  return {
    timestamp: candle.timestamp.getTime(),
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: candle.volume,
  };
}

export async function getCandles(
  symbolId: number,
  timeframe: Timeframe,
  limit = 500,
): Promise<CoreCandle[]> {
  const symbol = await prisma.symbol.findUnique({ where: { id: symbolId } });
  if (!symbol) {
    throw new Error(`Symbol ${symbolId} not found`);
  }

  const dbTimeframe = timeframeToDb(timeframe);
  const existing = await prisma.candle.findMany({
    where: { symbolId, timeframe: dbTimeframe },
    orderBy: { timestamp: "desc" },
    take: limit,
  });

  const now = Date.now();
  const expectedFrom = now - timeframeToMs(timeframe) * (limit + 2);
  const shouldRefetch =
    existing.length < limit ||
    (existing[0] && now - existing[0].timestamp.getTime() > timeframeToMs(timeframe));

  if (shouldRefetch) {
    let fetched: CoreCandle[] = [];

    try {
      // Use different providers based on asset class and timeframe
      if (symbol.assetClass === "FX") {
        // Use Twelve Data for all FX timeframes (free intraday + daily)
        fetched = await fetchTwelveDataForexCandles({
          symbol: symbol.finnhubSymbol,
          timeframe,
          from: expectedFrom,
          to: now,
        });
      } else {
        fetched = await fetchFinnhubCandles({
          symbol: symbol.finnhubSymbol,
          assetClass: symbol.assetClass,
          timeframe,
          from: expectedFrom,
          to: now,
        });
      }
    } catch (error) {
      // Use mock data as fallback on any error
      console.warn(
        `Data fetch failed for ${symbol.finnhubSymbol}, using mock data:`,
        error instanceof Error ? error.message : error,
      );
      fetched = generateMockCandles({
        symbol: symbol.finnhubSymbol,
        timeframe,
        from: expectedFrom,
        to: now,
      });
    }

    if (fetched.length > 0) {
      await prisma.$transaction(
        fetched.map((candle) =>
          prisma.candle.upsert({
            where: {
              symbolId_timeframe_timestamp: {
                symbolId,
                timeframe: dbTimeframe,
                timestamp: new Date(candle.timestamp),
              },
            },
            update: {
              open: candle.open,
              high: candle.high,
              low: candle.low,
              close: candle.close,
              volume: candle.volume,
            },
            create: {
              symbolId,
              timeframe: dbTimeframe,
              timestamp: new Date(candle.timestamp),
              open: candle.open,
              high: candle.high,
              low: candle.low,
              close: candle.close,
              volume: candle.volume,
            },
          }),
        ),
      );
    }
  }

  // Get the most recent candles, then reverse to return in ascending order
  const candles = await prisma.candle.findMany({
    where: { symbolId, timeframe: dbTimeframe },
    orderBy: { timestamp: "desc" },
    take: limit,
  });

  // Reverse to return oldest-to-newest for chart rendering
  return candles.reverse().map(mapDbToCore);
}
