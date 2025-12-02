import { prisma } from "../lib/prisma";
import {
  fetchBalanceSheets,
  fetchCashflows,
  fetchIncomeStatements,
  fetchRatios,
  fetchProfile,
  fetchQuote,
  fetchDividends,
  fetchEarnings,
  fetchRevenueSegmentation,
  YahooQuote,
} from "../providers/yahoo";

const REFRESH_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

async function isStale(symbolId: number): Promise<boolean> {
  const latest = await prisma.fundamentalsIncome.findFirst({
    where: { symbolId },
    orderBy: { updatedAt: "desc" },
  });
  if (!latest) return true;
  return Date.now() - latest.updatedAt.getTime() > REFRESH_INTERVAL_MS;
}

async function upsertFundamentals(symbolId: number, yahooSymbol: string, clearOld = false) {
  // If clearing old data, delete existing records first
  if (clearOld) {
    await Promise.all([
      prisma.fundamentalsIncome.deleteMany({ where: { symbolId } }),
      prisma.fundamentalsBalance.deleteMany({ where: { symbolId } }),
      prisma.fundamentalsCashflow.deleteMany({ where: { symbolId } }),
      prisma.fundamentalsRatios.deleteMany({ where: { symbolId } }),
    ]);
    console.log(`[Fundamentals] Cleared old data for symbol ${symbolId}`);
  }

  const [income, balance, cashflow, ratios] = await Promise.all([
    fetchIncomeStatements(yahooSymbol, 8),
    fetchBalanceSheets(yahooSymbol, 8),
    fetchCashflows(yahooSymbol, 8),
    fetchRatios(yahooSymbol, 8),
  ]);

  console.log(`[Fundamentals] Fetched from Yahoo: ${income.length} income, ${balance.length} balance, ${cashflow.length} cashflow, ${ratios.length} ratios`);
  if (income.length > 0) {
    console.log(`[Fundamentals] Sample income data: date=${income[0].date}, revenue=${income[0].revenue}`);
  }

  const operations: ReturnType<typeof prisma.fundamentalsIncome.upsert>[] = [];

  // Filter out rows with empty dates
  for (const row of income) {
    if (!row.date) continue;
    operations.push(
      prisma.fundamentalsIncome.upsert({
        where: {
          symbolId_fiscalDate_period: {
            symbolId,
            fiscalDate: new Date(row.date),
            period: (row.period ?? row.calendarYear ?? "").toString(),
          },
        },
        update: { data: row },
        create: {
          symbolId,
          fiscalDate: new Date(row.date),
          period: (row.period ?? row.calendarYear ?? "").toString(),
          data: row,
        },
      })
    );
  }

  for (const row of balance) {
    if (!row.date) continue;
    operations.push(
      prisma.fundamentalsBalance.upsert({
        where: {
          symbolId_fiscalDate_period: {
            symbolId,
            fiscalDate: new Date(row.date),
            period: (row.period ?? row.calendarYear ?? "").toString(),
          },
        },
        update: { data: row },
        create: {
          symbolId,
          fiscalDate: new Date(row.date),
          period: (row.period ?? row.calendarYear ?? "").toString(),
          data: row,
        },
      }) as any
    );
  }

  for (const row of cashflow) {
    if (!row.date) continue;
    operations.push(
      prisma.fundamentalsCashflow.upsert({
        where: {
          symbolId_fiscalDate_period: {
            symbolId,
            fiscalDate: new Date(row.date),
            period: (row.period ?? row.calendarYear ?? "").toString(),
          },
        },
        update: { data: row },
        create: {
          symbolId,
          fiscalDate: new Date(row.date),
          period: (row.period ?? row.calendarYear ?? "").toString(),
          data: row,
        },
      }) as any
    );
  }

  for (const row of ratios) {
    if (!row.date) continue;
    operations.push(
      prisma.fundamentalsRatios.upsert({
        where: {
          symbolId_fiscalDate_period: {
            symbolId,
            fiscalDate: new Date(row.date),
            period: (row.period ?? "").toString(),
          },
        },
        update: { data: row },
        create: {
          symbolId,
          fiscalDate: new Date(row.date),
          period: (row.period ?? "").toString(),
          data: row,
        },
      }) as any
    );
  }

  if (operations.length > 0) {
    await prisma.$transaction(operations);
  }
}

type FundamentalsRow = {
  fiscalDate: string;
  period: string;
  data: Record<string, unknown>;
};

function mapFundamentalsRows<
  T extends { fiscalDate: Date; period: string; data: unknown }
