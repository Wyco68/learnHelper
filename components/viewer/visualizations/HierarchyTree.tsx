"use client";

import { motion } from "framer-motion";

export type TreeNode = { label: string; children?: TreeNode[] };
export type HierarchyTreeData = { title?: string; root: TreeNode };

function TreeBranch({ node, depth }: { node: TreeNode; depth: number }) {
  const hasChildren = (node.children?.length ?? 0) > 0;

  return (
    <div style={depth > 0 ? { paddingLeft: "1.25rem" } : undefined}>
      <div className="flex items-center gap-2 py-0.5">
        <div
          className={`h-2 w-2 flex-shrink-0 rounded-full border-2 ${
            hasChildren
              ? "border-blue-500 bg-blue-100 dark:bg-blue-900"
              : "border-blue-300 bg-white dark:border-blue-600/60 dark:bg-blue-950"
          }`}
        />
        <span
          className={`text-sm ${
            hasChildren
              ? "font-semibold text-blue-900 dark:text-blue-100"
              : "text-blue-700 dark:text-blue-300"
          }`}
        >
          {node.label}
        </span>
      </div>
      {hasChildren && (
        <div className="ml-1 border-l border-blue-200 pl-1 dark:border-blue-800/50">
          {(node.children ?? []).map((child, i) => (
            <TreeBranch key={i} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HierarchyTree({ data }: { data: HierarchyTreeData }) {
  const { title, root } = data;

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
      <TreeBranch node={root} depth={0} />
    </motion.div>
  );
}
