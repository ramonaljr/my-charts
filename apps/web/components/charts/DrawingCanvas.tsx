"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import {
  Drawing,
  DrawingToolType,
  Point,
  DrawingStyle,
  TrendlineDrawing,
  HorizontalLineDrawing,
  VerticalLineDrawing,
  RayDrawing,
  ArrowDrawing,
  RectangleDrawing,
  CircleDrawing,
  TriangleDrawing,
  TextDrawing,
  FibonacciDrawing,
  PitchforkDrawing,
  BrushDrawing,
  MeasureDrawing,
  FIBONACCI_DEFAULT_LEVELS,
} from "@nova/core";
import { IChartApi, ISeriesApi } from "lightweight-charts";

interface DrawingCanvasProps {
  chartApi: IChartApi | null;
  candleSeries: ISeriesApi<"Candlestick"> | null;
  selectedTool: DrawingToolType;
  drawings: Drawing[];
  selectedDrawingId: string | null;
  isDrawing: boolean;
  currentPoints: Point[];
  style: DrawingStyle;
  hideAllDrawings: boolean;
  magnetMode: boolean;
  onStartDrawing: (point: Point) => void;
  onContinueDrawing: (point: Point) => void;
  onFinishDrawing: (tool: DrawingToolType, point?: Point, options?: { text?: string }) => void;
  onCancelDrawing: () => void;
  onSelectDrawing: (id: string | null) => void;
  onUpdateDrawing: (id: string, updates: Partial<Drawing>) => void;
  onDeleteDrawing: (id: string) => void;
  stayInDrawingMode: boolean;
  onToolChange: (tool: DrawingToolType) => void;
}

// Tools that need exactly 2 points
const TWO_POINT_TOOLS: DrawingToolType[] = [
  "trendline",
  "ray",
  "arrow",
  "rectangle",
  "circle",
  "fibonacci",
  "measure",
];

// Tools that need exactly 3 points
const THREE_POINT_TOOLS: DrawingToolType[] = ["triangle", "pitchfork"];

// Tools that need only 1 click
const ONE_CLICK_TOOLS: DrawingToolType[] = [
  "horizontalLine",
  "verticalLine",
  "text",
];

// Non-drawing tools
const NON_DRAWING_TOOLS: DrawingToolType[] = [
  "cursor",
  "crosshair",
  "zoom",
  "magnet",
];

