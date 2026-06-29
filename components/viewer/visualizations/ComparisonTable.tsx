"use client";

import { motion } from "framer-motion";

export type ComparisonProperty = { name: string; values: string[] };
export type ComparisonTableData = {
  title?: string;
  items: string[];
  properties: ComparisonProperty[];
};

export default function ComparisonTable({ data }: { data: ComparisonTableData }) {
  const { title, items, properties } = data;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="not-prose my-6 overflow-hidden rounded-lg border border-blue-300 dark:border-blue-800/50"
    >
      {title && (
        <p className="border-b border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-blue-600 dark:border-blue-800/40 dark:bg-blue-950/20 dark:text-blue-400">
          {title}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-blue-100/60 dark:bg-blue-900/30">
              <th className="w-32 border-b border-r border-blue-200 px-4 py-2.5 text-left text-xs font-normal text-blue-400 dark:border-blue-800/40 dark:text-blue-500" />
              {items.map((item, i) => (
                <th
                  key={i}
                  className="border-b border-l border-blue-200 px-4 py-2.5 text-center text-sm font-bold text-blue-900 dark:border-blue-800/40 dark:text-blue-100"
                >
                  {item}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {properties.map((prop, ri) => (
              <tr
                key={ri}
                className={
                  ri % 2 === 0
                    ? "bg-white dark:bg-transparent"
                    : "bg-blue-50/60 dark:bg-blue-950/20"
                }
              >
                <td className="border-r border-t border-blue-200/50 px-4 py-2.5 text-xs font-semibold text-blue-700 dark:border-blue-800/30 dark:text-blue-400">
                  {prop.name}
                </td>
                {prop.values.map((val, ci) => (
                  <td
                    key={ci}
                    className="border-l border-t border-blue-200/50 px-4 py-2.5 text-center text-blue-900 dark:border-blue-800/30 dark:text-blue-100"
                  >
                    {val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
