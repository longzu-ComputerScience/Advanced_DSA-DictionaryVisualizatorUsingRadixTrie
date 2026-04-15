"""
In-memory operation history logger.
Stores a list of operations performed during the current session.
"""

from datetime import datetime, timezone
from typing import Optional


class OperationHistory:
    """Keeps an ordered log of dictionary operations."""

    def __init__(self) -> None:
        self._entries: list[dict] = []
        self._counter: int = 0

    def add(
        self,
        action: str,
        word: str,
        success: bool,
        message: str,
        explanation: str,
        meaning: Optional[str] = None,
    ) -> dict:
        """Record an operation and return the entry."""
        self._counter += 1
        entry = {
            "id": self._counter,
            "action": action,
            "word": word,
            "meaning": meaning,
            "success": success,
            "message": message,
            "explanation": explanation,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        self._entries.append(entry)
        return entry

    def get_all(self) -> list[dict]:
        """Return all history entries in reverse-chronological order."""
        return list(reversed(self._entries))

    def clear(self) -> None:
        """Clear history."""
        self._entries.clear()
        self._counter = 0
