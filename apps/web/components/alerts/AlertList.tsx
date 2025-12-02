"use client";

import { Trash2, PlayCircle, PauseCircle } from "lucide-react";

interface Alert {
  id: string;
  symbol: string;
  condition: string;
  value: number;
  active: boolean;
}

const MOCK_ALERTS: Alert[] = [
  { id: "1", symbol: "BTCUSD", condition: "Price >", value: 65000, active: true },
  { id: "2", symbol: "ETHUSD", condition: "RSI >", value: 70, active: false },
  { id: "3", symbol: "AAPL", condition: "Price <", value: 150, active: true },
];

export function AlertList() {
  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="glass-panel rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-zinc-400 uppercase text-xs font-mono tracking-wider border-b border-white/10">
            <tr>
              <th className="p-6 font-medium">Symbol</th>
              <th className="p-6 font-medium">Condition</th>
              <th className="p-6 font-medium">Value</th>
              <th className="p-6 font-medium">Status</th>
              <th className="p-6 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {MOCK_ALERTS.map((alert) => (
              <tr key={alert.id} className="hover:bg-white/5 transition-colors group">
                <td className="p-6 font-bold text-white text-lg">{alert.symbol}</td>
                <td className="p-6 text-zinc-300 font-mono">{alert.condition}</td>
                <td className="p-6 text-blue-400 font-mono font-bold">{alert.value}</td>
                <td className="p-6">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                      alert.active
                        ? "bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.2)]"
                        : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                    }`}
                  >
                    {alert.active ? "Active" : "Paused"}
                  </span>
                </td>
                <td className="p-6 text-right">
                  <div className="flex items-center justify-end gap-3 opacity-50 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                      {alert.active ? <PauseCircle className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
                    </button>
                    <button className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
