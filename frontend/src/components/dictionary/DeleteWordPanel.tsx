"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { deleteWord, type OperationResponse } from "@/lib/api";

interface DeleteWordPanelProps {
  onResult: (result: OperationResponse | null, action: "delete") => void;
  onDataChange: () => void;
}

export default function DeleteWordPanel({
  onResult,
  onDataChange,
}: DeleteWordPanelProps) {
  const [word, setWord] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim()) {
      setFeedback({ type: "error", message: "Please enter a word to delete." });
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      const result = await deleteWord(word.trim());
      setFeedback({
        type: result.success ? "success" : "error",
        message: result.message,
      });
      onResult(result, "delete");
      if (result.success) {
        onDataChange();
        setWord("");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete word";
      setFeedback({ type: "error", message });
      onResult(null, "delete");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Card className="border-red-100 hover:border-red-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-rose-600 shadow-sm">
              <Trash2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle>Delete Word</CardTitle>
              <CardDescription>Remove a word from the dictionary</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              id="delete-word-input"
              placeholder="Enter word to delete..."
              value={word}
              onChange={(e) => setWord(e.target.value)}
              disabled={loading}
            />
            <Button
              id="delete-word-btn"
              type="submit"
              variant="destructive"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete Word
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
