"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  User,
  Home,
  HelpCircle,
  Sparkles,
  Settings,
  PanelLeft,
  Globe,
  Keyboard,
  LogOut,
  ChevronDown,
  FileText,
  Bell,
  LineChart,
  X,
} from "lucide-react";
import { clsx } from "clsx";

interface ProfileMenuProps {
  className?: string;
}

// Keyboard shortcuts modal
function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  const shortcuts = [
    { category: "Chart", items: [
      { keys: ["Scroll"], description: "Zoom in/out" },
      { keys: ["Drag"], description: "Pan chart" },
      { keys: ["Esc"], description: "Cancel drawing" },
    ]},
    { category: "Navigation", items: [
      { keys: ["G", "C"], description: "Go to Charts" },
      { keys: ["G", "A"], description: "Go to Alerts" },
      { keys: ["G", "F"], description: "Go to Fundamentals" },
      { keys: ["G", "S"], description: "Go to Settings" },
    ]},
    { category: "Drawing Tools", items: [
      { keys: ["L"], description: "Trend Line" },
      { keys: ["H"], description: "Horizontal Line" },
      { keys: ["R"], description: "Rectangle" },
      { keys: ["F"], description: "Fibonacci" },
    ]},
  ];

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-tv-bg-secondary border border-tv-border rounded-lg shadow-2xl w-[500px] max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-tv-border">
          <h2 className="text-lg font-semibold text-white">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="p-1 text-tv-text-secondary hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {shortcuts.map((section) => (
            <div key={section.category} className="mb-6 last:mb-0">
              <h3 className="text-sm font-semibold text-tv-text-secondary uppercase tracking-wider mb-3">
                {section.category}
              </h3>
              <div className="space-y-2">
                {section.items.map((shortcut, i) => (
                  <div key={i} className="flex items-center justify-between py-1">
                    <span className="text-sm text-white">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, j) => (
                        <span key={j}>
                          <kbd className="px-2 py-1 bg-tv-border text-tv-text-secondary text-xs rounded">
                            {key}
                          </kbd>
                          {j < shortcut.keys.length - 1 && (
                            <span className="text-tv-text-secondary mx-1">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProfileMenu({ className }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menu on escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        setShowShortcuts(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string) => {
    setToast(message);
    setIsOpen(false);
  };

  type MenuItem =
    | { type: "link"; href: string; icon: typeof LineChart; label: string; danger?: boolean }
    | { type: "button"; icon: typeof LineChart; label: string; action: () => void; danger?: boolean; comingSoon?: boolean }
    | { type: "divider" };

  const menuItems: MenuItem[] = [
    { type: "link", href: "/charts", icon: LineChart, label: "Charts" },
    { type: "link", href: "/alerts", icon: Bell, label: "Alerts" },
    { type: "link", href: "/fundamentals", icon: FileText, label: "Fundamentals" },
    { type: "divider" },
    { type: "link", href: "/", icon: Home, label: "Home" },
    {
      type: "button",
      icon: HelpCircle,
      label: "Help Center",
      action: () => showToast("Help Center coming soon"),
      comingSoon: true,
    },
    {
      type: "button",
      icon: Sparkles,
      label: "What's new",
      action: () => showToast("What's new coming soon"),
      comingSoon: true,
    },
    { type: "divider" },
    { type: "link", href: "/settings", icon: Settings, label: "App settings" },
    {
      type: "button",
      icon: PanelLeft,
      label: "Drawings panel",
      action: () => showToast("Drawings panel coming soon"),
      comingSoon: true,
    },
    {
      type: "button",
      icon: Globe,
      label: "Language",
      action: () => showToast("Language settings coming soon"),
      comingSoon: true,
    },
    {
      type: "button",
      icon: Keyboard,
      label: "Keyboard shortcuts",
      action: () => {
        setShowShortcuts(true);
        setIsOpen(false);
      },
    },
    { type: "divider" },
    {
      type: "button",
      icon: LogOut,
      label: "Sign out",
      danger: true,
      action: () => showToast("Sign out - No auth required (single user)"),
    },
  ];

  return (
    <>
      <div ref={menuRef} className={clsx("relative", className)}>
        {/* Profile Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={clsx(
            "flex items-center gap-2 px-2 py-1.5 rounded transition-colors",
            isOpen
              ? "bg-tv-border text-white"
              : "text-tv-text-secondary hover:text-white hover:bg-tv-border"
          )}
        >
          <div className="w-7 h-7 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <ChevronDown
            className={clsx(
              "w-4 h-4 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-56 bg-tv-bg-secondary border border-tv-border rounded-lg shadow-xl overflow-hidden z-50">
            {/* User Info Header */}
            <div className="px-4 py-3 border-b border-tv-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">NovaCharts</div>
                  <div className="text-xs text-tv-text-secondary">Personal Workstation</div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              {menuItems.map((item, index) => {
                if (item.type === "divider") {
                  return (
                    <div key={index} className="my-1 border-t border-tv-border" />
                  );
                }

                const Icon = item.icon;
                const baseClasses =
                  "w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors";
                const colorClasses = item.danger
                  ? "text-tv-red hover:bg-tv-red/10"
                  : "text-tv-text-secondary hover:text-white hover:bg-tv-border";

                if (item.type === "link") {
                  return (
                    <Link
                      key={index}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={clsx(baseClasses, colorClasses)}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                }

                return (
                  <button
                    key={index}
                    onClick={item.action}
                    className={clsx(baseClasses, colorClasses, "justify-between")}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.comingSoon && (
                      <span className="text-[10px] text-tv-text-secondary bg-tv-border px-1.5 py-0.5 rounded">
                        Soon
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-100 px-4 py-2 bg-tv-bg-secondary border border-tv-border rounded-lg shadow-xl text-sm text-white animate-pulse">
          {toast}
        </div>
      )}
    </>
  );
}
