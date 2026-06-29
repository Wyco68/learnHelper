"use client";

import { useCallback, useEffect, useState } from "react";
import type { Folder, LessonRef, VaultTree } from "@/lib/vault/types";
import FileTree from "../sidebar/FileTree";
import LessonViewer from "../viewer/LessonViewer";
import NewFolderModal from "../modals/NewFolderModal";
import ThemeToggle from "../theme/ThemeToggle";

export default function AppShell() {
  const [folders, setFolders] = useState<Folder[] | null>(null);
  const [selected, setSelected] = useState<LessonRef | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);

  const refreshTree = useCallback(async () => {
    const res = await fetch("/api/tree", { cache: "no-store" });
    const data: VaultTree = await res.json();
    setFolders(data.folders ?? []);
  }, []);

  useEffect(() => {
    refreshTree();
  }, [refreshTree]);

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="flex w-72 flex-col border-r border-black/10 bg-gray-50 dark:border-white/10 dark:bg-[#0a0e14]">
        <div className="flex items-center justify-between border-b border-black/10 px-3 py-3 dark:border-white/10">
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-200">
            Notes
          </span>
          <ThemeToggle />
        </div>

        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-500">
            Subjects
          </span>
          <button
            onClick={() => setShowNewFolder(true)}
            title="New Folder"
            className="flex h-5 w-5 items-center justify-center rounded text-gray-600 hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/10"
          >
            +
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-2">
          <FileTree
            folders={folders}
            selected={selected}
            onSelect={setSelected}
            onChanged={refreshTree}
          />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-white dark:bg-[#0d1117]">
        <LessonViewer lesson={selected} />
      </main>

      {showNewFolder && (
        <NewFolderModal
          onClose={() => setShowNewFolder(false)}
          onCreated={refreshTree}
        />
      )}
    </div>
  );
}
