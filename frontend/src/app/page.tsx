"use client";

import React, { useState, useEffect, useCallback } from "react";
import OperationPanel from "@/components/dictionary/OperationPanel";
import OperationResultPanel from "@/components/dictionary/OperationResultPanel";
import EntriesTable from "@/components/dictionary/EntriesTable";
import OperationHistory from "@/components/dictionary/OperationHistory";
import RadixTrieVisualization from "@/components/trie/TrieViewer";

import {
  getEntries,
  getTrie,
  getHistory,
  addWord,
  deleteWord,
  searchWord,
  loadDemo,
  resetAll,
  type EntryItem,
  type HistoryEntry,
  type OperationResponse,
  type SearchResponse,
  type GraphData,
} from "@/lib/api";

export default function HomePage() {
  // ── Core state ─────────────────────────────────────────────────────
  const [entries, setEntries] = useState<EntryItem[]>([]);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // ── Operation state ────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ── Results ────────────────────────────────────────────────────────
  const [operationResult, setOperationResult] = useState<{
    action: "add" | "delete";
    data: OperationResponse;
  } | null>(null);
  const [searchResult, setSearchResult] = useState<SearchResponse | null>(null);

  // ── Visualization highlights ───────────────────────────────────────
  const [highlightEdges, setHighlightEdges] = useState<Set<string>>(new Set());
  const [highlightType, setHighlightType] = useState<"search" | "insert" | "delete" | null>(null);
  const [searchFound, setSearchFound] = useState(false);
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);

  // ── Auto-clear messages ────────────────────────────────────────────
  useEffect(() => {
    if (error || successMsg) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccessMsg(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, successMsg]);

  // ── Clear highlights after timeout ─────────────────────────────────
  const clearHighlightsLater = useCallback(() => {
    setTimeout(() => {
      setHighlightEdges(new Set());
      setHighlightType(null);
      setSearchFound(false);
    }, 4000);
  }, []);

  // ── Compute highlight edges from graph_data ────────────────────────
  const computePathEdges = useCallback((gd: GraphData, path: string[]): Set<string> => {
    const edgeSet = new Set<string>();
    if (!gd || path.length <= 1) return edgeSet;

    const childEdges = new Map<string, typeof gd.edges>();
    for (const e of gd.edges) {
      const list = childEdges.get(e.source) || [];
      list.push(e);
      childEdges.set(e.source, list);
    }

    let currentNodeId = "root";
    for (let i = 1; i < path.length; i++) {
      const edgeLabel = path[i];
      if (edgeLabel.startsWith("(")) continue;
      const cleanLabel = edgeLabel.replace(/ \(partial match:.*\)$/, "");
      const outgoing = childEdges.get(currentNodeId) || [];
      const matchingEdge = outgoing.find((e) => e.label === cleanLabel);
      if (matchingEdge) {
        edgeSet.add(`${matchingEdge.source}->${matchingEdge.target}`);
        currentNodeId = matchingEdge.target;
      } else {
        break;
      }
    }
    return edgeSet;
  }, []);

  // ── Data fetching ──────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      const [entriesRes, trieRes, historyRes] = await Promise.all([
        getEntries(),
        getTrie(),
        getHistory(),
      ]);
      setEntries(entriesRes.entries);
      setGraphData(trieRes.graph_data);
      setWordCount(trieRes.word_count);
      setHistory(historyRes.history);
      setError(null);
    } catch {
      setError("Unable to connect to the backend. Make sure the API server is running on http://localhost:8000");
    } finally {
      setInitLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Handlers ───────────────────────────────────────────────────────
  const handleAdd = useCallback(
    async (word: string, meaning: string) => {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);
      setSearchResult(null);
      try {
        const result = await addWord(word, meaning);
        setOperationResult({ action: "add", data: result });
        setSuccessMsg(result.message);
        await fetchAll();

        if (result.after_tree.graph_data) {
          const afterGraph = result.after_tree.graph_data as GraphData;
          const searchRes = await searchWord(word);
          const edges = computePathEdges(afterGraph, searchRes.traversal_path);
          setHighlightEdges(edges);
          setHighlightType("insert");
          setSearchFound(true);
          clearHighlightsLater();
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Add failed");
      } finally {
        setLoading(false);
      }
    },
    [fetchAll, computePathEdges, clearHighlightsLater]
  );

  const handleDelete = useCallback(
    async (word: string) => {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);
      setSearchResult(null);

      try {
        const beforeSearch = await searchWord(word);
        if (beforeSearch.found && graphData) {
          const edges = computePathEdges(graphData, beforeSearch.traversal_path);
          setHighlightEdges(edges);
          setHighlightType("delete");
          setSearchFound(false);
        }
      } catch {
        // ignore pre-search errors
      }

      await new Promise((r) => setTimeout(r, 600));

      try {
        const result = await deleteWord(word);
        setOperationResult({ action: "delete", data: result });
        setSuccessMsg(result.message);
        await fetchAll();
        setHighlightEdges(new Set());
        setHighlightType(null);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Delete failed");
        setHighlightEdges(new Set());
        setHighlightType(null);
      } finally {
        setLoading(false);
      }
    },
    [fetchAll, graphData, computePathEdges]
  );

  const handleSearch = useCallback(
    async (word: string) => {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);
      setOperationResult(null);
      try {
        const result = await searchWord(word);
        setSearchResult(result);

        if (graphData) {
          const edges = computePathEdges(graphData, result.traversal_path);
          setHighlightEdges(edges);
          setHighlightType("search");
          setSearchFound(result.found);
          clearHighlightsLater();
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Search failed");
      } finally {
        setLoading(false);
      }
    },
    [graphData, computePathEdges, clearHighlightsLater]
  );

  const handleDemo = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    setSearchResult(null);
    setOperationResult(null);
    setHighlightEdges(new Set());
    setHighlightType(null);
    try {
      const result = await loadDemo();
      setSuccessMsg(result.message);
      await fetchAll();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load demo");
    } finally {
      setLoading(false);
    }
  }, [fetchAll]);

  const handleReset = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    setSearchResult(null);
    setOperationResult(null);
    setHighlightEdges(new Set());
    setHighlightType(null);
    try {
      const result = await resetAll();
      setSuccessMsg(result.message);
      await fetchAll();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to reset");
    } finally {
      setLoading(false);
    }
  }, [fetchAll]);

  const handleRowHover = useCallback((word: string) => {
    setHoveredWord(word);
  }, []);

  const handleRowHoverEnd = useCallback(() => {
    setHoveredWord(null);
  }, []);

  const handleNodeHover = useCallback((word: string | null) => {
    setHoveredWord(word);
  }, []);

  // ── Loading screen ─────────────────────────────────────────────────
  if (initLoading) {
    return (
      <div className="min-h-screen bg-[#080e1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-indigo-500" />
          <p className="text-sm text-slate-500">Loading dictionary…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080e1a] text-slate-100">
      {/* ── Header ─── */}
      <header className="border-b border-slate-800/60 bg-[#0a1020]/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo / brand mark */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 relative overflow-hidden">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth={2}>
                <path d="M12 3v5m0 0l-4 5m4-5l4 5m-8 0l-3 4m7-4v8m4-8l3 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h1 className="text-[17px] font-bold text-slate-100 tracking-tight">
                Radix-Trie Dictionary
              </h1>
              <p className="text-[11px] text-slate-500 tracking-wide">
                Compressed Trie · English Dictionary · Interactive Visualization
              </p>
            </div>
          </div>
          <div className="flex items-center gap-5 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>
                Words: <span className="text-slate-300 font-semibold">{wordCount}</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>
                Operations: <span className="text-slate-300 font-semibold">{history.length}</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main content ─── */}
      <main className="max-w-[1600px] mx-auto px-6 py-5">
        <div className="grid grid-cols-[320px_1fr] gap-5">
          {/* Left panel */}
          <div className="space-y-4 max-h-[calc(100vh-76px)] overflow-y-auto sticky top-[56px] pr-1 custom-scrollbar">
            <OperationPanel
              onAdd={handleAdd}
              onDelete={handleDelete}
              onSearch={handleSearch}
              onDemo={handleDemo}
              onReset={handleReset}
              loading={loading}
              error={error}
              successMsg={successMsg}
              searchResult={searchResult}
            />

            {operationResult && (
              <OperationResultPanel result={operationResult} />
            )}

            {/* How It Works */}
            <div className="rounded-xl border border-slate-700/60 bg-[#0c1222] overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-700/40 flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-indigo-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-medium text-slate-400">How It Works</span>
              </div>
              <div className="px-4 py-3 space-y-2 text-[11px] leading-relaxed text-slate-500">
                <p>
                  <span className="text-violet-400/70">●</span>{" "}
                  The Radix Trie compresses chains of single-child nodes into
                  single edges with <span className="text-slate-300">substring labels</span>.
                </p>
                <p>
                  <span className="text-emerald-400/70">●</span>{" "}
                  <span className="text-slate-300">Inserting</span> a word may <span className="text-slate-300">split</span> an
                  existing edge when words share a partial prefix.
                </p>
                <p>
                  <span className="text-red-400/70">●</span>{" "}
                  <span className="text-slate-300">Deleting</span> may <span className="text-slate-300">merge</span> edges when
                  nodes become unnecessary after removal.
                </p>
                <p>
                  <span className="text-amber-400/70">●</span>{" "}
                  <span className="text-slate-300">Search</span> traverses edges without modifying the tree.
                  The path is highlighted in <span className="text-amber-300">amber</span>.
                </p>
                <p>
                  <span className="text-indigo-400/70">●</span>{" "}
                  Hover a word row in the table to highlight its
                  <span className="text-slate-300"> full path</span> in the trie.
                </p>
              </div>
            </div>
          </div>

          {/* Main content area */}
          <div className="space-y-5">
            <RadixTrieVisualization
              graphData={graphData}
              wordCount={wordCount}
              highlightEdges={highlightEdges}
              highlightType={highlightType}
              searchFound={searchFound}
              hoveredWord={hoveredWord}
              onNodeHover={handleNodeHover}
            />

            <div className="grid grid-cols-2 gap-5">
              <EntriesTable
                entries={entries}
                onRowHover={handleRowHover}
                onRowHoverEnd={handleRowHoverEnd}
              />
              <OperationHistory history={history} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
