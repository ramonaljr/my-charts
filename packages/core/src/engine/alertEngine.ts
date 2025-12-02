import {
  AlertRule,
  AlertTriggerEvent,
  IndicatorSeriesMap,
  AlertConditionType,
  AlertOperand,
  Candle,
} from "../types";
import {
  findPointAtOrBefore,
  indicatorKey,
  pickPrice,
} from "../utils/indicators";

export interface RuleEvaluationContext {
  candle: Candle;
  previousCandle?: Candle;
  indicatorSeries?: IndicatorSeriesMap;
  previousIndicatorSeries?: IndicatorSeriesMap;
  timestamp?: number;
}

interface OperandResolution {
  current?: number;
  previous?: number;
}

function resolveOperand(
  operand: AlertOperand,
  context: RuleEvaluationContext,
  previous = false,
): OperandResolution {
  if (operand.type === "number") {
    return { current: operand.value, previous: operand.value };
  }

  if (operand.type === "price") {
    const candle = previous ? context.previousCandle : context.candle;
    if (!candle) return {};
    return { current: pickPrice(candle, operand.source) };
  }

  const key = indicatorKey(operand.indicator);
  const seriesMap = previous
    ? context.previousIndicatorSeries ?? context.indicatorSeries
    : context.indicatorSeries;
  const series = seriesMap?.[operand.seriesKey ?? key];
  if (!series) return {};

  const timestamp = previous
    ? context.previousCandle?.timestamp ?? context.candle.timestamp
    : context.timestamp ?? context.candle.timestamp;
  const point = findPointAtOrBefore(series, timestamp);
  if (!point) return {};

  return { current: point.value };
}

function evaluateCondition(
  type: AlertConditionType,
  left: number | undefined,
  right: number | undefined,
  previousLeft?: number,
  previousRight?: number,
): boolean {
  if (left === undefined || right === undefined) return false;

  switch (type) {
    case "GT":
      return left > right;
    case "LT":
      return left < right;
    case "CROSS_ABOVE":
      if (previousLeft === undefined || previousRight === undefined) return false;
      return previousLeft <= previousRight && left > right;
    case "CROSS_BELOW":
      if (previousLeft === undefined || previousRight === undefined) return false;
      return previousLeft >= previousRight && left < right;
    default:
      return false;
  }
}

function generateId(prefix: string): string {
  const maybeCrypto = (globalThis as unknown as { crypto?: { randomUUID?: () => string } })
    ?.crypto;
  if (maybeCrypto?.randomUUID) {
    return maybeCrypto.randomUUID();
  }
  return `${prefix}-${Math.random().toString(16).slice(2)}`;
}

export function evaluateAlertRule(
  rule: AlertRule,
  context: RuleEvaluationContext,
): { triggered: boolean; event?: AlertTriggerEvent; left?: number; right?: number } {
  if (!rule.active) return { triggered: false };

  const leftResolution = resolveOperand(rule.leftOperand, context, false);
  const rightResolution = resolveOperand(rule.rightOperand, context, false);
  const prevLeft = resolveOperand(rule.leftOperand, context, true).current;
  const prevRight = resolveOperand(rule.rightOperand, context, true).current;

  const triggered = evaluateCondition(
    rule.conditionType,
    leftResolution.current,
    rightResolution.current,
    prevLeft,
    prevRight,
  );

  if (!triggered) {
    return { triggered: false, left: leftResolution.current, right: rightResolution.current };
  }

  const event: AlertTriggerEvent = {
    id: generateId("alert-event"),
    ruleId: rule.id,
    symbolId: rule.symbolId,
    timeframe: rule.timeframe,
    triggeredAt: context.timestamp ?? context.candle.timestamp,
    conditionType: rule.conditionType,
    leftValue: leftResolution.current as number,
    rightValue: rightResolution.current as number,
    details: rule.description,
  };

  return {
    triggered: true,
    event,
    left: leftResolution.current,
    right: rightResolution.current,
  };
}

export function evaluateAlertRulesForCandle(
  rules: AlertRule[],
  context: RuleEvaluationContext,
): AlertTriggerEvent[] {
  const events: AlertTriggerEvent[] = [];
  for (const rule of rules) {
    const result = evaluateAlertRule(rule, context);
    if (result.triggered && result.event) {
      events.push(result.event);
    }
  }
  return events;
}
