import { Candle, Timeframe } from "@nova/core";
import { env } from "../config/env";

const BASE_URL = "https://www.alphavantage.co/query";

// Convert OANDA symbol format to Alpha Vantage format
// OANDA:EUR_USD -> from_symbol=EUR, to_symbol=USD
function parseForexSymbol(symbol: string): { from: string; to: string } | null {
  // Handle OANDA:XXX_YYY format
  const match = symbol.match(/^OANDA:([A-Z]{3})_([A-Z]{3})$/);
  if (match) {
    return { from: match[1], to: match[2] };
  }
  return null;
}

interface AVTimeSeriesEntry {
  "1. open": string;
  "2. high": string;
  "3. low": string;
  "4. close": string;
}

interface AVDailyResponse {
  "Meta Data"?: {
    "1. Information": string;
    "2. From Symbol": string;
    "3. To Symbol": string;
    "4. Output Size": string;
    "5. Last Refreshed": string;
  };
  [key: string]: unknown;
  Note?: string;
  "Error Message"?: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function requestWithRetry(url: string, retries = 2): Promise<Response> {
  let attempt = 0;
  while (attempt <= retries) {
    const res = await fetch(url);
    if (res.ok) return res;
    attempt += 1;
    if (attempt > retries) return res;
    const delay = 1000 * attempt; // Alpha Vantage rate limit is stricter
    await sleep(delay);
  }
  throw new Error("Unexpected fetch retry handling");
}

export async function fetchAlphaVantageForexCandles(params: {
  symbol: string;
  timeframe: Timeframe;
  from: number;
  to: number;
}): Promise<Candle[]> {
  console.log(`[Alpha Vantage] Fetching candles for ${params.symbol} ${params.timeframe}`);

  // Alpha Vantage free tier only supports FX_DAILY
  // FX_INTRADAY is a premium endpoint
  if (params.timeframe !== "1d") {
    throw new Error(
      `Alpha Vantage free tier only supports daily (1d) timeframe for forex. ` +
      `Requested: ${params.timeframe}. Intraday requires premium subscription.`
    );
  }

  if (!env.alphaVantageApiKey) {
    throw new Error("ALPHA_VANTAGE_API_KEY missing. Cannot fetch forex candles.");
  }

  const parsed = parseForexSymbol(params.symbol);
  if (!parsed) {
    throw new Error(`Invalid forex symbol format: ${params.symbol}`);
  }

  // Use FX_DAILY (free tier)
  const url = new URL(BASE_URL);
  url.searchParams.set("function", "FX_DAILY");
  url.searchParams.set("from_symbol", parsed.from);
  url.searchParams.set("to_symbol", parsed.to);
  url.searchParams.set("outputsize", "full");
  url.searchParams.set("apikey", env.alphaVantageApiKey);
  const timeSeriesKey = "Time Series FX (Daily)";

  const response = await requestWithRetry(url.toString());
  if (!response.ok) {
    throw new Error(`Alpha Vantage error ${response.status}: ${await response.text()}`);
  }

  const data = (await response.json()) as AVDailyResponse;

  // Check for API errors
  if (data.Note) {
    throw new Error(`Alpha Vantage rate limit: ${data.Note}`);
  }
  if (data["Error Message"]) {
    throw new Error(`Alpha Vantage error: ${data["Error Message"]}`);
  }

  const timeSeries = data[timeSeriesKey] as Record<string, AVTimeSeriesEntry> | undefined;
  if (!timeSeries) {
    console.warn("Alpha Vantage response:", JSON.stringify(data).slice(0, 500));
    return [];
  }

  const candles: Candle[] = [];
  const fromDate = new Date(params.from);
  const toDate = new Date(params.to);

  for (const [dateStr, values] of Object.entries(timeSeries)) {
    const timestamp = new Date(dateStr + " UTC").getTime();

    // Filter by date range
    if (timestamp < fromDate.getTime() || timestamp > toDate.getTime()) {
      continue;
    }

    candles.push({
      timestamp,
      open: parseFloat(values["1. open"]),
      high: parseFloat(values["2. high"]),
      low: parseFloat(values["3. low"]),
      close: parseFloat(values["4. close"]),
      volume: 0, // Alpha Vantage FX doesn't provide volume
    });
  }

  // Sort by timestamp ascending
  return candles.sort((a, b) => a.timestamp - b.timestamp);
}
