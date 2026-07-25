import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/api-auth";
import {
  getBuildingProjects,
  startBuildingForUser,
  updateBuildingStageForUser,
} from "@/lib/user-data";
import type { BuildStage } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const building = await getBuildingProjects(user.id);
  return NextResponse.json({ building });
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

  const building = await startBuildingForUser(user.id, problemId);
  if (!building) {
    return NextResponse.json({ error: "Failed to start building" }, { status: 500 });
  }

  return NextResponse.json({ building });
}

export async function PATCH(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { problemId, stage } = (await req.json()) as {
    problemId: string;
    stage: BuildStage;
  };

  if (!problemId || !stage) {
    return NextResponse.json({ error: "problemId and stage required" }, { status: 400 });
  }

  const ok = await updateBuildingStageForUser(user.id, problemId, stage);
  if (!ok) {
    return NextResponse.json({ error: "Failed to update stage" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
