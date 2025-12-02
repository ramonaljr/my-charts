"use client";

import React, { useState, useMemo } from "react";
import { clsx } from "clsx";

interface StatisticsRow {
  fiscalDate: string;
  period: string;
  data: Record<string, unknown>;
}

interface StatisticsProps {
  income?: StatisticsRow[];
  balance?: StatisticsRow[];
  cashflow?: StatisticsRow[];
  ratios?: StatisticsRow[];
  quote?: Record<string, unknown> | null;
  profile?: Record<string, unknown> | null;
}

type PeriodType = "annual" | "quarterly";

// Define metric groups like TradingView
const METRIC_GROUPS = {
  keyStats: {
    title: "Key stats",
    metrics: [
      { key: "sharesOutstanding", label: "Total common shares outstanding", format: "shares" },
    ],
  },
  valuation: {
    title: "Valuation ratios",
    metrics: [
      { key: "peRatio", label: "Price to earnings ratio", format: "number" },
      { key: "psRatio", label: "Price to sales ratio", format: "number" },
      { key: "pcfRatio", label: "Price to cash flow ratio", format: "number" },
      { key: "pbRatio", label: "Price to book ratio", format: "number" },
      { key: "enterpriseValue", label: "Enterprise value", format: "currency" },
      { key: "evToEbitda", label: "Enterprise value to EBITDA ratio", format: "number" },
    ],
  },
  profitability: {
    title: "Profitability ratios",
    metrics: [
      { key: "returnOnAssets", label: "Return on assets %", format: "percent" },
      { key: "returnOnEquity", label: "Return on equity %", format: "percent" },
      { key: "returnOnInvestedCapital", label: "Return on invested capital %", format: "percent" },
      { key: "grossMargin", label: "Gross margin %", format: "percent" },
      { key: "operatingMargin", label: "Operating margin %", format: "percent" },
      { key: "ebitdaMargin", label: "EBITDA margin %", format: "percent" },
      { key: "netMargin", label: "Net margin %", format: "percent" },
    ],
  },
  liquidity: {
    title: "Liquidity ratios",
    metrics: [
      { key: "quickRatio", label: "Quick ratio", format: "number" },
      { key: "currentRatio", label: "Current ratio", format: "number" },
      { key: "inventoryTurnover", label: "Inventory turnover", format: "number" },
      { key: "assetTurnover", label: "Asset turnover", format: "number" },
    ],
  },
  solvency: {
    title: "Solvency ratios",
    metrics: [
      { key: "debtToAssets", label: "Debt to assets ratio", format: "number" },
      { key: "debtToEquity", label: "Debt to equity ratio", format: "number" },
      { key: "longTermDebtToAssets", label: "Long term debt to total assets ratio", format: "number" },
      { key: "longTermDebtToEquity", label: "Long term debt to total equity ratio", format: "number" },
    ],
  },
  perShare: {
    title: "Per share metrics",
    metrics: [
      { key: "revenuePerShare", label: "Revenue per share", format: "currency" },
      { key: "operatingCashFlowPerShare", label: "Operating cash flow per share", format: "currency" },
      { key: "freeCashFlowPerShare", label: "Free cash flow per share", format: "currency" },
      { key: "ebitPerShare", label: "EBIT per share", format: "currency" },
      { key: "ebitdaPerShare", label: "EBITDA per share", format: "currency" },
      { key: "bookValuePerShare", label: "Book value per share", format: "currency" },
      { key: "totalDebtPerShare", label: "Total debt per share", format: "currency" },
      { key: "cashPerShare", label: "Cash per share", format: "currency" },
    ],
  },
};

