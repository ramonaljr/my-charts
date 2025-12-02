"use client";

import { useEffect, useState } from "react";
import {
  fetchFundamentals,
  fetchSymbols,
  FundamentalsData,
  Symbol,
  fetchRealtimeQuote,
  FmpQuote,
} from "@/lib/api/client";
import { KeyFacts } from "@/components/fundamentals/KeyFacts";
import { FundamentalsSummary } from "@/components/fundamentals/FundamentalsSummary";
import { GrowthProfitability } from "@/components/fundamentals/GrowthProfitability";
import { FinancialStatements } from "@/components/fundamentals/FinancialStatements";
import { RevenueBreakdown } from "@/components/fundamentals/RevenueBreakdown";
import { Statistics } from "@/components/fundamentals/Statistics";
import { Dividends } from "@/components/fundamentals/Dividends";
import { Earnings } from "@/components/fundamentals/Earnings";
import { clsx } from "clsx";
import { RefreshCw, ExternalLink, ChevronDown, TrendingUp, TrendingDown } from "lucide-react";

// Helper component for statistics rows
function StatRow({
  label,
  value,
  isPercent = false,
  prefix = "",
}: {
  label: string;
  value: unknown;
  isPercent?: boolean;
  prefix?: string;
}) {
  const formatValue = (val: unknown): string => {
    if (val === null || val === undefined || val === 0) return "—";
    const num = typeof val === "string" ? parseFloat(val) : (val as number);
    if (isNaN(num)) return "—";
    if (isPercent) {
      // If value is already a decimal (like 0.25 for 25%), multiply by 100
      const pct = Math.abs(num) < 1 ? num * 100 : num;
      return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
    }
    return `${prefix}${num.toFixed(2)}`;
  };

  const numValue = typeof value === "number" ? value : parseFloat(String(value || 0));
  const isPositive = isPercent && !isNaN(numValue) && numValue > 0;
  const isNegative = isPercent && !isNaN(numValue) && numValue < 0;

  return (
    <div className="flex justify-between items-center">
      <span className="text-tv-text-secondary text-sm">{label}</span>
      <span
        className={clsx(
          "text-sm font-medium",
          isPositive && "text-tv-green",
          isNegative && "text-tv-red",
          !isPositive && !isNegative && "text-white"
        )}
      >
        {formatValue(value)}
      </span>
    </div>
  );
}

