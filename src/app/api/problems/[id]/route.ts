import { NextResponse } from "next/server";
import { getProblem } from "@/lib/pipeline";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const problem = await getProblem(params.id);
  if (!problem) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ problem });
}
