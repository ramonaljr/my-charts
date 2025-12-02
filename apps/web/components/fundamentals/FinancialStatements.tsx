"use client";

import { useState, useMemo } from "react";
import { clsx } from "clsx";

interface StatementRow {
  fiscalDate: string;
  period: string;
  data: Record<string, unknown>;
}

interface FinancialStatementsProps {
  income?: StatementRow[];
  balance?: StatementRow[];
  cashflow?: StatementRow[];
}

type StatementType = "income" | "balance" | "cashflow";
type PeriodType = "annual" | "quarterly";

// Define the key metrics to show for each statement type in order
const INCOME_METRICS = [
  { key: "revenue", label: "Total Revenue", highlight: true },
  { key: "costOfRevenue", label: "Cost of Goods Sold" },
  { key: "grossProfit", label: "Gross Profit", highlight: true },
  { key: "researchAndDevelopmentExpenses", label: "R&D Expenses" },
  { key: "sellingGeneralAndAdministrativeExpenses", label: "SG&A Expenses" },
  { key: "operatingExpenses", label: "Operating Expenses" },
  { key: "operatingIncome", label: "Operating Income", highlight: true },
  { key: "interestExpense", label: "Interest Expense" },
  { key: "incomeBeforeTax", label: "Pretax Income", highlight: true },
  { key: "incomeTaxExpense", label: "Income Tax" },
  { key: "netIncome", label: "Net Income", highlight: true },
  { key: "ebitda", label: "EBITDA" },
];

const BALANCE_METRICS = [
  { key: "cashAndCashEquivalents", label: "Cash & Equivalents", highlight: true },
  { key: "shortTermInvestments", label: "Short-term Investments" },
  { key: "netReceivables", label: "Receivables" },
  { key: "inventory", label: "Inventory" },
  { key: "totalCurrentAssets", label: "Total Current Assets", highlight: true },
  { key: "propertyPlantEquipmentNet", label: "PP&E (Net)" },
  { key: "goodwill", label: "Goodwill" },
  { key: "intangibleAssets", label: "Intangible Assets" },
  { key: "totalAssets", label: "Total Assets", highlight: true },
  { key: "accountPayables", label: "Accounts Payable" },
  { key: "shortTermDebt", label: "Short-term Debt" },
  { key: "totalCurrentLiabilities", label: "Total Current Liabilities", highlight: true },
  { key: "longTermDebt", label: "Long-term Debt" },
  { key: "totalLiabilities", label: "Total Liabilities", highlight: true },
  { key: "totalStockholdersEquity", label: "Total Equity", highlight: true },
];

const CASHFLOW_METRICS = [
  { key: "netIncome", label: "Net Income", highlight: true },
  { key: "depreciationAndAmortization", label: "Depreciation & Amortization" },
  { key: "stockBasedCompensation", label: "Stock-based Compensation" },
  { key: "changeInWorkingCapital", label: "Change in Working Capital" },
  { key: "netCashProvidedByOperatingActivities", label: "Operating Cash Flow", highlight: true },
  { key: "investmentsInPropertyPlantAndEquipment", label: "CapEx" },
  { key: "netCashUsedForInvestingActivites", label: "Investing Cash Flow", highlight: true },
  { key: "dividendsPaid", label: "Dividends Paid" },
  { key: "netCashUsedProvidedByFinancingActivities", label: "Financing Cash Flow", highlight: true },
  { key: "netChangeInCash", label: "Net Change in Cash" },
  { key: "freeCashFlow", label: "Free Cash Flow", highlight: true },
];

// Chart colors for the mini bar chart
const CHART_COLORS: Record<string, string> = {
  revenue: "#2196F3",
  grossProfit: "#4CAF50",
  operatingIncome: "#FF9800",
  incomeBeforeTax: "#F44336",
  netIncome: "#9C27B0",
};