// Map raw data fields to our metric keys
function extractMetrics(row: Record<string, unknown>): Record<string, number | undefined> {
  const shares = (row.sharesOutstanding as number) || (row.ordinarySharesNumber as number) || 0;
  const totalRevenue = (row.totalRevenue as number) || (row.revenue as number) || 0;
  const operatingCashFlow = (row.operatingCashFlow as number) || (row.netCashProvidedByOperatingActivities as number) || 0;
  const freeCashFlow = (row.freeCashFlow as number) || 0;
  const ebit = (row.EBIT as number) || (row.operatingIncome as number) || 0;
  const ebitda = (row.EBITDA as number) || (row.ebitda as number) || 0;
  const bookValue = (row.stockholdersEquity as number) || (row.totalStockholdersEquity as number) || 0;
  const totalDebt = (row.totalDebt as number) || 0;
  const cash = (row.cashAndCashEquivalents as number) || 0;
  const totalAssets = (row.totalAssets as number) || 0;
  const netIncome = (row.netIncome as number) || 0;
  const grossProfit = (row.grossProfit as number) || 0;
  const operatingIncome = (row.operatingIncome as number) || 0;
  const currentAssets = (row.currentAssets as number) || (row.totalCurrentAssets as number) || 0;
  const currentLiabilities = (row.currentLiabilities as number) || (row.totalCurrentLiabilities as number) || 0;
  const inventory = (row.inventory as number) || 0;
  const costOfRevenue = (row.costOfRevenue as number) || 0;
  const longTermDebt = (row.longTermDebt as number) || 0;

  return {
    sharesOutstanding: shares,
    // Valuation - these need price data, will be calculated differently
    peRatio: row.trailingPE as number,
    psRatio: row.priceToSalesTrailing12Months as number,
    pcfRatio: row.priceToCashFlow as number,
    pbRatio: row.priceToBook as number,
    enterpriseValue: row.enterpriseValue as number,
    evToEbitda: row.enterpriseToEbitda as number,
    // Profitability
    returnOnAssets: totalAssets > 0 ? (netIncome / totalAssets) * 100 : undefined,
    returnOnEquity: bookValue > 0 ? (netIncome / bookValue) * 100 : undefined,
    returnOnInvestedCapital: (bookValue + totalDebt) > 0 ? (ebit / (bookValue + totalDebt)) * 100 : undefined,
    grossMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : undefined,
    operatingMargin: totalRevenue > 0 ? (operatingIncome / totalRevenue) * 100 : undefined,
    ebitdaMargin: totalRevenue > 0 ? (ebitda / totalRevenue) * 100 : undefined,
    netMargin: totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : undefined,
    // Liquidity
    quickRatio: currentLiabilities > 0 ? (currentAssets - inventory) / currentLiabilities : undefined,
    currentRatio: currentLiabilities > 0 ? currentAssets / currentLiabilities : undefined,
    inventoryTurnover: inventory > 0 ? costOfRevenue / inventory : undefined,
    assetTurnover: totalAssets > 0 ? totalRevenue / totalAssets : undefined,
    // Solvency
    debtToAssets: totalAssets > 0 ? totalDebt / totalAssets : undefined,
    debtToEquity: bookValue > 0 ? totalDebt / bookValue : undefined,
    longTermDebtToAssets: totalAssets > 0 ? longTermDebt / totalAssets : undefined,
    longTermDebtToEquity: bookValue > 0 ? longTermDebt / bookValue : undefined,
    // Per share
    revenuePerShare: shares > 0 ? totalRevenue / shares : undefined,
    operatingCashFlowPerShare: shares > 0 ? operatingCashFlow / shares : undefined,
    freeCashFlowPerShare: shares > 0 ? freeCashFlow / shares : undefined,
    ebitPerShare: shares > 0 ? ebit / shares : undefined,
    ebitdaPerShare: shares > 0 ? ebitda / shares : undefined,
    bookValuePerShare: shares > 0 ? bookValue / shares : undefined,
    totalDebtPerShare: shares > 0 ? totalDebt / shares : undefined,
    cashPerShare: shares > 0 ? cash / shares : undefined,
  };
}

