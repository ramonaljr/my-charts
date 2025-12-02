import { AssetClass } from "@prisma/client";
import { Candle, Timeframe } from "@nova/core";
import { env } from "../config/env";

type FinnhubResolution = "1" | "5" | "15" | "60" | "240" | "D";

const BASE_URL = "https://finnhub.io/api/v1";

function timeframeToResolution(tf: Timeframe): FinnhubResolution {
  switch (tf) {
    case "1m":
      return "1";
    case "5m":
      return "5";
    case "15m":
      return "15";
    case "1h":
      return "60";
    case "4h":
      return "240";
    case "1d":
    default:
      return "D";
  }
}

function getEndpoint(assetClass: AssetClass): string {
  switch (assetClass) {
    case "FX":
      return "forex/candle";
    case "CRYPTO":
      return "crypto/candle";
    case "STOCK":
    default:
      return "stock/candle";
  }
}

interface FinnhubCandleResponse {
  s: "ok" | "no_data" | string;
  t: number[];
  c: number[];
  o: number[];
  h: number[];
  l: number[];
  v: number[];
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function requestWithRetry(url: string, retries = 2): Promise<Response> {
  let attempt = 0;
  while (attempt <= retries) {
    const res = await fetch(url);
    if (res.status !== 429 && res.ok) return res;
    attempt += 1;
    if (attempt > retries) return res;
    const delay = 500 * attempt;
    // eslint-disable-next-line no-await-in-loop
    await sleep(delay);
  }
  throw new Error("Unexpected fetch retry handling");
}

export async function fetchFinnhubCandles(params: {
  symbol: string;
  assetClass: AssetClass;
  timeframe: Timeframe;
  from: number;
  to: number;
}): Promise<Candle[]> {
  if (!env.finnhubApiKey) {
    throw new Error("FINNHUB_API_KEY missing. Cannot fetch candles.");
  }

  const resolution = timeframeToResolution(params.timeframe);
  const endpoint = getEndpoint(params.assetClass);

  const url = new URL(`${BASE_URL}/${endpoint}`);
  url.searchParams.set("symbol", params.symbol);
  url.searchParams.set("resolution", resolution);
  url.searchParams.set("from", Math.floor(params.from / 1000).toString());
  url.searchParams.set("to", Math.floor(params.to / 1000).toString());
  url.searchParams.set("token", env.finnhubApiKey);

  const response = await requestWithRetry(url.toString());
  if (!response.ok) {
    throw new Error(`Finnhub error ${response.status}: ${await response.text()}`);
  }

  const data = (await response.json()) as FinnhubCandleResponse;
  if (data.s !== "ok" || !data.t) {
    return [];
  }

  const candles: Candle[] = data.t.map((timestamp, index) => ({
    timestamp: timestamp * 1000,
    open: data.o[index],
    high: data.h[index],
    low: data.l[index],
    close: data.c[index],
    volume: data.v[index],
  }));

  return candles.sort((a, b) => a.timestamp - b.timestamp);
}
