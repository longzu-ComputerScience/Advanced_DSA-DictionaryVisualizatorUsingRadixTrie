"""
Persistence layer – loads / saves dictionary entries from/to a JSON file.
"""

import json
import os
from pathlib import Path
from typing import Any

# Resolve data directory relative to this file
_DATA_DIR = Path(__file__).resolve().parent.parent / "data"
_DATA_FILE = _DATA_DIR / "dictionary.json"


def _ensure_data_dir() -> None:
    """Create the data directory if it doesn't exist."""
    _DATA_DIR.mkdir(parents=True, exist_ok=True)


def load_entries() -> list[dict[str, str]]:
    """
    Load dictionary entries from the JSON file.
    Returns a list of {"word": ..., "meaning": ...} dicts.
    If the file doesn't exist, returns a default sample dataset.
    """
    _ensure_data_dir()
    if not _DATA_FILE.exists():
        sample = _default_sample_data()
        save_entries(sample)
        return sample

    with open(_DATA_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data


def save_entries(entries: list[dict[str, str]]) -> None:
    """Persist the list of entries to the JSON file (human-readable)."""
    _ensure_data_dir()
    # Sort alphabetically for readability
    entries_sorted = sorted(entries, key=lambda e: e["word"])
    with open(_DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(entries_sorted, f, indent=2, ensure_ascii=False)


def _default_sample_data() -> list[dict[str, str]]:
    """A small starter dataset so the app is never empty on first run."""
    return [
        {"word": "algorithm", "meaning": "A step-by-step procedure for solving a problem or accomplishing a task."},
        {"word": "apple", "meaning": "A round fruit with red, green, or yellow skin and firm white flesh."},
        {"word": "application", "meaning": "A formal request or a computer program designed for a specific purpose."},
        {"word": "apply", "meaning": "To make a formal request or to put something into operation."},
        {"word": "binary", "meaning": "Relating to or using a system of numerical notation with base 2."},
        {"word": "compile", "meaning": "To convert source code into machine code that a computer can execute."},
        {"word": "compress", "meaning": "To reduce the size or volume of something."},
        {"word": "computer", "meaning": "An electronic device for storing and processing data."},
        {"word": "data", "meaning": "Facts and statistics collected for reference or analysis."},
        {"word": "database", "meaning": "A structured set of data held in a computer."},
        {"word": "graph", "meaning": "A diagram showing the relation between variable quantities."},
        {"word": "hash", "meaning": "A function that converts input into a fixed-size string of bytes."},
        {"word": "heap", "meaning": "A specialized tree-based data structure that satisfies the heap property."},
        {"word": "node", "meaning": "A point of connection in a network or data structure."},
        {"word": "prefix", "meaning": "A word part added to the beginning of another word."},
        {"word": "queue", "meaning": "A linear data structure following First-In-First-Out (FIFO) order."},
        {"word": "radix", "meaning": "The base of a system of numeration; also refers to a type of tree structure."},
        {"word": "search", "meaning": "To look for information or a specific item within a dataset."},
        {"word": "stack", "meaning": "A linear data structure following Last-In-First-Out (LIFO) order."},
        {"word": "tree", "meaning": "A hierarchical data structure with a root node and child nodes."},
        {"word": "trie", "meaning": "A tree-like data structure used for efficient retrieval of keys in a dataset of strings."},
    ]
