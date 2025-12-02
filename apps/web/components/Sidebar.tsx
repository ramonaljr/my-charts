"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LineChart, Bell, FileText, Settings, Activity } from "lucide-react";
import { clsx } from "clsx";

const navItems = [
  { name: "Charts", href: "/charts", icon: LineChart },
  { name: "Alerts", href: "/alerts", icon: Bell },
  { name: "Fundamentals", href: "/fundamentals", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-50">
      <div className="glass-panel rounded-full p-2 flex flex-col items-center gap-4">
        <div className="p-3 mb-2 rounded-full bg-white/5 border border-white/10">
          <Activity className="w-6 h-6 text-blue-400" />
        </div>
        
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "p-3 rounded-full transition-all duration-300 relative group",
                  isActive
                    ? "bg-white/10 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] border border-white/20"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                )}
                title={item.name}
              >
                <item.icon className="w-5 h-5" />
                
                {/* Tooltip */}
                <span className="absolute left-full ml-4 px-2 py-1 bg-black/80 text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10 backdrop-blur-sm">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
