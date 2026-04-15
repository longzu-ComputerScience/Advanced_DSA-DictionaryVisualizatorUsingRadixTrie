"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { searchWord, type SearchResponse } from "@/lib/api";

interface SearchWordPanelProps {
  onResult: (result: SearchResponse | null) => void;
}

export default function SearchWordPanel({ onResult }: SearchWordPanelProps) {
  const [word, setWord] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim()) return;

    setLoading(true);
    setSearchResult(null);
    try {
      const result = await searchWord(word.trim());
      setSearchResult(result);
      onResult(result);
    } catch (err: unknown) {
      console.error(err);
      onResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <Card className="border-amber-100 hover:border-amber-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-sm">
              <Search className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle>Search Word</CardTitle>
              <CardDescription>Look up a word in the dictionary</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              id="search-word-input"
              placeholder="Enter word to search..."
              value={word}
              onChange={(e) => setWord(e.target.value)}
              disabled={loading}
            />
            <Button
              id="search-word-btn"
              type="submit"
              variant="search"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Search
                </>
              )}
            </Button>
          </form>

          {searchResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 space-y-3"
            >
              {/* Result status */}
              <div
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  searchResult.found
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {searchResult.message}
              </div>

              {/* Meaning */}
              {searchResult.found && searchResult.meaning && (
                <div className="rounded-lg bg-indigo-50 border border-indigo-100 px-4 py-3">
                  <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-1">
                    Meaning
                  </p>
                  <p className="text-sm text-slate-800">{searchResult.meaning}</p>
                </div>
              )}

              {/* Traversal Path */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Traversal Path
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {searchResult.traversal_path.map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-1"
                    >
                      <Badge
                        variant={
                          i === searchResult.traversal_path.length - 1
                            ? searchResult.found
                              ? "success"
                              : "error"
                            : "info"
                        }
                      >
                        {step}
                      </Badge>
                      {i < searchResult.traversal_path.length - 1 && (
                        <span className="text-slate-300 text-xs">&rarr;</span>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Unchanged confirmation */}
              <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                <p className="text-xs text-slate-500 italic">
                  &#128274; Search is a read-only operation. The trie was not modified.
                </p>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
