"use client";

import { useState } from "react";
import type { EntryItem } from "@/lib/api";

interface EntriesTableProps {
  entries: EntryItem[];
  onRowHover?: (word: string) => void;
  onRowHoverEnd?: () => void;
}

export default function EntriesTable({ entries, onRowHover, onRowHoverEnd }: EntriesTableProps) {
  const [filter, setFilter] = useState("");

  const filtered = entries.filter(
    (e) =>
      e.word.toLowerCase().includes(filter.toLowerCase()) ||
      e.meaning.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="rounded-xl border border-slate-700/60 bg-[#0c1222] overflow-hidden panel-card">
      <div className="px-4 py-2.5 border-b border-slate-700/40 flex items-center gap-2.5">
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: "#10b981", boxShadow: "0 0 8px rgba(16,185,129,0.4)" }}
        />
        <h3 className="text-sm font-semibold text-slate-200 tracking-tight">Dictionary Entries</h3>
        <span className="ml-auto text-[10px] text-slate-500 font-mono bg-slate-800/60 px-2 py-0.5 rounded">{entries.length} words</span>
      </div>

      <div className="p-3 border-b border-slate-700/30">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter entries..."
          className="w-full bg-slate-800/60 border border-slate-600/50 rounded-lg px-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-all duration-200"
        />
      </div>

      <div className="max-h-[300px] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500 italic">
            {entries.length === 0 ? "Empty dictionary" : "No matches"}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#0e1526]/95 backdrop-blur">
              <tr className="border-b border-slate-700/40">
                <th className="px-4 py-2 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-1/4">Word</th>
                <th className="px-4 py-2 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Meaning</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr
                  key={entry.word}
                  className="border-b border-slate-800/40 last:border-0 hover:bg-indigo-500/5 transition-colors cursor-default"
                  onMouseEnter={() => onRowHover?.(entry.word)}
                  onMouseLeave={() => onRowHoverEnd?.()}
                >
                  <td className="px-4 py-2 font-mono font-semibold text-indigo-400 text-xs">{entry.word}</td>
                  <td className="px-4 py-2 text-slate-400 text-xs leading-relaxed">{entry.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
