// Drawing types for chart annotations

export type DrawingToolType =
  | "cursor"
  | "crosshair"
  | "trendline"
  | "horizontalLine"
  | "verticalLine"
  | "ray"
  | "arrow"
  | "rectangle"
  | "circle"
  | "triangle"
  | "text"
  | "fibonacci"
  | "pitchfork"
  | "brush"
  | "measure"
  | "zoom"
  | "magnet";

export interface Point {
  x: number; // pixel x coordinate
  y: number; // pixel y coordinate
  time?: number; // chart time value
  price?: number; // chart price value
}

export interface DrawingStyle {
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  opacity: number;
  lineDash?: number[];
}

export interface BaseDrawing {
  id: string;
  type: DrawingToolType;
  style: DrawingStyle;
  locked: boolean;
  visible: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface TrendlineDrawing extends BaseDrawing {
  type: "trendline";
  startPoint: Point;
  endPoint: Point;
  extendLeft?: boolean;
  extendRight?: boolean;
}

export interface HorizontalLineDrawing extends BaseDrawing {
  type: "horizontalLine";
  price: number;
  label?: string;
}

export interface VerticalLineDrawing extends BaseDrawing {
  type: "verticalLine";
  time: number;
  label?: string;
}

export interface RayDrawing extends BaseDrawing {
  type: "ray";
  startPoint: Point;
  endPoint: Point;
}

export interface ArrowDrawing extends BaseDrawing {
  type: "arrow";
  startPoint: Point;
  endPoint: Point;
}

export interface RectangleDrawing extends BaseDrawing {
  type: "rectangle";
  startPoint: Point;
  endPoint: Point;
}

export interface CircleDrawing extends BaseDrawing {
  type: "circle";
  center: Point;
  radius: number; // in pixels, or use endPoint for dynamic sizing
  endPoint?: Point;
}

export interface TriangleDrawing extends BaseDrawing {
  type: "triangle";
  points: [Point, Point, Point];
}

export interface TextDrawing extends BaseDrawing {
  type: "text";
  position: Point;
  text: string;
  fontSize: number;
  fontFamily: string;
}

export interface FibonacciDrawing extends BaseDrawing {
  type: "fibonacci";
  startPoint: Point;
  endPoint: Point;
  levels: number[]; // e.g., [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1]
  showLabels: boolean;
  showPrices: boolean;
}

export interface PitchforkDrawing extends BaseDrawing {
  type: "pitchfork";
  points: [Point, Point, Point]; // pivot, low, high
}

export interface BrushDrawing extends BaseDrawing {
  type: "brush";
  points: Point[];
}

export interface MeasureDrawing extends BaseDrawing {
  type: "measure";
  startPoint: Point;
  endPoint: Point;
}

export type Drawing =
  | TrendlineDrawing
  | HorizontalLineDrawing
  | VerticalLineDrawing
  | RayDrawing
  | ArrowDrawing
  | RectangleDrawing
  | CircleDrawing
  | TriangleDrawing
  | TextDrawing
  | FibonacciDrawing
  | PitchforkDrawing
  | BrushDrawing
  | MeasureDrawing;

export const DEFAULT_DRAWING_STYLE: DrawingStyle = {
  strokeColor: "#2962ff",
  fillColor: "rgba(41, 98, 255, 0.1)",
  strokeWidth: 2,
  opacity: 1,
};

export const FIBONACCI_DEFAULT_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];

export function createDrawingId(): string {
  return `drawing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
