# Desktop shell (`desktop/`)

Loaded by `/feat` only. The Tauri project that wraps the existing Next.js
app and Go helper into a native window — see
[architecture.md](architecture.md) for the rule that it holds no business
logic, only orchestration.

## Layout

```
desktop/
  Cargo.toml, build.rs        -- Rust crate
  tauri.conf.json             -- windows: [] (created programmatically, not declared)
  capabilities/default.json   -- event + sidecar-execute permissions
  assets/splash.html          -- the only "static frontendDist" Tauri needs
  src/lib.rs                  -- orchestrator (see below), src/main.rs entry point
  bin/                        -- sidecar binaries (gitignored, generated)
  resources/frontend/         -- Next standalone build output (gitignored, generated)
```

`app/`, `components/`, `lib/` (the Next.js app) and `tools/vaultd/` (the Go
helper) are unchanged and stay at the repo root — see
[architecture.md](architecture.md) for why nothing moved.

## Startup orchestration (`desktop/src/lib.rs`)

On launch: create a splash window (`assets/splash.html`) immediately, then
on a background thread:

1. Pick two free ports (bind `127.0.0.1:0`, read back the assigned port).
2. Start vaultd, poll its port until it accepts connections.
3. Start the Next server, poll its port the same way.
4. Emit `stage-update` events to the splash window at each step (it listens
   via `window.__TAURI__.event.listen`, enabled by `app.withGlobalTauri`).
5. Create the main window pointed at `http://127.0.0.1:<port>/vault`, close
   the splash window.

The webview navigating to a `127.0.0.1` URL is not "opening localhost in a
browser" — it's the app's own native window loading the app's own local
server, the standard way Tauri/Electron ship a Next.js app that has live
API routes (no static export is possible with API routes in the mix).

On exit, every tracked PID is killed via `taskkill /T /F` (Windows), not
`Child::kill()` — `npm run dev` runs under `cmd /C`, which fans out into
npm → node → turbopack workers, and a plain kill only stops the immediate
`cmd.exe`, leaving that whole tree running.

### Dev vs release

Two separate code paths, picked by `cfg(debug_assertions)` (`dev` vs
`release` modules in `lib.rs`) — they differ enough (where the binaries
come from, where the vault lives) that sharing one parameterized function
would be more confusing than two complete ones:

| | Dev (`tauri dev`) | Release (`tauri build`) |
|---|---|---|
| vaultd | built from `tools/vaultd/` if missing, run directly | bundled sidecar, resolved via `app.shell().sidecar("vaultd")` |
| Next | `cmd /C npm run dev -- -p <port>` against the repo | bundled Node sidecar running the standalone `server.js` |
| Vault location | repo's `vault/` (gitignored, unchanged) | repo's `vault/` (same checkout, resolved from `CARGO_MANIFEST_DIR` baked in at compile time) — same vault `/lect` writes lessons into, single-machine personal tool |

Sidecars are referenced by **basename only** (`sidecar("vaultd")`, not
`sidecar("bin/vaultd")`) — Tauri flattens `bundle.externalBin` entries to
sit directly next to the installed `.exe`, regardless of which
subdirectory they were built into.

## Build-time scripts (`scripts/`)

- **`ensure-desktop-sidecars.mjs`** (`build.beforeDevCommand`) — touches
  empty placeholder files at the sidecar paths and an empty
  `resources/frontend/` dir. Tauri's build script enforces that every
  `bundle.externalBin` entry and `bundle.resources` glob resolves to a real
  path *at compile time*, even for `tauri dev`, which never runs them
  (dev mode talks to a plain local vaultd + `npm run dev` — see table
  above). This keeps `tauri dev` fast instead of paying for a full
  production build on every run.
- **`prepare-desktop-resources.mjs`** (`build.beforeBuildCommand`) — the
  real artifact build for `tauri build`:
  1. `go build` vaultd, copy to `desktop/bin/vaultd-<target-triple>.exe`.
  2. `next build` (standalone output), assemble `desktop/resources/frontend/`
     from `.next/standalone` + `.next/static` + `public/`.
  3. Copy the local Node executable to `desktop/bin/node-<target-triple>.exe`
     as the second sidecar — `next build --output standalone` still needs a
     Node runtime to execute `server.js`; there's no way to make Next itself
     a zero-runtime native binary.
- **`desktop-target-triple.mjs`** — the `<target-triple>` lookup shared by
  both scripts above (Tauri's sidecar naming convention).

## Install & run

Prerequisites (one-time, machine setup): Node 20+, Go 1.21+, Rust
(`rustup`) + platform C/C++ build tools (MSVC Build Tools on Windows —
WebView2 ships with Win11 already).

**Build the installer:**

```bash
npm install
npm run build:desktop
```

Runs `prepare-desktop-resources.mjs` (Go build, `next build --output
standalone`, copies a Node sidecar) then `cargo tauri build`. Output:

```
desktop/target/release/bundle/nsis/Notes_<version>_x64-setup.exe   -- run this
desktop/target/release/bundle/msi/Notes_<version>_x64_en-US.msi    -- or this
```

Running the installer adds **Notes** to the Start Menu like any normal
Windows app; from then on it's just double-clicking the app, no terminal.
Re-running `npm run build:desktop` + the new installer after a source
change replaces the install in place. Uninstall via Settings → Apps, same
as any app.

**Develop with hot reload** (skips the installer, runs straight from source):

```bash
npm run dev:desktop
```

Cold start (splash → loaded `/vault`) is dominated by the bundled Node
runtime booting the standalone server — roughly 8-10s in the packaged
build, faster in dev since `next dev` is already warm after the first run.

## Commands

```bash
npm run dev:desktop     # development: native window, hot reload
npm run build:desktop   # production: installer under desktop/target/release/bundle
```

## Verifying a change here

`cargo check` and `cargo check --release` from `desktop/` only type-check
one `cfg` branch each (`dev` vs `release`) — `cargo check --release` is the
only way to catch mistakes in the release sidecar path before a full
`tauri build`. A real end-to-end check needs the actual CLI commands above,
since the sidecar/resource existence checks and capability permissions only
surface at that point, not at plain `cargo check`.
