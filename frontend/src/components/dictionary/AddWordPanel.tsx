"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { addWord, type OperationResponse } from "@/lib/api";

interface AddWordPanelProps {
  onResult: (result: OperationResponse | null, action: "add") => void;
  onDataChange: () => void;
}

export default function AddWordPanel({
  onResult,
  onDataChange,
}: AddWordPanelProps) {
  const [word, setWord] = useState("");
  const [meaning, setMeaning] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || !meaning.trim()) {
      setFeedback({ type: "error", message: "Both word and meaning are required." });
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      const result = await addWord(word.trim(), meaning.trim());
      setFeedback({ type: "success", message: result.message });
      onResult(result, "add");
      onDataChange();
      setWord("");
      setMeaning("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to add word";
      setFeedback({ type: "error", message });
      onResult(null, "add");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <Card className="border-indigo-100 hover:border-indigo-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm">
              <Plus className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle>Add Word</CardTitle>
              <CardDescription>Insert a new word into the dictionary</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              id="add-word-input"
              placeholder="Enter word..."
              value={word}
              onChange={(e) => setWord(e.target.value)}
              disabled={loading}
            />
            <Input
              id="add-meaning-input"
              placeholder="Enter meaning..."
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              disabled={loading}
            />
            <Button
              id="add-word-btn"
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Word
                </>
              )}
            </Button>
          </form>

          {feedback && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className={`mt-3 rounded-lg px-3 py-2 text-sm font-medium ${
                feedback.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {feedback.message}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
