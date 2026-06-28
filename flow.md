# Data Flow — Next.js + Go (vaultd)

Two separate workflows: **lesson creation** (Claude Code, outside the app) and
**lesson reading/management** (the Next.js app). They share the `vault/`
directory as the handoff point.

---

## 1. Lesson creation (Claude Code → vault/)

Claude Code is the only tool that writes lesson content.

```
/lect (Claude Code CLI)
  → Claude reads uploaded lecture file (PDF, image, slides)
  → Claude generates semantic HTML following the output contract
  → Claude writes vault/<Folder>/<id>.html
  → Claude upserts vault/<Folder>/index.json
  → Done
```

This happens entirely outside the Next.js process. No API route is involved.
The app picks up the new lesson on the next tree fetch.

**Naming convention (Claude Code must follow):**
- `<folder>` = kebab-case slug of the subject name, e.g. `computer-networks`
- `<id>` = `<seq padded to 2 digits>-<slug>`, e.g. `03-routing-protocols`
- `<slug>` = title lowercased, non-alphanumerics → `-`, trimmed
- `<seq>` = max existing seq in the folder + 1

**index.json shape:**
```json
[{ "id": "01-introduction", "slug": "introduction", "title": "Introduction", "seq": 1 }]
```

---

## 2. Viewing a lesson (browser → Next.js → vaultd)

```
Browser
  │  GET /vault (page load)
  ▼
AppShell
  │  fetch GET /api/tree
  ▼
app/api/tree/route.ts
  │  listTree() → vaultd GET /tree
  ▼
vaultd
  │  reads each index.json, returns { folders: [{ name, lessons: [...] }] }
  ▼
AppShell renders sidebar with folder/lesson tree

  │  user clicks a lesson
  ▼
LessonViewer
  │  fetch GET /api/lesson/<folder>/<id>
  ▼
app/api/lesson/[folder]/[id]/route.ts
  │  loadLesson() → vaultd GET /lesson/<folder>/<id>
  ▼
vaultd
  │  reads vault/<folder>/<id>.html, returns { html, title }
  ▼
HtmlRenderer
  │  DOMParser walk → React elements
  │  blockquote callouts → <Callout>
  │  div.mermaid → <Mermaid> (lazy SVG render)
  ▼
Screen
```

---

## 3. Folder management (browser → Next.js → vaultd)

**Create folder:**
```
NewFolderModal
  → POST /api/folders { name }
  → slugify(name) → POST vaultd /folder { name: slug }
  → vaultd creates dir + empty index.json
  → sidebar refreshes
```

**Delete folder:**
```
FileTreeNode (hover → trash icon)
  → ConfirmModal
  → DELETE /api/folders/<name>
  → vaultd DELETE /folder/<name>  (os.RemoveAll)
  → sidebar refreshes
```

---

## 4. Lesson management (browser → Next.js → vaultd)

**Delete lesson:**
```
FileTreeNode (hover → trash icon)
  → ConfirmModal
  → DELETE /api/lesson/<folder>/<id>
  → vaultd DELETE /lesson/<folder>/<id>
  → removes .html + drops entry from index.json
  → sidebar refreshes
```

**Rename lesson:**
```
(rename UI → POST /api/lesson/<folder>/<id> { newTitle })
  → vaultd POST /lesson/<folder>/<id>/rename { newTitle }
  → index.json title updated (filename unchanged)
```

---

## 5. Who does what

| Layer | Files | Responsibility |
|---|---|---|
| **Claude Code** | `/lect` command | Content creation: generate HTML, write vault/ files, update index.json |
| **Next.js** | `app/api/*`, `lib/vault/*`, `components/*` | Read and manage: tree, load lesson, delete/rename folder and lesson |
| **vaultd** | `tools/vaultd/main.go` | Pure filesystem I/O over HTTP. Zero naming logic, zero content logic |
