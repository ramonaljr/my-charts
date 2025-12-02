"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, IChartApi, CandlestickSeries, LineSeries } from "lightweight-charts";
import type { Candle } from "@/lib/api/mockData";

export interface IndicatorData {
  id: string;
  color: string;
  points: Array<{ time: number; value: number }>;
}

interface CandlestickChartProps {
  data: Candle[];
  indicators?: IndicatorData[];
}

export function CandlestickChart({ data, indicators = [] }: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart: IChartApi = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#a1a1aa", // zinc-400
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.05)" },
        horzLines: { color: "rgba(255, 255, 255, 0.05)" },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: "rgba(255, 255, 255, 0.1)",
      },
      rightPriceScale: {
        borderColor: "rgba(255, 255, 255, 0.1)",
      },
      crosshair: {
        mode: 1, // CrosshairMode.Normal
        vertLine: {
          color: "rgba(59, 130, 246, 0.5)",
          width: 1,
          style: 3, // LineStyle.Dashed
          labelBackgroundColor: "#3b82f6",
        },
        horzLine: {
          color: "rgba(59, 130, 246, 0.5)",
          width: 1,
          style: 3, // LineStyle.Dashed
          labelBackgroundColor: "#3b82f6",
        },
      },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e", // green-500
      downColor: "#ef4444", // red-500
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    candlestickSeries.setData(data as Parameters<typeof candlestickSeries.setData>[0]);

    // Add indicator lines
    indicators.forEach((indicator) => {
      const lineSeries = chart.addSeries(LineSeries, {
        color: indicator.color,
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      lineSeries.setData(indicator.points as Parameters<typeof lineSeries.setData>[0]);
    });

    chartRef.current = chart;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [data, indicators]);

  return <div ref={chartContainerRef} className="w-full h-full" />;
}
