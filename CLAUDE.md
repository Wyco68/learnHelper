# CLAUDE.md

## Repo purpose
Lesson notes generated from uploaded slides/PDFs/images, rewritten in plain
high-school-level language, technical terms kept correct (Information
Systems & Network Engineering program). Full repo rules: [README.md](README.md).

## Input grammar (strict, parse directly — minimize question round-trips,
## but NEVER guess the subject folder)
Every uploaded file is placed at `<ShortFolder>/<Title>`. Read the user's
message accompanying (or right after) an upload as one of these 3 forms:

1. **No folder text given at all** → **STRICT: never auto-derive the
   folder from file content.** Ask exactly one plain-text question:
   "Which folder?" (not AskUserQuestion — plain text is cheaper). Wait
   for the answer before creating anything. Title still auto-derives from
   file content once the folder answer comes back (see case 2) — never
   ask a second question for title.
2. **`<FolderName>` only** (e.g. `Wireless Network`) → match case-
   insensitively against existing subject folders, treating spaces/
   hyphens as equivalent (`Wireless Network` == `Wireless-Network`).
   Match found → use it. No match → mint a new short hyphenated subject
   name from what the user gave (still their words, just slugified — not
   invented from file content). Title is auto-derived from the file's
   content (e.g. a deck titled "Chapter 1: Introduction" → title
   "Introduction"). Do not ask a second question for title.
3. **`<FolderName>/<Title>`** (e.g. `Wireless Network/Final notes`) →
   split on the first `/`. Left = subject (resolved exactly like case 2).
   Right = explicit lesson title, used verbatim (slugified for the folder
   name), overriding content-derived auto-title.

Never ask for both folder AND title in one round — case 1 asks folder
only (title auto-derives once folder is known); cases 2/3 ask nothing.
The folder name is the one piece of information that always comes from
the user, directly or by reusing an existing match — never invented from
file content alone.

## Folder shortcuts (strict — `/code` shorthand)
Every subject folder gets a short `/code` shortcut, minted and persisted
automatically by `tools/savelesson` in `vault/.shortcuts.json` (gitignored,
personal — e.g. `Wireless Network` → `/wn`).

- The user may type a `/code` instead of the full folder name anywhere
  the Input grammar above expects `<FolderName>` (cases 2 and 3) — pass
  it straight through to `--subject`, the tool expands it.
- Codes are **never duplicated**: the tool checks `.shortcuts.json` first,
  and on collision appends an incrementing number (`wn`, then `wn2`,
  `wn3`, ...) until it finds a free one — this is enforced in code
  (`tools/savelesson/shortcuts.go`), not left to memory.
- A brand-new subject (case 2/3, no existing match) gets its shortcut
  minted the moment `savelesson new` creates it — printed to stderr as
  `shortcut: /xx -> Subject Name`, surface that to the user once so they
  know the code exists.
- To look up known codes: `savelesson shortcuts --root vault`.
- An unrecognized `/code` is a hard error from the tool — surface it and
  ask the user for the real folder name (don't silently fall back to
  auto-derivation; that breaks the "never guess the folder" rule above).

**STRICT — Windows/git-bash gotcha:** when the Bash tool runs `savelesson`
with a `/code` shortcut, MSYS auto-converts a leading `/word` argument
into a bogus Windows path (e.g. `/dcad` → `C:/Program Files/Git/dcad` or
similar) before the Go binary even sees it — this breaks `--subject`
silently into garbage and the tool then fails with a confusing
`mkdir ...\C:` error. **Always prefix any `savelesson` Bash call that
contains a `/code` argument with `MSYS_NO_PATHCONV=1`**:
```
MSYS_NO_PATHCONV=1 ./tools/savelesson/savelesson.exe new --subject=/dcad --title="..." --source="..." --root=vault
```
Also prefer `--flag=value` form over `--flag value` for any argument
starting with `/` — keeps it visibly one token, avoids other shell
quoting surprises. This prefix is required on every `new`/`explain`/
`shortcuts` call that uses a `/code`, not just the first one in a
session.

