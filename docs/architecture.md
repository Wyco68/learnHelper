# Architecture

Loaded by `/feat` only. Canonical docs (kept at repo root, not
duplicated here — read both before any architecture-affecting change):

- [SPECIFICATION.md](../SPECIFICATION.md) — the two-layer contract
  (Next.js reads and manages / Go helper is dumb filesystem I/O).
  Claude Code is the author but is not a layer inside the app.
- [flow.md](../flow.md) — concrete request-by-request data flow:
  lesson creation (Claude Code → vault/), viewing, folder/lesson management.
- [docs/desktop.md](desktop.md) — the Tauri shell (`desktop/`): startup
  orchestration, splash screen, dev vs production sidecar layout.

## The one rule that must never break

Don't move logic across the two layers when fixing or extending the app:

- Don't add naming/slug/sequence logic to the Go helper (`tools/vaultd/`)
  — that's Next.js's job (`lib/vault/slug.ts`).
- Don't add filesystem writes to a React component or API route directly
  — always through `lib/vault/helper.ts` → `vaultd`.
- Don't add any AI generation, Claude API calls, or upload-and-generate
  logic to the Next.js app — content creation belongs to `/lect`
  (Claude Code), not to the web app.
- Don't add business logic to `desktop/` (the Tauri shell). It only
  starts/stops vaultd and Next, shows the splash/main window, and cleans up
  on exit — it has no opinion on vault content, naming, or UI.
