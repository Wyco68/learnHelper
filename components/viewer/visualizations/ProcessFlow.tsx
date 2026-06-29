"use client";

import { motion } from "framer-motion";

export type Step = string | { label: string; desc?: string };
export type ProcessFlowData = {
  steps: Step[];
  direction?: "horizontal" | "vertical";
  title?: string;
};

function stepLabel(s: Step): string {
  return typeof s === "string" ? s : s.label;
}
function stepDesc(s: Step): string | undefined {
  return typeof s === "string" ? undefined : s.desc;
}

export default function ProcessFlow({ data }: { data: ProcessFlowData }) {
  const { steps, title } = data;
  const isVertical =
    data.direction === "vertical" || (!data.direction && steps.length > 4);

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
        className={`flex ${
          isVertical
            ? "flex-col items-center"
            : "flex-wrap items-center justify-center"
        } gap-2`}
      >
        {steps.map((step, i) => (
          <div
            key={i}
            className={`flex ${isVertical ? "flex-col items-center" : "items-center"} gap-2`}
          >
            <div className="group relative">
              <div className="rounded-md border border-blue-400/60 bg-white px-4 py-2 text-sm font-medium text-blue-900 shadow-sm dark:border-blue-600/40 dark:bg-blue-900/20 dark:text-blue-100">
                {stepLabel(step)}
              </div>
              {stepDesc(step) && (
                <div className="absolute left-1/2 top-full z-10 mt-1 hidden w-max max-w-56 -translate-x-1/2 rounded border border-blue-300 bg-white px-3 py-1.5 text-xs text-gray-600 shadow-md group-hover:block dark:border-blue-700 dark:bg-gray-900 dark:text-gray-300">
                  {stepDesc(step)}
                </div>
              )}
            </div>
            {i < steps.length - 1 && (
              <span className="select-none text-lg text-blue-500 dark:text-blue-400">
                {isVertical ? "↓" : "→"}
              </span>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
