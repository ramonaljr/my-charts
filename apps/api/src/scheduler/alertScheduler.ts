import {
  AlertRule,
  IndicatorConfig,
  indicatorKey,
  Timeframe,
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
} from "@nova/core";
import cron from "node-cron";
import { fetchActiveRules, evaluateRulesForCandle } from "../services/alertsService";
import { getCandles } from "../services/marketDataService";
import { sendAlertEmail } from "../services/emailService";

const cronByTimeframe: Record<Timeframe, string> = {
  "1m": "*/1 * * * *",
  "5m": "*/5 * * * *",
  "15m": "*/15 * * * *",
  "1h": "0 * * * *",
  "4h": "0 */4 * * *",
  "1d": "0 0 * * *",
};

function collectIndicatorConfigs(rules: AlertRule[]): IndicatorConfig[] {
  const configs: IndicatorConfig[] = [];
  const pushConfig = (operand: unknown) => {
    const op = operand as { type?: string; indicator?: IndicatorConfig };
    if (op?.type === "indicator" && op.indicator) {
      configs.push(op.indicator);
    }
  };

  rules.forEach((rule) => {
    pushConfig(rule.leftOperand);
    pushConfig(rule.rightOperand);
  });

  const seen = new Set<string>();
  return configs.filter((config) => {
    const key = indicatorKey(config);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildIndicatorSeries(
  candles: Parameters<typeof calculateSMA>[0],
  configs: IndicatorConfig[],
) {
  const map: Record<string, ReturnType<typeof calculateSMA>> = {};
  configs.forEach((config) => {
    switch (config.type) {
      case "sma":
        map[indicatorKey(config)] = calculateSMA(candles, config);
        break;
      case "ema":
        map[indicatorKey(config)] = calculateEMA(candles, config);
        break;
      case "rsi":
        map[indicatorKey(config)] = calculateRSI(candles, config);
        break;
      case "macd":
        map[indicatorKey(config)] = calculateMACD(candles, config);
        break;
      case "bbands":
        map[indicatorKey(config)] = calculateBollingerBands(candles, config);
        break;
      default:
        break;
    }
  });
  return map;
}

async function evaluateTimeframe(timeframe: Timeframe) {
  const rules = await fetchActiveRules(timeframe);
  if (rules.length === 0) return;

  const rulesBySymbol = new Map<number, AlertRule[]>();
  rules.forEach((rule) => {
    const symbolId = Number(rule.symbolId);
    const list = rulesBySymbol.get(symbolId) ?? [];
    list.push(rule);
    rulesBySymbol.set(symbolId, list);
  });

  for (const [symbolId, symbolRules] of rulesBySymbol.entries()) {
    const candles = await getCandles(symbolId, timeframe, 500);
    if (candles.length < 2) continue;

    const latest = candles[candles.length - 1];
    const previous = candles[candles.length - 2];
    const configs = collectIndicatorConfigs(symbolRules);
    const indicators = buildIndicatorSeries(candles, configs);
    const previousIndicators = buildIndicatorSeries(
      candles.slice(0, candles.length - 1),
      configs,
    );

    const events = await evaluateRulesForCandle({
      rules: symbolRules,
      candle: latest,
      previousCandle: previous,
      indicatorSeries: indicators,
      previousIndicatorSeries: previousIndicators,
    });

    await Promise.all(
      events.map(async (event) => {
        const rule = symbolRules.find((r) => r.id === event.ruleId);
        if (rule) {
          await sendAlertEmail(event, rule);
        }
      }),
    );
  }
}

export function startAlertScheduler() {
  (Object.keys(cronByTimeframe) as Timeframe[]).forEach((timeframe) => {
    const schedule = cronByTimeframe[timeframe];
    cron.schedule(schedule, () => {
      evaluateTimeframe(timeframe).catch((error) => {
        // eslint-disable-next-line no-console
        console.error(`[alerts] Failed to evaluate ${timeframe}:`, error);
      });
    });
  });
  // eslint-disable-next-line no-console
  console.log("[alerts] Alert scheduler started for all timeframes");
}
