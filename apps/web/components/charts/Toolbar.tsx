"use client";

import { clsx } from "clsx";

interface Symbol {
  id: number;
  displayName: string;
}

interface ToolbarProps {
  symbols: Symbol[];
  selectedSymbolId: number | null;
  onSymbolChange: (symbolId: number) => void;
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
}

const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1d"];

export function Toolbar({
  symbols,
  selectedSymbolId,
  onSymbolChange,
  timeframe,
  onTimeframeChange,
}: ToolbarProps) {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-white/10 bg-black/20 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Symbol</span>
        <div className="relative">
          <select
            value={selectedSymbolId ?? ""}
            onChange={(e) => onSymbolChange(Number(e.target.value))}
            className="appearance-none bg-transparent border border-white/20 rounded-none px-4 py-1 text-sm font-bold text-white focus:outline-none focus:border-blue-500 transition-colors uppercase cursor-pointer hover:bg-white/5"
          >
            {symbols.length === 0 && (
              <option value="" className="bg-zinc-900 text-white">Loading...</option>
            )}
            {symbols.map((s) => (
              <option key={s.id} value={s.id} className="bg-zinc-900 text-white">
                {s.displayName}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-400">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
        </div>
      </div>

      <div className="h-6 w-px bg-white/10 mx-2" />

      <div className="flex items-center gap-1">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf}
            onClick={() => onTimeframeChange(tf)}
            className={clsx(
              "px-3 py-1 text-xs font-mono font-bold uppercase transition-all duration-200 border",
              timeframe === tf
                ? "bg-blue-600 border-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)]"
                : "bg-transparent border-transparent text-zinc-400 hover:text-white hover:border-white/20"
            )}
          >
            {tf}
          </button>
        ))}
      </div>
    </div>
  );
}
