"use client";

import { useEffect, useState } from "react";
import type { VaultTree } from "@/lib/vault/types";
import FileTreeNode from "./FileTreeNode";

export default function FileTree({
  selectedPath,
  onSelect,
}: {
  selectedPath: string | null;
  onSelect: (relPath: string) => void;
}) {
  const [tree, setTree] = useState<VaultTree | null>(null);

  useEffect(() => {
    fetch("/api/tree")
      .then((r) => r.json())
      .then(setTree);
  }, []);

  if (!tree) {
    return <p className="px-2 py-1 text-sm text-gray-500">Loading...</p>;
  }

  if (tree.subjects.length === 0) {
    return <p className="px-2 py-1 text-sm text-gray-500">No subjects yet.</p>;
  }

  return (
    <div>
      {tree.subjects.map((subject) => (
        <FileTreeNode
          key={subject.name}
          subject={subject}
          selectedPath={selectedPath}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
