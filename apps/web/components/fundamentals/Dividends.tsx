import { clsx } from "clsx";
import { FmpProfile, FmpQuote } from "@/lib/api/client";

interface DividendsProps {
  dividends?: Array<{
    date: string;
    label: string;
    adjDividend: number;
    dividend: number;
    recordDate: string;
    paymentDate: string;
    declarationDate: string;
  }>;
  profile?: FmpProfile | null;
  quote?: FmpQuote | null;
  ratios?: Array<{ fiscalDate: string; period: string; data: Record<string, unknown> }>;
  income?: Array<{ fiscalDate: string; period: string; data: Record<string, unknown> }>;
}

// Group dividends by year and calculate annual totals
function groupDividendsByYear(
  dividends: DividendsProps["dividends"]
): Record<string, { total: number; count: number; dividends: DividendsProps["dividends"] }> {
  if (!dividends?.length) return {};

  const grouped: Record<string, { total: number; count: number; dividends: NonNullable<DividendsProps["dividends"]> }> = {};

  for (const div of dividends) {
    const year = new Date(div.date).getFullYear().toString();
    if (!grouped[year]) {
      grouped[year] = { total: 0, count: 0, dividends: [] };
    }
    grouped[year].total += div.dividend;
    grouped[year].count += 1;
    grouped[year].dividends.push(div);
  }

  return grouped;
}

// Calculate dividend yield for a year
function calculateYield(annualDividend: number, priceAtEndOfYear: number): number {
  if (!priceAtEndOfYear || priceAtEndOfYear <= 0) return 0;
  return (annualDividend / priceAtEndOfYear) * 100;
}

