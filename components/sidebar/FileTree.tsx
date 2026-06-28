"use client";

import type { Folder, LessonRef } from "@/lib/vault/types";
import FileTreeNode from "./FileTreeNode";

export default function FileTree({
  folders,
  selected,
  onSelect,
  onChanged,
}: {
  folders: Folder[] | null;
  selected: LessonRef | null;
  onSelect: (ref: LessonRef) => void;
  onChanged: () => void;
}) {
  if (!folders) {
    return <p className="px-2 py-1 text-sm text-gray-500 dark:text-gray-500">Loading...</p>;
  }

  if (folders.length === 0) {
    return <p className="px-2 py-1 text-sm text-gray-500 dark:text-gray-500">No subjects yet.</p>;
  }

  return (
    <div>
      {folders.map((folder) => (
        <FileTreeNode
          key={folder.name}
          folder={folder}
          selected={selected}
          onSelect={onSelect}
          onChanged={onChanged}
        />
      ))}
    </div>
  );
}
