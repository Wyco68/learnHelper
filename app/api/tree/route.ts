import { NextResponse } from "next/server";
import { listTree } from "@/lib/vault/helper";

export async function GET() {
  try {
    const tree = await listTree();
    return NextResponse.json(tree);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}
