"""
Unit tests for the Radix Trie implementation.
Run with:  pytest backend/tests/test_radix_trie.py -v
"""

import sys
from pathlib import Path

# Ensure the backend package is importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.radix_trie import RadixTrie


class TestInsert:
    """Tests for insertion."""

    def test_insert_single_word(self):
        t = RadixTrie()
        result = t.insert("hello", "a greeting")
        assert result["updated"] is False
        entries = t.get_all_entries()
        assert len(entries) == 1
        assert entries[0]["word"] == "hello"
        assert entries[0]["meaning"] == "a greeting"

    def test_insert_words_with_shared_prefix(self):
        t = RadixTrie()
        t.insert("apple", "a fruit")
        t.insert("apply", "to put into use")
        t.insert("application", "a program")

        entries = t.get_all_entries()
        words = [e["word"] for e in entries]
        assert "apple" in words
        assert "apply" in words
        assert "application" in words
        assert len(entries) == 3

    def test_insert_duplicate_updates_meaning(self):
        t = RadixTrie()
        t.insert("hello", "greeting v1")
        result = t.insert("hello", "greeting v2")
        assert result["updated"] is True
        entries = t.get_all_entries()
        assert len(entries) == 1
        assert entries[0]["meaning"] == "greeting v2"

    def test_insert_prefix_word(self):
        """Insert 'app' after 'apple' — 'app' is a prefix of 'apple'."""
        t = RadixTrie()
        t.insert("apple", "a fruit")
        t.insert("app", "abbreviation for application")
        entries = t.get_all_entries()
        words = [e["word"] for e in entries]
        assert "app" in words
        assert "apple" in words

    def test_insert_causes_node_split(self):
        t = RadixTrie()
        t.insert("apple", "a fruit")
        result = t.insert("apply", "to put into use")
        # The node "apple" should split into "appl" + "e" / "y"
        assert "Split" in result["explanation"] or "split" in result["explanation"].lower()

    def test_insert_whitespace_normalization(self):
        t = RadixTrie()
        t.insert("  Hello  ", "  greeting  ")
        entries = t.get_all_entries()
        assert entries[0]["word"] == "hello"
        assert entries[0]["meaning"] == "greeting"

    def test_insert_many_words(self):
        t = RadixTrie()
        words = ["car", "card", "care", "careful", "cars", "cat", "catch"]
        for w in words:
            t.insert(w, f"meaning of {w}")
        entries = t.get_all_entries()
        assert len(entries) == len(words)


class TestSearch:
    """Tests for searching."""

    def test_search_existing_word(self):
        t = RadixTrie()
        t.insert("hello", "a greeting")
        result = t.search("hello")
        assert result["found"] is True
        assert result["meaning"] == "a greeting"
        assert len(result["traversal_path"]) > 0

    def test_search_non_existing_word(self):
        t = RadixTrie()
        t.insert("hello", "a greeting")
        result = t.search("world")
        assert result["found"] is False
        assert result["meaning"] is None

    def test_search_prefix_not_word(self):
        """'app' is a prefix of 'apple' but not a word itself."""
        t = RadixTrie()
        t.insert("apple", "a fruit")
        result = t.search("app")
        assert result["found"] is False

    def test_search_does_not_modify_trie(self):
        t = RadixTrie()
        t.insert("hello", "a greeting")
        tree_before = t.to_text_tree()
        t.search("hello")
        t.search("nonexistent")
        tree_after = t.to_text_tree()
        assert tree_before == tree_after

    def test_search_traversal_path(self):
        t = RadixTrie()
        t.insert("apple", "a fruit")
        t.insert("apply", "to use")
        result = t.search("apple")
        assert result["found"] is True
        assert "(root)" in result["traversal_path"]


class TestDelete:
    """Tests for deletion."""

    def test_delete_existing_word(self):
        t = RadixTrie()
        t.insert("hello", "a greeting")
        result = t.delete("hello")
        assert result["deleted"] is True
        entries = t.get_all_entries()
        assert len(entries) == 0

    def test_delete_non_existing_word(self):
        t = RadixTrie()
        t.insert("hello", "a greeting")
        result = t.delete("world")
        assert result["deleted"] is False

    def test_delete_word_causes_merge(self):
        """Deleting 'apple' when 'apply' exists should merge 'appl'+'y' → 'apply'."""
        t = RadixTrie()
        t.insert("apple", "a fruit")
        t.insert("apply", "to use")
        result = t.delete("apple")
        assert result["deleted"] is True
        # 'apply' should still work
        search_result = t.search("apply")
        assert search_result["found"] is True
        assert search_result["meaning"] == "to use"
        # Check merge happened
        entries = t.get_all_entries()
        assert len(entries) == 1

    def test_delete_preserves_other_words(self):
        t = RadixTrie()
        t.insert("apple", "a fruit")
        t.insert("apply", "to use")
        t.insert("application", "a program")
        t.delete("apply")
        entries = t.get_all_entries()
        words = [e["word"] for e in entries]
        assert "apple" in words
        assert "application" in words
        assert "apply" not in words

    def test_delete_leaf_node(self):
        t = RadixTrie()
        t.insert("cat", "an animal")
        t.insert("car", "a vehicle")
        t.delete("cat")
        entries = t.get_all_entries()
        assert len(entries) == 1
        assert entries[0]["word"] == "car"

    def test_delete_prefix_word_keeps_children(self):
        """Delete 'app' but keep 'apple' and 'apply'."""
        t = RadixTrie()
        t.insert("app", "abbreviation")
        t.insert("apple", "a fruit")
        t.insert("apply", "to use")
        t.delete("app")
        entries = t.get_all_entries()
        words = [e["word"] for e in entries]
        assert "app" not in words
        assert "apple" in words
        assert "apply" in words


class TestVisualization:
    """Tests for text-tree visualization."""

    def test_empty_trie(self):
        t = RadixTrie()
        text = t.to_text_tree()
        assert "(root)" in text

    def test_text_tree_contains_words(self):
        t = RadixTrie()
        t.insert("apple", "a fruit")
        t.insert("apply", "to use")
        text = t.to_text_tree()
        assert "[END]" in text
        assert "apple" in text or "appl" in text

    def test_to_dict_structure(self):
        t = RadixTrie()
        t.insert("hello", "greeting")
        d = t.to_dict()
        assert "children" in d
        assert "hello" in d["children"]
        assert d["children"]["hello"]["is_end"] is True
