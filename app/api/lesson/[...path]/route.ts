import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { currentUserId, resolveUserRoot } from "@/lib/vault/paths";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const userRoot = await resolveUserRoot(currentUserId());

  const resolved = path.join(userRoot, ...segments);
  const normalizedRoot = path.resolve(userRoot);
  const normalizedTarget = path.resolve(resolved);

  if (!normalizedTarget.startsWith(normalizedRoot) || !normalizedTarget.endsWith(".md")) {
    return NextResponse.json({ error: "invalid lesson path" }, { status: 400 });
  }

  try {
    const content = await fs.readFile(normalizedTarget, "utf-8");
    return NextResponse.json({ content });
  } catch {
    return NextResponse.json({ error: "lesson not found" }, { status: 404 });
  }
}
