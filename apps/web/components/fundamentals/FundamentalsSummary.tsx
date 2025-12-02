import { FmpProfile, FmpRatiosRow, FmpQuote } from "@/lib/api/client";

interface FundamentalsSummaryProps {
  profile?: FmpProfile;
  ratios?: FmpRatiosRow[];
  quote?: FmpQuote | null;
  income?: Array<{ fiscalDate: string; period: string; data: Record<string, unknown> }>;
}

// Helper to format large numbers
function formatMarketCap(value: number | undefined | null): string {
  if (!value) return "-";
  if (Math.abs(value) >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toFixed(2)}`;
}

export function FundamentalsSummary({ profile, ratios, quote, income }: FundamentalsSummaryProps) {
  if (!profile) return null;

  // Get market cap from quote first, fallback to profile
  const marketCap = quote?.marketCap || profile.mktCap;

  // Extract P/E and P/S from ratios with dates for historical chart
  const valuationData = ratios
    ?.filter((r) => r.fiscalDate && r.data)
    .slice(0, 5)
    .reverse()
    .map((r) => ({
      date: (r.fiscalDate ?? "").slice(0, 4) || r.period,
      pe: Number(r.data.priceEarningsRatio || r.data.trailingPE || 0),
      ps: Number(r.data.priceToSalesRatio || r.data.priceToSalesTrailing12Months || 0),
    })) || [];

  // Add current values from quote if available
  if (quote && valuationData.length > 0) {
    const currentYear = new Date().getFullYear().toString();
    const lastEntry = valuationData[valuationData.length - 1];
    const quoteAsUnknown = quote as unknown as Record<string, unknown>;
    if (lastEntry.date !== currentYear && (quote.pe || quoteAsUnknown.priceToSales)) {
      valuationData.push({
        date: currentYear,
        pe: quote.pe || 0,
        ps: (quoteAsUnknown.priceToSales as number) || 0,
      });
    }
  }

  const maxPe = Math.max(...valuationData.map((d) => d.pe).filter(v => v > 0), 50);
  const maxPs = Math.max(...valuationData.map((d) => d.ps).filter(v => v > 0), 50);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
      {/* Market Cap Section */}
      <div className="glass-panel p-6 rounded-2xl">
        <h3 className="text-lg font-bold text-white mb-6">Summary</h3>
        <div className="flex items-center gap-8">
          <div className="relative w-48 h-48 shrink-0">
            {/* Simple Radial Chart SVG */}
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#333"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="8"
                strokeDasharray="251.2"
                strokeDashoffset="60" // 75% filled roughly
                className="text-blue-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <div className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-1">
                Market Cap
              </div>
              <div className="text-xl font-bold text-white">
                {formatMarketCap(marketCap)}
              </div>
              <div className="text-xs text-zinc-500">USD</div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm text-zinc-300">Market Cap</span>
              <span className="text-sm font-bold text-white ml-auto">
                {formatMarketCap(marketCap)}
              </span>
            </div>
            {quote && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm text-zinc-300">Price</span>
                  <span className="text-sm font-bold text-white ml-auto">
                    ${quote.price?.toFixed(2) || "-"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="text-sm text-zinc-300">P/E Ratio</span>
                  <span className="text-sm font-bold text-white ml-auto">
                    {quote.pe?.toFixed(2) || "-"}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Valuation Ratios Section */}
      <div className="glass-panel p-6 rounded-2xl">
        <h3 className="text-lg font-bold text-white mb-6">Valuation ratios</h3>
        <div className="h-48 w-full relative">
          {valuationData.length > 0 ? (
            <svg viewBox="0 0 100 50" className="w-full h-full" preserveAspectRatio="none">
              {/* Grid lines */}
              <line x1="0" y1="0" x2="100" y2="0" stroke="#333" strokeWidth="0.5" />
              <line x1="0" y1="25" x2="100" y2="25" stroke="#333" strokeWidth="0.5" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="#333" strokeWidth="0.5" />

              {/* P/E Line (Orange) */}
              <polyline
                points={valuationData
                  .map(
                    (d, i) =>
                      `${(i / (valuationData.length - 1)) * 100},${
                        50 - (d.pe / maxPe) * 50
                      }`
                  )
                  .join(" ")}
                fill="none"
                stroke="#f97316"
                strokeWidth="2"
              />

              {/* P/S Line (Blue) */}
              <polyline
                points={valuationData
                  .map(
                    (d, i) =>
                      `${(i / (valuationData.length - 1)) * 100},${
                        50 - (d.ps / maxPs) * 50
                      }`
                  )
                  .join(" ")}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
              />
            </svg>
          ) : (
            <div className="flex items-center justify-center h-full text-zinc-500">
              No valuation data available
            </div>
          )}
          
          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 justify-center">
             <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-sm text-zinc-300">P/E</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm text-zinc-300">P/S</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
