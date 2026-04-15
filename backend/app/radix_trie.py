"""
Radix Trie (Compressed Trie) Implementation
============================================
A Radix Trie stores strings by compressing chains of single-child nodes
into single edges labeled with substrings.  This reduces memory usage and
speeds up lookups compared to a standard (character-level) Trie.

Key properties:
- Each edge stores a substring (not just one character).
- Internal nodes represent shared prefixes.
- Leaf / word-end nodes store the meaning of the word.
"""

from __future__ import annotations
from typing import Optional


class RadixTrieNode:
    """A single node in the Radix Trie."""

    __slots__ = ("children", "is_end_of_word", "meaning")

    def __init__(self) -> None:
        # children maps edge-label (substring) -> child node
        self.children: dict[str, RadixTrieNode] = {}
        self.is_end_of_word: bool = False
        self.meaning: Optional[str] = None

    def to_dict(self) -> dict:
        """Convert the subtree rooted here into a JSON-friendly dict."""
        return {
            "is_end": self.is_end_of_word,
            "meaning": self.meaning,
            "children": {
                label: child.to_dict()
                for label, child in sorted(self.children.items())
            },
        }


class RadixTrie:
    """
    Radix Trie (Patricia Trie) supporting insert, delete, search,
    and several visualisation helpers used by the API layer.
    """

    def __init__(self) -> None:
        self.root = RadixTrieNode()

    # ==================================================================
    # INSERT
    # ==================================================================

    def insert(self, word: str, meaning: str) -> dict:
        """
        Insert *word* with its *meaning* into the trie.

        Returns a result dict with:
          - updated (bool): True if word already existed and meaning was updated
          - explanation (str): human-readable description of what happened
        """
        word = word.strip().lower()
        meaning = meaning.strip()

        node = self.root
        remaining = word
        explanation_parts: list[str] = []

        while remaining:
            match_found = False

            for label, child in list(node.children.items()):
                prefix_len = self._common_prefix_length(remaining, label)

                if prefix_len == 0:
                    continue

                match_found = True

                # --- Case 1: exact edge match ---
                if prefix_len == len(label) and prefix_len == len(remaining):
                    if child.is_end_of_word:
                        old_meaning = child.meaning
                        child.meaning = meaning
                        explanation_parts.append(
                            f'Word "{word}" already existed '
                            f'(old meaning: "{old_meaning}"). '
                            f'Meaning updated to "{meaning}".'
                        )
                        return {
                            "updated": True,
                            "explanation": " ".join(explanation_parts),
                        }
                    else:
                        child.is_end_of_word = True
                        child.meaning = meaning
                        explanation_parts.append(
                            f'Marked existing node at end of edge '
                            f'"{label}" as word-end for "{word}".'
                        )
                        return {
                            "updated": False,
                            "explanation": " ".join(explanation_parts),
                        }

                # --- Case 2: label fully consumed, remaining has more ---
                if prefix_len == len(label):
                    explanation_parts.append(f'Traversed edge "{label}".')
                    node = child
                    remaining = remaining[prefix_len:]
                    break

                # --- Case 3: partial match -> split existing edge ---
                common = label[:prefix_len]
                rest_of_label = label[prefix_len:]
                rest_of_remaining = remaining[prefix_len:]

                split_node = RadixTrieNode()
                split_node.children[rest_of_label] = child

                del node.children[label]
                node.children[common] = split_node

                explanation_parts.append(
                    f'Split edge "{label}" into "{common}" + "{rest_of_label}".'
                )

                if rest_of_remaining:
                    new_leaf = RadixTrieNode()
                    new_leaf.is_end_of_word = True
                    new_leaf.meaning = meaning
                    split_node.children[rest_of_remaining] = new_leaf
                    explanation_parts.append(
                        f'Created new edge "{rest_of_remaining}" '
                        f'with meaning for "{word}".'
                    )
                else:
                    split_node.is_end_of_word = True
                    split_node.meaning = meaning
                    explanation_parts.append(
                        f'Word "{word}" ends at the split node "{common}".'
                    )

                return {
                    "updated": False,
                    "explanation": " ".join(explanation_parts),
                }

            if not match_found:
                new_node = RadixTrieNode()
                new_node.is_end_of_word = True
                new_node.meaning = meaning
                node.children[remaining] = new_node
                explanation_parts.append(
                    f'Created new edge "{remaining}" for word "{word}".'
                )
                return {
                    "updated": False,
                    "explanation": " ".join(explanation_parts),
                }

        return {"updated": False, "explanation": "No insertion performed."}

    # ==================================================================
    # DELETE
    # ==================================================================

    def delete(self, word: str) -> dict:
        """
        Delete *word* from the trie.

        Returns a result dict with:
          - deleted (bool)
          - explanation (str)
        """
        word = word.strip().lower()
        explanation_parts: list[str] = []
        deleted = self._delete_helper(self.root, word, explanation_parts)
        if deleted:
            return {"deleted": True, "explanation": " ".join(explanation_parts)}
        return {"deleted": False, "explanation": "Word not found in the trie."}

    def _delete_helper(
        self, node: RadixTrieNode, remaining: str, explanation: list[str]
    ) -> bool:
        """Return True if deletion was successful."""
        if not remaining:
            if not node.is_end_of_word:
                return False
            node.is_end_of_word = False
            node.meaning = None
            explanation.append("Unmarked node as word-end.")
            return True

        for label, child in list(node.children.items()):
            prefix_len = self._common_prefix_length(remaining, label)
            if prefix_len == 0:
                continue
            if prefix_len < len(label):
                return False
            # prefix_len == len(label)
            if self._delete_helper(child, remaining[prefix_len:], explanation):
                # Remove childless non-word nodes
                if not child.is_end_of_word and not child.children:
                    del node.children[label]
                    explanation.append(f'Removed empty edge "{label}".')
                # Merge: child has exactly one grandchild and is not a word-end
                elif not child.is_end_of_word and len(child.children) == 1:
                    grandchild_label, grandchild = next(iter(child.children.items()))
                    merged_label = label + grandchild_label
                    del node.children[label]
                    node.children[merged_label] = grandchild
                    explanation.append(
                        f'Merged edges "{label}" + "{grandchild_label}" '
                        f'into "{merged_label}".'
                    )
                return True
            return False

        return False

    # ==================================================================
    # SEARCH
    # ==================================================================

    def search(self, word: str) -> dict:
        """
        Search for *word* in the trie.

        Returns a result dict with:
          - found (bool)
          - meaning (str | None)
          - traversal_path (list[str]): flat edge-label list (backward compat)
          - structured_path (list[dict]): rich path with node_id/edge info
        """
        word = word.strip().lower()
        node = self.root
        remaining = word
        traversal_path: list[str] = ["(root)"]
        structured_path: list[dict] = [{"node_id": "root", "edge_label": None, "status": "visited"}]

        while remaining:
            match_found = False
            for label, child in node.children.items():
                prefix_len = self._common_prefix_length(remaining, label)
                if prefix_len == 0:
                    continue

                match_found = True

                if prefix_len == len(label) and prefix_len == len(remaining):
                    traversal_path.append(label)
                    structured_path.append({
                        "edge_label": label,
                        "status": "match" if child.is_end_of_word else "partial",
                    })
                    if child.is_end_of_word:
                        return {
                            "found": True,
                            "meaning": child.meaning,
                            "traversal_path": traversal_path,
                            "structured_path": structured_path,
                        }
                    return {
                        "found": False,
                        "meaning": None,
                        "traversal_path": traversal_path,
                        "structured_path": structured_path,
                    }

                if prefix_len == len(label):
                    traversal_path.append(label)
                    structured_path.append({
                        "edge_label": label,
                        "status": "visited",
                    })
                    node = child
                    remaining = remaining[prefix_len:]
                    break

                # Partial match but edge label is longer than remaining input
                traversal_path.append(
                    f"{label} (partial match: '{remaining[:prefix_len]}')"
                )
                structured_path.append({
                    "edge_label": label,
                    "status": "mismatch",
                    "matched_prefix": remaining[:prefix_len],
                })
                return {
                    "found": False,
                    "meaning": None,
                    "traversal_path": traversal_path,
                    "structured_path": structured_path,
                }

            if not match_found:
                traversal_path.append(f"(no matching edge for '{remaining}')")
                structured_path.append({
                    "edge_label": None,
                    "status": "no_match",
                    "remaining": remaining,
                })
                return {
                    "found": False,
                    "meaning": None,
                    "traversal_path": traversal_path,
                    "structured_path": structured_path,
                }

        if node.is_end_of_word:
            return {
                "found": True,
                "meaning": node.meaning,
                "traversal_path": traversal_path,
                "structured_path": structured_path,
            }
        return {
            "found": False,
            "meaning": None,
            "traversal_path": traversal_path,
            "structured_path": structured_path,
        }

    # ==================================================================
    # GRAPH SERIALIZATION (for ReactFlow visualization)
    # ==================================================================

    def to_graph(self) -> dict:
        """
        Serialize the trie as flat nodes/edges arrays for ReactFlow rendering.
        Each node has: id, label (edge label from parent), is_end, meaning, word
        Each edge has: source, target, label
        """
        nodes: list[dict] = []
        edges: list[dict] = []
        counter = [0]

        def walk(trie_node: RadixTrieNode, node_id: str, prefix: str) -> None:
            is_root = node_id == "root"
            nodes.append({
                "id": node_id,
                "is_root": is_root,
                "is_end": trie_node.is_end_of_word,
                "meaning": trie_node.meaning,
                "word": prefix if trie_node.is_end_of_word else None,
                "child_count": len(trie_node.children),
            })
            for label, child in sorted(trie_node.children.items()):
                counter[0] += 1
                child_id = f"n{counter[0]}"
                edges.append({
                    "source": node_id,
                    "target": child_id,
                    "label": label,
                })
                walk(child, child_id, prefix + label)

        walk(self.root, "root", "")
        return {"nodes": nodes, "edges": edges}

    # ==================================================================
    # ENTRIES & VISUALISATION
    # ==================================================================

    def get_all_entries(self) -> list[dict]:
        """Return all (word, meaning) pairs stored in the trie."""
        entries: list[dict] = []
        self._collect_entries(self.root, "", entries)
        return sorted(entries, key=lambda e: e["word"])

    def to_text_tree(self) -> str:
        """
        Return a human-readable text representation of the Radix Trie.

        Example::

            (root)
             \u2514\u2500\u2500 app
                  \u251c\u2500\u2500 le   [END] meaning="a fruit"
                  \u2514\u2500\u2500 ly   [END] meaning="to apply"
        """
        lines: list[str] = ["(root)"]
        self._build_text_tree(self.root, " ", lines)
        return "\n".join(lines)

    def to_dict(self) -> dict:
        """Serialise the whole trie to a JSON-compatible dict."""
        return self.root.to_dict()

    # ==================================================================
    # PRIVATE HELPERS
    # ==================================================================

    @staticmethod
    def _common_prefix_length(a: str, b: str) -> int:
        """Return the length of the longest common prefix of *a* and *b*."""
        i = 0
        while i < len(a) and i < len(b) and a[i] == b[i]:
            i += 1
        return i

    def _collect_entries(
        self, node: RadixTrieNode, prefix: str, entries: list[dict]
    ) -> None:
        if node.is_end_of_word:
            entries.append({"word": prefix, "meaning": node.meaning})
        for label, child in sorted(node.children.items()):
            self._collect_entries(child, prefix + label, entries)

    def _build_text_tree(
        self,
        node: RadixTrieNode,
        indent: str,
        lines: list[str],
    ) -> None:
        """Recursively build lines for the text-tree representation."""
        sorted_children = sorted(node.children.items())
        for i, (label, child) in enumerate(sorted_children):
            is_last = i == len(sorted_children) - 1
            connector = "\u2514\u2500\u2500 " if is_last else "\u251c\u2500\u2500 "
            suffix = ""
            if child.is_end_of_word:
                safe = (child.meaning or "").replace('"', '\\"')
                suffix = f'   [END] meaning="{safe}"'
            lines.append(f"{indent}{connector}{label}{suffix}")
            extension = "     " if is_last else "\u2502    "
            self._build_text_tree(child, indent + extension, lines)
