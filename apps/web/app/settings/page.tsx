"use client";

import { useState } from "react";
import { Mail, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { sendTestEmail } from "@/lib/api/client";

export default function SettingsPage() {
  const [testEmailTo, setTestEmailTo] = useState("");
  const [testStatus, setTestStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [testError, setTestError] = useState<string | null>(null);

  const handleTestEmail = async () => {
    setTestStatus("sending");
    setTestError(null);

    try {
      await sendTestEmail(testEmailTo || undefined);
      setTestStatus("success");
    } catch (err) {
      setTestStatus("error");
      setTestError(err instanceof Error ? err.message : "Failed to send test email");
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
          <p className="text-zinc-400">Configure your NovaCharts preferences.</p>
        </div>

        {/* Email Configuration */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-white">Email Alerts</h2>
          </div>
          <p className="text-sm text-zinc-400 mb-4">
            Test your email configuration to ensure alerts are delivered correctly.
            Email settings (SMTP) are configured via environment variables on the server.
          </p>

          <div className="flex gap-3">
            <input
              type="email"
              value={testEmailTo}
              onChange={(e) => setTestEmailTo(e.target.value)}
              placeholder="Override recipient (optional)"
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleTestEmail}
              disabled={testStatus === "sending"}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white rounded-lg transition-colors text-sm"
            >
              {testStatus === "sending" ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Test Email"
              )}
            </button>
          </div>

          {testStatus === "success" && (
            <div className="mt-3 flex items-center gap-2 text-green-500 text-sm">
              <CheckCircle className="w-4 h-4" />
              Test email sent successfully!
            </div>
          )}

          {testStatus === "error" && (
            <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
              <XCircle className="w-4 h-4" />
              {testError}
            </div>
          )}
        </div>

        {/* Data Providers */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Data Providers</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-zinc-800">
              <div>
                <div className="font-medium text-white">Finnhub</div>
                <div className="text-sm text-zinc-400">Market data for FX, crypto, and stocks</div>
              </div>
              <span className="px-2 py-1 bg-green-500/10 text-green-500 text-xs rounded-full">
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="font-medium text-white">Financial Modeling Prep</div>
                <div className="text-sm text-zinc-400">Fundamentals and ratios for equities</div>
              </div>
              <span className="px-2 py-1 bg-green-500/10 text-green-500 text-xs rounded-full">
                Connected
              </span>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">About</h2>
          <div className="text-sm text-zinc-400 space-y-2">
            <p>
              <strong className="text-white">NovaCharts</strong> - Personal Trading Workstation
            </p>
            <p>Version 0.1.0</p>
            <p className="pt-2">
              A TypeScript-first charting platform with technical indicators,
              email alerts, and fundamentals analysis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