export function DrawingCanvas({
  chartApi,
  candleSeries,
  selectedTool,
  drawings,
  selectedDrawingId,
  isDrawing,
  currentPoints,
  style,
  hideAllDrawings,
  magnetMode,
  onStartDrawing,
  onContinueDrawing,
  onFinishDrawing,
  onCancelDrawing,
  onSelectDrawing,
  onUpdateDrawing,
  onDeleteDrawing,
  stayInDrawingMode,
  onToolChange,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState<Point | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Point | null>(null);

  // Convert pixel coordinates to chart coordinates
  const pixelToChartCoords = useCallback(
    (x: number, y: number): Point => {
      if (!chartApi || !candleSeries) {
        return { x, y };
      }

      const timeScale = chartApi.timeScale();
      const time = timeScale.coordinateToTime(x);
      const price = candleSeries.coordinateToPrice(y);

      return {
        x,
        y,
        time: time as number | undefined,
        price: price ?? undefined,
      };
    },
    [chartApi, candleSeries]
  );

  // Convert chart coordinates to pixel coordinates
  const chartToPixelCoords = useCallback(
    (point: Point): Point => {
      if (!chartApi || !candleSeries || point.time === undefined || point.price === undefined) {
        return point;
      }

      const timeScale = chartApi.timeScale();
      const x = timeScale.timeToCoordinate(point.time as unknown as Parameters<typeof timeScale.timeToCoordinate>[0]);
      const y = candleSeries.priceToCoordinate(point.price);

      return {
        ...point,
        x: x ?? point.x,
        y: y ?? point.y,
      };
    },
    [chartApi, candleSeries]
  );

  // Snap to OHLC values if magnet mode is enabled
  const snapToPrice = useCallback(
    (point: Point): Point => {
      if (!magnetMode || !chartApi || !candleSeries || point.time === undefined) {
        return point;
      }
      // For simplicity, just return the point
      // In a full implementation, we'd find the nearest candle and snap to OHLC
      return point;
    },
    [magnetMode, chartApi, candleSeries]
  );

  // Handle mouse down
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      let point = pixelToChartCoords(x, y);
      point = snapToPrice(point);

      // Check if clicking on an existing drawing for selection
      if (selectedTool === "cursor" && !isDrawing) {
        const clickedDrawing = findDrawingAtPoint(drawings, { x, y }, chartToPixelCoords);
        if (clickedDrawing) {
          onSelectDrawing(clickedDrawing.id);
          if (!clickedDrawing.locked) {
            setIsDragging(true);
            setDragOffset({ x, y });
          }
          return;
        } else {
          onSelectDrawing(null);
        }
      }

      // Start drawing for drawing tools
      if (!NON_DRAWING_TOOLS.includes(selectedTool)) {
        if (!isDrawing) {
          onStartDrawing(point);

          // For one-click tools, finish immediately
          if (ONE_CLICK_TOOLS.includes(selectedTool)) {
            if (selectedTool === "text") {
              // Prompt for text input
              const text = window.prompt("Enter text:", "Text");
              if (text !== null) {
                onFinishDrawing(selectedTool, point, { text });
              } else {
                onCancelDrawing();
              }
            } else {
              onFinishDrawing(selectedTool, point);
            }
            if (!stayInDrawingMode) {
              onToolChange("cursor");
            }
          }
        } else {
          // Continue multi-point drawing
          if (THREE_POINT_TOOLS.includes(selectedTool)) {
            if (currentPoints.length === 1) {
              onContinueDrawing(point);
            } else if (currentPoints.length === 2) {
              onFinishDrawing(selectedTool, point);
              if (!stayInDrawingMode) {
                onToolChange("cursor");
              }
            }
          } else if (TWO_POINT_TOOLS.includes(selectedTool)) {
            onFinishDrawing(selectedTool, point);
            if (!stayInDrawingMode) {
              onToolChange("cursor");
            }
          } else if (selectedTool === "brush") {
            onContinueDrawing(point);
          }
        }
      }
    },
    [
      selectedTool,
      isDrawing,
      drawings,
      currentPoints,
      pixelToChartCoords,
      chartToPixelCoords,
      snapToPrice,
      onStartDrawing,
      onContinueDrawing,
      onFinishDrawing,
      onSelectDrawing,
      stayInDrawingMode,
      onToolChange,
    ]
  );

  // Handle mouse move
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      let point = pixelToChartCoords(x, y);
      point = snapToPrice(point);

      setMousePos(point);

      // Handle brush drawing (continuous points)
      if (isDrawing && selectedTool === "brush") {
        onContinueDrawing(point);
      }

      // Handle dragging selected drawing
      if (isDragging && selectedDrawingId && dragOffset) {
        const drawing = drawings.find((d) => d.id === selectedDrawingId);
        if (drawing && !drawing.locked) {
          const dx = x - dragOffset.x;
          const dy = y - dragOffset.y;
          moveDrawing(drawing, dx, dy, onUpdateDrawing, chartToPixelCoords, pixelToChartCoords);
          setDragOffset({ x, y });
        }
      }
    },
    [
      pixelToChartCoords,
      snapToPrice,
      isDrawing,
      selectedTool,
      isDragging,
      selectedDrawingId,
      dragOffset,
      drawings,
      onContinueDrawing,
      onUpdateDrawing,
      chartToPixelCoords,
    ]
  );

  // Handle mouse up
  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isDragging) {
        setIsDragging(false);
        setDragOffset(null);
      }

      // Finish brush drawing on mouse up
      if (isDrawing && selectedTool === "brush") {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const point = pixelToChartCoords(x, y);
          onFinishDrawing(selectedTool, point);
          if (!stayInDrawingMode) {
            onToolChange("cursor");
          }
        }
      }
    },
    [isDragging, isDrawing, selectedTool, pixelToChartCoords, onFinishDrawing, stayInDrawingMode, onToolChange]
  );

  // Handle right-click to cancel
  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      if (isDrawing) {
        onCancelDrawing();
      }
    },
    [isDrawing, onCancelDrawing]
  );

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isDrawing) {
          onCancelDrawing();
        } else if (selectedDrawingId) {
          onSelectDrawing(null);
        }
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedDrawingId) {
          onDeleteDrawing(selectedDrawingId);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawing, selectedDrawingId, onCancelDrawing, onSelectDrawing, onDeleteDrawing]);

  // Resize canvas
  useEffect(() => {
    const resizeCanvas = () => {
      if (!canvasRef.current || !containerRef.current) return;

      const container = containerRef.current;
      const canvas = canvasRef.current;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = container.clientWidth * dpr;
      canvas.height = container.clientHeight * dpr;
      canvas.style.width = `${container.clientWidth}px`;
      canvas.style.height = `${container.clientHeight}px`;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };

    resizeCanvas();

    const resizeObserver = new ResizeObserver(resizeCanvas);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Render drawings
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    if (hideAllDrawings) return;

    // Draw existing drawings
    drawings.forEach((drawing) => {
      if (!drawing.visible) return;

      const isSelected = drawing.id === selectedDrawingId;
      renderDrawing(ctx, drawing, chartToPixelCoords, isSelected);
    });

    // Draw current drawing in progress
    if (isDrawing && currentPoints.length > 0 && mousePos) {
      renderDrawingPreview(
        ctx,
        selectedTool,
        currentPoints,
        mousePos,
        style,
        chartToPixelCoords
      );
    }
  }, [
    drawings,
    selectedDrawingId,
    isDrawing,
    currentPoints,
    mousePos,
    selectedTool,
    style,
    hideAllDrawings,
    chartToPixelCoords,
  ]);

  // Cursor style based on tool
  const getCursor = () => {
    if (NON_DRAWING_TOOLS.includes(selectedTool)) {
      return selectedTool === "cursor" ? "default" : "crosshair";
    }
    return "crosshair";
  };

  // Determine if we should capture pointer events
  // Only capture when actively drawing or when using a drawing tool
  const shouldCaptureEvents = !NON_DRAWING_TOOLS.includes(selectedTool) || selectedTool === "cursor";

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{
        zIndex: 10,
        pointerEvents: shouldCaptureEvents ? "auto" : "none",
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ cursor: getCursor() }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={handleContextMenu}
      />
    </div>
  );
}

