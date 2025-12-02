import { Candle, Timeframe } from "@nova/core";
import { env } from "../config/env";

const BASE_URL = "https://api.twelvedata.com";

// Map our timeframes to Twelve Data intervals
function timeframeToInterval(tf: Timeframe): string {
  switch (tf) {
    case "1m":
      return "1min";
    case "5m":
      return "5min";
    case "15m":
      return "15min";
    case "1h":
      return "1h";
    case "4h":
      return "4h";
    case "1d":
      return "1day";
    default:
      return "1h";
  }
}

// Convert OANDA symbol format to Twelve Data format
// OANDA:EUR_USD -> EUR/USD
function parseForexSymbol(symbol: string): string | null {
  const match = symbol.match(/^OANDA:([A-Z]{3})_([A-Z]{3})$/);
  if (match) {
    return `${match[1]}/${match[2]}`;
  }
  return null;
}

interface TwelveDataValue {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
}

interface TwelveDataResponse {
  meta?: {
    symbol: string;
    interval: string;
    currency_base: string;
    currency_quote: string;
    type: string;
  };
  values?: TwelveDataValue[];
  status: string;
  code?: number;
  message?: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function requestWithRetry(url: string, retries = 2): Promise<Response> {
  let attempt = 0;
  while (attempt <= retries) {
    const res = await fetch(url);
    if (res.ok) return res;
    // Rate limit - wait and retry
    if (res.status === 429) {
      attempt += 1;
      if (attempt > retries) return res;
      const delay = 1000 * attempt;
      await sleep(delay);
      continue;
    }
    return res;
  }
  throw new Error("Unexpected fetch retry handling");
}

export async function fetchTwelveDataForexCandles(params: {
  symbol: string;
  timeframe: Timeframe;
  from: number;
  to: number;
}): Promise<Candle[]> {
  const apiKey = env.twelveDataApiKey || "demo";
  console.log(`[Twelve Data] Fetching candles for ${params.symbol} ${params.timeframe}`);

  const twelveSymbol = parseForexSymbol(params.symbol);
  if (!twelveSymbol) {
    throw new Error(`Invalid forex symbol format: ${params.symbol}`);
  }

  const interval = timeframeToInterval(params.timeframe);

  // Calculate outputsize based on time range and interval
  const intervalMs = {
    "1min": 60 * 1000,
    "5min": 5 * 60 * 1000,
    "15min": 15 * 60 * 1000,
    "1h": 60 * 60 * 1000,
    "4h": 4 * 60 * 60 * 1000,
    "1day": 24 * 60 * 60 * 1000,
  }[interval] || 60 * 60 * 1000;

  const timeRange = params.to - params.from;
  const outputSize = Math.min(5000, Math.ceil(timeRange / intervalMs) + 10);

  const url = new URL(`${BASE_URL}/time_series`);
  url.searchParams.set("symbol", twelveSymbol);
  url.searchParams.set("interval", interval);
  url.searchParams.set("outputsize", outputSize.toString());
  url.searchParams.set("apikey", apiKey);

  const response = await requestWithRetry(url.toString());
  if (!response.ok) {
    throw new Error(`Twelve Data error ${response.status}: ${await response.text()}`);
  }

  const data = (await response.json()) as TwelveDataResponse;

  // Check for API errors
  if (data.status !== "ok" || data.code) {
    throw new Error(`Twelve Data error: ${data.message || "Unknown error"}`);
  }

  if (!data.values || data.values.length === 0) {
    console.warn("[Twelve Data] No data returned");
    return [];
  }

  const candles: Candle[] = [];
  const fromDate = new Date(params.from);
  const toDate = new Date(params.to);

  for (const value of data.values) {
    // Parse datetime - Twelve Data returns "YYYY-MM-DD HH:mm:ss" format
    const timestamp = new Date(value.datetime + " UTC").getTime();

    // Filter by date range
    if (timestamp < fromDate.getTime() || timestamp > toDate.getTime()) {
      continue;
    }

    candles.push({
      timestamp,
      open: parseFloat(value.open),
      high: parseFloat(value.high),
      low: parseFloat(value.low),
      close: parseFloat(value.close),
      volume: 0, // Forex doesn't have volume in Twelve Data
    });
  }

  // Twelve Data returns newest first, we need oldest first
  return candles.sort((a, b) => a.timestamp - b.timestamp);
}
