"use client";

import { useState } from "react";
import FileTree from "../sidebar/FileTree";
import LessonViewer from "../viewer/LessonViewer";

export default function AppShell() {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="flex w-72 flex-col border-r border-white/10 bg-[#0a0e14]">
        <div className="border-b border-white/10 px-3 py-3">
          <span className="text-sm font-semibold text-gray-200">University Notes</span>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          <FileTree selectedPath={selectedPath} onSelect={setSelectedPath} />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-[#0d1117]">
        <LessonViewer relPath={selectedPath} />
      </main>
    </div>
  );
}
