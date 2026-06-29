"use client";

import Mermaid from "./Mermaid";
import { VIZ_REGISTRY } from "./visualizations/registry";

type VizPayload = { type: string; title?: string; data: unknown };

export default function VizRenderer({ type, title, data }: VizPayload) {
  const entry = VIZ_REGISTRY[type];

  if (entry === undefined) return null;

  if (entry === null) {
    // Mermaid-backed: expects data to be { mermaid: "<source>" }
    const src =
      typeof data === "object" && data !== null
        ? (data as Record<string, unknown>).mermaid
        : undefined;
    return typeof src === "string" ? <Mermaid code={src} /> : null;
  }

  // Merge outer title into data so components that read data.title find it.
  const enriched: unknown =
    typeof data === "object" && data !== null
      ? { ...(data as Record<string, unknown>), ...(title !== undefined ? { title } : {}) }
      : data;

  return <>{entry(enriched)}</>;
}
