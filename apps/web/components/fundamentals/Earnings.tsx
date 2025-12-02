import { clsx } from "clsx";
import { useState } from "react";
import { FmpQuote } from "@/lib/api/client";

interface EarningsProps {
  earnings?: Array<{
    date: string;
    symbol: string;
    eps: number;
    epsEstimated: number;
    time: string;
    revenue: number;
    revenueEstimated: number;
  }>;
  income?: Array<{ fiscalDate: string; period: string; data: Record<string, unknown> }>;
  quote?: FmpQuote | null;
}

// Format quarter string from date
function formatQuarter(dateStr: string): string {
  const date = new Date(dateStr);
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  const year = date.getFullYear();
  return `Q${quarter} ${year}`;
}

// Format large numbers
function formatRevenue(value: number): string {
  if (!value) return "—";
  if (Math.abs(value) >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toFixed(2)}`;
}

export function Earnings({ earnings, income, quote }: EarningsProps) {
  const [viewMode, setViewMode] = useState<"quarterly" | "annual">("quarterly");

  // Sort earnings by date (newest first for display)
  const sortedEarnings = [...(earnings || [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Get quarterly income data as fallback
  const quarterlyIncome = income
    ?.filter((i) => i.period === "Q")
    .sort((a, b) => new Date(b.fiscalDate).getTime() - new Date(a.fiscalDate).getTime())
    .slice(0, 16);

  // Get annual income data
  const annualIncome = income
    ?.filter((i) => i.period === "FY")
    .sort((a, b) => new Date(b.fiscalDate).getTime() - new Date(a.fiscalDate).getTime())
    .slice(0, 8);

  // Determine next earnings date
  const nextEarningsDate = quote?.earningsAnnouncement
    ? new Date(quote.earningsAnnouncement)
    : null;

  // Calculate EPS summary
  const latestEarning = sortedEarnings[0];
  const previousEarning = sortedEarnings[1];

  // Calculate surprise percentage
  const calculateSurprise = (actual: number, estimate: number): number => {
    if (!estimate || estimate === 0) return 0;
    return ((actual - estimate) / Math.abs(estimate)) * 100;
  };

  // Chart data (oldest to newest for display)
  const chartEarnings = sortedEarnings.slice(0, 8).reverse();
  const maxEps = Math.max(
    ...chartEarnings.map((e) => Math.max(Math.abs(e.eps), Math.abs(e.epsEstimated || 0))),
    0.01
  );

  // Revenue data from quarterly income
  const chartRevenue = (quarterlyIncome || []).slice(0, 8).reverse().map((inc) => ({
    date: inc.fiscalDate,
    quarter: formatQuarter(inc.fiscalDate),
    revenue: (inc.data.revenue as number) || (inc.data.totalRevenue as number) || 0,
    // Estimate not available from Yahoo
    revenueEstimated: 0,
  }));
  const maxRevenue = Math.max(...chartRevenue.map((r) => r.revenue), 1);

  // Determine beat/miss color
  const getBeatMissColor = (actual: number, estimate: number): string => {
    if (!estimate) return "text-white";
    return actual >= estimate ? "text-tv-green" : "text-tv-red";
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Earnings</h2>

      {/* Header Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-tv-bg-secondary rounded-lg border border-tv-border p-4">
          <div className="text-xs text-tv-text-secondary mb-1">Next Report Date</div>
          <div className="text-lg font-bold text-white">
            {nextEarningsDate ? nextEarningsDate.toLocaleDateString() : "—"}
          </div>
          <div className="text-xs text-tv-text-secondary">
            {nextEarningsDate && nextEarningsDate > new Date() ? "Upcoming" : "TBA"}
          </div>
        </div>
        <div className="bg-tv-bg-secondary rounded-lg border border-tv-border p-4">
          <div className="text-xs text-tv-text-secondary mb-1">Report Period</div>
          <div className="text-lg font-bold text-white">
            {latestEarning ? formatQuarter(latestEarning.date) : quarterlyIncome?.[0] ? formatQuarter(quarterlyIncome[0].fiscalDate) : "—"}
          </div>
          <div className="text-xs text-tv-text-secondary">Latest reported</div>
        </div>
        <div className="bg-tv-bg-secondary rounded-lg border border-tv-border p-4">
          <div className="text-xs text-tv-text-secondary mb-1">EPS (TTM)</div>
          <div className="text-lg font-bold text-white">
            ${quote?.eps?.toFixed(2) || "—"}
          </div>
          <div className="text-xs text-tv-text-secondary">Trailing 12 months</div>
        </div>
        <div className="bg-tv-bg-secondary rounded-lg border border-tv-border p-4">
          <div className="text-xs text-tv-text-secondary mb-1">P/E Ratio</div>
          <div className="text-lg font-bold text-white">
            {quote?.pe?.toFixed(2) || "—"}
          </div>
          <div className="text-xs text-tv-text-secondary">Price to earnings</div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewMode("quarterly")}
          className={clsx(
            "px-4 py-2 text-sm font-medium rounded transition-colors",
            viewMode === "quarterly"
              ? "bg-tv-blue text-white"
              : "bg-tv-bg-secondary text-tv-text-secondary hover:text-white border border-tv-border"
          )}
        >
          Quarterly
        </button>
        <button
          onClick={() => setViewMode("annual")}
          className={clsx(
            "px-4 py-2 text-sm font-medium rounded transition-colors",
            viewMode === "annual"
              ? "bg-tv-blue text-white"
              : "bg-tv-bg-secondary text-tv-text-secondary hover:text-white border border-tv-border"
          )}
        >
          Annual
        </button>
      </div>

      {/* EPS Chart */}
      {chartEarnings.length > 0 && (
        <div className="bg-tv-bg-secondary rounded-lg border border-tv-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">EPS — Reported vs Estimated</h3>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-tv-blue" />
                <span className="text-tv-text-secondary">Reported</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-zinc-600" />
                <span className="text-tv-text-secondary">Estimated</span>
              </div>
            </div>
          </div>

          <div className="h-48 flex items-end gap-1">
            {chartEarnings.map((item, i) => {
              const beat = item.eps >= (item.epsEstimated || 0);
              const epsHeight = (Math.abs(item.eps) / maxEps) * 100;
              const estHeight = (Math.abs(item.epsEstimated || 0) / maxEps) * 100;

              return (
                <div key={`${item.date}-${i}`} className="flex-1 flex flex-col items-center gap-1">
                  <div className="flex-1 w-full flex items-end justify-center gap-1">
                    {/* Estimated bar */}
                    <div
                      className="w-2/5 bg-zinc-600 rounded-t transition-all"
                      style={{ height: `${estHeight}%` }}
                      title={`Est: $${item.epsEstimated?.toFixed(2) || "—"}`}
                    />
                    {/* Reported bar */}
                    <div
                      className={clsx(
                        "w-2/5 rounded-t transition-all",
                        beat ? "bg-tv-blue" : "bg-tv-red"
                      )}
                      style={{ height: `${epsHeight}%` }}
                      title={`Actual: $${item.eps?.toFixed(2)}`}
                    />
                  </div>
                  <div className="text-xs text-tv-text-secondary mt-2">
                    {formatQuarter(item.date)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Revenue Chart */}
      {chartRevenue.length > 0 && (
        <div className="bg-tv-bg-secondary rounded-lg border border-tv-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Revenue — Quarterly</h3>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-orange-500" />
                <span className="text-tv-text-secondary">Reported</span>
              </div>
            </div>
          </div>

          <div className="h-48 flex items-end gap-1">
            {chartRevenue.map((item, i) => {
              const height = (item.revenue / maxRevenue) * 100;

              return (
                <div key={`${item.date}-${i}`} className="flex-1 flex flex-col items-center gap-1">
                  <div className="flex-1 w-full flex items-end justify-center">
                    <div
                      className="w-3/4 bg-orange-500 rounded-t transition-all hover:opacity-80"
                      style={{ height: `${height}%` }}
                      title={`${item.quarter}: ${formatRevenue(item.revenue)}`}
                    />
                  </div>
                  <div className="text-xs text-tv-text-secondary mt-2">
                    {item.quarter}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* EPS Table */}
      {sortedEarnings.length > 0 && (
        <div className="bg-tv-bg-secondary rounded-lg border border-tv-border overflow-x-auto">
          <div className="p-4 border-b border-tv-border">
            <h3 className="text-sm font-semibold text-white">EPS History</h3>
          </div>
          <table className="w-full text-sm min-w-max">
            <thead className="bg-tv-border text-tv-text-secondary text-xs uppercase tracking-wider">
              <tr>
                <th className="p-3 text-left font-medium sticky left-0 bg-tv-border">Metric</th>
                {sortedEarnings.slice(0, 8).map((earn, i) => (
                  <th key={`${earn.date}-${i}`} className="p-3 text-center font-medium min-w-[100px]">
                    {formatQuarter(earn.date)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-tv-border">
              <tr className="hover:bg-tv-border/50">
                <td className="p-3 text-tv-text-secondary sticky left-0 bg-tv-bg-secondary">
                  EPS Reported
                </td>
                {sortedEarnings.slice(0, 8).map((earn, i) => (
                  <td
                    key={`eps-${earn.date}-${i}`}
                    className={clsx(
                      "p-3 text-center font-medium",
                      getBeatMissColor(earn.eps, earn.epsEstimated)
                    )}
                  >
                    ${earn.eps?.toFixed(2) || "—"}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-tv-border/50">
                <td className="p-3 text-tv-text-secondary sticky left-0 bg-tv-bg-secondary">
                  EPS Estimated
                </td>
                {sortedEarnings.slice(0, 8).map((earn, i) => (
                  <td key={`est-${earn.date}-${i}`} className="p-3 text-center text-tv-text-secondary">
                    ${earn.epsEstimated?.toFixed(2) || "—"}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-tv-border/50">
                <td className="p-3 text-tv-text-secondary sticky left-0 bg-tv-bg-secondary">
                  Surprise %
                </td>
                {sortedEarnings.slice(0, 8).map((earn, i) => {
                  const surprise = calculateSurprise(earn.eps, earn.epsEstimated);
                  const beat = earn.eps >= earn.epsEstimated;
                  return (
                    <td
                      key={`surp-${earn.date}-${i}`}
                      className={clsx(
                        "p-3 text-center font-medium",
                        beat ? "text-tv-green" : "text-tv-red"
                      )}
                    >
                      {earn.epsEstimated ? `${beat ? "+" : ""}${surprise.toFixed(1)}%` : "—"}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Revenue Table - from quarterly income */}
      {quarterlyIncome && quarterlyIncome.length > 0 && (
        <div className="bg-tv-bg-secondary rounded-lg border border-tv-border overflow-x-auto">
          <div className="p-4 border-b border-tv-border">
            <h3 className="text-sm font-semibold text-white">
              {viewMode === "quarterly" ? "Quarterly Results" : "Annual Results"}
            </h3>
          </div>
          <table className="w-full text-sm min-w-max">
            <thead className="bg-tv-border text-tv-text-secondary text-xs uppercase tracking-wider">
              <tr>
                <th className="p-3 text-left font-medium sticky left-0 bg-tv-border">Metric</th>
                {(viewMode === "quarterly" ? quarterlyIncome : annualIncome)?.slice(0, 8).map((inc, i) => (
                  <th key={`${inc.fiscalDate}-${i}`} className="p-3 text-center font-medium min-w-[100px]">
                    {viewMode === "quarterly"
                      ? formatQuarter(inc.fiscalDate)
                      : new Date(inc.fiscalDate).getFullYear().toString()
                    }
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-tv-border">
              <tr className="hover:bg-tv-border/50">
                <td className="p-3 text-tv-text-secondary sticky left-0 bg-tv-bg-secondary">
                  Revenue
                </td>
                {(viewMode === "quarterly" ? quarterlyIncome : annualIncome)?.slice(0, 8).map((inc, i) => {
                  const rev = (inc.data.revenue as number) || (inc.data.totalRevenue as number) || 0;
                  return (
                    <td key={`rev-${inc.fiscalDate}-${i}`} className="p-3 text-center text-white">
                      {formatRevenue(rev)}
                    </td>
                  );
                })}
              </tr>
              <tr className="hover:bg-tv-border/50">
                <td className="p-3 text-tv-text-secondary sticky left-0 bg-tv-bg-secondary">
                  Net Income
                </td>
                {(viewMode === "quarterly" ? quarterlyIncome : annualIncome)?.slice(0, 8).map((inc, i) => {
                  const netInc = (inc.data.netIncome as number) || 0;
                  return (
                    <td
                      key={`ni-${inc.fiscalDate}-${i}`}
                      className={clsx(
                        "p-3 text-center font-medium",
                        netInc >= 0 ? "text-tv-green" : "text-tv-red"
                      )}
                    >
                      {formatRevenue(netInc)}
                    </td>
                  );
                })}
              </tr>
              <tr className="hover:bg-tv-border/50">
                <td className="p-3 text-tv-text-secondary sticky left-0 bg-tv-bg-secondary">
                  Net Margin
                </td>
                {(viewMode === "quarterly" ? quarterlyIncome : annualIncome)?.slice(0, 8).map((inc, i) => {
                  const rev = (inc.data.revenue as number) || (inc.data.totalRevenue as number) || 0;
                  const netInc = (inc.data.netIncome as number) || 0;
                  const margin = rev > 0 ? (netInc / rev) * 100 : 0;
                  return (
                    <td
                      key={`margin-${inc.fiscalDate}-${i}`}
                      className={clsx(
                        "p-3 text-center",
                        margin >= 0 ? "text-tv-green" : "text-tv-red"
                      )}
                    >
                      {margin.toFixed(1)}%
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Empty state */}
      {!sortedEarnings.length && !quarterlyIncome?.length && (
        <div className="bg-tv-bg-secondary rounded-lg border border-tv-border p-8 text-center">
          <div className="text-tv-text-secondary">
            No earnings data available.
          </div>
        </div>
      )}
    </div>
  );
}
