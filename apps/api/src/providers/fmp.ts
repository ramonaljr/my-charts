import { env } from "../config/env";

const BASE_URL = "https://financialmodelingprep.com/api/v3";

export interface FmpStatementRow {
  date: string;
  symbol: string;
  calendarYear?: string;
  period?: string;
  [key: string]: string | number | undefined;
}

export interface FmpRatiosRow {
  date: string;
  symbol: string;
  period?: string;
  [key: string]: string | number | undefined;
}

export interface FmpProfile {
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

export interface FmpQuote {
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

export interface FmpDividend {
  date: string;
  label: string;
  adjDividend: number;
  dividend: number;
  recordDate: string;
  paymentDate: string;
  declarationDate: string;
}

export interface FmpEarning {
  date: string;
  symbol: string;
  eps: number;
  epsEstimated: number;
  time: string;
  revenue: number;
  revenueEstimated: number;
}

export interface FmpRevenueGeo {
  [key: string]: number;
}

export interface FmpRevenueSegment {
  [key: string]: number;
}

async function fetchFmp<T>(path: string): Promise<T> {
  const allowMock = process.env.MOCK_FMP === "1";

  if (!env.fmpApiKey && !allowMock) {
    throw new Error(
      "[FMP] API key missing. Please set FMP_API_KEY in your environment variables.",
    );
  }

  const url = `${BASE_URL}${path}${path.includes("?") ? "&" : "?"}apikey=${env.fmpApiKey}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`FMP error ${res.status}: ${body || res.statusText}`);
    }
    return (await res.json()) as T;
  } catch (error) {
    if (allowMock) {
      // Optional local fallback for development/testing when explicitly enabled.
      // eslint-disable-next-line no-console
      console.warn(`[FMP] Falling back to mock data for ${path}: ${(error as Error).message}`);
      return getMockData(path) as T;
    }
    throw error;
  }
}

function getMockData(path: string): any {
  if (path.includes("/profile/")) {
    return [{
      symbol: "NVDA",
      price: 135.50,
      beta: 1.6,
      volAvg: 40000000,
      mktCap: 3300000000000,
      lastDiv: 0.16,
      range: "100-140",
      changes: 2.5,
      companyName: "NVIDIA Corporation",
      currency: "USD",
      exchangeShortName: "NASDAQ",
      industry: "Semiconductors",
      website: "https://www.nvidia.com",
      description: "NVIDIA Corporation focuses on personal computer (PC) graphics, graphics processing unit (GPU) and also on artificial intelligence (AI).",
      ceo: "Jensen Huang",
      sector: "Technology",
      country: "US",
      fullTimeEmployees: "29600",
      image: "https://financialmodelingprep.com/image-stock/NVDA.png",
      ipoDate: "1999-01-22",
    }];
  }
  if (path.includes("/quote/")) {
    return [{
      symbol: "NVDA",
      name: "NVIDIA Corporation",
      price: 135.50,
      changesPercentage: 1.85,
      change: 2.45,
      dayLow: 133.0,
      dayHigh: 136.0,
      yearHigh: 140.0,
      yearLow: 40.0,
      marketCap: 3300000000000,
      priceAvg50: 120.0,
      priceAvg200: 100.0,
      volume: 30000000,
      avgVolume: 40000000,
      open: 133.5,
      previousClose: 133.05,
      eps: 2.5,
      pe: 54.2,
      sharesOutstanding: 24000000000,
      timestamp: Date.now() / 1000,
    }];
  }
  if (path.includes("/ratios")) {
    return Array(5).fill(0).map((_, i) => ({
      date: `${2024 - i}-12-31`,
      symbol: "NVDA",
      period: "FY",
      priceEarningsRatio: 50 + i * 5,
      priceToSalesRatio: 20 + i * 2,
      netIncomePerShare: 2.5 - i * 0.2,
    }));
  }
  if (path.includes("/income-statement")) {
    return Array(5).fill(0).map((_, i) => ({
      date: `${2024 - i}-12-31`,
      symbol: "NVDA",
      period: "FY",
      revenue: 60000000000 + i * 10000000000,
      costOfRevenue: 20000000000 + i * 5000000000,
      grossProfit: 40000000000 + i * 5000000000,
      grossProfitRatio: 0.65,
      researchAndDevelopmentExpenses: 5000000000 + i * 1000000000,
      generalAndAdministrativeExpenses: 2000000000 + i * 500000000,
      sellingAndMarketingExpenses: 1000000000 + i * 200000000,
      sellingGeneralAndAdministrativeExpenses: 3000000000 + i * 700000000,
      otherExpenses: 500000000,
      operatingExpenses: 8500000000 + i * 1700000000,
      costAndExpenses: 28500000000 + i * 6700000000,
      interestIncome: 200000000,
      interestExpense: 100000000,
      depreciationAndAmortization: 1000000000 + i * 100000000,
      ebitda: 35000000000 + i * 4000000000,
      ebitdaratio: 0.55,
      operatingIncome: 31500000000 + i * 3300000000,
      operatingIncomeRatio: 0.52,
      totalOtherIncomeExpensesNet: 100000000,
      incomeBeforeTax: 31600000000 + i * 3300000000,
      incomeBeforeTaxRatio: 0.52,
      incomeTaxExpense: 1600000000 + i * 300000000,
      netIncome: 30000000000 + i * 3000000000,
      netIncomeRatio: 0.5,
      eps: 2.5 + i * 0.5,
      epsdiluted: 2.4 + i * 0.5,
      weightedAverageShsOut: 24000000000,
      weightedAverageShsOutDil: 24500000000,
    }));
  }
  if (path.includes("/balance-sheet-statement")) {
    return Array(5).fill(0).map((_, i) => ({
      date: `${2024 - i}-12-31`,
      symbol: "NVDA",
      period: "FY",
      cashAndCashEquivalents: 20000000000 + i * 2000000000,
      shortTermInvestments: 5000000000 + i * 1000000000,
      cashAndShortTermInvestments: 25000000000 + i * 3000000000,
      netReceivables: 4000000000 + i * 500000000,
      inventory: 2000000000 + i * 200000000,
      otherCurrentAssets: 1000000000,
      totalCurrentAssets: 32000000000 + i * 3700000000,
      propertyPlantEquipmentNet: 5000000000 + i * 500000000,
      goodwill: 3000000000,
      intangibleAssets: 2000000000,
      goodwillAndIntangibleAssets: 5000000000,
      longTermInvestments: 1000000000,
      taxAssets: 500000000,
      otherNonCurrentAssets: 500000000,
      totalNonCurrentAssets: 12000000000 + i * 500000000,
      otherAssets: 0,
      totalAssets: 44000000000 + i * 4200000000,
      accountPayables: 2000000000 + i * 200000000,
      shortTermDebt: 1000000000,
      taxPayables: 500000000,
      deferredRevenue: 1000000000,
      otherCurrentLiabilities: 500000000,
      totalCurrentLiabilities: 5000000000 + i * 200000000,
      longTermDebt: 8000000000 + i * 500000000,
      deferredRevenueNonCurrent: 500000000,
      deferredTaxLiabilitiesNonCurrent: 500000000,
      otherNonCurrentLiabilities: 500000000,
      totalNonCurrentLiabilities: 9500000000 + i * 500000000,
      otherLiabilities: 0,
      capitalLeaseObligations: 0,
      totalLiabilities: 14500000000 + i * 700000000,
      preferredStock: 0,
      commonStock: 25000000,
      retainedEarnings: 29000000000 + i * 3500000000,
      accumulatedOtherComprehensiveIncomeLoss: -50000000,
      othertotalStockholdersEquity: 0,
      totalStockholdersEquity: 29500000000 + i * 3500000000,
      totalEquity: 29500000000 + i * 3500000000,
      totalLiabilitiesAndStockholdersEquity: 44000000000 + i * 4200000000,
      minorityInterest: 0,
      totalLiabilitiesAndTotalEquity: 44000000000 + i * 4200000000,
      totalInvestments: 6000000000 + i * 1000000000,
      totalDebt: 9000000000 + i * 500000000,
      netDebt: -11000000000 - i * 1500000000,
    }));
  }
  if (path.includes("/cash-flow-statement")) {
    return Array(5).fill(0).map((_, i) => ({
      date: `${2024 - i}-12-31`,
      symbol: "NVDA",
      period: "FY",
      netIncome: 30000000000 + i * 3000000000,
      depreciationAndAmortization: 1000000000 + i * 100000000,
      deferredIncomeTax: 100000000,
      stockBasedCompensation: 2000000000 + i * 200000000,
      changeInWorkingCapital: 500000000,
      accountsReceivables: -200000000,
      inventory: -100000000,
      accountsPayables: 100000000,
      otherWorkingCapital: 0,
      otherNonCashItems: 0,
      netCashProvidedByOperatingActivities: 33600000000 + i * 3300000000,
      investmentsInPropertyPlantAndEquipment: -1000000000 - i * 100000000,
      acquisitionsNet: 0,
      purchasesOfInvestments: -5000000000,
      salesMaturitiesOfInvestments: 2000000000,
      otherInvestingActivites: 0,
      netCashUsedForInvestingActivites: -4000000000 - i * 100000000,
      debtRepayment: -500000000,
      commonStockIssued: 100000000,
      commonStockRepurchased: -5000000000 - i * 1000000000,
      dividendsPaid: -400000000 - i * 50000000,
      otherFinancingActivites: 0,
      netCashUsedProvidedByFinancingActivities: -5800000000 - i * 1050000000,
      effectOfForexChangesOnCash: 0,
      netChangeInCash: 23800000000 + i * 2150000000,
      cashAtEndOfPeriod: 43800000000 + i * 2150000000,
      cashAtBeginningOfPeriod: 20000000000 + i * 2000000000,
      operatingCashFlow: 33600000000 + i * 3300000000,
      capitalExpenditure: -1000000000 - i * 100000000,
      freeCashFlow: 32600000000 + i * 3200000000,
    }));
  }
  if (path.includes("stock_dividend")) {
    return { historical: [] };
  }
  if (path.includes("earnings-surprises")) {
    return [];
  }
  if (path.includes("revenue-product-segmentation")) {
    return [{
      "Compute & Networking": 40000000000,
      "Graphics": 15000000000,
      "date": "2024-01-01",
    }];
  }
  if (path.includes("revenue-geographic-segmentation")) {
    return [{
      "United States": 25000000000,
      "Taiwan": 10000000000,
      "China": 10000000000,
      "date": "2024-01-01",
    }];
  }
  return [];
}

export function buildStatementPath(
  endpoint: string,
  symbol: string,
  limit = 8,
  period: "quarter" | "annual" = "quarter",
): string {
  return `${endpoint}/${symbol}?period=${period}&limit=${limit}`;
}

export async function fetchIncomeStatements(symbol: string, limit = 8) {
  return fetchFmp<FmpStatementRow[]>(
    buildStatementPath("/income-statement", symbol, limit),
  );
}

export async function fetchBalanceSheets(symbol: string, limit = 8) {
  return fetchFmp<FmpStatementRow[]>(
    buildStatementPath("/balance-sheet-statement", symbol, limit),
  );
}

export async function fetchCashflows(symbol: string, limit = 8) {
  return fetchFmp<FmpStatementRow[]>(
    buildStatementPath("/cash-flow-statement", symbol, limit),
  );
}

export async function fetchRatios(symbol: string, limit = 8) {
  return fetchFmp<FmpRatiosRow[]>(buildStatementPath("/ratios", symbol, limit));
}

export async function fetchProfile(symbol: string) {
  const data = await fetchFmp<FmpProfile[]>(`/profile/${symbol}`);
  return data[0];
}

export async function fetchQuote(symbol: string) {
  const data = await fetchFmp<FmpQuote[]>(`/quote/${symbol}`);
  return data[0];
}

export async function fetchDividends(symbol: string) {
  const data = await fetchFmp<{ historical: FmpDividend[] }>(
    `/historical-price-full/stock_dividend/${symbol}`,
  );
  return data.historical?.slice(0, 20) || [];
}

export async function fetchEarnings(symbol: string, limit = 8) {
  // FMP doesn't have a simple "historical earnings" endpoint that matches the view perfectly without paid plans sometimes,
  // but /historical/earning_calendar is one option, or /earnings-surprises.
  // Let's use /earnings-surprises for reported vs estimated.
  return fetchFmp<FmpEarning[]>(`/earnings-surprises/${symbol}?limit=${limit}`);
}

export async function fetchRevenueProductSegmentation(symbol: string) {
  // This endpoint returns a map of date -> segment -> value
  // The structure is actually an array of objects.
  // https://financialmodelingprep.com/api/v4/revenue-product-segmentation?symbol=AAPL
  return fetchFmp<Record<string, number>[]>(
    `/v4/revenue-product-segmentation?symbol=${symbol}`,
  );
}

export async function fetchRevenueGeographicSegmentation(symbol: string) {
  return fetchFmp<Record<string, number>[]>(
    `/v4/revenue-geographic-segmentation?symbol=${symbol}`,
  );
}
