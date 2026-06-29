"use client";

import { motion } from "framer-motion";

export type Block = string | { label: string; desc?: string };
export type BlockDiagramData = { title?: string; blocks: Block[]; columns?: number };

function blockLabel(b: Block): string {
  return typeof b === "string" ? b : b.label;
}
function blockDesc(b: Block): string | undefined {
  return typeof b === "string" ? undefined : b.desc;
}

export default function BlockDiagram({ data }: { data: BlockDiagramData }) {
  const { title, blocks } = data;
  const cols =
    data.columns ??
    (blocks.length <= 2 ? blocks.length : blocks.length <= 4 ? 2 : 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="not-prose my-6 rounded-lg border border-blue-300 bg-blue-50 p-4 dark:border-blue-800/50 dark:bg-blue-950/20"
    >
      {title && (
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
          {title}
        </p>
      )}
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {blocks.map((block, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: i * 0.04 }}
            className="rounded-md border border-blue-400/60 bg-white p-3 text-center shadow-sm dark:border-blue-600/40 dark:bg-blue-900/20"
          >
            <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              {blockLabel(block)}
            </div>
            {blockDesc(block) && (
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {blockDesc(block)}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
