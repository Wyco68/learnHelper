import { promises as fs } from "fs";
import path from "path";

const SHORTCUTS_FILE = ".shortcuts.json";

function shortcutsPath(root: string): string {
  return path.join(root, SHORTCUTS_FILE);
}

// Mirrors tools/savelesson/shortcuts.go loadShortcuts(). Missing file = {}.
export async function loadShortcuts(root: string): Promise<Record<string, string>> {
  try {
    const data = await fs.readFile(shortcutsPath(root), "utf-8");
    return JSON.parse(data);
  } catch (err: any) {
    if (err.code === "ENOENT") return {};
    throw new Error(`parse ${shortcutsPath(root)}: ${err.message}`);
  }
}
