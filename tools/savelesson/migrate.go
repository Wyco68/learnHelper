package main

import (
	"fmt"
	"os"
	"path/filepath"
)

// migrateSubject flattens the folder-per-lesson layout into single flat
// files: each "NN-slug/NN-slug.md" (or legacy "NN-slug/explanation.md")
// becomes "NN-slug.md" directly under subjectDir, then the whole lesson
// folder — including any stored source files (original.pdf etc.) — is
// removed. Flat files already present are left untouched. A target flat
// file that already exists is skipped, not overwritten.
func migrateSubject(subjectDir string) (moved, skipped []string, err error) {
	entries, err := os.ReadDir(subjectDir)
	if os.IsNotExist(err) {
		return nil, nil, fmt.Errorf("subject folder does not exist: %s", subjectDir)
	}
	if err != nil {
		return nil, nil, err
	}

	for _, e := range entries {
		if !e.IsDir() || !seqPrefix.MatchString(e.Name()) {
			continue // only numbered lesson folders
		}

		base := e.Name()
		lessonDir := filepath.Join(subjectDir, base)
		flatPath := filepath.Join(subjectDir, base+".md")

		// Prefer NN-slug.md inside the folder, fall back to explanation.md.
		srcMd := filepath.Join(lessonDir, base+".md")
		if _, err := os.Stat(srcMd); err != nil {
			alt := filepath.Join(lessonDir, "explanation.md")
			if _, err2 := os.Stat(alt); err2 == nil {
				srcMd = alt
			} else {
				skipped = append(skipped, base+" (no generated markdown found inside)")
				continue
			}
		}

		if _, err := os.Stat(flatPath); err == nil {
			skipped = append(skipped, base+".md (flat file already exists)")
			continue
		}

		content, err := os.ReadFile(srcMd)
		if err != nil {
			return moved, skipped, fmt.Errorf("read %s: %w", srcMd, err)
		}
		if err := os.WriteFile(flatPath, content, 0o644); err != nil {
			return moved, skipped, fmt.Errorf("write %s: %w", flatPath, err)
		}
		if err := os.RemoveAll(lessonDir); err != nil {
			return moved, skipped, fmt.Errorf("remove lesson folder %s: %w", lessonDir, err)
		}
		moved = append(moved, base+"/ -> "+base+".md (folder + any source files removed)")
	}
	return moved, skipped, nil
}

// renameSubject fixes existing lesson folders that still hold a generic
// "explanation.md" instead of the folder-name convention, renaming it to
// NN-slug.md in place. Folders already using the convention, or missing
// explanation.md entirely, are left untouched.
func renameSubject(subjectDir string) (renamed, skipped []string, err error) {
	entries, err := os.ReadDir(subjectDir)
	if os.IsNotExist(err) {
		return nil, nil, fmt.Errorf("subject folder does not exist: %s", subjectDir)
	}
	if err != nil {
		return nil, nil, err
	}

	for _, e := range entries {
		if !e.IsDir() {
			continue
		}
		old := filepath.Join(subjectDir, e.Name(), "explanation.md")
		if _, err := os.Stat(old); err != nil {
			continue // no explanation.md here, nothing to rename
		}
		newName := e.Name() + ".md"
		newPath := filepath.Join(subjectDir, e.Name(), newName)
		if _, err := os.Stat(newPath); err == nil {
			skipped = append(skipped, e.Name()+" (target already exists)")
			continue
		}
		if err := os.Rename(old, newPath); err != nil {
			return renamed, skipped, fmt.Errorf("rename %s: %w", old, err)
		}
		renamed = append(renamed, e.Name()+"/explanation.md -> "+e.Name()+"/"+newName)
	}
	return renamed, skipped, nil
}
