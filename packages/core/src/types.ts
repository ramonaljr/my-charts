export type Timeframe = "1m" | "5m" | "15m" | "1h" | "4h" | "1d";

export type PriceSource = "open" | "high" | "low" | "close";

export interface Candle {
  timestamp: number; // Unix epoch in milliseconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type IndicatorType =
  | "sma"
  | "ema"
  | "rsi"
  | "macd"
  | "bbands"
  | "atr"
  | "vwap"
  | "stoch"
  | "adx"
  | "cci"
  | "obv"
  | "ichimoku";

export interface BaseIndicatorConfig {
  id?: string;
  type: IndicatorType;
  source?: PriceSource;
}

export interface MovingAverageConfig extends BaseIndicatorConfig {
  type: "sma" | "ema";
  length: number;
}

export interface RsiConfig extends BaseIndicatorConfig {
  type: "rsi";
  length: number;
}

export interface MacdConfig extends BaseIndicatorConfig {
  type: "macd";
  fastLength: number;
  slowLength: number;
  signalLength: number;
}

export interface BollingerBandsConfig extends BaseIndicatorConfig {
  type: "bbands";
  length: number;
  stdDev: number;
}

export interface AtrConfig extends BaseIndicatorConfig {
  type: "atr";
  length: number;
}

export interface VwapConfig extends BaseIndicatorConfig {
  type: "vwap";
}

export interface StochConfig extends BaseIndicatorConfig {
  type: "stoch";
  kPeriod: number;
  dPeriod: number;
  smooth: number;
}

export interface AdxConfig extends BaseIndicatorConfig {
  type: "adx";
  length: number;
}

export interface CciConfig extends BaseIndicatorConfig {
  type: "cci";
  length: number;
}

export interface ObvConfig extends BaseIndicatorConfig {
  type: "obv";
}

export interface IchimokuConfig extends BaseIndicatorConfig {
  type: "ichimoku";
  conversionPeriod: number;
  basePeriod: number;
  spanPeriod: number;
  displacement: number; // Typically 26 - offset for Senkou spans (forward) and Chikou (backward)
}

export type IndicatorConfig =
  | MovingAverageConfig
  | RsiConfig
  | MacdConfig
  | BollingerBandsConfig
  | AtrConfig
  | VwapConfig
  | StochConfig
  | AdxConfig
  | CciConfig
  | ObvConfig
  | IchimokuConfig;

export interface IndicatorPoint {
  timestamp: number;
  value: number;
  signal?: number;
  histogram?: number;
  upper?: number;
  lower?: number;
  basis?: number;
  // Stochastic
  k?: number;
  d?: number;
  // ADX
  plusDI?: number;
  minusDI?: number;
  // Ichimoku
  tenkan?: number;
  kijun?: number;
  senkouA?: number;
  senkouB?: number;
  chikou?: number;
  senkouTimestamp?: number; // Timestamp for Senkou spans (shifted forward)
  chikouTimestamp?: number; // Timestamp for Chikou span (shifted backward)
}

export interface IndicatorSeries {
  type: IndicatorType;
  config: IndicatorConfig;
  points: IndicatorPoint[];
}

export type AlertConditionType =
  | "GT"
  | "LT"
  | "CROSS_ABOVE"
  | "CROSS_BELOW";

export type AlertOperand =
  | { type: "price"; source: PriceSource }
  | { type: "indicator"; indicator: IndicatorConfig; seriesKey?: string }
  | { type: "number"; value: number };

export interface AlertRule {
  id: string;
  symbolId: string;
  timeframe: Timeframe;
  conditionType: AlertConditionType;
  leftOperand: AlertOperand;
  rightOperand: AlertOperand;
  active: boolean;
  description?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface AlertTriggerEvent {
  id: string;
  ruleId: string;
  symbolId: string;
  timeframe: Timeframe;
  triggeredAt: number;
  conditionType: AlertConditionType;
  leftValue: number;
  rightValue: number;
  details?: string;
}

export type IndicatorSeriesMap = Record<string, IndicatorSeries>;
