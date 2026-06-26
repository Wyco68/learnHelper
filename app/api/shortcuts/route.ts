import { NextResponse } from "next/server";
import { currentUserId, resolveUserRoot } from "@/lib/vault/paths";
import { loadShortcuts } from "@/lib/vault/shortcuts";

export async function GET() {
  const userRoot = await resolveUserRoot(currentUserId());
  const shortcuts = await loadShortcuts(userRoot);
  return NextResponse.json({ shortcuts });
}
