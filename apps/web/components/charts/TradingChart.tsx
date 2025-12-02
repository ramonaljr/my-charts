"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import {
  createChart,
  ColorType,
  IChartApi,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  ISeriesApi,
  CrosshairMode,
  PriceScaleMode,
  LineStyle,
} from "lightweight-charts";

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface IndicatorData {
  id: string;
  color: string;
  lineWidth?: number;
  paneId?: string; // For separate pane indicators (rsi, macd, stoch, etc.)
  points: Array<{ time: number; value: number }>;
}

export interface PriceLineData {
  price: number;
  color: string;
  lineStyle?: number;
  lineWidth?: number;
  title?: string;
}

export interface TradingChartHandle {
  getChartApi: () => IChartApi | null;
  getCandleSeries: () => ISeriesApi<"Candlestick"> | null;
}

interface TradingChartProps {
  data: CandleData[];
  indicators?: IndicatorData[];
  priceLines?: PriceLineData[];
  showVolume?: boolean;
  onCrosshairMove?: (data: {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  } | null) => void;
  children?: React.ReactNode;
}

export const TradingChart = forwardRef<TradingChartHandle, TradingChartProps>(function TradingChart({
  data,
  indicators = [],
  priceLines = [],
  showVolume = true,
  onCrosshairMove,
  children,
}, ref) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const indicatorSeriesRef = useRef<Map<string, ISeriesApi<"Line">>>(new Map());

  // Expose chart API and candle series via ref
  useImperativeHandle(ref, () => ({
    getChartApi: () => chartRef.current,
    getCandleSeries: () => candleSeriesRef.current,
  }), []);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#131722" },
        textColor: "#787b86",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      },
      grid: {
        vertLines: { color: "#1e222d", style: LineStyle.Solid },
        horzLines: { color: "#1e222d", style: LineStyle.Solid },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: "#2a2e39",
        rightOffset: 5,
        barSpacing: 8,
        fixLeftEdge: false,
        fixRightEdge: false,
      },
      rightPriceScale: {
        borderColor: "#2a2e39",
        scaleMargins: {
          top: 0.1,
          bottom: showVolume ? 0.2 : 0.1,
        },
        mode: PriceScaleMode.Normal,
        autoScale: true,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "#758696",
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: "#2962ff",
        },
        horzLine: {
          color: "#758696",
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: "#2962ff",
        },
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false,
      },
    });

    // Add candlestick series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
      priceLineVisible: true,
      lastValueVisible: true,
      priceLineWidth: 1,
      priceLineColor: "#2962ff",
    });

    candleSeriesRef.current = candleSeries;

    // Add volume series if enabled
    if (showVolume) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: {
          type: "volume",
        },
        priceScaleId: "volume",
      });

      volumeSeries.priceScale().applyOptions({
        scaleMargins: {
          top: 0.85,
          bottom: 0,
        },
      });

      volumeSeriesRef.current = volumeSeries;
    }

    chartRef.current = chart;

    // Handle crosshair move
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData) {
        onCrosshairMove?.(null);
        return;
      }

      const candleData = param.seriesData.get(candleSeries);
      if (candleData && "open" in candleData) {
        const volumeData = volumeSeriesRef.current
          ? param.seriesData.get(volumeSeriesRef.current)
          : null;
        const volumeValue = volumeData && "value" in volumeData ? (volumeData.value as number) : 0;
        onCrosshairMove?.({
          time: param.time as number,
          open: candleData.open,
          high: candleData.high,
          low: candleData.low,
          close: candleData.close,
          volume: volumeValue,
        });
      }
    });

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    // ResizeObserver for container size changes
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [showVolume]);

  // Update candlestick data
  useEffect(() => {
    if (!candleSeriesRef.current || data.length === 0) return;

    const sortedData = [...data].sort((a, b) => a.time - b.time);
    candleSeriesRef.current.setData(sortedData as Parameters<typeof candleSeriesRef.current.setData>[0]);

    // Update volume data
    if (volumeSeriesRef.current && showVolume) {
      const volumeData = sortedData.map((d) => ({
        time: d.time,
        value: d.volume || 0,
        color: d.close >= d.open ? "rgba(38, 166, 154, 0.5)" : "rgba(239, 83, 80, 0.5)",
      }));
      volumeSeriesRef.current.setData(volumeData as Parameters<typeof volumeSeriesRef.current.setData>[0]);
    }

    // Fit content
    chartRef.current?.timeScale().fitContent();
  }, [data, showVolume]);

  // Update indicators
  useEffect(() => {
    if (!chartRef.current) return;

    // Remove old indicator series
    indicatorSeriesRef.current.forEach((series, id) => {
      if (!indicators.find((ind) => ind.id === id)) {
        chartRef.current?.removeSeries(series);
        indicatorSeriesRef.current.delete(id);
      }
    });

    // Add or update indicator series
    indicators.forEach((indicator) => {
      let series = indicatorSeriesRef.current.get(indicator.id);

      if (!series) {
        // Configure series options based on whether it's in a separate pane
        const seriesOptions = {
          color: indicator.color,
          lineWidth: (indicator.lineWidth || 2) as 1 | 2 | 3 | 4,
          priceLineVisible: false,
          lastValueVisible: indicator.paneId ? true : false,
          crosshairMarkerVisible: true,
          crosshairMarkerRadius: 4,
          priceScaleId: indicator.paneId || undefined,
        };

        series = chartRef.current!.addSeries(LineSeries, seriesOptions);

        // Configure the price scale for separate pane indicators
        // scaleMargins: top = margin from top (0-1), bottom = margin from bottom (0-1)
        // For a pane at the bottom taking 15% of chart: top: 0.85, bottom: 0
        if (indicator.paneId) {
          series.priceScale().applyOptions({
            scaleMargins: {
              top: 0.8,    // Start at 80% from top
              bottom: 0.0, // End at bottom
            },
            autoScale: true,
          });
        }

        indicatorSeriesRef.current.set(indicator.id, series);
      } else {
        series.applyOptions({
          color: indicator.color,
          lineWidth: (indicator.lineWidth || 2) as 1 | 2 | 3 | 4,
        });
      }

      const sortedPoints = [...indicator.points].sort((a, b) => a.time - b.time);
      series.setData(sortedPoints as Parameters<typeof series.setData>[0]);
    });
  }, [indicators]);

  // Update price lines
  useEffect(() => {
    if (!candleSeriesRef.current) return;

    // Remove existing price lines
    // Note: lightweight-charts doesn't have a direct way to remove specific price lines
    // So we recreate them each time

    priceLines.forEach((priceLine) => {
      candleSeriesRef.current?.createPriceLine({
        price: priceLine.price,
        color: priceLine.color,
        lineWidth: (priceLine.lineWidth || 1) as 1 | 2 | 3 | 4,
        lineStyle: priceLine.lineStyle || LineStyle.Dashed,
        axisLabelVisible: true,
        title: priceLine.title || "",
      });
    });
  }, [priceLines]);

  return (
    <div ref={chartContainerRef} className="w-full h-full relative">
      {children}
    </div>
  );
});
