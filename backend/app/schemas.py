"""
Pydantic schemas for request / response validation.
"""

from pydantic import BaseModel, field_validator
from typing import Optional, Any


# ── Request Schemas ──────────────────────────────────────────────────

class AddWordRequest(BaseModel):
    """Body for POST /api/words."""
    word: str
    meaning: str

    @field_validator("word")
    @classmethod
    def word_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Word must not be empty.")
        return v.strip()

    @field_validator("meaning")
    @classmethod
    def meaning_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Meaning must not be empty.")
        return v.strip()


# ── Response Schemas ─────────────────────────────────────────────────

class TrieSnapshot(BaseModel):
    """A snapshot of the Radix Trie state."""
    text_tree: str
    tree_data: dict
    graph_data: Optional[dict] = None


class OperationResponse(BaseModel):
    """Standard response for add / delete operations."""
    success: bool
    message: str
    explanation: str
    before_tree: TrieSnapshot
    after_tree: TrieSnapshot


class SearchPathStep(BaseModel):
    """One step in a structured search traversal path."""
    edge_label: Optional[str] = None
    status: str  # "visited", "match", "partial", "mismatch", "no_match"
    matched_prefix: Optional[str] = None
    remaining: Optional[str] = None
    node_id: Optional[str] = None


class SearchResponse(BaseModel):
    """Response for search operations."""
    found: bool
    word: str
    meaning: Optional[str] = None
    traversal_path: list[str]
    structured_path: list[dict[str, Any]]
    tree_snapshot: TrieSnapshot
    message: str


class EntryItem(BaseModel):
    word: str
    meaning: str


class EntriesResponse(BaseModel):
    entries: list[EntryItem]
    count: int


class TrieResponse(BaseModel):
    text_tree: str
    tree_data: dict
    graph_data: dict
    word_count: int


class HistoryEntry(BaseModel):
    id: int
    action: str
    word: str
    meaning: Optional[str] = None
    success: bool
    message: str
    explanation: str
    timestamp: str


class HistoryResponse(BaseModel):
    history: list[HistoryEntry]
    count: int


class StatusResponse(BaseModel):
    """Simple success/failure response for demo/reset operations."""
    success: bool
    message: str
