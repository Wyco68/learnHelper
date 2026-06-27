# Project Specification — University Notes

## 1. Purpose

University Notes turns uploaded lecture material (slides, PDFs, images) into
clean, deeply-explained study notes, then presents those notes in a
code-editor-style web reader.

The notes are rewritten in plain high-school-level language while keeping
technical terms exact, aimed at an Information Systems & Network Engineering
program. Every note follows one fixed teaching structure (the "Professor
Method") so the student learns the layout once and never hunts for things
again.

There are two interfaces, with a clean split of responsibility:

- **Claude Code (authoring):** add new lessons and generate / edit their
  content. This is where uploaded files are read and rewritten.
- **Next.js web app (viewing):** browse the subject/lesson tree and read the
  rendered notes, with animation and correct diagram rendering. Read-only.

The notes themselves are plain Markdown files on disk, so they stay portable
and outlive either tool.

---

## 2. What the project does

1. A source file is uploaded in a Claude Code chat (`.pptx`, `.pdf`, image,
   etc.). The file itself is never stored — only its filename is recorded.
2. Claude resolves which subject folder and lesson title it belongs to (the
   subject always comes from the user, never guessed from file content).
3. The `savelesson` helper creates the lesson as one flat Markdown file.
4. Claude reads every point in the source and rewrites it into the fixed
   lesson structure, writing the result into that file.
5. The web app reads the vault folder and shows the subject/lesson tree on
   the left and the rendered Markdown on the right.

---

## 3. Storage model

Everything personal lives under `vault/` at the repo root. `vault/` is
**gitignored** — it is the user's private notes, never shipped with the
template. The template repo ships empty so anyone can clone it for their own
subjects.

Each lesson is **one flat Markdown file** (no per-lesson folder, no stored
source files):

```
vault/
  .shortcuts.json                      -- "/code" -> Subject Name map (gitignored)
  <Subject>/
    README.md                          -- optional subject readme
    NN-topic-slug.md                   -- one lesson, numbered + slugified
```

Example:

```
vault/Operating-System/01-introduction.md
vault/Wireless-Network/01-wireless-computer-network-architecture.md
```

- `NN` is an auto-incrementing per-subject sequence number (`01`, `02`, ...).
- The slug is the lowercase-hyphenated lesson title.
- The original upload's filename is preserved only inside the note's
  `**Source file:**` header line.

Per-subject `/code` shortcuts (e.g. `Wireless Network` -> `/wn`) are minted
automatically and stored in `vault/.shortcuts.json`, with collisions resolved
by appending a number (`wn`, `wn2`, ...).

---

## 4. Lesson document structure

Every lesson uses one fixed heading scheme, never deeper than `###`, no
emoji. The `Concept` ... `Remember` block repeats once per major concept.

```
# Lesson Title
Overview
Concept
How it Works
Example
Diagram
Gotcha
Exam Tips
Remember
Summary
Self Check
```

Four callout types only, rendered as colored boxes in the web app:

| Callout            | Meaning                         | Box color |
|--------------------|---------------------------------|-----------|
| `> Key Idea:`      | core insight of a concept       | blue      |
| `> Common Mistake:`| the specific trap to avoid      | red       |
| `> Exam Tip:`      | sample question + answer        | amber     |
| `> Remember:`      | memorable closing takeaway      | green     |

Diagrams are always Mermaid (` ```mermaid `), one per concept, rendered
client-side in the web reader.

The full authoring rules live in [CLAUDE.md](CLAUDE.md); the skeleton lives in
[_templates/lesson-template.md](_templates/lesson-template.md).

---

## 5. Flows

### 5.1 Authoring flow (Claude Code + savelesson)

```
upload file in chat
   -> resolve subject (user-provided or matched) + title
   -> savelesson new --subject ... --title ... --source <filename> --root vault
        -> creates vault/<Subject>/NN-slug.md (empty), mints /code shortcut
   -> Claude reads source, rewrites into the fixed lesson structure
   -> savelesson explain --subject ... --lesson NN --file <generated.md> --root vault
        -> writes the final Markdown into NN-slug.md
   -> follow-up prompts edit that SAME file until a new file is uploaded
```

`savelesson` (Go CLI, `tools/savelesson/`) owns all filesystem layout:
sequence numbering, slugifying, shortcut minting, flat-file writes. Its
subcommands:

| Command     | Purpose                                                        |
|-------------|----------------------------------------------------------------|
| `new`       | create `Subject/NN-slug.md`, mint shortcut, reserve sequence    |
| `explain`   | (over)write a lesson's Markdown by name or sequence number      |
| `migrate`   | flatten any legacy `NN-slug/NN-slug.md` folders into flat files |
| `rename`    | legacy: fix `explanation.md` -> `NN-slug.md`                     |
| `shortcuts` | list known `/code -> Subject` mappings                          |

### 5.2 Viewing flow (Next.js web app)

```
browser -> GET /vault
   -> AppShell renders sidebar + content pane
   -> FileTree calls GET /api/tree
        -> lib/vault/tree.ts walks vault/, returns subjects + lessons JSON
   -> user clicks a lesson
   -> LessonViewer calls GET /api/lesson/<Subject>/<NN-slug>.md
        -> reads the flat .md file, returns raw Markdown
   -> MarkdownRenderer renders it:
        - callout blockquotes  -> colored Callout boxes
        - ```mermaid blocks    -> Mermaid component (client-side SVG)
        - tables / code        -> GFM + syntax highlighting
   -> Framer Motion animates the content swap on each lesson change
```

The web app is read-only: it never writes to the vault.

---

## 6. Tech stack and how each piece is used

| Layer            | Technology                         | Role in this project                                                            |
|------------------|-------------------------------------|---------------------------------------------------------------------------------|
| Framework        | Next.js 15 (App Router)             | Routing (`/vault`, `/settings`), server route handlers under `app/api/*`        |
| Language         | TypeScript                          | All web code; strict mode                                                        |
| UI               | React 18                            | Sidebar tree, lesson viewer, client components                                  |
| Styling          | Tailwind CSS + `@tailwindcss/typography` | Dark code-editor look; `prose` classes style the rendered Markdown         |
| Markdown         | `react-markdown` + `remark-gfm`     | Parse/render notes, GitHub-flavored tables                                       |
| Code blocks      | `rehype-highlight` + `highlight.js` | Syntax highlighting (github-dark theme)                                          |
| Diagrams         | `mermaid`                           | Client-side SVG diagrams; dark theme, responsive width                          |
| Animation        | `framer-motion`                     | Fade/slide on lesson switch, diagram fade-in                                     |
| Authoring CLI    | Go (`tools/savelesson`)             | All vault filesystem operations (create, write, sequence, shortcuts, migrate)   |
| Notes storage    | Flat Markdown files under `vault/`  | Source of truth; gitignored, portable                                           |

### Web file map

```
app/
  page.tsx                       -- redirects / -> /vault
  vault/page.tsx                 -- renders AppShell
  settings/page.tsx              -- API-key settings page
  api/
    tree/route.ts                -- GET subject/lesson tree JSON
    lesson/[...path]/route.ts    -- GET one lesson's raw Markdown
    shortcuts/route.ts           -- GET /code -> subject map
    generate/route.ts            -- POST upload -> Claude -> write (backend, optional)
    settings/route.ts            -- GET/POST per-user Claude API key

components/
  layout/AppShell.tsx            -- two-pane editor layout
  sidebar/FileTree.tsx, FileTreeNode.tsx
  viewer/LessonViewer.tsx, MarkdownRenderer.tsx, Callout.tsx, Mermaid.tsx
  settings/ApiKeyForm.tsx

lib/
  vault/  paths, slugify, sequence, lesson, shortcuts, tree, config, types
          (TypeScript port of the savelesson logic — keeps web + CLI on the
           same on-disk format)
  crypto/secretBox.ts            -- AES-256-GCM for stored API keys
  claude/ client, systemPrompt, generateLesson
```

### `lib/vault/` ↔ Go parity

`lib/vault/*` mirrors `tools/savelesson/*` exactly (same slug rules, same
`^(\d+)-` sequence regex, same `.shortcuts.json` shape) so the web app needs
no Go dependency and both tools can operate on the same vault interchangeably.

---

## 7. Multi-user notes (current state)

- Per-user separation is structured as `vault/<userId>/...`, selected by a
  `DEFAULT_USER_ID` environment variable. If a per-user folder does not exist,
  the app falls back to the legacy `vault/` root so existing notes stay
  visible.
- An optional in-browser generation path exists in the backend
  (`app/api/generate`, `app/api/settings`, `lib/claude/*`): each user can save
  their own Claude API key (encrypted at rest with AES-256-GCM) and generate
  lessons server-side. This path is **not currently surfaced in the web UI** —
  the active authoring flow is Claude Code + `savelesson`. It remains available
  as a backend for a future hosted, multi-user deployment.

### Out of scope (current version)

- No real authentication (single env-configured user).
- No database (filesystem is the store).
- No deployment/hosting config (local `npm run dev`).
- No editing of notes from the web UI (viewing only).
- `.pptx` is not directly supported by the in-browser generation path
  (PDF/image only); CLI authoring handles all formats via Claude Code.

---

## 8. Running it

```bash
# Web reader (view notes)
cp .env.local.example .env.local     # set DEFAULT_USER_ID, encryption secret
npm install
npm run dev                          # http://localhost:3000 -> /vault

# Authoring CLI (one-time build)
cd tools/savelesson && go build -o savelesson.exe .
```

Day-to-day authoring happens by uploading a file in Claude Code, which drives
`savelesson` and writes the note; the web app picks it up on next load of the
tree.
