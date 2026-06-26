"use client";

import { useEffect, useRef, useState } from "react";

let mermaidInitialized = false;

export default function Mermaid({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      const mermaid = (await import("mermaid")).default;
      if (!mermaidInitialized) {
        mermaid.initialize({ startOnLoad: false, theme: "dark" });
        mermaidInitialized = true;
      }
      try {
        const id = `mermaid-${Math.random().toString(36).slice(2)}`;
        const { svg } = await mermaid.render(id, code);
        if (!cancelled) setSvg(svg);
      } catch (err: any) {
        if (!cancelled) setError(err.message ?? "failed to render diagram");
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (error) {
    return (
      <pre className="rounded border border-red-700 bg-red-950/40 p-3 text-sm text-red-300">
        Mermaid render error: {error}
      </pre>
    );
  }

  return (
    <div
      ref={containerRef}
      className="my-4 flex justify-center overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
