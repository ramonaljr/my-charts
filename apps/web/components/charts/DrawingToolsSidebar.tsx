"use client";

import { useState } from "react";
import { clsx } from "clsx";
import {
  MousePointer2,
  Pencil,
  TrendingUp,
  Minus,
  ArrowUpRight,
  Circle,
  Square,
  Triangle,
  Type,
  Ruler,
  Target,
  Heart,
  Lock,
  Eye,
  Trash2,
  ZoomIn,
  Move,
  Magnet,
  MoreHorizontal,
} from "lucide-react";

export type DrawingTool =
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

interface ToolGroup {
  id: string;
  icon: React.ReactNode;
  tools: { id: DrawingTool; label: string; icon: React.ReactNode }[];
}

const toolGroups: ToolGroup[] = [
  {
    id: "cursor",
    icon: <MousePointer2 className="w-4 h-4" />,
    tools: [
      { id: "cursor", label: "Cursor", icon: <MousePointer2 className="w-4 h-4" /> },
      { id: "crosshair", label: "Crosshair", icon: <Target className="w-4 h-4" /> },
    ],
  },
  {
    id: "lines",
    icon: <TrendingUp className="w-4 h-4" />,
    tools: [
      { id: "trendline", label: "Trend Line", icon: <TrendingUp className="w-4 h-4" /> },
      { id: "ray", label: "Ray", icon: <ArrowUpRight className="w-4 h-4" /> },
      { id: "horizontalLine", label: "Horizontal Line", icon: <Minus className="w-4 h-4" /> },
      {
        id: "verticalLine",
        label: "Vertical Line",
        icon: (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="4" x2="12" y2="20" />
          </svg>
        ),
      },
    ],
  },
  {
    id: "fibonacci",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 20h16M4 14h16M4 8h16M4 4h16" />
      </svg>
    ),
    tools: [
      {
        id: "fibonacci",
        label: "Fibonacci Retracement",
        icon: (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 20h16M4 14h16M4 8h16M4 4h16" />
          </svg>
        ),
      },
      {
        id: "pitchfork",
        label: "Pitchfork",
        icon: (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 4v16M4 8l8-4 8 4" />
          </svg>
        ),
      },
    ],
  },
  {
    id: "shapes",
    icon: <Square className="w-4 h-4" />,
    tools: [
      { id: "rectangle", label: "Rectangle", icon: <Square className="w-4 h-4" /> },
      { id: "circle", label: "Circle", icon: <Circle className="w-4 h-4" /> },
      { id: "triangle", label: "Triangle", icon: <Triangle className="w-4 h-4" /> },
    ],
  },
  {
    id: "text",
    icon: <Type className="w-4 h-4" />,
    tools: [
      { id: "text", label: "Text", icon: <Type className="w-4 h-4" /> },
      { id: "arrow", label: "Arrow", icon: <ArrowUpRight className="w-4 h-4" /> },
    ],
  },
  {
    id: "brush",
    icon: <Pencil className="w-4 h-4" />,
    tools: [{ id: "brush", label: "Brush", icon: <Pencil className="w-4 h-4" /> }],
  },
  {
    id: "measure",
    icon: <Ruler className="w-4 h-4" />,
    tools: [
      { id: "measure", label: "Measure", icon: <Ruler className="w-4 h-4" /> },
      { id: "zoom", label: "Zoom In", icon: <ZoomIn className="w-4 h-4" /> },
    ],
  },
  {
    id: "magnet",
    icon: <Magnet className="w-4 h-4" />,
    tools: [{ id: "magnet", label: "Magnet Mode", icon: <Magnet className="w-4 h-4" /> }],
  },
];

interface DrawingToolsSidebarProps {
  selectedTool: DrawingTool;
  onToolSelect: (tool: DrawingTool) => void;
  stayInDrawingMode?: boolean;
  onStayInDrawingModeChange?: (value: boolean) => void;
  lockDrawings?: boolean;
  onLockDrawingsChange?: (value: boolean) => void;
  hideDrawings?: boolean;
  onHideDrawingsChange?: (value: boolean) => void;
  onDeleteAllDrawings?: () => void;
}

