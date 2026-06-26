package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

const shortcutsFileName = ".shortcuts.json"

func shortcutsPath(root string) string {
	return filepath.Join(root, shortcutsFileName)
}

// loadShortcuts reads vault/.shortcuts.json (code -> subject folder name).
// Missing file = no shortcuts yet, not an error.
func loadShortcuts(root string) (map[string]string, error) {
	data, err := os.ReadFile(shortcutsPath(root))
	if os.IsNotExist(err) {
		return map[string]string{}, nil
	}
	if err != nil {
		return nil, err
	}
	m := map[string]string{}
	if err := json.Unmarshal(data, &m); err != nil {
		return nil, fmt.Errorf("parse %s: %w", shortcutsPath(root), err)
	}
	return m, nil
}

func saveShortcuts(root string, m map[string]string) error {
	data, err := json.MarshalIndent(m, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(shortcutsPath(root), data, 0o644)
}

// initials builds a lowercase shortcode from the first letter of each
// hyphen/space-separated word in subject, e.g. "Wireless Network" -> "wn".
func initials(subject string) string {
	parts := strings.FieldsFunc(subject, func(r rune) bool {
		return r == '-' || r == ' '
	})
	var b strings.Builder
	for _, p := range parts {
		if p == "" {
			continue
		}
		b.WriteByte(byte(strings.ToLower(p)[0]))
	}
	s := b.String()
	if s == "" {
		s = "x"
	}
	return s
}

// resolveOrCreateShortcode returns the existing shortcode for subject if
// one is already mapped to it, otherwise mints a new, guaranteed-unique
// code and persists it to vault/.shortcuts.json. Dedup: start from
// initials, append an incrementing number on collision until free.
func resolveOrCreateShortcode(root, subject string) (string, error) {
	m, err := loadShortcuts(root)
	if err != nil {
		return "", err
	}

	for code, subj := range m {
		if subj == subject {
			return code, nil
		}
	}

	base := initials(subject)
	code := base
	for n := 2; ; n++ {
		existing, taken := m[code]
		if !taken || existing == subject {
			break
		}
		code = fmt.Sprintf("%s%d", base, n)
	}

	m[code] = subject
	if err := saveShortcuts(root, m); err != nil {
		return "", err
	}
	return code, nil
}

// expandShortcode resolves a leading "/code" to its full subject name via
// vault/.shortcuts.json. Input without a "/" prefix passes through
// unchanged (it's already a real subject name, not a shortcut).
func expandShortcode(root, input string) (string, error) {
	if !strings.HasPrefix(input, "/") {
		return input, nil
	}
	code := strings.TrimPrefix(input, "/")
	m, err := loadShortcuts(root)
	if err != nil {
		return "", err
	}
	if subj, ok := m[code]; ok {
		return subj, nil
	}
	return "", fmt.Errorf("no folder shortcut %q found — run 'savelesson shortcuts --root %s' to list known ones", input, root)
}