## Auto-process rule (strict)
1. Any file uploaded in chat (pptx/pdf/image/etc.) = auto trigger repo
   purpose.
2. Resolve subject + title via the Input grammar above — do this BEFORE
   reading/processing file content, not after.
3. **Create the lesson folder immediately, the moment subject + title are
   resolved — before writing any explanation.** Call
   `savelesson new --subject ... --title ... --source <original-filename> --root vault`
   (no `--explain` yet) right away. `--source` is a **filename reference
   only** — the uploaded file is never copied or saved to disk. The tool
   just records the name so it can be echoed/embedded as a "Source file:"
   line in the generated note's header.
4. Track the "current lesson folder" = the path `savelesson new` just
   printed. This is the source of truth for where everything for this
   lesson goes from here on.
5. Read every point in the file, nothing skipped, rewrite using
   `_templates/lesson-template.md`. Put the original filename in the
   note's `**Source file:**` header field — that's the only place the
   filename is preserved.
6. Write the explanation via `savelesson explain --subject ... --lesson ... --file <generated-md> --root vault`
   (or `savelesson new ... --explain <generated-md>` in the same call as
   step 3, if the explanation is already fully written by then).
7. Every following user prompt (until a NEW file is uploaded) = treat as
   instruction to edit/append to that SAME current lesson's `NN-slug.md`
   (use `savelesson explain` to rewrite it, or edit the file directly —
   both land in the same folder). Do not create a new lesson for
   follow-up prompts.
8. When a new file is uploaded, repeat from step 1 — new file becomes the
   new "current lesson folder".

## Storage layout (strict)
Everything personal — every subject and lesson — lives under `vault/` at
the repo root. `vault/` is **gitignored**: it's the user's own private
notes, never part of the public template. The template repo itself ships
empty (no `vault/` committed), so any user can clone it for their own
subjects.

Every lesson = **one folder**, not a flat file. **The uploaded source
file itself is never saved** — only its filename, referenced in the
note's header:
```
vault/Subject/NN-topic-slug/
  NN-topic-slug.md   -- the generated lesson note (same name as folder);
                        its **Source file:** header line names the
                        original upload, but the upload itself isn't here
```
Build/use the helper tool at `tools/savelesson` (Go, `go build -o savelesson.exe .`
inside that folder — see README for one-time setup) instead of manual
mkdir:
```
savelesson new --subject <Name> --title "<Lesson Title>" --source "<original-filename.ext>" --explain "<path-to-generated-md>" --root vault
```
This auto-picks the next `NN` sequence number per subject, slugifies the
title, and writes the explanation as `NN-topic-slug.md` (folder's own
name) — all in one call. `--source` only needs to be a filename, not a
real path — nothing is read from or copied off disk for it. Always pass
`--root vault` (or run from inside `vault/`). See
`tools/savelesson/main.go` for `explain`/`migrate`/`rename` subcommands.

## Naming
`NN-short-topic-slug` folder style — numbered, lowercase, hyphens. (Legacy
flat `NN-slug.md` files were migrated to this folder layout via
`savelesson migrate --all`.)

## Teaching method (strict — "Professor Method")
Write like a PhD professor teaching intelligent high-schoolers with zero
prior knowledge. Teach, don't summarize. Per concept, cover in order:
problem it solves → why it's a problem → the idea/definition → how it
works (step by step) → real-life example → diagram → common mistakes →
exam tip → one memorable takeaway. Never skip reasoning, never give the
definition before the problem that motivates it. If two concepts are
related, explicitly say how. Map this order onto the heading scheme
below — `Concept` opens with problem+idea, `How it Works` covers the
mechanism, `Example` the real-life case, then mistakes/exam tip/remember
close it out.

## Heading scheme (strict — only these, never deeper than `###`, no emoji)
Every lesson uses this fixed set of headings, repeated per concept.
Students learn the structure after 2-3 lessons and stop spending effort
searching for things — consistency beats novelty here.
```
# Lesson Title
Overview
Concept
How it Works
Example
Common Mistakes
Exam Tips
Remember
Summary
```
Repeat `Concept` through `Remember` once per major concept in the lesson
(mirrors `_templates/lesson-template.md`). Never invent new heading names
or go past 3 heading levels. Plain text headings only — no emoji, ever,
anywhere in generated lessons or this file.