export function DrawingToolsSidebar({
  selectedTool,
  onToolSelect,
  stayInDrawingMode = false,
  onStayInDrawingModeChange,
  lockDrawings = false,
  onLockDrawingsChange,
  hideDrawings = false,
  onHideDrawingsChange,
  onDeleteAllDrawings,
}: DrawingToolsSidebarProps) {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const getActiveToolInGroup = (group: ToolGroup): DrawingTool => {
    const activeTool = group.tools.find((t) => t.id === selectedTool);
    return activeTool ? activeTool.id : group.tools[0].id;
  };

  return (
    <div className="w-12 bg-tv-bg-secondary border-r border-tv-border flex flex-col items-center py-2">
      {/* Drawing Tools */}
      <div className="flex flex-col items-center gap-0.5 w-full">
        {toolGroups.map((group) => {
          const activeTool = getActiveToolInGroup(group);
          const isGroupActive = group.tools.some((t) => t.id === selectedTool);

          return (
            <div key={group.id} className="relative w-full">
              <button
                onClick={() => {
                  if (group.tools.length === 1) {
                    onToolSelect(group.tools[0].id);
                  } else {
                    setExpandedGroup(expandedGroup === group.id ? null : group.id);
                    onToolSelect(activeTool);
                  }
                }}
                className={clsx(
                  "w-full flex items-center justify-center py-2.5 transition-colors relative group",
                  isGroupActive
                    ? "bg-tv-blue/20 text-tv-blue"
                    : "text-tv-text-secondary hover:text-white hover:bg-tv-border"
                )}
              >
                {group.tools.find((t) => t.id === activeTool)?.icon || group.icon}
                {group.tools.length > 1 && (
                  <div className="absolute right-1 bottom-1">
                    <svg className="w-2 h-2" viewBox="0 0 8 8" fill="currentColor">
                      <path d="M0 0h8L4 8z" />
                    </svg>
                  </div>
                )}

                {/* Tooltip */}
                <div className="absolute left-full ml-2 px-2 py-1 bg-tv-tooltip text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                  {group.tools.find((t) => t.id === activeTool)?.label}
                </div>
              </button>

              {/* Expanded Menu */}
              {expandedGroup === group.id && group.tools.length > 1 && (
                <div className="absolute left-full top-0 ml-1 bg-tv-bg-secondary border border-tv-border rounded-lg shadow-xl z-50 py-1 min-w-[160px]">
                  {group.tools.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => {
                        onToolSelect(tool.id);
                        setExpandedGroup(null);
                      }}
                      className={clsx(
                        "w-full flex items-center gap-3 px-3 py-2 text-xs transition-colors",
                        selectedTool === tool.id
                          ? "bg-tv-blue/20 text-tv-blue"
                          : "text-tv-text-secondary hover:text-white hover:bg-tv-border"
                      )}
                    >
                      {tool.icon}
                      <span>{tool.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom Actions */}
      <div className="flex flex-col items-center gap-0.5 w-full border-t border-tv-border pt-2">
        {/* Stay in Drawing Mode */}
        <button
          onClick={() => onStayInDrawingModeChange?.(!stayInDrawingMode)}
          className={clsx(
            "w-full flex items-center justify-center py-2.5 transition-colors group relative",
            stayInDrawingMode
              ? "bg-tv-blue/20 text-tv-blue"
              : "text-tv-text-secondary hover:text-white hover:bg-tv-border"
          )}
        >
          <Move className="w-4 h-4" />
          <div className="absolute left-full ml-2 px-2 py-1 bg-tv-tooltip text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
            Stay in Drawing Mode
          </div>
        </button>

        {/* Lock All Drawings */}
        <button
          onClick={() => onLockDrawingsChange?.(!lockDrawings)}
          className={clsx(
            "w-full flex items-center justify-center py-2.5 transition-colors group relative",
            lockDrawings
              ? "bg-tv-blue/20 text-tv-blue"
              : "text-tv-text-secondary hover:text-white hover:bg-tv-border"
          )}
        >
          <Lock className="w-4 h-4" />
          <div className="absolute left-full ml-2 px-2 py-1 bg-tv-tooltip text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
            Lock All Drawings
          </div>
        </button>

        {/* Hide All Drawings */}
        <button
          onClick={() => onHideDrawingsChange?.(!hideDrawings)}
          className={clsx(
            "w-full flex items-center justify-center py-2.5 transition-colors group relative",
            hideDrawings
              ? "bg-tv-blue/20 text-tv-blue"
              : "text-tv-text-secondary hover:text-white hover:bg-tv-border"
          )}
        >
          <Eye className="w-4 h-4" />
          <div className="absolute left-full ml-2 px-2 py-1 bg-tv-tooltip text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
            Hide All Drawings
          </div>
        </button>

        {/* Delete All Drawings */}
        <button
          onClick={() => onDeleteAllDrawings?.()}
          className="w-full flex items-center justify-center py-2.5 transition-colors text-tv-text-secondary hover:text-tv-red hover:bg-tv-border group relative"
        >
          <Trash2 className="w-4 h-4" />
          <div className="absolute left-full ml-2 px-2 py-1 bg-tv-tooltip text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
            Delete All Drawings
          </div>
        </button>

        {/* More */}
        <button className="w-full flex items-center justify-center py-2.5 transition-colors text-tv-text-secondary hover:text-white hover:bg-tv-border group relative">
          <MoreHorizontal className="w-4 h-4" />
          <div className="absolute left-full ml-2 px-2 py-1 bg-tv-tooltip text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
            More Options
          </div>
        </button>
      </div>
    </div>
  );
}