export default function FundamentalsPage() {
  const [data, setData] = useState<FundamentalsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [symbols, setSymbols] = useState<Symbol[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<Symbol | null>(null);
  const [activeSection, setActiveSection] = useState("overview");
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [realtimeQuote, setRealtimeQuote] = useState<FmpQuote | null>(null);

  // Load symbols - filter to stocks only (Yahoo Finance supports all stocks)
  useEffect(() => {
    fetchSymbols()
      .then((data) => {
        setSymbols(data.filter((s) => s.assetClass === "STOCK"));
      })
      .catch(console.error);
  }, []);

  // Load fundamentals when symbol changes
  useEffect(() => {
    async function load() {
      if (!selectedSymbol) {
        // Try to find a default symbol with fundamentals
        const syms = await fetchSymbols();
        const stocks = syms.filter((s) => s.assetClass === "STOCK");
        const target =
          stocks.find((s) => s.displayName === "NVDA") ||
          stocks.find((s) => s.displayName === "AAPL") ||
          stocks[0] ||
          null;

        if (target) {
          setSelectedSymbol(target);
        } else {
          setError("No symbols with fundamentals data are available.");
          setLoading(false);
        }
        return;
      }

      try {
        setError(null);
        setLoading(true);
        const [fundData, quote] = await Promise.all([
          fetchFundamentals(selectedSymbol.id),
          fetchRealtimeQuote(selectedSymbol.id).catch(() => null),
        ]);
        setData(fundData);
        setRealtimeQuote(quote);
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedSymbol]);

  // Refresh real-time quote periodically
  useEffect(() => {
    if (!selectedSymbol) return;

    const interval = setInterval(async () => {
      try {
        const quote = await fetchRealtimeQuote(selectedSymbol.id);
        setRealtimeQuote(quote);
      } catch (e) {
        console.error("Failed to refresh quote:", e);
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [selectedSymbol]);

  const handleRefresh = async () => {
    if (!selectedSymbol) return;
    setRefreshing(true);
    try {
      const { refreshFundamentals } = await import("@/lib/api/client");
      const fundData = await refreshFundamentals(selectedSymbol.id);
      setData(fundData);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  const currentQuote = realtimeQuote || data?.quote;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-tv-bg">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-tv-blue border-t-transparent" />
      </div>
    );
  }

  if (!data || !selectedSymbol) {
    return (
      <div className="h-full flex items-center justify-center bg-tv-bg text-tv-text-secondary">
        <div className="text-center space-y-4 max-w-lg px-6">
          <div className="text-xl font-semibold text-white">
            Failed to load fundamentals data
          </div>
          {error && (
            <div className="text-sm bg-tv-bg-secondary border border-tv-border rounded-lg p-4">
              {error}
            </div>
          )}
          <div className="text-xs">
            Make sure the API server is running (pnpm dev in apps/api) and reachable.
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "statements", label: "Financials" },
    { id: "statistics", label: "Statistics" },
    { id: "dividends", label: "Dividends" },
    { id: "earnings", label: "Earnings" },
    { id: "revenue", label: "Revenue" },
  ];

  const priceChange = currentQuote?.change || 0;
  const priceChangePercent = currentQuote?.changesPercentage || 0;
  const isPositive = priceChange >= 0;

  return (
    <div className="h-full overflow-y-auto bg-tv-bg">
      <div className="px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          {/* Symbol Selector */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {data.profile?.image && (
                <img
                  src={data.profile.image}
                  alt={selectedSymbol.displayName}
                  className="w-12 h-12 rounded-full bg-white"
                />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <select
                      value={selectedSymbol.id}
                      onChange={(e) => {
                        const sym = symbols.find((s) => s.id === Number(e.target.value));
                        if (sym) setSelectedSymbol(sym);
                      }}
                      className="appearance-none text-2xl font-bold text-white bg-transparent border-none focus:outline-none cursor-pointer pr-6"
                    >
                      {symbols.map((s) => (
                        <option key={s.id} value={s.id} className="bg-tv-bg-secondary">
                          {s.displayName}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-tv-text-secondary pointer-events-none" />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-white font-medium">
                    {data.profile?.companyName || selectedSymbol.displayName}
                  </span>
                  <span className="text-tv-text-secondary">•</span>
                  <span className="text-tv-text-secondary">
                    {data.profile?.exchangeShortName}
                  </span>
                  <span className="text-tv-text-secondary">•</span>
                  <span className="text-tv-text-secondary">{data.profile?.sector}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-3 py-1.5 bg-tv-border hover:bg-tv-border/80 text-white rounded text-sm transition-colors disabled:opacity-50"
              >
                <RefreshCw className={clsx("w-4 h-4", refreshing && "animate-spin")} />
                Refresh
              </button>
              <a
                href={`/charts?symbol=${selectedSymbol.id}`}
                className="flex items-center gap-2 px-3 py-1.5 bg-tv-blue hover:bg-tv-blue/80 text-white rounded text-sm transition-colors"
              >
                View Chart
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Price Display */}
          <div className="flex items-baseline gap-4 mb-6">
            <div className="text-4xl font-bold text-white">
              {currentQuote?.price?.toFixed(2) || "--"}
              <span className="text-lg text-tv-text-secondary ml-2 font-medium">
                {data.profile?.currency || "USD"}
              </span>
            </div>
            <div
              className={clsx(
                "flex items-center gap-1 text-lg font-bold",
                isPositive ? "text-tv-green" : "text-tv-red"
              )}
            >
              {isPositive ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingDown className="w-5 h-5" />
              )}
              {isPositive ? "+" : ""}
              {priceChange.toFixed(2)} ({isPositive ? "+" : ""}
              {priceChangePercent.toFixed(2)}%)
            </div>
          </div>

          {/* Quote Stats */}
          {currentQuote && (
            <div className="grid grid-cols-6 gap-4 mb-6 text-sm">
              <div>
                <div className="text-tv-text-secondary">Open</div>
                <div className="text-white font-medium">{currentQuote.open?.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-tv-text-secondary">High</div>
                <div className="text-tv-green font-medium">{currentQuote.dayHigh?.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-tv-text-secondary">Low</div>
                <div className="text-tv-red font-medium">{currentQuote.dayLow?.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-tv-text-secondary">Prev Close</div>
                <div className="text-white font-medium">{currentQuote.previousClose?.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-tv-text-secondary">Volume</div>
                <div className="text-white font-medium">
                  {currentQuote.volume
                    ? `${(currentQuote.volume / 1e6).toFixed(2)}M`
                    : "--"}
                </div>
              </div>
              <div>
                <div className="text-tv-text-secondary">Avg Volume</div>
                <div className="text-white font-medium">
                  {currentQuote.avgVolume
                    ? `${(currentQuote.avgVolume / 1e6).toFixed(2)}M`
                    : "--"}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="border-b border-tv-border flex gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={clsx(
                  "pb-3 text-sm font-medium border-b-2 transition-colors",
                  activeSection === tab.id
                    ? "border-tv-blue text-tv-blue"
                    : "border-transparent text-tv-text-secondary hover:text-white"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {activeSection === "overview" && (
            <div>
              <KeyFacts profile={data.profile} ratios={data.ratios} quote={currentQuote} />
              <FundamentalsSummary profile={data.profile} ratios={data.ratios} quote={currentQuote} income={data.income} />
              <GrowthProfitability ratios={data.ratios} income={data.income} />
            </div>
          )}

          {activeSection === "statements" && (
            <FinancialStatements
              income={data.income}
              balance={data.balance}
              cashflow={data.cashflow}
            />
          )}

          {activeSection === "statistics" && (
            <Statistics
              income={data.income}
              balance={data.balance}
              cashflow={data.cashflow}
              ratios={data.ratios}
              quote={currentQuote as unknown as Record<string, unknown> | null}
              profile={data.profile as unknown as Record<string, unknown> | null}
            />
          )}

          {activeSection === "dividends" && (
            <Dividends
              dividends={data.dividends}
              profile={data.profile}
              quote={currentQuote}
              ratios={data.ratios}
              income={data.income}
            />
          )}

          {activeSection === "earnings" && (
            <Earnings
              earnings={data.earnings}
              income={data.income}
              quote={currentQuote}
            />
          )}

          {activeSection === "revenue" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white">Revenue</h2>

              {/* Revenue Summary */}
              {data.income && data.income.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(() => {
                    const annualData = data.income
                      .filter((i) => i.period === "FY")
                      .sort((a, b) => new Date(b.fiscalDate).getTime() - new Date(a.fiscalDate).getTime());
                    const latest = annualData[0];
                    const previous = annualData[1];
                    const latestRev = (latest?.data.revenue as number) || (latest?.data.totalRevenue as number) || 0;
                    const prevRev = (previous?.data.revenue as number) || (previous?.data.totalRevenue as number) || 0;
                    const growth = prevRev > 0 ? ((latestRev - prevRev) / prevRev) * 100 : 0;
                    const grossProfit = (latest?.data.grossProfit as number) || 0;
                    const grossMargin = latestRev > 0 ? (grossProfit / latestRev) * 100 : 0;

                    return (
                      <>
                        <div className="bg-tv-bg-secondary rounded-lg border border-tv-border p-4">
                          <div className="text-xs text-tv-text-secondary mb-1">Latest Annual Revenue</div>
                          <div className="text-lg font-bold text-white">
                            {latestRev >= 1e12
                              ? `$${(latestRev / 1e12).toFixed(2)}T`
                              : latestRev >= 1e9
                              ? `$${(latestRev / 1e9).toFixed(2)}B`
                              : `$${(latestRev / 1e6).toFixed(2)}M`}
                          </div>
                          <div className="text-xs text-tv-text-secondary">{latest?.fiscalDate}</div>
                        </div>
                        <div className="bg-tv-bg-secondary rounded-lg border border-tv-border p-4">
                          <div className="text-xs text-tv-text-secondary mb-1">YoY Growth</div>
                          <div className={clsx("text-lg font-bold", growth >= 0 ? "text-tv-green" : "text-tv-red")}>
                            {growth >= 0 ? "+" : ""}{growth.toFixed(1)}%
                          </div>
                        </div>
                        <div className="bg-tv-bg-secondary rounded-lg border border-tv-border p-4">
                          <div className="text-xs text-tv-text-secondary mb-1">Gross Profit</div>
                          <div className="text-lg font-bold text-white">
                            {grossProfit >= 1e9
                              ? `$${(grossProfit / 1e9).toFixed(2)}B`
                              : `$${(grossProfit / 1e6).toFixed(2)}M`}
                          </div>
                        </div>
                        <div className="bg-tv-bg-secondary rounded-lg border border-tv-border p-4">
                          <div className="text-xs text-tv-text-secondary mb-1">Gross Margin</div>
                          <div className={clsx("text-lg font-bold", grossMargin >= 50 ? "text-tv-green" : "text-white")}>
                            {grossMargin.toFixed(1)}%
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Annual Revenue Chart */}
              {data.income && data.income.filter((i) => i.period === "FY").length > 0 && (
                <div className="bg-tv-bg-secondary rounded-lg border border-tv-border p-6">
                  <h3 className="text-sm font-semibold text-white mb-4">Annual Revenue Trend</h3>
                  {(() => {
                    const annualData = data.income
                      .filter((i) => i.period === "FY")
                      .sort((a, b) => new Date(a.fiscalDate).getTime() - new Date(b.fiscalDate).getTime())
                      .slice(-8);
                    const maxRev = Math.max(
                      ...annualData.map((d) => (d.data.revenue as number) || (d.data.totalRevenue as number) || 0)
                    );

                    return (
                      <div className="h-48 flex items-end gap-2">
                        {annualData.map((item, i) => {
                          const rev = (item.data.revenue as number) || (item.data.totalRevenue as number) || 0;
                          const height = maxRev > 0 ? (rev / maxRev) * 100 : 0;
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2">
                              <div
                                className="w-full bg-tv-blue rounded-t transition-all hover:opacity-80"
                                style={{ height: `${height}%` }}
                                title={`${new Date(item.fiscalDate).getFullYear()}: $${(rev / 1e9).toFixed(2)}B`}
                              />
                              <div className="text-xs text-tv-text-secondary">
                                {new Date(item.fiscalDate).getFullYear()}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Revenue Breakdown (if available) */}
              {(data.revenueProduct?.length || data.revenueGeo?.length) ? (
                <RevenueBreakdown
                  revenueProduct={data.revenueProduct}
                  revenueGeo={data.revenueGeo}
                />
              ) : null}

              {/* Quarterly Revenue Table */}
              {data.income && data.income.filter((i) => i.period === "Q").length > 0 && (
                <div className="bg-tv-bg-secondary rounded-lg overflow-hidden border border-tv-border">
                  <div className="p-4 border-b border-tv-border">
                    <h3 className="text-sm font-semibold text-white">Quarterly Revenue</h3>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-tv-border text-tv-text-secondary text-xs uppercase tracking-wider">
                      <tr>
                        <th className="p-4 text-left font-medium">Quarter</th>
                        <th className="p-4 text-right font-medium">Revenue</th>
                        <th className="p-4 text-right font-medium">Gross Profit</th>
                        <th className="p-4 text-right font-medium">Operating Income</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-tv-border">
                      {data.income
                        .filter((i) => i.period === "Q")
                        .sort((a, b) => new Date(b.fiscalDate).getTime() - new Date(a.fiscalDate).getTime())
                        .slice(0, 12)
                        .map((inc, i) => {
                          const rev = (inc.data.revenue as number) || (inc.data.totalRevenue as number) || 0;
                          const gp = (inc.data.grossProfit as number) || 0;
                          const opInc = (inc.data.operatingIncome as number) || 0;
                          return (
                            <tr key={i} className="hover:bg-tv-border/50 transition-colors">
                              <td className="p-4 text-white">{inc.fiscalDate}</td>
                              <td className="p-4 text-right text-white">
                                ${rev >= 1e9 ? `${(rev / 1e9).toFixed(2)}B` : `${(rev / 1e6).toFixed(2)}M`}
                              </td>
                              <td className="p-4 text-right text-white">
                                ${gp >= 1e9 ? `${(gp / 1e9).toFixed(2)}B` : `${(gp / 1e6).toFixed(2)}M`}
                              </td>
                              <td className={clsx("p-4 text-right", opInc >= 0 ? "text-tv-green" : "text-tv-red")}>
                                ${opInc >= 1e9 ? `${(opInc / 1e9).toFixed(2)}B` : `${(opInc / 1e6).toFixed(2)}M`}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Last Refreshed */}
        {data.lastRefreshedAt && (
          <div className="mt-8 text-xs text-tv-text-secondary">
            Data last refreshed: {new Date(data.lastRefreshedAt).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}
