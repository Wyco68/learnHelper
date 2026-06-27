# HTML Output Contract

Loaded by `/generate` only. Enforced in code by
[lib/vault/sanitize.ts](../lib/vault/sanitize.ts) — this doc is the source
of truth that sanitizer implements, so keep them in sync.

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
h2  Concept
h2  How it Works
h2  Example
h2  Gotcha
h2  Exam Tips
h2  Remember
h2  Summary
```

Repeat `Concept` through `Remember` once per major concept. Never invent
new heading names. Never use `h4`+ (no heading deeper than `h3`). Plain
text headings only — no emoji, ever.

## Callouts (strict)
Four callout types only, rendered as colored boxes by React. Emit each as
a `<blockquote>` whose text begins with the label:

- `Key Idea:` — core insight of a concept
- `Common Mistake:` — the specific trap to avoid
- `Exam Tip:` — sample question + answer
- `Remember:` — memorable closing takeaway

Use sparingly — only when they improve readability, never invent more.
No emoji prefix.

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
