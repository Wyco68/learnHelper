// Command vaultd is a tiny filesystem helper for Notes.
//
// It is deliberately dumb: it performs raw filesystem I/O on a vault directory
// and contains ZERO business logic. It never decides folder names, filenames,
// slugs, sequence numbers, or lesson structure — every such value is supplied,
// fully resolved, by the Next.js application that calls it.
//
// Storage layout it maintains:
//
//	<root>/<Folder>/index.json        ordered lesson metadata for the folder
//	<root>/<Folder>/<id>.html         one lesson's generated HTML, written as-is
//
// Seven operations, one HTTP endpoint each:
//
//	POST   /folder                       CreateFolder
//	DELETE /folder/{name}                DeleteFolder
//	POST   /lesson                       SaveLesson
//	GET    /lesson/{folder}/{id}         LoadLesson
//	DELETE /lesson/{folder}/{id}         DeleteLesson
//	POST   /lesson/{folder}/{id}/rename  RenameLesson
//	GET    /tree                         ListTree
package main

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

// lessonEntry is one row of a folder's index.json. All fields are decided by
// the caller; vaultd only stores and echoes them back.
type lessonEntry struct {
	ID    string `json:"id"`    // filename stem, e.g. "01-intro"
	Slug  string `json:"slug"`  // "intro"
	Title string `json:"title"` // human-readable
	Seq   int    `json:"seq"`   // ordering number
}

func main() {
	addr := os.Getenv("VAULTD_ADDR")
	if addr == "" {
		addr = "127.0.0.1:4321"
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/folder", handleFolder)
	mux.HandleFunc("/folder/", handleFolderPath) // DELETE /folder/{name}
	mux.HandleFunc("/lesson", handleLessonRoot) // POST /lesson (save)
	mux.HandleFunc("/lesson/", handleLessonPath) // /lesson/{folder}/{id}[/rename]
	mux.HandleFunc("/tree", handleTree)

	log.Printf("vaultd listening on %s (root=%s)", addr, vaultRoot())
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatal(err)
	}
}

// vaultRoot resolves the vault directory from VAULT_ROOT, defaulting to ./vault
// relative to the process working directory.
func vaultRoot() string {
	if r := os.Getenv("VAULT_ROOT"); r != "" {
		return r
	}
	return "vault"
}

