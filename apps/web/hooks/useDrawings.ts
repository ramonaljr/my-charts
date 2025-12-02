"use client";

import { useState, useCallback, useRef } from "react";
import {
  Drawing,
  DrawingToolType,
  DrawingStyle,
  Point,
  DEFAULT_DRAWING_STYLE,
  createDrawingId,
  FIBONACCI_DEFAULT_LEVELS,
} from "@nova/core";

export interface DrawingState {
  drawings: Drawing[];
  selectedDrawingId: string | null;
  isDrawing: boolean;
  currentPoints: Point[];
}

export interface UseDrawingsReturn {
  drawings: Drawing[];
  selectedDrawingId: string | null;
  isDrawing: boolean;
  currentPoints: Point[];
  style: DrawingStyle;
  stayInDrawingMode: boolean;
  lockAllDrawings: boolean;
  hideAllDrawings: boolean;
  magnetMode: boolean;

  // Actions
  setStyle: (style: Partial<DrawingStyle>) => void;
  setStayInDrawingMode: (value: boolean) => void;
  setLockAllDrawings: (value: boolean) => void;
  setHideAllDrawings: (value: boolean) => void;
  setMagnetMode: (value: boolean) => void;

  startDrawing: (point: Point) => void;
  continueDrawing: (point: Point) => void;
  finishDrawing: (tool: DrawingToolType, point?: Point, options?: { text?: string }) => Drawing | null;
  cancelDrawing: () => void;

  selectDrawing: (id: string | null) => void;
  updateDrawing: (id: string, updates: Partial<Drawing>) => void;
  deleteDrawing: (id: string) => void;
  deleteAllDrawings: () => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const MAX_HISTORY = 50;

export function useDrawings(): UseDrawingsReturn {
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [style, setStyleState] = useState<DrawingStyle>(DEFAULT_DRAWING_STYLE);

  // Drawing mode toggles
  const [stayInDrawingMode, setStayInDrawingMode] = useState(false);
  const [lockAllDrawings, setLockAllDrawings] = useState(false);
  const [hideAllDrawings, setHideAllDrawings] = useState(false);
  const [magnetMode, setMagnetMode] = useState(false);

  // History for undo/redo
  const historyRef = useRef<Drawing[][]>([[]]);
  const historyIndexRef = useRef(0);

  const saveToHistory = useCallback((newDrawings: Drawing[]) => {
    const history = historyRef.current;
    const index = historyIndexRef.current;

    // Remove any future history if we're not at the end
    const newHistory = history.slice(0, index + 1);
    newHistory.push([...newDrawings]);

    // Limit history size
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift();
    } else {
      historyIndexRef.current = newHistory.length - 1;
    }

    historyRef.current = newHistory;
  }, []);

  const setStyle = useCallback((updates: Partial<DrawingStyle>) => {
    setStyleState((prev) => ({ ...prev, ...updates }));
  }, []);

  const startDrawing = useCallback((point: Point) => {
    setIsDrawing(true);
    setCurrentPoints([point]);
    setSelectedDrawingId(null);
  }, []);

  const continueDrawing = useCallback((point: Point) => {
    setCurrentPoints((prev) => {
      // For shapes like triangle/pitchfork that need exactly 3 points
      // and for brush that accumulates many points
      return [...prev, point];
    });
  }, []);

