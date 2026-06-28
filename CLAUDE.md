# CLAUDE.md

Global repository rules only. No lesson-generation instructions, no
implementation details — those live in the two command files and `docs/`.

## Repo purpose
Lesson notes generated from uploaded slides/PDFs/images, rewritten in plain
high-school-level language, technical terms kept correct (Information
Systems & Network Engineering program). Architecture: `docs/architecture.md`
(read via `/feat`). Repo rules for humans: [README.md](README.md).

## Command Gatekeeper (strict)
This repository operates in strict command mode. Every user request must
begin with exactly one of:

- `/lect`
- `/feat`

If a prompt does not begin with one of these commands:

1. Do not analyze the request.
2. Do not inspect the repository.
3. Do not read project files.
4. Do not propose solutions.
5. Do not perform any work.

Immediately reply with:

```
Invalid command.

Start your request with one of:

/lect
- Lesson generation and lesson maintenance.

/feat
- Application development and project improvements.
```

Do not make exceptions. Do not infer which command the user intended. Wait
until a valid command is provided before proceeding.

## The two commands
- **`/lect`** — [.claude/commands/lect.md](.claude/commands/lect.md).
  Lesson generation and maintenance only. Loads only
  `docs/teaching-guidelines.md`, `docs/html-output-contract.md`,
  `docs/lesson-template.md`.
- **`/feat`** — [.claude/commands/feat.md](.claude/commands/feat.md).
  Application development only. Loads only `docs/architecture.md`,
  `docs/coding-style.md`, `docs/ui-guidelines.md`, `docs/api-contract.md`.

## Never mix responsibilities (strict)
Each command is self-contained and loads only its own docs. A request that
needs both lesson content changes and application changes must be split
into two separate `/lect` and `/feat` turns — never both under one
command.

Generated lesson files (`vault/**/*.html`, `vault/**/index.json`) are
**application data**, not application source. `/feat` never edits them
except for an explicit, requested migration or format conversion.
