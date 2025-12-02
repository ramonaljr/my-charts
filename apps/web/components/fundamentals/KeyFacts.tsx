import { FmpProfile, FmpRatiosRow, FmpQuote } from "@/lib/api/client";

interface KeyFactsProps {
  profile?: FmpProfile;
  ratios?: FmpRatiosRow[];
  quote?: FmpQuote | null;
}

// Helper to format large numbers
function formatNumber(value: number | undefined | null): string {
  if (!value) return "-";
  if (Math.abs(value) >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toFixed(2)}`;
}

export function KeyFacts({ profile, ratios, quote }: KeyFactsProps) {
  if (!profile) return null;

  const latestRatios = ratios?.[0]?.data;

  // Get market cap from quote first, fallback to profile
  const marketCap = quote?.marketCap || profile.mktCap;

  // Get P/E from quote first, fallback to ratios
  const pe = quote?.pe || (latestRatios?.priceEarningsRatio ? Number(latestRatios.priceEarningsRatio) : undefined);

  // Get EPS from quote first
  const eps = quote?.eps || (latestRatios?.netIncomePerShare ? Number(latestRatios.netIncomePerShare) : undefined);

  // Calculate dividend yield from profile data
  const divYield = profile.lastDiv && profile.price
    ? (Number(profile.lastDiv) / Number(profile.price)) * 100
    : (latestRatios?.dividendYield ? Number(latestRatios.dividendYield) * 100 : undefined);

  const facts = [
    {
      label: "Market capitalization",
      value: marketCap ? formatNumber(marketCap) : "-",
      sub: "USD",
    },
    {
      label: "Dividend yield (indicated)",
      value: divYield !== undefined ? `${divYield.toFixed(2)}%` : "-",
      sub: "",
    },
    {
      label: "Price to earnings Ratio (TTM)",
      value: pe !== undefined ? pe.toFixed(2) : "-",
      sub: "",
    },
    {
      label: "Basic EPS (TTM)",
      value: eps !== undefined ? eps.toFixed(2) : "-",
      sub: "USD",
    },
    {
      label: "52 Week Range",
      value: profile.range || (quote ? `${quote.yearLow?.toFixed(2)} - ${quote.yearHigh?.toFixed(2)}` : "-"),
      sub: "",
    },
    {
      label: "Employees (FY)",
      value: profile.fullTimeEmployees
        ? Number(profile.fullTimeEmployees) >= 1000
          ? `${(Number(profile.fullTimeEmployees) / 1000).toFixed(0)}K`
          : profile.fullTimeEmployees
        : "-",
      sub: "",
    },
    {
      label: "CEO",
      value: profile.ceo || "-",
      sub: "",
    },
    {
      label: "Website",
      value: profile.website?.replace(/^https?:\/\//, "") || "-",
      sub: "",
      link: profile.website,
    },
  ];

  return (
    <div className="mb-12">
      <h3 className="text-lg font-bold text-white mb-6">Key facts</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-8">
        {facts.map((fact) => (
          <div key={fact.label}>
            <div className="text-xs font-medium text-zinc-400 mb-1">
              {fact.label}
            </div>
            <div className="flex items-baseline gap-1">
              {fact.link ? (
                <a
                  href={fact.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-bold text-blue-400 hover:underline flex items-center gap-1"
                >
                  {fact.value}
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              ) : (
                <div className="text-lg font-bold text-white">{fact.value}</div>
              )}
              {fact.sub && (
                <span className="text-xs text-zinc-500 font-medium">
                  {fact.sub}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
