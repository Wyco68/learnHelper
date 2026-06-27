# University Notes — AI Lesson-Note Generator (Claude Code template)

Upload a slide deck / PDF / image in a Claude Code chat.

Get back a deeply-taught, beautifully-formatted lesson note in plain
language.

Works for **any subject** — this repo is a template, not tied to one
program or course list.

---

## How it works

1. Upload a slide/PDF/image in chat.
2. Claude reads every point in the file, nothing skipped.
3. It rewrites the content using the "Professor Method" — problem → idea
   → mechanism → example → diagram → common mistakes → exam tip — per
   `_templates/lesson-template.md`.
4. It saves the generated note as one lesson folder under `vault/`, via
   the `tools/savelesson` helper. **The uploaded file itself is never
   saved** — only its filename, recorded in the note's
   `**Source file:**` header line.
5. Subject folder is always confirmed with you (never guessed from file
   content) — title is auto-derived from the file's content once the
   folder is known.

All the exact rules live in [CLAUDE.md](CLAUDE.md) — that's what Claude
actually reads. This README is for humans.

---

## One-time setup

Requires:

- [Claude Code](https://claude.com/claude-code) (or any Claude Code-
  compatible agent) pointed at this repo.
- [Go](https://go.dev/dl/) 1.21+ installed (only to build the helper
  tool — no Go knowledge needed to use it).

Everything below runs without any OS-level permission prompt:

```bash
cd tools/savelesson
go build -o savelesson.exe .   # macOS/Linux: go build -o savelesson .
```

That's it. The binary is gitignored — build it locally once, it doesn't
get committed.

VS Code extensions (Mermaid preview, markdown lint, spell-check, themes)
install fine without any OS permission prompt — `code --install-extension <id>`
for each one in `.vscode/extensions.json`, or just open the repo in VS
Code and accept the "install recommended extensions" prompt.

> Optional, **does** need an OS permission prompt: nicer fonts for the
> Markdown preview (e.g. JetBrains Mono Nerd Font via `winget install`).
> Skip if you don't care.

---

## Using it

Upload a file in chat. Tell Claude where it goes — or get asked:

| What you type | What happens |
|---|---|
| *(nothing, just the file)* | Claude asks "Which folder?" — title still auto-derives from content once you answer |
| `Wireless Network` | Subject folder set to `Wireless-Network` (created if new), title auto-derived |
| `Wireless Network/Final notes` | Subject = `Wireless-Network`, title = "Final notes" verbatim |

The subject folder is never guessed from file content alone — it always
comes from you, either typed fresh or matched to an existing folder.

### Folder shortcuts

The first time you use a subject, it gets a short `/code` shortcut for
free — e.g. `Wireless Network` → `/wn`. Next time, just type `/wn`
instead of the full name. Codes never collide: a second "Wired Network"
would get `/wn2` automatically.

List your codes any time:

```bash
./tools/savelesson/savelesson.exe shortcuts --root vault
```

Stored in `vault/.shortcuts.json` — personal, gitignored, like everything
else under `vault/`.

Every lesson lands at:

```text
vault/<Subject>/NN-topic-slug.md   -- the generated note, one flat file
                                      (its header names the original upload
                                      — the upload itself isn't saved)
```

Follow-up messages (until you upload a new file) edit that same lesson's
note in place — they don't create a new lesson.

---

## Why `vault/` is gitignored

This repo is a **template**. Your actual lesson notes are personal —
they shouldn't end up in a public template repo, and they definitely
shouldn't end up in *this* repo's git history if you fork/clone it for
your own subjects.

`vault/` holds 100% of your generated content and is listed in
[.gitignore](.gitignore). Commit the template (rules, tool, formatting),
never your notes.

If you want your own notes versioned, init a **separate** git repo
inside `vault/` (or just back it up however you like) — keep it decoupled
from this template's history.

---

## Repo layout

```text
CLAUDE.md              -- the actual rules Claude follows (read this to customize)
_templates/             -- lesson-template.md, the fixed heading/section skeleton
tools/savelesson/       -- Go helper that creates/edits lesson folders
.vscode/                -- recommended extensions + workspace settings
vault/                  -- YOUR notes (gitignored, created on first use)
```

## Customizing for your own program/subjects

Nothing in `CLAUDE.md` is hardcoded to a specific course list — subject
folders are created on demand under `vault/` the first time you mention
or upload for them. Tweak `CLAUDE.md` directly if you want a different
teaching style, heading scheme, or formatting rules; tweak
`_templates/lesson-template.md` if you change the heading scheme so the
two stay in sync.
