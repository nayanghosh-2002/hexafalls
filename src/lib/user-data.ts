import { getSupabase } from "./supabase";
import type { BuildStage, OnboardingProfile, ProjectAnalysis, UserProject } from "./types";

export async function refreshProblemBuilderStats(problemId: string): Promise<void> {
  const client = getSupabase();
  if (!client) return;

  const { count: savedCount } = await client
    .from("saved_problems")
    .select("*", { count: "exact", head: true })
    .eq("problem_id", problemId);

  const { count: buildingCount } = await client
    .from("building_projects")
    .select("*", { count: "exact", head: true })
    .eq("problem_id", problemId);

  const building = buildingCount ?? 0;
  const saved = savedCount ?? 0;
  const pct = building > 0 ? Math.min(100, Math.round((building / Math.max(building, saved)) * 100)) : 0;

  await client
    .from("problems")
    .update({ builders_count: building, builders_started_pct: pct })
    .eq("id", problemId);
}

export async function getUserProfile(userId: string): Promise<OnboardingProfile | null> {
  const client = getSupabase();
  if (!client) return null;

  const { data, error } = await client
    .from("user_profiles")
    .select(
      "stack, domains, goal, completed, github_username, display_name, bio, location, avatar_url, website, linkedin_url, portfolio_url, links, certifications, experience, education, age"
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    stack: data.stack ?? [],
    domains: data.domains ?? [],
    goal: data.goal,
    completed: data.completed ?? false,
    github_username: data.github_username ?? undefined,
    display_name: data.display_name ?? undefined,
    bio: data.bio ?? undefined,
    location: data.location ?? undefined,
    avatar_url: data.avatar_url ?? undefined,
    website: data.website ?? undefined,
    linkedin_url: data.linkedin_url ?? undefined,
    portfolio_url: data.portfolio_url ?? undefined,
    links: data.links ?? undefined,
    certifications: data.certifications ?? undefined,
    experience: data.experience ?? undefined,
    education: data.education ?? undefined,
    age: data.age ?? undefined,
  };
}

export async function upsertUserProfile(
  userId: string,
  profile: OnboardingProfile
): Promise<OnboardingProfile | null> {
  const client = getSupabase();
  if (!client) return null;

  const { data, error } = await client
    .from("user_profiles")
    .upsert(
      {
        user_id: userId,
        stack: profile.stack,
        domains: profile.domains,
        goal: profile.goal,
        completed: profile.completed,
        github_username: profile.github_username ?? null,
        display_name: profile.display_name ?? null,
        bio: profile.bio ?? null,
        location: profile.location ?? null,
        avatar_url: profile.avatar_url ?? null,
        website: profile.website ?? null,
        linkedin_url: profile.linkedin_url ?? null,
        portfolio_url: profile.portfolio_url ?? null,
        links: profile.links ?? null,
        certifications: profile.certifications ?? null,
        experience: profile.experience ?? null,
        education: profile.education ?? null,
        age: profile.age ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select(
      "stack, domains, goal, completed, github_username, display_name, bio, location, avatar_url, website, linkedin_url, portfolio_url, links, certifications, experience, education, age"
    )
    .single();

  if (error || !data) return null;

  return {
    stack: data.stack ?? [],
    domains: data.domains ?? [],
    goal: data.goal,
    completed: data.completed ?? false,
    github_username: data.github_username ?? undefined,
    display_name: data.display_name ?? undefined,
    bio: data.bio ?? undefined,
    location: data.location ?? undefined,
    avatar_url: data.avatar_url ?? undefined,
    website: data.website ?? undefined,
    linkedin_url: data.linkedin_url ?? undefined,
    portfolio_url: data.portfolio_url ?? undefined,
    links: data.links ?? undefined,
    certifications: data.certifications ?? undefined,
    experience: data.experience ?? undefined,
    education: data.education ?? undefined,
    age: data.age ?? undefined,
  };
}

export async function getUserProjects(userId: string): Promise<UserProject[]> {
  const client = getSupabase();
  if (!client) return [];

  const { data, error } = await client
    .from("user_projects")
    .select("*")
    .eq("user_id", userId)
    .order("stars", { ascending: false });

  if (error || !data) return [];
  return data as UserProject[];
}

export async function upsertUserProject(
  userId: string,
  project: Omit<UserProject, "id" | "user_id" | "created_at" | "analysis" | "analysis_updated_at">
): Promise<UserProject | null> {
  const client = getSupabase();
  if (!client) return null;

  const { data, error } = await client
    .from("user_projects")
    .upsert(
      { user_id: userId, ...project },
      { onConflict: "user_id,github_username,repo_name" }
    )
    .select()
    .single();

  if (error || !data) {
    console.error("upsertUserProject error:", error);
    return null;
  }
  return data as UserProject;
}

export async function upsertProjectAnalysis(
  userId: string,
  githubUsername: string,
  repoName: string,
  analysis: ProjectAnalysis,
  readmeContent?: string
): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  const { error } = await client
    .from("user_projects")
    .update({
      analysis,
      analysis_updated_at: new Date().toISOString(),
      readme_content: readmeContent ?? null,
    })
    .eq("user_id", userId)
    .eq("github_username", githubUsername)
    .eq("repo_name", repoName);

  return !error;
}

export async function getSavedProblemIds(userId: string): Promise<{ id: string; savedAt: string }[]> {
  const client = getSupabase();
  if (!client) return [];

  const { data, error } = await client
    .from("saved_problems")
    .select("problem_id, saved_at")
    .eq("user_id", userId)
    .order("saved_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.problem_id as string,
    savedAt: row.saved_at as string,
  }));
}

