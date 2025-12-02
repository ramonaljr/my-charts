"use client";

import { clsx } from "clsx";
import { useState, useEffect } from "react";

interface TimeframeSelectorProps {
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
}

const TIMEFRAME_PRESETS = [
  { label: "1D", value: "1d-range" },
  { label: "5D", value: "5d-range" },
  { label: "1M", value: "1m-range" },
  { label: "3M", value: "3m-range" },
  { label: "6M", value: "6m-range" },
  { label: "YTD", value: "ytd" },
  { label: "1Y", value: "1y-range" },
  { label: "5Y", value: "5y-range" },
  { label: "All", value: "all" },
];

function formatTime() {
  return new Date().toLocaleString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function TimeframeSelector({ timeframe, onTimeframeChange }: TimeframeSelectorProps) {
  const [currentTime, setCurrentTime] = useState<string | null>(null);

  useEffect(() => {
    setCurrentTime(formatTime());
    const interval = setInterval(() => {
      setCurrentTime(formatTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center h-8 px-4 bg-[#131722] border-t border-tv-border text-xs">
      <div className="flex items-center gap-1">
        {TIMEFRAME_PRESETS.map((preset) => (
          <button
            key={preset.value}
            onClick={() => onTimeframeChange(preset.value)}
            className={clsx(
              "px-2 py-1 rounded transition-colors",
              timeframe === preset.value
                ? "bg-tv-blue text-white"
                : "text-tv-text-secondary hover:text-white hover:bg-tv-border"
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="ml-4 flex items-center gap-2">
        <button className="p-1 text-tv-text-secondary hover:text-white">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
        </button>
        <span className="text-tv-text-secondary">
          {currentTime ?? "--:--:--"}
        </span>
        <span className="text-tv-text-secondary">UTC+8</span>
      </div>
    </div>
  );
}