// Helper functions for drawing

function findDrawingAtPoint(
  drawings: Drawing[],
  point: Point,
  chartToPixelCoords: (p: Point) => Point
): Drawing | null {
  const threshold = 10;

  for (let i = drawings.length - 1; i >= 0; i--) {
    const drawing = drawings[i];
    if (!drawing.visible) continue;

    if (isPointNearDrawing(drawing, point, chartToPixelCoords, threshold)) {
      return drawing;
    }
  }

  return null;
}

function isPointNearDrawing(
  drawing: Drawing,
  point: Point,
  chartToPixelCoords: (p: Point) => Point,
  threshold: number
): boolean {
  switch (drawing.type) {
    case "trendline":
    case "ray": {
      const start = chartToPixelCoords(drawing.startPoint);
      const end = chartToPixelCoords(drawing.endPoint);
      return distanceToLine(point, start, end) < threshold;
    }
    case "horizontalLine": {
      // Check if y is close to the line
      return Math.abs(point.y - (drawing as any).pixelY) < threshold;
    }
    case "rectangle": {
      const start = chartToPixelCoords(drawing.startPoint);
      const end = chartToPixelCoords(drawing.endPoint);
      const minX = Math.min(start.x, end.x);
      const maxX = Math.max(start.x, end.x);
      const minY = Math.min(start.y, end.y);
      const maxY = Math.max(start.y, end.y);
      return (
        point.x >= minX - threshold &&
        point.x <= maxX + threshold &&
        point.y >= minY - threshold &&
        point.y <= maxY + threshold
      );
    }
    case "circle": {
      const center = chartToPixelCoords(drawing.center);
      const dist = Math.sqrt(
        Math.pow(point.x - center.x, 2) + Math.pow(point.y - center.y, 2)
      );
      return Math.abs(dist - drawing.radius) < threshold;
    }
    default:
      return false;
  }
}

