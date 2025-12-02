"use client";

import { AlertList } from "@/components/alerts/AlertList";
import { Plus } from "lucide-react";

export default function AlertsPage() {
  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Alerts</h1>
          <p className="text-zinc-400 font-mono text-sm">Manage your price and indicator alerts.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] font-bold uppercase tracking-wide text-sm">
          <Plus className="w-4 h-4" />
          Create Alert
        </button>
      </div>
      
      <AlertList />
    </div>
  );
}
