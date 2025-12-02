interface RevenueBreakdownProps {
  revenueProduct?: Record<string, number>[];
  revenueGeo?: Record<string, number>[];
}

export function RevenueBreakdown({ revenueProduct, revenueGeo }: RevenueBreakdownProps) {
  if (!revenueProduct?.length && !revenueGeo?.length) return null;

  // Take the most recent period
  const latestProduct = revenueProduct?.[0] || {};
  const latestGeo = revenueGeo?.[0] || {};

  // Filter out non-numeric keys like 'date', 'symbol', 'period' if they exist in the record
  // FMP usually returns clean objects but let's be safe if we typed it as Record<string, number>
  // Actually the type is Record<string, number> but let's assume keys are segments.
  
  const productSegments = Object.entries(latestProduct)
    .filter(([key]) => !["date", "symbol", "period"].includes(key))
    .map(([key, value]) => ({ name: key, value: Number(value) }))
    .sort((a, b) => b.value - a.value);

  const geoSegments = Object.entries(latestGeo)
    .filter(([key]) => !["date", "symbol", "period"].includes(key))
    .map(([key, value]) => ({ name: key, value: Number(value) }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="mb-12">
      <h3 className="text-lg font-bold text-white mb-6">Revenue breakdown</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {productSegments.length > 0 && (
          <div className="glass-panel p-6 rounded-2xl">
            <h4 className="text-sm font-bold text-white mb-6">By Product</h4>
            <div className="space-y-4">
              {productSegments.map((segment) => (
                <div key={segment.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-300">{segment.name}</span>
                    <span className="text-white font-bold">
                      ${(segment.value / 1e9).toFixed(2)}B
                    </span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{
                        width: `${(segment.value / productSegments[0].value) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {geoSegments.length > 0 && (
          <div className="glass-panel p-6 rounded-2xl">
            <h4 className="text-sm font-bold text-white mb-6">By Region</h4>
            <div className="space-y-4">
              {geoSegments.map((segment) => (
                <div key={segment.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-300">{segment.name}</span>
                    <span className="text-white font-bold">
                      ${(segment.value / 1e9).toFixed(2)}B
                    </span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{
                        width: `${(segment.value / geoSegments[0].value) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