// safeName rejects any path segment that could escape the vault. This is a
// security guard, not business logic — vaultd still doesn't *invent* names.
func safeName(name string) (string, bool) {
	if name == "" || strings.ContainsAny(name, `/\`) || strings.Contains(name, "..") {
		return "", false
	}
	return name, true
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeErr(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

// --- index.json helpers ---

func indexPath(folder string) string {
	return filepath.Join(vaultRoot(), folder, "index.json")
}

func loadIndex(folder string) ([]lessonEntry, error) {
	data, err := os.ReadFile(indexPath(folder))
	if errors.Is(err, os.ErrNotExist) {
		return []lessonEntry{}, nil
	}
	if err != nil {
		return nil, err
	}
	var entries []lessonEntry
	if err := json.Unmarshal(data, &entries); err != nil {
		return nil, err
	}
	return entries, nil
}

func saveIndex(folder string, entries []lessonEntry) error {
	sort.Slice(entries, func(i, j int) bool { return entries[i].Seq < entries[j].Seq })
	data, err := json.MarshalIndent(entries, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(indexPath(folder), data, 0o644)
}

// --- POST /folder ---

func handleFolder(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeErr(w, http.StatusMethodNotAllowed, "use POST")
		return
	}
	var body struct {
		Name string `json:"name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeErr(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	name, ok := safeName(body.Name)
	if !ok {
		writeErr(w, http.StatusBadRequest, "invalid folder name")
		return
	}
	dir := filepath.Join(vaultRoot(), name)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	// Seed an empty index if the folder is new.
	if _, err := os.Stat(indexPath(name)); errors.Is(err, os.ErrNotExist) {
		if err := saveIndex(name, []lessonEntry{}); err != nil {
			writeErr(w, http.StatusInternalServerError, err.Error())
			return
		}
	}
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

// --- DELETE /folder/{name} ---

func handleFolderPath(w http.ResponseWriter, r *http.Request) {
	name := strings.TrimPrefix(r.URL.Path, "/folder/")
	folder, ok := safeName(name)
	if !ok {
		writeErr(w, http.StatusBadRequest, "invalid folder name")
		return
	}
	if r.Method != http.MethodDelete {
		writeErr(w, http.StatusMethodNotAllowed, "use DELETE")
		return
	}
	if err := os.RemoveAll(filepath.Join(vaultRoot(), folder)); err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

// --- POST /lesson (SaveLesson) ---

func handleLessonRoot(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeErr(w, http.StatusMethodNotAllowed, "use POST")
		return
	}
	var body struct {
		Folder string `json:"folder"`
		ID     string `json:"id"`
		Slug   string `json:"slug"`
		Title  string `json:"title"`
		Seq    int    `json:"seq"`
		HTML   string `json:"html"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeErr(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	folder, ok1 := safeName(body.Folder)
	id, ok2 := safeName(body.ID)
	if !ok1 || !ok2 {
		writeErr(w, http.StatusBadRequest, "invalid folder or id")
		return
	}
	dir := filepath.Join(vaultRoot(), folder)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	// Write the HTML file exactly as provided.
	if err := os.WriteFile(filepath.Join(dir, id+".html"), []byte(body.HTML), 0o644); err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	// Upsert the index entry.
	entries, err := loadIndex(folder)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	entry := lessonEntry{ID: id, Slug: body.Slug, Title: body.Title, Seq: body.Seq}
	replaced := false
	for i := range entries {
		if entries[i].ID == id {
			entries[i] = entry
			replaced = true
			break
		}
	}
	if !replaced {
		entries = append(entries, entry)
	}
	if err := saveIndex(folder, entries); err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

// --- /lesson/{folder}/{id}[/rename] ---

func handleLessonPath(w http.ResponseWriter, r *http.Request) {
	rest := strings.TrimPrefix(r.URL.Path, "/lesson/")
	parts := strings.Split(rest, "/")
	if len(parts) < 2 {
		writeErr(w, http.StatusBadRequest, "expected /lesson/{folder}/{id}")
		return
	}
	folder, ok1 := safeName(parts[0])
	id, ok2 := safeName(parts[1])
	if !ok1 || !ok2 {
		writeErr(w, http.StatusBadRequest, "invalid folder or id")
		return
	}

	// /lesson/{folder}/{id}/rename
	if len(parts) == 3 && parts[2] == "rename" {
		renameLesson(w, r, folder, id)
		return
	}

	switch r.Method {
	case http.MethodGet:
		loadLesson(w, folder, id)
	case http.MethodDelete:
		deleteLesson(w, folder, id)
	default:
		writeErr(w, http.StatusMethodNotAllowed, "use GET or DELETE")
	}
}

func loadLesson(w http.ResponseWriter, folder, id string) {
	data, err := os.ReadFile(filepath.Join(vaultRoot(), folder, id+".html"))
	if errors.Is(err, os.ErrNotExist) {
		writeErr(w, http.StatusNotFound, "lesson not found")
		return
	}
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	title := id
	if entries, err := loadIndex(folder); err == nil {
		for _, e := range entries {
			if e.ID == id {
				title = e.Title
				break
			}
		}
	}
	writeJSON(w, http.StatusOK, map[string]string{"html": string(data), "title": title})
}

func deleteLesson(w http.ResponseWriter, folder, id string) {
	if err := os.Remove(filepath.Join(vaultRoot(), folder, id+".html")); err != nil && !errors.Is(err, os.ErrNotExist) {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	entries, err := loadIndex(folder)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	kept := entries[:0]
	for _, e := range entries {
		if e.ID != id {
			kept = append(kept, e)
		}
	}
	if err := saveIndex(folder, kept); err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func renameLesson(w http.ResponseWriter, r *http.Request, folder, id string) {
	if r.Method != http.MethodPost {
		writeErr(w, http.StatusMethodNotAllowed, "use POST")
		return
	}
	var body struct {
		NewTitle string `json:"newTitle"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeErr(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	entries, err := loadIndex(folder)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	found := false
	for i := range entries {
		if entries[i].ID == id {
			entries[i].Title = body.NewTitle
			found = true
			break
		}
	}
	if !found {
		writeErr(w, http.StatusNotFound, "lesson not found")
		return
	}
	if err := saveIndex(folder, entries); err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

// --- GET /tree ---

type treeFolder struct {
	Name    string        `json:"name"`
	Lessons []lessonEntry `json:"lessons"`
}

func handleTree(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeErr(w, http.StatusMethodNotAllowed, "use GET")
		return
	}
	root := vaultRoot()
	dirEntries, err := os.ReadDir(root)
	if errors.Is(err, os.ErrNotExist) {
		writeJSON(w, http.StatusOK, map[string][]treeFolder{"folders": {}})
		return
	}
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	folders := []treeFolder{}
	for _, de := range dirEntries {
		if !de.IsDir() || strings.HasPrefix(de.Name(), ".") {
			continue
		}
		lessons, err := loadIndex(de.Name())
		if err != nil {
			continue
		}
		sort.Slice(lessons, func(i, j int) bool { return lessons[i].Seq < lessons[j].Seq })
		folders = append(folders, treeFolder{Name: de.Name(), Lessons: lessons})
	}
	sort.Slice(folders, func(i, j int) bool { return folders[i].Name < folders[j].Name })
	writeJSON(w, http.StatusOK, map[string][]treeFolder{"folders": folders})
}
