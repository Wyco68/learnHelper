# /bug

## Purpose
Diagnose and fix an application error. The error text (stack trace, log
lines, console output, error message) is typed or pasted directly after
the `/bug` command in `ARGUMENTS`.

This is an `/upgrade`-scoped command — same docs, same restrictions, same
verification. `/bug` exists only to skip re-stating "fix this error" with
the full `/upgrade` boilerplate every time.

## Load (and only these)
- [docs/architecture.md](../../docs/architecture.md)
- [docs/coding-style.md](../../docs/coding-style.md)
- [docs/ui-guidelines.md](../../docs/ui-guidelines.md)
- [docs/api-contract.md](../../docs/api-contract.md)

## Process
1. Read `ARGUMENTS` as the error — don't ask the user to restate it.
2. Identify the failing layer first (Next.js route, React component, Go
   helper `vaultd`, or the boundary between them) using
   [architecture.md](../../docs/architecture.md) and
   [api-contract.md](../../docs/api-contract.md) — most "errors" here are
   a layer-boundary mismatch (e.g. vaultd not running → 502, wrong
   endpoint shape, stale `.next` cache), not a logic bug.
3. Reproduce or trace the root cause before editing anything. Don't patch
   symptoms (e.g. don't silently swallow an error) without understanding
   why it happened.
4. Fix at the smallest correct scope — match
   [coding-style.md](../../docs/coding-style.md) conventions already in
   the file you're touching.
5. Verify per `/upgrade`'s verification rules: `npx tsc --noEmit`,
   `go build` for `tools/vaultd` if Go was touched, and a browser check
   via the preview tools if the bug was UI-visible.

## Restrictions (strict)
Same as `/upgrade`:
- Never generate or rewrite lesson content.
- Never edit generated lesson files (`vault/**/*.html`,
  `vault/**/index.json`) unless the fix is explicitly a migration/format
  issue.

## Redirect rule
If `ARGUMENTS` turns out to be about lesson content generation, not the
application, stop and tell the user to use `/generate` instead.
