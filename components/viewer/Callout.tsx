import type { ReactNode } from "react";

const VARIANTS = {
  "Key Idea": { border: "border-blue-800/60", bg: "bg-blue-950/30", label: "text-blue-300" },
  "Common Mistake": { border: "border-red-800/60", bg: "bg-red-950/30", label: "text-red-300" },
  "Exam Tip": { border: "border-yellow-700/60", bg: "bg-yellow-950/30", label: "text-yellow-300" },
  Remember: { border: "border-emerald-800/60", bg: "bg-emerald-950/30", label: "text-emerald-300" },
} as const;

type CalloutKind = keyof typeof VARIANTS;

export function detectCalloutKind(text: string): CalloutKind | null {
  for (const kind of Object.keys(VARIANTS) as CalloutKind[]) {
    if (text.trim().startsWith(`${kind}:`)) return kind;
  }
  return null;
}

export default function Callout({
  kind,
  children,
}: {
  kind: CalloutKind;
  children: ReactNode;
}) {
  const v = VARIANTS[kind];
  return (
    <div className={`my-4 rounded-md border ${v.border} ${v.bg} px-4 py-3`}>
      <p className={`mb-1 text-xs font-semibold uppercase tracking-wide ${v.label}`}>{kind}</p>
      <div className="text-sm leading-relaxed text-gray-200">{children}</div>
    </div>
  );
}
