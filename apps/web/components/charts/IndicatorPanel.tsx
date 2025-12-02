"use client";

import { clsx } from "clsx";

interface IndicatorPanelProps {
  indicators: string[];
  onToggle: (indicator: string) => void;
}

const AVAILABLE_INDICATORS = [
  { id: "ema:20", label: "EMA(20)", color: "#3b82f6" },
  { id: "ema:50", label: "EMA(50)", color: "#8b5cf6" },
  { id: "sma:20", label: "SMA(20)", color: "#f59e0b" },
  { id: "sma:50", label: "SMA(50)", color: "#ec4899" },
  { id: "rsi:14", label: "RSI(14)", color: "#06b6d4" },
  { id: "bbands:20", label: "BB(20)", color: "#10b981" },
];

export function IndicatorPanel({ indicators, onToggle }: IndicatorPanelProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-800 bg-zinc-900/30">
      <span className="text-xs text-zinc-500 mr-2">Indicators:</span>
      {AVAILABLE_INDICATORS.map((ind) => {
        const isActive = indicators.includes(ind.id);
        return (
          <button
            key={ind.id}
            onClick={() => onToggle(ind.id)}
            className={clsx(
              "px-2 py-1 text-xs rounded transition-all",
              isActive
                ? "text-white"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
            )}
            style={isActive ? { backgroundColor: ind.color } : undefined}
          >
            {ind.label}
          </button>
        );
      })}
    </div>
  );
}
