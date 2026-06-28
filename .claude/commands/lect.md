# /lect

## Purpose
Lesson content creation and maintenance only.

## Load (and only these)
- [docs/teaching-guidelines.md](../../docs/teaching-guidelines.md)
- [docs/html-output-contract.md](../../docs/html-output-contract.md)
- [docs/lesson-template.md](../../docs/lesson-template.md)

Do not load `docs/architecture.md`, `docs/coding-style.md`,
`docs/ui-guidelines.md`, or `docs/api-contract.md` unless a lesson task
genuinely needs to know the storage layout (the three docs above are normally enough).

## Responsibilities
- Generate a lesson from an uploaded lecture file.
- Regenerate an existing lesson.
- Improve lesson quality.
- Update the explanation format/content.
- Save generated lesson files to `vault/`.

## Save path (direct file writes)

The web application no longer handles generation. Write lesson files directly:

```
vault/<folder-slug>/<id>.html   ← the generated semantic HTML
vault/<folder-slug>/index.json  ← upsert the lesson entry
```

**Naming rules (must follow):**
- `<folder-slug>` = subject name lowercased, non-alphanumerics → `-`, trimmed
- `<slug>` = lesson title lowercased, non-alphanumerics → `-`, trimmed
- `<seq>` = max existing `seq` in `index.json` + 1 (start at 1 if folder is new)
- `<id>` = `String(seq).padStart(2, "0") + "-" + slug`, e.g. `"03-routing-protocols"`

**index.json entry shape:**
```json
{ "id": "03-routing-protocols", "slug": "routing-protocols", "title": "Routing Protocols", "seq": 3 }
```

When the folder does not exist yet, create the directory and a new `index.json`
containing just the one entry. When the folder exists, read the current
`index.json`, append (or update) the entry, and write it back.

## After saving (validate, then auto-open)
After writing/updating a lesson's `.html`, **before** touching `index.json`
or opening the browser, validate it against the contract:

```
node scripts/validate-lesson.mjs vault/<folder-slug>/<id>.html
```

If it reports violations, fix the HTML and re-run until it passes — do not
save a lesson that fails validation. This is the strict-rules enforcement
for [html-output-contract.md](../../docs/html-output-contract.md): the
contract drifted silently before (bare `Concept` headings, duplicate
`Exam Tips`/`Remember` headings, a missing `<h1>` title) and nobody
noticed until a user did. The validator exists so that never happens
again without being caught immediately.

Once it passes, update `index.json`, then run:

```
node scripts/open-app.mjs
```

It ensures vaultd and `next dev` are both up (reusing whichever is already
running — never starts a duplicate) and opens the user's default browser
to the app. Both scripts are build tooling the app already ships with,
not a code change — running them does not violate the restrictions below.

## Restrictions (strict)
- Never modify application code (`app/`, `components/`, `lib/`, `tools/`).
- Never modify the UI.
- Never refactor the project.
- Never install packages.
- Never change the project architecture.
- Never update documentation unless explicitly requested.
- Never write Markdown — lesson output is HTML only (see html-output-contract.md).

## Redirect rule
If the request is about the application instead of lesson content, stop
and tell the user to use `/feat`. Do not do app work here.
