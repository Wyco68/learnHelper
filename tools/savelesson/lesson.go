package main

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"
)

var seqPrefix = regexp.MustCompile(`^(\d+)-`)

// nextSequence scans subjectDir for existing "NN-slug" folders and legacy
// "NN-slug.md" files, returning the next free sequence number (1 if the
// folder is missing or empty).
func nextSequence(subjectDir string) (int, error) {
	entries, err := os.ReadDir(subjectDir)
	if os.IsNotExist(err) {
		return 1, nil
	}
	if err != nil {
		return 0, err
	}

	max := 0
	for _, e := range entries {
		name := e.Name()
		name = strings.TrimSuffix(name, ".md")
		m := seqPrefix.FindStringSubmatch(name)
		if m == nil {
			continue
		}
		n, err := strconv.Atoi(m[1])
		if err != nil {
			continue
		}
		if n > max {
			max = n
		}
	}
	return max + 1, nil
}

// NewLesson creates Subject/NN-topic-slug/ under vaultRoot. The uploaded
// file itself is never copied/saved — only its filename is recorded, for
// the caller to print/embed as a "Source file:" reference in the
// generated note. Hard-errors (no overwrite) if the target lesson folder
// already exists.
func NewLesson(vaultRoot, subject, title, sourceName string) (string, error) {
	subjectDir := filepath.Join(vaultRoot, subject)
	if err := os.MkdirAll(subjectDir, 0o755); err != nil {
		return "", fmt.Errorf("create subject folder: %w", err)
	}

	seq, err := nextSequence(subjectDir)
	if err != nil {
		return "", fmt.Errorf("determine sequence number: %w", err)
	}
	slug := slugify(title)
	lessonName := fmt.Sprintf("%02d-%s", seq, slug)
	lessonDir := filepath.Join(subjectDir, lessonName)

	if _, err := os.Stat(lessonDir); err == nil {
		return "", fmt.Errorf("lesson folder %q already exists; pick a different title or remove it first", lessonDir)
	}

	if err := os.MkdirAll(lessonDir, 0o755); err != nil {
		return "", fmt.Errorf("create lesson folder: %w", err)
	}

	_ = sourceName // kept as a documented parameter, not copied to disk
	return lessonDir, nil
}

// WriteExplanation (over)writes the explanation markdown inside an existing
// lesson folder, named after the folder itself (e.g. 01-introduction/
// 01-introduction.md) rather than a generic "explanation.md".
func WriteExplanation(lessonDir string, content []byte) error {
	if _, err := os.Stat(lessonDir); err != nil {
		return fmt.Errorf("lesson folder: %w", err)
	}
	name := filepath.Base(lessonDir) + ".md"
	return os.WriteFile(filepath.Join(lessonDir, name), content, 0o644)
}

// FindLessonDir resolves a lesson by its folder name (e.g. "02-process-
// scheduling") or by bare sequence number (e.g. "2" or "02") within
// subjectDir.
func FindLessonDir(subjectDir, lessonNameOrSeq string) (string, error) {
	direct := filepath.Join(subjectDir, lessonNameOrSeq)
	if info, err := os.Stat(direct); err == nil && info.IsDir() {
		return direct, nil
	}

	n, err := strconv.Atoi(lessonNameOrSeq)
	if err != nil {
		return "", fmt.Errorf("lesson %q not found in %s", lessonNameOrSeq, subjectDir)
	}

	entries, err := os.ReadDir(subjectDir)
	if err != nil {
		return "", err
	}
	var matches []string
	for _, e := range entries {
		if !e.IsDir() {
			continue
		}
		m := seqPrefix.FindStringSubmatch(e.Name())
		if m == nil {
			continue
		}
		if v, _ := strconv.Atoi(m[1]); v == n {
			matches = append(matches, e.Name())
		}
	}
	sort.Strings(matches)
	if len(matches) == 0 {
		return "", fmt.Errorf("no lesson with sequence %02d in %s", n, subjectDir)
	}
	return filepath.Join(subjectDir, matches[0]), nil
}
