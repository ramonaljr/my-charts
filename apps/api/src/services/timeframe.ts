import { Timeframe as CoreTimeframe } from "@nova/core";
import { Timeframe as DbTimeframe } from "@prisma/client";

export function timeframeToDb(tf: CoreTimeframe): DbTimeframe {
  switch (tf) {
    case "1m":
      return DbTimeframe.MIN1;
    case "5m":
      return DbTimeframe.MIN5;
    case "15m":
      return DbTimeframe.MIN15;
    case "1h":
      return DbTimeframe.H1;
    case "4h":
      return DbTimeframe.H4;
    case "1d":
    default:
      return DbTimeframe.D1;
  }
}

export function timeframeToMs(tf: CoreTimeframe): number {
  switch (tf) {
    case "1m":
      return 60_000;
    case "5m":
      return 5 * 60_000;
    case "15m":
      return 15 * 60_000;
    case "1h":
      return 60 * 60_000;
    case "4h":
      return 4 * 60 * 60_000;
    case "1d":
    default:
      return 24 * 60 * 60_000;
  }
}

export function dbTimeframeToCore(tf: DbTimeframe): CoreTimeframe {
  switch (tf) {
    case DbTimeframe.MIN1:
      return "1m";
    case DbTimeframe.MIN5:
      return "5m";
    case DbTimeframe.MIN15:
      return "15m";
    case DbTimeframe.H1:
      return "1h";
    case DbTimeframe.H4:
      return "4h";
    case DbTimeframe.D1:
    default:
      return "1d";
  }
}
