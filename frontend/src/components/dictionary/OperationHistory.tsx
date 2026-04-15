"use client";

import type { HistoryEntry } from "@/lib/api";

interface OperationHistoryProps {
  history: HistoryEntry[];
}

const actionColors: Record<string, string> = {
  add: "bg-emerald-500",
  delete: "bg-red-500",
  search: "bg-amber-500",
  demo: "bg-violet-500",
  reset: "bg-slate-500",
};

const actionIcons: Record<string, string> = {
  add: "+",
  delete: "−",
  search: "⌕",
  demo: "🎲",
  reset: "↺",
};

export default function OperationHistory({ history }: OperationHistoryProps) {
  return (
    <div className="rounded-xl border border-slate-700/60 bg-[#0c1222] overflow-hidden panel-card">
      <div className="px-4 py-2.5 border-b border-slate-700/40 flex items-center gap-2.5">
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: "#f59e0b", boxShadow: "0 0 8px rgba(245,158,11,0.4)" }}
        />
        <h3 className="text-sm font-semibold text-slate-200 tracking-tight">Operation History</h3>
        <span className="ml-auto text-[10px] text-slate-500 font-mono bg-slate-800/60 px-2 py-0.5 rounded">{history.length} ops</span>
      </div>

      <div className="max-h-[300px] overflow-y-auto">
        {history.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500 italic">
            No operations yet
          </div>
        ) : (
          <div className="divide-y divide-slate-800/40">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="px-4 py-2.5 hover:bg-slate-800/25 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] text-white font-bold ${
                      actionColors[entry.action] || "bg-slate-600"
                    }`}
                  >
                    {actionIcons[entry.action] || "?"}
                  </span>
                  <span className="text-xs font-semibold text-slate-300">
                    {entry.action.toUpperCase()}
                  </span>
                  <span className="text-xs font-mono text-indigo-400">&ldquo;{entry.word}&rdquo;</span>
                  <span
                    className={`ml-auto text-[10px] font-medium ${
                      entry.success ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {entry.success ? "✓" : "✕"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed ml-7">{entry.message}</p>
                <span className="text-[9px] text-slate-600 ml-7">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
