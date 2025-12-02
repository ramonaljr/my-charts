import type { Timeframe as CoreTimeframe } from "@nova/core";

// API base can be overridden with NEXT_PUBLIC_API_BASE; defaults to same-origin
// (with Next.js rewrites pointing to the backend).
const API_BASE =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE) || "";

export type Timeframe = CoreTimeframe;

export interface Symbol {
  id: number;
  displayName: string;
  assetClass: "FX" | "CRYPTO" | "STOCK";
  finnhubSymbol: string;
  fmpSymbol: string | null;
}

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface AlertOperand {
  type: "price" | "indicator" | "number";
  source?: "open" | "high" | "low" | "close";
  indicator?: {
    type: "sma" | "ema" | "rsi" | "macd" | "bbands";
    length?: number;
    source?: "open" | "high" | "low" | "close";
  };
  value?: number;
}

export interface AlertRule {
  id: string;
  symbolId: number;
  timeframe: Timeframe;
  conditionType: "GT" | "LT" | "CROSS_ABOVE" | "CROSS_BELOW";
  leftOperand: AlertOperand;
  rightOperand: AlertOperand;
  active: boolean;
  description?: string;
}

export interface AlertEvent {
  id: string;
  ruleId: string;
  symbolId: number;
  timeframe: string;
  triggeredAt: string;
  conditionType: string;
  leftValue: number;
  rightValue: number;
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

export interface FmpRatiosRow {
  fiscalDate: string;
  period: string;
  data: {
    priceEarningsRatio?: number | string;
    priceToSalesRatio?: number | string;
    netIncomePerShare?: number | string;
    [key: string]: unknown;
  };
}

export interface FundamentalsData {
  symbolId: number;
  lastRefreshedAt?: string;
  symbol: Symbol;
  income: Array<{ fiscalDate: string; period: string; data: Record<string, unknown> }>;
  balance: Array<{ fiscalDate: string; period: string; data: Record<string, unknown> }>;
  cashflow: Array<{ fiscalDate: string; period: string; data: Record<string, unknown> }>;
  ratios: FmpRatiosRow[];
  profile?: FmpProfile;
  quote?: FmpQuote;
  dividends?: FmpDividend[];
  earnings?: FmpEarning[];
  revenueProduct?: Record<string, number>[];
  revenueGeo?: Record<string, number>[];
}

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      cache: "no-store",
    });
  } catch (error) {
    const message = (error as Error)?.message || "Unknown network error";
    throw new Error(
      `Failed to reach API at ${url}. Is the backend running? ${message}`,
    );
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || `API Error: ${res.status}`);
  }

  return res.json();
}

// Symbols API
export async function fetchSymbols(): Promise<Symbol[]> {
  return fetchAPI<Symbol[]>("/api/symbols");
}

// Candles API
export async function fetchCandles(
  symbolId: number,
  timeframe: Timeframe,
  limit = 500,
): Promise<Candle[]> {
  const params = new URLSearchParams({
    symbol: symbolId.toString(),
    timeframe,
    limit: limit.toString(),
  });
  const result = await fetchAPI<{ candles: Candle[] }>(`/api/candles?${params}`);
  return result.candles;
}

// Alerts API
export async function fetchAlerts(): Promise<AlertRule[]> {
  return fetchAPI<AlertRule[]>("/api/alerts");
}

export async function createAlert(
  input: Omit<AlertRule, "id">,
): Promise<AlertRule> {
  return fetchAPI<AlertRule>("/api/alerts", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateAlert(
  id: string,
  input: Partial<Omit<AlertRule, "id">>,
): Promise<AlertRule> {
  return fetchAPI<AlertRule>(`/api/alerts/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteAlert(id: string): Promise<void> {
  await fetchAPI<void>(`/api/alerts/${id}`, { method: "DELETE" });
}

export async function fetchAlertEvents(
  limit?: number,
  symbolId?: number,
): Promise<AlertEvent[]> {
  const params = new URLSearchParams();
  if (limit) params.set("limit", limit.toString());
  if (symbolId) params.set("symbolId", symbolId.toString());
  const query = params.toString();
  return fetchAPI<AlertEvent[]>(`/api/alert-events${query ? `?${query}` : ""}`);
}

// Fundamentals API
export async function fetchFundamentals(symbolId: number): Promise<FundamentalsData> {
  return fetchAPI<FundamentalsData>(`/api/fundamentals/${symbolId}`);
}

export async function refreshFundamentals(symbolId: number): Promise<FundamentalsData> {
  return fetchAPI<FundamentalsData>(`/api/fundamentals/${symbolId}/refresh`, {
    method: "POST",
  });
}

// Settings API
export async function sendTestEmail(to?: string): Promise<{ status: string }> {
  return fetchAPI<{ status: string }>("/api/settings/test-email", {
    method: "POST",
    body: JSON.stringify({ to }),
  });
}

// Real-time Quote API (prioritized FMP data)
export async function fetchRealtimeQuote(symbolId: number): Promise<FmpQuote> {
  return fetchAPI<FmpQuote>(`/api/quote/${symbolId}`);
}
