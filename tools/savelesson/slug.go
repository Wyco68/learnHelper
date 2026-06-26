package main

import (
	"regexp"
	"strings"
)

var nonSlugChar = regexp.MustCompile(`[^a-z0-9]+`)

// slugify converts a lesson title into the vault's lowercase-hyphenated
// naming style, e.g. "Process Scheduling" -> "process-scheduling".
func slugify(title string) string {
	s := strings.ToLower(strings.TrimSpace(title))
	s = nonSlugChar.ReplaceAllString(s, "-")
	s = strings.Trim(s, "-")
	if s == "" {
		s = "untitled"
	}
	return s
}
