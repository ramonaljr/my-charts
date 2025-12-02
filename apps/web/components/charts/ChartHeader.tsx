"use client";

import { useState } from "react";
import { clsx } from "clsx";
import {
  Search,
  Plus,
  ChevronDown,
  Bell,
  RotateCcw,
  Undo2,
  Redo2,
  Layout,
  Settings,
  Maximize,
} from "lucide-react";
import { ProfileMenu } from "@/components/ProfileMenu";

interface Symbol {
  id: number;
  displayName: string;
  assetClass: string;
}

interface ChartHeaderProps {
  symbols: Symbol[];
  selectedSymbol: Symbol | null;
  onSymbolChange: (symbolId: number) => void;
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
  ohlcv: {
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    change: number;
    changePercent: number;
  } | null;
  onIndicatorsClick: () => void;
  onAlertClick: () => void;
}

const TIMEFRAMES = [
  { label: "1m", value: "1m" },
  { label: "5m", value: "5m" },
  { label: "15m", value: "15m" },
  { label: "1h", value: "1h" },
  { label: "4h", value: "4h" },
  { label: "D", value: "1d" },
  { label: "W", value: "1w" },
  { label: "M", value: "1M" },
];

export function ChartHeader({
  symbols,
  selectedSymbol,
  onSymbolChange,
  timeframe,
  onTimeframeChange,
  ohlcv,
  onIndicatorsClick,
  onAlertClick,
}: ChartHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSymbols = symbols.filter(
    (s) =>
      s.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.assetClass.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatNumber = (num: number, decimals = 5) => {
    if (num >= 1000000000) return (num / 1000000000).toFixed(2) + "B";
    if (num >= 1000000) return (num / 1000000).toFixed(2) + "M";
    if (num >= 1000) return (num / 1000).toFixed(2) + "K";
    return num.toFixed(decimals);
  };

  return (
    <div className="flex flex-col border-b border-tv-border">
      {/* Top Bar */}
      <div className="flex items-center h-12 px-2 bg-tv-bg-secondary border-b border-tv-border">
        {/* Profile Menu */}
        <ProfileMenu />

        <div className="w-px h-6 bg-tv-border mx-2" />

        {/* Symbol Selector */}
        <div className="relative">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-tv-border rounded transition-colors"
          >
            <Search className="w-4 h-4 text-tv-text-secondary" />
            <span className="font-bold text-white text-sm">
              {selectedSymbol?.displayName || "Select Symbol"}
            </span>
            <ChevronDown className="w-4 h-4 text-tv-text-secondary" />
          </button>

          {searchOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-tv-bg-secondary border border-tv-border rounded-lg shadow-xl z-50">
              <div className="p-2 border-b border-tv-border">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search symbols..."
                  className="w-full px-3 py-2 bg-tv-border text-white text-sm rounded focus:outline-none focus:ring-1 focus:ring-tv-blue"
                  autoFocus
                />
              </div>
              <div className="max-h-64 overflow-y-auto">
                {filteredSymbols.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      onSymbolChange(s.id);
                      setSearchOpen(false);
                      setSearchQuery("");
                    }}
                    className={clsx(
                      "w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-tv-border transition-colors",
                      selectedSymbol?.id === s.id
                        ? "bg-tv-blue/20 text-tv-blue"
                        : "text-white"
                    )}
                  >
                    <span className="font-medium">{s.displayName}</span>
                    <span className="text-xs text-tv-text-secondary">{s.assetClass}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Add Symbol */}
        <button className="p-2 hover:bg-tv-border rounded transition-colors ml-1">
          <Plus className="w-4 h-4 text-tv-text-secondary" />
        </button>

        <div className="w-px h-6 bg-tv-border mx-2" />

        {/* Timeframes */}
        <div className="flex items-center">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              onClick={() => onTimeframeChange(tf.value)}
              className={clsx(
                "px-2 py-1 text-xs font-medium transition-colors rounded",
                timeframe === tf.value
                  ? "bg-tv-blue text-white"
                  : "text-tv-text-secondary hover:text-white hover:bg-tv-border"
              )}
            >
              {tf.label}
            </button>
          ))}
          <button className="p-1 ml-1 hover:bg-tv-border rounded transition-colors">
            <ChevronDown className="w-4 h-4 text-tv-text-secondary" />
          </button>
        </div>

        <div className="w-px h-6 bg-tv-border mx-2" />

        {/* Compare */}
        <button className="flex items-center gap-1 px-2 py-1 text-xs text-tv-text-secondary hover:text-white hover:bg-tv-border rounded transition-colors">
          <span>Compare</span>
        </button>

        <div className="w-px h-6 bg-tv-border mx-2" />

        {/* Indicators */}
        <button
          onClick={onIndicatorsClick}
          className="flex items-center gap-1 px-2 py-1 text-xs text-tv-text-secondary hover:text-white hover:bg-tv-border rounded transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 17h4v-6H3v6zm6 0h4V7H9v10zm6 0h4v-4h-4v4z" />
          </svg>
          <span>Indicators</span>
        </button>

        <div className="w-px h-6 bg-tv-border mx-2" />

        {/* Templates / Layout */}
        <button className="flex items-center gap-1 px-2 py-1 text-xs text-tv-text-secondary hover:text-white hover:bg-tv-border rounded transition-colors">
          <Layout className="w-4 h-4" />
        </button>

        {/* Alert */}
        <button
          onClick={onAlertClick}
          className="flex items-center gap-1 px-2 py-1 text-xs text-tv-text-secondary hover:text-white hover:bg-tv-border rounded transition-colors ml-2"
        >
          <Bell className="w-4 h-4" />
          <span>Alert</span>
        </button>

        {/* Replay */}
        <button className="flex items-center gap-1 px-2 py-1 text-xs text-tv-text-secondary hover:text-white hover:bg-tv-border rounded transition-colors ml-2">
          <RotateCcw className="w-4 h-4" />
          <span>Replay</span>
        </button>

        {/* Undo/Redo */}
        <div className="flex items-center ml-auto">
          <button className="p-2 hover:bg-tv-border rounded transition-colors text-tv-text-secondary hover:text-white">
            <Undo2 className="w-4 h-4" />
          </button>
          <button className="p-2 hover:bg-tv-border rounded transition-colors text-tv-text-secondary hover:text-white">
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-6 bg-tv-border mx-2" />

        {/* Layout Options */}
        <button className="p-2 hover:bg-tv-border rounded transition-colors text-tv-text-secondary hover:text-white">
          <Layout className="w-4 h-4" />
        </button>

        {/* Settings */}
        <button className="p-2 hover:bg-tv-border rounded transition-colors text-tv-text-secondary hover:text-white">
          <Settings className="w-4 h-4" />
        </button>

        {/* Fullscreen */}
        <button className="p-2 hover:bg-tv-border rounded transition-colors text-tv-text-secondary hover:text-white">
          <Maximize className="w-4 h-4" />
        </button>
      </div>

      {/* OHLCV Info Bar */}
      <div className="flex items-center h-8 px-3 bg-tv-bg text-xs">
        <div className="flex items-center gap-1">
          <span className="text-tv-text-secondary">O</span>
          <span className="text-white font-medium">
            {ohlcv ? formatNumber(ohlcv.open) : "--"}
          </span>
        </div>
        <div className="flex items-center gap-1 ml-3">
          <span className="text-tv-text-secondary">H</span>
          <span className="text-tv-green font-medium">
            {ohlcv ? formatNumber(ohlcv.high) : "--"}
          </span>
        </div>
        <div className="flex items-center gap-1 ml-3">
          <span className="text-tv-text-secondary">L</span>
          <span className="text-tv-red font-medium">
            {ohlcv ? formatNumber(ohlcv.low) : "--"}
          </span>
        </div>
        <div className="flex items-center gap-1 ml-3">
          <span className="text-tv-text-secondary">C</span>
          <span
            className={clsx(
              "font-medium",
              ohlcv && ohlcv.change >= 0 ? "text-tv-green" : "text-tv-red"
            )}
          >
            {ohlcv ? formatNumber(ohlcv.close) : "--"}
          </span>
        </div>
        <div className="flex items-center gap-1 ml-3">
          <span
            className={clsx(
              "font-medium",
              ohlcv && ohlcv.change >= 0 ? "text-tv-green" : "text-tv-red"
            )}
          >
            {ohlcv
              ? `${ohlcv.change >= 0 ? "+" : ""}${formatNumber(ohlcv.change)} (${ohlcv.changePercent >= 0 ? "+" : ""}${ohlcv.changePercent.toFixed(2)}%)`
              : "--"}
          </span>
        </div>
        <div className="flex items-center gap-1 ml-4">
          <span className="text-tv-text-secondary">Vol</span>
          <span className="text-white font-medium">
            {ohlcv ? formatNumber(ohlcv.volume, 0) : "--"}
          </span>
        </div>
      </div>
    </div>
  );
}
