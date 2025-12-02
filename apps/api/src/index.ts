import cors from "cors";
import express from "express";
import { z } from "zod";
import { Timeframe } from "@nova/core";
import { warnMissingEnv, env } from "./config/env";
import { ensureSymbolsSeeded, listSymbols } from "./services/symbolService";
import { getCandles } from "./services/marketDataService";
import { getFundamentals } from "./services/fundamentalsService";
import {
  AlertInput,
  createAlert,
  deleteAlert,
  listAlertEvents,
  listAlerts,
  updateAlert,
} from "./services/alertsService";
import { startAlertScheduler } from "./scheduler/alertScheduler";
import { sendTestEmail } from "./services/emailService";
import {
  fetchTwelveDataIndicator,
  IndicatorType,
} from "./providers/twelveDataIndicators";

const app = express();
app.use(cors());
app.use(express.json());

const timeframeSchema: z.ZodType<Timeframe> = z.enum([
  "1m",
  "5m",
  "15m",
  "1h",
  "4h",
  "1d",
]);

const alertSchema = z.object({
  symbolId: z.coerce.number(),
  timeframe: timeframeSchema,
  conditionType: z.enum(["GT", "LT", "CROSS_ABOVE", "CROSS_BELOW"]),
  leftOperand: z.any(),
  rightOperand: z.any(),
  active: z.boolean().optional(),
  description: z.string().optional(),
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", version: "0.1.0" });
});

app.get("/api/symbols", async (_req, res) => {
  try {
    await ensureSymbolsSeeded();
    const symbols = await listSymbols();
    res.json(symbols);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    res.status(500).json({ error: "Failed to load symbols" });
  }
});

app.get("/api/candles", async (req, res) => {
  const querySchema = z.object({
    symbol: z.string(),
    timeframe: timeframeSchema,
    limit: z.coerce.number().min(10).max(2000).optional().default(500),
  });

  const parseResult = querySchema.safeParse(req.query);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const { symbol, timeframe, limit } = parseResult.data;
  const symbolId = Number(symbol);

  try {
    const candles = await getCandles(symbolId, timeframe, limit);
    return res.json({ candles });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch candles" });
  }
});

app.get("/api/fundamentals/:symbolId", async (req, res) => {
  const symbolId = Number(req.params.symbolId);
  try {
    const data = await getFundamentals(symbolId);
    res.json(data);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    res
      .status(500)
      .json({ error: (error as Error).message || "Failed to fetch fundamentals" });
  }
});

// Real-time quote from FMP
app.get("/api/quote/:symbolId", async (req, res) => {
  const symbolId = Number(req.params.symbolId);
  try {
    const { getRealtimeQuote } = await import("./services/fundamentalsService");
    const quote = await getRealtimeQuote(symbolId);
    res.json(quote);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    res
      .status(500)
      .json({ error: (error as Error).message || "Failed to fetch quote" });
  }
});

app.post("/api/fundamentals/:symbolId/refresh", async (req, res) => {
  const symbolId = Number(req.params.symbolId);
  try {
    const data = await getFundamentals(symbolId, true);
    res.json(data);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    res
      .status(500)
      .json({ error: (error as Error).message || "Failed to refresh fundamentals" });
  }
});

app.get("/api/alerts", async (_req, res) => {
  try {
    const alerts = await listAlerts();
    res.json(alerts);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    res.status(500).json({ error: "Failed to load alerts" });
  }
});

app.post("/api/alerts", async (req, res) => {
  const parsed = alertSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  try {
    const payload = parsed.data as AlertInput;
    const alert = await createAlert(payload);
    return res.status(201).json(alert);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: "Failed to create alert" });
  }
});

app.put("/api/alerts/:id", async (req, res) => {
  const parsed = alertSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  try {
    const payload = parsed.data as Partial<AlertInput>;
    const alert = await updateAlert(req.params.id, payload);
    return res.json(alert);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: "Failed to update alert" });
  }
});

app.delete("/api/alerts/:id", async (req, res) => {
  try {
    await deleteAlert(req.params.id);
    res.status(204).end();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    res.status(500).json({ error: "Failed to delete alert" });
  }
});

app.get("/api/alert-events", async (req, res) => {
  const schema = z.object({
    symbolId: z.coerce.number().optional(),
    limit: z.coerce.number().optional(),
  });
  const parsed = schema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const events = await listAlertEvents(parsed.data.limit, parsed.data.symbolId);
    res.json(events);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    res.status(500).json({ error: "Failed to load alert events" });
  }
});

app.post("/api/settings/test-email", async (req, res) => {
  const schema = z.object({ to: z.string().email().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  try {
    await sendTestEmail(parsed.data.to);
    res.json({ status: "ok" });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    res.status(500).json({ error: "Failed to send test email" });
  }
});

// Indicators API - fetch from Twelve Data
const indicatorTypeSchema: z.ZodType<IndicatorType> = z.enum([
  "sma",
  "ema",
  "rsi",
  "macd",
  "bbands",
]);

app.get("/api/indicators", async (req, res) => {
  const schema = z.object({
    symbol: z.string(),
    timeframe: timeframeSchema,
    indicator: indicatorTypeSchema,
    period: z.coerce.number().min(1).max(200).optional(),
    outputSize: z.coerce.number().min(10).max(5000).optional(),
  });

  const parsed = schema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { symbol, timeframe, indicator, period, outputSize } = parsed.data;
  const symbolId = Number(symbol);

  try {
    // Get the symbol to find its finnhubSymbol
    const symbolRecord = await import("./services/symbolService").then((m) =>
      m.getSymbolById(symbolId)
    );
    if (!symbolRecord) {
      return res.status(404).json({ error: `Symbol ${symbolId} not found` });
    }

    const result = await fetchTwelveDataIndicator({
      symbol: symbolRecord.finnhubSymbol,
      timeframe,
      indicator,
      period,
      outputSize,
    });

    return res.json(result);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch indicator" });
  }
});

async function start() {
  warnMissingEnv();
  await ensureSymbolsSeeded();
  startAlertScheduler();

  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[api] listening on http://localhost:${env.port}`);
  });
}

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start API", error);
  process.exit(1);
});
