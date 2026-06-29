"use client";

import { motion } from "framer-motion";

export type TimelineItem = { label: string; desc?: string };
export type TimelineData = { title?: string; items: TimelineItem[] };

export default function Timeline({ data }: { data: TimelineData }) {
  const { title, items } = data;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="not-prose my-6 rounded-lg border border-blue-300 bg-blue-50 p-5 dark:border-blue-800/50 dark:bg-blue-950/20"
    >
      {title && (
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
          {title}
        </p>
      )}
      <div className="flex flex-col">
        {items.map((item, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="mt-1 h-3 w-3 flex-shrink-0 rounded-full border-2 border-blue-500 bg-blue-100 dark:bg-blue-900" />
              {i < items.length - 1 && (
                <div className="mt-1 min-h-[1.5rem] w-0.5 flex-1 bg-blue-200 dark:bg-blue-800/50" />
              )}
            </div>
            <div className="pb-4">
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                {item.label}
              </div>
              {item.desc && (
                <div className="mt-0.5 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  {item.desc}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
