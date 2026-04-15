"use client";

import React, { useMemo, useState, useCallback } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  Position,
  MarkerType,
  Handle,
  NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { GraphData, GraphEdge } from "@/lib/api";

/* ─── Types ─── */

interface TrieVisualizationProps {
  graphData: GraphData | null;
  wordCount: number;
  highlightEdges?: Set<string>;
  highlightType?: "search" | "insert" | "delete" | null;
  searchFound?: boolean;
  hoveredWord?: string | null;
  onNodeHover?: (word: string | null) => void;
}

/* ─── Layout engine ─── */

/**
 * The layout engine assigns an (x, y) to every node so that:
 *   - Children are spread horizontally beneath their parent.
 *   - Each subtree's width accounts for both the node content width
 *     AND the incoming edge label width, preventing overlap.
 *   - The parent is centred above its children.
 *
 * The edge-label bug is fixed by:
 *   1. Using `type: "default"` (straight line) edges instead of
 *      `smoothstep`.  Straight edges always connect source → target
 *      in a direct line, so the midpoint (where ReactFlow places
 *      the label) is guaranteed to sit on the correct branch.
 *   2. Ensuring enough horizontal spacing via label-aware subtree
 *      width calculations.
 */

interface LayoutNode {
  id: string;
  is_root: boolean;
  is_end: boolean;
  meaning: string | null;
  word: string | null;
  x: number;
  y: number;
}

function buildLayout(graphData: GraphData) {
  const childMap = new Map<string, GraphEdge[]>();
  for (const edge of graphData.edges) {
    const children = childMap.get(edge.source) || [];
    children.push(edge);
    childMap.set(edge.source, children);
  }
  const nodeMap = new Map(graphData.nodes.map((n) => [n.id, n]));

  const LEVEL_HEIGHT = 130;
  const H_GAP = 40;
  const MIN_NODE_WIDTH = 70;
  const CHAR_PX = 8;

  /** Width of the visual node box */
  function getNodeWidth(nodeId: string): number {
    const gNode = nodeMap.get(nodeId);
    if (!gNode) return MIN_NODE_WIDTH;
    if (gNode.is_root) return 70;
    if (gNode.is_end && gNode.word) {
      return Math.max(MIN_NODE_WIDTH, gNode.word.length * CHAR_PX + 40);
    }
    return MIN_NODE_WIDTH;
  }

  /** Width occupied by the incoming edge label */
  function getEdgeLabelWidth(nodeId: string): number {
    for (const edge of graphData.edges) {
      if (edge.target === nodeId) {
        return Math.max(0, edge.label.length * CHAR_PX + 24);
      }
    }
    return 0;
  }

  /** Total width required by the subtree rooted at nodeId */
  function getSubtreeWidth(nodeId: string): number {
    const ownWidth = Math.max(
      getNodeWidth(nodeId),
      getEdgeLabelWidth(nodeId),
    );
    const children = childMap.get(nodeId) || [];
    if (children.length === 0) return Math.max(MIN_NODE_WIDTH, ownWidth);

    let total = 0;
    for (const edge of children) {
      total += getSubtreeWidth(edge.target);
    }
    total += (children.length - 1) * H_GAP;
    return Math.max(ownWidth, total);
  }

  const layoutNodes: LayoutNode[] = [];

  function layout(nodeId: string, x: number, y: number, availableWidth: number) {
    const gNode = nodeMap.get(nodeId);
    if (!gNode) return;

    layoutNodes.push({
      id: nodeId,
      is_root: gNode.is_root,
      is_end: gNode.is_end,
      meaning: gNode.meaning,
      word: gNode.word,
      x: x + availableWidth / 2,
      y,
    });

    const children = childMap.get(nodeId) || [];
    if (children.length === 0) return;

    const childWidths = children.map((e) => getSubtreeWidth(e.target));
    const totalChildWidth =
      childWidths.reduce((a, b) => a + b, 0) +
      (children.length - 1) * H_GAP;
    let childX = x + (availableWidth - totalChildWidth) / 2;

    for (let i = 0; i < children.length; i++) {
      layout(children[i].target, childX, y + LEVEL_HEIGHT, childWidths[i]);
      childX += childWidths[i] + H_GAP;
    }
  }

  const totalWidth = getSubtreeWidth("root");
  layout("root", 0, 0, totalWidth);
  return layoutNodes;
}

