import YahooFinance from "yahoo-finance2";

// Create Yahoo Finance instance (required for v3)
// Disable validation logging since Yahoo's API sometimes returns data that doesn't match the schema
const yahooFinance = new YahooFinance({
  suppressNotices: ["yahooSurvey"],
  validation: { logErrors: false },
});

/**
 * Helper to safely fetch fundamentals data, handling validation errors
 * Yahoo Finance API sometimes returns data that doesn't match the schema
 */
async function safeFetchFundamentals(
  symbol: string,
  options: { period1: string; period2: string; type: "annual" | "quarterly"; module: string }
): Promise<Array<Record<string, unknown>>> {
  try {
    const result = await yahooFinance.fundamentalsTimeSeries(symbol, options);
    return result as Array<Record<string, unknown>>;
  } catch (error: unknown) {
    // If validation fails but we got partial data, use it
    if (error && typeof error === "object" && "result" in error && Array.isArray((error as { result: unknown }).result)) {
      console.log(`[Yahoo] Using partial data for ${symbol} ${options.type} despite validation error`);
      return (error as { result: Array<Record<string, unknown>> }).result;
    }
    throw error;
  }
}

// Types matching our existing FMP interface for compatibility
export interface YahooProfile {
  symbol: string;
  price: number;
  beta: number;
  volAvg: number;
  mktCap: number;
  lastDiv: number;
  range: string;
  changes: number;
  companyName: string;
  currency: string;
  cik: string;
  isin: string;
  cusip: string;
  exchange: string;
  exchangeShortName: string;
  industry: string;
  website: string;
  description: string;
  ceo: string;
  sector: string;
  country: string;
  fullTimeEmployees: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  dcfDiff: number;
  dcf: number;
  image: string;
  ipoDate: string;
  defaultImage: boolean;
  isEtf: boolean;
  isActivelyTrading: boolean;
  isAdr: boolean;
  isFund: boolean;
}

export interface YahooQuote {
  symbol: string;
  name: string;
  price: number;
  changesPercentage: number;
  change: number;
  dayLow: number;
  dayHigh: number;
  yearHigh: number;
  yearLow: number;
  marketCap: number;
  priceAvg50: number;
  priceAvg200: number;
  exchange: string;
  volume: number;
  avgVolume: number;
  open: number;
  previousClose: number;
  eps: number;
  pe: number;
  earningsAnnouncement: string;
  sharesOutstanding: number;
  timestamp: number;
}

export interface YahooStatementRow {
  date: string;
  symbol: string;
  calendarYear?: string;
  period?: string;
  [key: string]: string | number | undefined;
}

export interface YahooRatiosRow {
  date: string;
  symbol: string;
  period?: string;
  [key: string]: string | number | undefined;
}

export interface YahooDividend {
  date: string;
  label: string;
  adjDividend: number;
  dividend: number;
  recordDate: string;
  paymentDate: string;
  declarationDate: string;
}

export interface YahooEarning {
  date: string;
  symbol: string;
  eps: number;
  epsEstimated: number;
  time: string;
  revenue: number;
  revenueEstimated: number;
}

// Helper to safely get value from object
function safeGet<T>(obj: unknown, key: string, defaultValue: T): T {
  if (obj && typeof obj === "object" && key in obj) {
    const value = (obj as Record<string, unknown>)[key];
    return (value ?? defaultValue) as T;
  }
  return defaultValue;
}

function getDomainFromWebsite(website?: string): string {
  if (!website) return "";
  try {
    const url = new URL(website);
    return url.hostname.replace("www.", "");
  } catch {
    return "";
  }
}

/**
 * Fetch company profile from Yahoo Finance
 */
