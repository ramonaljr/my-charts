import { env } from "../config/env";

const BASE_URL = "https://api.twelvedata.com";

export type IndicatorType = "sma" | "ema" | "rsi" | "macd" | "bbands";

interface IndicatorPoint {
  timestamp: number;
  value: number;
}

interface MACDPoint {
  timestamp: number;
  macd: number;
  signal: number;
  histogram: number;
}

interface BBANDSPoint {
  timestamp: number;
  upper: number;
  middle: number;
  lower: number;
}

export interface IndicatorResult {
  type: IndicatorType;
  symbol: string;
  interval: string;
  period?: number;
  points: IndicatorPoint[] | MACDPoint[] | BBANDSPoint[];
}

// Map our timeframes to Twelve Data intervals
function timeframeToInterval(tf: string): string {
  const map: Record<string, string> = {
    "1m": "1min",
    "5m": "5min",
    "15m": "15min",
    "1h": "1h",
    "4h": "4h",
    "1d": "1day",
  };
  return map[tf] || "1h";
}

// Convert OANDA symbol format to Twelve Data format
function parseSymbol(symbol: string): string {
  const match = symbol.match(/^OANDA:([A-Z]{3})_([A-Z]{3})$/);
  if (match) {
    return `${match[1]}/${match[2]}`;
  }
  // For stocks/crypto, return as-is or strip exchange prefix
  return symbol.replace(/^[A-Z]+:/, "");
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function requestWithRetry(url: string, retries = 2): Promise<Response> {
  let attempt = 0;
  while (attempt <= retries) {
    const res = await fetch(url);
    if (res.ok) return res;
    if (res.status === 429) {
      attempt += 1;
      if (attempt > retries) return res;
      await sleep(1000 * attempt);
      continue;
    }
    return res;
  }
  throw new Error("Unexpected fetch retry handling");
}

interface TwelveDataIndicatorResponse {
  meta?: {
    symbol: string;
    interval: string;
    indicator: {
      name: string;
      time_period?: number;
    };
  };
  values?: Array<{
    datetime: string;
    [key: string]: string;
  }>;
  status: string;
  code?: number;
  message?: string;
}

export async function fetchTwelveDataIndicator(params: {
  symbol: string;
  timeframe: string;
  indicator: IndicatorType;
  period?: number;
  outputSize?: number;
}): Promise<IndicatorResult> {
  const apiKey = env.twelveDataApiKey || "demo";
  const twelveSymbol = parseSymbol(params.symbol);
  const interval = timeframeToInterval(params.timeframe);
  const outputSize = params.outputSize || 500;
  const period = params.period || 14;

  let endpoint: string;
  const urlParams = new URLSearchParams({
    symbol: twelveSymbol,
    interval,
    outputsize: outputSize.toString(),
    apikey: apiKey,
  });

  switch (params.indicator) {
    case "sma":
      endpoint = "sma";
      urlParams.set("time_period", period.toString());
      break;
    case "ema":
      endpoint = "ema";
      urlParams.set("time_period", period.toString());
      break;
    case "rsi":
      endpoint = "rsi";
      urlParams.set("time_period", period.toString());
      break;
    case "macd":
      endpoint = "macd";
      // MACD uses default periods: 12, 26, 9
      break;
    case "bbands":
      endpoint = "bbands";
      urlParams.set("time_period", (params.period || 20).toString());
      break;
    default:
      throw new Error(`Unknown indicator: ${params.indicator}`);
  }

  const url = `${BASE_URL}/${endpoint}?${urlParams}`;
  console.log(`[Twelve Data] Fetching ${params.indicator} for ${params.symbol} ${params.timeframe}`);

  const response = await requestWithRetry(url);
  if (!response.ok) {
    throw new Error(`Twelve Data error ${response.status}: ${await response.text()}`);
  }

  const data = (await response.json()) as TwelveDataIndicatorResponse;

  if (data.status !== "ok" || data.code) {
    throw new Error(`Twelve Data error: ${data.message || "Unknown error"}`);
  }

  if (!data.values || data.values.length === 0) {
    return {
      type: params.indicator,
      symbol: params.symbol,
      interval: params.timeframe,
      period,
      points: [],
    };
  }

  let points: IndicatorPoint[] | MACDPoint[] | BBANDSPoint[];

  switch (params.indicator) {
    case "sma":
    case "ema":
    case "rsi":
      points = data.values.map((v) => ({
        timestamp: new Date(v.datetime + " UTC").getTime(),
        value: parseFloat(v[params.indicator]),
      }));
      break;
    case "macd":
      points = data.values.map((v) => ({
        timestamp: new Date(v.datetime + " UTC").getTime(),
        macd: parseFloat(v.macd),
        signal: parseFloat(v.macd_signal),
        histogram: parseFloat(v.macd_hist),
      }));
      break;
    case "bbands":
      points = data.values.map((v) => ({
        timestamp: new Date(v.datetime + " UTC").getTime(),
        upper: parseFloat(v.upper_band),
        middle: parseFloat(v.middle_band),
        lower: parseFloat(v.lower_band),
      }));
      break;
    default:
      points = [];
  }

  // Sort oldest first
  points.sort((a, b) => a.timestamp - b.timestamp);

  return {
    type: params.indicator,
    symbol: params.symbol,
    interval: params.timeframe,
    period,
    points,
  };
}