>(rows: T[]): FundamentalsRow[] {
  return rows.map((row) => ({
    fiscalDate: row.fiscalDate.toISOString().slice(0, 10),
    period: row.period,
    data: row.data as Record<string, unknown>,
  }));
}

/**
 * Get Yahoo symbol from our symbol record
 * For most stocks, the displayName works as Yahoo symbol
 */
function getYahooSymbol(symbol: {
  displayName: string;
  finnhubSymbol: string;
  fmpSymbol: string | null;
}): string {
  // Yahoo uses the same symbols as most exchanges
  // For US stocks, displayName usually works (e.g., "NVDA", "AAPL")
  return symbol.displayName;
}

export async function getFundamentals(symbolId: number, forceRefresh = false) {
  const symbol = await prisma.symbol.findUnique({ where: { id: symbolId } });

  if (!symbol) {
    throw new Error(`Symbol ${symbolId} not found`);
  }

  // For Yahoo Finance, we can use most stock symbols directly
  if (symbol.assetClass !== "STOCK") {
    throw new Error("Fundamentals are only available for stocks");
  }

  const yahooSymbol = getYahooSymbol(symbol);

  if (forceRefresh || (await isStale(symbolId))) {
    try {
      // Clear old data when force refreshing to remove stale mock/FMP data
      await upsertFundamentals(symbolId, yahooSymbol, forceRefresh);
    } catch (error) {
      console.error(`[Fundamentals] Failed to refresh data for ${yahooSymbol}:`, error);
      // Continue with cached data if available
    }
  }

  const [
    incomeRaw,
    balanceRaw,
    cashflowRaw,
    ratiosRaw,
    profile,
    quote,
    dividends,
    earnings,
    revenueSegmentation,
  ] = await Promise.all([
    prisma.fundamentalsIncome.findMany({
      where: { symbolId },
      orderBy: { fiscalDate: "desc" },
      take: 40, // More data for quarterly + annual
    }),
    prisma.fundamentalsBalance.findMany({
      where: { symbolId },
      orderBy: { fiscalDate: "desc" },
      take: 40,
    }),
    prisma.fundamentalsCashflow.findMany({
      where: { symbolId },
      orderBy: { fiscalDate: "desc" },
      take: 40,
    }),
    prisma.fundamentalsRatios.findMany({
      where: { symbolId },
      orderBy: { fiscalDate: "desc" },
      take: 12,
    }),
    fetchProfile(yahooSymbol),
    fetchQuote(yahooSymbol),
    fetchDividends(yahooSymbol),
    fetchEarnings(yahooSymbol),
    fetchRevenueSegmentation(yahooSymbol).catch(() => ({ byProduct: [], byGeo: [] })),
  ]);

  const income = mapFundamentalsRows(incomeRaw);
  const balance = mapFundamentalsRows(balanceRaw);
  const cashflow = mapFundamentalsRows(cashflowRaw);
  const ratios = mapFundamentalsRows(ratiosRaw);

  // Process revenue breakdown (Yahoo doesn't provide segment data, so we use empty arrays)
  // The UI will display quarterly/annual revenue from income statements instead
  const revenueProduct = revenueSegmentation.byProduct.map((item) => ({
    date: item.date,
    ...item.segments,
  }));
  const revenueGeo = revenueSegmentation.byGeo.map((item) => ({
    date: item.date,
    ...item.segments,
  }));

  const lastRefreshedAt =
    incomeRaw[0]?.updatedAt ??
    balanceRaw[0]?.updatedAt ??
    cashflowRaw[0]?.updatedAt ??
    ratiosRaw[0]?.updatedAt;

  return {
    symbol: {
      id: symbol.id,
      displayName: symbol.displayName,
      assetClass: symbol.assetClass,
      finnhubSymbol: symbol.finnhubSymbol,
      fmpSymbol: symbol.fmpSymbol,
    },
    symbolId,
    lastRefreshedAt: lastRefreshedAt?.toISOString(),
    income,
    balance,
    cashflow,
    ratios,
    profile,
    quote,
    dividends,
    earnings,
    revenueProduct,
    revenueGeo,
  };
}

/**
 * Get real-time quote from Yahoo Finance
 */
export async function getRealtimeQuote(symbolId: number): Promise<YahooQuote | null> {
  const symbol = await prisma.symbol.findUnique({ where: { id: symbolId } });

  if (!symbol) {
    throw new Error(`Symbol ${symbolId} not found`);
  }

  const yahooSymbol = getYahooSymbol(symbol);
  const quote = await fetchQuote(yahooSymbol);
  return quote;
}
