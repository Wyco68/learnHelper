"use client";

import { motion } from "framer-motion";

export type MemorySegment = { name: string; size?: string; note?: string };
export type MemoryLayoutData = { title?: string; segments: MemorySegment[] };

export default function MemoryLayout({ data }: { data: MemoryLayoutData }) {
  const { title, segments } = data;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="not-prose my-6 flex justify-center"
    >
      <div className="w-64 overflow-hidden rounded-lg border border-blue-300 bg-blue-50 dark:border-blue-800/50 dark:bg-blue-950/20">
        {title && (
          <p className="border-b border-blue-200 py-2 text-center text-xs font-semibold uppercase tracking-wide text-blue-600 dark:border-blue-800/40 dark:text-blue-400">
            {title}
          </p>
        )}
        <p className="px-3 pt-1 text-right text-[10px] text-blue-400/60 dark:text-blue-600/60">
          High Address ▲
        </p>
        <div className="flex flex-col gap-0.5 px-1 pb-1">
          {segments.map((seg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between rounded border border-blue-400/60 bg-white px-3 py-1.5 dark:border-blue-600/40 dark:bg-blue-900/20"
            >
              <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                {seg.name}
              </span>
              {(seg.size ?? seg.note) && (
                <span className="ml-3 text-xs text-blue-500/70 dark:text-blue-400/60">
                  {[seg.size, seg.note].filter(Boolean).join(" · ")}
                </span>
              )}
            </motion.div>
          ))}
        </div>
        <p className="px-3 pb-1 text-right text-[10px] text-blue-400/60 dark:text-blue-600/60">
          ▼ Low Address
        </p>
      </div>
    </motion.div>
  );
}