function distanceToLine(point: Point, lineStart: Point, lineEnd: Point): number {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx, yy;

  if (param < 0) {
    xx = lineStart.x;
    yy = lineStart.y;
  } else if (param > 1) {
    xx = lineEnd.x;
    yy = lineEnd.y;
  } else {
    xx = lineStart.x + param * C;
    yy = lineStart.y + param * D;
  }

  const dx = point.x - xx;
  const dy = point.y - yy;

  return Math.sqrt(dx * dx + dy * dy);
}

function moveDrawing(
  drawing: Drawing,
  dx: number,
  dy: number,
  onUpdate: (id: string, updates: Partial<Drawing>) => void,
  chartToPixelCoords: (p: Point) => Point,
  pixelToChartCoords: (x: number, y: number) => Point
) {
  switch (drawing.type) {
    case "trendline":
    case "ray":
    case "arrow":
    case "rectangle":
    case "fibonacci":
    case "measure": {
      const startPixel = chartToPixelCoords(drawing.startPoint);
      const endPixel = chartToPixelCoords(drawing.endPoint);
      const newStart = pixelToChartCoords(startPixel.x + dx, startPixel.y + dy);
      const newEnd = pixelToChartCoords(endPixel.x + dx, endPixel.y + dy);
      onUpdate(drawing.id, {
        startPoint: newStart,
        endPoint: newEnd,
      } as Partial<Drawing>);
      break;
    }
    case "circle": {
      const centerPixel = chartToPixelCoords(drawing.center);
      const newCenter = pixelToChartCoords(centerPixel.x + dx, centerPixel.y + dy);
      onUpdate(drawing.id, { center: newCenter } as Partial<Drawing>);
      break;
    }
    case "triangle":
    case "pitchfork": {
      const newPoints = drawing.points.map((p) => {
        const pixel = chartToPixelCoords(p);
        return pixelToChartCoords(pixel.x + dx, pixel.y + dy);
      }) as [Point, Point, Point];
      onUpdate(drawing.id, { points: newPoints } as Partial<Drawing>);
      break;
    }
    case "horizontalLine": {
      const d = drawing as HorizontalLineDrawing;
      onUpdate(drawing.id, { price: d.price + dy * 0.0001 } as Partial<Drawing>);
      break;
    }
  }
}

