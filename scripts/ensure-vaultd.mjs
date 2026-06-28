// Makes sure vaultd is up. vaultd is a separate process from Next.js (see
// docs/architecture.md) and doesn't restart on its own — without this,
// every API route silently 502s until someone notices and starts it by
// hand. Exported so other scripts (open-app.mjs) can reuse the same check
// instead of duplicating it.

import { spawn } from "child_process";
import { existsSync } from "fs";
import path from "path";

const VAULTD_URL = process.env.VAULTD_URL || "http://127.0.0.1:4321";
const VAULTD_DIR = path.join(process.cwd(), "tools", "vaultd");
const BIN_NAME = process.platform === "win32" ? "vaultd.exe" : "vaultd";
const BIN_PATH = path.join(VAULTD_DIR, BIN_NAME);

async function isUp() {
  try {
    const res = await fetch(`${VAULTD_URL}/tree`, { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch {
    return false;
  }
}

function run(cmd, args, opts) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { shell: process.platform === "win32", ...opts });
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

async function waitUntilUp(timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isUp()) return true;
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

export async function ensureVaultd() {
  if (await isUp()) {
    console.log(`vaultd already running at ${VAULTD_URL}`);
    return;
  }

  if (!existsSync(BIN_PATH)) {
    console.log("vaultd binary missing, building it...");
    await run("go", ["build", "-o", BIN_NAME, "."], { cwd: VAULTD_DIR, stdio: "inherit" });
  }

  console.log("starting vaultd...");
  spawn(BIN_PATH, [], {
    cwd: process.cwd(),
    detached: true,
    stdio: "ignore",
  }).unref();

  if (!(await waitUntilUp(5000))) {
    throw new Error(`vaultd did not come up at ${VAULTD_URL} within 5s`);
  }
  console.log(`vaultd up at ${VAULTD_URL}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  ensureVaultd().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
