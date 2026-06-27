import { NextRequest, NextResponse } from "next/server";
import { createFolder } from "@/lib/vault/helper";
import { slugify } from "@/lib/vault/slug";

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "folder name required" }, { status: 400 });
    }
    const folder = slugify(name);
    await createFolder(folder);
    return NextResponse.json({ ok: true, folder });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}
