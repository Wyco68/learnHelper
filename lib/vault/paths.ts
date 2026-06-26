import { promises as fs } from "fs";
import path from "path";

export function vaultRoot(): string {
  return path.join(process.cwd(), "vault");
}

export function userVaultRoot(userId: string): string {
  return path.join(vaultRoot(), userId);
}

export function currentUserId(): string {
  return process.env.DEFAULT_USER_ID || "local-user";
}

// Existing vault/ predates per-user folders (subjects sit directly under
// vault/). New users get vault/<userId>/. If the per-user folder doesn't
// exist yet but the legacy layout does, fall back to vault/ root so the
// pre-existing notes stay visible without a migration step.
export async function resolveUserRoot(userId: string): Promise<string> {
  const perUser = userVaultRoot(userId);
  try {
    await fs.stat(perUser);
    return perUser;
  } catch {
    return vaultRoot();
  }
}