function formatValue(value: unknown, format: string): string {
  if (value === null || value === undefined) return "—";
  const num = typeof value === "number" ? value : parseFloat(value as string);
  if (isNaN(num)) return "—";

  switch (format) {
    case "percent":
      return num.toFixed(2);
    case "currency":
      if (Math.abs(num) >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
      if (Math.abs(num) >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
      if (Math.abs(num) >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
      return num.toFixed(2);
    case "shares":
      if (Math.abs(num) >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
      if (Math.abs(num) >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
      return num.toLocaleString();
    default:
      return num.toFixed(2);
  }
}

function formatDateHeader(dateStr: string): { quarter: string; year: string } {
  const date = new Date(dateStr);
  const month = date.getMonth();
  const year = date.getFullYear().toString().slice(-2);

  // Determine quarter based on month
  let quarter: string;
  if (month <= 2) quarter = "Q4";
  else if (month <= 5) quarter = "Q1";
  else if (month <= 8) quarter = "Q2";
  else quarter = "Q3";

  // Adjust year for fiscal year
  const fiscalYear = month <= 2 ? year : (parseInt(year) + 1).toString().padStart(2, '0');

  return { quarter: `${quarter} '${fiscalYear}`, year: `${date.toLocaleDateString('en-US', { month: 'short' })} ${date.getFullYear()}` };
}

export function Statistics({
  income = [],
  balance = [],
  cashflow = [],
  ratios = [],
  quote,
  profile,
}: StatisticsProps) {
  const [period, setPeriod] = useState<PeriodType>("quarterly");

  // Combine all data sources and filter by period
  const processedData = useMemo(() => {
    const periodFilter = period === "annual" ? "FY" : "Q";

    // Get all income data for the selected period
    const incomeFiltered = income
      .filter((row) => row.period === periodFilter)
      .sort((a, b) => new Date(a.fiscalDate).getTime() - new Date(b.fiscalDate).getTime());

    const balanceFiltered = balance
      .filter((row) => row.period === periodFilter)
      .sort((a, b) => new Date(a.fiscalDate).getTime() - new Date(b.fiscalDate).getTime());

    const cashflowFiltered = cashflow
      .filter((row) => row.period === periodFilter)
      .sort((a, b) => new Date(a.fiscalDate).getTime() - new Date(b.fiscalDate).getTime());

    // Create a map of periods with combined data
    const periodMap = new Map<string, Record<string, unknown>>();

    // Merge all data by fiscal date
    [...incomeFiltered, ...balanceFiltered, ...cashflowFiltered].forEach((row) => {
      const existing = periodMap.get(row.fiscalDate) || {};
      periodMap.set(row.fiscalDate, { ...existing, ...row.data, fiscalDate: row.fiscalDate });
    });

    // Convert to array and sort by date
    const periods = Array.from(periodMap.entries())
      .map(([date, data]) => ({ date, data, metrics: extractMetrics(data) }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return periods;
  }, [income, balance, cashflow, period]);

  // Add current period from quote data if available
  const allPeriods = useMemo(() => {
    if (!quote) return processedData;

    // Add "Current" column with live quote data
    const currentMetrics: Record<string, number | undefined> = {
      peRatio: quote.pe as number,
      psRatio: quote.priceToSales as number,
      pbRatio: quote.priceToBook as number,
    };

    return [
      ...processedData,
      { date: "current", data: quote, metrics: currentMetrics },
    ];
  }, [processedData, quote]);

  const chartData = useMemo(() => {
    // Prepare data for the mini chart (P/E and P/CF over time)
    return processedData.map((p) => ({
      date: p.date,
      peRatio: p.metrics.peRatio || 0,
      pcfRatio: p.metrics.pcfRatio || 0,
    }));
  }, [processedData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Statistics</h2>
          <p className="text-sm text-tv-text-secondary mt-1">
            Key financial stats and ratios
          </p>
        </div>
        <div className="flex items-center gap-1 bg-tv-bg-secondary p-1 rounded-lg border border-tv-border">
          <button
            onClick={() => setPeriod("annual")}
            className={clsx(
              "px-3 py-1 rounded text-sm font-medium transition-colors",
              period === "annual"
                ? "bg-tv-blue text-white"
                : "text-tv-text-secondary hover:text-white"
            )}
          >
            Annual
          </button>
          <button
            onClick={() => setPeriod("quarterly")}
            className={clsx(
              "px-3 py-1 rounded text-sm font-medium transition-colors",
              period === "quarterly"
                ? "bg-tv-blue text-white"
                : "text-tv-text-secondary hover:text-white"
            )}
          >
            Quarterly
          </button>
        </div>
      </div>

      {/* Mini Chart for P/E and P/CF */}
      {chartData.length > 0 && (
        <div className="bg-tv-bg-secondary rounded-lg border border-tv-border p-4">
          <div className="flex items-center gap-4 mb-4">
            <span className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded-full bg-tv-blue"></span>
              Price to earnings ratio
            </span>
            <span className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded-full bg-cyan-400"></span>
              Price to cash flow ratio
            </span>
          </div>
          <div className="h-32 flex items-end gap-1">
            {chartData.slice(-20).map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex gap-0.5 h-24 items-end">
                  <div
                    className="flex-1 bg-tv-blue rounded-t"
                    style={{ height: `${Math.min((d.peRatio / 150) * 100, 100)}%` }}
                  ></div>
                  <div
                    className="flex-1 bg-cyan-400 rounded-t"
                    style={{ height: `${Math.min((d.pcfRatio / 150) * 100, 100)}%` }}
                  ></div>
                </div>
                <span className="text-[10px] text-tv-text-secondary">
                  {formatDateHeader(d.date).quarter}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statistics Table */}
      <div className="bg-tv-bg-secondary rounded-lg border border-tv-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-tv-border">
                <th className="text-left py-3 px-4 text-tv-text-secondary font-medium sticky left-0 bg-tv-bg-secondary z-10">
                  Currency: USD
                </th>
                {allPeriods.map((p, i) => {
                  const header = p.date === "current"
                    ? { quarter: "Current", year: "" }
                    : formatDateHeader(p.date);
                  return (
                    <th key={i} className="text-right py-3 px-3 text-tv-text-secondary font-medium min-w-[80px]">
                      <div className="text-xs">{header.quarter}</div>
                      <div className="text-[10px] text-tv-text-secondary">{header.year}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {Object.entries(METRIC_GROUPS).map(([groupKey, group]) => (
                <React.Fragment key={groupKey}>
                  <tr className="bg-tv-bg">
                    <td
                      colSpan={allPeriods.length + 1}
                      className="py-3 px-4 text-white font-semibold text-sm"
                    >
                      {group.title}
                    </td>
                  </tr>
                  {group.metrics.map((metric) => (
                    <tr key={metric.key} className="border-b border-tv-border/50 hover:bg-tv-bg/50">
                      <td className="py-2 px-4 text-tv-text-secondary sticky left-0 bg-tv-bg-secondary z-10">
                        {metric.label}
                      </td>
                      {allPeriods.map((p, i) => {
                        const value = p.metrics[metric.key as keyof typeof p.metrics];
                        return (
                          <td key={i} className="text-right py-2 px-3 text-white tabular-nums">
                            {formatValue(value, metric.format)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
