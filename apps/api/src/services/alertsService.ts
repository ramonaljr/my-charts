import {
  AlertOperand,
  AlertRule as CoreAlertRule,
  AlertTriggerEvent,
  Timeframe,
  evaluateAlertRulesForCandle,
} from "@nova/core";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { timeframeToDb, dbTimeframeToCore } from "./timeframe";

export interface AlertInput {
  symbolId: number;
  timeframe: Timeframe;
  conditionType: CoreAlertRule["conditionType"];
  leftOperand: AlertOperand;
  rightOperand: AlertOperand;
  active?: boolean;
  description?: string;
}

function mapDbRuleToCore(rule: {
  id: string;
  symbolId: number;
  timeframe: string;
  conditionType: string;
  leftOperand: unknown;
  rightOperand: unknown;
  active: boolean;
  description: string | null;
}): CoreAlertRule {
  return {
    id: rule.id,
    symbolId: rule.symbolId.toString(),
    timeframe: dbTimeframeToCore(rule.timeframe as never),
    conditionType: rule.conditionType as CoreAlertRule["conditionType"],
    leftOperand: rule.leftOperand as AlertOperand,
    rightOperand: rule.rightOperand as AlertOperand,
    active: rule.active,
    description: rule.description ?? undefined,
  };
}

export async function listAlerts() {
  const rules = await prisma.alertRule.findMany({ orderBy: { createdAt: "desc" } });
  return rules.map(mapDbRuleToCore);
}

export async function createAlert(input: AlertInput) {
  const created = await prisma.alertRule.create({
    data: {
      symbolId: input.symbolId,
      timeframe: timeframeToDb(input.timeframe),
      conditionType: input.conditionType,
      leftOperand: input.leftOperand as Prisma.InputJsonValue,
      rightOperand: input.rightOperand as Prisma.InputJsonValue,
      active: input.active ?? true,
      description: input.description,
    },
  });
  return mapDbRuleToCore(created);
}

export async function updateAlert(id: string, input: Partial<AlertInput>) {
  const updated = await prisma.alertRule.update({
    where: { id },
    data: {
      symbolId: input.symbolId,
      timeframe: input.timeframe ? timeframeToDb(input.timeframe) : undefined,
      conditionType: input.conditionType,
      leftOperand: input.leftOperand as Prisma.InputJsonValue,
      rightOperand: input.rightOperand as Prisma.InputJsonValue,
      active: input.active,
      description: input.description,
    },
  });
  return mapDbRuleToCore(updated);
}

export function deleteAlert(id: string) {
  return prisma.alertRule.delete({ where: { id } });
}

export async function listAlertEvents(limit = 50, symbolId?: number) {
  const events = await prisma.alertEvent.findMany({
    where: symbolId ? { symbolId } : undefined,
    orderBy: { triggeredAt: "desc" },
    take: limit,
  });

  return events;
}

export async function fetchActiveRules(timeframe: Timeframe) {
  const rules = await prisma.alertRule.findMany({
    where: { timeframe: timeframeToDb(timeframe), active: true },
  });
  return rules.map(mapDbRuleToCore);
}

export async function storeAlertEvents(events: AlertTriggerEvent[]) {
  if (events.length === 0) return;
  await prisma.alertEvent.createMany({
    data: events.map((event) => ({
      id: event.id,
      ruleId: event.ruleId,
      symbolId: Number(event.symbolId),
      timeframe: timeframeToDb(event.timeframe),
      triggeredAt: new Date(event.triggeredAt),
      conditionType: event.conditionType,
      leftValue: event.leftValue,
      rightValue: event.rightValue,
    })),
  });
}

export async function evaluateRulesForCandle(params: {
  rules: CoreAlertRule[];
  candle: Parameters<typeof evaluateAlertRulesForCandle>[1]["candle"];
  previousCandle?: Parameters<typeof evaluateAlertRulesForCandle>[1]["previousCandle"];
  indicatorSeries?: Parameters<typeof evaluateAlertRulesForCandle>[1]["indicatorSeries"];
  previousIndicatorSeries?: Parameters<
    typeof evaluateAlertRulesForCandle
  >[1]["previousIndicatorSeries"];
}) {
  const events = evaluateAlertRulesForCandle(params.rules, {
    candle: params.candle,
    previousCandle: params.previousCandle,
    indicatorSeries: params.indicatorSeries,
    previousIndicatorSeries: params.previousIndicatorSeries,
  });
  await storeAlertEvents(events);
  return events;
}