export async function fetchProfile(symbol: string): Promise<YahooProfile | null> {
  try {
    const [quoteSummaryResult, quoteResult] = await Promise.all([
      yahooFinance.quoteSummary(symbol, {
        modules: ["assetProfile", "price", "summaryDetail", "defaultKeyStatistics"],
      }),
      yahooFinance.quote(symbol),
    ]);

    const quoteSummary = quoteSummaryResult as Record<string, unknown>;
    const quote = quoteResult as Record<string, unknown>;

    const profile = quoteSummary.assetProfile as Record<string, unknown> | undefined;
    const priceData = quoteSummary.price as Record<string, unknown> | undefined;
    const summaryDetail = quoteSummary.summaryDetail as Record<string, unknown> | undefined;
    const keyStats = quoteSummary.defaultKeyStatistics as Record<string, unknown> | undefined;

    const companyOfficers = profile?.companyOfficers as Array<Record<string, unknown>> | undefined;

    return {
      symbol,
      price: safeGet(quote, "regularMarketPrice", 0),
      beta: safeGet(keyStats, "beta", 0),
      volAvg: safeGet(quote, "averageDailyVolume3Month", 0),
      mktCap: safeGet(quote, "marketCap", 0),
      lastDiv: safeGet(summaryDetail, "dividendRate", 0),
      range: `${safeGet(quote, "fiftyTwoWeekLow", 0)}-${safeGet(quote, "fiftyTwoWeekHigh", 0)}`,
      changes: safeGet(quote, "regularMarketChange", 0),
      companyName: safeGet(priceData, "longName", "") || safeGet(quote, "shortName", "") || symbol,
      currency: safeGet(priceData, "currency", "USD"),
      cik: "",
      isin: "",
      cusip: "",
      exchange: safeGet(quote, "exchange", ""),
      exchangeShortName: safeGet(quote, "exchange", ""),
      industry: safeGet(profile, "industry", ""),
      website: safeGet(profile, "website", ""),
      description: safeGet(profile, "longBusinessSummary", ""),
      ceo: companyOfficers?.[0]?.name?.toString() ?? "",
      sector: safeGet(profile, "sector", ""),
      country: safeGet(profile, "country", ""),
      fullTimeEmployees: profile?.fullTimeEmployees?.toString() ?? "",
      phone: safeGet(profile, "phone", ""),
      address: safeGet(profile, "address1", ""),
      city: safeGet(profile, "city", ""),
      state: safeGet(profile, "state", ""),
      zip: safeGet(profile, "zip", ""),
      dcfDiff: 0,
      dcf: 0,
      image: `https://logo.clearbit.com/${getDomainFromWebsite(safeGet(profile, "website", ""))}`,
      ipoDate: "",
      defaultImage: false,
      isEtf: (quote.quoteType as string | undefined) === "ETF",
      isActivelyTrading: true,
      isAdr: false,
      isFund: (quote.quoteType as string | undefined) === "MUTUALFUND",
    };
  } catch (error) {
    console.error(`[Yahoo] Failed to fetch profile for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch real-time quote from Yahoo Finance
 */
export async function fetchQuote(symbol: string): Promise<YahooQuote | null> {
  try {
    const quoteResult = await yahooFinance.quote(symbol);
    const quote = quoteResult as Record<string, unknown>;

    const earningsTimestamp = quote.earningsTimestamp as Date | undefined;

    return {
      symbol,
      name: safeGet(quote, "shortName", "") || safeGet(quote, "longName", "") || symbol,
      price: safeGet(quote, "regularMarketPrice", 0),
      changesPercentage: safeGet(quote, "regularMarketChangePercent", 0),
      change: safeGet(quote, "regularMarketChange", 0),
      dayLow: safeGet(quote, "regularMarketDayLow", 0),
      dayHigh: safeGet(quote, "regularMarketDayHigh", 0),
      yearHigh: safeGet(quote, "fiftyTwoWeekHigh", 0),
      yearLow: safeGet(quote, "fiftyTwoWeekLow", 0),
      marketCap: safeGet(quote, "marketCap", 0),
      priceAvg50: safeGet(quote, "fiftyDayAverage", 0),
      priceAvg200: safeGet(quote, "twoHundredDayAverage", 0),
      exchange: safeGet(quote, "exchange", ""),
      volume: safeGet(quote, "regularMarketVolume", 0),
      avgVolume: safeGet(quote, "averageDailyVolume3Month", 0),
      open: safeGet(quote, "regularMarketOpen", 0),
      previousClose: safeGet(quote, "regularMarketPreviousClose", 0),
      eps: safeGet(quote, "epsTrailingTwelveMonths", 0),
      pe: safeGet(quote, "trailingPE", 0),
      earningsAnnouncement: earningsTimestamp?.toISOString() ?? "",
      sharesOutstanding: safeGet(quote, "sharesOutstanding", 0),
      timestamp: Math.floor(Date.now() / 1000),
    };
  } catch (error) {
    console.error(`[Yahoo] Failed to fetch quote for ${symbol}:`, error);
    return null;
  }
}

/**
 * Helper to map raw fundamentals data to our row format
 */
function mapIncomeRow(r: Record<string, unknown>, symbol: string, periodType: "FY" | "Q"): YahooStatementRow {
  const date = r.date as Date;
  const dateStr = date instanceof Date ? date.toISOString().slice(0, 10) : String(r.date).slice(0, 10);

  return {
    date: dateStr,
    symbol,
    period: periodType,
    calendarYear: dateStr.slice(0, 4),
    revenue: safeGet(r, "totalRevenue", 0),
    costOfRevenue: safeGet(r, "costOfRevenue", 0),
    grossProfit: safeGet(r, "grossProfit", 0),
    researchAndDevelopmentExpenses: safeGet(r, "researchAndDevelopment", 0),
    sellingGeneralAndAdministrativeExpenses: safeGet(r, "sellingGeneralAndAdministration", 0),
    operatingExpenses: safeGet(r, "operatingExpense", 0),
    operatingIncome: safeGet(r, "operatingIncome", 0),
    interestExpense: safeGet(r, "interestExpense", 0),
    incomeBeforeTax: safeGet(r, "pretaxIncome", 0),
    incomeTaxExpense: safeGet(r, "taxProvision", 0),
    netIncome: safeGet(r, "netIncome", 0),
    ebitda: safeGet(r, "ebitda", 0) || safeGet(r, "normalizedEBITDA", 0),
  };
}

/**
 * Fetch income statements using fundamentalsTimeSeries (new API since Nov 2024)
 * Fetches both annual and quarterly data
 */
export async function fetchIncomeStatements(
  symbol: string,
  limit = 8
): Promise<YahooStatementRow[]> {
  try {
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 10);
    const endDate = new Date().toISOString().split("T")[0];
    const startDateStr = startDate.toISOString().split("T")[0];

    // Fetch both annual and quarterly data with error handling
    const [annualData, quarterlyData] = await Promise.all([
      safeFetchFundamentals(symbol, {
        period1: startDateStr,
        period2: endDate,
        type: "annual",
        module: "all",
      }),
      safeFetchFundamentals(symbol, {
        period1: startDateStr,
        period2: endDate,
        type: "quarterly",
        module: "all",
      }),
    ]);

    // Process annual data
    const annual = annualData
      .filter((r) => r.date && (r.totalRevenue || r.netIncome || r.grossProfit))
      .sort((a, b) => new Date(b.date as string).getTime() - new Date(a.date as string).getTime())
      .slice(0, limit)
      .map((r) => mapIncomeRow(r, symbol, "FY"));

    // Process quarterly data
    const quarterly = quarterlyData
      .filter((r) => r.date && (r.totalRevenue || r.netIncome || r.grossProfit))
      .sort((a, b) => new Date(b.date as string).getTime() - new Date(a.date as string).getTime())
      .slice(0, limit * 4) // More quarters
      .map((r) => mapIncomeRow(r, symbol, "Q"));

    // Combine and return
    return [...annual, ...quarterly];
  } catch (error) {
    console.error(`[Yahoo] Failed to fetch income statements for ${symbol}:`, error);
    return [];
  }
}

/**
 * Helper to map raw balance sheet data to our row format
 */
function mapBalanceRow(r: Record<string, unknown>, symbol: string, periodType: "FY" | "Q"): YahooStatementRow {
  const date = r.date as Date;
  const dateStr = date instanceof Date ? date.toISOString().slice(0, 10) : String(r.date).slice(0, 10);

  return {
    date: dateStr,
    symbol,
    period: periodType,
    calendarYear: dateStr.slice(0, 4),
    cashAndCashEquivalents: safeGet(r, "cashAndCashEquivalents", 0),
    shortTermInvestments: safeGet(r, "otherShortTermInvestments", 0),
    netReceivables: safeGet(r, "receivables", 0) || safeGet(r, "accountsReceivable", 0),
    inventory: safeGet(r, "inventory", 0),
    totalCurrentAssets: safeGet(r, "currentAssets", 0),
    propertyPlantEquipmentNet: safeGet(r, "netPPE", 0),
    goodwill: safeGet(r, "goodwill", 0),
    intangibleAssets: safeGet(r, "otherIntangibleAssets", 0),
    totalAssets: safeGet(r, "totalAssets", 0),
    accountPayables: safeGet(r, "accountsPayable", 0) || safeGet(r, "payables", 0),
    shortTermDebt: safeGet(r, "currentDebt", 0),
    totalCurrentLiabilities: safeGet(r, "currentLiabilities", 0),
    longTermDebt: safeGet(r, "longTermDebt", 0),
    totalLiabilities: safeGet(r, "totalLiabilitiesNetMinorityInterest", 0),
    totalStockholdersEquity: safeGet(r, "stockholdersEquity", 0),
    totalLiabilitiesAndStockholdersEquity:
      safeGet<number>(r, "totalLiabilitiesNetMinorityInterest", 0) +
      safeGet<number>(r, "stockholdersEquity", 0),
  };
}

/**
 * Fetch balance sheets using fundamentalsTimeSeries
 * Fetches both annual and quarterly data
 */
export async function fetchBalanceSheets(
  symbol: string,
  limit = 8
): Promise<YahooStatementRow[]> {
  try {
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 10);
    const endDate = new Date().toISOString().split("T")[0];
    const startDateStr = startDate.toISOString().split("T")[0];

    const [annualData, quarterlyData] = await Promise.all([
      safeFetchFundamentals(symbol, {
        period1: startDateStr,
        period2: endDate,
        type: "annual",
        module: "all",
      }),
      safeFetchFundamentals(symbol, {
        period1: startDateStr,
        period2: endDate,
        type: "quarterly",
        module: "all",
      }),
    ]);

    const filterBalance = (r: Record<string, unknown>) =>
      r.date && (r.totalAssets || r.cashAndCashEquivalents || r.stockholdersEquity);

    const annual = annualData
      .filter(filterBalance)
      .sort((a, b) => new Date(b.date as string).getTime() - new Date(a.date as string).getTime())
      .slice(0, limit)
      .map((r) => mapBalanceRow(r, symbol, "FY"));

    const quarterly = quarterlyData
      .filter(filterBalance)
      .sort((a, b) => new Date(b.date as string).getTime() - new Date(a.date as string).getTime())
      .slice(0, limit * 4)
      .map((r) => mapBalanceRow(r, symbol, "Q"));

    return [...annual, ...quarterly];
  } catch (error) {
    console.error(`[Yahoo] Failed to fetch balance sheets for ${symbol}:`, error);
    return [];
  }
}

/**
 * Helper to map raw cash flow data to our row format
 */
function mapCashflowRow(r: Record<string, unknown>, symbol: string, periodType: "FY" | "Q"): YahooStatementRow {
  const date = r.date as Date;
  const dateStr = date instanceof Date ? date.toISOString().slice(0, 10) : String(r.date).slice(0, 10);

  const operatingCashFlow = safeGet<number>(r, "operatingCashFlow", 0);
  const capex = safeGet<number>(r, "capitalExpenditure", 0);

  return {
    date: dateStr,
    symbol,
    period: periodType,
    calendarYear: dateStr.slice(0, 4),
    netIncome: safeGet(r, "netIncome", 0),
    depreciationAndAmortization: safeGet(r, "depreciationAndAmortization", 0),
    stockBasedCompensation: safeGet(r, "stockBasedCompensation", 0),
    changeInWorkingCapital: safeGet(r, "changeInWorkingCapital", 0),
    netCashProvidedByOperatingActivities: operatingCashFlow,
    investmentsInPropertyPlantAndEquipment: capex,
    netCashUsedForInvestingActivites: safeGet(r, "investingCashFlow", 0),
    dividendsPaid: safeGet(r, "cashDividendsPaid", 0),
    netCashUsedProvidedByFinancingActivities: safeGet(r, "financingCashFlow", 0),
    netChangeInCash: safeGet(r, "changesInCash", 0),
    freeCashFlow: safeGet(r, "freeCashFlow", 0) || (operatingCashFlow + capex),
  };
}

/**
 * Fetch cash flow statements using fundamentalsTimeSeries
 * Fetches both annual and quarterly data
 */
export async function fetchCashflows(
  symbol: string,
  limit = 8
): Promise<YahooStatementRow[]> {
  try {
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 10);
    const endDate = new Date().toISOString().split("T")[0];
    const startDateStr = startDate.toISOString().split("T")[0];

    const [annualData, quarterlyData] = await Promise.all([
      safeFetchFundamentals(symbol, {
        period1: startDateStr,
        period2: endDate,
        type: "annual",
        module: "all",
      }),
      safeFetchFundamentals(symbol, {
        period1: startDateStr,
        period2: endDate,
        type: "quarterly",
        module: "all",
      }),
    ]);

    const filterCashflow = (r: Record<string, unknown>) =>
      r.date && (r.operatingCashFlow || r.freeCashFlow || r.netIncome);

    const annual = annualData
      .filter(filterCashflow)
      .sort((a, b) => new Date(b.date as string).getTime() - new Date(a.date as string).getTime())
      .slice(0, limit)
      .map((r) => mapCashflowRow(r, symbol, "FY"));

    const quarterly = quarterlyData
      .filter(filterCashflow)
      .sort((a, b) => new Date(b.date as string).getTime() - new Date(a.date as string).getTime())
      .slice(0, limit * 4)
      .map((r) => mapCashflowRow(r, symbol, "Q"));

    return [...annual, ...quarterly];
  } catch (error) {
    console.error(`[Yahoo] Failed to fetch cash flows for ${symbol}:`, error);
    return [];
  }
}

/**
 * Fetch key ratios from Yahoo Finance
 */
export async function fetchRatios(
  symbol: string,
  _limit = 8
): Promise<YahooRatiosRow[]> {
  try {
    const resultRaw = await yahooFinance.quoteSummary(symbol, {
      modules: ["defaultKeyStatistics", "financialData", "summaryDetail"],
    });
    const result = resultRaw as Record<string, unknown>;

    const keyStats = result.defaultKeyStatistics as Record<string, unknown> | undefined;
    const financialData = result.financialData as Record<string, unknown> | undefined;
    const summaryDetail = result.summaryDetail as Record<string, unknown> | undefined;

    const currentDate = new Date().toISOString().slice(0, 10);

    return [
      {
        date: currentDate,
        symbol,
        period: "TTM",
        priceEarningsRatio: safeGet(keyStats, "trailingPE", 0) || safeGet(summaryDetail, "trailingPE", 0),
        forwardPE: safeGet(keyStats, "forwardPE", 0),
        priceToSalesRatio: safeGet(keyStats, "priceToSalesTrailing12Months", 0),
        priceToBookRatio: safeGet(keyStats, "priceToBook", 0),
        enterpriseValueToEbitda: safeGet(keyStats, "enterpriseToEbitda", 0),
        enterpriseValueToRevenue: safeGet(keyStats, "enterpriseToRevenue", 0),
        profitMargin: safeGet(financialData, "profitMargins", 0),
        operatingMargin: safeGet(financialData, "operatingMargins", 0),
        returnOnAssets: safeGet(financialData, "returnOnAssets", 0),
        returnOnEquity: safeGet(financialData, "returnOnEquity", 0),
        revenueGrowth: safeGet(financialData, "revenueGrowth", 0),
        earningsGrowth: safeGet(financialData, "earningsGrowth", 0),
        currentRatio: safeGet(financialData, "currentRatio", 0),
        debtToEquity: safeGet(financialData, "debtToEquity", 0),
        beta: safeGet(keyStats, "beta", 0),
        dividendYield: safeGet(summaryDetail, "dividendYield", 0),
        payoutRatio: safeGet(summaryDetail, "payoutRatio", 0),
      },
    ];
  } catch (error) {
    console.error(`[Yahoo] Failed to fetch ratios for ${symbol}:`, error);
    return [];
  }
}

/**
 * Fetch dividend history from Yahoo Finance
 */
export async function fetchDividends(
  symbol: string,
  limit = 20
): Promise<YahooDividend[]> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 5);

    const resultRaw = await yahooFinance.historical(symbol, {
      period1: startDate,
      period2: endDate,
      events: "dividends",
    });
    const result = resultRaw as unknown as Array<Record<string, unknown>>;

    return result.slice(0, limit).map((div) => ({
      date: new Date(div.date as string | Date).toISOString().slice(0, 10),
      label: new Date(div.date as string | Date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      adjDividend: safeGet(div, "adjDividend", 0) || safeGet(div, "dividends", 0),
      dividend: safeGet(div, "dividends", 0),
      recordDate: "",
      paymentDate: "",
      declarationDate: "",
    }));
  } catch (error) {
    console.error(`[Yahoo] Failed to fetch dividends for ${symbol}:`, error);
    return [];
  }
}

/**
 * Fetch earnings history from Yahoo Finance
 */
export async function fetchEarnings(
  symbol: string,
  limit = 8
): Promise<YahooEarning[]> {
  try {
    const resultRaw = await yahooFinance.quoteSummary(symbol, {
      modules: ["earnings", "earningsHistory"],
    });
    const result = resultRaw as Record<string, unknown>;

    const earningsHistoryData = result.earningsHistory as Record<string, unknown> | undefined;
    const earningsHistory = (earningsHistoryData?.history ?? []) as Array<Record<string, unknown>>;

    return earningsHistory.slice(0, limit).map((earning) => ({
      date: earning.quarter
        ? new Date(earning.quarter as string | Date).toISOString().slice(0, 10)
        : "",
      symbol,
      eps: safeGet(earning, "epsActual", 0),
      epsEstimated: safeGet(earning, "epsEstimate", 0),
      time: "",
      revenue: 0,
      revenueEstimated: 0,
    }));
  } catch (error) {
    console.error(`[Yahoo] Failed to fetch earnings for ${symbol}:`, error);
    return [];
  }
}

/**
 * Fetch revenue segmentation from Yahoo Finance
 * Yahoo provides this through the earnings module in quoteSummary
 */
export async function fetchRevenueSegmentation(
  symbol: string
): Promise<{
  byProduct: Array<{ date: string; segments: Record<string, number> }>;
  byGeo: Array<{ date: string; segments: Record<string, number> }>;
}> {
  try {
    // Try to get segment data from financialData and earnings modules
    const resultRaw = await yahooFinance.quoteSummary(symbol, {
      modules: ["earnings", "earningsTrend"],
    });
    const result = resultRaw as Record<string, unknown>;

    // Yahoo doesn't provide detailed segment breakdown through standard API
    // The segment data is typically only available through SEC filings
    // Return empty arrays - the UI will fall back to quarterly revenue display
    return {
      byProduct: [],
      byGeo: [],
    };
  } catch (error) {
    console.error(`[Yahoo] Failed to fetch revenue segmentation for ${symbol}:`, error);
    return {
      byProduct: [],
      byGeo: [],
    };
  }
}
