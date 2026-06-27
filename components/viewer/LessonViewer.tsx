"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import MarkdownRenderer from "./MarkdownRenderer";

export default function LessonViewer({ relPath }: { relPath: string | null }) {
  const [content, setContent] = useState<string | null>(null);

  useEffect(() => {
    if (!relPath) {
      setContent(null);
      return;
    }
    setContent(null);
    fetch(`/api/lesson/${relPath.split(/[\\/]/).map(encodeURIComponent).join("/")}`)
      .then((r) => r.json())
      .then((data) => setContent(data.content ?? `Error: ${data.error}`));
  }, [relPath]);

  if (!relPath) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        Select a lesson from the sidebar
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={relPath}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-3xl px-8 py-10"
      >
        {content === null ? (
          <div className="space-y-3" aria-hidden>
            <div className="h-7 w-2/3 animate-pulse rounded bg-white/5" />
            <div className="h-4 w-full animate-pulse rounded bg-white/5" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-white/5" />
          </div>
        ) : (
          <MarkdownRenderer content={content} />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
