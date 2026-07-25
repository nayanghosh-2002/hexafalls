import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/api-auth";
import { getUserProjects, upsertProjectAnalysis } from "@/lib/user-data";
import { analyzeProject } from "@/lib/project-analysis";
import { fetchReadme } from "@/lib/github";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Params = { params: Promise<{ owner: string; repo: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { owner, repo } = await params;
  const projects = await getUserProjects(user.id);
  const project = projects.find(
    (p) => p.github_username === owner && p.repo_name === repo
  );

  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  return NextResponse.json({ project });
}

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { owner, repo } = await params;
  const projects = await getUserProjects(user.id);
  const project = projects.find(
    (p) => p.github_username === owner && p.repo_name === repo
  );

  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const readme = await fetchReadme(owner, repo);
  const { analysis, error } = await analyzeProject({
    name: project.repo_name,
    description: project.description ?? "",
    language: project.language ?? "",
    topics: project.topics ?? [],
    readme,
  });

  if (!analysis) {
    return NextResponse.json({ error: error ?? "Analysis failed" }, { status: 500 });
  }

  await upsertProjectAnalysis(user.id, owner, repo, analysis, readme);

  return NextResponse.json({ analysis });
}
