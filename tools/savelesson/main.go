// Command savelesson keeps an uploaded source file and its generated
// explanation together as one folder per lesson inside the university-notes
// vault: Subject/NN-topic-slug/{original.<ext>, explanation.md}.
package main

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"sort"
)

func main() {
	if len(os.Args) < 2 {
		usage()
		os.Exit(2)
	}

	switch os.Args[1] {
	case "new":
		cmdNew(os.Args[2:])
	case "explain":
		cmdExplain(os.Args[2:])
	case "migrate":
		cmdMigrate(os.Args[2:])
	case "rename":
		cmdRename(os.Args[2:])
	case "shortcuts":
		cmdShortcuts(os.Args[2:])
	default:
		usage()
		os.Exit(2)
	}
}

func usage() {
	fmt.Fprintln(os.Stderr, `savelesson <command> [flags]

Commands:
  new      --subject NAME --title "TITLE" --source PATH [--explain MD_PATH] [--root VAULT_ROOT]
  explain  --subject NAME --lesson NN-slug-or-NN --file MD_PATH [--root VAULT_ROOT]
  migrate  --subject NAME [--root VAULT_ROOT]   (or --all instead of --subject)
  rename   --subject NAME [--root VAULT_ROOT]   (or --all) -- fixes explanation.md -> NN-slug.md
  shortcuts [--root VAULT_ROOT]                 -- list known "/code -> Subject" shortcuts

--subject also accepts a "/code" shortcut (see shortcuts above) and
expands it to the full subject name automatically.`)
}

// vaultRoot resolves the notes vault root: --root flag if given, else the
// current working directory (Claude Code's Bash tool already runs cwd'd
// into the vault by default).
func vaultRoot(root string) string {
	if root != "" {
		return root
	}
	wd, err := os.Getwd()
	if err != nil {
		return "."
	}
	return wd
}

func cmdNew(args []string) {
	fs := flag.NewFlagSet("new", flag.ExitOnError)
	subject := fs.String("subject", "", "subject folder name")
	title := fs.String("title", "", "lesson title")
	source := fs.String("source", "", "filename of the uploaded source file (reference only, not saved to disk)")
	explain := fs.String("explain", "", "optional path to explanation markdown to write immediately")
	root := fs.String("root", "", "vault root (default: current directory)")
	fs.Parse(args)

	if *subject == "" || *title == "" || *source == "" {
		fmt.Fprintln(os.Stderr, "new: --subject, --title, and --source are required")
		os.Exit(2)
	}

	rootDir := vaultRoot(*root)

	subjectName, err := expandShortcode(rootDir, *subject)
	if err != nil {
		fmt.Fprintln(os.Stderr, "error:", err)
		os.Exit(1)
	}

	lessonDir, err := NewLesson(rootDir, subjectName, *title, *source)
	if err != nil {
		fmt.Fprintln(os.Stderr, "error:", err)
		os.Exit(1)
	}

	if *explain != "" {
		content, err := os.ReadFile(*explain)
		if err != nil {
			fmt.Fprintln(os.Stderr, "error reading --explain file:", err)
			os.Exit(1)
		}
		if err := WriteExplanation(lessonDir, content); err != nil {
			fmt.Fprintln(os.Stderr, "error writing explanation:", err)
			os.Exit(1)
		}
	}

	code, err := resolveOrCreateShortcode(rootDir, subjectName)
	if err == nil {
		fmt.Fprintf(os.Stderr, "shortcut: /%s -> %s\n", code, subjectName)
	}

	fmt.Fprintf(os.Stderr, "source file (reference only, not saved): %s\n", filepath.Base(*source))
	fmt.Println(lessonDir)
}

func cmdExplain(args []string) {
	fs := flag.NewFlagSet("explain", flag.ExitOnError)
	subject := fs.String("subject", "", "subject folder name")
	lesson := fs.String("lesson", "", "lesson folder name or sequence number")
	file := fs.String("file", "", "path to explanation markdown")
	root := fs.String("root", "", "vault root (default: current directory)")
	fs.Parse(args)

	if *subject == "" || *lesson == "" || *file == "" {
		fmt.Fprintln(os.Stderr, "explain: --subject, --lesson, and --file are required")
		os.Exit(2)
	}

	rootDir := vaultRoot(*root)
	subjectName, err := expandShortcode(rootDir, *subject)
	if err != nil {
		fmt.Fprintln(os.Stderr, "error:", err)
		os.Exit(1)
	}

	subjectDir := filepath.Join(rootDir, subjectName)
	lessonDir, err := FindLessonDir(subjectDir, *lesson)
	if err != nil {
		fmt.Fprintln(os.Stderr, "error:", err)
		os.Exit(1)
	}

	content, err := os.ReadFile(*file)
	if err != nil {
		fmt.Fprintln(os.Stderr, "error reading --file:", err)
		os.Exit(1)
	}
	if err := WriteExplanation(lessonDir, content); err != nil {
		fmt.Fprintln(os.Stderr, "error writing explanation:", err)
		os.Exit(1)
	}
	fmt.Println(lessonDir)
}