export async function saveProblemForUser(userId: string, problemId: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  const { error } = await client.from("saved_problems").upsert(
    { user_id: userId, problem_id: problemId, saved_at: new Date().toISOString() },
    { onConflict: "user_id,problem_id" }
  );

  if (error) return false;
  await refreshProblemBuilderStats(problemId);
  return true;
}

export async function unsaveProblemForUser(userId: string, problemId: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  const { error } = await client
    .from("saved_problems")
    .delete()
    .eq("user_id", userId)
    .eq("problem_id", problemId);

  if (error) return false;
  await refreshProblemBuilderStats(problemId);
  return true;
}

export async function getBuildingProjects(
  userId: string
): Promise<{ id: string; startedAt: string; stage: BuildStage }[]> {
  const client = getSupabase();
  if (!client) return [];

  const { data, error } = await client
    .from("building_projects")
    .select("problem_id, started_at, stage")
    .eq("user_id", userId)
    .order("started_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.problem_id as string,
    startedAt: row.started_at as string,
    stage: (row.stage as BuildStage) ?? "idea",
  }));
}

export async function startBuildingForUser(
  userId: string,
  problemId: string
): Promise<{ startedAt: string; stage: BuildStage } | null> {
  const client = getSupabase();
  if (!client) return null;

  const existing = await client
    .from("building_projects")
    .select("started_at, stage")
    .eq("user_id", userId)
    .eq("problem_id", problemId)
    .maybeSingle();

  if (existing.data) {
    return {
      startedAt: existing.data.started_at as string,
      stage: (existing.data.stage as BuildStage) ?? "idea",
    };
  }

  const startedAt = new Date().toISOString();
  const { error } = await client.from("building_projects").insert({
    user_id: userId,
    problem_id: problemId,
    stage: "idea",
    started_at: startedAt,
  });

  if (error) return null;

  await saveProblemForUser(userId, problemId);
  await refreshProblemBuilderStats(problemId);

  return { startedAt, stage: "idea" };
}

export async function updateBuildingStageForUser(
  userId: string,
  problemId: string,
  stage: BuildStage
): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  const { error } = await client
    .from("building_projects")
    .update({ stage })
    .eq("user_id", userId)
    .eq("problem_id", problemId);

  return !error;
}

export async function getPlatformStats(): Promise<{
  totalBuilders: number;
  problemCount: number;
  lastUpdated: string | null;
}> {
  const client = getSupabase();
  if (!client) {
    return { totalBuilders: 0, problemCount: 0, lastUpdated: null };
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [{ data: builders }, { count: problemCount }, { data: latest }] = await Promise.all([
    client.from("building_projects").select("user_id"),
    client
      .from("problems")
      .select("*", { count: "exact", head: true })
      .gte("created_at", since),
    client
      .from("problems")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const totalBuilders = new Set((builders ?? []).map((b) => b.user_id)).size;

  return {
    totalBuilders,
    problemCount: problemCount ?? 0,
    lastUpdated: latest?.created_at ?? null,
  };
}