export function Dividends({ dividends, profile, quote, ratios, income }: DividendsProps) {
  // Group dividends by year
  const dividendsByYear = groupDividendsByYear(dividends);
  const years = Object.keys(dividendsByYear).sort((a, b) => Number(b) - Number(a));
  const displayYears = years.slice(0, 10); // Show up to 10 years

  // Calculate next dividend info from most recent dividend
  const sortedDividends = [...(dividends || [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const latestDividend = sortedDividends[0];
  const currentPrice = quote?.price || 0;

  // Calculate TTM dividend yield
  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;
  const ttmDividends = sortedDividends
    .filter((d) => {
      const date = new Date(d.date);
      const yearAgo = new Date();
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      return date >= yearAgo;
    })
    .reduce((sum, d) => sum + d.dividend, 0);
  const ttmYield = currentPrice > 0 ? (ttmDividends / currentPrice) * 100 : 0;

  // Calculate annual dividend (estimate based on frequency)
  const yearlyTotal = dividendsByYear[lastYear.toString()]?.total || dividendsByYear[currentYear.toString()]?.total || 0;
  const frequency = dividendsByYear[lastYear.toString()]?.count || dividendsByYear[currentYear.toString()]?.count || 4;

  // Get payout ratio from ratios
  const latestRatios = ratios?.find((r) => r.data);
  const payoutRatio = latestRatios?.data?.payoutRatio
    ? Number(latestRatios.data.payoutRatio) * 100
    : undefined;

  // Max values for chart scaling
  const allYearTotals = Object.values(dividendsByYear).map((y) => y.total);
  const maxDividend = Math.max(...allYearTotals, 0.01);
  const maxYield = 10; // Cap yield at 10% for display

  // Generate chart data (oldest to newest for display)
  const chartYears = displayYears.slice().reverse();
  const chartData = chartYears.map((year) => {
    const yearData = dividendsByYear[year];
    // Estimate historical yield using current price (simplified)
    const estYield = currentPrice > 0 ? (yearData?.total || 0) / currentPrice * 100 : 0;
    return {
      year,
      dividend: yearData?.total || 0,
      yield: Math.min(estYield, maxYield),
    };
  });

  const frequencyLabel = frequency === 4 ? "Quarterly" : frequency === 12 ? "Monthly" : frequency === 2 ? "Semi-Annual" : frequency === 1 ? "Annual" : `${frequency}x/year`;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Dividends</h2>

      {/* Header Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-tv-bg-secondary rounded-lg border border-tv-border p-4">
          <div className="text-xs text-tv-text-secondary mb-1">Next Ex-Dividend Date</div>
          <div className="text-lg font-bold text-white">
            {latestDividend ? "TBA" : "—"}
          </div>
          <div className="text-xs text-tv-text-secondary">Based on historical pattern</div>
        </div>
        <div className="bg-tv-bg-secondary rounded-lg border border-tv-border p-4">
          <div className="text-xs text-tv-text-secondary mb-1">Dividend Amount</div>
          <div className="text-lg font-bold text-white">
            ${latestDividend?.dividend?.toFixed(4) || "—"}
          </div>
          <div className="text-xs text-tv-text-secondary">Per share ({frequencyLabel})</div>
        </div>
        <div className="bg-tv-bg-secondary rounded-lg border border-tv-border p-4">
          <div className="text-xs text-tv-text-secondary mb-1">Annual Dividend</div>
          <div className="text-lg font-bold text-white">
            ${yearlyTotal > 0 ? yearlyTotal.toFixed(2) : profile?.lastDiv?.toFixed(2) || "—"}
          </div>
          <div className="text-xs text-tv-text-secondary">
            {profile?.lastDiv ? "From profile" : "Calculated"}
          </div>
        </div>
        <div className="bg-tv-bg-secondary rounded-lg border border-tv-border p-4">
          <div className="text-xs text-tv-text-secondary mb-1">Dividend Yield (TTM)</div>
          <div className={clsx(
            "text-lg font-bold",
            ttmYield > 0 ? "text-tv-green" : "text-white"
          )}>
            {ttmYield > 0 ? `${ttmYield.toFixed(2)}%` : "—"}
          </div>
          <div className="text-xs text-tv-text-secondary">Trailing 12 months</div>
        </div>
      </div>

      {/* Dividend Chart */}
      {chartData.length > 0 && (
        <div className="bg-tv-bg-secondary rounded-lg border border-tv-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Dividend History</h3>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-tv-blue" />
                <span className="text-tv-text-secondary">Dividends per share</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-1 bg-tv-green rounded" />
                <span className="text-tv-text-secondary">Yield %</span>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="relative h-48">
            {/* Y-axis labels - Left (Dividend) */}
            <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-tv-text-secondary">
              <span>${maxDividend.toFixed(2)}</span>
              <span>${(maxDividend / 2).toFixed(2)}</span>
              <span>$0</span>
            </div>

            {/* Y-axis labels - Right (Yield) */}
            <div className="absolute right-0 top-0 bottom-8 w-10 flex flex-col justify-between text-xs text-tv-text-secondary text-right">
              <span>{maxYield}%</span>
              <span>{(maxYield / 2).toFixed(1)}%</span>
              <span>0%</span>
            </div>

            {/* Chart area */}
            <div className="absolute left-14 right-12 top-0 bottom-8">
              {/* Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                <div className="border-b border-tv-border/30" />
                <div className="border-b border-tv-border/30" />
                <div className="border-b border-tv-border" />
              </div>

              {/* Bars and Line */}
              <div className="absolute inset-0 flex items-end justify-around">
                {chartData.map((item, i) => (
                  <div key={item.year} className="flex-1 flex flex-col items-center relative h-full">
                    {/* Bar */}
                    <div className="absolute bottom-0 w-3/4 flex justify-center">
                      <div
                        className="w-full max-w-8 bg-tv-blue rounded-t transition-all hover:opacity-80"
                        style={{ height: `${(item.dividend / maxDividend) * 100}%` }}
                        title={`${item.year}: $${item.dividend.toFixed(4)}`}
                      />
                    </div>

                    {/* Yield dot for line chart */}
                    <div
                      className="absolute w-2 h-2 bg-tv-green rounded-full z-10"
                      style={{ bottom: `${(item.yield / maxYield) * 100}%` }}
                      title={`Yield: ${item.yield.toFixed(2)}%`}
                    />

                    {/* Connect yield dots with line */}
                    {i < chartData.length - 1 && (
                      <svg
                        className="absolute inset-0 overflow-visible pointer-events-none"
                        style={{ zIndex: 5 }}
                      >
                        <line
                          x1="50%"
                          y1={`${100 - (item.yield / maxYield) * 100}%`}
                          x2={`${100 + 100 / chartData.length}%`}
                          y2={`${100 - (chartData[i + 1]?.yield || 0) / maxYield * 100}%`}
                          stroke="#26a69a"
                          strokeWidth="2"
                        />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* X-axis labels */}
            <div className="absolute left-14 right-12 bottom-0 h-6 flex justify-around text-xs text-tv-text-secondary">
              {chartData.map((item) => (
                <div key={item.year} className="flex-1 text-center">
                  {item.year}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Annual Summary Table */}
      {displayYears.length > 0 && (
        <div className="bg-tv-bg-secondary rounded-lg border border-tv-border overflow-x-auto">
          <div className="p-4 border-b border-tv-border">
            <h3 className="text-sm font-semibold text-white">Annual Dividend Summary</h3>
          </div>
          <table className="w-full text-sm min-w-max">
            <thead className="bg-tv-border text-tv-text-secondary text-xs uppercase tracking-wider">
              <tr>
                <th className="p-3 text-left font-medium sticky left-0 bg-tv-border">Metric</th>
                {displayYears.map((year) => (
                  <th key={year} className="p-3 text-center font-medium min-w-[80px]">
                    {year}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-tv-border">
              <tr className="hover:bg-tv-border/50">
                <td className="p-3 text-tv-text-secondary sticky left-0 bg-tv-bg-secondary">
                  Dividends per share (FY)
                </td>
                {displayYears.map((year) => (
                  <td key={year} className="p-3 text-center text-white">
                    ${dividendsByYear[year]?.total.toFixed(2) || "—"}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-tv-border/50">
                <td className="p-3 text-tv-text-secondary sticky left-0 bg-tv-bg-secondary">
                  Dividend yield (FY) %
                </td>
                {displayYears.map((year) => {
                  const estYield = currentPrice > 0
                    ? ((dividendsByYear[year]?.total || 0) / currentPrice) * 100
                    : 0;
                  return (
                    <td key={year} className={clsx(
                      "p-3 text-center",
                      estYield > 0 ? "text-tv-green" : "text-tv-text-secondary"
                    )}>
                      {estYield > 0 ? `${estYield.toFixed(2)}%` : "—"}
                    </td>
                  );
                })}
              </tr>
              <tr className="hover:bg-tv-border/50">
                <td className="p-3 text-tv-text-secondary sticky left-0 bg-tv-bg-secondary">
                  Payment count
                </td>
                {displayYears.map((year) => (
                  <td key={year} className="p-3 text-center text-white">
                    {dividendsByYear[year]?.count || "—"}
                  </td>
                ))}
              </tr>
              {payoutRatio !== undefined && (
                <tr className="hover:bg-tv-border/50">
                  <td className="p-3 text-tv-text-secondary sticky left-0 bg-tv-bg-secondary">
                    Payout ratio (FY) %
                  </td>
                  {displayYears.map((year, i) => (
                    <td key={year} className="p-3 text-center text-white">
                      {i === 0 ? `${payoutRatio.toFixed(1)}%` : "—"}
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Dividend Payment History */}
      {sortedDividends.length > 0 ? (
        <div className="bg-tv-bg-secondary rounded-lg border border-tv-border overflow-hidden">
          <div className="p-4 border-b border-tv-border">
            <h3 className="text-sm font-semibold text-white">Dividend Payment History</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-tv-border text-tv-text-secondary text-xs uppercase tracking-wider">
              <tr>
                <th className="p-3 text-left font-medium">Ex-Dividend Date</th>
                <th className="p-3 text-right font-medium">Amount</th>
                <th className="p-3 text-center font-medium">Frequency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tv-border">
              {sortedDividends.slice(0, 20).map((div, i) => (
                <tr key={`${div.date}-${i}`} className="hover:bg-tv-border/50 transition-colors">
                  <td className="p-3 text-white">{div.date}</td>
                  <td className="p-3 text-right text-white font-medium">
                    ${div.dividend.toFixed(4)}
                  </td>
                  <td className="p-3 text-center text-tv-text-secondary">
                    {frequencyLabel}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-tv-bg-secondary rounded-lg border border-tv-border p-8 text-center">
          <div className="text-tv-text-secondary">
            No dividend history available. This stock may not pay dividends.
          </div>
        </div>
      )}
    </div>
  );
}