function renderDrawing(
  ctx: CanvasRenderingContext2D,
  drawing: Drawing,
  chartToPixelCoords: (p: Point) => Point,
  isSelected: boolean
) {
  const { style } = drawing;
  ctx.strokeStyle = style.strokeColor;
  ctx.fillStyle = style.fillColor;
  ctx.lineWidth = style.strokeWidth;
  ctx.globalAlpha = style.opacity;

  if (style.lineDash) {
    ctx.setLineDash(style.lineDash);
  } else {
    ctx.setLineDash([]);
  }

  switch (drawing.type) {
    case "trendline":
      renderTrendline(ctx, drawing, chartToPixelCoords, isSelected);
      break;
    case "horizontalLine":
      renderHorizontalLine(ctx, drawing, chartToPixelCoords, isSelected);
      break;
    case "verticalLine":
      renderVerticalLine(ctx, drawing, chartToPixelCoords, isSelected);
      break;
    case "ray":
      renderRay(ctx, drawing, chartToPixelCoords, isSelected);
      break;
    case "arrow":
      renderArrow(ctx, drawing, chartToPixelCoords, isSelected);
      break;
    case "rectangle":
      renderRectangle(ctx, drawing, chartToPixelCoords, isSelected);
      break;
    case "circle":
      renderCircle(ctx, drawing, chartToPixelCoords, isSelected);
      break;
    case "triangle":
      renderTriangle(ctx, drawing, chartToPixelCoords, isSelected);
      break;
    case "text":
      renderText(ctx, drawing, chartToPixelCoords, isSelected);
      break;
    case "fibonacci":
      renderFibonacci(ctx, drawing, chartToPixelCoords, isSelected);
      break;
    case "pitchfork":
      renderPitchfork(ctx, drawing, chartToPixelCoords, isSelected);
      break;
    case "brush":
      renderBrush(ctx, drawing, chartToPixelCoords, isSelected);
      break;
    case "measure":
      renderMeasure(ctx, drawing, chartToPixelCoords, isSelected);
      break;
  }

  ctx.globalAlpha = 1;
  ctx.setLineDash([]);

  // Draw selection handles
  if (isSelected) {
    drawSelectionHandles(ctx, drawing, chartToPixelCoords);
  }
}

function renderTrendline(
  ctx: CanvasRenderingContext2D,
  drawing: TrendlineDrawing,
  chartToPixelCoords: (p: Point) => Point,
  isSelected: boolean
) {
  const start = chartToPixelCoords(drawing.startPoint);
  const end = chartToPixelCoords(drawing.endPoint);

  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
}

function renderHorizontalLine(
  ctx: CanvasRenderingContext2D,
  drawing: HorizontalLineDrawing,
  chartToPixelCoords: (p: Point) => Point,
  isSelected: boolean
) {
  const point = chartToPixelCoords({ x: 0, y: 0, price: drawing.price, time: 0 });
  const canvas = ctx.canvas;
  const dpr = window.devicePixelRatio || 1;

  ctx.beginPath();
  ctx.moveTo(0, point.y);
  ctx.lineTo(canvas.width / dpr, point.y);
  ctx.stroke();

  // Draw price label
  if (drawing.label) {
    ctx.fillStyle = drawing.style.strokeColor;
    ctx.font = "12px Inter, sans-serif";
    ctx.fillText(drawing.label, 5, point.y - 5);
  }
}

function renderVerticalLine(
  ctx: CanvasRenderingContext2D,
  drawing: VerticalLineDrawing,
  chartToPixelCoords: (p: Point) => Point,
  isSelected: boolean
) {
  const point = chartToPixelCoords({ x: 0, y: 0, time: drawing.time, price: 0 });
  const canvas = ctx.canvas;
  const dpr = window.devicePixelRatio || 1;

  ctx.beginPath();
  ctx.moveTo(point.x, 0);
  ctx.lineTo(point.x, canvas.height / dpr);
  ctx.stroke();
}

function renderRay(
  ctx: CanvasRenderingContext2D,
  drawing: RayDrawing,
  chartToPixelCoords: (p: Point) => Point,
  isSelected: boolean
) {
  const start = chartToPixelCoords(drawing.startPoint);
  const end = chartToPixelCoords(drawing.endPoint);
  const canvas = ctx.canvas;
  const dpr = window.devicePixelRatio || 1;

  // Extend the line to the edge of the canvas
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const extendedEnd = {
    x: start.x + dx * 1000,
    y: start.y + dy * 1000,
  };

  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(extendedEnd.x, extendedEnd.y);
  ctx.stroke();
}

