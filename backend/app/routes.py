"""
FastAPI route definitions for the Dictionary API.
"""

from fastapi import APIRouter, HTTPException, Query
from .radix_trie import RadixTrie
from .storage import load_entries, save_entries, _default_sample_data
from .history import OperationHistory
from .schemas import (
    AddWordRequest,
    OperationResponse,
    SearchResponse,
    EntriesResponse,
    EntryItem,
    TrieResponse,
    TrieSnapshot,
    HistoryResponse,
    HistoryEntry,
    StatusResponse,
)

router = APIRouter(prefix="/api")

# ── Shared state (initialised once at app startup) ───────────────────
trie = RadixTrie()
history = OperationHistory()


def _snapshot() -> TrieSnapshot:
    """Capture the current trie state as a TrieSnapshot."""
    return TrieSnapshot(
        text_tree=trie.to_text_tree(),
        tree_data=trie.to_dict(),
        graph_data=trie.to_graph(),
    )


def init_trie() -> None:
    """Load persisted entries into the Radix Trie. Called once at startup."""
    entries = load_entries()
    for entry in entries:
        trie.insert(entry["word"], entry["meaning"])


def _persist() -> None:
    """Write current trie entries to disk."""
    save_entries(trie.get_all_entries())


# ── Endpoints ────────────────────────────────────────────────────────


@router.get("/entries", response_model=EntriesResponse)
def get_entries():
    """Return all dictionary entries."""
    entries = trie.get_all_entries()
    return EntriesResponse(
        entries=[EntryItem(**e) for e in entries],
        count=len(entries),
    )


@router.get("/trie", response_model=TrieResponse)
def get_trie():
    """Return the current trie visualisation."""
    entries = trie.get_all_entries()
    return TrieResponse(
        text_tree=trie.to_text_tree(),
        tree_data=trie.to_dict(),
        graph_data=trie.to_graph(),
        word_count=len(entries),
    )


@router.post("/words", response_model=OperationResponse)
def add_word(body: AddWordRequest):
    """Add (or update) a word in the dictionary."""
    before = _snapshot()
    result = trie.insert(body.word, body.meaning)
    after = _snapshot()
    _persist()

    if result["updated"]:
        msg = f'Word "{body.word.strip().lower()}" updated successfully.'
    else:
        msg = f'Word "{body.word.strip().lower()}" added successfully.'

    history.add(
        action="add",
        word=body.word.strip().lower(),
        meaning=body.meaning.strip(),
        success=True,
        message=msg,
        explanation=result["explanation"],
    )

    return OperationResponse(
        success=True,
        message=msg,
        explanation=result["explanation"],
        before_tree=before,
        after_tree=after,
    )


@router.delete("/words/{word}", response_model=OperationResponse)
def delete_word(word: str):
    """Delete a word from the dictionary."""
    normalised = word.strip().lower()
    before = _snapshot()
    result = trie.delete(normalised)
    after = _snapshot()

    if result["deleted"]:
        _persist()
        msg = f'Word "{normalised}" deleted successfully.'
        history.add(
            action="delete",
            word=normalised,
            success=True,
            message=msg,
            explanation=result["explanation"],
        )
        return OperationResponse(
            success=True,
            message=msg,
            explanation=result["explanation"],
            before_tree=before,
            after_tree=after,
        )
    else:
        msg = f'Word "{normalised}" not found in the dictionary.'
        history.add(
            action="delete",
            word=normalised,
            success=False,
            message=msg,
            explanation=result["explanation"],
        )
        return OperationResponse(
            success=False,
            message=msg,
            explanation=result["explanation"],
            before_tree=before,
            after_tree=after,
        )


@router.get("/search", response_model=SearchResponse)
def search_word(word: str = Query(..., min_length=1)):
    """Search for a word - read-only, does not modify the trie."""
    normalised = word.strip().lower()
    snapshot = _snapshot()
    result = trie.search(normalised)

    if result["found"]:
        msg = f'Word "{normalised}" found.'
    else:
        msg = f'Word "{normalised}" not found in the dictionary.'

    history.add(
        action="search",
        word=normalised,
        success=result["found"],
        message=msg,
        explanation="Search is a read-only operation. The trie was not modified.",
    )

    return SearchResponse(
        found=result["found"],
        word=normalised,
        meaning=result["meaning"],
        traversal_path=result["traversal_path"],
        structured_path=result.get("structured_path", []),
        tree_snapshot=snapshot,
        message=msg,
    )


@router.get("/history", response_model=HistoryResponse)
def get_history():
    """Return the operation history log."""
    entries = history.get_all()
    return HistoryResponse(
        history=[HistoryEntry(**e) for e in entries],
        count=len(entries),
    )


@router.post("/demo", response_model=StatusResponse)
def load_demo():
    """Reset the trie to the default demo dataset."""
    global trie
    trie = RadixTrie()
    demo_data = _default_sample_data()
    for entry in demo_data:
        trie.insert(entry["word"], entry["meaning"])
    save_entries(demo_data)
    history.clear()
    history.add(
        action="demo",
        word="—",
        success=True,
        message=f"Loaded demo dataset with {len(demo_data)} words.",
        explanation="Trie replaced with the built-in sample dictionary.",
    )
    return StatusResponse(
        success=True,
        message=f"Demo dataset loaded with {len(demo_data)} words.",
    )


@router.post("/reset", response_model=StatusResponse)
def reset_all():
    """Clear all data from the trie and history."""
    global trie
    trie = RadixTrie()
    save_entries([])
    history.clear()
    history.add(
        action="reset",
        word="—",
        success=True,
        message="All data cleared.",
        explanation="Trie and dictionary storage have been reset to empty.",
    )
    return StatusResponse(
        success=True,
        message="All data has been cleared.",
    )
