"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { ChartHeader } from "@/components/charts/ChartHeader";
import { DrawingToolsSidebar, DrawingTool } from "@/components/charts/DrawingToolsSidebar";
import { TradingChart, CandleData, IndicatorData, TradingChartHandle } from "@/components/charts/TradingChart";
import { DrawingCanvas } from "@/components/charts/DrawingCanvas";
import { IndicatorModal, INDICATORS, IndicatorConfig, ActiveIndicator } from "@/components/charts/IndicatorModal";
import { TimeframeSelector } from "@/components/charts/TimeframeSelector";
import { CreateAlertModal } from "@/components/alerts/CreateAlertModal";
import { fetchSymbols, fetchCandles, Symbol, Timeframe } from "@/lib/api/client";
import { useDrawings } from "@/hooks/useDrawings";
import {
  calculateSMA,
  calculateEMA,
  calculateBollingerBands,
  calculateRSI,
  calculateMACD,
  calculateATR,
  calculateVWAP,
  calculateStochastic,
  calculateADX,
  calculateCCI,
  calculateOBV,
  calculateIchimoku,
  Candle as CoreCandle,
} from "@nova/core";

// Indicator color palette
const INDICATOR_COLORS = [
  "#2962ff", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899",
  "#06b6d4", "#f97316", "#a855f7", "#22c55e", "#eab308",
];

