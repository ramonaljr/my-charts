import { FmpRatiosRow } from "@/lib/api/client";

interface IncomeRow {
  fiscalDate: string;
  period: string;
  data: Record<string, unknown>;
}

interface GrowthProfitabilityProps {
  ratios?: FmpRatiosRow[];
  income?: IncomeRow[];
}

// Helper to format large numbers
function formatCurrency(value: number | undefined | null): string {
  if (!value) return "-";
  if (Math.abs(value) >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  return `$${value.toFixed(2)}`;
}

export function GrowthProfitability({ ratios, income }: GrowthProfitabilityProps) {
  // Filter to only show annual data (FY period) and get most recent 5 years
  const annualIncome = income
    ?.filter(item => item.period === "FY")
    .sort((a, b) => new Date(a.fiscalDate).getTime() - new Date(b.fiscalDate).getTime())
    .slice(-5) || [];

  // Map the data with proper field access
  const performanceData = annualIncome.map(item => {
    const rev = (item.data.revenue as number) || (item.data.totalRevenue as number) || 0;
    const netInc = (item.data.netIncome as number) || 0;
    const year = item.fiscalDate ? new Date(item.fiscalDate).getFullYear().toString() : item.period;

    return {
      period: year,
      revenue: rev,
      netIncome: netInc,
      netMargin: rev > 0 ? (netInc / rev) * 100 : 0,
    };
  });

  // Get max values for scaling
  const maxRevenue = Math.max(...performanceData.map(d => d.revenue), 1);
  const maxNetIncome = Math.max(...performanceData.map(d => d.netIncome), 1);

  // Calculate growth rates
  const revenueGrowth = performanceData.length >= 2
    ? ((performanceData[performanceData.length - 1].revenue / performanceData[performanceData.length - 2].revenue) - 1) * 100
    : 0;
  const netIncomeGrowth = performanceData.length >= 2
    ? ((performanceData[performanceData.length - 1].netIncome / performanceData[performanceData.length - 2].netIncome) - 1) * 100
    : 0;

  return (
    <div className="mb-12">
      <h3 className="text-lg font-bold text-white mb-6">Growth and Profitability</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance Chart */}
        <div className="glass-panel p-6 rounded-2xl">
          <h4 className="text-sm font-bold text-white mb-4">Performance</h4>
          {performanceData.length > 0 ? (
            <>
              <div className="h-64 w-full flex items-end justify-between gap-2">
                {performanceData.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="relative w-full flex items-end justify-center gap-1 h-[80%]">
                      {/* Revenue Bar */}
                      <div
                        className="w-3 bg-blue-500 rounded-t-sm transition-all group-hover:opacity-80"
                        style={{ height: `${Math.min((d.revenue / maxRevenue) * 100, 100)}%` }}
                        title={`Revenue: ${formatCurrency(d.revenue)}`}
                      />
                      {/* Net Income Bar */}
                      <div
                        className="w-3 bg-cyan-400 rounded-t-sm transition-all group-hover:opacity-80"
                        style={{ height: `${Math.min((d.netIncome / maxNetIncome) * 100, 100)}%` }}
                        title={`Net Income: ${formatCurrency(d.netIncome)}`}
                      />
                    </div>
                    <span className="text-xs text-zinc-500">{d.period}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-4 justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm text-zinc-300">Revenue</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-cyan-400" />
                  <span className="text-sm text-zinc-300">Net Income</span>
                </div>
              </div>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center text-zinc-500 text-sm">
              No income data available
            </div>
          )}
        </div>

        {/* Revenue to Profit Conversion */}
        <div className="glass-panel p-6 rounded-2xl">
          <h4 className="text-sm font-bold text-white mb-4">Revenue to profit conversion</h4>
          {performanceData.length > 0 ? (
            <div className="space-y-6">
              {/* Latest year summary */}
              {performanceData.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-800/50 rounded-lg p-4">
                    <div className="text-xs text-zinc-400 mb-1">Latest Revenue</div>
                    <div className="text-xl font-bold text-white">
                      {formatCurrency(performanceData[performanceData.length - 1].revenue)}
                    </div>
                    {revenueGrowth !== 0 && (
                      <div className={`text-sm ${revenueGrowth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {revenueGrowth > 0 ? '+' : ''}{revenueGrowth.toFixed(1)}% YoY
                      </div>
                    )}
                  </div>
                  <div className="bg-zinc-800/50 rounded-lg p-4">
                    <div className="text-xs text-zinc-400 mb-1">Latest Net Income</div>
                    <div className="text-xl font-bold text-white">
                      {formatCurrency(performanceData[performanceData.length - 1].netIncome)}
                    </div>
                    {netIncomeGrowth !== 0 && (
                      <div className={`text-sm ${netIncomeGrowth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {netIncomeGrowth > 0 ? '+' : ''}{netIncomeGrowth.toFixed(1)}% YoY
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Margin chart */}
              <div>
                <div className="text-xs text-zinc-400 mb-2">Net Margin %</div>
                <div className="h-32 flex items-end gap-2">
                  {performanceData.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-purple-500 rounded-t"
                        style={{ height: `${Math.min(d.netMargin * 2, 100)}%` }}
                        title={`Net Margin: ${d.netMargin.toFixed(1)}%`}
                      />
                      <span className="text-[10px] text-zinc-500">{d.period}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-zinc-500 text-sm">
              No margin data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