## Writing style (strict — one idea per line)
- **One idea per sentence. One sentence per line.** This is the #1 rule —
  goal is maximum readability, feel like a beautifully formatted Claude
  chat reply, never a textbook wall of text.
- Keep paragraphs to **2-4 lines max** — if longer, break into bullets or
  numbered steps.
- Active voice. Short sentences. High-school level wording — but go
  deep on content, never skip a reasoning step.
- Introduce only one new concept at a time. Explain jargon the moment
  it's used, same line.
- Teach first, define second — motivate the idea before naming it.
- The uploaded source file is the primary source of truth — every fact
  must trace back to it, nothing invented.

## Formatting rules (strict)
**Layout**
- Keep the page clean and spacious — whitespace is part of the design,
  prefer more spacing rather than less.
- One blank line between paragraphs, before/after headings, before/after
  every list, before/after every code block, before/after every diagram.
- Single `---` between major sections — never doubled, never consecutive.
- Never create walls of text.

**Sentences**
- One sentence per line, one idea per sentence (see Writing style above).
- Prefer multiple short lines over one long paragraph.

**Emphasis**
- **Bold** only key terms or the single most important phrase — never
  bold whole sentences, never overuse.
- `Code` formatting for commands, protocols, keywords, filenames,
  variables, ports, config values.

**Lists**
- Bullets for related-but-unordered ideas. Numbered lists for ordered
  processes/steps — each step = one action only.
- Blank line before and after every list. Keep each bullet concise.

**Tables**
- Markdown tables whenever comparing 2+ concepts/protocols/terms — never
  compare inside prose. Keep cells short.

**Diagrams**
- Diagrams = **Mermaid** (` ```mermaid `), not flat ASCII — renders big
  and clear in VS Code preview (`bierner.markdown-mermaid`). Use
  `flowchart`/`sequenceDiagram`/`stateDiagram-v2`. Plain ASCII
  (` ```text `) is fallback ONLY for tiny inline numeric annotations
  (e.g. an equation worked example), never the main diagram.
- One diagram per concept, placed inside that concept's own section —
  never a shared "Diagrams" section at the end.
- Explain the diagram immediately below it, one line per arrow/step.

**Callouts**
- Use exactly 4 callout types, never invent more, no emoji prefix:
  `> Key Idea:`, `> Common Mistake:`, `> Exam Tip:`, `> Remember:`.
- Use sparingly — only when they improve readability, not on every
  paragraph.

**Code blocks**
- Always specify the language. Blank line before and after. Keep
  examples small and focused.

**Headings**
- Consistent hierarchy, never deeper than `###` (see Heading scheme).
- No emoji anywhere — not on headings, not in callouts, not in
  paragraphs. Plain text only.

**Color**
- Plain markdown has no real font color — "color" comes from bold,
  code, tables, callouts, and `---` dividers, never literal color codes.

## Depth rule (strict)
Every lesson file = deeply explained, not surface bullet rewording.
- Concrete example/analogy for every key concept, not just a definition.
- Cover edge cases, "why it matters", common exam-trap confusions.
- Summary at the bottom covers EVERY concept in the file, one short
  line each — never a generic 3-5 line summary that skips concepts.
- Explain why the concept exists, not just what it is.
- Add memory tricks (mnemonics) wherever one naturally fits.
- Expand complex topics until a beginner could understand them without
  opening the original slides — prioritize understanding over
  summarization.

## Editor setup
Recommended VS Code extensions tracked in
[.vscode/extensions.json](.vscode/extensions.json) — markdown authoring/
preview/lint/spellcheck, Mermaid diagram render, Foam note-linking,
GitLens, TODO tracking, Markdown Preview Enhanced.
User-level `settings.json` sets markdown preview font size/line-height,
word wrap, ligatures, and `JetBrainsMono Nerd Font` as editor font
(installed via winget) for a clean, readable preview.
