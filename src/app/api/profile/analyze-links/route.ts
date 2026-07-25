import { NextRequest, NextResponse } from "next/server";
import {
  extractGitHubUsername,
  fetchGitHubUser,
  fetchGitHubRepos,
  buildRepoSummary,
  inferProfileFromRepos,
} from "@/lib/github";
import { extractProfileFromLinks } from "@/lib/project-analysis";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function fetchPageText(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "SealIt/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return "";
    const html = await res.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 5000);
  } catch {
    return "";
  }
}

export async function POST(req: NextRequest) {
  const { links } = (await req.json()) as { links: string[] };
  if (!links || links.length === 0) {
    return NextResponse.json({ error: "links required" }, { status: 400 });
  }

  const validLinks = links.map((l) => l.trim()).filter(Boolean);

  let github_username: string | null = null;
  let linkedin_url: string | null = null;
  let portfolio_url: string | null = null;

  for (const link of validLinks) {
    const username = extractGitHubUsername(link);
    if (username && !github_username) {
      github_username = username;
      continue;
    }
    if (link.includes("linkedin.com") && !linkedin_url) {
      linkedin_url = link;
      continue;
    }
    if (!portfolio_url && !link.includes("github.com") && !link.includes("linkedin.com")) {
      portfolio_url = link;
    }
  }

  const [githubUser, repos, portfolioText] = await Promise.all([
    github_username ? fetchGitHubUser(github_username) : Promise.resolve(null),
    github_username ? fetchGitHubRepos(github_username) : Promise.resolve([]),
    portfolio_url ? fetchPageText(portfolio_url) : Promise.resolve(""),
  ]);

  const repoSummary = repos.length > 0 ? buildRepoSummary(repos) : "";

  const extracted = await extractProfileFromLinks(validLinks, repoSummary, portfolioText);
  let stack = extracted.stack;
  let domains = extracted.domains;
  const { certifications, experience, education } = extracted;

  // Fallback: infer from GitHub repo data when Gemini returns empty
  if (repos.length > 0 && (stack.length === 0 || domains.length === 0)) {
    const inferred = inferProfileFromRepos(repos);
    if (stack.length === 0) stack = inferred.stack;
    if (domains.length === 0) domains = inferred.domains;
  }

  return NextResponse.json({
    stack,
    domains,
    github_username,
    display_name: githubUser?.name ?? null,
    bio: githubUser?.bio ?? null,
    location: githubUser?.location ?? null,
    avatar_url: githubUser?.avatar_url ?? null,
    website: githubUser?.blog ?? null,
    linkedin_url,
    portfolio_url,
    links: validLinks,
    certifications,
    experience,
    education,
  });
}