/* ─── Custom Node Component ─── */

interface RadixNodeData {
  is_root: boolean;
  is_end: boolean;
  meaning: string | null;
  word: string | null;
  edgeLabel: string | null;
  isHighlighted: boolean;
  highlightType: "search" | "insert" | "delete" | null;
  searchFound: boolean;
  isHovered: boolean;
  onNodeHover?: (word: string | null) => void;
  label: string;
  [key: string]: unknown;
}

function RadixTrieNode({ data }: NodeProps<Node<RadixNodeData>>) {
  const {
    is_root,
    is_end,
    meaning,
    word,
    isHighlighted,
    highlightType,
    searchFound,
    isHovered,
    onNodeHover,
  } = data;

  const [showTooltip, setShowTooltip] = useState(false);

  let borderColor = "rgba(100, 116, 139, 0.6)";
  let nodeShadow = "0 1px 4px rgba(0,0,0,0.3)";
  let nodeBg = is_root ? "#1e1b4b" : is_end ? "#052e16" : "#1e293b";
  let animClass = "";

  if (isHighlighted) {
    if (highlightType === "search") {
      if (searchFound && is_end) {
        borderColor = "#10b981";
        nodeShadow = "0 0 16px rgba(16,185,129,0.5)";
        nodeBg = "#064e3b";
      } else {
        borderColor = "#f59e0b";
        nodeShadow = "0 0 14px rgba(245,158,11,0.4)";
        nodeBg = "#451a03";
        animClass = "animate-search-glow";
      }
    } else if (highlightType === "insert") {
      borderColor = "#22c55e";
      nodeShadow = "0 0 14px rgba(34,197,94,0.45)";
      nodeBg = "#052e16";
      animClass = "animate-insert-glow";
    } else if (highlightType === "delete") {
      borderColor = "#ef4444";
      nodeShadow = "0 0 14px rgba(239,68,68,0.45)";
      nodeBg = "#450a0a";
      animClass = "animate-delete-glow";
    }
  } else if (isHovered) {
    borderColor = "#818cf8";
    nodeShadow = "0 0 14px rgba(99,102,241,0.35)";
    nodeBg = is_root ? "#2e1065" : is_end ? "#064e3b" : "#1e1b4b";
  }

  return (
    <div
      className={`relative cursor-default select-none ${animClass}`}
      style={{
        background: nodeBg,
        border: `2px solid ${borderColor}`,
        borderRadius: is_root ? "14px" : is_end ? "10px" : "50%",
        padding: is_root ? "8px 16px" : is_end ? "6px 14px" : "8px",
        fontFamily: "'Inter', system-ui, sans-serif",
        textAlign: "center",
        boxShadow: nodeShadow,
        transition: "border-color 0.3s, box-shadow 0.3s, background 0.3s",
        minWidth: is_root ? "60px" : is_end ? "auto" : "28px",
        minHeight: is_root ? "36px" : is_end ? "30px" : "28px",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={() => {
        setShowTooltip(true);
        if (word && onNodeHover) onNodeHover(word);
      }}
      onMouseLeave={() => {
        setShowTooltip(false);
        if (onNodeHover) onNodeHover(null);
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0, width: 0, height: 0 }} />

      {is_root ? (
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", color: "#c4b5fd" }}>ROOT</span>
      ) : is_end ? (
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "#34d399", flexShrink: 0,
          }} />
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#6ee7b7",
            whiteSpace: "nowrap",
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            letterSpacing: "0.02em",
          }}>
            {word || "•"}
          </span>
        </div>
      ) : (
        <div style={{
          width: 10, height: 10, borderRadius: "50%",
          background: "#64748b",
        }} />
      )}

      {/* Tooltip on hover */}
      {showTooltip && (meaning || word) && (
        <div className="tree-node-tooltip">
          {word && <div style={{ fontWeight: 600, color: "#a5b4fc", marginBottom: 2, fontSize: 12 }}>{word}</div>}
          {meaning && <div style={{ color: "#94a3b8", maxWidth: 240, whiteSpace: "normal", fontSize: 11, lineHeight: "1.35" }}>{meaning}</div>}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, width: 0, height: 0 }} />
    </div>
  );
}

