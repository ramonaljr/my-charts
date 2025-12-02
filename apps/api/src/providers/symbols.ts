import { AssetClass } from "@prisma/client";

export interface SymbolSeed {
  displayName: string;
  assetClass: AssetClass;
  finnhubSymbol: string;
  fmpSymbol?: string;
}

export const defaultSymbols: SymbolSeed[] = [
  // US Equities with FMP coverage
  { displayName: "AAPL", assetClass: AssetClass.STOCK, finnhubSymbol: "AAPL", fmpSymbol: "AAPL" },
  { displayName: "NVDA", assetClass: AssetClass.STOCK, finnhubSymbol: "NVDA", fmpSymbol: "NVDA" },
  { displayName: "MSFT", assetClass: AssetClass.STOCK, finnhubSymbol: "MSFT", fmpSymbol: "MSFT" },
  { displayName: "AMZN", assetClass: AssetClass.STOCK, finnhubSymbol: "AMZN", fmpSymbol: "AMZN" },
  { displayName: "GOOGL", assetClass: AssetClass.STOCK, finnhubSymbol: "GOOGL", fmpSymbol: "GOOGL" },
  { displayName: "META", assetClass: AssetClass.STOCK, finnhubSymbol: "META", fmpSymbol: "META" },

  // FX - 20 currency pairs
  { displayName: "EURUSD", assetClass: AssetClass.FX, finnhubSymbol: "OANDA:EUR_USD" },
  { displayName: "GBPUSD", assetClass: AssetClass.FX, finnhubSymbol: "OANDA:GBP_USD" },
  { displayName: "AUDUSD", assetClass: AssetClass.FX, finnhubSymbol: "OANDA:AUD_USD" },
  { displayName: "NZDUSD", assetClass: AssetClass.FX, finnhubSymbol: "OANDA:NZD_USD" },
  { displayName: "USDCAD", assetClass: AssetClass.FX, finnhubSymbol: "OANDA:USD_CAD" },
  { displayName: "USDJPY", assetClass: AssetClass.FX, finnhubSymbol: "OANDA:USD_JPY" },
  { displayName: "USDCHF", assetClass: AssetClass.FX, finnhubSymbol: "OANDA:USD_CHF" },
  { displayName: "AUDJPY", assetClass: AssetClass.FX, finnhubSymbol: "OANDA:AUD_JPY" },
  { displayName: "NZDJPY", assetClass: AssetClass.FX, finnhubSymbol: "OANDA:NZD_JPY" },
  { displayName: "CADJPY", assetClass: AssetClass.FX, finnhubSymbol: "OANDA:CAD_JPY" },
  { displayName: "EURJPY", assetClass: AssetClass.FX, finnhubSymbol: "OANDA:EUR_JPY" },
  { displayName: "GBPJPY", assetClass: AssetClass.FX, finnhubSymbol: "OANDA:GBP_JPY" },
  { displayName: "AUDCAD", assetClass: AssetClass.FX, finnhubSymbol: "OANDA:AUD_CAD" },
  { displayName: "AUDNZD", assetClass: AssetClass.FX, finnhubSymbol: "OANDA:AUD_NZD" },
  { displayName: "EURAUD", assetClass: AssetClass.FX, finnhubSymbol: "OANDA:EUR_AUD" },
  { displayName: "EURCAD", assetClass: AssetClass.FX, finnhubSymbol: "OANDA:EUR_CAD" },
  { displayName: "EURGBP", assetClass: AssetClass.FX, finnhubSymbol: "OANDA:EUR_GBP" },
  { displayName: "EURNZD", assetClass: AssetClass.FX, finnhubSymbol: "OANDA:EUR_NZD" },
  { displayName: "GBPAUD", assetClass: AssetClass.FX, finnhubSymbol: "OANDA:GBP_AUD" },
  { displayName: "GBPCAD", assetClass: AssetClass.FX, finnhubSymbol: "OANDA:GBP_CAD" },
];