function renderArrow(
  ctx: CanvasRenderingContext2D,
  drawing: ArrowDrawing,
  chartToPixelCoords: (p: Point) => Point,
  isSelected: boolean
) {
  const start = chartToPixelCoords(drawing.startPoint);
  const end = chartToPixelCoords(drawing.endPoint);

  // Draw line
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();

  // Draw arrowhead
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const headLength = 15;

  ctx.beginPath();
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(
    end.x - headLength * Math.cos(angle - Math.PI / 6),
    end.y - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(
    end.x - headLength * Math.cos(angle + Math.PI / 6),
    end.y - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.stroke();
}

function renderRectangle(
  ctx: CanvasRenderingContext2D,
  drawing: RectangleDrawing,
  chartToPixelCoords: (p: Point) => Point,
  isSelected: boolean
) {
  const start = chartToPixelCoords(drawing.startPoint);
  const end = chartToPixelCoords(drawing.endPoint);

  const width = end.x - start.x;
  const height = end.y - start.y;

  ctx.fillRect(start.x, start.y, width, height);
  ctx.strokeRect(start.x, start.y, width, height);
}

function renderCircle(
  ctx: CanvasRenderingContext2D,
  drawing: CircleDrawing,
  chartToPixelCoords: (p: Point) => Point,
  isSelected: boolean
) {
  const center = chartToPixelCoords(drawing.center);
  let radius = drawing.radius;

  // Recalculate radius from endPoint if available for dynamic sizing
  if (drawing.endPoint) {
    const end = chartToPixelCoords(drawing.endPoint);
    radius = Math.sqrt(
      Math.pow(end.x - center.x, 2) + Math.pow(end.y - center.y, 2)
    );
  }

  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function renderTriangle(
  ctx: CanvasRenderingContext2D,
  drawing: TriangleDrawing,
  chartToPixelCoords: (p: Point) => Point,
  isSelected: boolean
) {
  const points = drawing.points.map(chartToPixelCoords);

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  ctx.lineTo(points[1].x, points[1].y);
  ctx.lineTo(points[2].x, points[2].y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function renderText(
  ctx: CanvasRenderingContext2D,
  drawing: TextDrawing,
  chartToPixelCoords: (p: Point) => Point,
  isSelected: boolean
) {
  const pos = chartToPixelCoords(drawing.position);

  ctx.font = `${drawing.fontSize}px ${drawing.fontFamily}`;
  ctx.fillStyle = drawing.style.strokeColor;
  ctx.fillText(drawing.text, pos.x, pos.y);

  if (isSelected) {
    const metrics = ctx.measureText(drawing.text);
    ctx.strokeStyle = "#2962ff";
    ctx.lineWidth = 1;
    ctx.strokeRect(
      pos.x - 2,
      pos.y - drawing.fontSize,
      metrics.width + 4,
      drawing.fontSize + 4
    );
  }
}

function renderFibonacci(
  ctx: CanvasRenderingContext2D,
  drawing: FibonacciDrawing,
  chartToPixelCoords: (p: Point) => Point,
  isSelected: boolean
) {
  const start = chartToPixelCoords(drawing.startPoint);
  const end = chartToPixelCoords(drawing.endPoint);

  const height = end.y - start.y;
  const width = end.x - start.x;

  const fibColors = [
    "#787b86",
    "#f59e0b",
    "#10b981",
    "#2962ff",
    "#ef5350",
    "#8b5cf6",
    "#787b86",
  ];

  drawing.levels.forEach((level, i) => {
    const y = start.y + height * level;

    ctx.strokeStyle = fibColors[i % fibColors.length];
    ctx.beginPath();
    ctx.moveTo(Math.min(start.x, end.x), y);
    ctx.lineTo(Math.max(start.x, end.x), y);
    ctx.stroke();

    if (drawing.showLabels) {
      ctx.fillStyle = fibColors[i % fibColors.length];
      ctx.font = "11px Inter, sans-serif";
      const labelText = drawing.showPrices
        ? `${(level * 100).toFixed(1)}%`
        : `${level}`;
      ctx.fillText(labelText, Math.max(start.x, end.x) + 5, y + 4);
    }
  });
}

function renderPitchfork(
  ctx: CanvasRenderingContext2D,
  drawing: PitchforkDrawing,
  chartToPixelCoords: (p: Point) => Point,
  isSelected: boolean
) {
  const points = drawing.points.map(chartToPixelCoords);
  const [pivot, low, high] = points;

  // Calculate midpoint between low and high
  const midX = (low.x + high.x) / 2;
  const midY = (low.y + high.y) / 2;

  // Draw the three lines of the pitchfork
  ctx.beginPath();

  // Median line (from pivot through midpoint)
  ctx.moveTo(pivot.x, pivot.y);
  const medianDx = midX - pivot.x;
  const medianDy = midY - pivot.y;
  ctx.lineTo(pivot.x + medianDx * 10, pivot.y + medianDy * 10);
  ctx.stroke();

  // Upper line (from pivot direction through high)
  ctx.beginPath();
  ctx.moveTo(high.x, high.y);
  ctx.lineTo(high.x + medianDx * 10, high.y + medianDy * 10);
  ctx.stroke();

  // Lower line (from pivot direction through low)
  ctx.beginPath();
  ctx.moveTo(low.x, low.y);
  ctx.lineTo(low.x + medianDx * 10, low.y + medianDy * 10);
  ctx.stroke();

  // Draw points
  [pivot, low, high].forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

function renderBrush(
  ctx: CanvasRenderingContext2D,
  drawing: BrushDrawing,
  chartToPixelCoords: (p: Point) => Point,
  isSelected: boolean
) {
  if (drawing.points.length < 2) return;

  const points = drawing.points.map(chartToPixelCoords);

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }

  ctx.stroke();
}

function renderMeasure(
  ctx: CanvasRenderingContext2D,
  drawing: MeasureDrawing,
  chartToPixelCoords: (p: Point) => Point,
  isSelected: boolean
) {
  const start = chartToPixelCoords(drawing.startPoint);
  const end = chartToPixelCoords(drawing.endPoint);

  // Draw dashed line
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw points
  ctx.beginPath();
  ctx.arc(start.x, start.y, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(end.x, end.y, 4, 0, Math.PI * 2);
  ctx.fill();

  // Calculate and display measurements
  if (drawing.startPoint.price !== undefined && drawing.endPoint.price !== undefined) {
    const priceDiff = drawing.endPoint.price - drawing.startPoint.price;
    const percentDiff = (priceDiff / drawing.startPoint.price) * 100;

    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(midX - 40, midY - 30, 80, 25);
    ctx.strokeRect(midX - 40, midY - 30, 80, 25);

    ctx.fillStyle = priceDiff >= 0 ? "#26a69a" : "#ef5350";
    ctx.font = "11px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${percentDiff >= 0 ? "+" : ""}${percentDiff.toFixed(2)}%`, midX, midY - 12);
    ctx.textAlign = "start";
  }
}

function drawSelectionHandles(
  ctx: CanvasRenderingContext2D,
  drawing: Drawing,
  chartToPixelCoords: (p: Point) => Point
) {
  ctx.fillStyle = "#2962ff";
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1;

  const handleSize = 6;

  const drawHandle = (x: number, y: number) => {
    ctx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
    ctx.strokeRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
  };

  switch (drawing.type) {
    case "trendline":
    case "ray":
    case "arrow":
    case "rectangle":
    case "fibonacci":
    case "measure": {
      const start = chartToPixelCoords(drawing.startPoint);
      const end = chartToPixelCoords(drawing.endPoint);
      drawHandle(start.x, start.y);
      drawHandle(end.x, end.y);
      break;
    }
    case "circle": {
      const center = chartToPixelCoords(drawing.center);
      drawHandle(center.x, center.y);
      if (drawing.endPoint) {
        const end = chartToPixelCoords(drawing.endPoint);
        drawHandle(end.x, end.y);
      }
      break;
    }
    case "triangle":
    case "pitchfork": {
      drawing.points.forEach((p) => {
        const pixel = chartToPixelCoords(p);
        drawHandle(pixel.x, pixel.y);
      });
      break;
    }
    case "text": {
      const pos = chartToPixelCoords(drawing.position);
      drawHandle(pos.x, pos.y);
      break;
    }
    case "brush": {
      if (drawing.points.length > 0) {
        const first = chartToPixelCoords(drawing.points[0]);
        const last = chartToPixelCoords(drawing.points[drawing.points.length - 1]);
        drawHandle(first.x, first.y);
        drawHandle(last.x, last.y);
      }
      break;
    }
  }
}

function renderDrawingPreview(
  ctx: CanvasRenderingContext2D,
  tool: DrawingToolType,
  points: Point[],
  mousePos: Point,
  style: DrawingStyle,
  chartToPixelCoords: (p: Point) => Point
) {
  ctx.strokeStyle = style.strokeColor;
  ctx.fillStyle = style.fillColor;
  ctx.lineWidth = style.strokeWidth;
  ctx.globalAlpha = 0.7;
  ctx.setLineDash([5, 5]);

  const pixelPoints = points.map(chartToPixelCoords);
  const currentMousePixel = chartToPixelCoords(mousePos);

  switch (tool) {
    case "trendline":
    case "ray":
    case "arrow": {
      if (pixelPoints.length >= 1) {
        ctx.beginPath();
        ctx.moveTo(pixelPoints[0].x, pixelPoints[0].y);
        ctx.lineTo(currentMousePixel.x, currentMousePixel.y);
        ctx.stroke();
      }
      break;
    }
    case "rectangle": {
      if (pixelPoints.length >= 1) {
        const width = currentMousePixel.x - pixelPoints[0].x;
        const height = currentMousePixel.y - pixelPoints[0].y;
        ctx.fillRect(pixelPoints[0].x, pixelPoints[0].y, width, height);
        ctx.strokeRect(pixelPoints[0].x, pixelPoints[0].y, width, height);
      }
      break;
    }
    case "circle": {
      if (pixelPoints.length >= 1) {
        const radius = Math.sqrt(
          Math.pow(currentMousePixel.x - pixelPoints[0].x, 2) +
            Math.pow(currentMousePixel.y - pixelPoints[0].y, 2)
        );
        ctx.beginPath();
        ctx.arc(pixelPoints[0].x, pixelPoints[0].y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      break;
    }
    case "triangle": {
      ctx.beginPath();
      if (pixelPoints.length >= 1) {
        ctx.moveTo(pixelPoints[0].x, pixelPoints[0].y);
      }
      if (pixelPoints.length >= 2) {
        ctx.lineTo(pixelPoints[1].x, pixelPoints[1].y);
      }
      ctx.lineTo(currentMousePixel.x, currentMousePixel.y);
      if (pixelPoints.length >= 2) {
        ctx.closePath();
      }
      ctx.fill();
      ctx.stroke();
      break;
    }
    case "fibonacci": {
      if (pixelPoints.length >= 1) {
        const start = pixelPoints[0];
        const end = currentMousePixel;
        const height = end.y - start.y;

        FIBONACCI_DEFAULT_LEVELS.forEach((level) => {
          const y = start.y + height * level;
          ctx.beginPath();
          ctx.moveTo(Math.min(start.x, end.x), y);
          ctx.lineTo(Math.max(start.x, end.x), y);
          ctx.stroke();
        });
      }
      break;
    }
    case "measure": {
      if (pixelPoints.length >= 1) {
        ctx.beginPath();
        ctx.moveTo(pixelPoints[0].x, pixelPoints[0].y);
        ctx.lineTo(currentMousePixel.x, currentMousePixel.y);
        ctx.stroke();
      }
      break;
    }
    case "brush": {
      if (pixelPoints.length >= 1) {
        ctx.beginPath();
        ctx.moveTo(pixelPoints[0].x, pixelPoints[0].y);
        for (let i = 1; i < pixelPoints.length; i++) {
          ctx.lineTo(pixelPoints[i].x, pixelPoints[i].y);
        }
        ctx.lineTo(currentMousePixel.x, currentMousePixel.y);
        ctx.stroke();
      }
      break;
    }
  }

  ctx.globalAlpha = 1;
  ctx.setLineDash([]);
}