export default function ChartsPage() {
  // Chart ref for accessing chart API
  const chartRef = useRef<TradingChartHandle>(null);
  const [chartReady, setChartReady] = useState(false);

  // State
  const [symbols, setSymbols] = useState<Symbol[]>([]);
  const [selectedSymbolId, setSelectedSymbolId] = useState<number | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>("1h");
  const [chartData, setChartData] = useState<CandleData[]>([]);
  const [rawCandles, setRawCandles] = useState<CoreCandle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Drawing tools
  const [selectedDrawingTool, setSelectedDrawingTool] = useState<DrawingTool>("cursor");

  // Drawing state management
  const drawingState = useDrawings();

  // Track when chart ref becomes available
  useEffect(() => {
    // Small delay to ensure chart is fully initialized
    const timer = setTimeout(() => {
      if (chartRef.current) {
        setChartReady(true);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [chartData]);

  // Indicators
  const [activeIndicators, setActiveIndicators] = useState<ActiveIndicator[]>([]);
  const [indicatorModalOpen, setIndicatorModalOpen] = useState(false);

  // Alerts
  const [alertModalOpen, setAlertModalOpen] = useState(false);

  // OHLCV display
  const [hoveredCandle, setHoveredCandle] = useState<{
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  } | null>(null);

  // Get current candle for OHLCV display
  const currentOHLCV = useMemo(() => {
    if (hoveredCandle) {
      const prevCandle = chartData.find((c) => c.time === hoveredCandle.time - 1) ||
        chartData[chartData.length - 2];
      const prevClose = prevCandle?.close || hoveredCandle.open;
      const change = hoveredCandle.close - prevClose;
      const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;

      return {
        open: hoveredCandle.open,
        high: hoveredCandle.high,
        low: hoveredCandle.low,
        close: hoveredCandle.close,
        volume: hoveredCandle.volume,
        change,
        changePercent,
      };
    }

    if (chartData.length === 0) return null;

    const lastCandle = chartData[chartData.length - 1];
    const prevCandle = chartData[chartData.length - 2];
    const prevClose = prevCandle?.close || lastCandle.open;
    const change = lastCandle.close - prevClose;
    const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;

    return {
      open: lastCandle.open,
      high: lastCandle.high,
      low: lastCandle.low,
      close: lastCandle.close,
      volume: lastCandle.volume || 0,
      change,
      changePercent,
    };
  }, [hoveredCandle, chartData]);

  // Fetch symbols on mount
  useEffect(() => {
    fetchSymbols()
      .then((data) => {
        setSymbols(data);
        if (data.length > 0) {
          setSelectedSymbolId(data[0].id);
        }
      })
      .catch((err) => setError(err.message));
  }, []);

  // Fetch candles when symbol or timeframe changes
  const loadCandles = useCallback(async () => {
    if (!selectedSymbolId) return;

    setLoading(true);
    setError(null);

    try {
      const candles = await fetchCandles(selectedSymbolId, timeframe, 500);

      // Store raw candles for indicator calculations
      setRawCandles(candles.map((c) => ({
        timestamp: c.timestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
      })));

      // Convert API candles to chart format
      const chartCandles: CandleData[] = candles.map((c) => ({
        time: Math.floor(c.timestamp / 1000),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
      }));
      setChartData(chartCandles);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch candles");
    } finally {
      setLoading(false);
    }
  }, [selectedSymbolId, timeframe]);

  useEffect(() => {
    loadCandles();
  }, [loadCandles]);

  // Calculate indicators using @nova/core
  const calculatedIndicators = useMemo(() => {
    if (rawCandles.length === 0) return [];

    const result: IndicatorData[] = [];

    activeIndicators.forEach((indicator, index) => {
      const color = indicator.color || INDICATOR_COLORS[index % INDICATOR_COLORS.length];

      try {
        switch (indicator.indicatorId) {
          case "sma": {
            const length = indicator.params.length || 20;
            const series = calculateSMA(rawCandles, { type: "sma", length });
            result.push({
              id: indicator.id,
              color,
              points: series.points.map((p) => ({
                time: Math.floor(p.timestamp / 1000),
                value: p.value,
              })),
            });
            break;
          }
          case "ema": {
            const length = indicator.params.length || 20;
            const series = calculateEMA(rawCandles, { type: "ema", length });
            result.push({
              id: indicator.id,
              color,
              points: series.points.map((p) => ({
                time: Math.floor(p.timestamp / 1000),
                value: p.value,
              })),
            });
            break;
          }
          case "bbands": {
            const length = indicator.params.length || 20;
            const stdDev = indicator.params.stdDev || 2;
            const bands = calculateBollingerBands(rawCandles, { type: "bbands", length, stdDev });

            // Middle band (basis)
            result.push({
              id: `${indicator.id}-basis`,
              color,
              points: bands.points.map((p) => ({
                time: Math.floor(p.timestamp / 1000),
                value: p.basis ?? p.value,
              })),
            });

            // Upper band
            result.push({
              id: `${indicator.id}-upper`,
              color: "#26a69a",
              lineWidth: 1,
              points: bands.points.filter((p) => p.upper !== undefined).map((p) => ({
                time: Math.floor(p.timestamp / 1000),
                value: p.upper!,
              })),
            });

            // Lower band
            result.push({
              id: `${indicator.id}-lower`,
              color: "#ef5350",
              lineWidth: 1,
              points: bands.points.filter((p) => p.lower !== undefined).map((p) => ({
                time: Math.floor(p.timestamp / 1000),
                value: p.lower!,
              })),
            });
            break;
          }
          case "rsi": {
            const length = indicator.params.length || 14;
            const series = calculateRSI(rawCandles, { type: "rsi", length });
            result.push({
              id: indicator.id,
              color,
              paneId: "rsi",
              points: series.points.map((p) => ({
                time: Math.floor(p.timestamp / 1000),
                value: p.value,
              })),
            });
            break;
          }
          case "macd": {
            const fast = indicator.params.fast || 12;
            const slow = indicator.params.slow || 26;
            const signal = indicator.params.signal || 9;
            const series = calculateMACD(rawCandles, {
              type: "macd",
              fastLength: fast,
              slowLength: slow,
              signalLength: signal,
            });

            // MACD Line
            result.push({
              id: `${indicator.id}-macd`,
              color,
              paneId: "macd",
              points: series.points.map((p) => ({
                time: Math.floor(p.timestamp / 1000),
                value: p.value,
              })),
            });

            // Signal Line
            result.push({
              id: `${indicator.id}-signal`,
              color: "#f97316",
              paneId: "macd",
              points: series.points
                .filter((p) => p.signal !== undefined)
                .map((p) => ({
                  time: Math.floor(p.timestamp / 1000),
                  value: p.signal!,
                })),
            });

            // Histogram (as line for now, could be bars)
            result.push({
              id: `${indicator.id}-histogram`,
              color: "#22c55e",
              paneId: "macd",
              lineWidth: 1,
              points: series.points
                .filter((p) => p.histogram !== undefined)
                .map((p) => ({
                  time: Math.floor(p.timestamp / 1000),
                  value: p.histogram!,
                })),
            });
            break;
          }
          case "atr": {
            const length = indicator.params.length || 14;
            const series = calculateATR(rawCandles, { type: "atr", length });
            result.push({
              id: indicator.id,
              color,
              paneId: "atr",
              points: series.points.map((p) => ({
                time: Math.floor(p.timestamp / 1000),
                value: p.value,
              })),
            });
            break;
          }
          case "vwap": {
            const series = calculateVWAP(rawCandles, { type: "vwap" });
            result.push({
              id: indicator.id,
              color,
              points: series.points.map((p) => ({
                time: Math.floor(p.timestamp / 1000),
                value: p.value,
              })),
            });
            break;
          }
          case "stoch": {
            const k = indicator.params.k || 14;
            const d = indicator.params.d || 3;
            const smooth = indicator.params.smooth || 3;
            const series = calculateStochastic(rawCandles, {
              type: "stoch",
              kPeriod: k,
              dPeriod: d,
              smooth,
            });

            // %K Line
            result.push({
              id: `${indicator.id}-k`,
              color,
              paneId: "stoch",
              points: series.points.map((p) => ({
                time: Math.floor(p.timestamp / 1000),
                value: p.k ?? p.value,
              })),
            });

            // %D Line
            result.push({
              id: `${indicator.id}-d`,
              color: "#f97316",
              paneId: "stoch",
              points: series.points
                .filter((p) => p.d !== undefined)
                .map((p) => ({
                  time: Math.floor(p.timestamp / 1000),
                  value: p.d!,
                })),
            });
            break;
          }
          case "adx": {
            const length = indicator.params.length || 14;
            const series = calculateADX(rawCandles, { type: "adx", length });

            // ADX Line
            result.push({
              id: `${indicator.id}-adx`,
              color,
              paneId: "adx",
              points: series.points.map((p) => ({
                time: Math.floor(p.timestamp / 1000),
                value: p.value,
              })),
            });

            // +DI Line
            result.push({
              id: `${indicator.id}-plusdi`,
              color: "#22c55e",
              paneId: "adx",
              points: series.points
                .filter((p) => p.plusDI !== undefined)
                .map((p) => ({
                  time: Math.floor(p.timestamp / 1000),
                  value: p.plusDI!,
                })),
            });

            // -DI Line
            result.push({
              id: `${indicator.id}-minusdi`,
              color: "#ef5350",
              paneId: "adx",
              points: series.points
                .filter((p) => p.minusDI !== undefined)
                .map((p) => ({
                  time: Math.floor(p.timestamp / 1000),
                  value: p.minusDI!,
                })),
            });
            break;
          }
          case "cci": {
            const length = indicator.params.length || 20;
            const series = calculateCCI(rawCandles, { type: "cci", length });
            result.push({
              id: indicator.id,
              color,
              paneId: "cci",
              points: series.points.map((p) => ({
                time: Math.floor(p.timestamp / 1000),
                value: p.value,
              })),
            });
            break;
          }
          case "obv": {
            const series = calculateOBV(rawCandles, { type: "obv" });
            result.push({
              id: indicator.id,
              color,
              paneId: "obv",
              points: series.points.map((p) => ({
                time: Math.floor(p.timestamp / 1000),
                value: p.value,
              })),
            });
            break;
          }
          case "ichimoku": {
            const conversion = indicator.params.conversion || 9;
            const base = indicator.params.base || 26;
            const span = indicator.params.span || 52;
            const displacement = indicator.params.displacement || 26;
            const series = calculateIchimoku(rawCandles, {
              type: "ichimoku",
              conversionPeriod: conversion,
              basePeriod: base,
              spanPeriod: span,
              displacement,
            });

            // Tenkan-sen (Conversion Line) - blue, no offset
            result.push({
              id: `${indicator.id}-tenkan`,
              color: "#2962FF",
              points: series.points
                .filter((p) => p.tenkan !== undefined)
                .map((p) => ({
                  time: Math.floor(p.timestamp / 1000),
                  value: p.tenkan!,
                })),
            });

            // Kijun-sen (Base Line) - dark red, no offset
            result.push({
              id: `${indicator.id}-kijun`,
              color: "#B71C1C",
              points: series.points
                .filter((p) => p.kijun !== undefined)
                .map((p) => ({
                  time: Math.floor(p.timestamp / 1000),
                  value: p.kijun!,
                })),
            });

            // Chikou Span (Lagging Span) - green, shifted BACKWARD by displacement
            result.push({
              id: `${indicator.id}-chikou`,
              color: "#43A047",
              points: series.points
                .filter((p) => p.chikou !== undefined && p.chikouTimestamp !== undefined)
                .map((p) => ({
                  time: Math.floor(p.chikouTimestamp! / 1000),
                  value: p.chikou!,
                })),
            });

            // Senkou Span A (Leading Span A) - light green, shifted FORWARD by displacement
            result.push({
              id: `${indicator.id}-senkouA`,
              color: "#A5D6A7",
              lineWidth: 1,
              points: series.points
                .filter((p) => p.senkouA !== undefined && p.senkouTimestamp !== undefined)
                .map((p) => ({
                  time: Math.floor(p.senkouTimestamp! / 1000),
                  value: p.senkouA!,
                })),
            });

            // Senkou Span B (Leading Span B) - light red, shifted FORWARD by displacement
            result.push({
              id: `${indicator.id}-senkouB`,
              color: "#EF9A9A",
              lineWidth: 1,
              points: series.points
                .filter((p) => p.senkouB !== undefined && p.senkouTimestamp !== undefined)
                .map((p) => ({
                  time: Math.floor(p.senkouTimestamp! / 1000),
                  value: p.senkouB!,
                })),
            });
            break;
          }
          default:
            break;
        }
      } catch (err) {
        console.error(`Failed to calculate ${indicator.indicatorId}:`, err);
      }
    });

    return result;
  }, [rawCandles, activeIndicators]);

  // Handle adding an indicator
  const handleAddIndicator = (config: IndicatorConfig, params: Record<string, number>) => {
    const id = `${config.id}-${Date.now()}`;
    const colorIndex = activeIndicators.length % INDICATOR_COLORS.length;

    setActiveIndicators((prev) => [
      ...prev,
      {
        id,
        indicatorId: config.id,
        params,
        color: config.color || INDICATOR_COLORS[colorIndex],
      },
    ]);
  };

  // Handle removing an indicator
  const handleRemoveIndicator = (id: string) => {
    setActiveIndicators((prev) => prev.filter((ind) => ind.id !== id));
  };

  // Get selected symbol
  const selectedSymbol = symbols.find((s) => s.id === selectedSymbolId) || null;

  return (
    <div className="flex h-full bg-tv-bg">
      {/* Drawing Tools Sidebar */}
      <DrawingToolsSidebar
        selectedTool={selectedDrawingTool}
        onToolSelect={setSelectedDrawingTool}
        stayInDrawingMode={drawingState.stayInDrawingMode}
        onStayInDrawingModeChange={drawingState.setStayInDrawingMode}
        lockDrawings={drawingState.lockAllDrawings}
        onLockDrawingsChange={drawingState.setLockAllDrawings}
        hideDrawings={drawingState.hideAllDrawings}
        onHideDrawingsChange={drawingState.setHideAllDrawings}
        onDeleteAllDrawings={drawingState.deleteAllDrawings}
      />

      {/* Main Chart Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chart Header */}
        <ChartHeader
          symbols={symbols}
          selectedSymbol={selectedSymbol}
          onSymbolChange={setSelectedSymbolId}
          timeframe={timeframe}
          onTimeframeChange={(tf) => setTimeframe(tf as Timeframe)}
          ohlcv={currentOHLCV}
          onIndicatorsClick={() => setIndicatorModalOpen(true)}
          onAlertClick={() => setAlertModalOpen(true)}
        />

        {/* Active Indicators Bar */}
        {activeIndicators.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-tv-bg-secondary border-b border-tv-border text-xs overflow-x-auto">
            {activeIndicators.map((indicator) => {
              const config = INDICATORS.find((i) => i.id === indicator.indicatorId);
              return (
                <div
                  key={indicator.id}
                  className="flex items-center gap-2 px-2 py-1 bg-tv-border rounded whitespace-nowrap"
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: indicator.color }}
                  />
                  <span className="text-white">
                    {config?.shortName || indicator.indicatorId.toUpperCase()}
                    {Object.keys(indicator.params).length > 0 &&
                      `(${Object.values(indicator.params).join(",")})`}
                  </span>
                  <button
                    onClick={() => handleRemoveIndicator(indicator.id)}
                    className="text-tv-text-secondary hover:text-tv-red ml-1"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="px-4 py-2 bg-tv-red/10 text-tv-red text-sm border-b border-tv-red/20">
            {error}
          </div>
        )}

        {/* Chart */}
        <div className="flex-1 relative min-h-0">
          {loading && chartData.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-tv-blue border-t-transparent" />
            </div>
          ) : (
            <TradingChart
              ref={chartRef}
              data={chartData}
              indicators={calculatedIndicators}
              showVolume={true}
              onCrosshairMove={setHoveredCandle}
            >
              {chartReady && (
                <DrawingCanvas
                  chartApi={chartRef.current?.getChartApi() ?? null}
                  candleSeries={chartRef.current?.getCandleSeries() ?? null}
                  selectedTool={selectedDrawingTool}
                  drawings={drawingState.drawings}
                  selectedDrawingId={drawingState.selectedDrawingId}
                  isDrawing={drawingState.isDrawing}
                  currentPoints={drawingState.currentPoints}
                  style={drawingState.style}
                  hideAllDrawings={drawingState.hideAllDrawings}
                  magnetMode={drawingState.magnetMode}
                  onStartDrawing={drawingState.startDrawing}
                  onContinueDrawing={drawingState.continueDrawing}
                  onFinishDrawing={drawingState.finishDrawing}
                  onCancelDrawing={drawingState.cancelDrawing}
                  onSelectDrawing={drawingState.selectDrawing}
                  onUpdateDrawing={drawingState.updateDrawing}
                  onDeleteDrawing={drawingState.deleteDrawing}
                  stayInDrawingMode={drawingState.stayInDrawingMode}
                  onToolChange={setSelectedDrawingTool}
                />
              )}
            </TradingChart>
          )}
        </div>

        {/* Bottom Timeframe Selector */}
        <TimeframeSelector
          timeframe={timeframe}
          onTimeframeChange={(tf) => setTimeframe(tf as Timeframe)}
        />
      </div>

      {/* Right Sidebar (Watchlist/Details) - can be expanded later */}
      <div className="w-12 bg-tv-bg-secondary border-l border-tv-border flex flex-col items-center py-2">
        <button className="p-2 text-tv-text-secondary hover:text-white hover:bg-tv-border rounded transition-colors">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      {/* Indicator Modal */}
      <IndicatorModal
        isOpen={indicatorModalOpen}
        onClose={() => setIndicatorModalOpen(false)}
        activeIndicators={activeIndicators}
        onAddIndicator={handleAddIndicator}
        onRemoveIndicator={handleRemoveIndicator}
      />

      {/* Alert Modal */}
      <CreateAlertModal
        isOpen={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        onCreated={() => {
          // Optionally refresh alerts list
          console.log("Alert created");
        }}
      />
    </div>
  );
}