func cmdMigrate(args []string) {
	fs := flag.NewFlagSet("migrate", flag.ExitOnError)
	subject := fs.String("subject", "", "subject folder name")
	all := fs.Bool("all", false, "migrate every subject folder under the vault root")
	root := fs.String("root", "", "vault root (default: current directory)")
	fs.Parse(args)

	rootDir := vaultRoot(*root)
	subjects := resolveSubjects(rootDir, *subject, *all, "migrate")

	for _, s := range subjects {
		dir := filepath.Join(rootDir, s)
		moved, skipped, err := migrateSubject(dir)
		if err != nil {
			fmt.Fprintln(os.Stderr, "error in", s+":", err)
			continue
		}
		fmt.Printf("== %s ==\n", s)
		for _, m := range moved {
			fmt.Println("  moved: ", m)
		}
		for _, sk := range skipped {
			fmt.Println("  skipped:", sk)
		}
		if len(moved) == 0 && len(skipped) == 0 {
			fmt.Println("  (nothing to migrate)")
		}
	}
}

func cmdRename(args []string) {
	fs := flag.NewFlagSet("rename", flag.ExitOnError)
	subject := fs.String("subject", "", "subject folder name")
	all := fs.Bool("all", false, "rename in every subject folder under the vault root")
	root := fs.String("root", "", "vault root (default: current directory)")
	fs.Parse(args)

	rootDir := vaultRoot(*root)
	subjects := resolveSubjects(rootDir, *subject, *all, "rename")

	for _, s := range subjects {
		dir := filepath.Join(rootDir, s)
		renamed, skipped, err := renameSubject(dir)
		if err != nil {
			fmt.Fprintln(os.Stderr, "error in", s+":", err)
			continue
		}
		fmt.Printf("== %s ==\n", s)
		for _, r := range renamed {
			fmt.Println("  renamed:", r)
		}
		for _, sk := range skipped {
			fmt.Println("  skipped:", sk)
		}
		if len(renamed) == 0 && len(skipped) == 0 {
			fmt.Println("  (nothing to rename)")
		}
	}
}

func cmdShortcuts(args []string) {
	fs := flag.NewFlagSet("shortcuts", flag.ExitOnError)
	root := fs.String("root", "", "vault root (default: current directory)")
	fs.Parse(args)

	m, err := loadShortcuts(vaultRoot(*root))
	if err != nil {
		fmt.Fprintln(os.Stderr, "error:", err)
		os.Exit(1)
	}
	if len(m) == 0 {
		fmt.Println("(no shortcuts yet -- they're minted automatically on 'savelesson new')")
		return
	}
	codes := make([]string, 0, len(m))
	for c := range m {
		codes = append(codes, c)
	}
	sort.Strings(codes)
	for _, c := range codes {
		fmt.Printf("/%s -> %s\n", c, m[c])
	}
}

// resolveSubjects expands --all into every non-tooling top-level folder, or
// returns the single --subject value. Exits with an error if neither is set.
func resolveSubjects(rootDir, subject string, all bool, cmdName string) []string {
	if all {
		entries, err := os.ReadDir(rootDir)
		if err != nil {
			fmt.Fprintln(os.Stderr, "error:", err)
			os.Exit(1)
		}
		var subjects []string
		for _, e := range entries {
			if e.IsDir() && !isHiddenOrTooling(e.Name()) {
				subjects = append(subjects, e.Name())
			}
		}
		return subjects
	}
	if subject != "" {
		return []string{subject}
	}
	fmt.Fprintln(os.Stderr, cmdName+": --subject or --all is required")
	os.Exit(2)
	return nil
}

func isHiddenOrTooling(name string) bool {
	return name == "" || name[0] == '.' || name == "tools" || name == "_templates"
}
