# University Notes — self-contained lesson-note web app

Upload a slide deck / PDF / image in the browser.

Get back a deeply-taught, beautifully-formatted lesson note in plain
language.

Works for **any subject** — this repo is a template, not tied to one
program or course list.

Full architecture: [SPECIFICATION.md](SPECIFICATION.md). Content rules
Claude follows: [CLAUDE.md](CLAUDE.md).

---

## How it works

1. Click **+ New Folder** to create a subject, or **Upload** to add a
   lesson to an existing one.
2. Pick the folder, choose a file, type a title, hit **Generate**.
3. The Next.js app sends the file to Claude, which reads every point in
   it and rewrites it using the "Professor Method" — problem → idea →
   mechanism → example → diagram → common mistakes → exam tip.
4. Claude returns semantic HTML only (no Markdown, no filenames, no
   storage decisions). The app picks the filename/slug/sequence number
   and saves it via the Go filesystem helper (`vaultd`).
5. The lesson appears in the sidebar immediately — click it to read.

---

## One-time setup

Requires:

- [Node.js](https://nodejs.org/) 20+ and npm.
- [Go](https://go.dev/dl/) 1.21+ (only to build the filesystem helper).
- A Claude subscription (Pro/Max) and the [Claude Code](https://claude.com/claude-code)
  CLI, used once to mint a subscription token.

```bash
npm install

cd tools/vaultd
go build -o vaultd.exe .   # macOS/Linux: go build -o vaultd .
cd ../..
```

Run both processes (separate terminals):

```bash
./tools/vaultd/vaultd.exe   # filesystem helper, default :4321
npm run dev                 # http://localhost:3000 -> /vault
```

### Connect your Claude subscription

This app bills generation to your **Claude subscription**, never a
pay-per-API key:

```bash
claude setup-token
```

Authorize in the browser, copy the printed token, click **Connect
Claude** in the app's sidebar, paste it in. The token is encrypted at
rest (`.claude-token.enc`, gitignored) and sent as
`Authorization: Bearer` with the OAuth beta header — exactly how Claude
Code itself authenticates.

---

## Why `vault/` is gitignored

This repo is a **template**. Your actual lesson notes are personal —
they shouldn't end up in a public template repo, and they definitely
shouldn't end up in *this* repo's git history if you fork/clone it for
your own subjects.

`vault/` holds 100% of your generated content (`.html` lesson files +
per-folder `index.json`) and is listed in [.gitignore](.gitignore).
Commit the template (rules, code, formatting), never your notes.

If you want your own notes versioned, init a **separate** git repo
inside `vault/` (or just back it up however you like) — keep it
decoupled from this template's history.

---

## Repo layout

```text
CLAUDE.md            -- the content/teaching rules Claude follows
SPECIFICATION.md      -- full architecture (Next.js / Go / Claude split)
_templates/            -- lesson-template.md, the fixed heading skeleton
app/                   -- Next.js UI + API routes (owns the whole workflow)
lib/vault/             -- naming, sanitizing, vaultd client (TypeScript)
lib/claude/            -- Claude content-generation client
lib/auth/              -- encrypted subscription-token store
tools/vaultd/          -- Go filesystem helper (zero business logic)
vault/                 -- YOUR notes (gitignored, created on first use)
```

## Customizing for your own program/subjects

Nothing in `CLAUDE.md` is hardcoded to a specific course list — folders
are created on demand from the UI the first time you need them. Tweak
`CLAUDE.md` directly if you want a different teaching style, heading
scheme, or formatting rules; tweak `_templates/lesson-template.md` if you
change the heading scheme so the two stay in sync.
