"use client";

import { useState } from "react";
import { X, Search, Star, TrendingUp, Activity, BarChart3, Waves, Hash } from "lucide-react";
import { clsx } from "clsx";

interface IndicatorConfig {
  id: string;
  name: string;
  shortName: string;
  category: string;
  description: string;
  defaultParams: Record<string, number>;
  color: string;
  paneType: "overlay" | "separate";
}

const INDICATORS: IndicatorConfig[] = [
  {
    id: "sma",
    name: "Simple Moving Average",
    shortName: "SMA",
    category: "Moving Averages",
    description: "The average price over a specified period",
    defaultParams: { length: 20 },
    color: "#f59e0b",
    paneType: "overlay",
  },
  {
    id: "ema",
    name: "Exponential Moving Average",
    shortName: "EMA",
    category: "Moving Averages",
    description: "Weighted moving average giving more weight to recent prices",
    defaultParams: { length: 20 },
    color: "#3b82f6",
    paneType: "overlay",
  },
  {
    id: "rsi",
    name: "Relative Strength Index",
    shortName: "RSI",
    category: "Oscillators",
    description: "Momentum oscillator measuring speed and change of price movements",
    defaultParams: { length: 14 },
    color: "#8b5cf6",
    paneType: "separate",
  },
  {
    id: "macd",
    name: "Moving Average Convergence Divergence",
    shortName: "MACD",
    category: "Oscillators",
    description: "Trend-following momentum indicator",
    defaultParams: { fast: 12, slow: 26, signal: 9 },
    color: "#06b6d4",
    paneType: "separate",
  },
  {
    id: "bbands",
    name: "Bollinger Bands",
    shortName: "BB",
    category: "Volatility",
    description: "Volatility bands placed above and below a moving average",
    defaultParams: { length: 20, stdDev: 2 },
    color: "#10b981",
    paneType: "overlay",
  },
  {
    id: "vwap",
    name: "Volume Weighted Average Price",
    shortName: "VWAP",
    category: "Volume",
    description: "Average price weighted by volume",
    defaultParams: {},
    color: "#ec4899",
    paneType: "overlay",
  },
  {
    id: "atr",
    name: "Average True Range",
    shortName: "ATR",
    category: "Volatility",
    description: "Measures market volatility",
    defaultParams: { length: 14 },
    color: "#f97316",
    paneType: "separate",
  },
  {
    id: "stoch",
    name: "Stochastic Oscillator",
    shortName: "STOCH",
    category: "Oscillators",
    description: "Momentum indicator comparing closing price to price range",
    defaultParams: { k: 14, d: 3, smooth: 3 },
    color: "#a855f7",
    paneType: "separate",
  },
  {
    id: "adx",
    name: "Average Directional Index",
    shortName: "ADX",
    category: "Trend",
    description: "Measures trend strength",
    defaultParams: { length: 14 },
    color: "#22c55e",
    paneType: "separate",
  },
  {
    id: "cci",
    name: "Commodity Channel Index",
    shortName: "CCI",
    category: "Oscillators",
    description: "Identifies cyclical trends",
    defaultParams: { length: 20 },
    color: "#eab308",
    paneType: "separate",
  },
  {
    id: "obv",
    name: "On Balance Volume",
    shortName: "OBV",
    category: "Volume",
    description: "Uses volume flow to predict price changes",
    defaultParams: {},
    color: "#14b8a6",
    paneType: "separate",
  },
  {
    id: "ichimoku",
    name: "Ichimoku Cloud",
    shortName: "ICHIMOKU",
    category: "Trend",
    description: "Shows support, resistance, momentum, and trend direction",
    defaultParams: { conversion: 9, base: 26, span: 52, displacement: 26 },
    color: "#6366f1",
    paneType: "overlay",
  },
];

const CATEGORIES = [
  { id: "all", name: "All", icon: <BarChart3 className="w-4 h-4" /> },
  { id: "favorites", name: "Favorites", icon: <Star className="w-4 h-4" /> },
  { id: "Moving Averages", name: "Moving Averages", icon: <TrendingUp className="w-4 h-4" /> },
  { id: "Oscillators", name: "Oscillators", icon: <Activity className="w-4 h-4" /> },
  { id: "Volatility", name: "Volatility", icon: <Waves className="w-4 h-4" /> },
  { id: "Volume", name: "Volume", icon: <BarChart3 className="w-4 h-4" /> },
  { id: "Trend", name: "Trend", icon: <Hash className="w-4 h-4" /> },
];

interface ActiveIndicator {
  id: string;
  indicatorId: string;
  params: Record<string, number>;
  color: string;
}

interface IndicatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeIndicators: ActiveIndicator[];
  onAddIndicator: (indicator: IndicatorConfig, params: Record<string, number>) => void;
  onRemoveIndicator: (id: string) => void;
}