const nodeTypes = { radixNode: RadixTrieNode };

/* ─── Main Component ─── */

export default function RadixTrieVisualization({
  graphData,
  wordCount,
  highlightEdges = new Set(),
  highlightType = null,
  searchFound = false,
  hoveredWord = null,
  onNodeHover,
}: TrieVisualizationProps) {
  // Build word-to-path mapping for hover from entries table
  const wordPathNodes = useMemo(() => {
    if (!graphData || !hoveredWord) return new Set<string>();
    const edgeMap = new Map<string, { target: string; label: string }[]>();
    for (const edge of graphData.edges) {
      const children = edgeMap.get(edge.source) || [];
      children.push({ target: edge.target, label: edge.label });
      edgeMap.set(edge.source, children);
    }
    const path = new Set<string>();
    (function findPath(nodeId: string, currentPath: string[]): boolean {
      const nodeData = graphData.nodes.find((n) => n.id === nodeId);
      if (!nodeData) return false;
      currentPath.push(nodeId);
      if (nodeData.word === hoveredWord) {
        for (const p of currentPath) path.add(p);
        return true;
      }
      const children = edgeMap.get(nodeId) || [];
      for (const child of children) {
        if (findPath(child.target, [...currentPath])) return true;
      }
      return false;
    })("root", []);
    return path;
  }, [graphData, hoveredWord]);

  const wordPathEdges = useMemo(() => {
    if (!graphData || !hoveredWord) return new Set<string>();
    const edges = new Set<string>();
    for (const edge of graphData.edges) {
      if (wordPathNodes.has(edge.source) && wordPathNodes.has(edge.target)) {
        edges.add(`${edge.source}->${edge.target}`);
      }
    }
    return edges;
  }, [graphData, hoveredWord, wordPathNodes]);

  const { flowNodes, flowEdges } = useMemo(() => {
    if (!graphData || graphData.nodes.length === 0) {
      return { flowNodes: [], flowEdges: [] };
    }

    const layoutNodes = buildLayout(graphData);

    // Build edge-label map: target node id -> edge label
    const edgeLabelMap = new Map<string, string>();
    for (const edge of graphData.edges) {
      edgeLabelMap.set(edge.target, edge.label);
    }

    // Build highlighted node set from highlighted edges
    const highlightedNodes = new Set<string>();
    for (const edgeKey of highlightEdges) {
      const [source, target] = edgeKey.split("->");
      highlightedNodes.add(source);
      highlightedNodes.add(target);
    }

    const flowNodes: Node[] = layoutNodes.map((n) => ({
      id: n.id,
      position: { x: n.x - 40, y: n.y },
      type: "radixNode",
      data: {
        label: n.is_root ? "ROOT" : n.word || "•",
        is_root: n.is_root,
        is_end: n.is_end,
        meaning: n.meaning,
        word: n.word,
        edgeLabel: edgeLabelMap.get(n.id) || null,
        isHighlighted: highlightedNodes.has(n.id),
        highlightType,
        searchFound,
        isHovered: wordPathNodes.has(n.id),
        onNodeHover,
      },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    }));

    /*
     * KEY FIX: Use `type: "default"` (straight line) instead of "smoothstep".
     *
     * The smoothstep edge type routes edges through orthogonal segments with
     * rounded corners. When many sibling edges fan out from the same parent,
     * the routing algorithm produces overlapping paths, and the label (placed
     * at the path midpoint) ends up visually on a neighboring branch.
     *
     * Straight edges draw a direct line from source-handle center to
     * target-handle center. The midpoint — where ReactFlow anchors the
     * label — is therefore geometrically guaranteed to lie on the correct
     * branch, regardless of how many siblings exist.
     */
    const flowEdges: Edge[] = graphData.edges.map((e, i) => {
      const edgeKey = `${e.source}->${e.target}`;
      const isHL = highlightEdges.has(edgeKey);
      const isHover = wordPathEdges.has(edgeKey);
      let strokeColor = "rgba(100, 116, 139, 0.4)";
      let strokeWidth = 1.5;
      let labelColor = "#94a3b8";

      if (isHL) {
        strokeColor = highlightType === "search"
          ? "#f59e0b"
          : highlightType === "insert"
          ? "#22c55e"
          : highlightType === "delete"
          ? "#ef4444"
          : "#6366f1";
        strokeWidth = 2.5;
        labelColor = strokeColor;
      } else if (isHover) {
        strokeColor = "#818cf8";
        strokeWidth = 2;
        labelColor = "#a5b4fc";
      }

      return {
        id: `edge-${i}`,
        source: e.source,
        target: e.target,
        type: "default",          // straight line — labels always on correct branch
        label: e.label,
        labelStyle: {
          fill: labelColor,
          fontSize: 11,
          fontWeight: 600,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          letterSpacing: "0.03em",
        },
        labelBgStyle: {
          fill: "#0f172a",
          fillOpacity: 0.92,
          stroke: isHL ? strokeColor : "rgba(71, 85, 105, 0.35)",
          strokeWidth: 1,
          rx: 4,
          ry: 4,
        },
        labelBgPadding: [4, 7] as [number, number],
        labelBgBorderRadius: 4,
        style: {
          stroke: strokeColor,
          strokeWidth,
          transition: "all 0.3s ease-out",
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: strokeColor,
          width: 10,
          height: 7,
        },
      };
    });

    return { flowNodes, flowEdges };
  }, [graphData, highlightEdges, highlightType, searchFound, wordPathNodes, wordPathEdges, onNodeHover]);

  return (
    <div className="rounded-xl border border-slate-700/60 bg-[#0c1222] overflow-hidden panel-card">
      {/* Header */}
      <div className="px-5 py-3 border-b border-slate-700/40 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.8}>
            <path d="M10 3v5m0 0l-3 4m3-4l3 4m-6 0l-3 4m9-4v8m5-8l3 4" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400" />
          </svg>
          <h3 className="text-sm font-semibold text-slate-200 tracking-tight">Radix Trie Structure</h3>
        </div>
        <span className="ml-auto text-[10px] text-slate-500 font-mono bg-slate-800/60 px-2 py-0.5 rounded">
          {wordCount} {wordCount === 1 ? "word" : "words"}
        </span>
      </div>

      {/* Visualization area */}
      {!graphData || graphData.nodes.length === 0 ? (
        <div className="h-[420px] flex flex-col items-center justify-center text-slate-600 text-sm gap-3">
          <svg className="w-10 h-10 opacity-25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <div className="text-center">
            <p className="italic text-slate-500">Empty trie</p>
            <p className="text-xs text-slate-600 mt-1">Add words or load demo data to visualize</p>
          </div>
        </div>
      ) : (
        <div className="h-[420px]">
          <ReactFlow
            nodes={flowNodes}
            edges={flowEdges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.3, maxZoom: 1.5 }}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            panOnDrag={true}
            zoomOnScroll={true}
            proOptions={{ hideAttribution: true }}
            minZoom={0.15}
            maxZoom={2.5}
          />
        </div>
      )}

      {/* Legend */}
      <div className="px-5 py-2.5 border-t border-slate-700/40 flex items-center gap-5 text-[10px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-[4px] border-2 border-violet-400/80 bg-[#1e1b4b]" />
          <span>Root</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-slate-700/80 border border-slate-500/60" />
          <span>Internal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-[3px] border-2 border-emerald-500/70 bg-[#052e16]" />
          <span>Word End</span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <div className="font-mono text-[10px] text-indigo-400/80 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/40">abc</div>
          <span>Edge label</span>
        </div>
      </div>
    </div>
  );
}
