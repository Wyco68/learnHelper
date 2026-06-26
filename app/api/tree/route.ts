import { NextResponse } from "next/server";
import { currentUserId, resolveUserRoot } from "@/lib/vault/paths";
import { buildVaultTree } from "@/lib/vault/tree";

export async function GET() {
  const userRoot = await resolveUserRoot(currentUserId());
  const tree = await buildVaultTree(userRoot);
  return NextResponse.json(tree);
}
