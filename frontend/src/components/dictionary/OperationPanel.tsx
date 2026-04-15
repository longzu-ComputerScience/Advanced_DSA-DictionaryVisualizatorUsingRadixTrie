"use client";

import React, { useState } from "react";
import type { SearchResponse } from "@/lib/api";

interface OperationPanelProps {
  onAdd: (word: string, meaning: string) => Promise<void>;
  onDelete: (word: string) => Promise<void>;
  onSearch: (word: string) => Promise<void>;
  onDemo: () => Promise<void>;
  onReset: () => Promise<void>;
  loading: boolean;
  error: string | null;
  successMsg: string | null;
  searchResult: SearchResponse | null;
}

export default function OperationPanel({
  onAdd,
  onDelete,
  onSearch,
  onDemo,
  onReset,
  loading,
  error,
  successMsg,
  searchResult,
}: OperationPanelProps) {
  const [addWord, setAddWord] = useState("");
  const [addMeaning, setAddMeaning] = useState("");
  const [deleteWord, setDeleteWord] = useState("");
  const [searchWord, setSearchWord] = useState("");
  const [activeTab, setActiveTab] = useState<"add" | "delete" | "search">("add");

  const tabs = [
    { key: "add" as const, label: "Add", icon: "+" },
    { key: "delete" as const, label: "Delete", icon: "−" },
    { key: "search" as const, label: "Search", icon: "⌕" },
  ];

  return (
    <div className="rounded-xl border border-slate-700/60 bg-[#0c1222] overflow-hidden panel-card">
      {/* Tab navigation */}
      <div className="flex border-b border-slate-700/60">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
              activeTab === tab.key
                ? "bg-slate-800/60 text-white border-b-2 border-indigo-500"
                : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/25"
            }`}
          >
            <span className="mr-1.5 text-xs opacity-70">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-3">
        {/* Add Word */}
        {activeTab === "add" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (addWord.trim() && addMeaning.trim()) {
                onAdd(addWord.trim(), addMeaning.trim());
                setAddWord("");
                setAddMeaning("");
              }
            }}
            className="space-y-3 animate-in"
          >
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Word</label>
              <input
                type="text"
                value={addWord}
                onChange={(e) => setAddWord(e.target.value)}
                placeholder="e.g. algorithm"
                className="w-full bg-slate-800/60 border border-slate-600/60 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-all duration-200 hover:border-slate-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Meaning</label>
              <input
                type="text"
                value={addMeaning}
                onChange={(e) => setAddMeaning(e.target.value)}
                placeholder="e.g. A step-by-step procedure..."
                className="w-full bg-slate-800/60 border border-slate-600/60 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-all duration-200 hover:border-slate-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-all duration-200 shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/25 active:scale-[0.98]"
            >
              {loading ? "Adding..." : "Add Word"}
            </button>
          </form>
        )}

        {/* Delete Word */}
        {activeTab === "delete" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (deleteWord.trim()) {
                onDelete(deleteWord.trim());
                setDeleteWord("");
              }
            }}
            className="space-y-3 animate-in"
          >
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Word to Delete</label>
              <input
                type="text"
                value={deleteWord}
                onChange={(e) => setDeleteWord(e.target.value)}
                placeholder="e.g. binary"
                className="w-full bg-slate-800/60 border border-slate-600/60 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/40 transition-all duration-200 hover:border-slate-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-all duration-200 shadow-md shadow-red-500/10 hover:shadow-red-500/25 active:scale-[0.98]"
            >
              {loading ? "Deleting..." : "Delete Word"}
            </button>
          </form>
        )}

        {/* Search Word */}
        {activeTab === "search" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchWord.trim()) {
                onSearch(searchWord.trim());
              }
            }}
            className="space-y-3 animate-in"
          >
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Search Word</label>
              <input
                type="text"
                value={searchWord}
                onChange={(e) => setSearchWord(e.target.value)}
                placeholder="e.g. apple"
                className="w-full bg-slate-800/60 border border-slate-600/60 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 transition-all duration-200 hover:border-slate-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-all duration-200 shadow-md shadow-amber-500/10 hover:shadow-amber-500/25 active:scale-[0.98]"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </form>
        )}

        {/* Inline search result */}
        {activeTab === "search" && searchResult && (
          <div className="animate-in space-y-3 border-t border-slate-700/40 pt-3">
            <div
              className={`rounded-lg px-3 py-2.5 text-sm font-medium flex items-center gap-2 ${
                searchResult.found
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                  : "bg-amber-500/10 border border-amber-500/20 text-amber-300"
              }`}
            >
              <span className={`text-base ${searchResult.found ? "text-emerald-400" : "text-amber-400"}`}>
                {searchResult.found ? "✓" : "✕"}
              </span>
              <span>{searchResult.message}</span>
            </div>

            {searchResult.found && searchResult.meaning && (
              <div className="rounded-lg bg-slate-800/40 border border-slate-700/40 px-3 py-2.5">
                <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider mb-1">Meaning</p>
                <p className="text-sm text-slate-200">{searchResult.meaning}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Traversal Path</p>
              <div className="flex flex-wrap gap-1 items-center">
                {searchResult.traversal_path.map((step, i) => (
                  <React.Fragment key={i}>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-medium ${
                        i === searchResult.traversal_path.length - 1
                          ? searchResult.found
                            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                            : "bg-red-500/15 text-red-300 border border-red-500/30"
                          : "bg-slate-700/40 text-slate-300 border border-slate-600/30"
                      }`}
                    >
                      {step}
                    </span>
                    {i < searchResult.traversal_path.length - 1 && (
                      <span className="text-slate-600 text-xs">→</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <p className="text-[10px] text-slate-500 italic">
              🔒 Search is read-only. The trie was not modified.
            </p>
          </div>
        )}

        {/* Status messages */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 text-sm text-red-300 animate-slide-in-top flex items-center gap-2">
            <span className="text-red-400 text-base">✕</span>
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2.5 text-sm text-emerald-300 animate-slide-in-top flex items-center gap-2">
            <span className="text-emerald-400 text-base">✓</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Load Demo / Reset All */}
        <div className="border-t border-slate-700/40 pt-3 flex gap-2">
          <button
            onClick={onDemo}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-violet-600/80 to-violet-500/80 hover:from-violet-500 hover:to-violet-400 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white font-medium py-2 px-3 rounded-lg text-xs transition-all duration-200 shadow-sm active:scale-[0.97]"
          >
            🎲 Load Demo
          </button>
          <button
            onClick={onReset}
            disabled={loading}
            className="flex-1 bg-slate-700/40 hover:bg-slate-600/60 disabled:bg-slate-800/50 disabled:text-slate-600 text-slate-300 font-medium py-2 px-3 rounded-lg text-xs transition-all duration-200 border border-slate-600/30 active:scale-[0.97]"
          >
            ↺ Reset All
          </button>
        </div>
      </div>
    </div>
  );
}
