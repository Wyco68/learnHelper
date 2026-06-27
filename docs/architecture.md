# Architecture

Loaded by `/upgrade` only. Canonical docs (kept at repo root, not
duplicated here — read both before any architecture-affecting change):

- [SPECIFICATION.md](../SPECIFICATION.md) — the two-layer contract
  (Next.js reads and manages / Go helper is dumb filesystem I/O).
  Claude Code is the author but is not a layer inside the app.
- [flow.md](../flow.md) — concrete request-by-request data flow:
  lesson creation (Claude Code → vault/), viewing, folder/lesson management.

## The one rule that must never break

Don't move logic across the two layers when fixing or extending the app:

- Don't add naming/slug/sequence logic to the Go helper (`tools/vaultd/`)
  — that's Next.js's job (`lib/vault/slug.ts`).
- Don't add filesystem writes to a React component or API route directly
  — always through `lib/vault/helper.ts` → `vaultd`.
- Don't add any AI generation, Claude API calls, or upload-and-generate
  logic to the Next.js app — content creation belongs to `/generate`
  (Claude Code), not to the web app.
