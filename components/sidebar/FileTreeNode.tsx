"use client";

import { useState } from "react";
import type { Subject } from "@/lib/vault/types";

export default function FileTreeNode({
  subject,
  selectedPath,
  onSelect,
}: {
  subject: Subject;
  selectedPath: string | null;
  onSelect: (relPath: string) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left text-sm text-gray-200 hover:bg-white/5"
      >
        <span className="text-gray-500">{open ? "▾" : "▸"}</span>
        <span className="truncate font-medium">{subject.name.replace(/-/g, " ")}</span>
        {subject.shortcut && (
          <span className="ml-auto shrink-0 text-xs text-gray-500">/{subject.shortcut}</span>
        )}
      </button>

      {open && (
        <div className="ml-4 border-l border-white/10 pl-2">
          {subject.lessons.length === 0 && (
            <p className="px-2 py-1 text-xs text-gray-500">No lessons yet</p>
          )}
          {subject.lessons.map((lesson) => {
            const isActive = selectedPath === lesson.relPath;
            return (
              <button
                key={lesson.relPath}
                onClick={() => onSelect(lesson.relPath)}
                className={`block w-full truncate rounded px-2 py-1 text-left text-sm ${
                  isActive ? "bg-blue-600/20 text-blue-300" : "text-gray-300 hover:bg-white/5"
                }`}
                title={lesson.title}
              >
                {lesson.title}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
