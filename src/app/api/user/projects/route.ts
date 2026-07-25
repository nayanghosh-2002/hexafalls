import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/api-auth";
import { getUserProjects, upsertUserProject } from "@/lib/user-data";
import { fetchGitHubRepos } from "@/lib/github";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await getUserProjects(user.id);
  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { github_username } = (await req.json()) as { github_username: string };
  if (!github_username) {
    return NextResponse.json({ error: "github_username required" }, { status: 400 });
  }

  const repos = await fetchGitHubRepos(github_username);
  const projects = await Promise.all(
    repos.slice(0, 50).map((repo) =>
      upsertUserProject(user.id, {
        github_username,
        repo_name: repo.name,
        repo_url: repo.html_url,
        description: repo.description ?? undefined,
        language: repo.language ?? undefined,
        stars: repo.stargazers_count,
        topics: repo.topics ?? [],
      })
    )
  );

  const saved = projects.filter(Boolean);
  return NextResponse.json({ projects: saved, synced: saved.length });
}
