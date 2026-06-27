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

// nextSequence scans subjectDir for existing "NN-slug.md" lesson files
// (and any legacy "NN-slug" folders), returning the next free sequence
// number (1 if the folder is missing or empty).
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
		name := strings.TrimSuffix(e.Name(), ".md")
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

// NewLesson creates Subject/NN-topic-slug.md under vaultRoot as a single
// flat file (no per-lesson folder). The uploaded file itself is never
// copied/saved — only its filename is recorded, for the caller to embed as
// a "Source file:" reference. Hard-errors (no overwrite) if the target
// lesson file already exists. Returns the lesson file path.
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
	lessonName := fmt.Sprintf("%02d-%s.md", seq, slug)
	lessonFile := filepath.Join(subjectDir, lessonName)

	if _, err := os.Stat(lessonFile); err == nil {
		return "", fmt.Errorf("lesson file %q already exists; pick a different title or remove it first", lessonFile)
	}

	// Reserve the sequence by creating an empty file; the explanation is
	// (over)written into it by WriteExplanation.
	if err := os.WriteFile(lessonFile, []byte{}, 0o644); err != nil {
		return "", fmt.Errorf("create lesson file: %w", err)
	}

	_ = sourceName // documented parameter, not copied to disk
	return lessonFile, nil
}

// WriteExplanation (over)writes the explanation markdown at the given flat
// lesson file path (e.g. Subject/01-introduction.md).
func WriteExplanation(lessonFile string, content []byte) error {
	if err := os.MkdirAll(filepath.Dir(lessonFile), 0o755); err != nil {
		return fmt.Errorf("create subject folder: %w", err)
	}
	return os.WriteFile(lessonFile, content, 0o644)
}

// FindLessonFile resolves a lesson by its file name (e.g. "02-process-
// scheduling.md" or "02-process-scheduling") or by bare sequence number
// (e.g. "2" or "02") within subjectDir, returning the flat .md path.
func FindLessonFile(subjectDir, lessonNameOrSeq string) (string, error) {
	candidates := []string{lessonNameOrSeq}
	if !strings.HasSuffix(lessonNameOrSeq, ".md") {
		candidates = append(candidates, lessonNameOrSeq+".md")
	}
	for _, c := range candidates {
		p := filepath.Join(subjectDir, c)
		if info, err := os.Stat(p); err == nil && !info.IsDir() {
			return p, nil
		}
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
		if e.IsDir() || !strings.HasSuffix(e.Name(), ".md") {
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