export function FinancialStatements({
  income = [],
  balance = [],
  cashflow = [],
}: FinancialStatementsProps) {
  const [activeTab, setActiveTab] = useState<StatementType>("income");
  const [period, setPeriod] = useState<PeriodType>("annual");

  const dataMap = {
    income,
    balance,
    cashflow,
  };

  const metricsMap = {
    income: INCOME_METRICS,
    balance: BALANCE_METRICS,
    cashflow: CASHFLOW_METRICS,
  };

  // Filter by period (annual = FY, quarterly = Q)
  const filteredData = useMemo(() => {
    const data = dataMap[activeTab] || [];
    // Filter based on selected period type
    const periodFilter = period === "annual" ? "FY" : "Q";
    const filtered = data.filter((row) => row.period === periodFilter);
    // Sort by date descending and limit
    return filtered
      .sort((a, b) => new Date(b.fiscalDate).getTime() - new Date(a.fiscalDate).getTime())
      .slice(0, period === "annual" ? 8 : 12);
  }, [activeTab, period, income, balance, cashflow]);

  const metrics = metricsMap[activeTab];

  // Format large numbers
  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return "—";
    const num = typeof value === "string" ? parseFloat(value) : (value as number);
    if (isNaN(num)) return "—";

    const absNum = Math.abs(num);
    const sign = num < 0 ? "-" : "";

    if (absNum >= 1e12) return `${sign}${(absNum / 1e12).toFixed(2)}T`;
    if (absNum >= 1e9) return `${sign}${(absNum / 1e9).toFixed(2)}B`;
    if (absNum >= 1e6) return `${sign}${(absNum / 1e6).toFixed(2)}M`;
    if (absNum >= 1e3) return `${sign}${(absNum / 1e3).toFixed(2)}K`;
    return num.toFixed(2);
  };

  // Calculate YoY growth
  const calculateGrowth = (current: unknown, previous: unknown): string | null => {
    if (current === null || current === undefined || previous === null || previous === undefined) return null;
    const curr = typeof current === "string" ? parseFloat(current) : (current as number);
    const prev = typeof previous === "string" ? parseFloat(previous) : (previous as number);
    if (isNaN(curr) || isNaN(prev) || prev === 0) return null;
    const growth = ((curr - prev) / Math.abs(prev)) * 100;
    return `${growth >= 0 ? "+" : ""}${growth.toFixed(2)}%`;
  };

  // Get value from data object
  const getValue = (item: StatementRow, key: string): unknown => {
    return item.data?.[key];
  };

  // Format date for column header
  const formatDate = (dateStr: string, periodStr: string): { year: string; month: string } => {
    try {
      const date = new Date(dateStr);
      const year = date.getFullYear().toString();
      const month = date.toLocaleString("en-US", { month: "short" });
      return { year, month };
    } catch {
      return { year: periodStr || dateStr, month: "" };
    }
  };

  // Calculate max value for chart scaling
  const chartMetrics = activeTab === "income"
    ? ["revenue", "grossProfit", "operatingIncome", "incomeBeforeTax", "netIncome"]
    : [];

  const maxChartValue = useMemo(() => {
    if (activeTab !== "income") return 0;
    let max = 0;
    filteredData.forEach((item) => {
      chartMetrics.forEach((key) => {
        const val = getValue(item, key);
        if (typeof val === "number" && val > max) max = val;
      });
    });
    return max;
  }, [filteredData, activeTab]);

  return (
    <div className="space-y-6">
      {/* Header with tabs */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-1 bg-tv-bg-secondary p-1 rounded-lg border border-tv-border">
          {(["income", "balance", "cashflow"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                activeTab === tab
                  ? "bg-tv-blue text-white"
                  : "text-tv-text-secondary hover:text-white hover:bg-tv-border"
              )}
            >
              {tab === "income"
                ? "Income Statement"
                : tab === "balance"
                  ? "Balance Sheet"
                  : "Cash Flow"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-tv-bg-secondary p-1 rounded-lg border border-tv-border">
          {(["annual", "quarterly"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={clsx(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize",
                period === p
                  ? "bg-tv-blue text-white"
                  : "text-tv-text-secondary hover:text-white hover:bg-tv-border"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Mini Bar Chart (for Income Statement) */}
      {activeTab === "income" && filteredData.length > 0 && maxChartValue > 0 && (
        <div className="bg-tv-bg-secondary rounded-lg border border-tv-border p-6">
          <div className="flex items-center gap-6 mb-4 flex-wrap">
            {chartMetrics.map((key) => (
              <div key={key} className="flex items-center gap-2 text-xs">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: CHART_COLORS[key] || "#888" }}
                />
                <span className="text-tv-text-secondary capitalize">
                  {key === "incomeBeforeTax" ? "Pretax Income" : key.replace(/([A-Z])/g, " $1").trim()}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-end gap-3 h-40 overflow-x-auto pb-2">
            {filteredData.slice().reverse().map((item, idx) => {
              const { year } = formatDate(item.fiscalDate, item.period);
              return (
                <div key={idx} className="flex flex-col items-center min-w-[50px]">
                  <div className="flex items-end gap-0.5 h-32">
                    {chartMetrics.map((key) => {
                      const val = getValue(item, key);
                      const numVal = typeof val === "number" ? val : 0;
                      const height = maxChartValue > 0 ? (numVal / maxChartValue) * 128 : 0;
                      return (
                        <div
                          key={key}
                          className="w-2 rounded-t transition-all hover:opacity-80 cursor-pointer"
                          style={{
                            height: `${Math.max(height, 2)}px`,
                            backgroundColor: CHART_COLORS[key] || "#888",
                          }}
                          title={`${key.replace(/([A-Z])/g, " $1").trim()}: ${formatValue(val)}`}
                        />
                      );
                    })}
                  </div>
                  <span className="text-[10px] text-tv-text-secondary mt-2">{year}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-tv-bg-secondary rounded-lg border border-tv-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-tv-border bg-tv-border/30">
                <th className="p-4 text-left text-tv-text-secondary font-medium sticky left-0 bg-tv-bg-secondary z-10 min-w-[220px]">
                  <span className="text-xs uppercase tracking-wider">Currency: USD</span>
                </th>
                {filteredData.map((item, i) => {
                  const { year, month } = formatDate(item.fiscalDate, item.period);
                  return (
                    <th key={i} className="p-3 text-right font-medium text-white min-w-[100px]">
                      <div className="text-sm">{year}</div>
                      <div className="text-xs text-tv-text-secondary font-normal">{month}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric, metricIdx) => {
                return (
                  <tr
                    key={metric.key}
                    className={clsx(
                      "border-b border-tv-border/30 hover:bg-tv-border/20 transition-colors",
                      metric.highlight && "bg-tv-blue/5"
                    )}
                  >
                    <td className={clsx(
                      "p-3 sticky left-0 z-10 text-sm",
                      metric.highlight
                        ? "text-white font-semibold bg-tv-bg-secondary"
                        : "text-tv-text-secondary bg-tv-bg-secondary"
                    )}>
                      {metric.label}
                    </td>
                    {filteredData.map((item, i) => {
                      const value = getValue(item, metric.key);
                      const prevItem = filteredData[i + 1];
                      const prevValue = prevItem ? getValue(prevItem, metric.key) : null;
                      const growth = calculateGrowth(value, prevValue);
                      const growthNum = growth ? parseFloat(growth) : 0;
                      const isPositiveGrowth = growthNum > 0;
                      const isNegativeGrowth = growthNum < 0;

                      return (
                        <td key={i} className="p-3 text-right">
                          <div className={clsx(
                            "font-medium tabular-nums text-sm",
                            metric.highlight ? "text-white" : "text-tv-text-secondary"
                          )}>
                            {formatValue(value)}
                          </div>
                          {growth && (
                            <div className={clsx(
                              "text-xs tabular-nums mt-0.5",
                              isPositiveGrowth && "text-tv-green",
                              isNegativeGrowth && "text-tv-red",
                              !isPositiveGrowth && !isNegativeGrowth && "text-tv-text-secondary"
                            )}>
                              {growth}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={13} className="p-12 text-center text-tv-text-secondary">
                    <div className="space-y-2">
                      <div className="text-lg font-medium text-white">No financial data available</div>
                      <div className="text-sm">
                        Make sure the API server is running and try refreshing the data.
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
