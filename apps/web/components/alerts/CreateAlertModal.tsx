"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import {
  fetchSymbols,
  createAlert,
  type Symbol,
  type Timeframe,
  type AlertOperand,
} from "@/lib/api/client";

interface CreateAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

type ConditionType = "GT" | "LT" | "CROSS_ABOVE" | "CROSS_BELOW";
type OperandType = "price" | "indicator" | "number";
type IndicatorType = "sma" | "ema" | "rsi";
type PriceSource = "open" | "high" | "low" | "close";

const TIMEFRAMES: Timeframe[] = ["1m", "5m", "15m", "1h", "4h", "1d"];
const CONDITION_TYPES: { value: ConditionType; label: string }[] = [
  { value: "GT", label: ">" },
  { value: "LT", label: "<" },
  { value: "CROSS_ABOVE", label: "Crosses Above" },
  { value: "CROSS_BELOW", label: "Crosses Below" },
];

export function CreateAlertModal({
  isOpen,
  onClose,
  onCreated,
}: CreateAlertModalProps) {
  const [symbols, setSymbols] = useState<Symbol[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [symbolId, setSymbolId] = useState<number>(0);
  const [timeframe, setTimeframe] = useState<Timeframe>("1h");
  const [conditionType, setConditionType] = useState<ConditionType>("GT");

  // Left operand
  const [leftType, setLeftType] = useState<OperandType>("price");
  const [leftPriceSource, setLeftPriceSource] = useState<PriceSource>("close");
  const [leftIndicator, setLeftIndicator] = useState<IndicatorType>("ema");
  const [leftIndicatorLength, setLeftIndicatorLength] = useState(20);

  // Right operand
  const [rightType, setRightType] = useState<OperandType>("number");
  const [rightPriceSource, setRightPriceSource] = useState<PriceSource>("close");
  const [rightIndicator, setRightIndicator] = useState<IndicatorType>("ema");
  const [rightIndicatorLength, setRightIndicatorLength] = useState(50);
  const [rightValue, setRightValue] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      fetchSymbols().then((data) => {
        setSymbols(data);
        if (data.length > 0 && symbolId === 0) {
          setSymbolId(data[0].id);
        }
      });
    }
  }, [isOpen, symbolId]);

  const buildOperand = (
    type: OperandType,
    priceSource: PriceSource,
    indicatorType: IndicatorType,
    indicatorLength: number,
    value: number
  ): AlertOperand => {
    if (type === "price") {
      return { type: "price", source: priceSource };
    }
    if (type === "indicator") {
      return {
        type: "indicator",
        indicator: {
          type: indicatorType,
          length: indicatorLength,
          source: "close",
        },
      };
    }
    return { type: "number", value };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const leftOperand = buildOperand(
        leftType,
        leftPriceSource,
        leftIndicator,
        leftIndicatorLength,
        0
      );
      const rightOperand = buildOperand(
        rightType,
        rightPriceSource,
        rightIndicator,
        rightIndicatorLength,
        rightValue
      );

      await createAlert({
        symbolId,
        timeframe,
        conditionType,
        leftOperand,
        rightOperand,
        active: true,
      });

      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create alert");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg mx-4 shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-white">Create Alert</h2>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Symbol</label>
              <select
                value={symbolId}
                onChange={(e) => setSymbolId(Number(e.target.value))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                {symbols.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.displayName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Timeframe
              </label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as Timeframe)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                {TIMEFRAMES.map((tf) => (
                  <option key={tf} value={tf}>
                    {tf}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm text-zinc-400">Left Operand</label>
            <div className="flex gap-2">
              <select
                value={leftType}
                onChange={(e) => setLeftType(e.target.value as OperandType)}
                className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="price">Price</option>
                <option value="indicator">Indicator</option>
              </select>
              {leftType === "price" && (
                <select
                  value={leftPriceSource}
                  onChange={(e) =>
                    setLeftPriceSource(e.target.value as PriceSource)
                  }
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="close">Close</option>
                  <option value="open">Open</option>
                  <option value="high">High</option>
                  <option value="low">Low</option>
                </select>
              )}
              {leftType === "indicator" && (
                <>
                  <select
                    value={leftIndicator}
                    onChange={(e) =>
                      setLeftIndicator(e.target.value as IndicatorType)
                    }
                    className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="ema">EMA</option>
                    <option value="sma">SMA</option>
                    <option value="rsi">RSI</option>
                  </select>
                  <input
                    type="number"
                    value={leftIndicatorLength}
                    onChange={(e) =>
                      setLeftIndicatorLength(Number(e.target.value))
                    }
                    className="w-20 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    min={1}
                    max={200}
                  />
                </>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Condition</label>
            <select
              value={conditionType}
              onChange={(e) => setConditionType(e.target.value as ConditionType)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            >
              {CONDITION_TYPES.map((ct) => (
                <option key={ct.value} value={ct.value}>
                  {ct.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <label className="block text-sm text-zinc-400">Right Operand</label>
            <div className="flex gap-2">
              <select
                value={rightType}
                onChange={(e) => setRightType(e.target.value as OperandType)}
                className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="number">Number</option>
                <option value="price">Price</option>
                <option value="indicator">Indicator</option>
              </select>
              {rightType === "number" && (
                <input
                  type="number"
                  value={rightValue}
                  onChange={(e) => setRightValue(Number(e.target.value))}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  step="any"
                  placeholder="Value"
                />
              )}
              {rightType === "price" && (
                <select
                  value={rightPriceSource}
                  onChange={(e) =>
                    setRightPriceSource(e.target.value as PriceSource)
                  }
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="close">Close</option>
                  <option value="open">Open</option>
                  <option value="high">High</option>
                  <option value="low">Low</option>
                </select>
              )}
              {rightType === "indicator" && (
                <>
                  <select
                    value={rightIndicator}
                    onChange={(e) =>
                      setRightIndicator(e.target.value as IndicatorType)
                    }
                    className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="ema">EMA</option>
                    <option value="sma">SMA</option>
                    <option value="rsi">RSI</option>
                  </select>
                  <input
                    type="number"
                    value={rightIndicatorLength}
                    onChange={(e) =>
                      setRightIndicatorLength(Number(e.target.value))
                    }
                    className="w-20 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    min={1}
                    max={200}
                  />
                </>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white rounded-lg transition-colors"
            >
              {loading ? "Creating..." : "Create Alert"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
