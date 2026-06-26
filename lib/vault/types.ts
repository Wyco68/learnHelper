export interface Lesson {
  slug: string;
  seq: number;
  title: string;
  relPath: string; // relative to user vault root, e.g. "Wireless-Network/01-wireless.../01-wireless....md"
}

export interface Subject {
  name: string;
  shortcut: string | null;
  lessons: Lesson[];
}

export interface VaultTree {
  subjects: Subject[];
}

export interface UserConfig {
  claudeApiKeyEncrypted?: string;
}
