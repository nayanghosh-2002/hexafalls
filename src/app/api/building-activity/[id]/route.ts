import { NextResponse } from "next/server";
import { getProblem } from "@/lib/pipeline";
import { fetchBuildingActivity } from "@/lib/building-activity";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const problem = await getProblem(params.id);
  if (!problem) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const startedAt = searchParams.get("startedAt") ?? new Date().toISOString();

  const activity = await fetchBuildingActivity(problem, startedAt);
  return NextResponse.json({ activity, problem });
}
