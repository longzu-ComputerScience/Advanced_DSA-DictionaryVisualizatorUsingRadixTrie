"use client";

import React from "react";
import type { OperationResponse } from "@/lib/api";

interface ResultPanelProps {
  result: {
    action: "add" | "delete";
    data: OperationResponse;
  } | null;
}

export default function OperationResultPanel({ result }: ResultPanelProps) {
  if (!result) return null;

  const { action, data } = result;
  const isAdd = action === "add";

  return (
    <div className="rounded-xl border border-slate-700/60 bg-[#0c1222] overflow-hidden panel-card animate-in">
      <div className="px-4 py-2.5 border-b border-slate-700/40 flex items-center gap-2.5">
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{
            backgroundColor: isAdd ? "#22c55e" : "#ef4444",
            boxShadow: `0 0 8px ${isAdd ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)"}`,
          }}
        />
        <h3 className="text-sm font-semibold text-slate-200 tracking-tight">
          {isAdd ? "Insert" : "Delete"} Result
        </h3>
        <span
          className={`ml-auto text-[10px] font-mono px-2 py-0.5 rounded ${
            data.success
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}
        >
          {data.success ? "SUCCESS" : "FAILED"}
        </span>
      </div>

      <div className="p-4 space-y-3">
        <div
          className={`rounded-lg px-3 py-2.5 text-sm font-medium ${
            data.success
              ? "bg-emerald-500/8 border border-emerald-500/20 text-emerald-300"
              : "bg-red-500/8 border border-red-500/20 text-red-300"
          }`}
        >
          {data.message}
        </div>

        {data.explanation && (
          <div className="rounded-lg bg-slate-800/40 border border-slate-700/40 px-3 py-2.5">
            <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider mb-1">Explanation</p>
            <p className="text-xs text-slate-300 leading-relaxed">{data.explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
}
