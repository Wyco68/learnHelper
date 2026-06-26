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
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -8 }}
        transition={{ duration: 0.18 }}
        className="mx-auto max-w-3xl px-8 py-10"
      >
        {content === null ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <MarkdownRenderer content={content} />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
