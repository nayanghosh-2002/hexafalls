import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/api-auth";
import {
  getSavedProblemIds,
  saveProblemForUser,
  unsaveProblemForUser,
} from "@/lib/user-data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const saved = await getSavedProblemIds(user.id);
  return NextResponse.json({ saved });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { problemId } = (await req.json()) as { problemId: string };
  if (!problemId) {
    return NextResponse.json({ error: "problemId required" }, { status: 400 });
  }

  const ok = await saveProblemForUser(user.id, problemId);
  if (!ok) {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const problemId = req.nextUrl.searchParams.get("problemId");
  if (!problemId) {
    return NextResponse.json({ error: "problemId required" }, { status: 400 });
  }

  const ok = await unsaveProblemForUser(user.id, problemId);
  if (!ok) {
    return NextResponse.json({ error: "Failed to unsave" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
