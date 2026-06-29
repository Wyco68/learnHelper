import type { ReactNode } from "react";
import ProcessFlow, { type ProcessFlowData } from "./ProcessFlow";
import Timeline, { type TimelineData } from "./Timeline";
import LayerStack, { type LayerStackData } from "./LayerStack";
import BlockDiagram, { type BlockDiagramData } from "./BlockDiagram";
import MemoryLayout, { type MemoryLayoutData } from "./MemoryLayout";
import ComparisonTable, { type ComparisonTableData } from "./ComparisonTable";
import HierarchyTree, { type HierarchyTreeData } from "./HierarchyTree";

// Each entry is a render function that accepts unknown data and returns a node.
// Casting from `unknown` to the component's concrete type inside each entry is
// valid TypeScript strict-mode — `unknown as T` is always permitted — and keeps
// the registry boundary honest: incorrect JSON shapes fail gracefully at render
// rather than at type-check time.
export type VizRenderFn = (data: unknown) => ReactNode;

// null  = Mermaid-backed: VizRenderer passes data.mermaid to the Mermaid component.
// absent key = unknown type: VizRenderer renders nothing.
export const VIZ_REGISTRY: Partial<Record<string, VizRenderFn | null>> = {
  // ── Native React components ──────────────────────────────────────────────
  "process-flow":     (d) => <ProcessFlow data={d as ProcessFlowData} />,
  "pipeline":         (d) => <ProcessFlow data={d as ProcessFlowData} />,
  "timeline":         (d) => <Timeline data={d as TimelineData} />,
  "lifecycle":        (d) => <Timeline data={d as TimelineData} />,
  "layer-stack":      (d) => <LayerStack data={d as LayerStackData} />,
  "block-diagram":    (d) => <BlockDiagram data={d as BlockDiagramData} />,
  "memory-layout":    (d) => <MemoryLayout data={d as MemoryLayoutData} />,
  "comparison-table": (d) => <ComparisonTable data={d as ComparisonTableData} />,
  "hierarchy-tree":   (d) => <HierarchyTree data={d as HierarchyTreeData} />,
  "tree":             (d) => <HierarchyTree data={d as HierarchyTreeData} />,

  // ── Mermaid-backed ───────────────────────────────────────────────────────
  // data shape: { "mermaid": "<mermaid source string>" }
  "sequence":         null,
  "state-machine":    null,
  "decision-tree":    null,
  "graph":            null,
  "network-topology": null,

  // ── To add a new type ────────────────────────────────────────────────────
  // 1. Create components/viewer/visualizations/MyComponent.tsx
  // 2. Import it above and add one line here: "my-type": (d) => <MyComponent data={d as MyData} />,
  // No other files need to change.
};