export function IndicatorModal({
  isOpen,
  onClose,
  activeIndicators,
  onAddIndicator,
  onRemoveIndicator,
}: IndicatorModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [favorites, setFavorites] = useState<string[]>(["ema", "rsi", "macd"]);
  const [selectedIndicator, setSelectedIndicator] = useState<IndicatorConfig | null>(null);
  const [params, setParams] = useState<Record<string, number>>({});

  if (!isOpen) return null;

  const filteredIndicators = INDICATORS.filter((ind) => {
    const matchesSearch =
      ind.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ind.shortName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" ||
      (selectedCategory === "favorites" && favorites.includes(ind.id)) ||
      ind.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddIndicator = (indicator: IndicatorConfig) => {
    const indicatorParams = { ...indicator.defaultParams, ...params };
    onAddIndicator(indicator, indicatorParams);
    setSelectedIndicator(null);
    setParams({});
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-tv-bg-secondary border border-tv-border rounded-lg shadow-2xl w-[700px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-tv-border">
          <h2 className="text-lg font-semibold text-white">Indicators</h2>
          <button
            onClick={onClose}
            className="p-1 text-tv-text-secondary hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-tv-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tv-text-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search indicators..."
              className="w-full pl-10 pr-4 py-2 bg-tv-border text-white text-sm rounded focus:outline-none focus:ring-1 focus:ring-tv-blue"
              autoFocus
            />
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Categories */}
          <div className="w-48 border-r border-tv-border py-2 overflow-y-auto">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={clsx(
                  "w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors",
                  selectedCategory === cat.id
                    ? "bg-tv-blue/20 text-tv-blue"
                    : "text-tv-text-secondary hover:text-white hover:bg-tv-border"
                )}
              >
                {cat.icon}
                <span>{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Indicator List */}
          <div className="flex-1 overflow-y-auto">
            {selectedIndicator ? (
              /* Indicator Config */
              <div className="p-4">
                <button
                  onClick={() => setSelectedIndicator(null)}
                  className="text-tv-text-secondary hover:text-white text-sm mb-4"
                >
                  &larr; Back to list
                </button>

                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedIndicator.color }}
                  />
                  <h3 className="text-lg font-semibold text-white">
                    {selectedIndicator.name}
                  </h3>
                </div>

                <p className="text-sm text-tv-text-secondary mb-6">
                  {selectedIndicator.description}
                </p>

                {/* Parameters */}
                <div className="space-y-4 mb-6">
                  {Object.entries(selectedIndicator.defaultParams).map(([key, defaultValue]) => (
                    <div key={key}>
                      <label className="block text-sm text-tv-text-secondary mb-1 capitalize">
                        {key}
                      </label>
                      <input
                        type="number"
                        value={params[key] ?? defaultValue}
                        onChange={(e) =>
                          setParams({ ...params, [key]: parseInt(e.target.value) || defaultValue })
                        }
                        className="w-full px-3 py-2 bg-tv-border text-white text-sm rounded focus:outline-none focus:ring-1 focus:ring-tv-blue"
                      />
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleAddIndicator(selectedIndicator)}
                  className="w-full py-2 bg-tv-blue hover:bg-tv-blue/80 text-white font-medium rounded transition-colors"
                >
                  Add Indicator
                </button>
              </div>
            ) : (
              /* Indicator Grid */
              <div className="p-2">
                {filteredIndicators.map((indicator) => {
                  const isActive = activeIndicators.some((a) => a.indicatorId === indicator.id);
                  const isFavorite = favorites.includes(indicator.id);

                  return (
                    <div
                      key={indicator.id}
                      onClick={() => setSelectedIndicator(indicator)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedIndicator(indicator);
                        }
                      }}
                      className={clsx(
                        "w-full flex items-center gap-3 px-3 py-3 rounded transition-colors cursor-pointer",
                        isActive
                          ? "bg-tv-blue/10 border border-tv-blue/30"
                          : "hover:bg-tv-border"
                      )}
                    >
                      <div
                        className="w-2 h-8 rounded-full"
                        style={{ backgroundColor: indicator.color }}
                      />
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium text-sm">
                            {indicator.name}
                          </span>
                          <span className="text-tv-text-secondary text-xs">
                            {indicator.shortName}
                          </span>
                        </div>
                        <div className="text-tv-text-secondary text-xs">{indicator.category}</div>
                      </div>
                      <button
                        onClick={(e) => toggleFavorite(indicator.id, e)}
                        className={clsx(
                          "p-1 transition-colors",
                          isFavorite
                            ? "text-yellow-400"
                            : "text-tv-text-secondary hover:text-yellow-400"
                        )}
                      >
                        <Star className="w-4 h-4" fill={isFavorite ? "currentColor" : "none"} />
                      </button>
                      {isActive && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const active = activeIndicators.find(
                              (a) => a.indicatorId === indicator.id
                            );
                            if (active) onRemoveIndicator(active.id);
                          }}
                          className="p-1 text-tv-red hover:bg-tv-red/20 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Active Indicators Footer */}
        {activeIndicators.length > 0 && (
          <div className="px-4 py-3 border-t border-tv-border">
            <div className="text-xs text-tv-text-secondary mb-2">Active Indicators</div>
            <div className="flex flex-wrap gap-2">
              {activeIndicators.map((active) => {
                const indicator = INDICATORS.find((i) => i.id === active.indicatorId);
                return (
                  <div
                    key={active.id}
                    className="flex items-center gap-2 px-2 py-1 bg-tv-border rounded text-xs"
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: active.color }}
                    />
                    <span className="text-white">
                      {indicator?.shortName}
                      {Object.values(active.params).length > 0 &&
                        `(${Object.values(active.params).join(",")})`}
                    </span>
                    <button
                      onClick={() => onRemoveIndicator(active.id)}
                      className="text-tv-text-secondary hover:text-tv-red"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export { INDICATORS, type IndicatorConfig, type ActiveIndicator };
