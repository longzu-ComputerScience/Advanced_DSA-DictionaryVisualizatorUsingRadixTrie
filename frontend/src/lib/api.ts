/**
 * API client for communicating with the FastAPI backend.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// ── Types ──────────────────────────────────────────────────────────

export interface GraphNode {
  id: string;
  is_root: boolean;
  is_end: boolean;
  meaning: string | null;
  word: string | null;
  child_count: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  label: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface TrieSnapshot {
  text_tree: string;
  tree_data: Record<string, unknown>;
  graph_data?: GraphData;
}

export interface OperationResponse {
  success: boolean;
  message: string;
  explanation: string;
  before_tree: TrieSnapshot;
  after_tree: TrieSnapshot;
}

export interface StructuredPathStep {
  edge_label: string | null;
  status: "visited" | "match" | "partial" | "mismatch" | "no_match";
  matched_prefix?: string;
  remaining?: string;
  node_id?: string;
}

export interface SearchResponse {
  found: boolean;
  word: string;
  meaning: string | null;
  traversal_path: string[];
  structured_path: StructuredPathStep[];
  tree_snapshot: TrieSnapshot;
  message: string;
}

export interface EntryItem {
  word: string;
  meaning: string;
}

export interface EntriesResponse {
  entries: EntryItem[];
  count: number;
}

export interface TrieResponse {
  text_tree: string;
  tree_data: Record<string, unknown>;
  graph_data: GraphData;
  word_count: number;
}

export interface HistoryEntry {
  id: number;
  action: string;
  word: string;
  meaning: string | null;
  success: boolean;
  message: string;
  explanation: string;
  timestamp: string;
}

export interface HistoryResponse {
  history: HistoryEntry[];
  count: number;
}

export interface StatusResponse {
  success: boolean;
  message: string;
}

// ── API calls ──────────────────────────────────────────────────────

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed (${res.status})`);
  }
  return res.json();
}

export async function getEntries(): Promise<EntriesResponse> {
  const res = await fetch(`${API_BASE}/entries`);
  return handleResponse(res);
}

export async function getTrie(): Promise<TrieResponse> {
  const res = await fetch(`${API_BASE}/trie`);
  return handleResponse(res);
}

export async function addWord(
  word: string,
  meaning: string
): Promise<OperationResponse> {
  const res = await fetch(`${API_BASE}/words`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ word, meaning }),
  });
  return handleResponse(res);
}

export async function deleteWord(word: string): Promise<OperationResponse> {
  const res = await fetch(
    `${API_BASE}/words/${encodeURIComponent(word)}`,
    { method: "DELETE" }
  );
  return handleResponse(res);
}

export async function searchWord(word: string): Promise<SearchResponse> {
  const res = await fetch(
    `${API_BASE}/search?word=${encodeURIComponent(word)}`
  );
  return handleResponse(res);
}

export async function getHistory(): Promise<HistoryResponse> {
  const res = await fetch(`${API_BASE}/history`);
  return handleResponse(res);
}

export async function loadDemo(): Promise<StatusResponse> {
  const res = await fetch(`${API_BASE}/demo`, { method: "POST" });
  return handleResponse(res);
}

export async function resetAll(): Promise<StatusResponse> {
  const res = await fetch(`${API_BASE}/reset`, { method: "POST" });
  return handleResponse(res);
}
