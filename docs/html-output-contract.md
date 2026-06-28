# HTML Output Contract

Loaded by `/lect` only. Enforced two ways — keep all three in sync when
this contract changes:
- [lib/vault/sanitize.ts](../lib/vault/sanitize.ts) strips anything
  outside the tag allowlist before a lesson is ever rendered.
- [scripts/validate-lesson.mjs](../scripts/validate-lesson.mjs) checks a
  saved lesson against every rule below (headings, callouts, tags) and
  exits non-zero on any violation — `/lect` must run it after every save,
  see [lect.md](../.claude/commands/lect.md).

## Format (strict)
Generated lesson content is **semantic HTML only** — never Markdown, never
a file path, never a filename decision (naming stays with the app's save
path, not with content generation). Allowed tags only:

```
h1 h2 h3 p ul ol li
table thead tbody tr td th
pre code blockquote strong em
div class="mermaid"
```

- No inline styles, no `<style>`, no `<script>`.
- No custom classes except `class="mermaid"` on diagram containers.
- No styling decisions at all — presentation belongs entirely to React
  (colors, spacing, typography, callouts, tables, code blocks, diagrams,
  animation, dark mode). See [ui-guidelines.md](ui-guidelines.md) for how
  the app renders this.
- Diagrams = Mermaid source inside `<div class="mermaid">...</div>`,
  hydrated client-side by the React Mermaid component.

## Heading scheme (strict — only these, never deeper than `h3`, no emoji)
Every lesson uses this fixed set of headings, repeated per concept.
Consistency beats novelty — students learn the structure once.

```
h1  Lesson Title
h2  Overview
h2  Concept: <Specific Concept Name>
h2  How it Works
h2  Example
h2  Gotcha
h2  Summary
```

Repeat `Concept: <Name>` through `Gotcha` once per major concept.

**`Concept` must always carry the specific concept's name after the
colon** (e.g. `Concept: What Is Reliability?`, `Concept: Chaos
Engineering`) — never emit a bare `Concept` heading with no name. This is
the one heading that disambiguates the whole repeated block; everything
else in this scheme (`How it Works`, `Example`, `Gotcha`) stays exact
plain text with no suffix, since it's understood to belong to the nearest
preceding `Concept:` heading.

**No standalone `Exam Tips` or `Remember` heading** — go straight from
`Gotcha` into the `Exam Tip:`/`Remember:` callout (see Callouts below).
The callout box already renders its own label, so a heading above it is a
duplicate. Don't emit one.

Never invent new heading names beyond adding the concept name to
`Concept:`. Never use `h4`+ (no heading deeper than `h3`). Plain text
headings only — no emoji, ever.

## Callouts (strict)
Four callout types only, rendered as colored boxes by React. Emit each as
a `<blockquote>` whose text begins with the label:

- `Key Idea:` — core insight of a concept
- `Common Mistake:` — the specific trap to avoid
- `Exam Tip:` — sample question + answer
- `Remember:` — memorable closing takeaway

Use sparingly — only when they improve readability, never invent more.
No emoji prefix.

**Order and labeling, per concept block:** after `Gotcha`, emit exactly
one `Exam Tip:` callout, then exactly one `Remember:` callout — no heading
above either, the callout's own label is the section title.

`Key Idea:` and `Common Mistake:` callouts belong inside `Concept:`,
`How it Works`, `Example`, or `Gotcha` where relevant — never use them in
place of the closing `Exam Tip:`/`Remember:` pair.

## Formatting rules (strict)
- **Emphasis:** `<strong>` only for key terms or the single most important
  phrase — never whole sentences. `<code>` for commands, protocols,
  keywords, filenames, variables, ports, config values.
- **Lists:** `<ul>` for related-but-unordered ideas, `<ol>` for ordered
  processes — each `<li>` = one action only.
- **Tables:** use a `<table>` whenever comparing 2+ concepts/protocols/
  terms — never compare inside prose. Keep cells short.
- **Diagrams:** one Mermaid diagram per concept, inside that concept's
  section, with a one-line explanation right after it.
- **Code:** `<pre><code>` for code/commands, kept small and focused.