  const finishDrawing = useCallback(
    (tool: DrawingToolType, point?: Point, options?: { text?: string }): Drawing | null => {
      if (!isDrawing || currentPoints.length === 0) return null;

      const finalPoints = point ? [...currentPoints, point] : currentPoints;
      const now = Date.now();
      const baseDrawing = {
        id: createDrawingId(),
        style: { ...style },
        locked: false,
        visible: true,
        createdAt: now,
        updatedAt: now,
      };

      let newDrawing: Drawing | null = null;

      switch (tool) {
        case "trendline":
          if (finalPoints.length >= 2) {
            newDrawing = {
              ...baseDrawing,
              type: "trendline",
              startPoint: finalPoints[0],
              endPoint: finalPoints[finalPoints.length - 1],
            };
          }
          break;

        case "horizontalLine":
          if (finalPoints.length >= 1 && finalPoints[0].price !== undefined) {
            newDrawing = {
              ...baseDrawing,
              type: "horizontalLine",
              price: finalPoints[0].price,
            };
          }
          break;

        case "verticalLine":
          if (finalPoints.length >= 1 && finalPoints[0].time !== undefined) {
            newDrawing = {
              ...baseDrawing,
              type: "verticalLine",
              time: finalPoints[0].time,
            };
          }
          break;

        case "ray":
          if (finalPoints.length >= 2) {
            newDrawing = {
              ...baseDrawing,
              type: "ray",
              startPoint: finalPoints[0],
              endPoint: finalPoints[finalPoints.length - 1],
            };
          }
          break;

        case "arrow":
          if (finalPoints.length >= 2) {
            newDrawing = {
              ...baseDrawing,
              type: "arrow",
              startPoint: finalPoints[0],
              endPoint: finalPoints[finalPoints.length - 1],
            };
          }
          break;

        case "rectangle":
          if (finalPoints.length >= 2) {
            newDrawing = {
              ...baseDrawing,
              type: "rectangle",
              startPoint: finalPoints[0],
              endPoint: finalPoints[finalPoints.length - 1],
            };
          }
          break;

        case "circle":
          if (finalPoints.length >= 2) {
            const start = finalPoints[0];
            const end = finalPoints[finalPoints.length - 1];
            const radius = Math.sqrt(
              Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
            );
            newDrawing = {
              ...baseDrawing,
              type: "circle",
              center: start,
              radius,
              endPoint: end,
            };
          }
          break;

        case "triangle":
          if (finalPoints.length >= 3) {
            newDrawing = {
              ...baseDrawing,
              type: "triangle",
              points: [finalPoints[0], finalPoints[1], finalPoints[2]],
            };
          }
          break;

        case "text":
          if (finalPoints.length >= 1) {
            newDrawing = {
              ...baseDrawing,
              type: "text",
              position: finalPoints[0],
              text: options?.text || "Text",
              fontSize: 14,
              fontFamily: "Inter, sans-serif",
            };
          }
          break;

        case "fibonacci":
          if (finalPoints.length >= 2) {
            newDrawing = {
              ...baseDrawing,
              type: "fibonacci",
              startPoint: finalPoints[0],
              endPoint: finalPoints[finalPoints.length - 1],
              levels: FIBONACCI_DEFAULT_LEVELS,
              showLabels: true,
              showPrices: true,
            };
          }
          break;

        case "pitchfork":
          if (finalPoints.length >= 3) {
            newDrawing = {
              ...baseDrawing,
              type: "pitchfork",
              points: [finalPoints[0], finalPoints[1], finalPoints[2]],
            };
          }
          break;

        case "brush":
          if (finalPoints.length >= 2) {
            newDrawing = {
              ...baseDrawing,
              type: "brush",
              points: finalPoints,
            };
          }
          break;

        case "measure":
          if (finalPoints.length >= 2) {
            newDrawing = {
              ...baseDrawing,
              type: "measure",
              startPoint: finalPoints[0],
              endPoint: finalPoints[finalPoints.length - 1],
            };
          }
          break;
      }

      if (newDrawing) {
        const newDrawings = [...drawings, newDrawing];
        setDrawings(newDrawings);
        saveToHistory(newDrawings);
        setSelectedDrawingId(newDrawing.id);
      }

      setIsDrawing(false);
      setCurrentPoints([]);

      return newDrawing;
    },
    [isDrawing, currentPoints, drawings, style, saveToHistory]
  );

  const cancelDrawing = useCallback(() => {
    setIsDrawing(false);
    setCurrentPoints([]);
  }, []);

  const selectDrawing = useCallback((id: string | null) => {
    setSelectedDrawingId(id);
  }, []);

  const updateDrawing = useCallback(
    (id: string, updates: Partial<Drawing>) => {
      const newDrawings = drawings.map((d) =>
        d.id === id ? { ...d, ...updates, updatedAt: Date.now() } as Drawing : d
      );
      setDrawings(newDrawings);
      saveToHistory(newDrawings);
    },
    [drawings, saveToHistory]
  );

  const deleteDrawing = useCallback(
    (id: string) => {
      const newDrawings = drawings.filter((d) => d.id !== id);
      setDrawings(newDrawings);
      saveToHistory(newDrawings);
      if (selectedDrawingId === id) {
        setSelectedDrawingId(null);
      }
    },
    [drawings, selectedDrawingId, saveToHistory]
  );

  const deleteAllDrawings = useCallback(() => {
    setDrawings([]);
    saveToHistory([]);
    setSelectedDrawingId(null);
  }, [saveToHistory]);

  const undo = useCallback(() => {
    const index = historyIndexRef.current;
    if (index > 0) {
      historyIndexRef.current = index - 1;
      setDrawings([...historyRef.current[index - 1]]);
    }
  }, []);

  const redo = useCallback(() => {
    const history = historyRef.current;
    const index = historyIndexRef.current;
    if (index < history.length - 1) {
      historyIndexRef.current = index + 1;
      setDrawings([...history[index + 1]]);
    }
  }, []);

  return {
    drawings,
    selectedDrawingId,
    isDrawing,
    currentPoints,
    style,
    stayInDrawingMode,
    lockAllDrawings,
    hideAllDrawings,
    magnetMode,

    setStyle,
    setStayInDrawingMode,
    setLockAllDrawings,
    setHideAllDrawings,
    setMagnetMode,

    startDrawing,
    continueDrawing,
    finishDrawing,
    cancelDrawing,

    selectDrawing,
    updateDrawing,
    deleteDrawing,
    deleteAllDrawings,

    undo,
    redo,
    canUndo: historyIndexRef.current > 0,
    canRedo: historyIndexRef.current < historyRef.current.length - 1,
  };
}
