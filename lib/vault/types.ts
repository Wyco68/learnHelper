export interface Lesson {
  id: string; // flat file stem, e.g. "01-intro"
  slug: string;
  title: string;
  seq: number;
}

export interface Folder {
  name: string;
  lessons: Lesson[];
}

export interface VaultTree {
  folders: Folder[];
}

// A selected lesson is identified by its folder + id.
export interface LessonRef {
  folder: string;
  id: string;
}
