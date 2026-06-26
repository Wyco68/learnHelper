import { promises as fs } from "fs";
import path from "path";
import { loadShortcuts } from "./shortcuts";
import type { Lesson, Subject, VaultTree } from "./types";

const seqPrefix = /^(\d+)-(.*)$/;

async function readTitle(mdPath: string, fallback: string): Promise<string> {
  try {
    const content = await fs.readFile(mdPath, "utf-8");
    const m = /^#\s+(.+)$/m.exec(content);
    if (m) return m[1].trim();
  } catch {
    // ignore, use fallback
  }
  return fallback;
}

async function listLessons(subjectDir: string, subjectName: string): Promise<Lesson[]> {
  const entries = await fs.readdir(subjectDir, { withFileTypes: true });
  const lessons: Lesson[] = [];

  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const m = seqPrefix.exec(e.name);
    if (!m) continue;
    const seq = parseInt(m[1], 10);
    const mdPath = path.join(subjectDir, e.name, `${e.name}.md`);
    if (
      !(await fs
        .stat(mdPath)
        .then(() => true)
        .catch(() => false))
    ) {
      continue;
    }
    const title = await readTitle(mdPath, m[2].replace(/-/g, " "));
    lessons.push({
      slug: e.name,
      seq,
      title,
      relPath: path.join(subjectName, e.name, `${e.name}.md`),
    });
  }

  lessons.sort((a, b) => a.seq - b.seq);
  return lessons;
}

// Walks userRoot and returns {subjects: [{name, shortcut, lessons}]} for
// the sidebar file tree. Skips dotfiles (e.g. .shortcuts.json, .config.json).
export async function buildVaultTree(userRoot: string): Promise<VaultTree> {
  let entries: import("fs").Dirent[];
  try {
    entries = await fs.readdir(userRoot, { withFileTypes: true });
  } catch (err: any) {
    if (err.code === "ENOENT") return { subjects: [] };
    throw err;
  }

  const shortcuts = await loadShortcuts(userRoot);
  const reverseShortcuts: Record<string, string> = {};
  for (const [code, subj] of Object.entries(shortcuts)) {
    reverseShortcuts[subj] = code;
  }

  const subjects: Subject[] = [];
  for (const e of entries) {
    if (!e.isDirectory() || e.name.startsWith(".")) continue;
    const subjectDir = path.join(userRoot, e.name);
    const lessons = await listLessons(subjectDir, e.name);
    subjects.push({
      name: e.name,
      shortcut: reverseShortcuts[e.name] ?? null,
      lessons,
    });
  }

  subjects.sort((a, b) => a.name.localeCompare(b.name));
  return { subjects };
}
