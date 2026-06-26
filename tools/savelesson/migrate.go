package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// migrateSubject converts existing flat "NN-slug.md" lesson files in
// subjectDir into the folder-per-lesson layout: NN-slug/NN-slug.md.
// No original source file exists for these (none was ever saved), so only
// the explanation moves. Folders that already exist are skipped, not erred.
func migrateSubject(subjectDir string) (moved, skipped []string, err error) {
	entries, err := os.ReadDir(subjectDir)
	if os.IsNotExist(err) {
		return nil, nil, fmt.Errorf("subject folder does not exist: %s", subjectDir)
	}
	if err != nil {
		return nil, nil, err
	}

	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(e.Name(), ".md") {
			continue
		}
		if !seqPrefix.MatchString(e.Name()) {
			continue // not a numbered lesson file (e.g. README.md)
		}

		base := strings.TrimSuffix(e.Name(), ".md")
		lessonDir := filepath.Join(subjectDir, base)
		flatPath := filepath.Join(subjectDir, e.Name())

		if _, err := os.Stat(lessonDir); err == nil {
			skipped = append(skipped, e.Name()+" (folder already exists)")
			continue
		}

		if err := os.MkdirAll(lessonDir, 0o755); err != nil {
			return moved, skipped, fmt.Errorf("create %s: %w", lessonDir, err)
		}
		content, err := os.ReadFile(flatPath)
		if err != nil {
			return moved, skipped, fmt.Errorf("read %s: %w", flatPath, err)
		}
		if err := os.WriteFile(filepath.Join(lessonDir, base+".md"), content, 0o644); err != nil {
			return moved, skipped, fmt.Errorf("write %s.md for %s: %w", base, base, err)
		}
		if err := os.Remove(flatPath); err != nil {
			return moved, skipped, fmt.Errorf("remove old flat file %s: %w", flatPath, err)
		}
		moved = append(moved, e.Name()+" -> "+base+"/"+base+".md")
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
