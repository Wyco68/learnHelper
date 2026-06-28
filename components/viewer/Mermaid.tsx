"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

let mermaidInitialized = false;

async function getMermaid() {
  const mermaid = (await import("mermaid")).default;
  if (!mermaidInitialized) {
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      securityLevel: "loose",
      fontFamily: "ui-sans-serif, system-ui, sans-serif",
      themeVariables: {
        background: "#0a0e1a",
        mainBkg: "#2563eb",
        nodeBorder: "#60a5fa",
        clusterBkg: "#0f1f3d",
        clusterBorder: "#1e40af",
        primaryColor: "#2563eb",
        primaryBorderColor: "#60a5fa",
        primaryTextColor: "#ffffff",
        secondaryColor: "#1d4ed8",
        secondaryBorderColor: "#3b82f6",
        secondaryTextColor: "#ffffff",
        tertiaryColor: "#0f1f3d",
        tertiaryBorderColor: "#1e40af",
        tertiaryTextColor: "#93c5fd",
        lineColor: "#3b82f6",
        textColor: "#dbeafe",
        titleColor: "#93c5fd",
        edgeLabelBackground: "#0a0e1a",
        noteBkgColor: "#1e3a5f",
        noteTextColor: "#dbeafe",
        noteBorderColor: "#3b82f6",
        fontSize: "19px",
      },
    });
    mermaidInitialized = true;
  }
  return mermaid;
}

// Make the rendered SVG fill its container width instead of mermaid's
// default fixed max-width, so diagrams render large and clear.
function makeResponsive(svg: string): string {
  return svg
    .replace(/style="max-width:[^"]*"/, 'style="max-width:100%"')
    .replace(/<svg /, '<svg width="100%" ');
}

export default function Mermaid({ code }: { code: string }) {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSvg("");
    setError(null);

    (async () => {
      try {
        const mermaid = await getMermaid();
        const id = `mermaid-${Math.random().toString(36).slice(2)}`;
        const { svg } = await mermaid.render(id, code.trim());
        if (!cancelled) setSvg(makeResponsive(svg));
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? "failed to render diagram");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code]);

  if (error) {
    return (
      <div className="my-5 rounded-md border border-red-800/60 bg-red-950/30 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-300">
          Diagram failed to render
        </p>
        <pre className="overflow-x-auto text-xs text-red-200">{code.trim()}</pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="my-6 flex h-48 items-center justify-center rounded-md border border-white/10 bg-white/[0.02] text-base text-gray-500">
        Rendering diagram...
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="mermaid-diagram my-6 overflow-x-auto rounded-md border border-blue-900/50 bg-[#0a0e1a] p-8"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
